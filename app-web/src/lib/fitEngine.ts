// Fit Engine — transparent, rule/score-based size recommender.
//
// Design principle (from the Fit Passport proposal, §10.2):
//   "The first model does not need to be a proprietary machine-learning system.
//    A transparent scoring model is preferable for the course because it can be
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
  normalizeToAlpha,
  preferenceShift,
  type AlphaSize,
  type FitPreference,
} from "./sizing";
import { domainForCategory } from "./sizeSystems";
import { biasForBrand, type BrandBias } from "./brandBias";

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
  region?: string | null;
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
  signal: "chest-fit" | "known-good" | "preference" | "outcome" | "completeness" | "brand-bias";
  weight: number; // contribution to this size's score, positive = supports
  message: string;
};

export type SizeScore = {
  label: string;
  normalized: AlphaSize | null;
  score: number; // 0..1 (higher = better)
  confidence: number; // 0..1
  reasons: Reason[];
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
  // Set when the closet evidence is a different domain than the product, so the
  // UI can warn the recommendation is weak. Null when evidence is on-domain.
  domainNote: string | null;
  domainRelevance: DomainRelevance;
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

/**
 * Score how well one size matches the user's chest circumference given their
 * preferred fit. Uses a soft Gaussian around the target chest = body + ease.
 */
function scoreChestFit(
  size: SizeOptionInput,
  bodyChestCm: number | null | undefined,
  pref: FitPreference,
  W: Weights,
): { score: number; reason: Reason | null } {
  if (bodyChestCm == null || size.chestCm == null) {
    return { score: 0, reason: null };
  }
  const targetGarment = bodyChestCm + easeChestCm(pref);
  const delta = size.chestCm - targetGarment;
  // sigma ~ 4cm — beyond ~8cm off, score collapses.
  const sigma = 4;
  const raw = Math.exp(-(delta * delta) / (2 * sigma * sigma));
  const msg =
    Math.abs(delta) < 1.5
      ? `Chest matches your ${pref} target (${bodyChestCm.toFixed(0)}+${easeChestCm(pref)}cm ease)`
      : delta > 0
        ? `Chest ${delta.toFixed(1)}cm larger than your ${pref} target`
        : `Chest ${(-delta).toFixed(1)}cm smaller than your ${pref} target`;
  return {
    score: raw,
    reason: { signal: "chest-fit", weight: W.chestFit * raw, message: msg },
  };
}

/**
 * Boost a size if it matches (or is adjacent to) a known-good garment.
 * Same-brand-same-category is worth more than cross-brand.
 */
function scoreKnownGood(
  size: SizeOptionInput,
  product: EngineInput["product"],
  knownGood: KnownGoodInput[],
  pref: FitPreference,
  W: Weights,
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

    // The anchor size is the user's TRUE FIT in this reference. The size they
    // actually want depends on their fit preference: a same-brand+same-category
    // anchor is a reliable baseline that the preference shifts up or down. For
    // weaker (cross-brand) anchors we don't apply the preference shift, since
    // the ladder alignment across brands is already approximate.
    const strong = !!(sameBrand && sameCat);
    const targetIdx = strong ? kgIdx + preferenceShift(pref) : kgIdx;
    const dist = Math.abs(sizeIdx - targetIdx);

    // Base falloff by ladder distance.
    const proximity = Math.max(0, 1 - dist * 0.5);
    const trust = kg.fitRating / 5;
    const mult = strong ? 1.0 : sameCat ? 0.75 : 0.55;
    const s = proximity * trust * mult;
    if (s > best) {
      best = s;
      const label = `${kg.brand} ${kg.size}`;
      if (strong && preferenceShift(pref) !== 0) {
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
  let c = 0.3;
  if (hasChest && size.chestCm != null) c += 0.35;
  if (hasKnownGood) c += 0.25;
  if (size.shoulderCm != null) c += 0.05;
  if (size.sleeveCm != null) c += 0.05;
  return Math.min(1, c);
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
    ? biasForBrand(brand, outcomes.map((o) => ({
        productBrand: o.productBrand ?? null,
        decision: o.decision,
        overallFit: o.overallFit ?? null,
        areaIssues: o.areaIssues ?? null,
      })))
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

  const ranked: SizeScore[] = sizes.map((size) => {
    const reasons: Reason[] = [];
    const chest = scoreChestFit(size, profile.chestCm, profile.preferredFit, W);
    if (chest.reason) reasons.push(chest.reason);
    const kg = scoreKnownGood(size, product, usableKnownGood, profile.preferredFit, W);
    if (kg.reason) reasons.push(kg.reason);
    const outc = scoreOutcome(size, product, outcomes, W);
    if (outc.reason) reasons.push(outc.reason);
    const bias = scoreBrandBiasForSize(size, brandBias, refIdx);
    if (bias) reasons.push(bias);

    const score = combine(reasons, W.minDataFloor);
    let confidence = computeConfidence(size, usableKnownGood.length > 0, profile.chestCm != null);
    // Cross-domain closet evidence should not lend confidence: cap it hard.
    if (domainRelevance === "cross") confidence = Math.min(confidence, 0.35);
    return {
      label: size.label,
      normalized: normalizeToAlpha(size.label),
      score,
      confidence,
      reasons,
    };
  });

  ranked.sort((a, b) => b.score - a.score);
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
  if (profile.chestCm != null && best.reasons.some((r) => r.signal === "chest-fit")) {
    const bestSize = sizes.find((s) => s.label === best.label);
    const target = profile.chestCm + easeChestCm(profile.preferredFit);
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

  const alt =
    !edgeNote && ranked[1] && ranked[1].score > best.score - 0.08
      ? `\nAlternative: ${ranked[1].label} is close — consider it if you prefer ${profile.preferredFit === "slim" ? "extra room" : "a snugger fit"}.`
      : "";
  const explanation =
    (topReasons.length > 0
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

  return { ranked, best, explanation, domainNote, domainRelevance };
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
