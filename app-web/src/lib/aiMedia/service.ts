// AI photo jobs, end to end (Session 104): ask, check the limits, send, keep the
// result privately, and delete on request. Nothing here feeds the size engine: a
// cut-out or a try-on picture is never a measurement (docs/plans phase 4 boundary).

import { prisma } from "../db";
import { dropPhotos, storePhoto } from "../photoStore";
import { domainForCategory } from "../sizeSystems";
import { track } from "../events";
import { canSpend, type SpendCheck } from "./budget";
import { COST_USD, providerFor, type AiKind } from "./config";
import { hasConsent } from "./consent";
import { resultToDataUrl, storedToDataUrl } from "./images";
import { removeBackground } from "./providers/bria";
import { pollTryon, startTryon, tryonCategory } from "./providers/fashn";

export type JobRefusal = "consent" | "not-found" | "no-photo" | Exclude<SpendCheck, { ok: true }>["reason"];
export type JobResult<T> = { ok: true; value: T } | { ok: false; reason: JobRefusal | "failed"; detail?: string };

/** A try-on still running after this long is given up (FASHN's own limit is far shorter). */
const TRYON_TIMEOUT_MS = 10 * 60_000;

async function gate(userId: string, kind: AiKind): Promise<JobResult<null>> {
  if (!(await hasConsent(userId, kind))) return { ok: false, reason: "consent" };
  const spend = await canSpend(userId, kind);
  if (!spend.ok) return { ok: false, reason: spend.reason };
  return { ok: true, value: null };
}

const failJob = (id: string, error: string) =>
  prisma.mediaJob.update({ where: { id }, data: { status: "failed", costUsd: 0, error: error.slice(0, 200) } });

/** Remove a closet photo's background. The original photo is never changed. */
export async function runCutout(userId: string, itemId: string): Promise<JobResult<{ cutoutPhoto: string }>> {
  const item = await prisma.knownGoodItem.findFirst({ where: { id: itemId, userId }, select: { id: true, imageDataUrl: true, cutoutPhoto: true } });
  if (!item) return { ok: false, reason: "not-found" };
  const source = await storedToDataUrl(item.imageDataUrl);
  if (!source) return { ok: false, reason: "no-photo" };
  const g = await gate(userId, "cutout");
  if (!g.ok) return g;

  const job = await prisma.mediaJob.create({ data: { userId, kind: "cutout", status: "running", provider: providerFor.cutout, itemId, costUsd: COST_USD.cutout } });
  try {
    const stored = await storePhoto(userId, await resultToDataUrl(await removeBackground(source)));
    await prisma.$transaction([
      prisma.knownGoodItem.update({ where: { id: itemId }, data: { cutoutPhoto: stored, photoView: "cutout" } }),
      prisma.mediaJob.update({ where: { id: job.id }, data: { status: "done" } }),
    ]);
    if (item.cutoutPhoto) await dropPhotos([item.cutoutPhoto]); // a redo replaces the old cut-out
    void track("ai-job", { userId, detail: "cutout:done" });
    return { ok: true, value: { cutoutPhoto: stored } };
  } catch (e) {
    await failJob(job.id, (e as Error).message);
    void track("ai-job", { userId, detail: "cutout:failed" });
    return { ok: false, reason: "failed", detail: (e as Error).message };
  }
}

/** Back to the original photo: the cut-out is deleted, here and in the store. */
export async function removeCutout(userId: string, itemId: string): Promise<boolean> {
  const item = await prisma.knownGoodItem.findFirst({ where: { id: itemId, userId }, select: { cutoutPhoto: true } });
  if (!item) return false;
  await prisma.knownGoodItem.update({ where: { id: itemId }, data: { cutoutPhoto: null, photoView: null } });
  await dropPhotos([item.cutoutPhoto]);
  return true;
}

