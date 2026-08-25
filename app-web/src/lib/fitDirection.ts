// fitDirection — the SIGNED fit scale.
//
// Why this exists: `KnownGoodItem.fitRating` is a unipolar 1-5 ("how good is the
// fit"). It cannot say WHICH WAY a bad fit is bad — a 2/5 is either strangling
// the wearer or hanging off them, and those imply opposite recommendations. Every
// size-recommendation system in the literature models fit as a BIPOLAR ordinal
// ({Small, Fit, Large}; or too tight … too loose), so the direction is the signal
// the field actually uses, and the closet was discarding it at entry.
//
// The canonical stored value is a signed integer:
//
//     -10 ............ -5 ............ 0 ............ +5 ............ +10
//   too tight      a bit snug     just right     a bit roomy      too loose
//
// Both input modes write THIS scalar, so the engine has exactly one input and one
// set of tests. The descriptive mode is five discrete options; the numeric mode is
// the same range at finer resolution. A mode that meant something different from
// the other would double the engine's surface area for no gain.
//
// See docs/design/closet-signal-and-interaction-cost.md for the full argument.

export const DIRECTION_MIN = -10;
export const DIRECTION_MAX = 10;

export type DirectionOption = {
  key: string;
  label: string;
  value: number;
  /** One-line gloss, shown under the option so the wording isn't guessed at. */
  hint: string;
};

/**
 * The five descriptive options, in the order the body experiences them.
 *
 * Wording follows the apparel-fit literature's too tight / tight / just right /
 * loose / too loose, in ordinary English rather than research register. "Just
 * right" is the middle AND the default: in both public fit datasets the large
 * majority of feedback is "fit" (ModCloth ~75%, RentTheRunway ~74%), so
 * defaulting to the modal answer makes the common case cost zero taps and charges
 * only the rare, informative answers.
 */
export const DIRECTION_OPTIONS: DirectionOption[] = [
  { key: "too-tight", label: "Too tight", value: -10, hint: "You avoid reaching for it" },
  { key: "snug", label: "A bit snug", value: -5, hint: "Wearable, but you notice it" },
  { key: "just-right", label: "Just right", value: 0, hint: "How it should feel" },
  { key: "roomy", label: "A bit roomy", value: 5, hint: "Comfortable, room to spare" },
  { key: "too-loose", label: "Too loose", value: 10, hint: "It hangs off you" },
];

/** The value a new item starts at — the modal answer, so the common case is free. */
export const DIRECTION_DEFAULT = 0;

export type FitScaleMode = "descriptive" | "numeric";

/**
 * Which input mode a user sees. Sticky PER USER, never per item: switching
 * mid-closet would make a person's own data incomparable with itself.
 */
export function parseScaleMode(raw: string | null | undefined): FitScaleMode {
  return raw === "numeric" ? "numeric" : "descriptive";
}

/** Clamp and round an arbitrary number onto the stored scale. */
export function clampDirection(n: number): number {
  if (!Number.isFinite(n)) return DIRECTION_DEFAULT;
  return Math.max(DIRECTION_MIN, Math.min(DIRECTION_MAX, Math.round(n)));
}

/** The descriptive option closest to a stored value. Ties round toward centre. */
export function nearestOption(n: number): DirectionOption {
  const v = clampDirection(n);
  let best = DIRECTION_OPTIONS[0];
  let bestDist = Infinity;
  for (const o of DIRECTION_OPTIONS) {
    const d = Math.abs(o.value - v);
    // Strict `<` keeps the earlier (more central, given the ordering) option on a
    // tie only when it is nearer the centre; compare |value| to break it.
    if (d < bestDist || (d === bestDist && Math.abs(o.value) < Math.abs(best.value))) {
      best = o;
      bestDist = d;
    }
  }
  return best;
}

/** Plain-language description of a stored value, for reasons and summaries. */
export function describeDirection(n: number | null | undefined): string | null {
  if (n == null) return null;
  return nearestOption(n).label.toLowerCase();
}

/**
 * How far the anchor's TRUE size sits from the size actually owned, in ladder
 * steps.
 *
 * A garment the wearer reports as tight means their real size in that brand is
 * LARGER than the one they own, so the target shifts UP — hence the negation.
 * The full range maps to one ladder step: "too tight" (-10) => +1 size,
 * "a bit snug" (-5) => +0.5.
 *
 * One step at the extreme is not arbitrary — it matches the return-shift term in
 * the size-recommendation literature, where a size-related return moves the
 * target size by ±1 (Guigourès et al., RecSys 2018: eta_small ~ N(-1,1),
 * eta_big ~ N(+1,1)). A closet report is the same observation, sourced before a
 * purchase rather than after a return.
 */
export function directionToLadderShift(n: number | null | undefined): number {
  if (n == null) return 0;
  const shift = -clampDirection(n) / 10;
  // Normalise -0 to 0: it compares equal but serialises as "-0" and reads as a
  // direction when there isn't one.
  return shift === 0 ? 0 : shift;
}

/** True when the value is far enough from centre to be worth mentioning. */
export function isDirectional(n: number | null | undefined): boolean {
  return n != null && Math.abs(clampDirection(n)) >= 3;
}

/**
 * Derive the legacy 1-5 `fitRating` from a reported direction.
 *
 * `fitRating` still drives the star display, the badge stats, and the anchor
 * trust for items recorded before the signed scale existed — so it cannot simply
 * be deleted. But asking for BOTH is asking the same question twice: "how far off
 * does this sit" already determines "how well does it fit". Deriving one from the
 * other removes a whole user decision at no cost to anything downstream, which is
 * exactly the trade the interaction-cost budget is meant to find.
 *
 * Monotone in |direction|: dead centre is a 5, one notch out is a 4, and the
 * extremes fall to 2 — never 1, because an item the wearer still keeps in their
 * closet is evidence of something, however badly it sits.
 */
export function ratingFromDirection(n: number | null | undefined): number {
  if (n == null) return 4;
  const d = Math.abs(clampDirection(n));
  if (d <= 1) return 5;
  if (d <= 6) return 4;
  if (d <= 8) return 3;
  return 2;
}
