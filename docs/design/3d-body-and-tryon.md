# A 3D body, and what it can honestly be for

> **Status: DESIGN SKETCH. Nothing here is built.** Written 2026-09-01 at the
> founder's request to "think about how to do a 3D simulated real-person
> model / image". It states what the phrase can mean, which parts are possible,
> which are blocked and on what, and recommends an order. It stops there.

## 0. Three different products share one phrase

"3D 模拟真人模型/图片" can mean at least three things, and they have almost
nothing in common — different inputs, different blockers, different honesty
problems. Separating them is most of the work:

| | What the user sees | What it needs | Honest claim |
|---|---|---|---|
| **A. Your body** | A 3D figure shaped like *you* | The measurements they already typed | "This is what you told us" |
| **B. Your body in this garment** | The same figure, wearing the size you're considering | Garment geometry we do not have | "This is the ease, in 3D" — *if* scoped right |
| **C. A photoreal try-on image** | A photo-like person wearing the item | An image-generation API | "This is a picture, not a fit" |

The project already holds a position on C, has a hook wired for it, and has
never attempted A or B.

## 1. The constraint this project already put on itself

`docs/design/fit-algorithm-research.md` §1 is titled "The single most important
finding" and says:

> Every mainstream image-based virtual try-on system transfers *appearance*, not
> *fit*. […] **keep size recommendation separate from any try-on visual** — a
> try-on image is a marketing/visualization layer, never the fit decision.

Google's own TryOnDiffusion page is quoted there verbatim: *"we don't promise
fit and for now focus only on visualization of the try on."*

This became **invariant ⑲**: `FitFigure` is a diagram, not a try-on — schematic,
true proportion, centimetre number printed beside it, captioned "Not a preview of
how it will look."

**Nothing found while researching this changes that.** Everything below is
designed to live *underneath* that constraint rather than around it.

## 2. The number that decides whether a photo can measure you

This is the crux, and it is not a matter of taste.

**What the engine's resolution actually is** (`fitEngine.ts`, this repo):

| | Value |
|---|---|
| Chest scoring sigma | **4 cm** |
| Shoulder scoring sigma | **2.5 cm** |
| Chest step between adjacent sizes, real charts in `extractor.ts` | **4–6 cm** |
| Shoulder step between adjacent sizes | **1–2 cm** |

**What photo-based body measurement actually achieves:**

| Method | Chest circumference MAE |
|---|---|
| CVPR 2025 state of the art (Chen et al., "A Focused Human Body Model") | **3.32 cm** |
| Commercial body-measurement apps, same paper's comparison | **5.1 cm** |
| Single-image reconstruction, typical range reported in industry practice ⚠ | 3–12 cm |

⚠ The CVPR numbers come from search summaries of the paper — the Open Access PDF
returned HTTP 403 and could not be read directly. The 3–12 cm range and a
reported 5–8 cm bust/waist/hip error come from a company engineering blog
(clad.you), i.e. self-reported and not peer-reviewed. Both are cited as
*ordinal* evidence — photo estimation is a several-centimetre business — not as
calibrated constants.

**Put those two tables side by side.** The best published error on a chest
measured from a photo is *roughly one full size step*, and two to five times the
entire shoulder step. A photo-derived measurement fed to this engine would not be
a weaker signal than a typed one — it would be **noise the width of the answer**.

So: **a photo cannot replace the user typing their chest.** Not "not yet" —
not at any error rate anyone currently publishes.

### But it can be a prior, and that machinery already exists

`populationPrior.ts` already does exactly the right thing with an uncertain
body: fill from a regional survey mean, flag `chestIsEstimated`, cap confidence
at ≤0.4, and say "regional averages — add yours for accuracy" in the answer
itself.

A photo estimate is a **better prior than a regional average and a worse fact
than a tape measure.** It slots into that existing slot with no new concepts:
photo → estimate → flagged, capped, and offered for correction. The user then
fixes the numbers that are wrong, which is a far cheaper interaction than typing
three from scratch.

That is the only defensible use of a photo here, and it is a real one.

## 3. Licensing: the part that quietly kills the obvious approach

The textbook parametric human body is **SMPL** (Max Planck). It is **patented**,
and commercial use requires a negotiated licence — historically through
Meshcapade, which **Epic Games acquired in February 2026**. Pricing has never
been public.

Most of the academic pipeline in this area — including much of the try-on and
garment literature — is built on SMPL, so "just use the standard model" is a
commercial trap, not a shortcut. **Any candidate library must be checked for an
SMPL dependency before it is adopted**, the same way an SVG gets checked for a
`<path>` (invariant ㉗).

Permissively licensed alternatives do exist and are recent:

