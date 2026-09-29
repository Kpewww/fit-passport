# The scoring system

> **Status: current as of Session 78.** This document describes the size scorer as
> it runs, and grows with each phase of Session 78 — a section exists here only
> once the behaviour it describes has shipped. Every number in it lives in
> `app-web/src/lib/scoringConstants.ts`, and the table at the end is generated
> from that file.

## 1. The one rule: no number without a provenance

The engine already refuses to invent MEASUREMENTS — it will not score a chart no
page stated (invariants ㊼, ⑪, (59)). This document is about the other place
invention can hide: the engine's own CONSTANTS. A sigma of 4 cm, a confidence floor
of 30%, a cap of 0.6 — each looks like a fact on screen and each is a choice.

So every scoring number has one home, `scoringConstants.ts`, and one of three
provenances:

| | Meaning | Count |
|---|---|---|
| **measured** | Computed from data we hold, with the n stated | **1** |
| **cited** | A published source states this value — not just the idea | **2** |
| **assumed** | A judgement, usually hand-tuned against a handful of cases | **86** |

`scoringConstants.test.ts` fails if a value has no provenance, if a provenance
names no value, if a measured entry does not state its n, or if an assumed value
is missing from the calibration table below.

**Read the counts plainly.** 86 of 89 numbers are judgements. The
literature the engine cites supports the SHAPE of the model — fit as a bipolar
ordinal (too small … too big), fit as a multi-measurement signal — and not a
single one of its values. That is normal for a scorer before it has outcome data,
and the only thing that would make it dishonest is presenting these numbers as
anything else. They become measured when the evaluation has ground truth
(`todo/people/01-ground-truth.md`) and when real outcomes exist (`FitOutcome` has
had **0 rows** in every database we have checked).

## 2. How a size is scored

For each size on the chart the engine sums weighted signals into a **score**
(0–1), then ranks sizes by score.

| Signal | What it compares | Weight (no anchor → anchor) |
|---|---|---|
| Measurement fit | The wearer's chest, waist, shoulder against the size | 0.45 → 0.18 |
| Closet anchor | A garment the wearer owns and reported on, placed on this ladder | 0.35 → 0.62 |
| Preference | Nudge toward the stated slim/regular/relaxed/oversized | 0.05 |
| Outcomes | Sizes the wearer previously kept or returned | 0.15 |
| Brand bias | This wearer's own history of a brand running big/small | 0.15 |

The weights switch to the anchor column when a strong same-brand, same-category
anchor exists — the Session 02 fix [F1], so a garment you already own in this
brand outranks a chart.

**Measurement fit** combines up to three dimensions, renormalised over those present
(chest 0.6, waist 0.22, shoulder 0.18):
- **Against a garment measurement** — a Gaussian around the target
  `wearer + ease(preference) + ease(category)`, sigma 4 cm (2.5 for shoulder).
- **Against a body range** — membership (`bodyRangeFit`): 0.85–1.0 inside the
  retailer's range, falling off outside it. No ease is added: the number already
  describes the wearer (invariant ㊿). One function for every dimension (72).

## 3. What the confidence percentage is

```
confidence = floor 0.30
           + 0.35  the wearer has a chest AND the size states one (garment or body range, (70))
           + 0.25  a closet garment of this type
           + 0.05  the chart states a shoulder   + 0.05 a sleeve
```

then, each step only able to lower it:
1. closet evidence from another garment domain → at most 0.35
2. × the wearer's report consistency (scatter costs up to 15%)
3. × **stability** (§7): 0.6 when half the plausible alternative measurements would pick another size, 1.0 when none would
4. × 0.8 / 0.65 when signals point one / two-plus sizes apart
5. a size our own measurement model calls too small or too big → at most 0.6
6. a regional-average body instead of the wearer's own → at most 0.4
7. at the route, by chart provenance: estimated ≤ 0.5, brand chart ≤ 0.75

**What it is not: a probability.** "65%" does not mean "right 65% of the time",
because nothing has ever checked it against outcomes. It is an evidence count with
honest ceilings. It becomes a probability only when calibrated — the plan is in §6.
Until then `/check` describes it as it is: "confidence is arithmetic here, not a
feeling: it starts at 30 and rises with each piece of evidence."

## 4. Verdicts

Each size is labelled on the garment-relative chest delta: too small ≤ −6 cm, snug
< −2, true to size < 2, relaxed < 6, too big beyond. The ordinal framing is the
literature's (Sembium, Guigourès, Misra); the cut points are assumed. A delta
computed from the wearer's side must be negated first (invariant (51)).

## 5. The size step — measured, and applied in Session 78

