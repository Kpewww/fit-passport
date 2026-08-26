// Population body prior — a COLD-START-ONLY, low-confidence default.
//
// When a first-time visitor pastes a URL with no measurements entered, the engine
// has nothing to compare against a size chart. A weak default body — grounded in
// PUBLISHED national anthropometric surveys, keyed off the user's self-reported
// REGION and sex — lets the measurement path produce *something* explainable
// instead of a pure guess, while making its low confidence obvious.
//
// GOVERNANCE (see docs/design/fit-algorithm-research.md §4b) — inferring anything
// about a body from population statistics is the most sensitive thing this code
// does, so the rules are stated here rather than left implicit:
//   • This is a PRIOR ONLY. The moment the user has any real measurement, closet
//     anchor, or outcome, that dominates — the prior never overrides real data and
//     never narrows what a person is shown.
//   • Keyed off the existing self-reported `region` field. Region ≠ ethnicity. We
//     NEVER infer, ask for, or store ethnicity, and never expose these numbers.
//   • Coarse population MEANS, not a claim about any individual. Always surfaced as
//     "based on regional averages — add yours for accuracy."
//
// Numbers are approximate adult means (chest circumference, cm) drawn from the
// standard anthropometric references — US SizeUSA / ANSUR II, UK SizeUK, EU
// EN 13402 populations, Japan HQL/AIST, China SizeChina / GB/T 1335. They are
// deliberately rounded: a prior does not need survey precision, and overstating
// precision would misrepresent it. Chinese/Japanese ready-to-wear also runs
// smaller, consistent with the smaller population means here.

export type PriorSex = "male" | "female";
export type PriorRegion = "US" | "EU" | "UK" | "JP" | "CN";

export type BodyPrior = {
  chestCm: number;
  waistCm: number;
  shoulderCm: number;
};

// chest circumference (cm), coarse population means.
const CHEST_MEAN: Record<PriorRegion, Record<PriorSex, number>> = {
  US: { male: 105, female: 100 },
  UK: { male: 104, female: 99 },
  EU: { male: 102, female: 97 },
  JP: { male: 94, female: 87 },
  CN: { male: 92, female: 85 },
};

function normalizeRegion(region?: string | null): PriorRegion | null {
  const r = (region ?? "").trim().toUpperCase();
  return r === "US" || r === "EU" || r === "UK" || r === "JP" || r === "CN" ? r : null;
}

function normalizeSex(sex?: string | null): PriorSex | null {
  const s = (sex ?? "").trim().toLowerCase();
  return s === "male" || s === "female" ? s : null;
}

/**
 * Coarse body prior for a region + sex, or null when either is unknown (we do
 * NOT guess sex — that would be both inaccurate and a governance smell). Waist and
 * shoulder are derived from the chest mean by the usual population proportions
 * (men carry a larger chest-to-waist drop than women; shoulder ≈ 0.43–0.44× chest).
 */
export function regionBodyPrior(region?: string | null, sex?: string | null): BodyPrior | null {
  const r = normalizeRegion(region);
  const s = normalizeSex(sex);
  if (!r || !s) return null;
  const chestCm = CHEST_MEAN[r][s];
  const waistCm = Math.round(chestCm - (s === "male" ? 13 : 17));
  const shoulderCm = Math.round(chestCm * (s === "male" ? 0.44 : 0.41));
  return { chestCm, waistCm, shoulderCm };
}
