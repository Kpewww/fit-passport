// GET /api/status
// Returns a lightweight "profile completeness" snapshot so the UI can guide the
// user to the single most valuable next step. This powers the progress-aware
// home dashboard and the inline nudges on /check.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { computeBadgeStats } from "@/lib/badgeStats";
import { earnedBadgeIds, earnedMetals, evaluateBadges, parsePinned } from "@/lib/badges";

export async function GET() {
  const user = await getCurrentUser();

  const [profile, closetCount, productCount, outcomeCount, recentRec] =
    await Promise.all([
      prisma.fitProfile.findUnique({ where: { userId: user.id } }),
      prisma.knownGoodItem.count({ where: { userId: user.id } }),
      prisma.product.count({ where: { userId: user.id } }),
      prisma.fitOutcome.count({ where: { userId: user.id } }),
      prisma.fitRecommendation.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        include: { product: true },
      }),
    ]);

  // Has the user set at least one useful body signal or preference beyond defaults?
  const hasBody =
    !!profile &&
    (profile.chestCm != null ||
      profile.heightCm != null ||
      profile.waistCm != null);

  // Steps drive the guided checklist. `done` gates the "what's next" pointer.
  const steps = [
    {
      key: "profile",
      label: "Set your fit preference",
      done: !!profile,
      href: "/passport",
    },
    {
      key: "closet",
      label: "Add 3 items that fit you well",
      done: closetCount >= 3,
      progress: `${Math.min(closetCount, 3)}/3`,
      href: "/closet",
    },
    {
      key: "check",
      label: "Check your first product",
      done: productCount >= 1,
      href: "/check",
    },
    {
      key: "outcome",
      label: "Record how it fit",
      done: outcomeCount >= 1,
      href: "/history",
    },
  ];

  // Accuracy tier: what the engine currently has to work with.
  let accuracy: "low" | "medium" | "high" = "low";
  if (hasBody && closetCount >= 3) accuracy = "high";
  else if (hasBody || closetCount >= 1) accuracy = "medium";

  const firstUndone = steps.find((s) => !s.done) ?? null;

  // Badges + prestige layer.
  const badgeStats = await computeBadgeStats(user.id, user.listedInCommunity);
  const earned = earnedBadgeIds(badgeStats);
  const allBadges = evaluateBadges(badgeStats);
  const pinned = parsePinned(user.pinnedBadges).filter((id) => earned.includes(id));

  return NextResponse.json({
    profileExists: !!profile,
    hasBody,
    preferredFit: profile?.preferredFit ?? null,
    closetCount,
    productCount,
    outcomeCount,
    accuracy,
    steps,
    nextStep: firstUndone,
    // identity + prestige
    username: user.username,
    accountCode: user.accountCode,
    claimed: user.claimed,
    avatarDataUrl: profile?.avatarDataUrl ?? null,
    listedInCommunity: user.listedInCommunity,
    badges: allBadges,
    earnedBadgeIds: earned,
    pinnedBadges: pinned,
    signatureOutfitId: user.signatureOutfitId ?? null,
    cardMetal: user.cardMetal ?? null,
    earnedMetals: earnedMetals(earned),
    lastRecommendation: recentRec
      ? {
          size: recentRec.recommendedSizeLabel,
          confidence: recentRec.confidence,
          productName: recentRec.product.productName,
          brand: recentRec.product.brand,
        }
      : null,
  });
}
