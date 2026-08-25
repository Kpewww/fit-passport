// Fit Refresh — re-rate how garments feel as the body changes over time.
//
//   GET  /api/closet/refresh?collections=<id,id|all>
//        → the ordered list of items to walk through, each with its current
//          rating (the slider's starting position) + a little context.
//
//   POST /api/closet/refresh
//        { itemId, direction, note?, reason? } → record how it sits NOW:
//          updates KnownGoodItem.fitDirection (+ the derived fitRating) AND
//          appends a ComfortCheck row carrying both.
//        { itemId, skip: true }                → no change (no row written).
//
//   The refresh pass reports DIRECTION, not a 1-5 grade, for the same reason the
//   closet does: "it got tighter" and "it got looser" are opposite facts about a
//   body that changed, and a single quality score cannot tell them apart. Writing
//   only the grade here would also leave a stale fitDirection contradicting a
//   fresh fitRating on the same row.

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { DIRECTION_MIN, DIRECTION_MAX, ratingFromDirection } from "@/lib/fitDirection";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  const param = new URL(req.url).searchParams.get("collections") ?? "all";

  const where: { userId: string; collectionId?: { in: string[] } | null } = {
    userId: user.id,
  };
  if (param !== "all") {
    const ids = param.split(",").filter(Boolean);
    where.collectionId = { in: ids };
  }

  const items = await prisma.knownGoodItem.findMany({
    where,
    orderBy: [{ collectionId: "asc" }, { sortIndex: "asc" }],
    select: {
      id: true,
      brand: true,
      category: true,
      gender: true,
      size: true,
      color: true,
      fitRating: true,
      fitDirection: true,
      collectionId: true,
      collection: { select: { name: true } },
    },
  });

  return NextResponse.json({
    items: items.map((it) => ({
      id: it.id,
      brand: it.brand,
      category: it.category,
      gender: it.gender,
      size: it.size,
      color: it.color,
      currentRating: it.fitRating,
      currentDirection: it.fitDirection,
      collectionName: it.collection?.name ?? "Uncategorized",
    })),
  });
}

const PostBody = z.union([
  z.object({
    itemId: z.string().min(1),
    direction: z.coerce.number().int().min(DIRECTION_MIN).max(DIRECTION_MAX),
    note: z.string().max(500).optional().nullable(),
    reason: z.enum(["refresh", "measurement-change", "add"]).optional(),
  }),
  z.object({ itemId: z.string().min(1), skip: z.literal(true) }),
]);

export async function POST(req: Request) {
  const user = await getCurrentUser();
  const parsed = PostBody.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Ownership check.
  const owned = await prisma.knownGoodItem.findFirst({
    where: { id: parsed.data.itemId, userId: user.id },
    select: { id: true },
  });
  if (!owned) return NextResponse.json({ error: "item not found" }, { status: 404 });

  // Skip → nothing recorded.
  if ("skip" in parsed.data) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const { itemId, direction, note, reason } = parsed.data;
  // fitRating is DERIVED, never asked for twice — see lib/fitDirection.ts.
  const rating = ratingFromDirection(direction);
  // Update the item's current state AND append a history row atomically, so the
  // two can never disagree about what was reported when.
  await prisma.$transaction([
    prisma.knownGoodItem.update({
      where: { id: itemId },
      data: { fitRating: rating, fitDirection: direction },
    }),
    prisma.comfortCheck.create({
      data: {
        itemId,
        userId: user.id,
        rating,
        direction,
        note: note ?? null,
        reason: reason ?? "refresh",
      },
    }),
  ]);

  return NextResponse.json({ ok: true, rating, direction });
}
