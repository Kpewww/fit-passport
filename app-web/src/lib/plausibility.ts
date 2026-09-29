// Are the wearer's measurements plausible TOGETHER?
//
// Part of the answer to "people deliberately mess with it" — and to honest typos,
// which are far more common. Every field is bounded on its own by the profile API
// (chest 50–200 cm and so on), but chest 58 with waist 110 passes each bound and
// describes no body. Scoring it confidently would be presenting a recommendation for
// nobody.
//
// Deliberately wide (scoringConstants.PLAUSIBILITY): a real body can be unusual, and
// telling someone their own measurements are wrong when they are not is its own
// failure. So this never refuses and never alters a number. It lowers confidence to
// the same ceiling as a regional-average body, and says exactly which numbers look
// odd together, so the wearer can fix a typo.

import { PLAUSIBILITY } from "./scoringConstants";

export type BodyForPlausibility = {
  chestCm?: number | null;
  waistCm?: number | null;
  shoulderCm?: number | null;
};

/** Plain-language issues; empty when nothing looks wrong. */
export function bodyPlausibility(b: BodyForPlausibility): string[] {
  const issues: string[] = [];
  const { chestCm: c, waistCm: w, shoulderCm: s } = b;
  if (c != null && w != null) {
    if (w - c > PLAUSIBILITY.waistOverChestCm || c - w > PLAUSIBILITY.chestOverWaistCm) {
      issues.push(`chest ${c} cm with waist ${w} cm`);
    }
  }
  if (c != null && s != null) {
    const share = s / c;
    if (share < PLAUSIBILITY.shoulderShareMin || share > PLAUSIBILITY.shoulderShareMax) {
      issues.push(`shoulder ${s} cm with chest ${c} cm`);
    }
  }
  return issues;
}
