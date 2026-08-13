// Block list helpers.
//
// Reporting is for content that breaks the rules; blocking is for someone you
// simply don't want to see. Keeping them separate matters: telling people to
// report anyone they merely find unpleasant is how a moderation queue fills with
// noise that hides the real abuse.
//
// Blocks are enforced in BOTH directions. If A blocks B, A stops seeing B *and* B
// stops seeing A — so blocking is also a way out of someone else's attention, not
// just a way to avert your own eyes.

import { prisma } from "./db";

/**
 * Every user id this session must not see, and that must not see them.
 * Returns [] for the common case so callers can skip the filter cheaply.
 */
export async function invisibleUserIds(userId: string): Promise<string[]> {
  const rows = await prisma.block.findMany({
    where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
    select: { blockerId: true, blockedId: true },
  });
  if (rows.length === 0) return [];
  const ids = new Set<string>();
  for (const r of rows) ids.add(r.blockerId === userId ? r.blockedId : r.blockerId);
  return [...ids];
}

/**
 * A Prisma `where` fragment excluding blocked people, or `{}` when there are
 * none. Written as a helper so every listing filters identically — a feed that
 * forgets this leaks exactly the person the user asked never to see again.
 */
export function notBlocked(ids: string[]): { userId?: { notIn: string[] } } {
  return ids.length ? { userId: { notIn: ids } } : {};
}
