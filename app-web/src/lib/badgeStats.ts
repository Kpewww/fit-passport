// Server-side helper to gather a user's real BadgeStats from the DB. Kept in one
// place so /api/status, /api/view/[code], and the community listing all compute
// badges from the same source of truth.

import { prisma } from "./db";
import type { BadgeStats } from "./badges";

export async function computeBadgeStats(userId: string, communityListed: boolean): Promise<BadgeStats> {
  const [items, outcomeCount, refreshCount, outfits] = await Promise.all([
    prisma.knownGoodItem.findMany({
      where: { userId },
      select: { brand: true, collectionId: true },
    }),
    prisma.fitOutcome.count({ where: { userId } }),
    prisma.comfortCheck.count({ where: { userId } }),
    prisma.outfit.findMany({
      where: { userId },
      select: { _count: { select: { likes: true } } },
    }),
  ]);

  const brands = new Set(items.map((i) => i.brand.toLowerCase()));
  const collections = new Set(items.map((i) => i.collectionId).filter(Boolean));

  const outfitPosts = outfits.length;
  const totalLikes = outfits.reduce((n, o) => n + o._count.likes, 0);
  const topOutfitLikes = outfits.reduce((m, o) => Math.max(m, o._count.likes), 0);

  return {
    closetCount: items.length,
    outcomeCount,
    collectionsUsed: collections.size,
    refreshCount,
    brandsCount: brands.size,
    communityListed,
    outfitPosts,
    outfitLikes: totalLikes,
    topOutfitLikes,
  };
}
