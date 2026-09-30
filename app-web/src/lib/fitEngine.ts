// Fit Engine — transparent, rule/score-based size recommender.
//
// Design principle (from the Fit Passport proposal, §10.2):
//   "The first model does not need to be a proprietary machine-learning system.
//    A transparent scoring model is preferable because it can be
//    evaluated."
//
// So this engine deliberately AVOIDS a black-box LLM in the recommendation step.
// LLMs may extract product data upstream, but the actual size choice is a scored
// combination of signals with human-readable reasons attached to each size.
//
// Signals implemented in v1:
//   S1  Measurement compatibility  — body chest vs size chart, with ease from preferredFit.
//   S2  Known-good similarity      — same-brand-same-category anchor; then cross-brand alpha match.
//   S3  Fit preference             — slim / regular / relaxed / oversized adjusts ease target.
//   S4  Outcome learning           — past keep/return/exchange penalizes/promotes matching sizes.
//   S5  Data completeness          — sizes with less info get lower confidence, not lower score.
//
// The engine returns a ranked list of sizes with per-size reasons, plus one
// short natural-language explanation for the top pick. All numbers are traceable.

import {
  alphaDistance,
  alphaIndex,
  easeChestCm,
  easeAdjustForCategory,
  normalizeToAlpha,
  preferenceShift,
  type AlphaSize,
  type FitPreference,
} from "./sizing";
import { domainForCategory } from "./sizeSystems";
import { biasForBrand, type BrandBias } from "./brandBias";
import { directionToLadderShift, isDirectional, nearestOption } from "./fitDirection";
import { EN_TEXT, engineText, type DirectionKey, type Dim, type EngineText, type SignalName } from "./engineText";
import type { Locale } from "@/i18n/config";
import { reportConsistency } from "./closetConsistency";
import { isMeasuredReport, personalEaseTarget, resolveEase, type ResolvedEase } from "./personalEase";
import { CONFIDENCE_WEIGHTS } from "./confidenceWeights";
import { measureStability, stabilityFactor, type Stability } from "./stability";
import { bodyPlausibility } from "./plausibility";
import {
  AGREEMENT,
  ANCHOR_WEIGHTS,
  BINDING,
  BODY_RANGE,
  BRAND_BIAS_WEIGHT,
  CONFIDENCE_CAPS,
  DEFAULT_WEIGHTS,
  DIMENSIONS,
  DIRECTION,
  KNOWN_GOOD,
  OUTCOME,
  STABILITY,
  TIE,
  VERDICT_CM,
} from "./scoringConstants";

// ------------ Input contracts ------------

export type SizeOptionInput = {
  label: string; // "M", "EU 48"
  region?: string | null;
  chestCm?: number | null;
  waistCm?: number | null;
  shoulderCm?: number | null;
  sleeveCm?: number | null;
  bodyChestMinCm?: number | null;
  bodyChestMaxCm?: number | null;
  /** The body waist range this size is cut for — the waist twin of bodyChest. */
  bodyWaistMinCm?: number | null;
  bodyWaistMaxCm?: number | null;
};

export type KnownGoodInput = {
  brand: string;
  category: string;
  size: string;
  fitRating: number; // 1-5
  /**
   * SIGNED fit direction, -10 (too tight) .. 0 (just right) .. +10 (too loose).
   * Null/undefined = never reported, and the anchor behaves exactly as it did
   * before this field existed. See lib/fitDirection.ts.
   */
  fitDirection?: number | null;
  region?: string | null;
  /**
   * The GARMENT's own chest, captured from the retailer's chart when the item
   * was added by URL (Session 67), plus where that number came from. Together
   * with the wearer's chest these give `ease = garment − body` for a piece they
   * own AND rated — see personalEase.ts. Absent on hand-added items, and the
   * engine then behaves exactly as it did before these existed.
   */
  garmentChestCm?: number | null;
  garmentMeasuredFrom?: string | null;
};

export type OutcomeInput = {
  purchasedSize: string;
  decision: "keep" | "return" | "exchange";
  /** The size swapped TO — on an exchange, the one label that names the right size. */
  exchangedForSize?: string | null;
  /** How it fit, signed (fitDirection.ts). Which way a return was wrong. */
  fitDirection?: number | null;
  overallFit?: number | null;
  areaIssues?: Record<string, string> | null;
  productBrand?: string | null;
  productCategory?: string | null;
};

export type EngineInput = {
  profile: {
    chestCm?: number | null;
    waistCm?: number | null;
    shoulderCm?: number | null;
    preferredFit: FitPreference;
    // True when the measurements above are a REGIONAL-AVERAGE prior, not the
    // user's own (populationPrior.ts). The engine then softens its language and
    // caps confidence, because a guess about your body isn't a fact about it.
    chestIsEstimated?: boolean;
  };
  product: {
    brand?: string | null;
    category?: string | null;
  };
  sizes: SizeOptionInput[];
  knownGood: KnownGoodInput[];
  outcomes: OutcomeInput[];
};

// ------------ Output contracts ------------

export type Reason = {
  signal: "measurement-fit" | "known-good" | "preference" | "outcome" | "completeness" | "brand-bias";
  weight: number; // contribution to this size's score, positive = supports
  message: string;
};

// Ordinal fit verdict for a size, from the signed body-vs-garment delta. This is
// the small/fit/large framing the size-recommendation literature (Sembium,
// Guigourès, Misra) uses — surfaced per size so the UI can label each option.
export type FitVerdict = "too small" | "snug" | "true to size" | "relaxed" | "too big";

export type SizeScore = {
  label: string;
  normalized: AlphaSize | null;
  score: number; // 0..1 (higher = better)
  confidence: number; // 0..1
  reasons: Reason[];
  verdict?: FitVerdict; // present when we have enough measurement data to judge
};

// How relevant the user's closet evidence is to the product's garment domain.
//   "match"    — closet has items in the same domain (e.g. tops → tops)
//   "cross"    — closet has items, but ALL in a different domain (shoes → shirt)
//   "empty"    — no closet items at all
export type DomainRelevance = "match" | "cross" | "empty";

