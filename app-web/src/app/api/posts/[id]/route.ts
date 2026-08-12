// One question thread.
//
//   GET    /api/posts/[id]              → post + ranked answers (public read)
//   PATCH  /api/posts/[id]              → { resolvedAnswerId } — asker only
//   DELETE /api/posts/[id]              → delete your own question

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { rankAnswers } from "@/lib/posts";
import { loadEvidence } from "@/lib/evidence";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();

  const post = await prisma.post.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      kind: true,
      title: true,
      body: true,
      knownGoodId: true,
      productUrl: true,
      resolvedAnswerId: true,
      createdAt: true,
      userId: true,
      user: {
        select: {
          username: true,
          accountCode: true,
          bodyType: true,
          showBodyType: true,
          deactivated: true,
          fitProfile: { select: { avatarDataUrl: true } },
        },
      },
      answers: {
        where: { user: { deactivated: false } },
        select: {
          id: true,
          body: true,
          knownGoodId: true,
          createdAt: true,
          userId: true,
          user: {
            select: {
              username: true,
              accountCode: true,
              bodyType: true,
              showBodyType: true,
              fitProfile: { select: { avatarDataUrl: true } },
            },
          },
          _count: { select: { votes: true } },
          votes: { where: { voterKey: user.id }, select: { id: true } },
        },
      },
    },
  });

  if (!post || post.user.deactivated) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const evidence = await loadEvidence([
    post.knownGoodId,
    ...post.answers.map((a) => a.knownGoodId),
  ]);

  const answers = rankAnswers(
    post.answers.map((a) => ({
      id: a.id,
      body: a.body,
      createdAt: a.createdAt,
      helpfulCount: a._count.votes,
      votedByMe: a.votes.length > 0,
      mine: a.userId === user.id,
      accepted: post.resolvedAnswerId === a.id,
      author: {
        username: a.user.username,
        accountCode: a.user.accountCode,
        avatarDataUrl: a.user.fitProfile?.avatarDataUrl ?? null,
        bodyType: a.user.showBodyType ? a.user.bodyType : null,
      },
      evidence: a.knownGoodId ? (evidence.get(a.knownGoodId) ?? null) : null,
    })),
    post.resolvedAnswerId,
  );

  return NextResponse.json({
    post: {
      id: post.id,
      kind: post.kind,
      title: post.title,
      body: post.body,
      productUrl: post.productUrl,
      createdAt: post.createdAt,
      resolvedAnswerId: post.resolvedAnswerId,
      mine: post.userId === user.id,
      author: {
        username: post.user.username,
        accountCode: post.user.accountCode,
        avatarDataUrl: post.user.fitProfile?.avatarDataUrl ?? null,
        bodyType: post.user.showBodyType ? post.user.bodyType : null,
      },
      evidence: post.knownGoodId ? (evidence.get(post.knownGoodId) ?? null) : null,
    },
    answers,
  });
}

const PatchSchema = z.object({
  // null clears the acceptance — an asker is allowed to change their mind.
  resolvedAnswerId: z.string().nullable(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  const post = await prisma.post.findUnique({
    where: { id: params.id },
    select: { userId: true },
  });
  if (!post) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (post.userId !== user.id) {
    return NextResponse.json({ error: "only the asker can accept an answer" }, { status: 403 });
  }

  const parsed = PatchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad request" }, { status: 400 });

  const { resolvedAnswerId } = parsed.data;
  if (resolvedAnswerId) {
    // Must be an answer on THIS post, or the acceptance would be meaningless.
    const belongs = await prisma.answer.findFirst({
      where: { id: resolvedAnswerId, postId: params.id },
      select: { id: true },
    });
    if (!belongs) return NextResponse.json({ error: "no such answer" }, { status: 400 });
  }

  await prisma.post.update({ where: { id: params.id }, data: { resolvedAnswerId } });
  return NextResponse.json({ resolvedAnswerId });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  // deleteMany scoped by userId = an authorization check that can't be skipped.
  const res = await prisma.post.deleteMany({ where: { id: params.id, userId: user.id } });
  if (res.count === 0) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
