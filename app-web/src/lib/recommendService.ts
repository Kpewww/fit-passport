// Shared recommendation service — used by both /api/check (first run) and
// /api/recommend (recompute with a fit-preference override). Keeps engine-input
// assembly in one place so the two endpoints can't drift.

import { prisma } from "./db";
import { recommend, type EngineInput, type EngineOutput, type OutcomeInput } from "./fitEngine";
import type { FitPreference } from "./sizing";
import { regionBodyPrior } from "./populationPrior";

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

  // preferredFit is stored as a CSV (up to 3); the FIRST token is the primary
  // target the engine defaults to. The check page can still override to preview
  // any single preference.
  const primaryFit = (profile?.preferredFit ?? "regular")
    .split(",")[0]
    .trim() as FitPreference;
  const effectiveFit: FitPreference = overrideFit ?? primaryFit;

  // Cold-start body prior: ONLY when the user has entered no chest of their own.
  // Any real measurement below dominates it; the prior just gives a first-time
  // visitor an explainable (low-confidence) answer instead of a pure guess. Keyed
  // off self-reported region + sex; never inferred, never stored. See
  // populationPrior.ts for the governance rules and survey sources.
  const hasOwnChest = profile?.chestCm != null;
  const prior = hasOwnChest ? null : regionBodyPrior(profile?.region, profile?.sex);

  const engineInput: EngineInput = {
    profile: {
      chestCm: profile?.chestCm ?? prior?.chestCm ?? null,
      waistCm: profile?.waistCm ?? prior?.waistCm ?? null,
      shoulderCm: profile?.shoulderCm ?? prior?.shoulderCm ?? null,
      preferredFit: effectiveFit,
      chestIsEstimated: !hasOwnChest && prior != null,
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
