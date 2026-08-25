# Closet data as an engine signal · subjective fit vocabulary · the interaction-cost budget

> **Status: PARTLY BUILT (2026-08-25).** Shipped: the signed scale
> (`lib/fitDirection.ts`), the dual-mode input, the engine's directional anchor
> correction, and the `/check` comparison figure (§4bis placement 1). Still
> design-only: the derived personal ease target (§1.2), preference-consistency
> confidence (§1.3), consistency feedback (§2.1), per-area ratings (§1.4) and all
> cross-user aggregation (§1.5, §2.2). See §6 for exactly what landed.
>
> **Purpose.** Three questions asked together on 2026-08-25, which turn out to be
> one question: (1) can the user's own closet data make the fit engine better,
> (2) how do we stay honest when people enter careless or deliberately bad data,
> and (3) how do we ask for subjective, personal fit language without making the
> app feel like paperwork?
>
> **Method / honesty note.** Compiled 2026-08-25 from primary sources fetched
> directly (arXiv, MDPI, ACM/Springer listings, NN/g, Baymard). Where a number is
> vendor- or blog-reported rather than peer-reviewed, it is labelled inline.
> **Three things below are explicitly *not* verified** and are marked ⚠ — do not
> repeat them as fact. Sources at the end. Follows
> [`principle-research-grounded`](../memory/principle-research-grounded.md).

---

## 0. The finding that reframes all three questions

**Our closet stores the wrong shape of fit data, and it has since Session 01.**

