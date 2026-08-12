// Ask & Answer — the question list.
//
//   GET  /api/posts?kind=HELP&unanswered=1&mine=1
//   POST /api/posts   { kind, title, body, knownGoodId?, productUrl? }
//
// Posting requires a CLAIMED account: a question needs someone to answer *to*,
// answers accrue reputation, and both need a durable identity. Reading is open
// to everyone, including unclaimed first-time visitors.

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { parsePostKind, POST_KINDS } from "@/lib/posts";
import { loadEvidence, ownsClosetItem } from "@/lib/evidence";
import { normalizeUrl } from "@/lib/normalizeUrl";
import { clientKey, rateLimit, tooMany } from "@/lib/rateLimit";

const CreateSchema = z.object({
  kind: z.string(),
  title: z.string().trim().min(8, "say a bit more").max(140),
  body: z.string().trim().min(15, "give people something to work with").max(2000),
  knownGoodId: z.string().optional().nullable(),
  productUrl: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v && v.trim() ? normalizeUrl(v) : null)),
});

export async function GET(req: Request) {
  const user = await getCurrentUser();
  const params = new URL(req.url).searchParams;
  const kind = parsePostKind(params.get("kind"));
  const unanswered = params.get("unanswered") === "1";
  const mine = params.get("mine") === "1";

  const posts = await prisma.post.findMany({
    where: {
      // Deactivated authors disappear from every external surface.
      user: { deactivated: false },
      ...(kind ? { kind } : {}),
      ...(mine ? { userId: user.id } : {}),
      ...(unanswered ? { answers: { none: {} } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 60,
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
          fitProfile: { select: { avatarDataUrl: true } },
        },
      },
      _count: { select: { answers: true } },
    },
  });

  const evidence = await loadEvidence(posts.map((p) => p.knownGoodId));

  return NextResponse.json({
    kinds: POST_KINDS,
    posts: posts.map((p) => ({
      id: p.id,
      kind: p.kind,
      title: p.title,
      body: p.body,
      productUrl: p.productUrl,
      createdAt: p.createdAt,
      resolved: !!p.resolvedAnswerId,
      answerCount: p._count.answers,
      mine: p.userId === user.id,
      author: {
        username: p.user.username,
        accountCode: p.user.accountCode,
        avatarDataUrl: p.user.fitProfile?.avatarDataUrl ?? null,
        bodyType: p.user.showBodyType ? p.user.bodyType : null,
      },
      evidence: p.knownGoodId ? (evidence.get(p.knownGoodId) ?? null) : null,
    })),
  });
}

export async function POST(req: Request) {
  // Posting is the abuse surface here, so it's the tighter limit.
  const rl = rateLimit(clientKey(req, "post-create"), 10, 10 * 60_000);
  if (!rl.ok) return tooMany(rl.retryAfterSec);

  const user = await getCurrentUser();
  if (!user.claimed) {
    return NextResponse.json(
      { error: "claim-required", message: "Claim an account to ask the community." },
      { status: 403 },
    );
  }

  const parsed = CreateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const kind = parsePostKind(parsed.data.kind);
  if (!kind) return NextResponse.json({ error: "unknown post kind" }, { status: 400 });

  // You may only attach your OWN garment — otherwise "evidence" is hearsay.
  const knownGoodId = parsed.data.knownGoodId || null;
  if (knownGoodId && !(await ownsClosetItem(knownGoodId, user.id))) {
    return NextResponse.json({ error: "that item isn't in your closet" }, { status: 400 });
  }

  const post = await prisma.post.create({
    data: {
      userId: user.id,
      kind,
      title: parsed.data.title,
      body: parsed.data.body,
      knownGoodId,
      productUrl: parsed.data.productUrl,
    },
    select: { id: true },
  });

  return NextResponse.json({ id: post.id });
}
