---
name: project-fit-passport-closet-signal-design
description: "Fit Passport — the signed fit scale (SHIPPED 2026-08-25), what it changed in the engine, and the parts of the design still unbuilt"
metadata:
  node_type: memory
  type: project
---

Direction set **2026-08-25** for using closet data as an engine signal, and the
first half **SHIPPED the same day**. Full argument with sources:
**`docs/design/closet-signal-and-interaction-cost.md`** (§6 lists exactly what
landed) — read it before touching any of this.

**SHIPPED:** the signed scale `lib/fitDirection.ts`, `KnownGoodItem.fitDirection`
/ `ComfortCheck.direction` / `User.fitScaleMode`, the engine's directional anchor
correction, the dual-mode input (`FitDirectionInput`), the `/check` ease figure
(`FitFigure`), and Fit Refresh converted to the same scale. 209 → **237 tests**.

**STILL DESIGN ONLY:** derived personal ease target, preference-consistency
confidence, consistency feedback on contradictions, per-area ratings, and all
cross-user aggregation.

## The finding worth remembering

**`KnownGoodItem.fitRating` was the wrong shape of data from Session 01 until
2026-08-25.** It is a unipolar `Int 1–5` ("how good is the fit") that was rendered
as a `1/5…5/5` dropdown. It cannot express *which way* a bad fit is bad — a 2/5 is
either strangling or falling off, and those imply **opposite** recommendations.

Every size-rec system this project cites models fit as a **bipolar ordinal**
({Small, Fit, Large}; or too tight/tight/just right/loose/too loose). So the
closet — our single biggest structural asset — discards the field's standard
signal at the point of entry.

**The fix is cheaper than what it replaces**, which is why it's the first move:
a five-way bipolar tap costs the user *less* than the current dropdown and gives
the engine *more*.

## Three things that were meant to be FREE — two are, one is NOT

1. **Directional brand bias without a purchase. ✅ BUILT.** `brandBias.ts` needs outcomes
   today, which most users never record. A signed closet rating is the same ±1
   shift as Zalando's η return-shift term, available on day one. Cold-start fix.
2. **Personal ease target — ❌ NOT DERIVABLE, the design was wrong here.**
   `KnownGoodItem` stores **no garment measurements**, so `ease = garment − body`
   has no garment side for nearly every item. It needs the size chart captured at
   add-by-URL time (the extractor has the numbers and discards them). A real
   feature with a real cost — **blocked, not free**.
3. **Confidence from report *consistency*. ✅ BUILT.** Tight spread of preferred ease →
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

## The animated figure — right idea, wrong mechanism

Proposed 2026-08-25: a figure wearing the garment; sliding tightens/loosens it.
**Good instinct, but it must NOT be a drag slider.** Funke (2016) measured
break-off: radio buttons 1.5%, slider scales 4.2%, and **sliders on
smartphones/tablets 37% vs 2.3% for radio buttons** — worst for less-educated
respondents (11% vs 2.2%), which points at cognitive load. The mechanical
difference is point-and-click (2 actions) vs drag-and-drop (4). Recommendation in
the literature is explicit: radio buttons for discrete, VAS for continuous,
**avoid slider scales**. Two further defects: a handle at rest **anchors** the
answer, and if it starts at a valid value, **non-response is indistinguishable
from a real choice** — which would silently corrupt the whole signal.

*(The FIC table predicted this independently — slider 5 vs pick-from-2-5 3.)*

**Where it should live instead, ranked:**
1. **On `/check` as explanation — build first.** Collects nothing, so zero
   break-off risk; makes the engine's existing per-size ease arithmetic visible.
2. **In the closet as feedback on a tap** — keep the five discrete options; the
   figure animates *as a consequence* of the answer, never as the means of giving
   it.
3. **As the numeric mode**, and this **resolves the open question below**: a VAS
   (**tap a point on the line**, no handle drawn at rest), not a drag handle.

**Two non-optional constraints:**
- **Schematic, never photoreal.** `fit-algorithm-research.md` §1 concludes that
  image-based try-on transfers *appearance, not fit*, and that size recommendation
  must stay separate from any try-on visual. A realistic figure would make exactly
  the promise the research says nobody can keep. Show ease as a gap, **print the
  centimetre number next to the picture**, keep it a diagram of the computation.
  `OutfitMannequin.tsx` is the right asset because it is already abstract.
