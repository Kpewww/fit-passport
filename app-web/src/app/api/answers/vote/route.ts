// POST /api/answers/vote  { answerId, helpful: boolean }
//
// "Helpful" votes on answers. Same anonymous-friendly shape as outfit likes:
// keyed by the session id and deduped by unique(answerId, voterKey), so a
// first-time visitor who got a genuinely useful answer can still say so.
// You can't vote for your own answer.

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

const Body = z.object({
  answerId: z.string().min(1),
  helpful: z.boolean(),
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  const { answerId, helpful } = parsed.data;

  const answer = await prisma.answer.findUnique({
    where: { id: answerId },
    select: { id: true, userId: true },
  });
  if (!answer) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (answer.userId === user.id) {
    return NextResponse.json({ error: "you can't vote for your own answer" }, { status: 400 });
  }

  if (helpful) {
    await prisma.answerVote
      .create({
        data: { answerId, voterKey: user.id, userId: user.claimed ? user.id : null },
      })
      .catch(() => {}); // already voted → idempotent
  } else {
    await prisma.answerVote.deleteMany({ where: { answerId, voterKey: user.id } });
  }

  const helpfulCount = await prisma.answerVote.count({ where: { answerId } });
  return NextResponse.json({ helpfulCount, votedByMe: helpful });
}
