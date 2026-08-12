// GET /api/community
// Public directory of closets whose owners OPTED IN (listedInCommunity=true).
// Returns coarse, shareable info only — same privacy rules as /api/view: never
// precise measurements. Powers the browsable community grid.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { computeBadgeStats } from "@/lib/badgeStats";
import { earnedBadgeIds, highestMetal, parsePinned } from "@/lib/badges";

export async function GET() {
  const users = await prisma.user.findMany({
    where: { listedInCommunity: true, claimed: true, deactivated: false },
    select: {
      id: true,
      username: true,
      accountCode: true,
      bodyType: true,
      showBodyType: true,
      pinnedBadges: true,
      cardMetal: true,
      fitProfile: { select: { sex: true, shopsFor: true, avatarDataUrl: true } },
      _count: { select: { knownGood: true, followers: true } },
    },
    take: 60,
  });

  const entries = await Promise.all(
    users.map(async (u) => {
      const stats = await computeBadgeStats(u.id, true);
      const earned = earnedBadgeIds(stats);
      const pinned = parsePinned(u.pinnedBadges).filter((id) => earned.includes(id));
      // Prefer the user's pinned badges; fall back to their top earned ones.
      const showBadges = (pinned.length > 0 ? pinned : earned).slice(0, 3);
      return {
        username: u.username,
        accountCode: u.accountCode,
        avatarDataUrl: u.fitProfile?.avatarDataUrl ?? null,
        bodyType: u.showBodyType ? u.bodyType : null,
        sex: u.fitProfile?.sex ?? null,
        shopsFor: u.fitProfile?.shopsFor ?? null,
        closetCount: u._count.knownGood,
        followerCount: u._count.followers,
        badges: showBadges,
        badgeCount: earned.length,
        // The member's card finish drives their banner colour in the directory
        // (chosen metal → else their highest earned → else the default).
        cardMetal: u.cardMetal ?? highestMetal(earned) ?? null,
      };
    }),
  );

  // Most decorated + biggest closets first — a light "prestige" sort.
  entries.sort((a, b) => b.badgeCount - a.badgeCount || b.closetCount - a.closetCount);

  return NextResponse.json({ entries });
}
