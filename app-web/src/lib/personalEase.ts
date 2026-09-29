// A personal ease target, learned from clothes the user already owns.
//
// THE IDEA (docs/design/closet-signal-and-interaction-cost.md §1.2): instead of
// trusting a self-reported "slim / regular / relaxed" label, measure the ease the
// user ACTUALLY lives in — `ease = garment − body`, for every closet garment
// whose own measurements we captured. Revealed preference beats stated
// preference, and the label is a proxy for this number anyway.
//
// That section carried a correction for several sessions saying this was **not
// derivable**, because `KnownGoodItem` stored no garment measurements. Session 67
// captured them at add-by-URL time, which is what unblocked this.
//
// It follows the pollution discipline `brandBias.ts` already established, for the
// same founder concern, and for the same reason — a learned signal that can be
// moved by one bad row is a liability:
//
//   • PER-USER ONLY. Never mixed across people.
//   • MEASURED GARMENTS ONLY. An `estimated` garment chest is the extractor's
//     fallback ladder guessing; a personal target built on a guess is worse than
//     the stated preference it would replace. Provenance is checked, not assumed.
//   • MIN EVIDENCE. Two garments minimum, and full weight needs four.
//   • ROBUST CENTRE. The median, not the mean — one mis-entered measurement
//     should not drag the target.
//   • DISAGREEMENT LOWERS TRUST. A wide spread means we know less, and the blend
//     weight falls accordingly.
//   • CAP. The target can never sit more than one ladder step away from the
//     stated preference. No learned signal moves a recommendation by more than
//     one size on its own — the same ceiling brandBias uses.
//   • EXPLAINABILITY. Every applied target carries a plain-language reason.

import { easeAdjustForCategory, type FitPreference, easeChestCm } from "./sizing";
import { DIRECTION_MAX, clampDirection, directionToLadderShift } from "./fitDirection";
import { PERSONAL_EASE } from "./scoringConstants";

/**
 * Chest centimetres per step of the alpha size ladder.
 *
 * Measured from the real charts in `extractor.ts`: 92/96/100/104/110 steps by
 * 4,4,4,6 and the EU ladder 102/106/110/114/118 by 4,4,4,4. Median 4, mean ~4.3,
 * so 4.5 sits between them. It is the ONE place a direction unit is converted to
 * centimetres, deliberately — `directionToLadderShift` already owns the
 * direction-to-ladder calibration and this must not become a second one.
 */
export const LADDER_STEP_CHEST_CM: number = PERSONAL_EASE.ladderStepChestCm;

/** Fewer than this many usable garments and we do not act at all. */
export const MIN_EVIDENCE: number = PERSONAL_EASE.minEvidence;
/** At this many, the learned target carries its full weight. */
export const FULL_EVIDENCE: number = PERSONAL_EASE.fullEvidence;

export type EaseObservation = {
  category: string;
  /** The garment's own chest circumference, cm. */
  garmentChestCm?: number | null;
  /** Where that number came from — only "page"/"fixture" are trusted. */
  garmentMeasuredFrom?: string | null;
  /** Signed report: negative = ran tight, positive = ran loose. */
  fitDirection?: number | null;
};

export type PersonalEase = {
  /** The learned ease target in cm, category-normalised. Null = not enough evidence. */
  targetCm: number | null;
  /** How many garments contributed. */
  evidence: number;
  /** Median absolute deviation of the implied targets, cm. Null when no target. */
  spreadCm: number | null;
  /** 0..1 — how far to blend the learned target over the stated preference. */
  weight: number;
  reason: string | null;
  /** Reports left out because they contradict the consistent majority. */
  excluded: number;
  /** True when no strict majority of reports agree — nothing is learned. */
  contradiction: boolean;
};

const TRUSTED_PROVENANCE = new Set(["page", "fixture"]);

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/**
 * What ease this user actually wears, in centimetres, normalised so it is
 * directly comparable with `easeChestCm(pref)`.
 *
 * Each garment contributes the ease it has on them, CORRECTED by what they said
 * about it: a garment they called "a bit snug" means their real target is above
 * the ease that garment gave them, not equal to it. That correction is the whole
 * reason a signed direction is worth collecting.
 */
