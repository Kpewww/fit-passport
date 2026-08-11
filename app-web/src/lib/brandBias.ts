// Per-user brand-bias learning.
//
// If the user has repeatedly reported that a given brand runs BIG (returned too
// loose, or areas marked "loose") they probably want to size DOWN in that brand.
// Vice versa if it runs SMALL. This module derives a per-brand shift in
// half-steps of the alpha ladder from that user's own outcomes.
//
// Pollution guards (founder's concern about "user pollution"):
//   • PER-USER ONLY. We never mix outcomes from other users. Cross-user brand
//     priors could come later with volume thresholds + outlier trimming, but
//     personalization stays first-class.
//   • MIN-EVIDENCE THRESHOLD. Need ≥2 outcomes pointing the SAME direction for
//     the same brand before we act.
//   • CANCELLATION. Contradictory signals (some too big, some too small) cancel
//     — one report doesn't dominate the other.
//   • CAP. The shift is capped at ±1 alpha step. No single feedback loop can
//     ever move a recommendation more than one size.
//   • EXPLAINABILITY. Every shift attaches a plain-language Reason so the
//     transparent-engine story stays intact.
//
// Nothing about this depends on the LLM; it's a small deterministic function.

export type OutcomeSignal = {
  productBrand: string | null;
  decision: "keep" | "return" | "exchange";
  overallFit?: number | null;
  areaIssues?: Record<string, string> | null;
};

export type BrandBias = {
  // Direction the brand runs FOR THIS USER, from THIS USER's outcomes:
  //   "big"   → the user tends to swim in it → size DOWN 1 step
  //   "small" → the user tends to be tight in it → size UP 1 step
  //   "neutral" → not enough evidence, or evidence cancels out
  direction: "big" | "small" | "neutral";
  evidence: number; // # of contributing outcomes
  shift: -1 | 0 | 1; // alpha-ladder step applied downstream
  reason: string | null; // human explanation; null if no shift
};

// Words in areaIssues.values() that imply the size ran BIG on this user.
const BIG_WORDS = new Set(["loose", "long", "roomy", "big"]);
// Words that imply it ran SMALL.
const SMALL_WORDS = new Set(["tight", "short", "small", "narrow"]);

/** Classify one outcome into a directional vote for this brand. */
function voteFor(o: OutcomeSignal): "big" | "small" | null {
  const areas = o.areaIssues ?? {};
  let big = 0;
  let small = 0;
  for (const v of Object.values(areas)) {
    const w = String(v).toLowerCase();
    if (BIG_WORDS.has(w)) big++;
    else if (SMALL_WORDS.has(w)) small++;
  }
  // Decision-based tie-breakers when no area data.
  if (big === 0 && small === 0) {
    if (o.decision === "return" && (o.overallFit ?? 5) <= 2) {
      // A very poor overall fit without direction — no directional vote.
      return null;
    }
    return null;
  }
  if (big > small) return "big";
  if (small > big) return "small";
  return null;
}

/**
 * Compute the shift for one brand from a user's outcomes for THAT brand only.
 * Caller is expected to pass only outcomes whose productBrand matches.
 */
export function biasForBrand(brand: string, outcomes: OutcomeSignal[]): BrandBias {
  const same = outcomes.filter(
    (o) => o.productBrand && o.productBrand.toLowerCase() === brand.toLowerCase(),
  );
  let big = 0;
  let small = 0;
  for (const o of same) {
    const v = voteFor(o);
    if (v === "big") big++;
    else if (v === "small") small++;
  }
  const evidence = big + small;
  const MIN = 2; // volume threshold
  const net = big - small;

  if (evidence < MIN || net === 0) {
    return { direction: "neutral", evidence, shift: 0, reason: null };
  }
  if (net > 0) {
    // Ran big → size down. Cap at −1.
    return {
      direction: "big",
      evidence,
      shift: -1,
      reason: `You've reported ${big} ${brand} item${big === 1 ? "" : "s"} running too big — sized down one.`,
    };
  }
  return {
    direction: "small",
    evidence,
    shift: 1,
    reason: `You've reported ${small} ${brand} item${small === 1 ? "" : "s"} running too small — sized up one.`,
  };
}
