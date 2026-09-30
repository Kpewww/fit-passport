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

/** Per-dimension weight inside the measurement score, and each one's tolerance. */
export const DIMENSIONS = {
  chest: { weight: 0.6, sigmaCm: 4 },
  waist: { weight: 0.22, sigmaCm: 4, easeFactor: 0.8 },
  shoulder: { weight: 0.18, sigmaCm: 2.5 },
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
export const CONFIDENCE_WEIGHTS = {
  floor: 0.3,
  measurements: 0.35,
  closetAnchor: 0.25,
  chartShoulder: 0.05,
  chartSleeve: 0.05,
} as const;

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
} as const;

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

// ---------------------------------------------------------------------------
// PROVENANCE — one entry per leaf value above, keyed by its dotted path.
// ---------------------------------------------------------------------------

const A = (source: string): ConstantSource => ({ provenance: "assumed", source });
const M = (source: string): ConstantSource => ({ provenance: "measured", source });
const C = (source: string): ConstantSource => ({ provenance: "cited", source });

const TUNED_F1 = "hand-tuned in Session 02 against one walkthrough case ([F1], DEVLOG)";

export const PROVENANCE: Record<string, ConstantSource> = {
  "DEFAULT_WEIGHTS.chestFit": A(TUNED_F1),
  "DEFAULT_WEIGHTS.knownGood": A(TUNED_F1),
  "DEFAULT_WEIGHTS.preferenceBonus": A("a small nudge; the preference already reshapes the chest target"),
  "DEFAULT_WEIGHTS.outcomePenalty": A("hand-set; no outcome data has ever existed to fit it (FitOutcome rows: 0)"),
  "DEFAULT_WEIGHTS.minDataFloor": A("prevents NaN and all-zero scores on missing data"),
  "ANCHOR_WEIGHTS.chestFit": A(TUNED_F1),
  "ANCHOR_WEIGHTS.knownGood": A(TUNED_F1),
  "ANCHOR_WEIGHTS.preferenceBonus": A("same as the default"),
  "ANCHOR_WEIGHTS.outcomePenalty": A("same as the default"),
  "ANCHOR_WEIGHTS.minDataFloor": A("same as the default"),
  "BRAND_BIAS_WEIGHT": A("hand-set; per-user bias is capped at ±1 step regardless"),

  "DIMENSIONS.chest.weight": A("chest-dominant by design; the literature models fit as multi-measurement but gives no weights"),
  "DIMENSIONS.chest.sigmaCm": A("roughly one size step on a 4 cm ladder; real charts step 5–10 cm (Session 78)"),
  "DIMENSIONS.waist.weight": A("secondary to chest"),
  "DIMENSIONS.waist.sigmaCm": A("same as chest"),
  "DIMENSIONS.waist.easeFactor": A("waist tracks the body more tightly than chest"),
  "DIMENSIONS.shoulder.weight": A("remainder after chest and waist"),
  "DIMENSIONS.shoulder.sigmaCm": A("shoulders are the least forgiving dimension"),

  "BODY_RANGE.insideFloor": A("anywhere inside the retailer's range is a strong fit"),
  "BODY_RANGE.insideSpan": A("a small preference for the range's centre"),
  "BODY_RANGE.outsidePushCm": A("keeps an out-of-range size from reading 'true to size'"),
  "BODY_RANGE.outsideSigmaCm": A("same tolerance as the chest"),

  "VERDICT_CM.tooSmall": A("thresholds for the five-level verdict; the ordinal framing is cited (Sembium, Guigourès, Misra), these cut points are not"),
  "VERDICT_CM.snug": A("see tooSmall"),
  "VERDICT_CM.relaxed": A("see tooSmall"),
  "VERDICT_CM.tooBig": A("see tooSmall"),

  "BINDING.chestNearCm": A("when the chest is this close, name the chest"),
  "BINDING.strongSub": A("sub-score above which a dimension is not blamed"),
  "BINDING.weakSub": A("sub-score below which a non-chest dimension is named"),

  "KNOWN_GOOD.strongRating": A("4 of 5 stars; a centred signed report must map to ≥ 4 (⑮)"),
  "KNOWN_GOOD.directedTrust": A("avoids double-penalising a 'too tight' report (⑯)"),
  "KNOWN_GOOD.perStep": A("half the evidence per ladder step away"),
  "KNOWN_GOOD.mult.strong": A("same brand and category"),
  "KNOWN_GOOD.mult.sameCategory": A("same category, other brand"),
  "KNOWN_GOOD.mult.other": A("other category"),

  "OUTCOME.perStep": A("same as KNOWN_GOOD.perStep"),
  "OUTCOME.keepBoost": A("a keep counts for less than a return"),
  "OUTCOME.goodFitRating": A("4 of 5 on the old unipolar rating"),
  "OUTCOME.mult.sameBrandCategory": A("same brand and category"),
  "OUTCOME.mult.sameCategory": A("same category"),
  "OUTCOME.mult.other": A("other"),

  "CONFIDENCE_WEIGHTS.floor": A("where every answer starts; never validated — FitOutcome has had 0 rows"),
  "CONFIDENCE_WEIGHTS.measurements": A("the largest single piece of evidence"),
  "CONFIDENCE_WEIGHTS.closetAnchor": A("second largest"),
  "CONFIDENCE_WEIGHTS.chartShoulder": A("small: the chart stating a shoulder is not something the user controls"),
  "CONFIDENCE_WEIGHTS.chartSleeve": A("as chartShoulder"),

  "CONFIDENCE_CAPS.crossDomain": A("closet evidence from shoes should not lend confidence to a shirt"),
  "CONFIDENCE_CAPS.verdictOff": A("a size our own model calls wrong cannot be a confident pick"),
  "CONFIDENCE_CAPS.estimatedBody": A("a regional average is a prior, not the wearer"),
  "CONFIDENCE_CAPS.provenance.estimated": A("invented chart numbers; policy ceiling"),
  "CONFIDENCE_CAPS.provenance.brand-chart": A("real brand numbers, but not this product's; policy ceiling"),
  "CONFIDENCE_CAPS.provenance.seller": A("a seller's hand measurement of this very garment: real, but taken by tape, flat; set level with a brand chart"),
  "LISTING.flatNoiseCm": A("rounding to the nearest half inch, the precision listings are written in: up to a quarter inch (0.64 cm) flat either way; hand-measuring error is not modelled — to calibrate against listings with known garment measurements"),
  "LISTING.confidence.strong": A("a judgement resting on a measured garment you own, or your own chest, that holds under the seller's measuring error; level with the seller provenance cap"),
  "LISTING.confidence.moderate": A("as strong, but near a verdict boundary, or resting on a garment with no fit report"),
  "LISTING.confidence.weak": A("a regional-average chest, or a size label only"),

  "STABILITY.bodyNoiseCm": A("typical error of a self-taken tape measurement; no source fetched — to calibrate"),
  "STABILITY.chartNoiseCm": A("Uniqlo states its garments can vary by about 1 cm (seen in a search summary of uniqlo.com; primary page not fetched)"),
  "STABILITY.bodySteps": A("grid resolution: five body offsets per dimension"),
  "STABILITY.chartSteps": A("grid resolution: three chart offsets"),
  "STABILITY.floor": A("same scale as the margin factor it replaced: a dead heat keeps 60%"),
  "STABILITY.fragileBelow": A("say so when a quarter or more of plausible measurements would change the answer. First set to 0.6 by copying the confidence floor; exactly on a boundary 40% of the grid disagreed and the note did not appear"),
  "STABILITY.holdScanCm": A("about one size step each way"),
  "STABILITY.holdScanStepCm": A("half a centimetre — finer than a tape is read"),
  "AGREEMENT.oneStep": A("ordinary tension between signals"),
  "AGREEMENT.twoPlusSteps": A("signals telling different stories"),
  "TIE.epsilon": A("floating-point equality"),
  "TIE.alternativeWithin": A("how close a runner-up must be to be offered as an alternative"),

  "EASE_CM.slim": A("no source found; regular − 4 cm"),
  "EASE_CM.regular": A("no source found for the value; used since Session 01"),
  "EASE_CM.relaxed": A("no source found"),
  "EASE_CM.oversized": A("no source found"),
  "CATEGORY_EASE_CM.coat": A("outerwear is worn over layers"),
  "CATEGORY_EASE_CM.jacket": A("as coat, less"),
  "CATEGORY_EASE_CM.parka": A("as jacket"),
  "CATEGORY_EASE_CM.hoodie": A("mid-layer"),
  "CATEGORY_EASE_CM.sweatshirt": A("as hoodie"),
  "CATEGORY_EASE_CM.blazer": A("tailored outerwear"),
  "CATEGORY_EASE_CM.tank": A("base layers sit closer"),
  "CATEGORY_EASE_CM.tanktop": A("as tank"),
  "CATEGORY_EASE_CM.base-layer": A("as tank"),

  "CONSISTENCY.minReports": A("below three reports there is no basis for an opinion"),
  "CONSISTENCY.tightSpread": A("spread on the ±10 scale that reads as consistent"),
  "CONSISTENCY.wideSpread": A("spread that reads as scattered"),
  "CONSISTENCY.minFactor": A("scatter can cost at most 15% of confidence"),

  "PERSONAL_EASE.ladderStepChestCm": M(
    "median step between adjacent sizes across the curated brand charts, n = 19 steps from 3 charts " +
      "(Nike men's tops; Patagonia men's and women's). Was 4.5 until Session 78, from 2 demo fixtures — " +
      "about half the real step, so every fit feeling was read as half the room it describes. Thin: 2 brands",
  ),
  "PERSONAL_EASE.minEvidence": A("two garments before learning anything"),
  "PERSONAL_EASE.fullEvidence": A("four for full weight"),
  "PERSONAL_EASE.noticeableCm": A("a fifth of a centimetre is not a wearable difference"),
  "PERSONAL_EASE.feelingResolution": A("derived from the scale's design — options half a step apart, so a choice means within a quarter step — not from data"),
  "PERSONAL_EASE.majority": A("learn only from a strict majority of mutually consistent reports"),
  "PERSONAL_EASE.plausibleMarginSteps": A("wide on purpose: only a wrong garment or body number falls outside"),
  "PLAUSIBILITY.waistOverChestCm": A("wide bound meant to catch typos; not fitted to anthropometric data — ANSUR II would be the source to fit it to"),
  "PLAUSIBILITY.chestOverWaistCm": A("as above; wide of any chest–waist drop we expect to see (UNVERIFIED — no dataset checked)"),
  "PLAUSIBILITY.shoulderShareMin": A("wide bounds on shoulder breadth ÷ chest circumference (UNVERIFIED — the typical share has not been checked against a dataset)"),
  "PLAUSIBILITY.shoulderShareMax": A("as shoulderShareMin"),
  "EVAL.confidentAbove": A("the display's own meaning, not tuned: a pick shown as over 50% confident claims to be more likely right than wrong — which holds only if confidence is read as a probability, and that is unvalidated (§3)"),
  "CONFIDENCE_CAPS.implausibleBody": A("same ceiling as a regional-average body: we are not sure the numbers are the wearer's"),
  "BRAND_BIAS.minEvidence": A("two same-direction reports before a brand is said to run big or small"),
  "DIRECTION.directional": A("between 'just right' (0) and 'a bit snug/roomy' (±5)"),

  "DIRECTION.min": A("the scale's end; its MEANING (one ladder step) is cited — see DIRECTION.max"),
  "DIRECTION.max": C(
    "full range = one size step, matching the return-shift term in Guigourès et al., RecSys 2018 (eta_small ~ N(-1,1))",
  ),
  "DIRECTION.default": C("the modal answer: ~75% of ModCloth and ~74% of RentTheRunway fit feedback is 'fit'"),
};
