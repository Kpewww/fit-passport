// Every number the size scorer uses, and where each one came from.
//
// WHY THIS FILE EXISTS. The founder asked for a scoring system that cannot
// hallucinate. An engine that never invents MEASUREMENTS (invariants ㊼, ⑪, (59))
// can still present invented CONSTANTS as if they were facts: a sigma of 4 cm, a
// confidence floor of 30%, a cap of 0.6. Before this registry those lived as bare
// literals across six modules, several with a comment implying more authority than
// they had — the literature the engine cites supports the SHAPE of the model
// (bipolar fit verdicts, fit as a multi-measurement signal), not one of its values.
//
// So every constant here carries a provenance, and `scoringConstants.test.ts`
// enforces three things:
//   1. every value has a provenance entry, and every entry names a real value;
//   2. every "assumed" value is listed in docs/design/scoring-system.md's
//      calibration table — the public list of numbers we have not yet earned;
//   3. nothing is "measured" or "cited" without saying what, and how many.
//
// THE THREE PROVENANCES, strictly:
//   measured — computed from data we hold, with the n stated in `source`.
//   cited    — a published source states this value (not just the idea).
//   assumed  — a judgement, usually tuned by hand against a handful of cases.
//              Honest, not shameful: every scorer starts here. What is not
//              honest is presenting one of these as a fact. They become measured
//              when the evaluation has ground truth (todo/people/01).
//
// This module has NO imports on purpose: `confidenceWeights.ts` re-exports from
// it, and /check's client bundle imports that (invariant ㉟).

export type Provenance = "measured" | "cited" | "assumed";
export type ConstantSource = { provenance: Provenance; source: string };

// ---------------------------------------------------------------------------
// How much each signal counts toward a size's SCORE.
// ---------------------------------------------------------------------------

/** Signal weights when no same-brand closet anchor exists. */
export const DEFAULT_WEIGHTS = {
  chestFit: 0.45,
  knownGood: 0.35,
  preferenceBonus: 0.05,
  outcomePenalty: 0.15,
  minDataFloor: 0.2,
} as const;

/** Signal weights once a strong same-brand, same-category anchor exists ([F1]). */
export const ANCHOR_WEIGHTS = {
  chestFit: 0.18,
  knownGood: 0.62,
  preferenceBonus: 0.05,
  outcomePenalty: 0.15,
  minDataFloor: 0.2,
} as const;

export const BRAND_BIAS_WEIGHT = 0.15;

/** A seller's per-size height and weight (Session 100, todo 11): a weak signal, read
 *  only for a wearer with no chest of their own and no closet anchor. */
export const SELLER_RANGE = { weight: 0.2, outsideSigmaCm: 4, outsideSigmaKg: 4 } as const;

/** Per-dimension weight inside the measurement score, and each one's tolerance. */
export const DIMENSIONS = {
  chest: { weight: 0.6, sigmaCm: 4 },
  waist: { weight: 0.22, sigmaCm: 4, easeFactor: 0.8 },
  shoulder: { weight: 0.18, sigmaCm: 2.5 },
  /** Dresses and jumpsuits only (Session 84): sized by bust, waist AND hip. */
  hip: { weight: 0.6, sigmaCm: 4, easeFactor: 0.5 },
} as const;

/** Scoring a wearer against a BODY range (bodyRangeFit). */
export const BODY_RANGE = {
  /** Score floor anywhere inside the range. */
  insideFloor: 0.85,
  /** Extra score for sitting at the range's centre. */
  insideSpan: 0.15,
  /** Outside the range: pushes the verdict past the edge, and the fall-off. */
  outsidePushCm: 4,
  outsideSigmaCm: 4,
} as const;

/** Chest delta (cm, garment-relative) at which each ordinal verdict begins. */
export const VERDICT_CM = {
  tooSmall: -6,
  snug: -2,
  relaxed: 2,
  tooBig: 6,
} as const;

/** Which dimension is named as binding in the reason. */
export const BINDING = {
  chestNearCm: 1.5,
  strongSub: 0.82,
  weakSub: 0.7,
} as const;

