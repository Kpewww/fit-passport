// GET /api/view/[code]
// PUBLIC read-by-code endpoint. Anyone with a valid account code can read the
// owner's CLOSET and their COARSE body type. It NEVER returns precise body
// measurements (chest/waist/height/weight) — those live in FitProfile and are
// deliberately excluded here. See docs/design/identity-and-sharing.md §A.
//
// No session required; this is the shareable public view.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normalizeAccountCode } from "@/lib/auth";
import { computeBadgeStats } from "@/lib/badgeStats";
import { earnedBadgeIds, evaluateBadges, parsePinned } from "@/lib/badges";
import { clientKey, rateLimit, tooMany } from "@/lib/rateLimit";

export async function GET(
  req: Request,
  { params }: { params: { code: string } },
) {
  // Anti-scrape: 60 reads / min per IP.
  const rl = await rateLimit(clientKey(req, "view"), 60, 60_000);
  if (!rl.ok) return tooMany(rl.retryAfterSec);

  const code = normalizeAccountCode(decodeURIComponent(params.code));
  const user = await prisma.user.findUnique({
    where: { accountCode: code },
    select: {
      id: true,
      claimed: true,
      deactivated: true,
      username: true,
      accountCode: true,
      bodyType: true,
      showBodyType: true,
      exportPolicy: true,
      listedInCommunity: true,
      pinnedBadges: true,
      // Only COARSE profile fields are exposed. Precise measurements
      // (chest/waist/height/…) are intentionally NOT selected and must never
      // leave the server through this public endpoint. The avatar is cosmetic
      // and safe to show.
      fitProfile: {
        select: { sex: true, shopsFor: true, avatarDataUrl: true },
      },
      knownGood: {
        orderBy: [{ sortIndex: "asc" }, { createdAt: "desc" }],
        select: {
          id: true,
          brand: true,
          category: true,
          gender: true,
          size: true,
          region: true,
          fitRating: true,
          areaNotesJson: true,
          color: true,
          collectionId: true,
          // productUrl intentionally omitted from public view for now.
        },
      },
      collections: {
        orderBy: { sortIndex: "asc" },
        select: { id: true, name: true, sortIndex: true },
      },
      // Social counts only — who follows whom says nothing about a body.
      _count: { select: { followers: true } },
    },
  });

  if (!user || !user.claimed || user.deactivated) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  // Earned + pinned badges (from real stats).
  const stats = await computeBadgeStats(user.id, user.listedInCommunity);
  const earned = earnedBadgeIds(stats);
  const pinned = parsePinned(user.pinnedBadges).filter((id) => earned.includes(id));

  return NextResponse.json({
    username: user.username,
    accountCode: user.accountCode,
    avatarDataUrl: user.fitProfile?.avatarDataUrl ?? null,
    bodyType: user.showBodyType ? user.bodyType : null, // coarse, and only if the user shows it
    sex: user.fitProfile?.sex ?? null,
    shopsFor: user.fitProfile?.shopsFor ?? null,
    canExport: user.exportPolicy === "anyone",
    followerCount: user._count.followers,
    collections: user.collections,
    closet: user.knownGood,
    badges: evaluateBadges(stats).filter((b) => b.earnedNow),
    pinnedBadges: pinned,
  });
}