export type EngineOutput = {
  ranked: SizeScore[];
  best: SizeScore;
  explanation: string;
  /**
   * True when NOTHING discriminated between the sizes: no signal contributed a
   * reason, and every candidate scored identically. `best` is then simply the
   * first rung of the ladder, and presenting it as a recommendation would be
   * inventing an answer.
   *
   * Measured before this existed: an empty profile with an empty closet returned
   * **XS at 0.24 confidence** on a t-shirt, with all five sizes tied at 0.20 and
   * an explanation claiming it was "based on your closet and preference" — a
   * closet that did not exist. Ladder position is not evidence. The honest
   * output is to say we cannot tell them apart yet, and what would change that.
   */
  undetermined: boolean;
  // Set when the closet evidence is a different domain than the product, so the
  // UI can warn the recommendation is weak. Null when evidence is on-domain.
  domainNote: string | null;
  domainRelevance: DomainRelevance;
  // Set when the independent signals point at different sizes, or when the pick
  // is a size our own measurement model calls plainly wrong. The confidence
  // number already reflects this; the note explains WHY, which is the point of a
  // transparent engine — a lowered number with no reason is just a worse number.
  conflictNote: string | null;
  /**
   * Whether the pick survives the noise already in its inputs (stability.ts):
   * agreement across a grid of plausible alternative measurements, and the chest
   * range over which the answer holds. Null when there was nothing to compare.
   */
  stability: Stability | null;
  /**
   * The runner-up line ("Alternative: M is close — …"), or null. Also the last
   * line of `explanation`; separate so a client need not find it in prose, which
   * stopped being possible once the prose had two languages (Session 79).
   */
  alternative?: string | null;
};

// ------------ Engine ------------

// Weights are declared here so they're easy to audit and later A/B.
export type Weights = {
  chestFit: number;
  knownGood: number;
  preferenceBonus: number;
  outcomePenalty: number;
  minDataFloor: number;
};

// Default weights: measurement-led. Used when we have NO strong brand anchor.
const DEFAULT_W: Weights = { ...DEFAULT_WEIGHTS };

// Brand-bias signal weight. Deliberately smaller than chest/anchor — it's one
// more piece of evidence, not a dominator, and capped at ±1 step upstream.
const BRAND_BIAS_W = BRAND_BIAS_WEIGHT;

// Trust given to an anchor whose fit DIRECTION the wearer reported. Below 1.0
// because mapping a subjective word onto a fraction of a ladder step is itself
// uncertain, but above what a matching star rating would give, because the
// correction has already been applied.
const DIRECTED_ANCHOR_TRUST = KNOWN_GOOD.directedTrust;

// Anchor-led weights: used when the closet contains a same-brand + same-category
// item the user rated well. In that case "size X fits me in THIS brand+category"
// is far more reliable than comparing a body measurement to the chart's raw
// garment numbers (each brand calibrates its chart differently). So the
// known-good anchor dominates and chest-fit degrades to a tie-breaker.
// [F1] fix — see DEVLOG 2026-08-10.
const ANCHOR_W: Weights = { ...ANCHOR_WEIGHTS };

/** True if the closet has a trustworthy same-brand + same-category anchor. */
function hasStrongAnchor(
  product: EngineInput["product"],
  knownGood: KnownGoodInput[],
): boolean {
  return knownGood.some(
    (kg) =>
      product.brand != null &&
      product.category != null &&
      kg.brand.toLowerCase() === product.brand.toLowerCase() &&
      kg.category.toLowerCase() === product.category.toLowerCase() &&
      kg.fitRating >= KNOWN_GOOD.strongRating,
  );
}

// A soft Gaussian over how far a garment dimension is from its target, in cm.
const gauss = (deltaCm: number, sigma: number) =>
  Math.exp(-(deltaCm * deltaCm) / (2 * sigma * sigma));

// Verdict thresholds (cm) on the CHEST delta from the preference-adjusted target.
// Negative = garment smaller than you want; positive = roomier than you want.
export function verdictFromDelta(delta: number): FitVerdict {
  if (delta <= VERDICT_CM.tooSmall) return "too small";
  if (delta < VERDICT_CM.snug) return "snug";
  if (delta < VERDICT_CM.relaxed) return "true to size";
  if (delta < VERDICT_CM.tooBig) return "relaxed";
  return "too big";
}

/**
 * How well a wearer's measurement sits in a BODY range a size is cut for.
 *
 * One definition, used by chest and waist alike, because the sign convention in
 * here has already been wrong once. `verdictFromDelta` reads delta as
 * GARMENT-relative — negative = this size is smaller than you want — while a body
 * range describes the WEARER, so it must be negated here. It was not, and every
 * verdict off a body range came out inverted (invariant (51)): with a 100cm chest
 * against Nike's chart, L read "too small". Only the verdict was wrong — `sub`
 * uses the unsigned distance — which is exactly why it survived.
 */
function bodyRangeFit(b: number, lo: number, hi: number): { sub: number; delta: number } {
  if (b >= lo && b <= hi) {
    // Inside the range: best near the middle, still strong at the edges.
    const mid = (lo + hi) / 2;
    return {
      delta: mid - b, // body above the middle => this size runs snug on you
      sub: BODY_RANGE.insideFloor + BODY_RANGE.insideSpan * gauss(b - mid, (hi - lo) / 2 || 1),
    };
  }
  const outBy = b < lo ? b - lo : b - hi; // signed cm the body sits outside
  // Negate to garment-relative, then push past the edge so a size the body does
  // not fit inside never reads as "true to size".
  const push = BODY_RANGE.outsidePushCm;
  // CONTINUOUS AT THE EDGE, AND ALWAYS BELOW IT OUTSIDE. The outside score used to
  // start at gauss(0) = 1.0 while the inside score at the same edge is only
  // insideFloor + insideSpan·e^(−½) ≈ 0.94 — so sitting just OUTSIDE a size's range
  // scored higher than sitting just inside it. Measured on Nike's chart in Session
  // 78: a 94.5 cm chest (inside S, outside M) was recommended M, and 95.5 cm
  // (inside M) was recommended S; the pick flipped back and forth within ~2 cm of
  // every boundary. Scaling the fall-off by the edge value makes the curve
  // continuous and monotone, so the size that contains the wearer always wins.
  const edge = BODY_RANGE.insideFloor + BODY_RANGE.insideSpan * Math.exp(-0.5);
  return { delta: outBy > 0 ? -outBy - push : -outBy + push, sub: edge * gauss(outBy, BODY_RANGE.outsideSigmaCm) };
}

