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
import { directionToLadderShift, describeDirection, isDirectional } from "./fitDirection";
import { reportConsistency } from "./closetConsistency";
import { personalEaseTarget, resolveEase, type ResolvedEase } from "./personalEase";
import { CONFIDENCE_WEIGHTS } from "./confidenceWeights";

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
const DEFAULT_W: Weights = {
  chestFit: 0.45,
  knownGood: 0.35,
  preferenceBonus: 0.05, // small nudge; preferred fit already reshapes chestFit target
  outcomePenalty: 0.15,
  minDataFloor: 0.2, // score never drops below this due to missing data
};

// Brand-bias signal weight. Deliberately smaller than chest/anchor — it's one
// more piece of evidence, not a dominator, and capped at ±1 step upstream.
const BRAND_BIAS_W = 0.15;

// Trust given to an anchor whose fit DIRECTION the wearer reported. Below 1.0
// because mapping a subjective word onto a fraction of a ladder step is itself
// uncertain, but above what a matching star rating would give, because the
// correction has already been applied.
const DIRECTED_ANCHOR_TRUST = 0.9;

// Anchor-led weights: used when the closet contains a same-brand + same-category
// item the user rated well. In that case "size X fits me in THIS brand+category"
// is far more reliable than comparing a body measurement to the chart's raw
// garment numbers (each brand calibrates its chart differently). So the
// known-good anchor dominates and chest-fit degrades to a tie-breaker.
// [F1] fix — see DEVLOG 2026-08-10.
const ANCHOR_W: Weights = {
  chestFit: 0.18,
  knownGood: 0.62,
  preferenceBonus: 0.05,
  outcomePenalty: 0.15,
  minDataFloor: 0.2,
};

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
      kg.fitRating >= 4,
  );
}

// A soft Gaussian over how far a garment dimension is from its target, in cm.
const gauss = (deltaCm: number, sigma: number) =>
  Math.exp(-(deltaCm * deltaCm) / (2 * sigma * sigma));

