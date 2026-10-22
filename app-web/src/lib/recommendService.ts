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
import { chestFromCloset, waistFromCloset } from "./closetChest";
import { lookupBrand } from "./brandRegistry";
import { brandReports, offsetFor } from "./brandOffsets";
import { bodyChestFor, regimeForCountry, regimeFromField } from "./sizeRegimes";
import { domainForCategory } from "./sizeSystems";

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
  body: ViewBody;
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
  // Each closet piece's label read by its country's standard (sizeRegimes.ts), then
  // shifted by how its brand's own charts sit from that standard (brandOffsets.ts).
  const { reports } = await brandReports();
  const pieceBody = new Map(knownGood.map((k) => {
    const line = k.gender ?? soleDepartment(profile?.shopsFor);
    const regime = regimeFromField(k.region) ?? regimeForCountry(lookupBrand(k.brand)?.country ?? null);
    const std = bodyChestFor(k.size, regime, line, domainForCategory(k.category));
    if (!std) return [k.id, null] as const;
    const off = offsetFor(reports, k.brand, line, k.size, regime);
    if (!off) return [k.id, std] as const;
    return [k.id, {
      minCm: std.minCm + off.offsetCm,
      maxCm: std.maxCm + off.offsetCm,
      evidence: {
        grade: "B" as const,
        source: `${std.evidence.source}, adjusted ${off.offsetCm > 0 ? "+" : ""}${off.offsetCm} cm by ${k.brand}'s own charts (${off.pages} pages)`,
        sourceZh: `${std.evidence.sourceZh}，并按 ${k.brand} 自己的 ${off.pages} 个商品页尺码表修正 ${off.offsetCm > 0 ? "+" : ""}${off.offsetCm} cm`,
      },
    }] as const;
  }));

  const hasOwnChest = profile?.chestCm != null;
  // Before the regional average: the closet's own labels, where a size standard says
  // what body they are cut for (closetChest.ts, Session 101).
  const fromCloset = hasOwnChest
    ? null
    : chestFromCloset(
        knownGood.map((k) => ({ ...k, gender: k.gender ?? soleDepartment(profile?.shopsFor), name: k.displayName, body: pieceBody.get(k.id) ?? null })),
        (b) => lookupBrand(b)?.country ?? null,
      );
  const prior = hasOwnChest || fromCloset ? null : regionBodyPrior(profile?.region, profile?.sex);
  const M0 = engineText(locale);
  const chestNote = fromCloset
    ? M0.closetChest({
        pieces: fromCloset.used.map((u) => M0.pieceLabel(u.piece.brand, u.piece.size, u.piece.name)),
        lo: fromCloset.lo,
        hi: fromCloset.hi,
        sources: [...new Set(fromCloset.used.map((u) => (locale === "zh" ? u.range.evidence.sourceZh : u.range.evidence.source)))],
      })
    : null;

  // The waist, likewise, from closet bottoms (Session 101h): before the regional prior.
  const hasOwnWaist = profile?.waistCm != null;
  const waistFrom = hasOwnWaist
    ? null
    : waistFromCloset(
        knownGood.map((k) => ({ ...k, gender: k.gender ?? soleDepartment(profile?.shopsFor), name: k.displayName })),
        (b) => lookupBrand(b)?.country ?? null,
      );
  const waistNote = waistFrom
    ? M0.closetWaist({
        pieces: waistFrom.used.map((u) => M0.pieceLabel(u.piece.brand, u.piece.size, u.piece.name)),
        lo: waistFrom.lo,
        hi: waistFrom.hi,
        sources: [...new Set(waistFrom.used.map((u) => (locale === "zh" ? u.range.evidence.sourceZh : u.range.evidence.source)))],
      })
    : null;

  const engineInput: EngineInput = {
    profile: {
      chestCm: profile?.chestCm ?? fromCloset?.chestCm ?? prior?.chestCm ?? null,
      waistCm: profile?.waistCm ?? waistFrom?.chestCm ?? prior?.waistCm ?? null,
      shoulderCm: profile?.shoulderCm ?? prior?.shoulderCm ?? null,
      // No regional prior for hip: it is scored only when the wearer gave theirs.
      hipCm: profile?.hipCm ?? null,
      preferredFit: effectiveFit,
      chestIsEstimated: !hasOwnChest && (prior != null || fromCloset != null),
      chestNote,
      // Only when it matters: on a bottoms product the waist is what is scored.
      waistNote: product.category && domainForCategory(product.category) === "bottom" ? waistNote : null,
      waistIsEstimated: !hasOwnWaist && waistFrom != null,
      // Read only by the seller's height-and-weight guide, when there is no own chest.
      heightCm: profile?.heightCm ?? null,
      weightKg: profile?.weightKg ?? null,
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
      bodyChest: pieceBody.get(k.id) ?? null,
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
      body: bodyForView(engineInput.profile, profile),
    };
  }

  return {
    result: recommend(engineInput, { locale }),
    effectiveFit,
    body: bodyForView(engineInput.profile, profile),
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

/**
 * The wearer's body as the result page draws it (Session 97, the 3D fit map): the
 * girths the engine scored with, plus the lengths and sex that only shape the
 * drawing. The wearer's own numbers, returned to their own session; nothing here
 * goes to anyone else.
 */
export type ViewBody = {
  chestCm: number | null;
  waistCm: number | null;
  shoulderCm: number | null;
  hipCm: number | null;
  heightCm: number | null;
  inseamCm: number | null;
  sex: "male" | "female" | null;
  estimated: boolean;
};

function bodyForView(
  scored: EngineInput["profile"],
  stored: { heightCm?: number | null; hipCm?: number | null; inseamCm?: number | null; sex?: string | null } | null | undefined,
): ViewBody {
  return {
    chestCm: scored.chestCm ?? null,
    waistCm: scored.waistCm ?? null,
    shoulderCm: scored.shoulderCm ?? null,
    hipCm: stored?.hipCm ?? null,
    heightCm: stored?.heightCm ?? null,
    inseamCm: stored?.inseamCm ?? null,
    sex: stored?.sex === "male" || stored?.sex === "female" ? stored.sex : null,
    estimated: !!scored.chestIsEstimated,
  };
}