/**
 * Score how well one size fits, across EVERY measurement we have (chest, waist,
 * shoulder) — not chest alone. A shirt can match the chest yet fail at the
 * shoulders, and the size literature models fit as a multi-measurement signal.
 *
 * Per dimension we compute a soft-Gaussian sub-score around a garment target
 * (body + ease); we then combine them chest-dominant, RENORMALISED over whichever
 * dimensions are actually present. So when only chest data exists the combined
 * score is identical to the old chest-only behaviour (keeps the engine's tuning
 * and tests stable); waist/shoulder only ever refine it.
 *
 * Two refinements from the research:
 *   • If the chart gives a BODY chest range (bodyChestMin/Max) — the retailer's own
 *     intended fit — we score membership in that range instead of guessing ease.
 *   • The reason names the BINDING dimension (the worst-fitting one), so "matches
 *     your chest but the shoulders run narrow" is stated, not hidden.
 */
function scoreMeasurementFit(
  size: SizeOptionInput,
  profile: EngineInput["profile"],
  pref: FitPreference,
  category: string | null | undefined,
  W: Weights,
  /** Ease to score with — the stated preference, possibly moved by the closet. */
  resolvedEase?: ResolvedEase,
  /** How to word the reason (engineText.ts). */
  M: EngineText = EN_TEXT,
): { score: number; reason: Reason | null; verdict?: FitVerdict } {
  // `resolvedEase` is optional so every existing caller and test keeps the exact
  // behaviour it had: with nothing learned, this is `easeChestCm(pref)` verbatim.
  const ease = (resolvedEase?.easeCm ?? easeChestCm(pref)) + easeAdjustForCategory(category);

  type DimScore = { key: Dim; sub: number; delta: number; weight: number; sigma: number };
  const dims: DimScore[] = [];

  // ---- Chest (primary) ----
  let chestDelta: number | null = null;
  if (profile.chestCm != null) {
    if (size.bodyChestMinCm != null && size.bodyChestMaxCm != null) {
      // Retailer gives the intended BODY range for this size — score membership.
      const { sub, delta } = bodyRangeFit(profile.chestCm, size.bodyChestMinCm, size.bodyChestMaxCm);
      chestDelta = delta;
      dims.push({ key: "chest", sub, delta, weight: DIMENSIONS.chest.weight, sigma: DIMENSIONS.chest.sigmaCm });
    } else if (size.chestCm != null) {
      const target = profile.chestCm + ease;
      const delta = size.chestCm - target;
      chestDelta = delta;
      dims.push({ key: "chest", sub: gauss(delta, DIMENSIONS.chest.sigmaCm), delta, weight: DIMENSIONS.chest.weight, sigma: DIMENSIONS.chest.sigmaCm });
    }
  }

  // ---- Waist (secondary) — tracks the body a little more tightly than chest ----
  if (profile.waistCm != null) {
    if (size.bodyWaistMinCm != null && size.bodyWaistMaxCm != null) {
      // The body waist this size is cut for — membership, like chest. No ease is
      // added: the number already describes the wearer, not the garment.
      const { sub, delta } = bodyRangeFit(profile.waistCm, size.bodyWaistMinCm, size.bodyWaistMaxCm);
      dims.push({ key: "waist", sub, delta, weight: DIMENSIONS.waist.weight, sigma: DIMENSIONS.waist.sigmaCm });
    } else if (size.waistCm != null) {
      const target = profile.waistCm + ease * DIMENSIONS.waist.easeFactor;
      const delta = size.waistCm - target;
      dims.push({ key: "waist", sub: gauss(delta, DIMENSIONS.waist.sigmaCm), delta, weight: DIMENSIONS.waist.weight, sigma: DIMENSIONS.waist.sigmaCm });
    }
  }

  // ---- Shoulder — the least forgiving dimension, so a tighter sigma ----
  if (profile.shoulderCm != null && size.shoulderCm != null) {
    const target = profile.shoulderCm + 1; // shoulders want minimal ease
    const delta = size.shoulderCm - target;
    dims.push({ key: "shoulder", sub: gauss(delta, DIMENSIONS.shoulder.sigmaCm), delta, weight: DIMENSIONS.shoulder.weight, sigma: DIMENSIONS.shoulder.sigmaCm });
  }

  if (dims.length === 0) return { score: 0, reason: null };

  // Renormalise weights over present dimensions → chest-only stays identical.
  const wsum = dims.reduce((a, d) => a + d.weight, 0);
  const raw = dims.reduce((a, d) => a + (d.weight / wsum) * d.sub, 0);

  // Message: lead with the chest verdict, but if a secondary dimension fits
  // clearly worse, name it as the binding constraint.
  const worst = dims.slice().sort((a, b) => a.sub - b.sub)[0];
  const chest = dims.find((d) => d.key === "chest");
  let msg: string;
  if (chest && Math.abs(chest.delta) < BINDING.chestNearCm && (worst.key === "chest" || worst.sub > BINDING.strongSub)) {
    msg = M.matchesFit(pref, dims.map((d) => d.key), !!profile.chestIsEstimated);
  } else if (worst.key !== "chest" && worst.sub < BINDING.weakSub) {
    msg = M.bindingDimension(worst.key, Math.abs(worst.delta).toFixed(1), worst.delta > 0);
  } else {
    const d = chest?.delta ?? worst.delta;
    msg = M.versusTarget(chest ? "chest" : worst.key, Math.abs(d).toFixed(1), d > 0, pref);
  }

  return {
    score: raw,
    reason: { signal: "measurement-fit", weight: W.chestFit * raw, message: msg },
    verdict: chestDelta != null ? verdictFromDelta(chestDelta) : undefined,
  };
}

/**
 * Boost a size if it matches (or is adjacent to) a known-good garment.
 * Same-brand-same-category is worth more than cross-brand.
 */