`PERSONAL_EASE.ladderStepChestCm` is the one conversion from a fit feeling to
centimetres (a full "too tight" = one size step). Until Session 78 it was **4.5 cm**,
measured from **two demo fixture charts** stepping by 4 cm.

The real curated charts held since Session 72:

| Chart | Steps between adjacent sizes (cm) |
|---|---|
| Nike men's tops | 7.6, 7.6, 8.3, 9.6, 12.1, 12.1 |
| Patagonia men's | 5.1, 5.7, 7.7, 8.9, 8.3, 9.5, 13.3 |
| Patagonia women's | 3.8, 5.1, 5.1, 7.6, 10.2, 10.2 |

**Median 8.3 cm (n = 19).** So every "too tight" or "a bit snug" had been read as
about half the room it describes. It is now **8.3**, and a test recomputes it from
the charts so the "measured" label cannot drift from the data. Thin evidence — three
charts, two brands — and it should be re-measured as charts are added.

Before → after, one wearer (chest 100 cm, regular) with three measured tees at +8,
+10 and +12 cm of room, all reported "a bit snug": ease target **10.8 → 12.1 cm**.
They said all three were tight; the old step barely moved them.

## 6. Calibration plan

The assumed numbers become measured in this order, each gated on data:

1. **Ground truth for the evaluation cases** (people, `todo/people/01`) → the
   acceptable-size rule per case → which sizes the engine gets right. Enough to
   test the verdict thresholds and the dimension weights.
2. **Outcomes** (kept / returned / exchanged, with the signed fit) → confidence
   against reality, in bands; the confidence weights and caps are then fitted so a
   band's stated confidence matches its keep rate.
3. **Real size steps** from every chart captured → `ladderStepChestCm`.

## 7. Small changes must not swing a confident answer (Session 78c)

A scorer built from smooth curves never jumps in score, but the recommended size is
an argmax, and an argmax flips the instant two scores cross. A wearer whose chest
sits on the M/L boundary gets M at 100.0 cm and L at 100.5 cm — and neither a tape
measure nor a retailer's chart is accurate to half a centimetre. **Refusing to flip is
not the answer: at a real boundary, flipping is correct.** The honest answer is to
know when a pick is fragile, lower the confidence, and say why.

`stability.ts` re-runs the engine on a deterministic grid of plausible alternatives:
the wearer's chest and waist each moved by ±½ and ±1 × the self-measurement noise
(2 cm, assumed), and the whole chart moved by ± the chart tolerance (1 cm, assumed).
That is up to 75 runs, about 1 ms at 15 µs per run. Two results:

- **agreement** — the share of runs that still pick the same size. Confidence ×
  0.6 at a dead heat (½), × 1.0 at full agreement, linearly between — the same range
  as the top-two score-margin factor it **replaced** (both measured decisiveness;
  keeping both would count it twice).
- **holds for** — how far the wearer's chest can move, alone, before the pick
  changes. Shown on `/check`, and when agreement falls below 75% the explanation
  says so in words: "it holds for a chest between 99 and 101 cm, and a 2 cm
  difference in how you measure could change it".

It is deterministic — no random sampling — so the same input always gives the same
stability, and it can be tested. Properties pinned by tests: continuity (a 0.1 cm
change moves no score by more than a small bound), monotonicity (a bigger chest never
picks a smaller size, all else equal), order and duplicate-row invariance, and that a
boundary pick is always less confident than a centred one.

## Calibration table

Generated from `scoringConstants.ts` (`PROVENANCE`). Every **assumed** row is a
number we have not yet earned; the test fails if one is missing here.