/** Start a try-on of a closet piece on the person's own photo. Returns the job id. */
export async function startTryonJob(userId: string, aiPhotoId: string, itemId: string): Promise<JobResult<{ jobId: string }>> {
  const [person, item] = await Promise.all([
    prisma.aiPhoto.findFirst({ where: { id: aiPhotoId, userId }, select: { photo: true } }),
    prisma.knownGoodItem.findFirst({ where: { id: itemId, userId }, select: { category: true, imageDataUrl: true, cutoutPhoto: true } }),
  ]);
  if (!person || !item) return { ok: false, reason: "not-found" };
  const personDataUrl = await storedToDataUrl(person.photo);
  // The cut-out reads more cleanly as a garment; the original works too.
  const garmentDataUrl = (await storedToDataUrl(item.cutoutPhoto)) ?? (await storedToDataUrl(item.imageDataUrl));
  if (!personDataUrl || !garmentDataUrl) return { ok: false, reason: "no-photo" };
  const g = await gate(userId, "tryon");
  if (!g.ok) return g;

  const job = await prisma.mediaJob.create({ data: { userId, kind: "tryon", status: "running", provider: providerFor.tryon, itemId, aiPhotoId, costUsd: COST_USD.tryon } });
  try {
    const providerJobId = await startTryon({ personDataUrl, garmentDataUrl, category: tryonCategory(domainForCategory(item.category)) });
    await prisma.mediaJob.update({ where: { id: job.id }, data: { providerJobId } });
    return { ok: true, value: { jobId: job.id } };
  } catch (e) {
    await failJob(job.id, (e as Error).message);
    void track("ai-job", { userId, detail: "tryon:failed" });
    return { ok: false, reason: "failed", detail: (e as Error).message };
  }
}

export type JobView = { id: string; kind: string; status: string; itemId: string | null; aiPhotoId: string | null; hasResult: boolean; error: string | null; createdAt: Date };

const view = (j: { id: string; kind: string; status: string; itemId: string | null; aiPhotoId: string | null; result: string | null; error: string | null; createdAt: Date }): JobView => ({
  id: j.id, kind: j.kind, status: j.status, itemId: j.itemId, aiPhotoId: j.aiPhotoId, hasResult: !!j.result, error: j.error, createdAt: j.createdAt,
});

/** A job's current state; a running try-on is asked once more and finished if ready. */
export async function refreshJob(userId: string, jobId: string): Promise<JobView | null> {
  const job = await prisma.mediaJob.findFirst({ where: { id: jobId, userId } });
  if (!job) return null;
  if (job.status !== "running" || job.kind !== "tryon" || !job.providerJobId) return view(job);
  if (Date.now() - job.createdAt.getTime() > TRYON_TIMEOUT_MS) return view(await failJob(job.id, "timed out"));
  try {
    const state = await pollTryon(job.providerJobId);
    if (state.status === "running") return view(job);
    if (state.status === "failed") {
      void track("ai-job", { userId, detail: "tryon:failed" });
      return view(await failJob(job.id, state.error));
    }
    const stored = await storePhoto(userId, await resultToDataUrl(state.output));
    void track("ai-job", { userId, detail: "tryon:done" });
    return view(await prisma.mediaJob.update({ where: { id: job.id }, data: { status: "done", result: stored } }));
  } catch {
    return view(job); // a status hiccup: ask again next time
  }
}

export async function listJobs(userId: string, kind: AiKind): Promise<JobView[]> {
  const jobs = await prisma.mediaJob.findMany({ where: { userId, kind }, orderBy: { createdAt: "desc" }, take: 30 });
  return jobs.map(view);
}

export async function deleteJob(userId: string, jobId: string): Promise<boolean> {
  const job = await prisma.mediaJob.findFirst({ where: { id: jobId, userId }, select: { result: true } });
  if (!job) return false;
  // The picture goes; the row stays as a spend record (what was billed is not refunded by deleting).
  await prisma.mediaJob.update({ where: { id: jobId }, data: { result: null } });
  await dropPhotos([job.result]);
  return true;
}

/** Everything AI-made or AI-bound for this person: body photos, results, cut-outs. Spend records stay, without pictures. */
export async function deleteAllAiPhotos(userId: string): Promise<number> {
  const [photos, jobs, items] = await Promise.all([
    prisma.aiPhoto.findMany({ where: { userId }, select: { photo: true } }),
    prisma.mediaJob.findMany({ where: { userId, result: { not: null } }, select: { result: true } }),
    prisma.knownGoodItem.findMany({ where: { userId, cutoutPhoto: { not: null } }, select: { cutoutPhoto: true } }),
  ]);
  await prisma.$transaction([
    prisma.aiPhoto.deleteMany({ where: { userId } }),
    prisma.mediaJob.updateMany({ where: { userId }, data: { result: null } }),
    prisma.knownGoodItem.updateMany({ where: { userId }, data: { cutoutPhoto: null, photoView: null } }),
  ]);
  const refs = [...photos.map((p) => p.photo), ...jobs.map((j) => j.result), ...items.map((i) => i.cutoutPhoto)];
  await dropPhotos(refs);
  return refs.length;
}