/**
 * Where a closet garment sits on THIS product's size ladder.
 *
 * By default the anchor is placed by its LABEL — a "Roomy Brand M" lands wherever
 * M lands. That is the approximation the comment below has always acknowledged,
 * and it is wrong in a way that shows: Roomy Brand's M measures 118cm and
 * Uniqlo's measures 100cm, so matching the letter recommends a garment 18cm
 * smaller than the one the wearer told us fits.
 *
 * When we captured the anchor garment's OWN chest (Session 67) and this product
 * states its chests, we can do the honest thing instead: find the size on this
 * ladder that measures closest to the garment that actually fits them. Labels are
 * a brand's opinion; centimetres are not.
 *
 * Returns null when either side is missing, and the caller falls back to the
 * label — which is every item added before the measurements were captured.
 */
function anchorIndexByMeasurement(
  kg: KnownGoodInput,
  sizes: SizeOptionInput[],
): number | null {
  if (kg.garmentChestCm == null) return null;
  // Only a measurement we READ, never one the extractor guessed — the same bar
  // personalEase.ts applies, for the same reason.
  if (kg.garmentMeasuredFrom !== "page" && kg.garmentMeasuredFrom !== "fixture") return null;

  let bestIdx: number | null = null;
  let bestDelta = Infinity;
  for (const s of sizes) {
    if (s.chestCm == null) continue;
    const idx = alphaIndex(normalizeToAlpha(s.label));
    if (idx === null) continue;
    const delta = Math.abs(s.chestCm - kg.garmentChestCm);
    if (delta < bestDelta) {
      bestDelta = delta;
      bestIdx = idx;
    }
  }
  return bestIdx;
}

function scoreKnownGood(
  size: SizeOptionInput,
  product: EngineInput["product"],
  knownGood: KnownGoodInput[],
  pref: FitPreference,
  W: Weights,
  /** The full ladder, so an anchor can be placed by measurement rather than label. */
  allSizes: SizeOptionInput[] = [],
  M: EngineText = EN_TEXT,
): { score: number; reason: Reason | null } {
  if (knownGood.length === 0) return { score: 0, reason: null };
  const sizeAlpha = normalizeToAlpha(size.label);
  if (!sizeAlpha) return { score: 0, reason: null };
  const sizeIdx = alphaIndex(sizeAlpha);
  if (sizeIdx === null) return { score: 0, reason: null };

  let best = 0;
  let bestMsg = "";
  for (const kg of knownGood) {
    const kgAlpha = normalizeToAlpha(kg.size);
    const kgIdx = alphaIndex(kgAlpha);
    if (kgIdx === null) continue;

    const sameBrand =
      product.brand && kg.brand.toLowerCase() === product.brand.toLowerCase();
    const sameCat =
      product.category &&
      kg.category.toLowerCase() === product.category.toLowerCase();

    // The anchor size is the user's TRUE FIT in this reference. Two corrections
    // apply, and they are independent:
    //
    //   1. DIRECTION — what the wearer reported about THIS garment. If they own a
    //      Uniqlo M and say it runs snug, their real Uniqlo size is bigger than M,
    //      so the anchor itself moves. This is an observation about the garment,
    //      not a taste, so it applies to weak (cross-brand) anchors too.
    //   2. PREFERENCE — how they want the NEXT garment to sit. Only applied to a
    //      same-brand+same-category anchor, since cross-brand ladder alignment is
    //      already approximate and stacking a taste shift on top would compound
    //      two guesses.
    const strong = !!(sameBrand && sameCat);
    const dirShift = directionToLadderShift(kg.fitDirection);
    // Prefer measurement alignment when we have it; fall back to the label.
    // Same-brand anchors are left on the label deliberately: within one brand the
    // ladder already lines up, and the label is what the wearer will recognise in
    // the explanation.
    const byMeasure = strong ? null : anchorIndexByMeasurement(kg, allSizes);
    const baseIdx = byMeasure ?? kgIdx;
    const targetIdx = (strong ? baseIdx + preferenceShift(pref) : baseIdx) + dirShift;
    const dist = Math.abs(sizeIdx - targetIdx);

    // Base falloff by ladder distance.
    const proximity = Math.max(0, 1 - dist * KNOWN_GOOD.perStep);
    // A reported DIRECTION is strictly more information than a star rating: we
    // know both the size and which way it misses, and we have already corrected
    // for the miss above. So a directed anchor is trusted on the quality of the
    // REPORT rather than the quality of the fit — otherwise "too tight" would be
    // penalised twice, once by the correction and again by the low star rating it
    // usually comes with, when in fact it is one of the most informative items in
    // the closet.
    const trust = kg.fitDirection != null ? DIRECTED_ANCHOR_TRUST : kg.fitRating / 5;
    const mult = strong ? KNOWN_GOOD.mult.strong : sameCat ? KNOWN_GOOD.mult.sameCategory : KNOWN_GOOD.mult.other;
    const s = proximity * trust * mult;
    if (s > best) {
      best = s;
      const label = `${kg.brand} ${kg.size}`;
      const dirWord: DirectionKey | null =
        isDirectional(kg.fitDirection) && kg.fitDirection != null ? (nearestOption(kg.fitDirection).key as DirectionKey) : null;
      // Prefer the direction in the explanation when there is one — "runs snug"
      // is a fact the reader recognises, where "1 step from your Uniqlo M" is a
      // conclusion they have to take on trust.
      if (dirWord) {
        bestMsg =
          dist === 0
            ? M.anchorRunsHere(label, dirWord)
            : M.anchorRunsSteps(dist.toFixed(dist % 1 === 0 ? 0 : 1), dist > 1, label, dirWord);
      } else if (strong && preferenceShift(pref) !== 0) {
        // Explain that we shifted from the true-fit anchor for the preference.
        bestMsg =
          dist === 0
            ? M.anchorShifted(preferenceShift(pref) > 0, label, pref)
            : M.anchorAdjustedSteps(dist, label, pref);
      } else if (dist === 0) {
        bestMsg = M.anchorMatches(label, kg.category);
      } else {
        bestMsg = M.anchorSteps(dist, label);
      }
    }
  }
  return best > 0
    ? { score: best, reason: { signal: "known-good", weight: W.knownGood * best, message: bestMsg } }
    : { score: 0, reason: null };
}

/**
 * Penalize a size if a matching purchase was returned before,
 * and boost if a similar size was kept (esp. same brand/category).
 */
