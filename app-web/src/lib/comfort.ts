// How a garment feels now, recorded once (Session 104).
//
// Fit Refresh (/api/closet/refresh) and the wear calendar (/api/wear) both ask "how
// does it fit?". Both must write the same thing: the item's current direction (and
// the 1–5 rating derived from it, lib/fitDirection.ts) AND a ComfortCheck history
// row, in one transaction so the two never disagree. This is that one writer.

import { prisma } from "./db";
import { clampDirection, ratingFromDirection } from "./fitDirection";

/** Why a check was recorded. "worn" = answered while logging a day's outfit. */
export type ComfortReason = "refresh" | "measurement-change" | "add" | "worn";

/**
 * Record how an item the user owns sits now. Returns null when the item is not
 * theirs (nothing is written).
 */
export async function recordComfort(
  userId: string,
  itemId: string,
  direction: number,
  reason: ComfortReason,
  note?: string | null,
): Promise<{ rating: number; direction: number } | null> {
  const owned = await prisma.knownGoodItem.findFirst({ where: { id: itemId, userId }, select: { id: true } });
  if (!owned) return null;
  const d = clampDirection(direction);
  const rating = ratingFromDirection(d);
  await prisma.$transaction([
    prisma.knownGoodItem.update({ where: { id: itemId }, data: { fitRating: rating, fitDirection: d } }),
    prisma.comfortCheck.create({ data: { itemId, userId, rating, direction: d, note: note ?? null, reason } }),
  ]);
  return { rating, direction: d };
}
