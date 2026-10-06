// Shared recommendation service — used by both /api/check (first run) and
// /api/recommend (recompute with a fit-preference override). Keeps engine-input
// assembly in one place so the two endpoints can't drift.

import { soleDepartment } from "./womensSizes";
import type { Locale } from "@/i18n/config";
import { prisma } from "./db";
import { easeFor, recommend, type EngineInput, type EngineOutput, type OutcomeInput } from "./fitEngine";
import { engineText } from "./engineText";
import { judgeListing, type Judgement } from "./listingJudgement";
import type { SellerReading } from "./sellerMeasurements";
import type { FitPreference } from "./sizing";
import { regionBodyPrior } from "./populationPrior";
import { engineSizes } from "./engineInput";

type ProductWithSizes = {
  id: string;
  brand: string | null;
  category: string | null;
  productName?: string | null;
  /** The extractor's payload; its `source` says whether this is a one-off listing. */
  rawJson?: string | null;
  sizeOptions: Array<{
    waistCm?: number | null;
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
  /** The language the explanation is written in; the numbers do not depend on it. */
  locale?: Locale,
): Promise<{
  result: EngineOutput;
  effectiveFit: FitPreference;
  /**
   * The body measurements the engine actually scored against, so the result page
   * can draw the body-vs-garment gap without a second round trip. This is the
   * user's OWN session — the privacy invariant governs `/api/view/[code]`, where
   * a third party holds only an account code, and is untouched by this.
   */
  body: { chestCm: number | null; waistCm: number | null; shoulderCm: number | null; estimated: boolean };
}> {
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
      // No regional prior for hip: it is scored only when the wearer gave theirs.
      hipCm: profile?.hipCm ?? null,
      preferredFit: effectiveFit,
      chestIsEstimated: !hasOwnChest && prior != null,
    },
    // The line decides how numeric sizes are read (womensSizes.ts): the page's own
    // word first, else the one department the wearer says they shop.
    product: {
      brand: product.brand,
      category: product.category,
      gender: lineOf(product.rawJson) ?? soleDepartment(profile?.shopsFor),
      // Its style words pick the closest pieces in the closet (styleWords.ts).
      name: product.productName ?? null,
    },
    // One mapping for every caller — see engineInput.ts for why waist is not in it.
    sizes: engineSizes(product.sizeOptions),
    knownGood: knownGood.map((k) => ({
      brand: k.brand,
      category: k.category,
      size: k.size,
      fitRating: k.fitRating,
      fitDirection: k.fitDirection,
      region: k.region,
      // The garment's own chest, captured at add-by-URL time, plus where it came
      // from. Feeds the personal ease target in personalEase.ts.
      garmentChestCm: k.garmentChestCm,
      garmentMeasuredFrom: k.garmentMeasuredFrom,
      gender: k.gender ?? soleDepartment(profile?.shopsFor),
      // Which piece a reason used, by name (Session 88b).
      id: k.id,
      name: k.displayName,
    })),
    outcomes: priorOutcomes.map<OutcomeInput>((o) => ({
      purchasedSize: o.purchasedSize,
      decision: o.decision as OutcomeInput["decision"],
      exchangedForSize: o.exchangedForSize,
      fitDirection: o.fitDirection,
      overallFit: o.overallFit,
      areaIssues: o.areaIssuesJson ? JSON.parse(o.areaIssuesJson) : null,
      productBrand: o.product.brand,
      productCategory: o.product.category,
    })),
  };

  // A one-off listing (Session 80): one garment, one size — a judgement, not a
  // ranking. Same target and verdict scale as the engine (listingJudgement.ts).
  const source = sourceOf(product.rawJson);
  if (source?.listing && product.sizeOptions.length === 1) {
    const M = engineText(locale);
    const judgement = judgeListing(
      {
        option: product.sizeOptions[0],
        category: product.category,
        categoryGuessed: !!source.categoryGuessed,
        profile: engineInput.profile as ListingProfile,
        easeCm: easeFor(engineInput, M).easeCm,
        knownGood: engineInput.knownGood,
        line: engineInput.product.gender,
        seller: source.seller,
      },
      M,
    );
    return {
      result: listingOutput(product.sizeOptions[0].label, judgement),
      effectiveFit,
      body: {
        chestCm: engineInput.profile.chestCm ?? null,
        waistCm: engineInput.profile.waistCm ?? null,
        shoulderCm: engineInput.profile.shoulderCm ?? null,
        estimated: !!engineInput.profile.chestIsEstimated,
      },
    };
  }

  return {
    result: recommend(engineInput, { locale }),
    effectiveFit,
    body: {
      chestCm: engineInput.profile.chestCm ?? null,
      waistCm: engineInput.profile.waistCm ?? null,
      shoulderCm: engineInput.profile.shoulderCm ?? null,
      estimated: !!engineInput.profile.chestIsEstimated,
    },
  };
}

type ListingProfile = Parameters<typeof judgeListing>[0]["profile"];

/** The product's line as the extractor read it ("mens" | "womens" | "unisex"), or null. */
function lineOf(rawJson: string | null | undefined): string | null {
  if (!rawJson) return null;
  try {
    const g = JSON.parse(rawJson)?.gender;
    return g === "mens" || g === "womens" || g === "unisex" ? g : null;
  } catch {
    return null;
  }
}

function sourceOf(rawJson: string | null | undefined): { listing?: boolean; categoryGuessed?: boolean; seller?: SellerReading } | null {
  if (!rawJson) return null;
  try {
    return JSON.parse(rawJson)?.source ?? null;
  } catch {
    return null;
  }
}

/**
 * A judgement in the engine's output shape, so every caller that stores or shows a
 * result (FitRecommendation, the popup, /check) keeps working. `judgement` carries
 * what a ranking cannot say; `undetermined` is true when there is no judgement.
 */
function listingOutput(label: string, j: Judgement): EngineOutput & { judgement: Judgement } {
  const size = {
    label,
    normalized: null,
    score: j.outcome === "unknown" ? 0 : j.confidence,
    confidence: j.confidence,
    reasons: j.reasons.map((message) => ({ signal: "measurement-fit" as const, weight: 0, message })),
    ...(j.verdict ? { verdict: j.verdict } : {}),
  };
  return {
    ranked: [size],
    best: size,
    explanation: [...j.reasons, ...j.notes].map((l) => `• ${l}`).join("\n"),
    undetermined: j.outcome === "unknown",
    domainNote: null,
    domainRelevance: "match",
    conflictNote: j.notes.length ? j.notes.join(" ") : null,
    stability: null,
    alternative: null,
    judgement: j,
  };
}
