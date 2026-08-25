---
name: project-fit-passport-closet-signal-design
description: "Fit Passport — the closet fit scale is the WRONG SHAPE (unipolar 1-5, loses direction); the design that fixes it, plus the FIC interaction-cost budget. DESIGN, NOT BUILT."
metadata:
  node_type: memory
  type: project
---

Direction set **2026-08-25** for using closet data as an engine signal. Full
argument with sources: **`docs/design/closet-signal-and-interaction-cost.md`** —
read that before building any of it. **Nothing here is implemented.**

## The finding worth remembering

**`KnownGoodItem.fitRating` is the wrong shape of data, and has been since
Session 01.** It is a unipolar `Int 1–5` ("how good is the fit") rendered as a
`1/5…5/5` dropdown. It cannot express *which way* a bad fit is bad — a 2/5 is
either strangling or falling off, and those imply **opposite** recommendations.

Every size-rec system this project cites models fit as a **bipolar ordinal**
({Small, Fit, Large}; or too tight/tight/just right/loose/too loose). So the
closet — our single biggest structural asset — discards the field's standard
signal at the point of entry.

**The fix is cheaper than what it replaces**, which is why it's the first move:
a five-way bipolar tap costs the user *less* than the current dropdown and gives
the engine *more*.

## Three things that are FREE (derived, zero new user input)

1. **Directional brand bias without a purchase.** `brandBias.ts` needs outcomes
   today, which most users never record. A signed closet rating is the same ±1
   shift as Zalando's η return-shift term, available on day one. Cold-start fix.
2. **Personal ease target.** For closet items where we know body chest and
   garment chest, `ease = garment − body` measures the ease a user actually
   likes, per category — **revealed preference instead of the self-reported
   slim/regular/relaxed label**.
3. **Confidence from preference *consistency*.** Tight spread of preferred ease →
   we can predict this person → higher confidence. Scattered → lower, *with the
   reason surfaced* (same principle as the existing `signalDisagreement()`, new
   axis: within-user variance rather than between-signal). This is the
   defensible version of "subjective weights tune the confidence".

## Bad data is TWO problems, not one — do not conflate them

- **Self-directed garbage (own closet → own recommendations): LOW severity.**
  The blast radius is the user's own account; there is no incentive to lie and
  the feedback loop is immediate. **Do not over-police.** Response is *consistency
  feedback, not enforcement*: ask a gentle question when a rating contradicts the
  brand's own chart, **never block, never silently discard** — a contradicting
  item may be the most informative one they own.
- **Cross-user aggregation (shared brand knowledge): HIGH severity.** This is the
  only place one person's data touches another's recommendation, so it is the
  only place adversarial data is a security problem. Requires robust aggregation
  (median/trimmed, never the mean), a minimum-evidence threshold, reputation
  weighting, and a per-account influence cap **before** it ships.
  **Hard rule: a cross-user aggregate must never move a recommendation further
  than the user's own data would — tie-breaker, never override.**

## FIC — the interaction-cost budget

A scoring rubric answering "任何需要操作的都需要扣大分": cost points per input type
(0 derived → 2 tap → 3 pick → 6 type a number → 10 free text → 12 photo, with
multipliers for memory load, judgement, navigation, and required-ness), value
points per engine gain (10 changes the size, 6 changes confidence, 3 improves an
explanation, 0 unread). **Build only if `value ≥ cost/2`.** Budgets: FIC ≤ 30 to
first size answer, ≤ 10 per later action.

**The point weights are INVENTED — a forced-ranking device, not measured
constants.** Say so wherever they appear. They are calibrated only to the ordinal
claims that survive sourcing (nothing < tapping < choosing < typing; NN/g's memory
load and required-ness are real multipliers). Grounded in NN/g's interaction-cost
definition and Baymard's finding that **field count matters more than step count**
and *perceived* count more than actual.

Applying it kills free-text fit notes and prompted photos, defers per-area
ratings, and shows the **current dropdown has the worst cost/value ratio in the
closet flow**.

## Two open questions — decide before building

1. **The numeric mode is unresolved.** A 1–20 *comfort* scale is unipolar again —
   it reproduces the exact defect above. Likely answer is a **signed** range
   (−10…+10, tight→loose, 0 = perfect). **Needs the founder's decision.** Whatever
   it becomes, it must map to the same internal scalar as the descriptive mode,
   and the mode switch is sticky **per user, never per item** (mid-closet
   switching makes the data incomparable with itself).
2. **SizeFlags' actual thresholds were not retrievable** (PDF method section
   unreadable). Cross-user aggregation is **blocked** on getting them — we have
   precedent that the approach works, not a specification to copy.

## Sequencing

Free derived signals → replace the dropdown → consistency feedback → numeric mode
→ (maybe) per-area → cross-user, last and gated. Customer interviews should test
the five-option wording directly; five people can falsify it in an afternoon.

See [[project-fit-passport-build-state]] for the invariants this must respect
(especially explainability: a lowered confidence must always say why).