| Constant | Value | Provenance | Source |
|---|---|---|---|
| `DEFAULT_WEIGHTS.chestFit` | 0.45 | assumed | hand-tuned in Session 02 against one walkthrough case ([F1], DEVLOG) |
| `DEFAULT_WEIGHTS.knownGood` | 0.35 | assumed | hand-tuned in Session 02 against one walkthrough case ([F1], DEVLOG) |
| `DEFAULT_WEIGHTS.preferenceBonus` | 0.05 | assumed | a small nudge; the preference already reshapes the chest target |
| `DEFAULT_WEIGHTS.outcomePenalty` | 0.15 | assumed | hand-set; no outcome data has ever existed to fit it (FitOutcome rows: 0) |
| `DEFAULT_WEIGHTS.minDataFloor` | 0.2 | assumed | prevents NaN and all-zero scores on missing data |
| `ANCHOR_WEIGHTS.chestFit` | 0.18 | assumed | hand-tuned in Session 02 against one walkthrough case ([F1], DEVLOG) |
| `ANCHOR_WEIGHTS.knownGood` | 0.62 | assumed | hand-tuned in Session 02 against one walkthrough case ([F1], DEVLOG) |
| `ANCHOR_WEIGHTS.preferenceBonus` | 0.05 | assumed | same as the default |
| `ANCHOR_WEIGHTS.outcomePenalty` | 0.15 | assumed | same as the default |
| `ANCHOR_WEIGHTS.minDataFloor` | 0.2 | assumed | same as the default |
| `BRAND_BIAS_WEIGHT` | 0.15 | assumed | hand-set; per-user bias is capped at ±1 step regardless |
| `DIMENSIONS.chest.weight` | 0.6 | assumed | chest-dominant by design; the literature models fit as multi-measurement but gives no weights |
| `DIMENSIONS.chest.sigmaCm` | 4 | assumed | roughly one size step on a 4 cm ladder; real charts step 5–10 cm (Session 78) |
| `DIMENSIONS.waist.weight` | 0.22 | assumed | secondary to chest |
| `DIMENSIONS.waist.sigmaCm` | 4 | assumed | same as chest |
| `DIMENSIONS.waist.easeFactor` | 0.8 | assumed | waist tracks the body more tightly than chest |
| `DIMENSIONS.shoulder.weight` | 0.18 | assumed | remainder after chest and waist |
| `DIMENSIONS.shoulder.sigmaCm` | 2.5 | assumed | shoulders are the least forgiving dimension |
| `BODY_RANGE.insideFloor` | 0.85 | assumed | anywhere inside the retailer's range is a strong fit |
| `BODY_RANGE.insideSpan` | 0.15 | assumed | a small preference for the range's centre |
| `BODY_RANGE.outsidePushCm` | 4 | assumed | keeps an out-of-range size from reading 'true to size' |
| `BODY_RANGE.outsideSigmaCm` | 4 | assumed | same tolerance as the chest |
| `VERDICT_CM.tooSmall` | -6 | assumed | thresholds for the five-level verdict; the ordinal framing is cited (Sembium, Guigourès, Misra), these cut points are not |
| `VERDICT_CM.snug` | -2 | assumed | see tooSmall |
| `VERDICT_CM.relaxed` | 2 | assumed | see tooSmall |
| `VERDICT_CM.tooBig` | 6 | assumed | see tooSmall |
| `BINDING.chestNearCm` | 1.5 | assumed | when the chest is this close, name the chest |
| `BINDING.strongSub` | 0.82 | assumed | sub-score above which a dimension is not blamed |
| `BINDING.weakSub` | 0.7 | assumed | sub-score below which a non-chest dimension is named |
| `KNOWN_GOOD.strongRating` | 4 | assumed | 4 of 5 stars; a centred signed report must map to ≥ 4 (⑮) |
| `KNOWN_GOOD.directedTrust` | 0.9 | assumed | avoids double-penalising a 'too tight' report (⑯) |
| `KNOWN_GOOD.perStep` | 0.5 | assumed | half the evidence per ladder step away |
| `KNOWN_GOOD.mult.strong` | 1 | assumed | same brand and category |
| `KNOWN_GOOD.mult.sameCategory` | 0.75 | assumed | same category, other brand |
| `KNOWN_GOOD.mult.other` | 0.55 | assumed | other category |
| `OUTCOME.perStep` | 0.5 | assumed | same as KNOWN_GOOD.perStep |
| `OUTCOME.keepBoost` | 0.6 | assumed | a keep counts for less than a return |
| `OUTCOME.goodFitRating` | 4 | assumed | 4 of 5 on the old unipolar rating |
| `OUTCOME.mult.sameBrandCategory` | 1 | assumed | same brand and category |
| `OUTCOME.mult.sameCategory` | 0.6 | assumed | same category |
| `OUTCOME.mult.other` | 0.4 | assumed | other |
| `CONFIDENCE_WEIGHTS.floor` | 0.3 | assumed | where every answer starts; never validated — FitOutcome has had 0 rows |
| `CONFIDENCE_WEIGHTS.measurements` | 0.35 | assumed | the largest single piece of evidence |
| `CONFIDENCE_WEIGHTS.closetAnchor` | 0.25 | assumed | second largest |
| `CONFIDENCE_WEIGHTS.chartShoulder` | 0.05 | assumed | small: the chart stating a shoulder is not something the user controls |
| `CONFIDENCE_WEIGHTS.chartSleeve` | 0.05 | assumed | as chartShoulder |
| `CONFIDENCE_CAPS.crossDomain` | 0.35 | assumed | closet evidence from shoes should not lend confidence to a shirt |
| `CONFIDENCE_CAPS.verdictOff` | 0.6 | assumed | a size our own model calls wrong cannot be a confident pick |
| `CONFIDENCE_CAPS.estimatedBody` | 0.4 | assumed | a regional average is a prior, not the wearer |
| `CONFIDENCE_CAPS.provenance.estimated` | 0.5 | assumed | invented chart numbers; policy ceiling |
| `CONFIDENCE_CAPS.provenance.brand-chart` | 0.75 | assumed | real brand numbers, but not this product's; policy ceiling |
| `STABILITY.bodyNoiseCm` | 2 | assumed | typical error of a self-taken tape measurement; no source fetched — to calibrate |
| `STABILITY.chartNoiseCm` | 1 | assumed | Uniqlo states its garments can vary by about 1 cm (seen in a search summary of uniqlo.com; primary page not fetched) |
| `STABILITY.bodySteps` | 2 | assumed | grid resolution: five body offsets per dimension |
| `STABILITY.chartSteps` | 1 | assumed | grid resolution: three chart offsets |
| `STABILITY.floor` | 0.6 | assumed | same scale as the margin factor it replaced: a dead heat keeps 60% |
| `STABILITY.fragileBelow` | 0.75 | assumed | say so when a quarter or more of plausible measurements would change the answer. First set to 0.6 by copying the confidence floor; exactly on a boundary 40% of the grid disagreed and the note did not appear |
| `STABILITY.holdScanCm` | 8 | assumed | about one size step each way |
| `STABILITY.holdScanStepCm` | 0.5 | assumed | half a centimetre — finer than a tape is read |
| `AGREEMENT.oneStep` | 0.8 | assumed | ordinary tension between signals |
| `AGREEMENT.twoPlusSteps` | 0.65 | assumed | signals telling different stories |
| `TIE.epsilon` | 0.000001 | assumed | floating-point equality |
| `TIE.alternativeWithin` | 0.08 | assumed | how close a runner-up must be to be offered as an alternative |
| `EASE_CM.slim` | 6 | assumed | no source found; regular − 4 cm |
| `EASE_CM.regular` | 10 | assumed | no source found for the value; used since Session 01 |
| `EASE_CM.relaxed` | 16 | assumed | no source found |
| `EASE_CM.oversized` | 22 | assumed | no source found |
| `CATEGORY_EASE_CM.coat` | 8 | assumed | outerwear is worn over layers |
| `CATEGORY_EASE_CM.jacket` | 6 | assumed | as coat, less |
| `CATEGORY_EASE_CM.parka` | 6 | assumed | as jacket |
| `CATEGORY_EASE_CM.hoodie` | 4 | assumed | mid-layer |
| `CATEGORY_EASE_CM.sweatshirt` | 4 | assumed | as hoodie |
| `CATEGORY_EASE_CM.blazer` | 3 | assumed | tailored outerwear |
| `CATEGORY_EASE_CM.tank` | -3 | assumed | base layers sit closer |
| `CATEGORY_EASE_CM.tanktop` | -3 | assumed | as tank |
| `CATEGORY_EASE_CM.base-layer` | -3 | assumed | as tank |
| `CONSISTENCY.minReports` | 3 | assumed | below three reports there is no basis for an opinion |
| `CONSISTENCY.tightSpread` | 2 | assumed | spread on the ±10 scale that reads as consistent |
| `CONSISTENCY.wideSpread` | 6 | assumed | spread that reads as scattered |
| `CONSISTENCY.minFactor` | 0.85 | assumed | scatter can cost at most 15% of confidence |
| `PERSONAL_EASE.ladderStepChestCm` | 8.3 | measured | median step between adjacent sizes across the curated brand charts, n = 19 steps from 3 charts (Nike men's tops; Patagonia men's and women's). Was 4.5 until Session 78, from 2 demo fixtures — about half the real step, so every fit feeling was read as half the room it describes. Thin: 2 brands |
| `PERSONAL_EASE.minEvidence` | 2 | assumed | two garments before learning anything |
| `PERSONAL_EASE.fullEvidence` | 4 | assumed | four for full weight |
| `PERSONAL_EASE.noticeableCm` | 0.2 | assumed | a fifth of a centimetre is not a wearable difference |
| `BRAND_BIAS.minEvidence` | 2 | assumed | two same-direction reports before a brand is said to run big or small |
| `DIRECTION.directional` | 3 | assumed | between 'just right' (0) and 'a bit snug/roomy' (±5) |
| `DIRECTION.min` | -10 | assumed | the scale's end; its MEANING (one ladder step) is cited — see DIRECTION.max |
| `DIRECTION.max` | 10 | cited | full range = one size step, matching the return-shift term in Guigourès et al., RecSys 2018 (eta_small ~ N(-1,1)) |
| `DIRECTION.default` | 0 | cited | the modal answer: ~75% of ModCloth and ~74% of RentTheRunway fit feedback is 'fit' |