function scoreOutcome(
  size: SizeOptionInput,
  product: EngineInput["product"],
  outcomes: OutcomeInput[],
  W: Weights,
  M: EngineText = EN_TEXT,
): { score: number; reason: Reason | null } {
  if (outcomes.length === 0) return { score: 0, reason: null };
  const sIdx = alphaIndex(normalizeToAlpha(size.label));
  if (sIdx == null) return { score: 0, reason: null };
  let bestPenalty = 0;
  let bestBoost = 0;
  let msg = "";
  for (const o of outcomes) {
    const pIdx = alphaIndex(normalizeToAlpha(o.purchasedSize));
    if (pIdx == null) continue;
    const sameBrand =
      product.brand && o.productBrand?.toLowerCase() === product.brand.toLowerCase();
    const sameCat =
      product.category &&
      o.productCategory?.toLowerCase() === product.category.toLowerCase();
    const mult = sameBrand && sameCat ? OUTCOME.mult.sameBrandCategory : sameCat ? OUTCOME.mult.sameCategory : OUTCOME.mult.other;
    const where = o.productBrand ?? null;
    const d = o.fitDirection;
    const directional = d != null && Math.abs(d) >= DIRECTION.directional;

    // EXCHANGE — the most informative record there is: "this size was wrong, THAT
    // one was right". Ignored entirely before Session 78d3.
    if (o.decision === "exchange" && o.exchangedForSize) {
      const eIdx = alphaIndex(normalizeToAlpha(o.exchangedForSize));
      if (eIdx != null) {
        const dist = Math.abs(sIdx - eIdx);
        if (dist <= 1) {
          const b = (1 - dist * OUTCOME.perStep) * mult;
          if (b > bestBoost) { bestBoost = b; msg = M.exchanged(o.purchasedSize, o.exchangedForSize, where); }
        }
      }
      if (sIdx === pIdx && mult > bestPenalty) {
        bestPenalty = mult;
        msg = M.exchanged(o.purchasedSize, o.exchangedForSize, where);
      }
      continue;
    }

    if (o.decision === "return") {
      // Penalise the size that was wrong, and — only when we know which way it was
      // wrong — the neighbour further in that direction. It used to penalise BOTH
      // neighbours whatever happened: returning an M for being too tight counted
      // against L, the size most likely to be right.
      const dist = Math.abs(sIdx - pIdx);
      const wrongWay = directional ? (d! < 0 ? sIdx <= pIdx : sIdx >= pIdx) : sIdx === pIdx;
      if (wrongWay && dist <= 1) {
        const p = (1 - dist * OUTCOME.perStep) * mult;
        if (p > bestPenalty) {
          bestPenalty = p;
          msg = M.returned(o.purchasedSize, where, directional ? (d! < 0 ? "tight" : "loose") : "unknown");
        }
      }
      continue;
    }

    // KEEP — confirms the size only if it actually fit. With a signed report that
    // means "near just right"; the legacy 1–5 is read as before. An untouched old
    // form stored overallFit = 4, which is why the signed field now decides first.
    const fitWell = d != null ? !directional : (o.overallFit ?? 0) >= OUTCOME.goodFitRating;
    const dist = Math.abs(sIdx - pIdx);
    if (fitWell && dist <= 1) {
      const b = (1 - dist * OUTCOME.perStep) * mult * OUTCOME.keepBoost;
      if (b > bestBoost) { bestBoost = b; msg = M.kept(o.purchasedSize, where); }
    }
  }
  const net = bestBoost - bestPenalty;
  if (net === 0) return { score: 0, reason: null };
  return {
    score: net,
    reason: {
      signal: "outcome",
      weight: W.outcomePenalty * net,
      message: msg,
    },
  };
}

/** Weighted-average combine with a floor so all-missing-data doesn't produce NaN. */
function combine(reasons: Reason[], floor: number): number {
  const totalW = reasons.reduce((a, r) => a + Math.abs(r.weight), 0);
  const totalS = reasons.reduce((a, r) => a + r.weight, 0);
  if (totalW === 0) return floor;
  // Map to 0..1 range with floor.
  return Math.max(0, Math.min(1, floor + totalS));
}

/** Confidence is a function of *how much* data we combined, not the score itself. */
/**
 * Whether a size states its chest in a form the scorer can measure a wearer against.
 *
 * Two forms count, because charts publish chest two ways: a GARMENT's flat chest
 * (`chestCm`) or the BODY range the size is cut for (`bodyChestMin/Max`). This used
 * to recognise only the first, so every body chart — most US retailers publish
 * those — sat at the confidence floor, and `/check`'s "up to +35 points" for adding
 * a chest measurement could never pay out on them. Measured before the fix: Nike
 * 0.30, Uniqlo 0.30, Patagonia 0.19–0.25 for a wearer whose chest the chart covers.
 */
export function statesChest(size: SizeOptionInput): boolean {
  return size.chestCm != null || (size.bodyChestMinCm != null && size.bodyChestMaxCm != null);
}

function computeConfidence(size: SizeOptionInput, hasKnownGood: boolean, hasChest: boolean): number {
  let c = CONFIDENCE_WEIGHTS.floor;
  if (hasChest && statesChest(size)) c += CONFIDENCE_WEIGHTS.measurements;
  if (hasKnownGood) c += CONFIDENCE_WEIGHTS.closetAnchor;
  if (size.shoulderCm != null) c += CONFIDENCE_WEIGHTS.chartShoulder;
  if (size.sleeveCm != null) c += CONFIDENCE_WEIGHTS.chartSleeve;
  return Math.min(1, c);
}


type Disagreement = { distance: number; signal: string; pickedLabel: string };

/**
 * How far apart do the independent signals land?
 *
 * The top-two margin rule catches ONE kind of uncertainty: two sizes scoring
 * nearly the same. It misses a sharper one — the signals actively DISAGREEING.
 * A same-brand anchor can carry a size to a decisive win (big margin ⇒ full
 * confidence) while the measurement model says that very size is "too small".
 *
 * Two independent estimates of the same quantity pointing different ways is the
 * textbook case for widening the interval rather than reporting certainty. It
 * also follows directly from the literature's "recommend the size most likely to
 * be KEPT" framing (see docs/design/fit-algorithm-research.md §3): a size one
 * signal predicts will be RETURNED cannot simultaneously be a near-certain keep.
 *
 * Disagreement is measured as ladder distance: for each signal, which size would
 * that signal pick on its own? The furthest such pick from the ensemble's winner
 * is the disagreement. A signal that only appears on one size expresses no
 * preference between sizes, so it is ignored.
 */
