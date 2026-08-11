// Fit Refresh — re-rate how garments feel as the body changes over time.
//
//   GET  /api/closet/refresh?collections=<id,id|all>
//        → the ordered list of items to walk through, each with its current
//          rating (the slider's starting position) + a little context.
//
//   POST /api/closet/refresh
//        { itemId, rating, note?, reason? }   → record a new comfort rating:
//          updates KnownGoodItem.fitRating AND appends a ComfortCheck row.
//        { itemId, skip: true }                → no change (no row written).

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

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
      collectionName: it.collection?.name ?? "Uncategorized",
    })),
  });
}

const PostBody = z.union([
  z.object({
    itemId: z.string().min(1),
    rating: z.coerce.number().int().min(1).max(5),
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

  const { itemId, rating, note, reason } = parsed.data;
  // Update the item's current rating AND append a history row atomically.
  await prisma.$transaction([
    prisma.knownGoodItem.update({
      where: { id: itemId },
      data: { fitRating: rating },
    }),
    prisma.comfortCheck.create({
      data: {
        itemId,
        userId: user.id,
        rating,
        note: note ?? null,
        reason: reason ?? "refresh",
      },
    }),
  ]);

  return NextResponse.json({ ok: true, rating });
}
