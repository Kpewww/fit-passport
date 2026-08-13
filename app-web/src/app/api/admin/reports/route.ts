// GET  /api/admin/reports    → the moderation review queue
// POST /api/admin/reports    → { kind, targetId, action: hide|unhide|delete }
//
// Admin-only (see lib/admin.ts). This is the review queue that auto-hiding was
// only ever a stopgap for: it shows what was reported, why, how many distinct
// people reported it, and the content itself, so a human can decide instead of a
// threshold deciding.

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { currentAdmin, notAdmin } from "@/lib/admin";
import { parseReportKind, REPORT_HIDE_THRESHOLD } from "@/lib/reports";

type Kind = "POST" | "ANSWER" | "OUTFIT";

// Explicit branches rather than `prisma[model]`: a union of Prisma delegates has
// incompatible call signatures, so TypeScript (correctly) refuses to call it.
async function exists(kind: Kind, id: string): Promise<boolean> {
  const where = { id };
  const select = { id: true } as const;
  if (kind === "POST") return !!(await prisma.post.findUnique({ where, select }));
  if (kind === "ANSWER") return !!(await prisma.answer.findUnique({ where, select }));
  return !!(await prisma.outfit.findUnique({ where, select }));
}

async function setHidden(kind: Kind, id: string, hidden: boolean) {
  if (kind === "POST") await prisma.post.update({ where: { id }, data: { hidden } });
  else if (kind === "ANSWER") await prisma.answer.update({ where: { id }, data: { hidden } });
  else await prisma.outfit.update({ where: { id }, data: { hidden } });
}

async function removeTarget(kind: Kind, id: string) {
  if (kind === "POST") await prisma.post.delete({ where: { id } });
  else if (kind === "ANSWER") await prisma.answer.delete({ where: { id } });
  else await prisma.outfit.delete({ where: { id } });
}

export async function GET() {
  const admin = await currentAdmin();
  if (!admin) return notAdmin();

  const reports = await prisma.report.findMany({
    orderBy: { createdAt: "desc" },
    take: 300,
    select: { kind: true, targetId: true, reason: true, note: true, createdAt: true },
  });

  // Group by target: one badly-behaved item is one row to decide about, not five.
  const groups = new Map<
    string,
    { kind: Kind; targetId: string; count: number; reasons: string[]; notes: string[]; latest: Date }
  >();
  for (const r of reports) {
    const kind = parseReportKind(r.kind);
    if (!kind) continue;
    const key = `${kind}:${r.targetId}`;
    const g = groups.get(key) ?? {
      kind,
      targetId: r.targetId,
      count: 0,
      reasons: [] as string[],
      notes: [] as string[],
      latest: r.createdAt,
    };
    g.count += 1;
    if (!g.reasons.includes(r.reason)) g.reasons.push(r.reason);
    if (r.note) g.notes.push(r.note);
    if (r.createdAt > g.latest) g.latest = r.createdAt;
    groups.set(key, g);
  }

  const items = await Promise.all(
    [...groups.values()]
      .sort((a, b) => b.count - a.count || b.latest.getTime() - a.latest.getTime())
      .map(async (g) => {
        const row = await loadTarget(g.kind, g.targetId);
        return { ...g, latest: g.latest.toISOString(), target: row };
      }),
  );

  return NextResponse.json({
    admin: { username: admin.username },
    threshold: REPORT_HIDE_THRESHOLD,
    // Reports whose target has since been deleted are dropped from the queue.
    items: items.filter((i) => i.target),
  });
}

const ActionSchema = z.object({
  kind: z.string(),
  targetId: z.string().min(1),
  action: z.enum(["hide", "unhide", "delete"]),
});

export async function POST(req: Request) {
  const admin = await currentAdmin();
  if (!admin) return notAdmin();

  const parsed = ActionSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad request" }, { status: 400 });
  const kind = parseReportKind(parsed.data.kind);
  if (!kind) return NextResponse.json({ error: "unknown kind" }, { status: 400 });
  const { targetId, action } = parsed.data;

  if (!(await exists(kind, targetId))) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  if (action === "delete") {
    // An accepted answer is referenced by its post; clear that first or the post
    // points at a row that no longer exists.
    if (kind === "ANSWER") {
      await prisma.post.updateMany({
        where: { resolvedAnswerId: targetId },
        data: { resolvedAnswerId: null },
      });
    }
    await prisma.report.deleteMany({ where: { kind, targetId } });
    await removeTarget(kind, targetId);
    return NextResponse.json({ ok: true, deleted: true });
  }

  const hidden = action === "hide";
  await setHidden(kind, targetId, hidden);
  // Clearing the reports on restore is deliberate: leaving them would let the
  // same three reports re-hide the item the moment one more arrives.
  if (!hidden) await prisma.report.deleteMany({ where: { kind, targetId } });
  return NextResponse.json({ ok: true, hidden });
}

/** A safe preview of the reported content, with its author. */
async function loadTarget(kind: Kind, id: string) {
  const author = {
    select: { username: true, accountCode: true, memberNo: true, deactivated: true },
  };
  if (kind === "POST") {
    const row = await prisma.post.findUnique({
      where: { id },
      select: { id: true, title: true, body: true, hidden: true, createdAt: true, user: author },
    });
    return row && { ...row, label: row.title, text: row.body };
  }
  if (kind === "ANSWER") {
    const row = await prisma.answer.findUnique({
      where: { id },
      select: { id: true, body: true, hidden: true, createdAt: true, postId: true, user: author },
    });
    return row && { ...row, label: `Answer on ${row.postId}`, text: row.body };
  }
  const row = await prisma.outfit.findUnique({
    where: { id },
    select: { id: true, title: true, description: true, hidden: true, createdAt: true, user: author },
  });
  return row && { ...row, label: row.title, text: row.description ?? "" };
}