/** How a closet anchor contributes. */
export const KNOWN_GOOD = {
  /** fitRating at or above this counts as a strong anchor (see ⑮). */
  strongRating: 4,
  /** Trust given to an anchor with a signed direction (⑯). */
  directedTrust: 0.9,
  /** Score lost per ladder step between the anchor and a size. */
  perStep: 0.5,
  mult: { strong: 1.0, sameCategory: 0.75, other: 0.55 },
  /**
   * A same-brand, same-category piece of a different style from the product (a
   * crew-neck when buying a cardigan; styleWords.ts) — or one whose name names no
   * style, when the closet also holds a piece of the product's own style — counts
   * for this much of a same-style one. Session 88b.
   */
  styleMismatch: 0.6,
} as const;

/** How a past keep/return moves a size (scoreOutcome). */
export const OUTCOME = {
  perStep: 0.5,
  keepBoost: 0.6,
  goodFitRating: 4,
  mult: { sameBrandCategory: 1.0, sameCategory: 0.6, other: 0.4 },
} as const;

// ---------------------------------------------------------------------------
// CONFIDENCE — what the percentage on screen is made of.
// ---------------------------------------------------------------------------

/**
 * What each piece of evidence adds. Imported by /check to state what adding a
 * measurement or a closet garment is worth, so the UI's promise and the scorer's
 * arithmetic are the same numbers (see confidenceWeights.ts).
 */
// Defined in the leaf module so the UI can import it without this registry.
export { CONFIDENCE_WEIGHTS } from "./confidenceWeights";

/** Ceilings. Each can only lower a confidence. */
export const CONFIDENCE_CAPS = {
  /** Closet evidence from a different garment domain. */
  crossDomain: 0.35,
  /** A size our own measurement model calls too small / too big. */
  verdictOff: 0.6,
  /** The body is a regional average, not the wearer's own. */
  estimatedBody: 0.4,
  /** The wearer's own measurements are implausible together (PLAUSIBILITY). */
  implausibleBody: 0.4,
  /** By where the size chart came from (applied at the route). */
  provenance: { estimated: 0.5, "brand-chart": 0.75, seller: 0.75 },
  /** A rough guess from a small closet when nothing else applied (roughGuess.ts):
   *  a piece placed across garment types or brands. Below crossDomain on purpose. */
  roughGuess: 0.3,
  /** The same, from a same-brand piece whose size label the page offers. */
  roughSameLabel: 0.45,
} as const;

/** How hard a rough guess pushes its size, as a fraction of the closet weight: only
 *  enough to break a dead heat, which is the only time it runs. */
export const ROUGH_GUESS_WEIGHT = 0.25;

/**
 * Stability — does the pick survive the noise already in its inputs (stability.ts)?
 * Replaced the top-two score margin factor in Session 78: same idea, measured in the
 * wearer's own centimetres instead of score units, and explainable on screen.
 */
export const STABILITY = {
  /** How far a self-taken chest or waist measurement can plausibly be off. */
  bodyNoiseCm: 2,
  /** How far a retailer's chart can plausibly be off. */
  chartNoiseCm: 1,
  /** Grid resolution: ±½ and ±1 × noise for the body, ±1 × noise for the chart. */
  bodySteps: 2,
  chartSteps: 1,
  /** Confidence kept at a dead heat (agreement ½); full agreement keeps all of it. */
  floor: 0.6,
  /**
   * Below this agreement the answer is called fragile, and the reason says so:
   * when a quarter or more of plausible measurements would change the answer.
   */
  fragileBelow: 0.75,
  /** Range and resolution of the "holds for chest X–Y cm" scan. */
  holdScanCm: 8,
  holdScanStepCm: 0.5,
} as const;

/** Confidence × this when signals point at different sizes. */
export const AGREEMENT = { oneStep: 0.8, twoPlusSteps: 0.65 } as const;

/** Tie handling. */
export const TIE = { epsilon: 1e-6, alternativeWithin: 0.08 } as const;

/**
 * One-off listings (Session 80, listingJudgement.ts): a seller's tape measure, and
 * how sure a judgement may say it is. A judgement is not a ranking, so it has no
 * margin to compute a confidence from; its strength comes from what it rests on.
 */
