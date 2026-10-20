// What an unclaimed account in this browser holds, offered on login (Session 100).
// The fold itself is accountMerge.ts foldAccount: things move into the claimed
// account and nothing there is overwritten (invariant 95).

import { prisma } from "./db";

export const FOLD_COOKIE = "fp_fold";

export type Holdings = { pieces: number; saved: number; checks: number; outfits: number };

export async function holdings(userId: string): Promise<Holdings> {
  const [pieces, saved, checks, outfits] = await Promise.all([
    prisma.knownGoodItem.count({ where: { userId } }),
    prisma.savedItem.count({ where: { userId } }),
    prisma.product.count({ where: { userId } }),
    prisma.outfit.count({ where: { userId } }),
  ]);
  return { pieces, saved, checks, outfits };
}

export const holdsAnything = (h: Holdings) => h.pieces + h.saved + h.checks + h.outfits > 0;