- **No `setState` per pointer move.** A garment morphing under a moving pointer is
  precisely the bug fixed twice already (`MetalCard`, `BadgeCoin`) — see
  [[project-fit-passport-performance]]. CSS custom properties via ref,
  rAF-coalesced. Placements 1 and 2 avoid continuous pointer tracking entirely.

⚠ The *positive* half — that seeing it helps people answer more accurately — is
**not directly evidenced** for this task; supporting work is adjacent only. The
*negative* half is directly measured. So justify the animation as an
**explanation** feature, not as a data-quality intervention.

## Decisions taken while building — do not relitigate casually

- **Numeric scale = signed −10…+10** (founder's call, 2026-08-25). A 1–20
  *comfort* scale was rejected for being unipolar again. Mode is sticky **per
  user, never per item** — mid-closet switching makes the data incomparable with
  itself.
- **`fitRating` is DERIVED, never asked.** `ratingFromDirection()` maps
  |direction| to 5/4/3/2, never 1. **A test pins that a centred report clears the
  `>= 4` threshold `hasStrongAnchor()` needs** — miss that and the [F1] anchor fix
  stops firing silently.
- **A directed anchor is trusted at a flat 0.9**, not `fitRating/5`, or "too
  tight" gets penalised twice: once by the correction, again by the low stars it
  attracts. Trust tracks the quality of the REPORT, not of the fit.
- **Direction applies to cross-brand anchors too** (it is an observation about a
  garment); the *preference* shift stays same-brand-only so two guesses never
  compound.
- **Fit Refresh had to move to the same scale.** Left alone it overwrote
  `fitRating` while leaving a stale `fitDirection` on the same row — the two
  contradicting each other on a record the engine reads.
- **`body` is returned by `/api/check` and `/api/recommend`** so the figure can
  draw. That is the user's own session; `/api/view/[code]` was re-verified as
  leaking no measurement field.

## Still open

1. **Should `fitDirection` be visible to an account-code holder?** Currently NO —
   the view endpoint's allow-list `select` excluded it and it was left that way.
   It is closet information like `fitRating` (already public) and arguably more
   useful, but widening what a bearer code reveals is a **governance decision, not
   a feature side effect**. Founder's call.
2. **SizeFlags' actual thresholds were not retrievable** (PDF method section
   unreadable). Cross-user aggregation is **blocked** on getting them — we have
   precedent that the approach works, not a specification to copy.

## Sequencing

`/check` size-comparison figure (independent, build any time) → free derived
signals → replace the dropdown → consistency feedback → numeric mode → (maybe)
per-area → cross-user, last and gated. Customer interviews should test
the five-option wording directly; five people can falsify it in an afternoon.

See [[project-fit-passport-build-state]] for the invariants this must respect
(especially explainability: a lowered confidence must always say why).


## Session 47 additions (both SHIPPED, 265 tests)

- **Brand bias learns from the closet** (`brandBias.ts`). Verified live with zero
  purchase history. **Double-counting is closed by construction:** a same-brand
  *same-category* item already moves the anchor in `scoreKnownGood`, so
  `biasForBrand` takes the product category and EXCLUDES those items. Anchor
  handles same-category; brand bias generalises across categories.
- **Report consistency → confidence** (`closetConsistency.ts`). Deliberately
  **asymmetric**: scatter lowers confidence (floor 0.85) with the reason surfaced;
  agreement does NOT raise it (that would double-count an assumption we already
  make). **Consistently off-centre is NOT penalised** — scatter means we know
  less, offset just means they buy up.

**Testing lesson worth keeping:** an engine-level test asserting "scattered closet
⇒ lower confidence number" FAILED, because scatter also spreads the anchor across
sizes and changes the signal-agreement penalty. The scenarios differ in several
ways at once. It was **rewritten to assert the user-visible note**, with the
factor's monotonicity pinned at unit level — not tuned until green. A threshold
tuned until it passes tests the tuner.
