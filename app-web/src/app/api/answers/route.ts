// Answers to a question.
//
//   POST   /api/answers          { postId, body, knownGoodId? }
//   DELETE /api/answers?id=...   → delete your own answer
//
// Answering requires a claimed account — answers earn the Counsel badge track,
// so they need an identity the reputation can attach to.

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { ownsClosetItem } from "@/lib/evidence";
import { clientKey, rateLimit, tooMany } from "@/lib/rateLimit";

const CreateSchema = z.object({
  postId: z.string().min(1),
  body: z.string().trim().min(10, "an answer needs a sentence").max(2000),
  knownGoodId: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  const rl = rateLimit(clientKey(req, "answer-create"), 20, 10 * 60_000);
  if (!rl.ok) return tooMany(rl.retryAfterSec);

  const user = await getCurrentUser();
  if (!user.claimed) {
    return NextResponse.json(
      { error: "claim-required", message: "Claim an account to answer." },
      { status: 403 },
    );
  }

  const parsed = CreateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const post = await prisma.post.findUnique({
    where: { id: parsed.data.postId },
    select: { id: true, user: { select: { deactivated: true } } },
  });
  if (!post || post.user.deactivated) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const knownGoodId = parsed.data.knownGoodId || null;
  if (knownGoodId && !(await ownsClosetItem(knownGoodId, user.id))) {
    return NextResponse.json({ error: "that item isn't in your closet" }, { status: 400 });
  }

  const answer = await prisma.answer.create({
    data: { postId: post.id, userId: user.id, body: parsed.data.body, knownGoodId },
    select: { id: true },
  });

  return NextResponse.json({ id: answer.id });
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  // Authorize FIRST. Clearing the acceptance before checking ownership would let
  // anyone un-accept someone else's answer just by asking to delete it.
  const owned = await prisma.answer.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  });
  if (!owned) return NextResponse.json({ error: "not found" }, { status: 404 });

  // If this answer was the accepted one, the post goes back to unresolved —
  // otherwise it would point at a row that no longer exists.
  await prisma.post.updateMany({
    where: { resolvedAnswerId: id },
    data: { resolvedAnswerId: null },
  });
  await prisma.answer.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