function signalDisagreement(
  ranked: SizeScore[],
  ladder: Map<string, number>,
): Disagreement | null {
  const winner = ranked[0];
  const winnerIdx = ladder.get(winner.label);
  if (winnerIdx == null) return null;

  const signals = new Set<string>();
  for (const r of ranked) for (const reason of r.reasons) signals.add(reason.signal);

  let worst: Disagreement | null = null;
  for (const signal of signals) {
    let pickedLabel: string | null = null;
    let bestWeight = -Infinity;
    let seen = 0;
    for (const r of ranked) {
      const reason = r.reasons.find((x) => x.signal === signal);
      if (!reason) continue;
      seen++;
      if (reason.weight > bestWeight) {
        bestWeight = reason.weight;
        pickedLabel = r.label;
      }
    }
    if (seen < 2 || pickedLabel == null) continue;
    const idx = ladder.get(pickedLabel);
    if (idx == null) continue;
    const distance = Math.abs(idx - winnerIdx);
    if (distance > 0 && (worst == null || distance > worst.distance)) {
      worst = { distance, signal, pickedLabel };
    }
  }
  return worst;
}

/**
 * Reference size to anchor a brand-bias shift around. Prefers a same-brand
 * known-good anchor; falls back to the middle of the offered size ladder.
 * Returns the alpha index (in ALPHA_LADDER) we'd nominally pick without the bias.
 */
function referenceSizeIdx(
  product: EngineInput["product"],
  sizes: SizeOptionInput[],
  knownGood: KnownGoodInput[],
): number | null {
  // Same-brand anchor first.
  const anchor = knownGood.find(
    (kg) => product.brand && kg.brand.toLowerCase() === product.brand.toLowerCase(),
  );
  if (anchor) {
    const idx = alphaIndex(normalizeToAlpha(anchor.size));
    if (idx !== null) return idx;
  }
  // Otherwise pick the middle offered size.
  const mid = sizes[Math.floor(sizes.length / 2)];
  return mid ? alphaIndex(normalizeToAlpha(mid.label)) : null;
}

function scoreBrandBiasForSize(
  size: SizeOptionInput,
  bias: BrandBias,
  refIdx: number | null,
): Reason | null {
  if (bias.shift === 0 || refIdx === null) return null;
  const sizeIdx = alphaIndex(normalizeToAlpha(size.label));
  if (sizeIdx === null) return null;
  const targetIdx = refIdx + bias.shift;
  const dist = Math.abs(sizeIdx - targetIdx);
  // Full support at the target; zero past 1 step away.
  const proximity = Math.max(0, 1 - dist);
  if (proximity === 0) return null;
  return {
    signal: "brand-bias",
    weight: BRAND_BIAS_W * proximity,
    message: bias.reason ?? "",
  };
}

/**
 * Nothing told the sizes apart: the top size carries no reason and every size has
 * the same score (invariant ㉝). Exported so a stored ranking (FitRecommendation
 * .breakdownJson) is read by the same rule — the to-buy list must not show "XS"
 * for a check that was a tie (Session 80).
 */
export function isUndetermined(ranked: ReadonlyArray<{ score: number; reasons: ReadonlyArray<unknown> }>): boolean {
  const best = ranked[0];
  return !!best && best.reasons.length === 0 && ranked.length > 1 && ranked.every((r) => Math.abs(r.score - best.score) < TIE.epsilon);
}

/**
 * The ease this wearer is scored with: their stated preference, or what their
 * measured closet garments say they actually wear (personalEase.ts). One function,
 * so the ranking and a one-off listing's judgement (listingJudgement.ts) aim at the
 * same target.
 */
export function easeFor(input: EngineInput, M: EngineText = EN_TEXT) {
  // What ease this wearer actually lives in, learned from closet garments whose
  // own measurements we captured. Revealed preference beats stated preference —
  // but only on measured garments, only past a minimum evidence bar, and never
  // by more than one ladder step. See personalEase.ts for the full discipline.
  //
  // Uses the FULL closet, not `usableKnownGood`: that filter exists to stop
  // cross-domain anchors moving a size, whereas an ease preference is a property
  // of the person. It moves the target ease, never the ladder directly, so it
  // cannot double-count with the anchor or with brand bias.
  const learnedEase = personalEaseTarget(
    input.knownGood.map((k) => ({
      category: k.category,
      garmentChestCm: k.garmentChestCm,
      garmentMeasuredFrom: k.garmentMeasuredFrom,
      fitDirection: k.fitDirection,
    })),
    input.profile.chestCm,
  );
  return resolveEase(input.profile.preferredFit, learnedEase, M);
}

