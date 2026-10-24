// Where every number in `scoringConstants.ts` came from: one entry per leaf value,
// keyed by its dotted path ("DIMENSIONS.chest.sigmaCm"). Kept apart from the values
// since Session 100 — the values reach the browser, the sentences need not.
// `scoringConstants.test.ts` holds the two files to each other.

import type { ConstantSource } from "./scoringConstants";

// ---------------------------------------------------------------------------
// PROVENANCE — one entry per leaf value in scoringConstants.ts, keyed by its dotted path.
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
  "SELLER_RANGE.weight": A("below a measured chest (0.45), near brand bias (0.15): the seller's own rule, used only when the wearer gave no chest"),
  "SELLER_RANGE.outsideSigmaCm": A("height outside the seller's range fades over a few cm; hand-set"),
  "SELLER_RANGE.outsideSigmaKg": A("weight outside the seller's range fades over a few kg; hand-set"),

  "DIMENSIONS.chest.weight": A("chest-dominant by design; the literature models fit as multi-measurement but gives no weights"),
  "DIMENSIONS.chest.sigmaCm": A("roughly one size step on a 4 cm ladder; real charts step 5–10 cm (Session 78)"),
  "DIMENSIONS.waist.weight": A("secondary to chest"),
  "DIMENSIONS.waist.sigmaCm": A("same as chest"),
  "DIMENSIONS.waist.easeFactor": A("waist tracks the body more tightly than chest"),
  "DIMENSIONS.shoulder.weight": A("remainder after chest and waist"),
  "DIMENSIONS.shoulder.sigmaCm": A("shoulders are the least forgiving dimension"),
  "DIMENSIONS.hip.weight": A("as much as chest: a dress or jumpsuit that will not pass the hips does not fit, and size guides say to size to the larger measurement. At waist weight (0.22) a 99 cm hip still got S on a chart whose S stops at 96 (onepiece.test.ts)"),
  "CATEGORY_MODEL.minConfidence": M("eval/category.eval.ts, n = 133 labelled names (eval/category-names.json), 2026-10-08: the lowest threshold whose answers are right at least 95% of the time. 0.65 answers 122/133 at 95.1%; 0.6 gave 94.3%. Results: eval/results/category-calibration-2026-10-08.json. Checked on n = 138 real shop titles the word rules miss (category-names-real.json): at 0.65, 76 answered, no garment named as the wrong garment; 4 of 5 misses were non-garment names called not_clothing"),
  "CATEGORY_MODEL.timeoutMs": A("a check already waits on the page parse; a slow classifier must not hold it"),
  "CATEGORY_MODEL.maxStateChars": A("a name, a breadcrumb and a category string fit easily; caps cost"),
  "CATEGORY_MODEL.cacheEntries": A("per server instance; a clear when full is enough at this traffic"),
  "DIMENSIONS.hip.sigmaCm": A("same as chest and waist"),
  "DIMENSIONS.hip.easeFactor": A("half the chest ease: a dress usually sits closer at the hip than at the bust; to calibrate against real dress charts"),

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
  "KNOWN_GOOD.styleMismatch": A("a different style of the same brand is weaker evidence than the same style; not measured — no closet with style-named pieces has an outcome yet"),

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
  "CONFIDENCE_CAPS.roughGuess": A("the founder asked for a rough guess from one or two closet pieces (Session 92c); set below crossDomain, since this guess is also across garment types or brands"),
  "CONFIDENCE_CAPS.roughSameLabel": A("a same-brand piece with the page's own size label is better evidence than a cross-type guess, worse than a measured anchor; between the two caps either side"),
  ROUGH_GUESS_WEIGHT: A("only needs to break a dead heat, the one case it runs in; a quarter of the closet weight"),
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
  "TIE.preferRoomierWithin": A("the founder's rule (Session 103): fit first, and on a near-tie the slightly roomier size. Set well inside alternativeWithin so it only breaks a near dead heat"),

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