`KnownGoodItem.fitRating` is an `Int 1–5` rendered in the UI as a `1/5 … 5/5`
dropdown ([`closet/page.tsx:393`](../../app-web/src/app/closet/page.tsx#L393)) and
as gold stars in the item cards. That is a **unipolar quality scale**: it measures
*how good* the fit is. It cannot express *which way* a bad fit is bad.

A 2/5 means "this doesn't fit well". It does not say whether the garment is
strangling the wearer or hanging off them. **Those are opposite facts and they
imply opposite recommendations**, and we currently collapse them into the same
number.

This matters because every academic size-recommendation system this project
already cites models fit as a **bipolar ordinal** variable:

- Sembium et al. (RecSys 2017) and Guigourès et al. (RecSys 2018) both classify
  fit into an ordinal **{Small, Fit, Large}**.
- Misra–Wan–McAuley (RecSys 2018) use the same three labels; their public
  ModCloth and RentTheRunway datasets are labelled exactly that way.
- The apparel-fit literature uses the same shape with more resolution: garment
  sections are judged **too tight / tight / just right / loose / too loose**
  (Textiles 2025, §Sources).

So the direction-of-misfit signal is the *standard* representation in the field,
and it is the one piece of information our closet — the project's single biggest
structural asset — throws away at the point of entry.

**Everything the founder asked for follows from fixing this one thing.** A bipolar
scale is simultaneously (a) the machine-learnable signal, (b) naturally expressed
in subjective human words ("a bit tight", "roomy"), and (c) *cheaper* to answer
than a 1–5 quality judgement, because the user is reporting a sensation rather
than grading themselves. The research direction and the UX direction agree, which
is rare and worth taking seriously.

---

## 1. What closet data can actually buy the engine

Ranked by value-per-unit-of-user-effort. Each is stated as a claim the engine can
test, not a vague "personalisation".

### 1.1 Directional brand bias with a real sign — *high value, zero extra input*

`brandBias.ts` today infers "this brand runs small for you" from purchase
outcomes, which are rare (most users never record one). A bipolar closet rating
produces the same signal from data the user enters anyway, on day one, and
**without a purchase having happened**. This is the cold-start fix.

It also directly implements the mechanism the literature independently arrived
at: Zalando's hierarchical Bayesian model uses a **return-shift term η** where
`η_small ~ N(−1,1)` and `η_big ~ N(+1,1)` — literally "returns move the target
size by ±1". A signed closet rating is the same ±1 shift, sourced earlier.

### 1.2 A personal ease target — *high value, zero extra input*

The engine has a global `preferenceShift(pref)` and a per-category
`easeAdjustForCategory`, both hand-tuned constants. But we can *measure* a user's
real preferred ease: for every closet item where we know both the wearer's chest
and the garment's chest, `ease = garment − body`. Their own rated-good garments
describe the ease they actually like, in centimetres, per category.

This is the sharpest expression of "每个人喜欢的可能不一样" — instead of asking a
user to self-describe as slim/regular/relaxed and trusting that label, we read
their preference off the clothes they already own and rated. **Revealed
preference beats stated preference**, and it costs the user nothing.

### 1.3 Confidence modulation from preference *consistency* — *the founder's ask*

The request was that subjective closer/looser weights should fine-tune the
**confidence** value. Here is the defensible version of that:

> Confidence should rise when a user's closet shows a **consistent** ease
> preference, and fall when it is **scattered**.

A user whose eight rated-good tops all sit at +8 to +12 cm of chest ease is a
person we can predict. A user whose rated-good tops range from +2 to +25 cm is
not — either they genuinely like variety, or their ratings are noise. Either way
**we know less about them**, and the honest response is a lower number with a
stated reason.

This is the same principle the engine already implements in `signalDisagreement()`
(disagreement among independent estimators *is* an uncertainty estimate) applied
to a new axis — within-user variance rather than between-signal variance. It also
matches a named line of production work: Zalando's *"Knowing When You Don't Know"*
is an entire uncertainty-aware size-recommendation framework. ⚠ We could not
retrieve that paper's abstract (paywalled) — cite it as evidence that the problem
is taken seriously in industry, **not** for any specific method.

**Invariant this must respect:** per the explainability rule, a lowered confidence
must surface its reason, exactly as `conflictNote` does. Something like *"your
closet mixes close- and loose-fitting tops, so we're less sure which you want
here."*

### 1.4 Area-specific misfit — *medium value, real extra input*

`areaNotesJson` already exists in the schema (`{"shoulders":"comfortable",
"chest":"slightly tight"}`) and is, as far as the engine is concerned, dead
weight — nothing reads it. A per-area bipolar rating would let the engine learn
that a given user is *specifically* broad in the shoulders, which is exactly the
case the multi-dimensional engine was built to handle.

Deferred, because it costs 3–5× the interaction of a single rating. Section 3
scores it and it does not clear the bar yet.

### 1.5 Cross-user brand knowledge — *high value, and the only real attack surface*

"This brand runs small on broad shoulders", aggregated across members, feeding the
engine, is the moat named in
[`community-ecosystem.md`](community-ecosystem.md). It is also the **only** place
where one person's data affects another person's recommendation — which makes it
the only place adversarial data is a security problem rather than a self-inflicted
one. See §2.

---

## 2. Bad data: two threat models, not one

The founder's concern — "有人捣乱瞎填数据" — is correct, but it splits into two
problems with **different severities and different fixes**. Conflating them would
lead us to over-engineer the cheap case and under-engineer the dangerous one.

### 2.1 Self-directed garbage — low severity, do NOT over-police

For everything in §1.1–1.4, the data is a person describing their **own** closet
to improve their **own** recommendations. If they enter nonsense, the blast radius
is their own account. There is no incentive to lie, and the feedback loop is
immediate and self-correcting: bad input → bad recommendation → visible to them.

**This is the opposite of a public review system**, where the rater and the person
harmed are different people. Most anti-abuse machinery exists to fix that gap, and
importing it here would tax honest users to defend against an attacker who is only
hurting themselves.

The proportionate response is **consistency feedback, not enforcement**:

- **Internal contradiction check.** If a user says a garment fits *true* but the
  brand's own published chart for that size sits 15cm from their stated chest, one
  of the three facts is wrong. Surface it as a gentle question ("Your Uniqlo M is
  a size we'd have expected to feel tight — want to check the size or your
  measurements?"), never as a block.
- **Never silently discard.** A contradicting item may be the most informative
  item they own — a brand whose sizing is genuinely unusual is exactly what we
  want to learn. Down-weight, ask, log; do not delete.
- **Ratings are already time-stamped** (`ComfortCheck` history), so drift is
  distinguishable from noise: a rating that changes slowly is a body changing, a
  rating that changes randomly is noise.

### 2.2 Aggregated cross-user signals — high severity, defend properly

The moment closet data feeds a **shared** brand-level prior (§1.5), a user can
affect strangers' recommendations, and the standard threats apply: careless
raters, deliberate distortion, and collusion.

The established defences, which we should adopt before shipping any cross-user
aggregation:

- **Robust aggregation, never the mean.** Median and trimmed mean bound the
  influence of extreme values; this is the standard Byzantine-resilient result.
- **Minimum-evidence threshold.** No shared claim from a handful of reports.
  Precedent: Zalando's **SizeFlags** raises size flags from weakly-annotated
  customer data using a probabilistic Bayesian model with expert priors, validated
  by large-scale A/B testing across 14 countries on 469 textile articles
  / 27,773 orders and 2,219 shoe articles / 53,951 orders. ⚠ We could **not**
  extract its actual thresholds or the mechanism protecting a flag from a small
  number of noisy customers — the PDF did not yield a readable method section.
  **Treat SizeFlags as precedent that the approach works, not as a specification
  to copy.** Getting those details is a prerequisite for building §1.5.
- **One person, one vote, weighted by track record.** Reputation weighting —
  discounting raters who behave inconsistently over time — is the standard
  complement to robust aggregation. We already have the substrate: earned badges
  and `ComfortCheck` history are a real track record that cannot be bought.
- **Cap any single account's influence** on any single brand/category cell,
  regardless of reputation.

**Hard rule to carry forward:** a cross-user aggregate must never be able to move
a recommendation *further* than that user's own data would. Shared knowledge is a
tie-breaker, never an override.

---

## 3. The interaction-cost budget

The founder's instruction: *"任何需要操作的都需要扣大分"* — design a metric that
penalises every required user action, use it to cut data collection and decisions
down to what is genuinely necessary, and keep what is necessary.

### 3.1 Grounding

**Nielsen Norman Group** defines the concept exactly:

> "Interaction cost is the sum of efforts — mental and physical — that users must
> deploy in interacting with a digital product in order to reach their goals."

and enumerates the contributors: **reading, scrolling, looking around,
comprehending, clicking or touching (without making mistakes), typing, page loads
and waiting times, attention switches**, and **memory load** — "the information
that users must remember in order to complete their task".

**Baymard Institute**, from 10+ years of checkout research, adds the two findings
that shape the metric's structure:

> "the number of form fields in a checkout impacts overall usability far more than
> the number of steps"

and that **perceived** field count matters more than actual count. So: count
fields, not screens — and a field the user never sees costs nothing.

⚠ Widely-quoted figures — HubSpot's "each additional field cuts conversion ~4.1%",
Formstack's "11 → 4 fields = +120% conversion" — are **vendor-reported marketing
studies**, not peer-reviewed, and the ranges different vendors quote disagree
(4.1% vs 5–10%). They are directionally consistent with Baymard and are used
below **only** as ordinal justification (typing costs more than tapping), never as
calibrated constants.

### 3.2 The metric — FIC (Fit Interaction Cost)

Every feature that asks the user for anything is scored before it is built.

**Cost, per item of input:**

| Action asked of the user | FIC |
|---|---|
| Nothing — derived, inferred, or already known | **0** |
| One tap, binary, no thinking (yes/no, keep/skip) | **2** |
| Pick from 2–5 visible options | **3** |
| Pick from >5 options, or a scroll/slider to a value | **5** |
| Type a number | **6** |
| Type free text | **10** |
| Upload a photo | **12** |
| **Modifiers** | |
| + user must recall something not on screen (memory load) | **+8** |
| + user must make a judgement they may be unsure about | **+5** |
| + requires navigating to another screen | **+5** |
| + blocks progress until answered (required field) | **×2** |

**Value, per signal — what the engine actually gains:**

| What it buys | Value |
|---|---|
| Changes which size is recommended | **10** |
| Changes the confidence, with a stated reason | **6** |
| Improves an explanation the user reads | **3** |
| Nothing the engine reads today | **0** |

**Rule: build it only if `value ≥ cost / 2`.** And two budget caps:

- **First-run budget: FIC ≤ 30 total** before a user gets their first real size
  answer. (Roughly: pick a category, pick a size, one bipolar tap, per item.)
- **Per-interaction budget: FIC ≤ 10** for any single "add one more thing" action
  after onboarding.

**Honesty about these numbers:** the point weights are **mine, not measured** —
a forced-ranking device to make trade-offs explicit and comparable, calibrated
only to the *ordinal* claims that survive the sourcing above (nothing < tapping <
choosing < typing; memory load and required-ness are real multipliers per NN/g).
They are not empirical constants and must not be presented as such in a
deliverable. Their job is to stop "just one more field" from winning every
argument by default.

### 3.3 Applying it — what the metric kills and what it keeps

| Feature | Cost | Value | Verdict |
|---|---|---|---|
| Bipolar fit tap replacing the 1–5 dropdown | 3 (was 5: >5 options + judgement) | 10 | **Build. Cheaper *and* more valuable than what it replaces.** |
| Personal ease target (§1.2) | **0** — derived from existing data | 10 | **Build first.** Free. |
| Preference-consistency confidence (§1.3) | **0** — derived | 6 | **Build.** Free. |
| Numeric mode switch (1–20 scale) | 5, and only for users who opt in | 6 | **Build, opt-in, never the default.** |
| Per-area bipolar ratings (§1.4) | 3 × 4 areas = 12, +5 judgement | 6 | **Defer.** Fails the bar. Revisit as an optional deepening on items the user has already flagged as problematic. |
| Free-text "how does it feel" | 10, +5 judgement | 3 | **No.** |
| Asking for a photo at add-time | 12 | 0 (engine reads nothing) | **No** — keep it optional and unprompted, as today. |

Note what the metric does to the **existing** UI: the current `1/5 … 5/5`
dropdown scores **5 + 5 (judgement) = 10** and delivers a signal the engine can
only use as a trust multiplier. It is the single worst cost/value ratio in the
closet flow, and replacing it is a net *reduction* in user effort.

---

## 4. The proposed input: one control, two modes

### 4.1 Default mode — descriptive, bipolar, one tap

Five options, in the order the body experiences them, replacing the dropdown:

```
  Too tight  ·  A bit snug  ·  Just right  ·  A bit roomy  ·  Too loose
      −2           −1             0             +1             +2
```

- Wording follows the apparel-fit literature's **too tight / tight / just right /
  loose / too loose**, in ordinary English rather than research register.
- **"Just right" is pre-selected.** Grounded, not a guess: in both public fit
  datasets the overwhelming majority of feedback is "fit" — ModCloth 52,222 of
  76,059 (~75%) and RentTheRunway 142,042 of 192,523 (~74%). Defaulting to the
  modal answer means the common case costs **zero taps**, and only the rare,
  *informative* answers cost anything. This is the label-imbalance finding used as
  a UX decision instead of a modelling nuisance.
- Because it is an item in the user's own closet, the item is *already* one they
  chose to keep — so the distribution should skew even harder to "just right"
  than the retail datasets do.

### 4.2 Optional mode — numeric

A switch, per the founder's request, to a **1–20 comfort scale** for users who
prefer precision. Design constraints:

- It must map onto the **same internal bipolar scalar**, so the engine has exactly
  one input and one set of tests. A numeric scale that means something different
  from the descriptive one would double the engine's surface area for no gain.
- ⚠ **Open problem, flagged not solved:** a 1–20 *comfort* scale is unipolar again
  — it reproduces the exact defect §0 identifies. The likely resolution is a
  **signed** numeric range (e.g. −10 … +10, "tight" to "loose", 0 = perfect)
  rather than 1–20 comfort. This needs the founder's decision before it is built;
  do not implement 1–20 comfort as stated without resolving it.
- The switch is **sticky per user**, never per item — mode-switching mid-closet
  would make the data incomparable with itself.

### 4.3 Why this makes people *want* to do it

The founder's requirement that the UI make users *want* to do complex things is
not decoration; it is the only reason the data exists. Three mechanisms, all of
which the codebase already has precedent for:

1. **Answer sensations, not grades.** "A bit snug" is a memory; "3 out of 5" is a
   judgement about a memory. NN/g's memory-load and our judgement modifier both
   price the second higher.
2. **Show what the answer bought, immediately.** The existing Fit Refresh
   card-stack (`/refresh`) is the right container — swipe-driven, one item at a
   time, keyboard-navigable. Adding "you just moved Uniqlo down half a size for
   yourself" closes the loop that makes effort feel repaid.
3. **The prestige system already rewards it.** The `fit-record` badge track is
   earned from real `ComfortCheck` counts. Effort → earned status is already wired
   and cannot be bought.

---

## 4bis. The animated figure — a good idea that must not be a drag slider

Proposed 2026-08-25: a small figure wearing the garment, where sliding makes the
clothing tighten or loosen, so the user *sees* what they're reporting.

**The instinct is right and the mechanism is wrong**, and the evidence against the
mechanism is unusually decisive — decisive enough that it changes the design
rather than merely qualifying it.

### The evidence against drag sliders as an input

Funke (*Social Science Computer Review*, 2016) ran a web experiment comparing
three formats that look nearly identical on screen but differ mechanically:

- **VAS** — point and click: **two** actions (move pointer, click).
- **Slider scale** — drag and drop: **four** actions (move pointer, click and
  hold, move handle, release).

Measured break-off (people abandoning rather than answering):

| Format | Break-off |
|---|---|
| Radio buttons | 1.5% |
| Slider scale | 4.2% |
| **Slider, on smartphones/tablets** | **37%** |
| Radio buttons, on smartphones/tablets | 2.3% |
| Slider, respondents with a low final school grade | 11% (vs 2.2%; OR 5.6) |

The author's recommendation is explicit: **use radio buttons for discrete
variables, VAS for continuous ones, and avoid slider scales entirely.** The wider
literature is consistent — a separate finding puts slider break-off at OR 6.9 with
"overall, it is recommended to avoid slider scales", and notes the problem is
worst for less-educated respondents, which points at cognitive load rather than
dexterity.

Two further defects specific to a handle-at-rest slider matter for us: an initial
handle position **anchors** the answer toward wherever it starts, and if it starts
at a valid value, **non-response is indistinguishable from a deliberate choice** —
we would not be able to tell "this garment feels just right" from "this person
never touched the control". That silently corrupts exactly the signal §1 is built
on.

**Note that §3.2's FIC table predicted this independently**: "pick from 2–5 visible
options" scores 3, "a scroll/slider to a value" scores 5. The invented weights
happened to reproduce the ordering the measurement literature reports — mild
evidence the rubric is calibrated somewhere near reality, and it is recorded here
because it would be equally worth recording had it come out backwards.

### Where the animation *should* live

The comprehension benefit is real; it just has to be decoupled from the act of
answering. Three placements, ranked:

**1. On `/check`, as explanation — build this first.** Show the recommended size
on the figure, and let the user step through the *other* sizes to see why M and
not L. **This collects nothing**, so there is no break-off risk at all, and it
serves the project's actual wedge: the engine already computes per-size ease in
centimetres and an ordinal verdict, and this makes that arithmetic visible instead
of textual. Highest value, lowest risk, and it does not touch the closet flow.

**2. In the closet, as feedback on a tap — not as the input.** Keep the five
discrete options from §4.1 (radio-button semantics, which is what the research
recommends for a discrete variable). Tapping "a bit snug" **animates the figure to
that state**. The user gets the visual confirmation; we keep radio-button response
quality. Crucially the animation is a *consequence* of the answer, never the
means of giving it.

**3. As the numeric mode — and this resolves §4.2's open question.** If the signed
scale is built, it should be a **VAS: tap a point on the line**, with the figure
responding — *not* a drag handle, and **with no handle drawn at rest** so that
"not answered" stays distinguishable from "answered zero". A drag affordance may
be offered as an *enhancement* for users who want it, but the tap target must be
the primary and sufficient interaction.

### Two constraints that are not optional

**It must be schematic, not photoreal — this is an invariant, not taste.**
[`fit-algorithm-research.md`](fit-algorithm-research.md) §1 opens with the finding
that *every* mainstream image-based try-on transfers **appearance, not fit**, and
concludes: keep size recommendation separate from any try-on visual. A figure that
looks like a person wearing clothes is a try-on visual, and would quietly make the
exact promise the research says nobody can keep. So: an abstract body, visible
ease shown as a gap, **the centimetre number displayed alongside the picture**, and
a look that reads as a *diagram of the engine's computation* rather than a preview
of the wearer. `OutfitMannequin.tsx` (156 lines, `viewBox="0 0 100 120"`, already
morphs by body type) is the right starting asset precisely because it is already
schematic.

**It must not re-introduce the performance bug this project has already fixed
twice.** A garment morphing under a moving pointer is *exactly* the pattern that
made `MetalCard` and then `BadgeCoin` re-render 60–120×/second — see
[`project-fit-passport-performance.md`](../memory/project-fit-passport-performance.md).
Non-negotiable: **write CSS custom properties to the DOM via ref, rAF-coalesced,
measuring any rect once on enter. Never `setState` per pointer move.** Placement 1
(discrete steps between sizes) and placement 2 (a transition between five fixed
states) both avoid continuous pointer tracking entirely, which is a further reason
to prefer them over a free-drag control.

⚠ **Honest gap:** the *positive* half of this argument — that seeing the effect
helps someone answer more accurately — is **not directly evidenced** for this task.
The supporting literature found is adjacent (visuo-motor skill learning, text
comprehension, and a perceptual-decision study where feedback reduced response
bias and improved confidence calibration), plus NN/g's memory-load principle. The
*negative* half — that drag sliders cost responses — is directly measured and
should be treated as much stronger. Design accordingly: the animation is justified
as an **explanation** feature, where its benefit is self-evident, rather than as a
data-quality intervention it has not been shown to be.

---

## 5. Sequencing

Ordered so that every step is either free or self-justifying, and nothing
governance-sensitive ships before its defences.

0. **The size-comparison figure on `/check`** (§4bis, placement 1). Collects
   nothing, risks nothing, and makes the engine's existing per-size ease
   arithmetic visible. Independent of everything below — it can be built first or
   in parallel.
1. **Schema + engine, zero UI change.** Add a signed `fitDirection` field
   alongside `fitRating`; back-fill nothing. Derive the personal ease target
   (§1.2) and preference-consistency confidence (§1.3) from data already in the
   closet. **FIC cost 0.** Testable in isolation.
2. **Replace the 1–5 dropdown** with the five-way bipolar control (§4.1),
   defaulted to "Just right". Net FIC *reduction*.
3. **Consistency feedback** (§2.1) — questions, never blocks.
4. **Numeric mode** (§4.2) — only after the signed-scale question in §4.2 is
   settled.
5. **Per-area ratings** (§1.4) — only if interviews say people want the
   granularity; currently fails the FIC bar.
6. **Cross-user brand knowledge** (§1.5) — **blocked** on retrieving the SizeFlags
   method details and implementing §2.2's defences. This is the one item where
   shipping early is a real risk rather than a rough edge.

Customer interviews (the current top priority) should test §4.1's wording
directly — five options is a hypothesis about vocabulary, and five people can
falsify it in an afternoon.

---

## Sources

**Fetched and quoted directly:**
- Nielsen Norman Group, *Interaction Cost: Definition* —
  https://www.nngroup.com/articles/interaction-cost-definition/
- Baymard Institute, *Checkout Optimization: Minimize Form Fields* —
  https://baymard.com/blog/checkout-flow-average-form-fields
- Nestler et al., *SizeFlags: Reducing Size and Fit Related Returns in Fashion
  E-Commerce*, KDD 2021 — https://arxiv.org/abs/2106.03532 (abstract + sample
  sizes verified; **method details not retrieved**)
- Misra, Wan, McAuley, *Decomposing Fit Semantics for Product Size Recommendation
  in Metric Spaces*, RecSys 2018 — https://dl.acm.org/doi/10.1145/3240323.3240398
  (label counts via the public Kaggle dataset description)

**Cited, not independently verified (⚠):**
- *An Interpretable Multi-Dimensional Fit Evaluation Framework for Online Apparel
  Size Recommendation*, Textiles 2025 — https://doi.org/10.3390/textiles6030075
  (MDPI returned 403; the too-tight/…/too-loose scale is corroborated by the
  broader apparel-fit literature but the paper itself was not read)
- Lefakis, Koriagin, Lasserre, Shirvany, *Towards User-in-the-Loop Online Fashion
  Size Recommendation with Low Cognitive Load*, RecSys 2020 —
  https://doi.org/10.1007/978-3-030-66103-8_4 (paywalled)
- *Knowing When You Don't Know in Online Fashion: An Uncertainty-Aware Size
  Recommendation Framework* — https://doi.org/10.1007/978-3-030-94016-4_3
  (paywalled)
- HubSpot / Formstack form-field conversion figures — vendor marketing studies,
  mutually inconsistent, used ordinally only.

**Already in the repo, relied on here:**
[`fit-algorithm-research.md`](fit-algorithm-research.md) §3 (the ordinal-fit and
η return-shift lineage), [`community-ecosystem.md`](community-ecosystem.md)
(cross-user knowledge as the moat).

**Added 2026-08-25 (§4bis sources):**
- Funke, *A Web Experiment Showing Negative Effects of Slider Scales Compared to
  Visual Analogue Scales and Radio Button Scales*, Social Science Computer Review
  2016 — https://journals.sagepub.com/doi/10.1177/0894439315575477 (break-off
  figures and the point-and-click vs drag-and-drop distinction quoted directly)
- Toepoel & Funke, *Sliders, visual analogue scales, or buttons: Influence of
  formats and scales in mobile and desktop surveys* —
  https://www.tandfonline.com/doi/full/10.1080/08898480.2018.1439245 (the OR 6.9
  break-off figure and the "avoid slider scales" recommendation; ⚠ retrieved via
  search summary, not fetched in full)
