// Per-user brand-bias learning.
//
// If the user has repeatedly reported that a given brand runs BIG (returned too
// loose, or areas marked "loose") they probably want to size DOWN in that brand.
// Vice versa if it runs SMALL. This module derives a per-brand shift in
// half-steps of the alpha ladder from that user's own outcomes AND from the
// signed fit directions recorded against their closet.
//
// WHY THE CLOSET MATTERS HERE: outcomes require a purchase to have happened and
// been recorded, which most users never do — so brand bias used to be dead weight
// on day one. A signed closet report is the same observation available immediately,
// which is the cold-start fix.
//
// Pollution guards (founder's concern about "user pollution"):
//   • PER-USER ONLY. We never mix outcomes from other users. Cross-user brand
//     priors could come later with volume thresholds + outlier trimming, but
//     personalization stays first-class.
//   • MIN-EVIDENCE THRESHOLD. Need ≥2 outcomes pointing the SAME direction for
//     the same brand before we act.
//   • CANCELLATION. Contradictory signals (some too big, some too small) cancel
//     — one report doesn't dominate the other.
//   • NO DOUBLE COUNTING. Closet items in the SAME category as the product are
//     excluded here, because scoreKnownGood already moves the anchor by their
//     direction. This module generalises ACROSS categories ("your Uniqlo shirts
//     and jackets both run small, so expect the same of this tee"), so the two
//     paths are disjoint by construction rather than by tuning.
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

/**
 * One closet item's signed report, as a brand-level vote. `fitDirection` uses the
 * scale in fitDirection.ts: negative = ran tight, positive = ran loose.
 */
export type ClosetSignal = {
  brand: string;
  category: string;
  fitDirection?: number | null;
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
 * A closet item votes only if it reported a direction clearly enough to mean
 * something. |direction| >= 3 is the same threshold isDirectional() uses, so a
 * garment sitting essentially right never nudges a brand either way.
 */
function closetVote(c: ClosetSignal): "big" | "small" | null {
  const d = c.fitDirection;
  if (d == null || Math.abs(d) < 3) return null;
  return d > 0 ? "big" : "small"; // ran loose => brand runs big
}

/**
 * Compute the shift for one brand from a user's outcomes and closet reports for
 * THAT brand.
 *
 * `excludeCategory` is the product's own garment type. Closet items of that type
 * are left out because the anchor path already applies their direction — see the
 * NO DOUBLE COUNTING note at the top.
 */
export function biasForBrand(
  brand: string,
  outcomes: OutcomeSignal[],
  closet: ClosetSignal[] = [],
  excludeCategory?: string | null,
): BrandBias {
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
  const ex = excludeCategory?.toLowerCase() ?? null;
  for (const c of closet) {
    if (c.brand.toLowerCase() !== brand.toLowerCase()) continue;
    if (ex && c.category.toLowerCase() === ex) continue;
    const v = closetVote(c);
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
      reason: `You've reported ${big} ${brand} item${big === 1 ? "" : "s"} running big — sized down one.`,
    };
  }
  return {
    direction: "small",
    evidence,
    shift: 1,
    reason: `You've reported ${small} ${brand} item${small === 1 ? "" : "s"} running small — sized up one.`,
  };
}