export function recommend(
  input: EngineInput,
  /**
   * skipStability: set by the stability grid's own runs, which need only the pick.
   * locale: the language the explanation is written in (engineText.ts). Only the
   * wording changes — every number, weight and pick is identical in both.
   */
  opts: { skipStability?: boolean; locale?: Locale } = {},
): EngineOutput {
  const { profile, product, sizes, outcomes } = input;
  const M = engineText(opts.locale);

  // What ease this wearer actually lives in, learned from closet garments whose
  // own measurements we captured. Revealed preference beats stated preference —
  // but only on measured garments, only past a minimum evidence bar, and never
  // by more than one ladder step. See personalEase.ts for the full discipline.
  //
  // Uses the FULL closet, not `usableKnownGood`: that filter exists to stop
  // cross-domain anchors moving a size, whereas an ease preference is a property
  // of the person. It moves the target ease, never the ladder directly, so it
  // cannot double-count with the anchor or with brand bias.
  const easeUsed = easeFor(input, M);

  // The closet the rest of the engine may learn from. When the measured reports
  // contradict each other with no consistent majority, the explanation tells the
  // wearer "we used your stated fit instead of learning from them" — so they must
  // not anchor a size, vote on the brand, or lend confidence either, or that
  // sentence is false. Found by the eval's adversarial persona (Session 78f): the
  // message was right while confidence rose 46% → 75%. Unmeasured closet items took
  // no part in the contradiction and keep their say.
  const knownGood = easeUsed.contradiction
    ? input.knownGood.filter((k) => !isMeasuredReport(k))
    : input.knownGood;

  // ---- Per-user brand bias from outcomes (see brandBias.ts) -------------------
  const brand = product.brand ?? null;
  const brandBias: BrandBias = brand
    ? biasForBrand(
        brand,
        outcomes.map((o) => ({
          productBrand: o.productBrand ?? null,
          decision: o.decision,
          overallFit: o.overallFit ?? null,
          areaIssues: o.areaIssues ?? null,
          fitDirection: o.fitDirection ?? null,
          purchasedSize: o.purchasedSize,
          exchangedForSize: o.exchangedForSize ?? null,
        })),
        // Closet reports vote too — available on day one, where outcomes need a
        // purchase to have happened. Same-category items are excluded inside
        // biasForBrand because scoreKnownGood already moved the anchor by them.
        knownGood.map((k) => ({
          brand: k.brand,
          category: k.category,
          fitDirection: k.fitDirection ?? null,
        })),
        product.category ?? null,
        M,
      )
    : { direction: "neutral", evidence: 0, shift: 0, reason: null };
  const refIdx = brandBias.shift !== 0
    ? referenceSizeIdx(product, sizes, knownGood)
    : null;

  // ---- Domain relevance of the closet evidence -------------------------------
  // The engine's known-good similarity only makes sense when the closet contains
  // garments in the SAME size domain as the product (tops vs bottoms vs shoes…).
  // Three pairs of jeans tell us almost nothing about a shirt. We detect this and
  // (a) cap confidence, (b) surface a plain-language disclaimer.
  const productDomain = product.category ? domainForCategory(product.category) : null;
  const closetDomains = new Set(knownGood.map((kg) => domainForCategory(kg.category)));
  let domainRelevance: DomainRelevance;
  if (knownGood.length === 0) domainRelevance = "empty";
  else if (productDomain != null && closetDomains.has(productDomain)) domainRelevance = "match";
  else domainRelevance = "cross";

  // On cross-domain, the known-good anchor is NOT trustworthy — force the
  // measurement-led weights so a random jeans size can't masquerade as a top fit.
  // Also: when brand-bias is non-neutral, the user is TELLING us the anchor
  // rating is stale for this brand — step down from anchor-led to default
  // weights so the outcome+bias evidence can actually move the recommendation.
  const anchored =
    domainRelevance === "match" &&
    hasStrongAnchor(product, knownGood) &&
    brandBias.shift === 0;
  const W: Weights = anchored ? ANCHOR_W : DEFAULT_W;

  // On cross-domain, known-good similarity is meaningless — don't feed it.
  const usableKnownGood = domainRelevance === "cross" ? [] : knownGood;

  // ---- How much the wearer's own reports agree with each other ---------------
  // Scattered reports mean we know this person less well, whichever way the
  // scatter runs. This moves ONLY the confidence, never the size, so it cannot
  // double-count with the anchor correction or brand bias (both of which move the
  // size). See closetConsistency.ts.
  const consistency = reportConsistency(
    usableKnownGood.map((k) => ({ category: k.category, fitDirection: k.fitDirection ?? null })),
    (c) => productDomain == null || domainForCategory(c) === productDomain,
  );


  const ranked: SizeScore[] = sizes.map((size) => {
    const reasons: Reason[] = [];
    const fit = scoreMeasurementFit(size, profile, profile.preferredFit, product.category, W, easeUsed, M);
    if (fit.reason) reasons.push(fit.reason);
    const kg = scoreKnownGood(size, product, usableKnownGood, profile.preferredFit, W, sizes, M);
    if (kg.reason) reasons.push(kg.reason);
    const outc = scoreOutcome(size, product, outcomes, W, M);
    if (outc.reason) reasons.push(outc.reason);
    const bias = scoreBrandBiasForSize(size, brandBias, refIdx);
    if (bias) reasons.push(bias);
    // Weight 0: this did not push this size up or down against its siblings — it
    // moved the target every size was measured against. It is here so the user
    // can SEE that their closet changed the question, which is the whole
    // explainability contract. A hidden adjustment is the black box we refuse to be.
    if (easeUsed.personalised && easeUsed.reason) {
      reasons.push({ signal: "preference", weight: 0, message: easeUsed.reason });
    }

    const score = combine(reasons, W.minDataFloor);
    let confidence = computeConfidence(size, usableKnownGood.length > 0, profile.chestCm != null);
    // Cross-domain closet evidence should not lend confidence: cap it hard.
    if (domainRelevance === "cross") confidence = Math.min(confidence, CONFIDENCE_CAPS.crossDomain);
    // Scattered self-reports reduce it further — the reason is surfaced below.
    confidence *= consistency.factor;
    return {
      label: size.label,
      normalized: normalizeToAlpha(size.label),
      score,
      confidence,
      reasons,
      verdict: fit.verdict,
    };
  });

  ranked.sort((a, b) => b.score - a.score);

  // Confidence should track how DECISIVE the pick is, not only how much data we
  // had: a pick that flips when the wearer's measurement moves by the error a tape
  // measure already carries is a coin-flip, and deserves lower confidence. This
  // used to be the top-two SCORE margin; since Session 78 it is measured directly
  // — re-run on plausible alternative inputs, count how often the pick survives
  // (stability.ts). Same range as before (a dead heat keeps 60%), but in the
  // wearer's centimetres, so it can be said out loud.
  let stability: Stability | null = null;
  if (ranked.length >= 2 && !opts.skipStability) {
    stability = measureStability(input, ranked[0].label, (variant) =>
      recommend(variant, { skipStability: true }).best.label,
    );
    const factor = stabilityFactor(stability.agreement);
    for (const r of ranked) r.confidence = Math.round(r.confidence * factor * 100) / 100;
  }

  // ---- Signal agreement ------------------------------------------------------
  // See signalDisagreement(). A decisive margin is NOT the same as a confident
  // answer: the margin can be decisive precisely because one strong signal
  // overrode the others.
  const ladder = new Map(sizes.map((s, i) => [s.label, i] as const));
  const disagreement = signalDisagreement(ranked, ladder);
  const conflictParts: string[] = [];
  if (easeUsed.contradiction) conflictParts.push(easeUsed.contradiction);
  const implausible = bodyPlausibility(profile, M);
  if (implausible.length) conflictParts.push(M.implausible(implausible));
  // A pick that the wearer's own tape-measure error could flip must say so: the
  // confidence already fell (stabilityFactor), and a lower number with no reason
  // would break the explainability invariant.
  if (stability && stability.agreement < STABILITY.fragileBelow && stability.holdsForChestCm) {
    const [lo, hi] = stability.holdsForChestCm;
    conflictParts.push(M.fragile(lo, hi, stability.bodyNoiseCm));
  }
  if (disagreement) {
    // One ladder step apart is ordinary tension; two or more means the signals
    // are telling genuinely different stories.
    const agreement = disagreement.distance >= 2 ? AGREEMENT.twoPlusSteps : AGREEMENT.oneStep;
    for (const r of ranked) r.confidence = Math.round(r.confidence * agreement * 100) / 100;
    // Phrased without a verb agreeing with the signal name, so every signal
    // reads correctly ("your measurements" is plural, "a garment you own" isn't).
    conflictParts.push(M.disagree(disagreement.signal as SignalName, disagreement.pickedLabel, ranked[0].label));
  }

  // A size our own measurement model calls plainly wrong cannot be a confident
  // pick, however hard the other signals carry it. Applied per size, since each
  // size carries its own verdict.
  for (const r of ranked) {
    if (r.verdict === "too small" || r.verdict === "too big") {
      r.confidence = Math.min(r.confidence, CONFIDENCE_CAPS.verdictOff);
    }
  }
  if (ranked[0].verdict === "too small" || ranked[0].verdict === "too big") {
    conflictParts.push(M.verdictOff(ranked[0].label, ranked[0].verdict));
  }
  // A lowered confidence must always say why — a smaller number with no reason is
  // just a worse number, which would break the explainability invariant.
  if (consistency.note) conflictParts.push(M.closetScattered);

  const conflictNote = conflictParts.length > 0 ? conflictParts.join(" ") : null;

  // A regional-average body is a prior, not a fact — cap confidence so the number
  // can never imply we know the user's measurements.
  if (profile.chestIsEstimated) {
    for (const r of ranked) r.confidence = Math.min(r.confidence, CONFIDENCE_CAPS.estimatedBody);
  }
  // Measurements that describe no plausible body get the same ceiling as a guessed
  // one (plausibility.ts); the reason is in conflictNote above.
  if (implausible.length) {
    for (const r of ranked) r.confidence = Math.min(r.confidence, CONFIDENCE_CAPS.implausibleBody);
  }

  const best = ranked[0];

  // Build the plain-language explanation without an LLM. Grounded, template-based.
  // The top two by absolute weight — what actually told these sizes apart.
  const topReasons = best.reasons
    .slice()
    .filter((r) => r.weight !== 0)
    .sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight))
    .slice(0, 2)
    .map((r) => "• " + r.message);

  // Zero-weight reasons are CONTEXT, not competitors: they changed the target
  // every size was measured against rather than pushing one over another, so
  // sorting them by weight buries them permanently. The personal ease target is
  // the case that proved it — the summary was showing "14.5cm smaller than your
  // regular target" while "regular" means 10cm by default, and the explanation
  // for where 14.5 came from was the one line ranked last and cut. A number that
  // appears from nowhere is exactly the black box this engine exists not to be.
  const contextReasons = best.reasons
    .filter((r) => r.weight === 0)
    .map((r) => "• " + r.message);

  // Edge-of-range note: if the pick is the largest/smallest offered but the
  // user's target implies they'd want to go further, say so plainly instead of
  // leaving a confusing "chest N cm smaller/larger than target" as the only line.
  let edgeNote = "";
  if (profile.chestCm != null && best.reasons.some((r) => r.signal === "measurement-fit")) {
    const bestSize = sizes.find((s) => s.label === best.label);
    const target =
      profile.chestCm + easeChestCm(profile.preferredFit) + easeAdjustForCategory(product.category);
    if (bestSize?.chestCm != null) {
      const chestVals = sizes
        .map((s) => s.chestCm)
        .filter((v): v is number => v != null);
      const maxChest = Math.max(...chestVals);
      const minChest = Math.min(...chestVals);
      if (target > bestSize.chestCm && bestSize.chestCm === maxChest) {
        edgeNote = `\n• ${M.largestSize(profile.preferredFit)}`;
      } else if (target < bestSize.chestCm && bestSize.chestCm === minChest) {
        edgeNote = `\n• ${M.smallestSize(profile.preferredFit)}`;
      }
    }
  }

  // Nothing told these sizes apart: no signal produced a reason, and every
  // candidate carries the same score. `best` is then the first rung of the
  // ladder and nothing more.
  const undetermined = isUndetermined(ranked);

  // Suppress the "alternative" line when everything ties — calling the second
  // rung "close" implies the first was ahead of it, and it wasn't.
  const alternative =
    !undetermined && !edgeNote && ranked[1] && ranked[1].score > best.score - TIE.alternativeWithin
      ? M.alternative(ranked[1].label, profile.preferredFit)
      : null;
  const explanation = undetermined
    // The UI's own heading already states that the sizes tied. This says the one
    // thing it does not: what is missing. Four sentences repeating the tie made
    // the screen read as an apology instead of an instruction.
    ? M.undeterminedHelp
    : [
        ...(topReasons.length > 0 ? topReasons : [M.limitedData]),
        ...contextReasons,
      ].join("\n") +
      edgeNote +
      (alternative ? `\n${alternative}` : "");

  // Cross-domain disclaimer: the closet is all a different garment domain than
  // what we're sizing, so warn the user plainly.
  let domainNote: string | null = null;
  if (domainRelevance === "cross" && productDomain) {
    domainNote = M.crossDomain(Array.from(closetDomains), productDomain);
  }

  return { ranked, best, explanation, undetermined, domainNote, domainRelevance, conflictNote, stability, alternative };
}