| | Licence | Note |
|---|---|---|
| **Anny** (Naver Labs) | **Apache 2.0** | Parametric body from MakeHuman/MPFB2 assets (**CC0**). Parameters are *interpretable* — gender, age, height, weight, muscle — not abstract coefficients. Its optional SMPL-X topology is non-commercial; the default topology is not. |
| **MHR** (Meta) | **Apache 2.0** | Body model that Meta's SAM 3D Body outputs directly, i.e. a permissive photo→body path exists end to end. |
| **GarmentCodeData** (ETH Zurich, ECCV 2024) | open pipeline | 115k made-to-measure 3D garments with sewing patterns, XPBD draping, and automatic tailor's measurements on a body. ⚠ Body-model dependency not verified — check for SMPL before relying on it. |

Anny's parameter list is a striking match for what `FitProfile` already stores.
That is not a coincidence — both are trying to describe a body to a human rather
than to a solver.

## 4. Option B is blocked by data, not by graphics

The instinct is that "3D try-on" is hard because rendering cloth is hard. It
isn't — XPBD cloth in a browser is a solved problem and three.js is already in
this stack.

**The blocker is that we have no garment geometry and no route to any.** A
product page yields four numbers — chest, shoulder, sleeve, length. A simulated
garment needs 2D pattern pieces, seam topology, and fabric parameters (stretch,
weight, drape). None of that is on the page, none of it is in the size chart, and
extracting it is not a harder version of what `extractor.ts` does — it is a
different problem.

**The way through is to stop pretending we have the garment.** We have its
*measurements*. A shell generated from those four numbers is not the Uniqlo
shirt — but it is the Uniqlo shirt's **ease**, in three dimensions, and that is
the thing the user actually cannot picture.

This is exactly what `FitFigure` already does in 2D, and its comment says why the
abstraction is deliberate. A 3D version is the same honesty with more
information: ease varies around the body, and a flat diagram can only show one
cross-section.

**It must not be styled to look like a garment.** The moment it has a collar and
a hem it is making the appearance claim §1 says nobody can keep.

## 5. What C is today, and what it isn't

`/api/tryon` + `lib/tryonImage.ts` already exist and are **off by default**. When
`TRYON_API_URL` or `REPLICATE_API_TOKEN` is set, they build a **text prompt**
from the garment list plus a coarse body descriptor and call FLUX schnell
(~$0.003/image). They never send measurements or identity.

Worth being precise about what that is: it generates **a generic person** from a
text description. It is not the user, and it is not this garment — it is an
illustration of the outfit's *idea*. As a mood/outfit visual on `/outfits` that
is fine and clearly labelled. As anything attached to a size recommendation it
would be actively misleading, and §1 already says so.

## 6. Recommendation

**Build A. Design B as an ease shell. Leave C where it is.**

In order, smallest first:

**1. A parametric 3D body driven by the measurements the user already typed.**
No photo, no estimation, no new data class. It renders what they told us, which
means it can never be wrong in a way we have to apologise for.

Follow the existing WebGL discipline exactly, because every part of it is a scar:
`React.lazy` + `Suspense` as `Badges.tsx` loads `BadgeInspect`; **wrapped in
`SafeBoundary`**, because a failed three.js chunk silently blanks the subtree
rather than erroring; one renderer, with `forceContextLoss()` and a full dispose
on unmount (`BadgeWebGL.tsx:209` is the reference); and no pointer-driven React
state at all. Default to the flat `BodyFigure` and treat 3D as an opt-in stage —
badges went flat-by-default on 2026-08-25 after the dimensional build cost ~140
composited layers on one screen, and a body mesh is not cheaper.

Practical note: Anny is PyTorch, so it is a **build-time** tool, not a runtime
one. Bake a small set of morph targets offline, ship those, and blend them in the
browser from the user's numbers.

**2. The ease shell (B), only after A is real.** Same figure, plus a translucent
surface at garment measurements. Abstract, unstyled, with the centimetres printed
— the same contract `FitFigure` signs today.

**3. Photo → prior, if and only if interviews say people want it.** It is the
most expensive single input in the FIC table (**12 points**, against 6 for typing
a number), and it introduces a **more sensitive data class than anything this app
holds** — a body photo is worse on both counts than the precise centimetres the
privacy invariant already refuses to share. If it is ever built: processed and
discarded, never stored, explicit consent, and the result flagged
`chestIsEstimated` like every other guess.

Note the FIC arithmetic cuts *for* it: a photo at 12 is cheaper than typing chest,
waist and shoulder at 6 each. That is the honest argument in its favour, and it
is an argument about *effort*, not about accuracy — where it loses.

**Do not** attach a generated image to a size recommendation, at any confidence,
with any caption.

## 7. What would change this

- A published photo-measurement method with chest MAE **under ~1.5 cm** — roughly
  a third of a size step — would make the photo path a fact rather than a prior.
  Nothing at CVPR 2025 is close.
- A retailer or aggregator publishing actual garment patterns would unblock true
  try-on. Not something we can cause.
- Interview evidence that people want to *see* fit rather than read it. Currently
  unknown, and the customer interviews that would answer it are deferred.