// Verdict thresholds (cm) on the CHEST delta from the preference-adjusted target.
// Negative = garment smaller than you want; positive = roomier than you want.
function verdictFromDelta(delta: number): FitVerdict {
  if (delta <= -6) return "too small";
  if (delta < -2) return "snug";
  if (delta < 2) return "true to size";
  if (delta < 6) return "relaxed";
  return "too big";
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
): { score: number; reason: Reason | null; verdict?: FitVerdict } {
  // `resolvedEase` is optional so every existing caller and test keeps the exact
  // behaviour it had: with nothing learned, this is `easeChestCm(pref)` verbatim.
  const ease = (resolvedEase?.easeCm ?? easeChestCm(pref)) + easeAdjustForCategory(category);

  type Dim = { key: string; sub: number; delta: number; weight: number; sigma: number };
  const dims: Dim[] = [];

  // ---- Chest (primary) ----
  let chestDelta: number | null = null;
  if (profile.chestCm != null) {
    if (size.bodyChestMinCm != null && size.bodyChestMaxCm != null) {
      // Retailer gives the intended BODY range for this size — score membership.
      const lo = size.bodyChestMinCm;
      const hi = size.bodyChestMaxCm;
      const b = profile.chestCm;
      let sub: number;
      let delta: number;
      if (b >= lo && b <= hi) {
        // Inside the range: best near the middle, still strong at the edges.
        const mid = (lo + hi) / 2;
        delta = b - mid; // for the verdict: below mid = snugger end
        sub = 0.85 + 0.15 * gauss(b - mid, (hi - lo) / 2 || 1);
      } else {
        const outBy = b < lo ? b - lo : b - hi; // signed cm outside the range
        delta = outBy < 0 ? outBy - 4 : outBy + 4; // push verdict past the edge
        sub = gauss(outBy, 4);
      }
      chestDelta = delta;
      dims.push({ key: "chest", sub, delta, weight: 0.6, sigma: 4 });
    } else if (size.chestCm != null) {
      const target = profile.chestCm + ease;
      const delta = size.chestCm - target;
      chestDelta = delta;
      dims.push({ key: "chest", sub: gauss(delta, 4), delta, weight: 0.6, sigma: 4 });
    }
  }

  // ---- Waist (secondary) — tracks the body a little more tightly than chest ----
  if (profile.waistCm != null && size.waistCm != null) {
    const target = profile.waistCm + ease * 0.8;
    const delta = size.waistCm - target;
    dims.push({ key: "waist", sub: gauss(delta, 4), delta, weight: 0.22, sigma: 4 });
  }

  // ---- Shoulder — the least forgiving dimension, so a tighter sigma ----
  if (profile.shoulderCm != null && size.shoulderCm != null) {
    const target = profile.shoulderCm + 1; // shoulders want minimal ease
    const delta = size.shoulderCm - target;
    dims.push({ key: "shoulder", sub: gauss(delta, 2.5), delta, weight: 0.18, sigma: 2.5 });
  }

  if (dims.length === 0) return { score: 0, reason: null };

  // Renormalise weights over present dimensions → chest-only stays identical.
  const wsum = dims.reduce((a, d) => a + d.weight, 0);
  const raw = dims.reduce((a, d) => a + (d.weight / wsum) * d.sub, 0);

  // Message: lead with the chest verdict, but if a secondary dimension fits
  // clearly worse, name it as the binding constraint.
  const worst = dims.slice().sort((a, b) => a.sub - b.sub)[0];
  const chest = dims.find((d) => d.key === "chest");
  const est = profile.chestIsEstimated ? " (regional averages — add yours for accuracy)" : "";
  let msg: string;
  if (chest && Math.abs(chest.delta) < 1.5 && (worst.key === "chest" || worst.sub > 0.82)) {
    msg = `Matches a ${pref} fit for ${dims.map((d) => d.key).join(" + ")}${est}`;
  } else if (worst.key !== "chest" && worst.sub < 0.7) {
    const side = worst.delta > 0 ? "roomy" : "narrow";
    msg = `Chest works, but the ${worst.key} runs ${Math.abs(worst.delta).toFixed(1)}cm ${side}`;
  } else {
    const d = chest?.delta ?? worst.delta;
    const dimName = chest ? "Chest" : worst.key.charAt(0).toUpperCase() + worst.key.slice(1);
    msg =
      d > 0
        ? `${dimName} ${d.toFixed(1)}cm larger than your ${pref} target`
        : `${dimName} ${(-d).toFixed(1)}cm smaller than your ${pref} target`;
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
    const proximity = Math.max(0, 1 - dist * 0.5);
    // A reported DIRECTION is strictly more information than a star rating: we
    // know both the size and which way it misses, and we have already corrected
    // for the miss above. So a directed anchor is trusted on the quality of the
    // REPORT rather than the quality of the fit — otherwise "too tight" would be
    // penalised twice, once by the correction and again by the low star rating it
    // usually comes with, when in fact it is one of the most informative items in
    // the closet.
    const trust = kg.fitDirection != null ? DIRECTED_ANCHOR_TRUST : kg.fitRating / 5;
    const mult = strong ? 1.0 : sameCat ? 0.75 : 0.55;
    const s = proximity * trust * mult;
    if (s > best) {
      best = s;
      const label = `${kg.brand} ${kg.size}`;
      const dirWord = isDirectional(kg.fitDirection) ? describeDirection(kg.fitDirection) : null;
      // Prefer the direction in the explanation when there is one — "runs snug"
      // is a fact the reader recognises, where "1 step from your Uniqlo M" is a
      // conclusion they have to take on trust.
      if (dirWord) {
        bestMsg =
          dist === 0
            ? `Your ${label} runs ${dirWord}, so this is the size that should sit right`
            : `${dist.toFixed(dist % 1 === 0 ? 0 : 1)} step${dist > 1 ? "s" : ""} from your ${label}, which runs ${dirWord}`;
      } else if (strong && preferenceShift(pref) !== 0) {
        // Explain that we shifted from the true-fit anchor for the preference.
        bestMsg =
          dist === 0
            ? `Sized ${preferenceShift(pref) > 0 ? "up" : "down"} from your ${label} for a ${pref} fit`
            : `${dist} step${dist > 1 ? "s" : ""} from your ${pref}-adjusted ${label}`;
      } else if (dist === 0) {
        bestMsg = `Matches your ${label} (${kg.category})`;
      } else {
        bestMsg = `${dist} step${dist > 1 ? "s" : ""} from your ${label}`;
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
): { score: number; reason: Reason | null } {
  if (outcomes.length === 0) return { score: 0, reason: null };
  const sizeAlpha = normalizeToAlpha(size.label);
  let bestPenalty = 0; // negative direction
  let bestBoost = 0;
  let msg = "";
  for (const o of outcomes) {
    const oAlpha = normalizeToAlpha(o.purchasedSize);
    const dist = alphaDistance(sizeAlpha, oAlpha);
    if (dist === null || dist > 1) continue;
    const sameBrand =
      product.brand && o.productBrand?.toLowerCase() === product.brand.toLowerCase();
    const sameCat =
      product.category &&
      o.productCategory?.toLowerCase() === product.category.toLowerCase();
    const mult = sameBrand && sameCat ? 1.0 : sameCat ? 0.6 : 0.4;
    if (o.decision === "return") {
      const p = (1 - dist * 0.5) * mult;
      if (p > bestPenalty) {
        bestPenalty = p;
        msg = `You returned a ${o.purchasedSize} in ${o.productBrand ?? "similar"} (${o.areaIssues ? Object.entries(o.areaIssues).map(([k, v]) => `${k}: ${v}`).join(", ") : "fit issue"})`;
      }
    } else if (o.decision === "keep" && (o.overallFit ?? 0) >= 4) {
      const b = (1 - dist * 0.5) * mult * 0.6;
      if (b > bestBoost) {
        bestBoost = b;
        msg = `You kept a ${o.purchasedSize} in ${o.productBrand ?? "similar"} with a good fit`;
      }
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
function computeConfidence(size: SizeOptionInput, hasKnownGood: boolean, hasChest: boolean): number {
  let c = CONFIDENCE_WEIGHTS.floor;
  if (hasChest && size.chestCm != null) c += CONFIDENCE_WEIGHTS.measurements;
  if (hasKnownGood) c += CONFIDENCE_WEIGHTS.closetAnchor;
  if (size.shoulderCm != null) c += CONFIDENCE_WEIGHTS.chartShoulder;
  if (size.sleeveCm != null) c += CONFIDENCE_WEIGHTS.chartSleeve;
  return Math.min(1, c);
}

/** Plain-language name for a signal, for the conflict note. */
function humanSignal(signal: string): string {
  switch (signal) {
    case "measurement-fit": return "your measurements";
    case "known-good": return "a garment you already own";
    case "outcome": return "what you kept or returned before";
    case "brand-bias": return "how this brand has run for you";
    default: return signal;
  }
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

export function recommend(input: EngineInput): EngineOutput {
  const { profile, product, sizes, knownGood, outcomes } = input;

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
    knownGood.map((k) => ({
      category: k.category,
      garmentChestCm: k.garmentChestCm,
      garmentMeasuredFrom: k.garmentMeasuredFrom,
      fitDirection: k.fitDirection,
    })),
    profile.chestCm,
  );
  const easeUsed = resolveEase(profile.preferredFit, learnedEase);

  const ranked: SizeScore[] = sizes.map((size) => {
    const reasons: Reason[] = [];
    const fit = scoreMeasurementFit(size, profile, profile.preferredFit, product.category, W, easeUsed);
    if (fit.reason) reasons.push(fit.reason);
    const kg = scoreKnownGood(size, product, usableKnownGood, profile.preferredFit, W, sizes);
    if (kg.reason) reasons.push(kg.reason);
    const outc = scoreOutcome(size, product, outcomes, W);
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
    if (domainRelevance === "cross") confidence = Math.min(confidence, 0.35);
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

  // Confidence should track how DECISIVE the top pick is, not only how much data
  // we had: two near-tied sizes is genuine ambiguity (the size-rec literature
  // frames the pick as "most likely to be kept" — a coin-flip deserves lower
  // confidence). Scale every size's confidence by the top-two margin.
  if (ranked.length >= 2) {
    const margin = ranked[0].score - ranked[1].score;
    // margin 0 → ×0.6 (ambiguous); margin ≥0.1 → ×1.0 (decisive).
    const marginFactor = Math.max(0.6, Math.min(1, 0.6 + margin * 4));
    for (const r of ranked) r.confidence = Math.round(r.confidence * marginFactor * 100) / 100;
  }

  // ---- Signal agreement ------------------------------------------------------
  // See signalDisagreement(). A decisive margin is NOT the same as a confident
  // answer: the margin can be decisive precisely because one strong signal
  // overrode the others.
  const ladder = new Map(sizes.map((s, i) => [s.label, i] as const));
  const disagreement = signalDisagreement(ranked, ladder);
  const conflictParts: string[] = [];
  if (disagreement) {
    // One ladder step apart is ordinary tension; two or more means the signals
    // are telling genuinely different stories.
    const agreement = disagreement.distance >= 2 ? 0.65 : 0.8;
    for (const r of ranked) r.confidence = Math.round(r.confidence * agreement * 100) / 100;
    // Phrased without a verb agreeing with the signal name, so every signal
    // reads correctly ("your measurements" is plural, "a garment you own" isn't).
    conflictParts.push(
      `Your signals disagree — by ${humanSignal(disagreement.signal)}, ` +
        `${disagreement.pickedLabel}; by the strongest overall evidence, ` +
        `${ranked[0].label}.`,
    );
  }

  // A size our own measurement model calls plainly wrong cannot be a confident
  // pick, however hard the other signals carry it. Applied per size, since each
  // size carries its own verdict.
  for (const r of ranked) {
    if (r.verdict === "too small" || r.verdict === "too big") {
      r.confidence = Math.min(r.confidence, 0.6);
    }
  }
  if (ranked[0].verdict === "too small" || ranked[0].verdict === "too big") {
    conflictParts.push(
      `On your measurements alone ${ranked[0].label} reads "${ranked[0].verdict}" — ` +
        `we're recommending it on other evidence, so treat this as a starting point ` +
        `and check the chart.`,
    );
  }
  // A lowered confidence must always say why — a smaller number with no reason is
  // just a worse number, which would break the explainability invariant.
  if (consistency.note) conflictParts.push(consistency.note);

  const conflictNote = conflictParts.length > 0 ? conflictParts.join(" ") : null;

  // A regional-average body is a prior, not a fact — cap confidence so the number
  // can never imply we know the user's measurements.
  if (profile.chestIsEstimated) {
    for (const r of ranked) r.confidence = Math.min(r.confidence, 0.4);
  }

  const best = ranked[0];

  // Build the plain-language explanation without an LLM. Grounded, template-based.
  const topReasons = best.reasons
    .slice()
    .sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight))
    .slice(0, 2)
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
      const art = /^[aeiou]/i.test(profile.preferredFit) ? "an" : "a";
      if (target > bestSize.chestCm && bestSize.chestCm === maxChest) {
        edgeNote = `\n• This is the largest size offered — for ${art} ${profile.preferredFit} fit you're at the top of the range.`;
      } else if (target < bestSize.chestCm && bestSize.chestCm === minChest) {
        edgeNote = `\n• This is the smallest size offered — for ${art} ${profile.preferredFit} fit you're at the bottom of the range.`;
      }
    }
  }

  // Nothing told these sizes apart: no signal produced a reason, and every
  // candidate carries the same score. `best` is then the first rung of the
  // ladder and nothing more.
  const undetermined =
    best.reasons.length === 0 &&
    ranked.length > 1 &&
    ranked.every((r) => Math.abs(r.score - best.score) < 1e-6);

  // Suppress the "alternative" line when everything ties — calling the second
  // rung "close" implies the first was ahead of it, and it wasn't.
  const alt =
    !undetermined && !edgeNote && ranked[1] && ranked[1].score > best.score - 0.08
      ? `\nAlternative: ${ranked[1].label} is close — consider it if you prefer ${profile.preferredFit === "slim" ? "extra room" : "a snugger fit"}.`
      : "";
  const explanation = undetermined
    ? "We can't tell these sizes apart yet — we found no size chart we could read against you, " +
      "and nothing in your closet to compare with. Every size here scored the same, so picking " +
      "one would be guessing. Add your chest measurement, or one garment of this type that fits " +
      "you well, and this becomes a real answer."
    : (topReasons.length > 0
        ? topReasons.join("\n")
        : "Limited product data — recommendation based on your closet and preference.") +
      edgeNote +
      alt;

  // Cross-domain disclaimer: the closet is all a different garment domain than
  // what we're sizing, so warn the user plainly.
  let domainNote: string | null = null;
  if (domainRelevance === "cross" && productDomain) {
    const closetList = Array.from(closetDomains).map(humanDomain).join(" & ");
    domainNote =
      `Your closet is ${closetList}, but this is a ${humanDomain(productDomain)} item. ` +
      `Sizing across garment types is unreliable — we're going mostly on your ` +
      `measurements and preference. Add a ${humanDomain(productDomain)} you own for a real recommendation.`;
  }

  return { ranked, best, explanation, undetermined, domainNote, domainRelevance, conflictNote };
}

/** Human name for a size domain, for disclaimers. */
function humanDomain(d: ReturnType<typeof domainForCategory>): string {
  switch (d) {
    case "top": return "top";
    case "bottom": return "bottoms";
    case "shoe": return "footwear";
    case "sock": return "socks";
    case "accessory": return "accessory";
  }
}