export const LISTING = {
  /**
   * How far a seller's flat width can be off by rounding alone, in cm, each way:
   * listings are written to the nearest half inch (21.5", 22"), so up to a quarter
   * inch. Tape error on top of that is not modelled — the judgement says so when
   * it is close.
   */
  flatNoiseCm: 0.64,
  /** The confidence stored for a judgement, by its strength. */
  confidence: { strong: 0.75, moderate: 0.55, weak: 0.35 },
} as const;

// ---------------------------------------------------------------------------
// EASE — how much room each stated preference means.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// CATEGORY MODEL — asking a classifier when no word rule knows the name (84c).
// ---------------------------------------------------------------------------

export const CATEGORY_MODEL = {
  /** Below this the answer is not used and the shopper is asked instead. */
  minConfidence: 0.65,
  timeoutMs: 3000,
  maxStateChars: 400,
  cacheEntries: 500,
} as const;

export const EASE_CM = { slim: 6, regular: 10, relaxed: 16, oversized: 22 } as const;

export const CATEGORY_EASE_CM = {
  coat: 8,
  jacket: 6,
  parka: 6,
  hoodie: 4,
  sweatshirt: 4,
  blazer: 3,
  tank: -3,
  tanktop: -3,
  "base-layer": -3,
} as const;

// ---------------------------------------------------------------------------
// LEARNING from the wearer's own closet.
// ---------------------------------------------------------------------------

export const CONSISTENCY = {
  minReports: 3,
  tightSpread: 2,
  wideSpread: 6,
  minFactor: 0.85,
} as const;

export const PERSONAL_EASE = {
  /**
   * One size step of chest, in cm — the ONE conversion from a fit feeling to
   * centimetres (a full "too tight" = one step). Measured from the brands' own
   * published charts; `scoringConstants.test.ts` recomputes it from them.
   */
  ladderStepChestCm: 8.3,
  minEvidence: 2,
  fullEvidence: 4,
  /** Below this, a learned target is not a difference anyone can wear. */
  noticeableCm: 0.2,
  /**
   * How precisely one fit report pins the wearer's preferred ease, as a fraction of
   * a size step either way. The descriptive options sit half a step apart, so
   * choosing one says "nearer this than its neighbours": ± a quarter step.
   */
  feelingResolution: 0.25,
  /** Learn only when MORE than this share of the reports agree with each other. */
  majority: 0.5,
  /**
   * A report implying a preferred ease further than this many size steps beyond the
   * slim…oversized range is not a preference — it is a wrong garment or body number.
   */
  plausibleMarginSteps: 2,
} as const;

/**
 * Body measurements that are implausible TOGETHER — deliberately wide, because a real
 * body can be unusual; these catch typos (chest 58 with waist 110) and nonsense, not
 * shapes. Each only lowers confidence and asks; nothing is refused or changed.
 */
export const PLAUSIBILITY = {
  /** Waist this much above chest. */
  waistOverChestCm: 35,
  /** Chest this much above waist. */
  chestOverWaistCm: 55,
  /** Shoulder breadth as a share of chest circumference. */
  shoulderShareMin: 0.3,
  shoulderShareMax: 0.65,
} as const;

/**
 * The development evaluation (eval/lib.ts) — not used by the product. Lives here so
 * the number that defines "confidently wrong" has a provenance like every other.
 */
export const EVAL = {
  /** A wrong pick shown above this confidence counts as confidently wrong. */
  confidentAbove: 0.5,
} as const;

/**
 * The signed feeling scale. `directional` is the |report| at or above which a
 * garment counts as having run tight or loose at all — ONE value, shared by
 * `isDirectional()` and brand bias's closet vote, which used to carry a copy each.
 */
export const DIRECTION = { min: -10, max: 10, default: 0, directional: 3 } as const;

/** Per-user brand bias (brandBias.ts). */
export const BRAND_BIAS = { minEvidence: 2 } as const;

// The PROVENANCE registry (one entry per leaf value above) lives in
// `scoringProvenance.ts`, so a page that imports one constant does not also receive
// every sentence about where each came from (3–6 kB per page, Session 100).
