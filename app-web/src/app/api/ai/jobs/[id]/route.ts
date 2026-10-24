// GET    /api/ai/jobs/<id> → the job, finished if the provider is done (Session 104)
// DELETE /api/ai/jobs/<id> → its picture deleted (the spend record stays)

import { NextResponse } from "next/server";
import { aiUser, refusal } from "@/lib/aiMedia/http";
import { deleteJob, refreshJob } from "@/lib/aiMedia/service";

export const maxDuration = 60;

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await aiUser();
  if (user instanceof NextResponse) return user;
  const job = await refreshJob(user.id, (await params).id);
  if (!job) return refusal("not-found");
  return NextResponse.json({ job });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await aiUser();
  if (user instanceof NextResponse) return user;
  if (!(await deleteJob(user.id, (await params).id))) return refusal("not-found");
  return NextResponse.json({ ok: true });
}