export function personalEaseTarget(
  observations: EaseObservation[],
  bodyChestCm: number | null | undefined,
): PersonalEase {
  const none: PersonalEase = {
    targetCm: null, evidence: 0, spreadCm: null, weight: 0, reason: null, excluded: 0, contradiction: false,
  };
  if (bodyChestCm == null) return none;

  // Each report is an INTERVAL of preferred ease, not a point (Session 78d2).
  //
  // A point — "their target is observed + shift" — cannot be wrong, so it cannot
  // be caught contradicting anything: a garment called "too tight" at +14 cm of
  // room and another called "just right" at +16 cm were simply averaged, though
  // they cannot both be true of one person. As intervals they visibly do not
  // overlap. The width is the resolution of the report itself: descriptive options
  // sit half a size step apart, so a choice pins the preference to within a
  // quarter step either way; the two extremes are open-ended ("too tight" says
  // "at least this much more", with no upper bound).
  const step = LADDER_STEP_CHEST_CM;
  const r = PERSONAL_EASE.feelingResolution * step;
  const reports: Array<{ point: number; lo: number; hi: number }> = [];
  for (const o of observations) {
    if (o.garmentChestCm == null) continue;
    if (!TRUSTED_PROVENANCE.has(o.garmentMeasuredFrom ?? "")) continue;

    // What this garment actually gave them, with the garment TYPE's own
    // allowance removed so a coat and a tee are comparable.
    const observed = o.garmentChestCm - bodyChestCm - easeAdjustForCategory(o.category);
    // …corrected by their verdict on it. `directionToLadderShift` is the
    // calibration of record for the scale; this only converts steps to cm.
    const shift = directionToLadderShift(o.fitDirection);
    const point = observed + shift * step;
    const extreme = o.fitDirection != null && Math.abs(clampDirection(o.fitDirection)) >= DIRECTION_MAX;
    reports.push({
      point,
      lo: extreme && shift < 0 ? -Infinity : point - r,
      hi: extreme && shift > 0 ? Infinity : point + r,
    });
  }

  if (reports.length < MIN_EVIDENCE) {
    return { ...none, evidence: reports.length };
  }

  // The largest set of reports that can all be true at once: the point covered by
  // the most intervals (ties broken toward the median of all reports, so the
  // choice does not depend on input order). Reports outside it are left out and
  // counted — one mis-entered garment should not steer the rest, and should not
  // be silently discarded either.
  const allMedian = median(reports.map((x) => x.point));
  let best = { count: 0, at: allMedian };
  const candidates = reports.flatMap((x) => [x.lo, x.hi, x.point]).filter(Number.isFinite);
  for (const at of candidates) {
    const count = reports.filter((x) => x.lo <= at && at <= x.hi).length;
    if (count > best.count || (count === best.count && Math.abs(at - allMedian) < Math.abs(best.at - allMedian))) {
      best = { count, at };
    }
  }
  const consistent = reports.filter((x) => x.lo <= best.at && best.at <= x.hi);
  const excluded = reports.length - consistent.length;

  // No strict majority agrees: the reports describe more than one person, or the
  // measurements behind them are wrong. Learning a number from that would be
  // inventing one, so nothing is learned and the wearer is told why.
  if (consistent.length <= reports.length * PERSONAL_EASE.majority || consistent.length < MIN_EVIDENCE) {
    return { ...none, evidence: reports.length, excluded, contradiction: excluded > 0 };
  }

  const lo = Math.max(...consistent.map((x) => x.lo));
  const hi = Math.min(...consistent.map((x) => x.hi));
  const target = Math.min(hi, Math.max(lo, median(consistent.map((x) => x.point))));
  const spread = median(consistent.map((x) => Math.abs(x.point - target)));

  // Evidence raises the weight; disagreement lowers it. A spread of a whole
  // ladder step means these garments do not describe one preference, and the
  // number should not be trusted as though they did.
  const byCount = Math.min(1, (consistent.length - 1) / (FULL_EVIDENCE - 1));
  const byAgreement = Math.max(0, 1 - spread / LADDER_STEP_CHEST_CM);
  const weight = byCount * byAgreement;

  return {
    targetCm: target,
    evidence: consistent.length,
    spreadCm: spread,
    weight,
    reason: null, // filled in by resolveEase, which knows what it replaced
    excluded,
    contradiction: false,
  };
}

export type ResolvedEase = {
  /** The ease the engine should use, cm. */
  easeCm: number;
  /** True when the closet moved it off the stated preference. */
  personalised: boolean;
  reason: string | null;
  /**
   * Set when the wearer's own reports contradict each other so that nothing could
   * be learned. The engine puts it in the explanation: a closet that was IGNORED
   * must say so as plainly as one that was used.
   */
  contradiction: string | null;
};

/**
 * The ease to score with: the stated preference, moved towards what the user
 * actually wears, by as much as the evidence supports.
 *
 * CAPPED at one ladder step from the stated preference. A learned signal that can
 * move a recommendation by two sizes on its own is a liability, and this is the
 * same ceiling `brandBias` applies for the same reason.
 */
export function resolveEase(pref: FitPreference, learned: PersonalEase): ResolvedEase {
  const stated = easeChestCm(pref);
  if (learned.contradiction) {
    return {
      easeCm: stated,
      personalised: false,
      reason: null,
      contradiction:
        `Your fit reports on ${learned.evidence} measured garments contradict each other — ` +
        `some say you want more room than others give you — so we used your stated ` +
        `${pref} fit instead of learning from them. Re-rating one or two would settle it.`,
    };
  }
  if (learned.targetCm == null || learned.weight <= 0) {
    return { easeCm: stated, personalised: false, reason: null, contradiction: null };
  }

  const blended = stated + (learned.targetCm - stated) * learned.weight;
  const capped = Math.max(
    stated - LADDER_STEP_CHEST_CM,
    Math.min(stated + LADDER_STEP_CHEST_CM, blended),
  );

  // Under a fifth of a centimetre is not a difference anyone can wear, and
  // claiming to have personalised something is a claim we should only make when
  // it changed the arithmetic.
  if (Math.abs(capped - stated) < PERSONAL_EASE.noticeableCm) {
    return { easeCm: stated, personalised: false, reason: null, contradiction: null };
  }

  const dir = capped > stated ? "more room" : "less room";
  return {
    easeCm: capped,
    personalised: true,
    reason:
      `Adjusted to the ${dir} you actually wear — from ${learned.evidence} ` +
      `garment${learned.evidence === 1 ? "" : "s"} in your closet whose own ` +
      `measurements we have (${capped.toFixed(1)}cm target vs ${stated}cm for ${pref})` +
      (learned.excluded > 0
        ? `; ${learned.excluded} garment${learned.excluded === 1 ? "" : "s"} left out because ` +
          `${learned.excluded === 1 ? "its report contradicts" : "their reports contradict"} the others.`
        : "."),
    contradiction: null,
  };
}
