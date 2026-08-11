// Server-side helper to gather a user's real BadgeStats from the DB. Kept in one
// place so /api/status, /api/view/[code], and the community listing all compute
// badges from the same source of truth.

import { prisma } from "./db";
import type { BadgeStats } from "./badges";

export async function computeBadgeStats(userId: string, communityListed: boolean): Promise<BadgeStats> {
  const [items, outcomeCount, refreshCount] = await Promise.all([
    prisma.knownGoodItem.findMany({
      where: { userId },
      select: { brand: true, collectionId: true },
    }),
    prisma.fitOutcome.count({ where: { userId } }),
    prisma.comfortCheck.count({ where: { userId } }),
  ]);

  const brands = new Set(items.map((i) => i.brand.toLowerCase()));
  const collections = new Set(items.map((i) => i.collectionId).filter(Boolean));

  return {
    closetCount: items.length,
    outcomeCount,
    collectionsUsed: collections.size,
    refreshCount,
    brandsCount: brands.size,
    communityListed,
    outfitPosts: 0, // staged feature
    outfitLikes: 0, // staged feature
  };
}
