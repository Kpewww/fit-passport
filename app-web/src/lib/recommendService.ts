// Shared recommendation service — used by both /api/check (first run) and
// /api/recommend (recompute with a fit-preference override). Keeps engine-input
// assembly in one place so the two endpoints can't drift.

import { prisma } from "./db";
import { recommend, type EngineInput, type EngineOutput, type OutcomeInput } from "./fitEngine";
import type { FitPreference } from "./sizing";

type ProductWithSizes = {
  id: string;
  brand: string | null;
  category: string | null;
  sizeOptions: Array<{
    label: string;
    region: string | null;
    chestCm: number | null;
    shoulderCm: number | null;
    sleeveCm: number | null;
    bodyChestMinCm: number | null;
    bodyChestMaxCm: number | null;
  }>;
};

/**
 * Compute a recommendation for a product against the user's profile, closet and
 * outcomes. `overrideFit` lets the result page preview slim/relaxed/oversized
 * without mutating the saved profile.
 */
export async function computeRecommendation(
  userId: string,
  product: ProductWithSizes,
  overrideFit?: FitPreference,
): Promise<{ result: EngineOutput; effectiveFit: FitPreference }> {
  const [profile, knownGood, priorOutcomes] = await Promise.all([
    prisma.fitProfile.findUnique({ where: { userId } }),
    prisma.knownGoodItem.findMany({ where: { userId } }),
    prisma.fitOutcome.findMany({ where: { userId }, include: { product: true } }),
  ]);

  const effectiveFit: FitPreference =
    overrideFit ?? ((profile?.preferredFit ?? "regular") as FitPreference);

  const engineInput: EngineInput = {
    profile: {
      chestCm: profile?.chestCm ?? null,
      waistCm: profile?.waistCm ?? null,
      shoulderCm: profile?.shoulderCm ?? null,
      preferredFit: effectiveFit,
    },
    product: { brand: product.brand, category: product.category },
    sizes: product.sizeOptions.map((s) => ({
      label: s.label,
      region: s.region,
      chestCm: s.chestCm,
      shoulderCm: s.shoulderCm,
      sleeveCm: s.sleeveCm,
      bodyChestMinCm: s.bodyChestMinCm,
      bodyChestMaxCm: s.bodyChestMaxCm,
    })),
    knownGood: knownGood.map((k) => ({
      brand: k.brand,
      category: k.category,
      size: k.size,
      fitRating: k.fitRating,
      region: k.region,
    })),
    outcomes: priorOutcomes.map<OutcomeInput>((o) => ({
      purchasedSize: o.purchasedSize,
      decision: o.decision as OutcomeInput["decision"],
      overallFit: o.overallFit,
      areaIssues: o.areaIssuesJson ? JSON.parse(o.areaIssuesJson) : null,
      productBrand: o.product.brand,
      productCategory: o.product.category,
    })),
  };

  return { result: recommend(engineInput), effectiveFit };
}
