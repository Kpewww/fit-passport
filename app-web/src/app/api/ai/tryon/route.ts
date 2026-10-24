// POST /api/ai/tryon { aiPhotoId, itemId } → { jobId }   start a try-on (FASHN)
// GET  /api/ai/tryon                                      → the person's try-on jobs
// (Session 104). A try-on picture is a preview of looks, never a size answer.

import { NextResponse } from "next/server";
import { z } from "zod";
import { clientKey, rateLimit, tooMany } from "@/lib/rateLimit";
import { aiUser, refusal } from "@/lib/aiMedia/http";
import { listJobs, startTryonJob } from "@/lib/aiMedia/service";

export const maxDuration = 60;

export async function GET() {
  const user = await aiUser();
  if (user instanceof NextResponse) return user;
  return NextResponse.json({ jobs: await listJobs(user.id, "tryon") });
}

export async function POST(req: Request) {
  const rl = await rateLimit(clientKey(req, "ai-job"), 30, 10 * 60_000);
  if (!rl.ok) return tooMany(rl.retryAfterSec, req);
  const user = await aiUser();
  if (user instanceof NextResponse) return user;
  const parsed = z.object({ aiPhotoId: z.string().min(1).max(40), itemId: z.string().min(1).max(40) }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "aiPhotoId and itemId required" }, { status: 400 });
  const r = await startTryonJob(user.id, parsed.data.aiPhotoId, parsed.data.itemId);
  if (!r.ok) return refusal(r.reason);
  return NextResponse.json({ jobId: r.value.jobId });
}
