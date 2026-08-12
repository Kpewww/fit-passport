// Outfits — community look posts.
//
//   GET  /api/outfits?mine=1        → your outfits (with like counts)
//   GET  /api/outfits               → public feed (all outfits, most-liked first)
//   GET  /api/outfits?scope=following → only people you follow, newest first
//   POST /api/outfits               → create { title, description?, occasion?,
//                                       onlineAvailable?, items: [{brand?,category,
//                                       color?,size?,note?,onlineAvailable?}] }
//   DELETE /api/outfits?id=...       → delete your own outfit

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser, canEdit } from "@/lib/session";
import { parseFeedScope, rankFeed } from "@/lib/feed";

const ItemSchema = z.object({
  knownGoodId: z.string().optional().nullable(),
  brand: z.string().max(80).optional().nullable(),
  category: z.string().min(1).max(40),
  color: z.string().max(40).optional().nullable(),
  size: z.string().max(20).optional().nullable(),
  note: z.string().max(200).optional().nullable(),
  onlineAvailable: z.boolean().optional(),
});

const CreateSchema = z.object({
  title: z.string().min(1).max(80),
  description: z.string().max(500).optional().nullable(),
  occasion: z.string().max(40).optional().nullable(),
  onlineAvailable: z.boolean().optional(),
  items: z.array(ItemSchema).min(1).max(12),
});

export async function GET(req: Request) {
  const user = await getCurrentUser();
  const params = new URL(req.url).searchParams;
  const mine = params.get("mine") === "1";
  const scope = parseFeedScope(params.get("scope"));

  // A followed feed is restricted to the authors this user picked. Unclaimed
  // sessions can't follow anyone, so their followee list is simply empty and
  // the UI shows the "claim an account" prompt instead of a silent empty feed.
  let followeeIds: string[] | null = null;
  if (!mine && scope === "following") {
    const follows = await prisma.follow.findMany({
      where: { followerId: user.id, followee: { deactivated: false } },
      select: { followeeId: true },
    });
    followeeIds = follows.map((f) => f.followeeId);
  }

  const outfits = await prisma.outfit.findMany({
    where: mine
      ? { userId: user.id }
      : followeeIds
        ? { userId: { in: followeeIds } }
        : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      items: { orderBy: { sortIndex: "asc" } },
      _count: { select: { likes: true } },
      user: { select: { username: true, accountCode: true, fitProfile: { select: { avatarDataUrl: true } } } },
      likes: { where: { voterKey: user.id }, select: { id: true } },
    },
  });

  const entries = outfits.map((o) => ({
    id: o.id,
    title: o.title,
    description: o.description,
    occasion: o.occasion,
    onlineAvailable: o.onlineAvailable,
    createdAt: o.createdAt,
    likeCount: o._count.likes,
    likedByMe: o.likes.length > 0,
    mine: o.userId === user.id,
    author: {
      username: o.user.username,
      accountCode: o.user.accountCode,
      avatarDataUrl: o.user.fitProfile?.avatarDataUrl ?? null,
    },
    items: o.items.map((it) => ({
      id: it.id,
      brand: it.brand,
      category: it.category,
      color: it.color,
      size: it.size,
      note: it.note,
      onlineAvailable: it.onlineAvailable,
    })),
  }));

  // "mine" keeps the query's chronological order. The two public scopes are
  // ordered differently on purpose — see lib/feed.ts.
  const ordered = mine ? entries : rankFeed(entries, scope);

  return NextResponse.json({ outfits: ordered, scope: mine ? "mine" : scope });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!canEdit()) {
    return NextResponse.json({ error: "read-only — password required" }, { status: 403 });
  }
  const parsed = CreateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { title, description, occasion, onlineAvailable, items } = parsed.data;

  const outfit = await prisma.outfit.create({
    data: {
      userId: user.id,
      title,
      description: description ?? null,
      occasion: occasion ?? null,
      onlineAvailable: onlineAvailable ?? true,
      items: {
        create: items.map((it, i) => ({
          knownGoodId: it.knownGoodId ?? null,
          brand: it.brand ?? null,
          category: it.category,
          color: it.color ?? null,
          size: it.size ?? null,
          note: it.note ?? null,
          onlineAvailable: it.onlineAvailable ?? true,
          sortIndex: i,
        })),
      },
    },
    include: { items: true },
  });

  return NextResponse.json({ outfit });
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prisma.outfit.deleteMany({ where: { id, userId: user.id } });
  return NextResponse.json({ ok: true });
}
