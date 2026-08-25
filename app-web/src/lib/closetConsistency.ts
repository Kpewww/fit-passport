// How CONSISTENT a person's closet reports are — and what that says about how
// much we can claim to know them.
//
// The rule, stated plainly:
//
//   Confidence should rise when a wearer's reports agree with each other, and
//   fall when they are scattered.
//
// Someone whose tops all read "just right" is a person we can predict. Someone
// whose tops run from "too tight" to "too loose" is not — either they genuinely
// own a mixed wardrobe, or their reporting is noisy. **Either way we know less
// about them**, and the honest response is a smaller number with a stated reason.
//
// This is the same principle the engine already applies in `signalDisagreement()`
// — disagreement among independent estimators IS an uncertainty estimate — turned
// on a different axis: variance WITHIN one user rather than BETWEEN signals.
//
// It deliberately moves ONLY the confidence, never the recommended size. That
// keeps it disjoint from the anchor correction and from brand bias, both of which
// move the size, so no observation is counted twice.
//
// NOTE ON SCOPE. An earlier draft of the design proposed deriving a personal ease
// target in CENTIMETRES (`ease = garment − body`, per category). That is not
// derivable today: `KnownGoodItem` stores no garment measurements, so for most
// items the garment side of that subtraction does not exist. This module is the
// part of that idea which the current data can actually support — agreement
// measured in reported direction rather than in centimetres. See
// docs/design/closet-signal-and-interaction-cost.md §1.2.

import { clampDirection } from "./fitDirection";

export type ConsistencyInput = {
  category: string;
  fitDirection?: number | null;
};

export type Consistency = {
  /** How many reports contributed. Below MIN_REPORTS nothing is claimed. */
  n: number;
  /** Mean absolute deviation from the wearer's own average report. */
  spread: number;
  /** Multiplier applied to confidence. 1 = no opinion. */
  factor: number;
  /** Surfaced when the factor is below 1, per the explainability invariant. */
  note: string | null;
};

/** Under this many reports we have no basis for an opinion either way. */
const MIN_REPORTS = 3;

/** Spread at or below this reads as a consistent wearer. */
const TIGHT_SPREAD = 2;
/** Spread at or above this reads as scattered. */
const WIDE_SPREAD = 6;

/** The most confidence can be reduced for scatter. */
const MIN_FACTOR = 0.85;

const NEUTRAL: Consistency = { n: 0, spread: 0, factor: 1, note: null };

/**
 * Measure agreement among the wearer's reports for one garment domain.
 *
 * `sameDomain` selects which items are comparable — shirts should not be averaged
 * against shoes. The caller passes the predicate so this module stays free of the
 * garment taxonomy.
 */
export function reportConsistency(
  items: ConsistencyInput[],
  sameDomain: (category: string) => boolean,
): Consistency {
  const values = items
    .filter((i) => i.fitDirection != null && sameDomain(i.category))
    .map((i) => clampDirection(i.fitDirection as number));

  if (values.length < MIN_REPORTS) return NEUTRAL;

  const mean = values.reduce((a, v) => a + v, 0) / values.length;
  const spread = values.reduce((a, v) => a + Math.abs(v - mean), 0) / values.length;

  if (spread <= TIGHT_SPREAD) {
    // Consistent. Deliberately NOT a boost: agreement among a wearer's own
    // reports is what we already assume when we use the closet at all, so
    // rewarding it would double-count the assumption. Neutral is the honest
    // reading — this rule exists to catch scatter, not to hand out certainty.
    return { n: values.length, spread, factor: 1, note: null };
  }

  const t = Math.min(1, (spread - TIGHT_SPREAD) / (WIDE_SPREAD - TIGHT_SPREAD));
  const factor = 1 - t * (1 - MIN_FACTOR);

  return {
    n: values.length,
    spread,
    factor,
    note:
      "Your closet reports disagree with each other — some of these run tight for you and " +
      "some run loose — so we're less sure which you want here.",
  };
}
