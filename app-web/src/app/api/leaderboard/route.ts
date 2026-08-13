// GET /api/leaderboard?window=today|week
//
// Daily Top Outfits + Top Stylists (ecosystem step 3). Everything is counted
// INSIDE the window, so the board genuinely resets and a newcomer can win today.
// Ordering and weights live in lib/leaderboard.ts where they're unit-tested.
//
// Who can appear: claimed, non-deactivated members. This is not gated on
// `listedInCommunity` — that flag governs the public CLOSET directory, while
// posting a look or an answer is already a public act shown in the feed. Nothing
// here exposes anything a feed row doesn't.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  parseLeaderWindow,
  rankStylists,
  rankTopLooks,
  windowStart,
  WINDOW_LABEL,
} from "@/lib/leaderboard";

export async function GET(req: Request) {
  const w = parseLeaderWindow(new URL(req.url).searchParams.get("window"));
  const since = windowStart(w, Date.now());

  // --- likes cast inside the window, with the look they landed on ---
  const windowLikes = await prisma.outfitLike.findMany({
    // Taken-down looks earn nothing: excluded from the board outright, unlike
    // the feed where the author can still see their own.
    where: {
      createdAt: { gte: since },
      outfit: { hidden: false, user: { deactivated: false } },
    },
    select: { outfitId: true, outfit: { select: { userId: true } } },
  });

  // --- helpful votes cast inside the window, with the answer's author ---
  const windowVotes = await prisma.answerVote.findMany({
    where: {
      createdAt: { gte: since },
      answer: { hidden: false, user: { deactivated: false } },
    },
    select: { answer: { select: { userId: true } } },
  });

  // Tally in JS rather than groupBy: we need to attribute a like to the OUTFIT'S
  // AUTHOR, which isn't a scalar on OutfitLike. Volumes are small at this stage;
  // if the feed grows, this becomes a cached daily rollup (see the doc's
  // `Leaderboard` sketch — derived, never stored as truth).
  const likesByOutfit = new Map<string, number>();
  const likesByAuthor = new Map<string, number>();
  for (const l of windowLikes) {
    likesByOutfit.set(l.outfitId, (likesByOutfit.get(l.outfitId) ?? 0) + 1);
    likesByAuthor.set(l.outfit.userId, (likesByAuthor.get(l.outfit.userId) ?? 0) + 1);
  }
  const helpfulByAuthor = new Map<string, number>();
  for (const v of windowVotes) {
    helpfulByAuthor.set(v.answer.userId, (helpfulByAuthor.get(v.answer.userId) ?? 0) + 1);
  }

  // ---------- Top looks ----------
  const outfitIds = [...likesByOutfit.keys()];
  const outfits = outfitIds.length
    ? await prisma.outfit.findMany({
        where: { id: { in: outfitIds }, hidden: false },
        select: {
          id: true,
          title: true,
          occasion: true,
          createdAt: true,
          _count: { select: { likes: true } },
          items: { orderBy: { sortIndex: "asc" }, select: { category: true, color: true } },
          user: {
            select: {
              username: true,
              accountCode: true,
              bodyType: true,
              showBodyType: true,
              fitProfile: { select: { avatarDataUrl: true } },
            },
          },
        },
      })
    : [];

  const topLooks = rankTopLooks(
    outfits.map((o) => ({
      id: o.id,
      title: o.title,
      occasion: o.occasion,
      createdAt: o.createdAt,
      likesInWindow: likesByOutfit.get(o.id) ?? 0,
      likeCount: o._count.likes,
      layers: o.items.map((it) => ({ category: it.category, color: it.color })),
      author: {
        username: o.user.username,
        accountCode: o.user.accountCode,
        avatarDataUrl: o.user.fitProfile?.avatarDataUrl ?? null,
        bodyType: o.user.showBodyType ? o.user.bodyType : null,
      },
    })),
  ).slice(0, 3);

  // ---------- Top stylists ----------
  const stylistIds = [...new Set([...likesByAuthor.keys(), ...helpfulByAuthor.keys()])];
  const stylistUsers = stylistIds.length
    ? await prisma.user.findMany({
        where: { id: { in: stylistIds }, claimed: true, deactivated: false },
        select: {
          id: true,
          username: true,
          accountCode: true,
          cardMetal: true,
          fitProfile: { select: { avatarDataUrl: true } },
        },
      })
    : [];

  const topStylists = rankStylists(
    stylistUsers.map((u) => ({
      username: u.username,
      accountCode: u.accountCode,
      avatarDataUrl: u.fitProfile?.avatarDataUrl ?? null,
      cardMetal: u.cardMetal,
      likes: likesByAuthor.get(u.id) ?? 0,
      helpful: helpfulByAuthor.get(u.id) ?? 0,
    })),
  ).slice(0, 5);

  return NextResponse.json({
    window: w,
    windowLabel: WINDOW_LABEL[w],
    since: since.toISOString(),
    topLooks,
    topStylists,
  });
}