- ⚠ The positive claim that visual feedback aids self-report accuracy is
  **unevidenced for this task**; supporting literature is adjacent only
  (visuo-motor learning, diagramming/comprehension, and feedback effects on
  response bias and confidence calibration —
  https://pmc.ncbi.nlm.nih.gov/articles/PMC9096460/).


---

## 6. What shipped, 2026-08-25

Built and verified end-to-end on a clean production build. **237 tests** (was 209).

| Piece | Where |
|---|---|
| The signed scale, its five descriptive options, the ladder-shift mapping, and the derived star rating | `src/lib/fitDirection.ts` (+ 20 tests) |
| `KnownGoodItem.fitDirection`, `ComfortCheck.direction`, `User.fitScaleMode` | `prisma/schema.prisma` |
| Directional anchor correction and the explanation that names the report | `src/lib/fitEngine.ts` (+ 8 tests) |
| The dual-mode control, mode carried by context and persisted per user | `src/components/FitDirectionInput.tsx` |
| The schematic body-vs-garment figure | `src/components/FitFigure.tsx`, rendered on `/check` |
| Closet add/edit, and the Fit Refresh card stack, both reporting direction | `src/app/closet/page.tsx`, `src/app/refresh/page.tsx`, `src/app/api/closet/**` |

**Decisions taken while building, worth knowing:**

- **The numeric scale is signed −10…+10**, settling §4.2's open question. A 1–20
  comfort scale was rejected for being unipolar again.
- **`fitRating` is now DERIVED, not asked.** It still drives stars, badge stats
  and legacy anchor trust, so it could not be deleted — but asking for both was
  asking the same question twice. `ratingFromDirection()` maps |direction| to
  5/4/3/2, never 1, and a test pins that a centred report clears the `>= 4`
  threshold `hasStrongAnchor()` needs, or the [F1] anchor fix would have silently
  stopped firing.
- **A directed anchor is trusted at a flat 0.9, not `fitRating/5`.** Otherwise
  "too tight" is penalised twice — once by the correction we just applied, and
  again by the low star rating it naturally attracts — when it is in fact one of
  the most informative items in the closet.
- **Fit Refresh had to move too.** Left alone it would overwrite `fitRating`
  while leaving a stale `fitDirection` on the same row, so the two would
  contradict each other. Its native `<input type="range">` is also a drag control,
  which §4bis argues against; it is now the same five-way choice, with number keys
  1–5 mapping tight → loose.
- **`fitDirection` is NOT exposed by `/api/view/[code]`.** The endpoint uses an
  allow-list `select`, so it was excluded by default and left that way. Widening
  what an account code reveals is a governance decision, not a side effect of a
  feature — **flagged for the founder rather than decided here.**
- **`body` was added to the `/check` and `/recommend` responses** so the figure
  can draw without a second round trip. That is the user's own session; the
  privacy invariant governs `/api/view/[code]`, which was re-verified as returning
  no measurement field of any kind.

**Verified live, not assumed:** the same anchor with the same stars and only the
sign flipped produces different sizes (M reported *too tight* → L, *too loose* →
the anchor argues S and the engine flags the disagreement and drops confidence to
0.46 with a stated reason, *just right* → M). Out-of-range direction is rejected
400. The refresh path writes rating 2 / direction −10 together and the next check
immediately says *"Your Uniqlo M runs too tight."*
