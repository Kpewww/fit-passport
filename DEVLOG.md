# Fit Passport — Development Log

One dated entry per work session: what we built, why, what worked, what didn't, and
what's next. Concrete decisions and file references, kept in enough detail that a
decision can be re-examined months later on the reasoning that produced it — including
the ones that turned out to be wrong.

**An entry is owed for every push, not every session**, and it lands in the same
commit as the code so the two can't drift.

Team: Xiangchen Kong · Alyssa Qi · Jenny Cao · Nicolas Wang.

---

## Open engine-tuning findings (running list)

- **[F1] Chest signal can override a good same-brand anchor. → FIXED 2026-08-10 (Sess 02).**
  Walkthrough finding: a slim user (chest 95) with a known-good COS EU 48 in the
  closet got recommended EU 44 for a new COS shirt, because that product's chart
  runs loose and the chest-fit weight (0.45) outweighed the known-good weight
  (0.35). Fix = **adaptive weighting** in `fitEngine.ts`: when the closet has a
  same-brand + same-category item rated ≥4/5 (`hasStrongAnchor`), the engine
  switches from `DEFAULT_W` (chest 0.45 / known-good 0.35) to `ANCHOR_W`
  (chest 0.18 / known-good 0.62) — the anchor dominates and chest-fit becomes a
  tie-breaker. Low-rated anchors (fit ≤3) do NOT trigger this. Cross-brand-only
  closets also stay measurement-led. Covered by 3 regression tests in the
  "anchor dominance [F1]" describe block (11 tests total, all green). This is
  exactly the "which signals actually matter" evidence the proposal calls for
  (§10.2) — we can now show the same product yields different recommendations
  depending on whether the user owns a same-brand anchor.

---

## 2026-09-01 · Session 66 — A dress form built from your own measurements

Asked what we can actually do, done to the best state available now, with the
path onward. Step 1 from yesterday's design doc is built.

**What it is.** `/passport` now offers "See it in 3D": a body lofted from the
girths the user typed. `src/lib/bodyMesh.ts` is the geometry — a stack of
elliptical cross-sections at hip, waist, chest and shoulder, each ellipse carrying
the *circumference* the user gave us. `src/components/BodyMesh3D.tsx` lofts them.
Pure arithmetic on one side, three.js on the other, so the geometry is tested
without a browser.

**Why not a learned body model.** SMPL is patented and out (Session 65). But the
permissive alternatives were rejected too, and for a better reason: a learned
model's job is to plausibly *invent* the hundred dimensions you did not measure,
and this project's whole proposition is that it does not invent. From four to
seven numbers an honest abstract figure says more than a realistic one that is
mostly fiction.

**It came out looking like a tailor's dress form, and that is the answer, not a
compromise.** A dress form *is* a body's measurements made into an object for
fitting clothes, and nobody mistakes one for a photograph of themselves. It
resolves the §1 honesty problem — image try-on transfers appearance, not fit —
by construction rather than by caption.

**Two honesty rules, both pinned by tests:**
- It **refuses to draw a body from no measurements**. A figure invented from
  nothing is decoration pretending to be data.
- `circumferenceCm` is **null for every ring we inferred**, so the panel can never
  print a centimetre the user did not give us. The neck and base rings that make
  the form read as a torso live in a separate `drawingRings()` and are never
  listed — they are drawing, not data, and there is no field for a user to go and
  fill in.

**What it buys over the flat figure.** `BodyFigure` is driven by `deriveBodyType`'s
six volume bands, so every "average" build is drawn identically. This is driven by
the raw numbers: a 100/76/94 chest-waist-hip and a 100/99/101 now render as a
pronounced nip and a near-cylinder. Verified by rendering both.

**Two shape bugs worth remembering.** Uniform Catmull-Rom **overshot** the sharp
shoulder→neck step badly enough that the neck bulged wider than the shoulder — the
first render read as a vase. Centripetal parameterisation fixed it and still
interpolates its control points, so the measured rings stay on their measured
values. And framing the camera on `max(height, width × 1.6)` pushed it back and
squashed the apparent proportions.

**WebGL discipline, all of it a scar:** `React.lazy` + `Suspense` + `SafeBoundary`
(a failed three.js chunk silently blanks its subtree); one renderer with
`forceContextLoss()` and a full dispose; rotation driven through refs inside the
animation loop and never through React state. Verified rather than assumed —
opening the view five times across navigations leaves **one** canvas with a
healthy context, and the idle turn respects `prefers-reduced-motion`.

**Next, and cheap: the ease shell.** A second translucent surface at the
*garment's* measurements around the same form. We already extract chest, shoulder
and sleeve from size charts, so it needs no new data, and it is what turns the
figure from informative into useful — ease is the thing people cannot picture.

**Then the step the backlog already wanted anyway:** capturing the size chart at
add-by-URL time is *already* the top ready-to-build item, for an unrelated reason
(it unblocks a personal ease target in cm). It also unblocks the best version of
this — the shirt you own and love as one shell, the one you are considering as
another, on your own form. Both threads want the same change.

**Verified:** typecheck clean, lint clean (2 pre-existing warnings, neither in a
touched file), **321 → 340 tests**, clean production build after `rm -rf .next`,
and `mobile-audit.mjs` reports no horizontal overflow on `/passport` at 390px with
the 3D panel open.

---

## 2026-09-01 · Session 65 — What a 3D body could honestly be for

Asked to think about how to do a 3D simulated body / try-on image. Researched and
written up as `docs/design/3d-body-and-tryon.md`; **nothing built**, which is what
"think about how" asked for.

**The phrase covers three products with nothing in common.** (A) a 3D figure
shaped like you, from measurements you already typed; (B) that figure wearing the
size you are considering; (C) a photoreal generated image. Different inputs,
different blockers, different honesty problems. Most of the work was separating
them.

**The decisive number is not about graphics.** Best published chest-circumference
error from a photo is **3.32 cm** (CVPR 2025, Chen et al.) and **5.1 cm** for the
commercial apps that paper compares against. This engine scores chest at
**sigma 4 cm** and shoulder at **sigma 2.5 cm**, and adjacent sizes in the charts
already in `extractor.ts` step **4–6 cm** at the chest and **1–2 cm** at the
shoulder. So a photo-measured chest carries an error of roughly one whole size
step. It is not a weaker signal than a typed measurement — it is noise the width
of the answer. **A photo cannot replace typing your chest**, and not for want of
another year of research.

It can be a *prior*, and the slot already exists: `populationPrior` fills an
absent chest from a regional survey, flags `chestIsEstimated`, caps confidence at
0.4 and says so in the answer. A photo estimate is a better prior than a regional
average and a worse fact than a tape measure, which is exactly that slot.

**Licensing quietly kills the obvious approach.** SMPL is patented; commercial use
needs a negotiated licence through Meshcapade, which **Epic Games acquired in
February 2026**, at prices that have never been public. Much of the try-on and
garment literature is built on it, so "use the standard body model" is a trap.
Permissive alternatives are recent and real: **Anny** (Naver, Apache 2.0, on CC0
MakeHuman assets) whose parameters are literally height/weight/muscle/age — an odd
match for what `FitProfile` already stores — and Meta's **MHR** (Apache 2.0).
Candidate libraries now need an SMPL check the way SVGs need a `<path>` check.

**Option B is blocked by data, not by rendering.** XPBD cloth in a browser is
solved and three.js is already here. What is missing is garment geometry: a
product page yields four numbers, and a simulated garment needs pattern pieces,
seams and fabric parameters. The way through is to stop pretending we have the
garment — we have its *measurements*, and a shell built from them is the
garment's **ease** in 3D, which is the thing people cannot picture. That is
`FitFigure`'s existing contract with one more dimension. It must stay unstyled;
give it a collar and it starts making the appearance claim §1 says nobody can
keep.

**Recommendation: build A, design B as an ease shell, leave C alone.** C already
exists and is off by default — worth being precise that `tryonImage.ts` builds a
*text prompt* and generates a generic person, so it is an illustration of an
outfit's idea, never this user in this garment.

Recorded against the photo path: it is the most expensive single input in the FIC
table (12, against 6 for typing a number) and introduces a more sensitive data
class than anything the app holds — a body photo is worse on both counts than the
centimetres the privacy invariant already refuses to share. The FIC arithmetic
does cut in its favour (12 beats 6+6+6 for three typed measurements), and that is
an argument about effort, not accuracy.

Sources are cited in the document, with ⚠ on the two that could not be read at
the primary source: the CVPR PDF returned 403 so its numbers come from search
summaries, and the 3–12 cm industry range is a company blog, self-reported.

---

## 2026-09-01 · Session 64 — hasBody was wrong in both directions, and the mark gets a specimen plate

Two requests: finish the `hasBody` logic flagged last session, and make the help
page's mark section look like something.

### hasBody

The flag was chest/height/waist. Reading the engine rather than guessing at it:

- `scoreMeasurementFit` scores **chest (0.6), waist (0.22), shoulder (0.18)** and
  reads nothing else off the profile. `recommendService.ts` does not even pass
  height, weight, hip, sleeve or inseam into `EngineInput`.
- So the flag **counted height**, which cannot move a size recommendation, and
  **missed shoulder**, which can. A shoulder-only user was told we had nothing
  about them while the engine was already using their shoulder; a height-only user
  was told the opposite.
- Height is not dead data — `deriveBodyType` uses height and weight for the
  passport's coarse body type. It just has nothing to do with picking a size, and
  `hasBody` drives a claim about **sizing** accuracy.

The more interesting finding is that one boolean was answering two questions.
`computeConfidence` adds `CONFIDENCE_WEIGHTS.measurements` for
`hasChest && size.chestCm != null` **and nothing else** — waist and shoulder change
which size wins, never how confident we say we are. But `/check` gates "Add your
measurements — worth up to +35 points" on `hasBody`. So a user who entered a waist
saw that step ticked while the 35 points were still sitting there unclaimed. The
promise and the tick disagreed.

Now two flags, because there are two questions:

- `hasBodyMeasurement` — chest ∪ waist ∪ shoulder. Can the engine score this
  person at all. Drives the accuracy tier and the first-run nudges.
- `hasChestMeasurement` — chest only. Would adding a measurement still raise the
  confidence number. Drives `/check`'s offer, whose label now reads "Add your chest
  measurement" for someone who already has other dimensions.

`ENGINE_SCORED_DIMENSIONS` is exported and pinned by a test, so adding a field to
`FitProfile` cannot silently widen what we claim the engine does with it.

Verified against a running server rather than reasoned about, one dimension at a
time: chest/waist/shoulder each give `hasBody=true`, height/weight/inseam each give
`false`, and only chest gives `hasChest=true`.

### The mark

The copy was already right — Session 62 fixed it to the concept document's own
words — so **not a word of it changed**. Only the presentation:

- The mark reversed out of an ink band with the tagline, instead of a 96px logo
  bolted to the left of a grey paragraph. It takes its colour from `currentColor`,
  so this needed no new asset.
- The Ariadne mapping reads across as three numbered steps rather than down as a
  definition list. It is a journey — labyrinth, thread, way out — and it should
  look like one.
- "It's the memory that travels through clothing" promoted to a pull quote. It is
  the sharpest sentence in the section and it was set as a footnote.
- **The size floor is now shown, not just asserted.** The mark at 96 / 40 / 24 /
  16 px beside the caption that claims it stops working below about 20. Checked at
  `deviceScaleFactor: 1` per invariant ㉖, because a 2x screenshot hands a 16px
  mark 32 device pixels and flatters it — at true device pixels the 16px loop does
  fill in and 24 does hold, so the demonstration supports the sentence next to it.
  This is a project that measures things and publishes the evidence; a claim the
  reader can check in place beats the same claim asserted.

One layout bug caught and fixed before it shipped: on a phone the size row wrapped
and dropped 16px onto its own line, which breaks the one thing a size comparison is
for. It is a fixed four-column grid now.

**Verified:** typecheck clean, lint clean (3 pre-existing warnings, none in touched
files), **314 → 321 tests**, clean production build after `rm -rf .next`, and the
project's own `mobile-audit.mjs` reports no horizontal overflow on `/help`, `/check`
or `/` at 390px.

---

## 2026-09-01 · Session 63 — "Set your fit preference" was ticked before anyone touched it

Reported: the first checklist step shows as complete on a brand-new visit, and
clearing the cache does not help.

**Reproduced before reading further** — `curl` with no cookie at all, against a
running server: the very first `/api/status` response comes back with
`profileExists: true` and the step already ticked. A second cookieless request
behaves identically, which is why clearing the cache changed nothing: the state
was never in the browser.

**Cause.** `getCurrentUser()` in `lib/session.ts` creates the `User` and a
`FitProfile` **in the same upsert**, seeding `preferredFit: "regular"` and
`region: "US"` so the engine always has something to read. `/api/status` itself
runs through `getCurrentUser()`. So the sequence on a first visit is: the status
call creates the profile, then queries for the profile, then finds the row it
just created. `done: !!profile` was therefore true on the first request, for
everyone, always. A fresh cookie just minted a fresh already-"done" row.

The tell was three lines above the bug: `hasBody` carries the comment "beyond
defaults" and correctly checks for values. Whoever wrote it knew about the seeded
row; the step below it just asked the wrong question — "is there a row" rather
than "did the user say anything".

Corroboration: `/check` renders its own version of the same checklist off
`status.hasBody`, and showed the step as **not** done. The two surfaces disagreed,
and the one with the weaker check was the one on the homepage.

**Fix.** `src/lib/profileCompleteness.ts`, with `hasStatedProfile` answering the
question the label actually asks. Two signals, both needed:

1. **The row has been written since it was created.** Prisma sets `@updatedAt`
   equal to `@default(now())` on create — measured against the local database,
   delta exactly 0 — so any later save moves them apart. This is the only signal
   that catches a user whose honest answer *is* the seeded default: they pick
   "regular" and "US", change nothing else, and still deserve the tick.
2. **A field we never seed holds a value.** Every one listed is nullable with no
   default, so a value can only be the user's. This catches rows written in a
   single `create` — the demo seeder does that — where the timestamps match
   despite the values being real.

Verified end to end afterwards, not just unit-tested: a cookieless request now
returns the step undone with `nextStep: "Set your fit preference"`, and a POST to
`/api/profile` sending **only the seeded defaults back** flips it to done. That
last case is the one a field-by-field check would have got wrong.

**Deliberately not changed, and worth a decision.** `hasBody` is
chest/height/waist, but `scoreMeasurementFit` scores chest/waist/**shoulder** and
never reads height. So someone who entered only a shoulder is told they have no
measurements while the engine uses it, and someone who entered only a height is
told the opposite. Changing it moves the displayed accuracy tier for existing
users — a product decision, not a bug fix, and now written into the module rather
than left to be rediscovered.

**Verified:** typecheck clean, **304 → 314 tests**, clean production build after
`rm -rf .next`, and the reproduction re-run against the fix.

---

## 2026-08-28 · Session 62 — The mark's meaning had drifted from its own document

The founder pointed out that the logo's story and its mythology were already written
down in the repo. They were, in `docs/design/LOGO_CONCEPT.md` — 326 lines of it, with
cited sources — and I had not read it. Yesterday's `/help` section was written from
the memory file's one-line summary instead.

**The summary was wrong, and had been for a while.** It said *"the line stands for the
measurement and the loop for the garment it comes back around to."* That reading
appears **nowhere** in the concept document. §2 gives six documented readings and none
of them splits the mark into measurement-versus-garment; the primary reading in §3 is
**Ariadne's thread**, which the summary omitted entirely.

By the time it was caught the invented line had reached three places: the memory
file, `Logo.tsx`'s header comment, and — because I reached for the summary rather
than the source — the live site.

### What the document actually says

The labyrinth is sizing that disagrees across brands and regions. The thread is the
wearer's accumulated fit memory. The way back out is an explainable recommendation.
And the half of the myth the brand is meant to centre is that **Ariadne gives Theseus
the means to navigate without taking over** — which is the product's posture stated
in one image, and far better than anything I would have written.

§16 carries approved public wording, which is now used verbatim rather than
paraphrased: *"One thread through the maze of fit."* / *"Across brands, sizing becomes
a labyrinth. Fit Passport keeps the thread…"* / internally, *"the logo is not a
picture of clothing. It is the memory that travels through clothing."* The section
also carries the document's own disclaimer — the myth is a lens for reading a modern
mark, not a claim of ancient provenance.

`/help` is rewritten around that, with a three-row myth mapping. The size-floor note
stays: it is measured fact, and it is what makes the favicon being a different glyph
read as a decision rather than an inconsistency.

### The correction, and the rule it produces

Fixed in all three places, and both the code comment and the memory file now carry an
explicit note saying what the old reading was and that it was invented — a silent fix
would leave the next person free to reintroduce it from an old copy.

**The rule: a summary is downstream of its source, and when the summary is the thing
you reach for, its errors ship.** `docs/memory/` exists to save time on things not
obvious from the code — it is not a substitute for a design document that a human
wrote deliberately. The memory file now says so about itself: *it is a pointer, not a
paraphrase.*

This is the same failure shape as the four-copy colour palette (invariant ㉛) and the
`Logo.tsx`-versus-master path drift (㉚). Both were fixed by making one copy
authoritative and testing the others against it. Prose can't be tested that way, so
the defence has to be the habit: **for anything with a design document, read the
document.**

304 tests, unchanged — copy and comments only.

---

## 2026-08-28 · Session 61 — The invitation now knows what the answer was, and the mark explains itself

Three things the founder asked for together: finish move 2, give `/passport` the same
treatment as onboarding, and put the logo metaphor somewhere on the site.

### Move 2's other half — the number becomes the invitation

`/check` already ran on an empty profile and already showed a "how to sharpen this"
panel. What it did not do was **connect them**: the panel's copy was written in
advance and never saw the answer the person had just been given. That is the one
moment where the cost of missing evidence is visible, and it was being spent on
generic encouragement.

Now the panel reads the result. On a tie it opens *"Every size scored the same"* and
says plainly that this is not a low score but an absence of evidence. On a real
answer it opens with the actual number — *"That answer is 47% confident"* — and each
remaining step carries what it is worth.

**The worth is the engine's own arithmetic, not copywriting.** `CONFIDENCE_WEIGHTS`
now has one home and both the scorer and the UI read it.

### Two things went wrong on the way, and both were caught by the work itself

**The constant was in the wrong file.** Exporting it from `fitEngine.ts` and importing
that into a client component pulled sizing, sizeSystems, brandBias, fitDirection and
closetConsistency into the browser bundle: **/check went 8.91 kB → 10.2 kB** for one
object literal, because the tree-shaker could not drop the rest. Moved to
`lib/confidenceWeights.ts`, a leaf with no imports — back to 9.33 kB, the difference
being the new copy. One home *and* not the whole engine; those pull against each
other and a leaf module is how both hold.

**The first version of the copy overclaimed, and my own test failed it.** I wrote
"worth +35 points" and asserted the delta equals the weight. It doesn't: a bare case
measures **0.18, not 0.30**, because the raw sum passes through six caps and
multipliers — cross-domain, report consistency, top-2 margin, signal agreement, and
hard caps at 0.6 and 0.4. Every one can only shrink it, so the truthful word is
**"up to"**, and the tests now pin what is actually true (confidence never exceeds
the weight sum; never exceeds the floor with no evidence) instead of an equality I
had assumed. **The copy was corrected to match the code, not the other way round** —
which is the only acceptable direction when the product's claim is that its numbers
are checkable.

### `/passport` — the smaller change was the right one

The measured problem was 10 inputs across 3.3 screens on a phone. The obvious move
was to rebuild the form the way onboarding was rebuilt. That would have been wrong.

`/passport` in edit mode is an **edit surface**: someone who came to change one
number should see all of them, and Session 58 made exactly this call about the
closet's edit form. The real defect is narrower — an empty passport *opens in edit
mode*, so a first-time visitor was being met by eight blank number fields with no
guided path offered, even though one now exists.

So an empty passport now shows a short offer for `/onboarding` above the grid — an
offer, not a redirect, with the fields still right there — and `/check`'s "add your
measurements" CTA points at the guided flow rather than the raw grid. The grid is
untouched. **Applying a treatment by rote because it worked somewhere else is not the
same as fixing the thing that was wrong.**

### The mark, on the site

`/help` gains a "The mark" section, with the logo rendered at 96px **beside** the
words rather than described elsewhere: the straight run is the measurement, the loop
is the garment it comes back around to, and the point is that a measurement is only
worth something once it closes around real clothing. It also states the size floor in
plain language, so the browser-tab icon being a different glyph reads as a decision
rather than an inconsistency.

Placed next to the artwork on purpose — a metaphor a reader cannot check against the
thing itself is just an assertion.

### Verified

Typecheck clean, lint clean, **300 → 304 tests**, clean production build after
`rm -rf .next`, bundle sizes checked rather than assumed, and all three walked in a
browser at 390px: the tie copy and the "up to +35 / +25" lines render, the empty
passport shows the guided offer above its ten fields, and `/help` renders the mark
with no overflow.

**Still open:** information-architecture move 3 (intent-led entry) — the largest of
the three and the most likely to be wrong on a first try, which is why it is last.

---

## 2026-08-28 · Session 60 — Two ways the engine was inventing an answer

The founder asked why the closet had "gone back" to a complicated form. It hadn't —
but chasing that produced two defects worth more than the question did, both found by
**driving the live site with a browser instead of reading the code**.

### The closet was fine; the pages either side of it were not

Measured on production at 390px: `/closet`'s add flow shows **1 visible input**
("ADD AN ITEM · 1 OF 4"). Session 58 landed and is live. But `/onboarding` shows
**10** and `/passport` shows **10**, and Session 58's own notes say those surfaces
were explicitly not done. My report of that session said the closet was rebuilt and
did not say the pages around it were untouched — which is how "it didn't work" is the
reasonable conclusion from the outside. The measurement is the fix for that, not the
explanation.

### Defect 1 — a size for a garment we cannot measure

A men's sneaker URL returned **"XS" at 24% confidence** in production.

`buildSizes` in `extractor.ts` ignores the size domain entirely: it branches on
`system === "eu"` and otherwise returns `XS…XL` **with chest measurements attached**,
whatever the category. So a shoe page gets a t-shirt's ladder, and the engine scores
those chest numbers against the shopper. `FitProfile` holds chest, waist, hip,
shoulder, sleeve and inseam — **nothing for a foot** — so there was never a number to
compare with. The answer was not merely low-confidence; it was invented.

`SCOREABLE_DOMAINS` in `sizeSystems.ts` is now the single home for what may be
scored — `top` and `bottom` — and `/api/check` returns **422 `unsupported-category`**
for anything else, with a sentence explaining why rather than a slug. Put in
`sizeSystems.ts` deliberately: adding a domain there is not a UI decision, it needs a
body field to compare against, and the test says so.

### Defect 2 — ladder position presented as a recommendation

Worse, and only visible because the first defect sent me looking. An **empty profile
with an empty closet**, on a t-shirt:

```
XS  score=0.2  conf=0.24  reasons=0
S   score=0.2  conf=0.24  reasons=0
M   score=0.2  conf=0.24  reasons=0     ← all five identical
L   score=0.2  conf=0.24  reasons=0
XL  score=0.2  conf=0.24  reasons=0
best: XS   explanation: "Limited product data — recommendation based on
                         your closet and preference."
```

Three things wrong at once. **XS was the first rung of the ladder**, not a pick.
The explanation named a closet that did not exist. And the UI offered *"Alternative: S
is close"* — S was not close, it was **identical**.

The engine already detected this state (`topReasons.length === 0`); it just had a
false sentence for it. Now `EngineOutput.undetermined` is set when no signal produced
a reason and every candidate ties, `/check` renders **"We can't tell these apart"**
instead of a 48px size beside a confidence ring, the alternative line is suppressed,
and the explanation says what would break the tie.

This one matters beyond the bug: **the whole point of information-architecture move 2
is to let a first size check run on nothing.** Building that invitation on top of a
fabricated XS would have taken the product's worst behaviour and put it on the first
screen a visitor sees.

### Onboarding, rebuilt the way the closet was

`lib/onboardingFlow.ts` + `onboardingFlow.test.ts`, mirroring `addFlow`. Which
questions survive was settled by grepping the scoring modules, not by taste:

    chestCm 32 · shoulderCm 19 · waistCm 15 · region 15 · preferredFit 12 · sex 9
    ---- never read ----
    hipCm 0 · heightCm 0 · weightKg 0 · inseamCm 0 · shopsFor 0 · notes 0

The engine's five `sleeveCm` hits are the **garment's** sleeve on `SizeOptionInput`.
The wearer's own sleeve is never scored — it looks like a hit until you read it, so a
test pins it.

Three steps, one screen each: how you like things to fit → which charts to read you
against → any measurements you know. Five unscored numbers plus `shopsFor` and
`notes` moved behind a disclosure that says plainly the fit engine does not read them.
Nothing was deleted; all of it stays editable.

**`BLOCKING_STEPS` is empty, and a test enforces it.** If a gate ever appears here it
should have to be argued for — the engine answers on an empty profile, so demanding
ten questions first throws away an honest answer to collect data the person may not
have to hand. The skip is a first-class link, not fine print.

Measured, 390px, `deviceScaleFactor=1`, before and after:

| /onboarding | before | after |
|---|---|---|
| Visible inputs | 10 | **0 on the first screen** |
| Screens tall | 3.2 | **1.9** |
| Horizontal overflow | none | none |

### Verified

Typecheck clean, lint clean (three pre-existing warnings elsewhere), **285 → 300
tests**, clean production build after `rm -rf .next`. Both new guards were **checked
red before being kept**: adding `shoe` to `SCOREABLE_DOMAINS` fails two assertions,
and forcing `undetermined` to false fails three.

Then walked through a real browser against the built app: the three onboarding steps
save; a sneaker URL is refused in the UI with the human sentence; and an empty profile
on a t-shirt now reads *"No recommendation yet — we can't tell these apart"* instead
of XS.

**Not done:** move 2's other half — using the honest confidence number as the
invitation to add a garment. The invitation panel already exists on `/check` ("Right
now we'd be guessing"); wiring it to the actual number is the remaining piece, and it
is now safe to build on. `/passport`'s ten inputs are untouched.

---

## 2026-08-28 · Session 59 — One colour palette, and the brand assets stop pretending to be documentation

A tidying pass, prompted by two observations: the colour helper flagged at the end
of Session 58, and the founder's point that the logo does not belong in `docs/`
because we build from it.

**The colour palette had four copies.** `COLOR_PRESETS` and `colorHex` lived
separately in the closet page, `/refresh`, `/u/[code]` and `OutfitMannequin`, in two
different shapes — an ordered `{name, hex}[]` for the picker grid, a `name → hex` map
for everything that turns a stored colour back into a dot. All four agreed when they
were merged, so there was no live bug. There was also nothing making them agree: a
colour added to the picker would simply have rendered as *no dot* on the three pages
that never heard about it, which is the kind of failure nobody reports.

Now one `src/lib/colors.ts`, with `colorHex` (null when it cannot resolve, so no
swatch is drawn) and `colorHexOr` (for the mannequin, which must paint something).
Verified live afterwards rather than assumed: 21 swatches still resolve on `/closet`
with navy/charcoal/black/grey correct to the hex, and the mannequin still falls back
on `/outfits`.

**`brand/` is now a top-level directory.** The masters, delivery exports, archived
raw exports and the size-test moved out of `docs/design/assets/logo/`. The founder's
reasoning was right and the mechanism was worse than it looked: `Logo.tsx` does not
load the SVG, it **inlines the master's path as a string**, so the artwork of record
and the thing users actually see were two hand-synced copies with nothing enforcing
the sync. They happened to be identical — checked, all 3,499 characters — but that
was luck maintained by care, not by anything structural.

`src/lib/logoAsset.test.ts` now fails if they drift: the path, the viewBox, and the
micro stroke width against the micro asset. Verified red before being kept — nudging
one coordinate by 0.01 in the master fails the test. It also re-checks Session 55's
trap on every shipped mark: a `<path>` must be present and no `<image>` or embedded
base64 bitmap, because a filename cannot tell you whether an SVG is a vector.

The written story stays in `docs/design/LOGO_CONCEPT.md`. The split is now: **`docs/`
is what you read, `brand/` is what things are built from.** Old DEVLOG entries still
name the old path on purpose — they were accurate when written, and rewriting history
to look tidy is how a log stops being evidence.

**`credentials_layout.html` was neither.** A design mockup for the glass credential
card, sitting at the repository root under a name that reads like a secrets file. It
tripped the standing pre-commit credential sweep every time, which is how a sweep
gets ignored. Moved to `docs/design/passport-card-mockup.html`, which is what it is.

**Also swept:** no orphaned components or lib modules (checked by import, not by
eye); both READMEs had a stale test count and a directory map that omitted
`docs/memory/` and `docs/RESUME.md` entirely — the two files a new contributor most
needs — now fixed in English and Chinese.

**Verified:** typecheck clean, lint clean, **273 → 285 tests**, clean production
build after `rm -rf .next`, the size-test script runs from its new home, and the
colour rendering re-checked in a live browser.

---

## 2026-08-27 · Session 58 — The closet stops asking eleven questions at once

The information-architecture sketch from Session 56 becomes the first real change.
The founder's complaint was that clicking into any section shows too much to want to
fill in; the closet measured worst, and it is the page whose entire job is to make
someone add three garments.

**What changed.** `/closet`'s add form was an eleven-field grid. It is now
`AddItemFlow` — four questions, one screen each, modelled on `/refresh`, which
measured as the least dense page in the app precisely because it shows one decision
at a time. Brand → type → size → how it sits. The URL paste box moved onto the first
step and now *skips ahead* when it succeeds: read a brand and a category from the
page and the user lands on the size question, which is the only thing extraction
cannot answer for them.

**Which four questions is not a taste call.** The FIC budget in
`docs/design/closet-signal-and-interaction-cost.md` §3.2 prices a field against what
the engine gains. Grepping `fitEngine.ts` settles it: `gender` appears zero times,
`color` zero times, and `areaNotesJson` is written and displayed but never scored.
Name, line, colour, fit notes, photo and the in-store flag are all engine-value 0,
which fails the `value >= cost / 2` rule at any cost above zero. They moved behind an
"Add details (optional)" disclosure on the last step, which says plainly that the fit
engine does not read them. Nothing was removed — every one is still editable on the
item afterwards, in the edit form that already carried all of them.

The four that stayed cost 12 + 5 + 10 + 3 = 30 FIC, which is exactly §3.2's
first-run budget. That is tight on purpose.

**Measured, same script and same account before and after** (390px, logged in,
`deviceScaleFactor=1`):

| /closet | before | after |
|---|---|---|
| Input controls visible at once | 28 | **15** |
| Tappable elements | 127 | **84** |
| Words | 546 | **441** |
| Screens tall | 5.5 | **4.5** |
| Tap targets under 44px | 21 | **14** |
| Horizontal overflow | none | none |

The tap-target drop is not because anything got bigger — it is seven fewer small
controls on screen at one time. Worth stating that way rather than claiming a fix.

(The Session 56 sketch recorded 23 inputs / 104 tappable for this page. Those came
from a different script and a different closet, so the before/after pair above is the
comparable one; the sketch's numbers are not wrong, they are not the same
measurement.)

**The decision is pinned in a test, not just in prose.** `src/lib/addFlow.ts` holds
the step list, the per-step FIC weights, the engine use each step has to justify, and
the readiness rule; `addFlow.test.ts` fails if the flow exceeds the first-run budget,
if a step is added with no stated engine use, if size is ever asked before category
(size validity is category-dependent, so the reverse order would validate against the
default), or if the blocking set grows past brand and size. Verified to go red before
being kept: adding a fifth `colour` step failed on two counts, 33 > 30 and no engine
use. A field is cheap to add and its cost is paid by every user, every time — the
test is what should force the argument next time.

The component imports that module rather than keeping its own copy, so the test
guards the shipped flow and not a parallel description of it.

**Verified:** typecheck clean, lint clean, **265 → 273 tests**, clean production
build after `rm -rf .next`, and the flow walked end to end on a 390px viewport — the
row written was `fitRating: 5, fitDirection: 0`, which holds invariant ⑰ (both
written together) and ⑮ (a centred report maps to >= 4, so `hasStrongAnchor` still
fires). Smoke row deleted afterwards.

**Not done, deliberately:** moves 2 and 3 from the sketch — earning the next question
with a visible payoff, and intent-led entry. Move 1 is the one that needed no new
product decisions.

---

## 2026-08-27 · Session 57 — Memory currency pass before a context break

Housekeeping ahead of compacting the working session, so nothing depends on what is
only in the chat.

`docs/RESUME.md` was still describing Session 48. Rewritten around Session 56: the
brand work, the two measurement scripts now in the repo, the `docs/course/` →
`docs/business/` move, and two invariants that came out of the logo work — **check
for `<path>` before believing an SVG is vector**, and **the mark has size floors**
(master ≥40px, micro 24–40, and 16–20 needs the separately drawn favicon glyph,
judged at `deviceScaleFactor=1` because a retina screenshot flatters it).

`build-state.md` gained the Session 49–56 block: the generated-from-master rule for
`Logo.tsx`, the favicon asset locations, the settled cool-porcelain palette, and the
fact that both measurement scripts need `npx playwright install chromium` because
playwright is deliberately not a dependency.

Verified rather than assumed: 13 memory files **byte-identical** between the repo
and the working set, **zero dangling `[[links]]`**, and the two machine-specific
files still correctly absent from the repo. 265 tests, typecheck clean.

---

## 2026-08-27 · Session 56 — The favicon gets drawn, and a "fixed" SVG that was a bitmap

### The supplied replacement was not a repair

A corrected `FP_logo_trans_back 1.svg` arrived to replace the flawed one. Checked
before adopting: it contains **zero paths**. One `<rect>` filled by a `<pattern>`
pointing at an embedded 1024x1024 RGBA PNG - 146 KB of SVG wrapper around a raster,
against 5 KB for the genuine vector it was meant to replace.

**And the bitmap inside is not new artwork.** Its SHA-256 is byte-for-byte identical
to the PNG already sitting in the repo. So the question "is the smoothed redraw
better, and should we adopt it?" has a flat answer: **there is no redraw.** The
pixels are the ones we already had. The accompanying PDF is still a JPEG placement.

Both are kept in `source-exports/` under names that say what they are. The canonical
geometry stays `fit-passport-mark-master.svg`, which came from the original *real*
vector. Worth stating plainly because the file name and the intent both said
"fixed", and adopting it would have quietly swapped a vector master for a bitmap.

### The favicon, unblocked

Session 55 left the 16 px favicon blocked on a drawing rather than an export. A
16x16 concept was supplied and it settles the *design* question: simplify to the P
and its loop. As an asset it could not ship - a lone 16x16 raster with no vector
source cannot produce the 32 / 48 / 180 sizes browsers also request, its interior
was grey anti-aliasing rather than strokes, and C2PA metadata made a 16x16 image
10,197 bytes.

So the concept was **redrawn as vector**: one continuous line that curves over,
loops and descends, on a 16-unit grid with a 2-unit stroke so edges land on pixel
boundaries instead of averaging to grey. Four candidates were rendered at true
device pixels and compared side by side against the supplied raster before picking.

Result: **404 bytes** at 16 px, against 10,197 - and it stays crisp at 24, 32 and
48, which the raster could not. Shipped as `favicon.ico` (16/32/48 in one
container), `icon.svg` and `apple-icon.png` (180, on porcelain), all three picked up
automatically by the App Router and verified being served.

It is registered as a **separate asset from the micro mark**, not a replacement:
micro is the full mark thickened, for 24-40 px; the favicon glyph is a different,
simpler drawing for 16-20 px. Session 55's measurements are why both exist.

### Palette settled

The logo documents named Warm Ivory `#F3EFE7` as the light ground while the app runs
on cool porcelain `#F3F3F1`. **Cool porcelain wins**, on the founder's call. Warm
Ivory is retired across the logo concept documents and the size-test harness now
tests the ground we actually ship.

### Information architecture — measured, then sketched

Asked for a rough outline of consolidating the app, explicitly not a build. Measured
first, on a phone, logged in, with real data:

`/closet` shows **23 input controls and 104 tappable elements** at once, over 5.5
screens - on the page whose whole job is to make someone want to add three garments.
The homepage runs **9.8 screens** and 578 words.

The useful part is at the other end of the table: **the least dense page in the app
is `/refresh`** - 22 actions, 93 words, 1.8 screens - and it is the only flow that
already asks one question at a time. It is not lighter because it does less; it is
lighter because it defers. That pattern already exists in this codebase and is the
model the rest is missing.

Diagnosis in `docs/design/information-architecture.md`: the app is organised around
its **data model** (closet, passport, outfits, community are schema nouns) rather
than around the three things a person actually arrives to do. Direction proposed in
three moves, smallest first, with the existing interaction-cost budget as the tool
that arbitrates which fields survive.

**Two requests were deliberately not built, with reasons recorded.** The logo story
on the site is worth doing but is new content, and the same message asking for it is
the one saying there is already too much to read - it belongs inside the rework, not
appended to a 9.8-screen homepage. And a foundation-shade picker is a second product
surface, not a feature: it shares nothing with the fit engine, and it introduces a
**more sensitive data class than anything the app holds today** - skin tone sits
close to an identity attribute, and the project's own line about never inferring
ethnicity is much harder to hold when the input is skin colour. Parked as a
proposal needing research first.

265 tests, clean build.

---

## 2026-08-27 · Session 55 — The vector master, and the size at which this mark stops working

Step 1 of the logo plan: turn the supplied transparent SVG into a real monochrome
master, plus reverse and micro. Done — and the size testing produced a harder
finding than expected.

### Removing the white path, after checking whether it was load-bearing

The supplied SVG carries a dark mark path and a second white path of nine tiny
subpaths. The obvious move is to delete the white one. **That would have been a
guess, and in a thread mark it is a dangerous one:** a white shape sitting across a
stroke is an over/under crossing, and deleting those flattens the weave that the
whole design is about.

So it was measured. Rendering with and without differs by **101 pixels out of
1,048,576 (0.0096%)**, in five clusters of 9–15 pixels. Magnified, every one is a
1–2 px sliver along the *edge* of a stroke, never a gap *across* one — tracer
residue, not crossings. Safe to remove, and now recorded as such so nobody has to
re-derive it.

### The master, and a verification that caught my own bad test first

Coordinates were translated to a tight origin (the mark occupied 536 × 502 of a
1024 canvas — 24% padding on every side) and emitted as one path with
`fill="currentColor"`.

The first verification compared master and original rendered into the same box and
reported **19% of pixels different** — alarming, and wrong. The master is tightly
bounded, so it fills the box while the original renders smaller and centred; the
test was measuring framing, not geometry. Re-run with the original cropped to the
same viewBox: **zero pixels differ beyond anti-aliasing, best alignment offset
(0,0)**. A test that fails for the wrong reason is worth writing down, because the
temptation is to accept the first number and start "fixing" geometry that was never
broken.

Also dropped a `fill-rule="evenodd"` I had added out of habit. The source uses the
default nonzero and there was no reason to change it — an unnecessary difference is
still a difference.

### The floor, and why the favicon is blocked

Two measurements decide everything about small sizes. On the 536-wide artwork the
median stroke is **24 units (4.5% of the width)**, and the tightest 5% of interior
gaps are **20 units**.

The micro variant thickens by stroking the fill path's own outline — same geometry,
no redraw — which takes the stroke to 41.5 and the gaps down to 6. **16 is the
ceiling, set by the gaps rather than by taste:** more and the strokes merge.

Rendered at true device pixels: micro is good at 32, visible at 24 with the P
bowl's counter filling, and **illegible at 16–20. So is the master.**

**A 16 px favicon cannot be produced from this geometry by any amount of
thickening.** It needs a simplified glyph — fewer strokes, wider counters — which is
a drawing decision, not an export setting. The app still ships the previous mark's
`favicon.ico`, and that is now recorded as a blocker rather than an oversight.

**One correction to my own reading along the way.** The first size sheet was
rendered at 3× and I read it as "fails below 32 px everywhere". Re-rendered at true
device pixels, 26 CSS px on a retina screen gets 52 device pixels and reads fine —
so the site's nav was never the problem. Judging small sizes on a retina screenshot
is exactly how a logo ends up illegible in the one place it is smallest;
`tests/size-test.mjs` now renders both densities so the mistake is not repeatable.

### The site wears the new mark

`Logo.tsx` is now generated from the master and picks its weight automatically —
micro under 40 px, master above. The threshold errs toward micro because on a 1×
display the master is too light, while micro at 2× is merely a touch heavy.

Verified in the running app: the nav at 26 px and the passport card's engraved mark
at 34 px on obsidian both read well, at 1× and 2×.

The comparison sheets and their generator live in
`docs/design/assets/logo/tests/`, and the manifest now carries the numbers rather
than adjectives. **Colour, lockups and motion stay parked** — the plan puts them
after monochrome passes size testing, and the 16 px case has not passed.

265 tests, clean build.

---

## 2026-08-27 · Session 54 — Logo exports normalised, and format names stop overpromising

The founder supplied the selected mark in all three requested containers — PNG, SVG
and PDF — with transparent-background and white-background variants. The useful
result is not “we have every format.” The useful result is knowing **which capabilities
each file actually has**, because an extension is not a promise.

### One directory and one naming grammar

The assets now live under `docs/design/assets/logo/` and follow:

```text
fit-passport-mark-{colour}-{background}.{format}
```

The symbol is called `mark`, not `logo`, because it does not include the Fit
Passport wordmark. The two supplied PDFs live one level lower in
`source-exports/`; preserving them is useful, but putting them beside future
production masters would imply capabilities they do not have.

The normalised set is:

- `fit-passport-mark-black-transparent.svg` and `.png`
- `fit-passport-mark-black-on-white.svg` and `.png`
- `source-exports/fit-passport-mark-black-transparent-export.pdf`
- `source-exports/fit-passport-mark-black-on-white-export.pdf`

`assets/logo/README.md` is the manifest: actual structure, correct use, known
limitations and the required next asset set. The two old
`fit-passport-logo-concept-*.png` paths are removed after their byte-identical files
move under the new naming system; both logo-concept Markdown files and both rendered
PDFs now point at and describe the normalised set.

### The inspection changed what the filenames appeared to mean

**Both SVGs are genuinely vector.** Neither embeds the PNG. The transparent file has
a 1024 × 1024 viewBox and two paths: the dark principal artwork plus a small white
correction path. On white it looks correct; rendered on Ink Black, that correction
path exposes several white slivers. The black mark is not meant for a dark ground,
but the white object still makes this a poor recolourable master. The on-white SVG is
also vector, but its first path explicitly draws the white ground, so it is a layout
variant rather than the source of truth.

**Neither PDF is vector.** `pdfimages -list` found one 2048 × 2048 RGB JPEG on the
single 768 × 768 pt page of each file and no vector or font resources. The file
exported from the transparent source is already flattened to white. Both render
correctly, so they remain useful placement and archive files; they are not suitable
for recolouring, cutting, embroidery, animation or professional print production.
Calling them “vector PDFs” because they came with SVGs would be a quiet documentation
lie.

The PNGs are the expected pair: 1024 × 1024 RGBA for transparent placement and
1024 × 1024 RGB for white-background placement. The transparent PNG remains the
right immediate asset for documents and light-background prototypes.

### Next is geometry, not colour

The next pass should not jump to oxblood, motion or badges. It should first produce a
small, boring, dependable monochrome master set:

1. a tightly bounded `fit-passport-mark-master.svg` with one single-colour shape,
   no background and no white correction objects;
2. a deliberate `fit-passport-mark-reverse.svg` for dark grounds;
3. an optically adjusted `fit-passport-mark-micro.svg` for 16–32 px;
4. approved horizontal and stacked wordmark lockups;
5. a real vector `fit-passport-mark-print.pdf` generated from the clean master.

Those assets then need light/dark, 16/24/32/48/128 px and 8 mm print tests. **Only
after the silhouette survives those tests** should we choose the permanent accent
colour. Motion follows the final path geometry; badges follow the finished logo
language rather than determining it.

### Verified

All six supplied exports were identified and checksummed. Both source PDFs were
inspected with `pdfinfo`, `pdfimages` and `pdffonts`, then rendered and viewed.
Both SVGs were parsed for element types and rendered at high density on white and
Ink Black; the dark-background render is what exposed the correction slivers. The
updated English and Chinese concept PDFs remain **8 pages each** and were re-rendered
in full to contact sheets; text extraction confirms the new filenames and limitation
notes in both languages.

No application or test files changed; the test suite was not rerun. Last known count
remains 265. Documentation and brand assets only.

---

## 2026-08-27 · Session 53 — The Fit Thread becomes a documented brand system

Brand work, not application code, but it makes one product decision explicit: the
mark is not a decorative FP pasted onto the interface. It is the visual form of the
same proposition the product makes — **fit memory belongs to the person and travels
across stores**.

### The selected mark and the story it can honestly carry

The founder selected the upper-left concept from the latest exploration and supplied
two isolated 1024 × 1024 PNGs: one RGBA file with a true transparent channel and one
RGB file on white. The visible artwork occupies roughly 538 × 503 px in the centre,
so both have useful breathing room for documents and prototypes.

The explanation is deliberately layered rather than pretending the monogram is an
ancient symbol:

- **Ariadne's thread** is the primary narrative. Brand-specific sizing is the
  labyrinth; the user's tried, kept, returned, exchanged and re-rated garments are
  the thread; an explainable recommendation helps the user follow that evidence back
  to what fits. The story centres Ariadne as the provider of orientation and memory,
  not the Minotaur's violence.
- **The weaver's shuttle** is the material reading. Each outcome is another pass of
  the weft; accumulated experience produces a personal pattern that is more useful
  than an isolated S, M, L or number.
- **The personal signet** is the identity reading. The mark can sit on the passport,
  a verified fit record, an export, a profile or a future physical label without
  becoming a literal government stamp.

This is why the earlier Thor's-hammer association was rejected rather than
rationalised. Combat, strength and Norse-fantasy cues pull toward gaming or masculine
sports branding; they do not explain fashion, memory, portability or consumer
ownership. The chosen public line is **“One thread through the maze of fit.”**

### What was committed

Commit `aafbe02` adds equivalent English and Chinese source documents plus rendered
PDFs:

- `docs/design/LOGO_CONCEPT.md`
- `docs/design/LOGO_CONCEPT.zh-CN.md`
- `docs/design/LOGO_CONCEPT.pdf`
- `docs/design/LOGO_CONCEPT.zh-CN.pdf`
- `docs/design/assets/fit-passport-logo-concept-transparent.png`
- `docs/design/assets/fit-passport-logo-concept-white.png`

Both documents record the myth and product mapping, formal references, negative
readings to avoid, black-and-white-first colour policy, motion language, file-format
hierarchy, extraction workflow, application rules, badge boundary and production
checklist. They also state the limit of the current assets plainly: **the PNGs are
good concept and prototype files, not the production master**. The source of truth
should become an editable Figma component; SVG should be the digital production
format; a separately adjusted micro-mark should serve 16–32 px contexts. Metallic
depth stays with the future badge system rather than forcing the master logo into 3D.

### Two render failures worth keeping

**The first Chinese PDF was generated successfully and was unreadable.** ReportLab's
CID font reference did not embed a usable Chinese font for the Poppler verification
environment, so the rendered pages showed squares. Rebuilt with an embedded Noto Sans
SC TrueType font and re-rendered every page. A successful PDF write is not evidence
that its glyphs exist.

**The transparent PNG first appeared as a black square in the PDF.** The file's alpha
channel was valid; the image renderer had not been told to honour it. Adding an
automatic alpha mask fixed the cover. This distinction matters because “repairing”
the PNG would have modified a correct source to compensate for a rendering bug.

The PDFs were then tightened from an orphaned ninth page to **8 pages each**. Final
checks included full-page PNG rendering/contact sheets, cover inspection, PDF
metadata/page count, text extraction in both languages, and direct PNG checks for
dimensions, colour mode and alpha.

### Process miss

This entry is corrective. `aafbe02` was pushed before its DEVLOG entry, despite the
rule at the top of this file that every push owes an entry in the same commit. A
documentation-only brand push still counts as a push. This follow-up makes the record
current but cannot retroactively make the first commit atomic; the miss is recorded
rather than hidden.

No application or test files changed; the test suite was not rerun. Last known count
remains 265. Documentation and brand assets only.

---

## 2026-08-26 · Session 52 — The proposal marked final, with both open decisions written into it

Small session, one lesson worth the entry.

The proposal is now marked **FINAL PROPOSAL** and states in its own header that it
supersedes the two earlier proposal PDFs, which stay in `docs/proposals/` as history —
§4 already records what changed between them and why, so the older documents keep
their value as the "before" rather than being deleted.

**Both parked decisions are now written into the document itself** rather than living
only in a chat and a memory file. A decision that exists only in conversation is a
decision that gets silently defaulted the next time someone touches the code:

- **What a shared code reveals** — whether `fitDirection` should be visible to a
  code-holder, with the actual argument on both sides recorded, including *why* it is
  not symmetric with the already-public `fitRating`.
- **The numeric input mode** — that a signed −10…+10 VAS shipped in place of the
  requested 1–20 comfort scale, and that the outstanding question is whether the
  substitution is accepted, not whether to build it.

### Two process notes

**I re-triggered a trap recorded in my own memory.** A `python - <<'PY'` heredoc hung
for the full two-minute timeout — there is no Python on this machine, and that exact
pattern is written down as a thing not to use. Checked the file was intact afterwards
rather than assuming, then did the job with `sed` line ranges. Having the note is not
the same as reading it.

**The three-blockquote experiment failed and is worth recording as a negative
result.** The two new decisions were first written as blockquote callouts, matching
§6's. That made three callouts in one document, which both cost vertical space and
diluted the one that should stand alone — *"a finished product is not a validated
market"*. Converted back to bold-led paragraphs. It did **not** reduce the page count,
so the layout argument was wrong; the editorial argument for making it was right
anyway.

**Length: 8 pages against a 4–6 page target**, and this is the third entry in a row
recording that number rather than quietly absorbing it. The additions were all
requested — pet, contests, both decisions — so content has been winning over the page
budget by explicit choice each time. Reaching 6 now means removing something the
founder asked for, which is his call, not a formatting exercise.

265 tests, unchanged — documentation only.

---

## 2026-08-26 · Session 51 — A new proposal, and two decisions the founder needed explained

### The two open decisions, restated accurately

The founder asked what the two parked decisions actually were. Checking the code
before answering corrected one of them, which is the reason this is worth an entry.

**`fitDirection` visibility to a code-holder** was described accurately: the field is
simply absent from `/api/view/[code]`'s allow-list `select`, which is a safe default
rather than a decision anyone made. The argument for exposing it is that it is closet
information exactly like `fitRating`, which is already public, and strictly more
useful. The argument against is that **direction points at the body in a way a star
rating does not** — enough signed reports against published size charts form a system
of inequalities about someone's measurements, and "precise centimetres never leave" is
the hardest promise this product makes. Recommendation recorded: don't expose it, or
expose it only coarsened to three buckets.

**The 1–20 comfort scale was described wrongly, and the correction matters.** It was
carried forward from the design document as "awaiting a decision" — but Session 45
already built it, as a **signed −10…+10 VAS**, because a 1–20 *comfort* scale is
unipolar and would reproduce the exact defect the whole closet-signal design exists to
fix. So the real question is not "should we build it" but "does the founder accept the
substitution that already shipped." **Repeating a document's stale open-question marker
without checking whether the code moved past it is a specific failure mode worth
naming** — the design doc is a record of what was decided *then*, not a description of
the codebase now.

### The new proposal

`docs/proposals/Fit-Passport-Proposal-2026.md` (+ PDF), to the founder's structure.
Its spine is one sentence: **a finished product is not a validated market.** Business
model paths are labelled hypotheses with the condition each would need to hold; the
validation plan states in advance what would falsify the concept, so it cannot be
rationalised after the interviews come back.

**Two things were checked rather than assumed before being written down.**
`PetProfile` exists in the schema — species, breed, neck, chest girth, back length —
and **no application code reads or writes it**; there is no pet API route and no UI. It
is described as a placeholder, not a feature. The budget styling contests are fully
designed in `docs/design/community-ecosystem.md` down to an `Event` model and three
cadences, and **none of it is built**; the plan's own first step is to run one $100
contest by hand. Both are now in the proposal as clearly-labelled unbuilt directions,
which is what the founder asked for and also the only way to include them honestly.

**One claim in our own documents did not survive the check.** The prospectus asserts
that roughly a quarter of US online apparel is returned. That figure has **no source in
any of our research files** — the well-sourced return data is Chinese. The proposal
labels it directional and lists verification as an open item rather than repeating it
as established. This is the evidence principle catching our own prose rather than
someone else's.

**Length: 7 pages against a 4–6 page target.** Stated rather than absorbed. Getting to
6 would mean cutting roughly 400 words — the pet and contest sections are about 330 of
them, and they were specifically requested, so the trade is the founder's to make.

Page count verified four ways (`/Type /Page`, `/MediaBox`, `/Kids`, `/Count`) rather
than eyeballed, because the PDF pipeline had already produced one confidently wrong
output this week.

265 tests, unchanged — documentation only.

---

## 2026-08-25 · Session 50 — The repo stops describing itself as coursework, and the prospectus catches up

Two requests, one sweep: remove the course framing from the project, and bring the
prospectus current. A third thing fell out of doing them.

### The repo now presents as a product, not an assignment

The founder asked for course traces to come out — course numbers, an instructor's
name, grade weightings — so the project reads as what it is rather than as
homework.

**The most visible one was live on the site.** The footer said *"A student project
for 49-800 Start Up Creation in Practice · Carnegie Mellon University"* on every
page in production. It now says the app is a working prototype whose
recommendations are explained rather than silently guessed at. **The `DEMO` badge
stays.** Removing it would have been the dishonest version of this change: the app
genuinely is a prototype, it runs on a plan whose terms forbid commercial use, and
saying so is the same transparency the engine is built on.

Structural changes: `docs/course/` → **`docs/business/`**, `weekly-journal-template`
→ `weekly-review-template` (the same tool, minus the grade framing), and two PDFs
that were never ours — a syllabus and a prior year's proposal template — removed from
the repo and preserved outside it. The team's own proposal PDFs kept their content
and lost the course number from their filenames. Every `docs/course/` path in the
repo was repointed, which was a correctness fix rather than cosmetics.

**Where the line was drawn, and why it matters:** the *historical* DEVLOG entries
were not rewritten. Substituting "the governance concern" for a person's name loses
nothing factual; editing what past sessions actually decided would corrupt the
record, and this log's value is precisely that it can be trusted about the past.
Same reasoning for `docs/business/project-plan.md` — the 15-week schedule, the
milestones and the success metrics all stayed; only the class times and the
instructor's name went.

One file left the repository rather than being edited: the course requirements
memory. The obligations are real, so it is kept in the private working memory — but
they are the team's obligations, not the project's documentation.

**The first sweep reported clean and wasn't.** It was case-sensitive, so `Course
demo` survived in three places — including a table row in the founder brief and one
in the cost model — while `course demo` was caught everywhere. Re-running with `-i`
found four more, plus two historical *"for the reflection essay"* asides. Noting it
because the failure is generic: **a grep-based audit is only as good as its worst
pattern, and a clean result from one is evidence about the pattern, not the repo.**

### The prospectus was five sessions behind

It still claimed 172 tests and described a closet with "honest per-garment fit
ratings" — the exact unipolar field Session 44 established was the wrong shape of
data. Rewritten around what is actually true now: the signed fit scale and *why* it
replaced a star rating (a 2-out-of-5 is either strangling the wearer or hanging off
them, and those imply **opposite** recommendations); the ease figure and the reason
it is schematic rather than photoreal; confidence that falls with a stated reason;
265 tests; and the live URL, which had never appeared in the document at all.

Two sections were added because they are load-bearing to the pitch and were missing:
**the two-database gap that took production down**, told as the failure it was
including the fact that every gate stayed green — and **the SSRF posture**, since
"we treat user-supplied URLs as hostile" is a claim a technical reader will want
evidenced. The roadmap gained the browser extension, positioned as it actually is:
the answer to blocked retailers that we chose **on legal posture rather than price**.

Also added, deliberately: a paragraph saying that decisions are recorded with their
reasoning *including the ones that turned out to be wrong*, and that unverifiable
claims are labelled inline. A product whose proposition is "our answers can be
trusted" cannot run a different standard behind the curtain, and that is worth
stating where a reader can check it.

### The PDF script had been broken on Windows the whole time

`md-to-pdf.mjs` hard-coded `/Applications/Google Chrome.app/...`, so regenerating
the prospectus PDF was impossible on a Windows checkout — which meant the committed
PDF would have silently diverged from the Markdown it was generated from. Fixed
properly rather than papered over: per-platform candidate paths for Chrome and Edge,
a `CHROME_PATH` override, and `pathToFileURL` instead of string-concatenating
`file://` (a Windows path needs `file:///d:/…`, not `file://d:\…`).

**The first regeneration succeeded and was wrong, which is the part worth keeping.**
Both PDFs came out roughly 45% smaller than the committed ones. The script reported
success and the files opened. The `@font-face` rules had the *same* malformed
`file://` bug, and **a bad font URL fails silently** — Chrome falls back to a system
face and produces a perfectly plausible PDF that simply isn't in the project's
typefaces, with no font subsets embedded. The only signal was the file size, and it
would have been easy to explain away as "different platform, different compression".
Fixed the same way; sizes returned to 424KB and 366KB against the previous 454KB and
368KB, which is what an embedded-subset PDF should weigh.

**Rule worth carrying: when a rendering step gets a lot cheaper for no reason, treat
it as a failure until proven otherwise.** Silent degradation looks exactly like an
optimisation from the outside.

**This is the second and third macOS-only assumption to surface since the project
started moving between machines.** Worth treating as a category rather than a bug:
anything that names a path, a binary, or a shell is now a portability hazard.

### Verified

Typecheck clean · **265/265 tests** · clean production build from a removed `.next` ·
credential sweep on the staged diff clean. Repo `docs/memory/` and the working memory
re-verified identical, file by file.

The founder brief got the same treatment as the prospectus: it still advertised 209
tests and listed "turn on real extraction" as the next step, which shipped in Session
42. Corrected to 265, that step marked done with the caveat that a key does not fix a
403, and the closet description rewritten around the signed scale.

**Both hosted artifact pages were republished from these files**, so the public copies
and the repo now agree.

---

## 2026-08-25 · Session 49 — Documentation currency pass, and what the last sweep missed

Housekeeping, but two findings are worth the entry.

**`docs/RESUME.md` still carried a personal email address.** Session 43 ran a
credential sweep, caught one in the build-state notes, scrubbed it — and missed
this one, which then survived five more sessions in a shared repo. The lesson is
not "sweep harder", it is that **a sweep is a habit, not an event**: it belongs on
every documentation pass, not once when the folder was published.

**Ten `[[links]]` were dead**, pointing at memories that stay private. Session 43
repointed twelve and left these. Repointed to their published equivalents
(`principle-research-grounded`, `principle-no-brand-imagery`,
`principle-evidence-and-logging`) or inlined, and the whole folder is now checked
for dangling references rather than spot-fixed.

**`RESUME.md` has been rewritten to name no machine at all.** It had been rewritten
once already for the same reason; the project has moved computers twice and every
hard-coded path died with the move, leaving notes that actively misled a reader
about where things are. Setup is now a recipe that works anywhere, and the same
line came out of `build-state.md`.

Otherwise: test counts corrected across five files (172/209/237 → **265**),
`next-steps.md` rewritten with the current list at the bottom and the old ones kept
as history — the reasoning behind a priority change is usually the useful part —
both READMEs updated for the signed fit scale and the migration rule, and the
zh-CN README's Windows-only command block replaced with a platform table, since the
project is not on that machine and a new teammate might be on either.

**Customer interviews are recorded as DEFERRED at the founder's request**, with the
cost stated plainly in the backlog rather than silently absorbed: the browser
extension and per-area fit granularity were both explicitly gated on interview
evidence, so both stay parked.

Repo `docs/memory/` and the assistant's working memory verified byte-identical,
file by file. 265 tests, no code changed.

---

## 2026-08-25 · Session 48 — Mobile: the app had no navigation on a phone

Reported: the phone experience is bad. Audited it by **measuring a real browser at
a real phone viewport** rather than reading class names, which is how the biggest
problem was found — it was invisible in the source.

### The app had no navigation on a phone

`Nav` renders every link with `hidden … sm:block`, and **nothing takes their place
below 640px.** The header on a phone was a wordmark and an account chip. Check,
Closet, Passport, Outfits, Community and Help were unreachable from anywhere
except an in-page link on the homepage. That is not a styling problem; the app was
navigationally broken on the device most people would open it on.

Added a menu button and a panel inside the sticky header: the same links (plus
Review for admins), 48px rows, active state marked, closes on navigation and on
Escape.

### Clipped content that could never show up as a scrollbar

`body` carries `overflow-x-clip` — deliberately, so the oversized display type on
the homepage can't make the page scroll sideways. The side effect is that **an
overflow bug is silently clipped rather than scrollable**, so the usual "does the
page scroll horizontally" check reports clean while content sits off-screen and
unreachable.

Measured: the community outfit card was **402px wide inside a 390px viewport**,
with its Report button at x=410. Untappable. Two more at 360px: the passport
button row (+25px) and the hero's "Get my size" button (+14px).

**All three were the same CSS trap, in two forms.** A flex item defaults to
`min-width: auto` and refuses to shrink below its content, so `truncate` alone
does nothing — the title pushed the card wide. And a **grid** item has the same
default, which is why fixing the insides was not enough: the card itself still
sized to its min-content and overflowed its own 342px track. `min-w-0` on both
levels is the fix, and it is worth remembering as one rule rather than two
incidents.

Also: my first pass at the Report button's tap target used `-m-2 p-2`, which grew
it horizontally in a row already fighting for space and made the overflow *worse*.
Changed to vertical-only.

**Result: 26 page × viewport combinations, plus 12 logged-in ones with real data,
all clear.** Before: 5 combinations overflowing.

### Everything else was density

- Text sat beside a button in five places, squeezing copy into a three-word
  column. Stacked below `sm`.
- Page gutters were `px-6` — 48px of a 360px screen, 13% of the width — now `px-4`
  on phones, `px-6` from `sm`. One sweep, 45 containers, so it is consistent
  rather than page-by-page.
- Tap targets: the Today/This week toggle was **24px** tall, demo pills 26px, the
  Report button 17px, the account chip 28px. Raised toward 44px with padding, so
  labels keep their size and the desktop layout is untouched.
- The back-to-top button floated over body copy on a phone; tucked into the corner
  with a translucent backdrop.

### The audit script is now in the repo

`app-web/scripts/mobile-audit.mjs`. It measures element rectangles, not document
scroll width — precisely because `overflow-x-clip` hides the symptom. Playwright
is **not** added as a dependency (~100MB on every install for an occasional tool);
the header says to `npx playwright install chromium`.

Deliberately **not** changed: the metal card's 8–9px micro-lettering. It reads as
embossing on a charge card, it renders well on a phone (checked visually), and
the design system is explicit that the card stays as designed. Blanket-raising
font sizes would have damaged the one object the founder asked to leave alone.

265 tests, unchanged — this was layout only.

---

## 2026-08-25 · Session 47 — The two derivable closet signals, and a design claim that turned out to be wrong

Both remaining "free" signals from Session 45's design. **241 → 265 tests.** One of
the three turned out not to be free at all, which is the most useful thing this
session produced.

### Brand bias now learns from the closet — the actual cold-start fix

`biasForBrand()` accepts closet reports alongside purchase outcomes. Verified live
with **zero purchase history**: two Uniqlo items in other categories reported *too
tight* produced *"You've reported 2 Uniqlo items running small — sized up one."*

This matters more than it sounds. Brand bias has existed since Session 12 and has
been **dead weight for almost every user**, because it required recorded purchase
outcomes and virtually nobody records a return. A signed closet report is the same
observation, available the moment someone adds their first few clothes.

**The double-counting trap.** A same-brand *same-category* item already moves the
anchor inside `scoreKnownGood`. Letting it also vote for brand bias would push one
observation through two channels and quietly overweight it. `biasForBrand` now
takes the product's category and excludes closet items of that type, so the two
paths are disjoint **by construction** rather than by tuning: the anchor handles
same-category, brand bias generalises across categories ("your Uniqlo shirts and
jackets both run small, so expect the same of this tee"). Pinned by an engine-level
test, not just a unit one.

### Confidence from report consistency, and why it is deliberately asymmetric

Scatter lowers confidence (floor 0.85) with the reason surfaced in `conflictNote`;
agreement does **not** raise it. Rewarding agreement would double-count an
assumption already made by using the closet at all.

Being *consistently* off-centre is also not penalised. Someone whose every garment
runs roomy is a person we understand perfectly well — they just buy up. **It is
scatter, not offset, that means we know less.** Verified live: a closet mixing
tight and loose reports returned **0.85** with *"Your closet reports disagree with
each other — some of these run tight for you and some run loose."*

### The claim that was wrong

Session 45's design listed a **personal ease target in centimetres** —
`ease = garment − body` per category — as costing the user nothing. Building it
showed why that is false: **`KnownGoodItem` stores no garment measurements at
all.** For nearly every closet item the garment side of that subtraction does not
exist. Joining to `Product`/`SizeOption` by brand+category+size would cover only
items the user happened to paste as a URL, and fuzzily.

What it would actually take is capturing the size chart alongside the item at
add-by-URL time — the extractor has the numbers in hand at that moment and throws
them away. That is a real feature with a real cost, not a derivation. The design
doc's §1.2 is corrected in place rather than quietly dropped, and the FIC table now
shows it as **blocked, not free**.

What shipped instead is the same intuition at coarser resolution: agreement
measured in reported *direction* rather than centimetres. It needs nothing new from
the user and it works today.

### A test that was rewritten rather than tuned

The first engine-level consistency test asserted that a scattered closet yields
lower confidence than a tidy one. **It failed — the scattered case scored higher.**

The reason is real and worth recording: scattered reports do not only trigger the
consistency factor, they also genuinely spread the anchor across different sizes,
which moves the recommended size and the signal-agreement penalty with it. The two
scenarios differ in several ways at once, so the comparison never isolated the
thing it claimed to measure.

Rather than adjust the threshold until it passed, the engine-level test now asserts
the user-visible contract (the note appears), and the factor's monotonicity and its
0.85 floor are pinned in `closetConsistency.test.ts` where they can be measured
without the rest of the engine in the way. **A threshold tuned until it goes green
tests the tuner, not the code.**

One existing assertion was also changed, deliberately: the brand-bias reason used
to read "running too big". That wording is no longer accurate now the same string
covers a closet report of *a bit roomy* (+5), which is not "too big". It now reads
"running big", and the test asserts the reason names the direction rather than
pinning the old exact phrasing.

---

## 2026-08-25 · Session 46 — Production outage from a missing migration, and the guard that would have caught it

**I broke production, and the fix is less interesting than why nothing caught it.**

Session 45 added three columns to `schema.prisma` and ran only `npm run db:push`.
That writes to the **local SQLite file**. Production applies **committed
migrations** via `prisma migrate deploy`, and there was no new one — so Neon never
got `fitDirection`, `direction` or `fitScaleMode` while the generated Prisma Client
queried them. `/api/status`, `/api/closet` and `/api/collections` returned **500**
in production for roughly twenty minutes.

**The symptom did not look like a database problem.** The founder reported
`/passport` stuck on its loading state. The page itself was 200 — it renders, then
waits on `/api/status`, which never resolved. Worth writing down as a rule: *a page
stuck on "Loading…" right after a schema change means check the API, not the
component.* Chasing the React would have wasted the whole session.

**Why every gate stayed green.** Typecheck passed. 237/237 tests passed. The
production build succeeded. The local smoke test was green across 14 pages —
because **local SQLite had the columns**. The defect lived entirely in the gap
between the two databases, and nothing in the project looked at that gap. This is
the failure mode the two-database design has always risked, and it finally
happened.

### The fix

The documented recipe (`docs/DEPLOYMENT.md` §1) diffs `--from-migrations`, which
needs a shadow database. There wasn't one to hand, so: diff the two schema
*datamodels* — before and after — which is fully offline and correct for a purely
additive change.

**Verified the chain before trusting it**: regenerated `0_init` from the OLD schema
with `--from-empty` and confirmed it reproduces the committed file byte for byte.
It did, so the new migration stacks onto it cleanly. All three columns are nullable
or defaulted — no rewrite, no backfill, nothing at risk. Deploy applied it and
production came back on the next probe.

### The guard, which matters more than the fix

`src/lib/schemaMigrations.test.ts` fails when a column in `schema.prisma` appears
in no migration. It needs **no database of any kind** — it parses the schema and
the migration SQL as text and compares the columns they describe, honouring
`CREATE TABLE`, `ADD COLUMN` and `DROP COLUMN`.

**It was verified to go red before being kept.** Moving the new migration aside
made it fail naming exactly the three columns — `User.fitScaleMode`,
`KnownGoodItem.fitDirection`, `ComfortCheck.direction`. A guard that cannot
reproduce the bug it was written for proves nothing, and there is a companion test
asserting the parsers extract something, so a regex that quietly matches nothing
can't make the whole file vacuously pass.

`docs/DEPLOYMENT.md` now carries the no-shadow-database recipe and a boxed warning
that **`db:push` is not a migration**, and the deployment memory records the
incident.

241 tests (237 + 4).

---

## 2026-08-25 · Session 45 — The signed fit scale ships, and the ease figure on /check

Both items the founder approved, built together. **209 → 237 tests**, clean build,
verified end-to-end on a production build before any `npm run dev`.

### The closet now records WHICH WAY a garment misses

`lib/fitDirection.ts` is the new single scale: a signed integer, −10 too tight →
0 just right → +10 too loose. Both input modes write that one scalar, so the
engine has one input and one set of tests; a second mode meaning something
slightly different would have doubled the surface area for nothing.

The engine reads it in `scoreKnownGood`. A garment reported tight means the
wearer's true size in that brand is *larger* than the one they own, so the anchor
itself moves — the full range maps to one ladder step, which is not an arbitrary
choice: it matches the return-shift term in the literature the project already
cites (Guigourès et al., RecSys 2018: `η_small ~ N(−1,1)`, `η_big ~ N(+1,1)`). A
closet report is that same observation, sourced *before* a purchase instead of
after a return. Direction applies to cross-brand anchors too, because it is an
observation about a garment rather than a taste; the preference shift stays
same-brand-only, so two guesses never compound.

**Two decisions inside that are worth the ink:**

*`fitRating` is now derived, not asked.* It still drives the stars, the badge
stats, and anchor trust for legacy rows, so it could not be deleted — but asking
for both is asking the same question twice. `ratingFromDirection()` maps
|direction| onto 5/4/3/2 (never 1: an item still in the closet is evidence of
something). A test pins that a centred report clears the `>= 4` threshold
`hasStrongAnchor()` needs — miss that and the [F1] anchor fix stops firing
silently, which is the kind of regression that would not show up until a
recommendation was quietly wrong.

*A directed anchor is trusted at a flat 0.9 rather than `fitRating/5`.* Otherwise
"too tight" gets penalised twice — once by the correction just applied, and again
by the low star rating it naturally attracts — when it is one of the most
informative items in the closet. Trust now tracks the quality of the *report*,
not the quality of the fit.

### Fit Refresh had to move too, and that was not optional

Left alone, the refresh pass would have overwritten `fitRating` while leaving a
stale `fitDirection` on the same row — the two contradicting each other on a
record the engine reads. Caught before shipping rather than after. It now reports
direction, derives the rating, and writes both to the item and the `ComfortCheck`
history in one transaction. Its `<input type="range">` also went: it is a drag
control, which is exactly what the previous session's research argues against, and
the flow was always a five-way choice anyway. Number keys 1–5 now pick tight →
loose.

### The ease figure on /check

`FitFigure.tsx` draws the wearer's silhouette with the garment's outline around
it, per size, with the centimetre number beside it. It is a picture of arithmetic
the engine was already doing and only ever printed as text.

It is deliberately **schematic, drawn to true proportion, with no exaggerated
gap** — the research file's first conclusion is that image-based try-on transfers
*appearance, not fit*, and a realistic figure would quietly make the promise
nobody can keep. The caption says so in as many words: *"Not a preview of how it
will look."* Legibility comes from a tight viewBox, not from inflating the
difference.

No pointer tracking anywhere in either new component — switching size is a
discrete tap and the morph is a CSS transition. That is a direct application of
the performance file: this codebase has twice shipped a pointer-driven visual that
re-rendered React 60–120×/second.

### Verified, not assumed

The same anchor, same stars, only the sign flipped, on a live production build:
M reported *too tight* → **L** ("Your Uniqlo M runs too tight, so this is the size
that should sit right"); *too loose* → the anchor argues **S**, the engine flags
the disagreement against the measurement signal and drops confidence to **0.46**
with a stated reason; *just right* → **M**. Out-of-range input rejected 400. The
refresh path writes rating 2 / direction −10 together, and the next check
immediately reflects it. 14/14 pages 200.

**Privacy re-checked because this touched response shapes.** `body` was added to
`/api/check` and `/api/recommend` so the figure can draw without a second round
trip — that is the user's own session. `/api/view/[code]`, where a third party
holds only an account code, still returns no measurement field of any kind, and
`fitDirection` is excluded there by the endpoint's allow-list `select`.

**One thing deliberately NOT decided:** whether `fitDirection` should be visible
to someone holding an account code. It is closet information like `fitRating`
(which is already public) and arguably more useful — but widening what a bearer
code reveals is a governance decision, not a side effect of a feature. Left closed,
flagged for the founder.

---

## 2026-08-25 · Session 44 — Machine rebuild (Windows → Mac), two new teammates, and the closet-signal design

### The machine moved again, and the app was rebuilt from a bare clone

The project is now on **macOS at `/Users/kpew/fit-passport`** — a fresh clone with
no `node_modules`, `.env`, `prisma/dev.db` or `.next`. `docs/RESUME.md` and every
memory file still described the Windows machine; they are one machine behind and
`docs/memory/` now says so.

Rebuilt and verified rather than assumed: **typecheck clean · 209/209 tests ·
production build · 14/14 pages 200** (`/ask` 307s into Community by design) ·
middleware mints the session cookie · **the privacy invariant holds**
(`/api/view/[code]` returns 9,570 bytes containing zero chest/waist/hip/shoulder/
height/weight fields) · **SSRF payloads refused** · a real Allbirds fetch returns
`fetch: "ok"`. The smoke ran against a clean production build *before* any `npm
run dev`, per the stale-`.next` rule.

On the SSRF check specifically: rather than trust the 422, traced the code —
`gate(url)` in `extractorLLM.ts` runs **before** `fetch`, so no packet leaves the
machine. The `fetch: "unreachable"` in the provenance field is how a refusal
surfaces, not evidence a request was made.

**Two traps found, both new and both worth recording:**

1. **`npm install` on macOS rewrites `package-lock.json`**, stripping the Linux
   `libc` (glibc/musl) entries for optional platform packages that can't install
   here. **Committing that would break the Vercel build**, which runs on Linux and
   needs those entries to resolve `@next/swc-linux-*`. Reverted.
2. **`npm audit` reports ~21 Next.js advisories against 14.2.35.** The only
   offered fix is `next@16`, a breaking major, so this was **not** acted on — a
   deliberate deferral, recorded rather than silently skipped. Most advisories
   target features this app doesn't use (Image Optimizer `remotePatterns`,
   Pages-Router i18n, custom servers), but a real triage pass is owed before
   anyone claims the app is patched.

### Team

**Jenny Cao** and **Nicolas Wang** joined. Added to both READMEs, `DEVLOG.md`,
the prospectus, the Founder Brief, the message architecture, the site footer and
`docs/business/project-plan.md`. Their role rows in the project plan are left
**explicitly unassigned** — inventing a division of labour would be exactly the
kind of unsourced claim the standing rule below now forbids.

### Standing rules, restated as `principle-evidence-and-logging.md`

Three rules that were implicit or scattered are now one memory file: **every piece
of data and information needs checkable evidence** (extending the
research-grounded principle from *features* to *every factual statement*, with
unverifiable ones labelled inline rather than quietly asserted); **a DEVLOG entry
is owed per push**; **memory changes get published to `docs/memory/`, curated —
never anything about a person, a machine, or a credential.**

### The real work — closet data as an engine signal

New: **`docs/design/closet-signal-and-interaction-cost.md`**. Design only, nothing
built. The question was whether user closet data can improve the fit algorithm,
how to stay honest when people enter garbage, and how to ask for subjective fit
language without the app feeling like paperwork. Researching it produced one
finding that reframes all three:

**`KnownGoodItem.fitRating` is the wrong shape of data, and has been since Session
01.** It is a unipolar 1–5 "how good is the fit", rendered as a `1/5…5/5`
dropdown. It cannot express *which way* a bad fit is bad — a 2/5 is either
strangling the wearer or hanging off them, and **those imply opposite
recommendations.** Meanwhile every size-rec system this project already cites
models fit as a **bipolar ordinal** ({Small, Fit, Large}; or too tight → too
loose). The closet is the project's biggest structural asset and it discards the
field's standard signal at the point of entry.

The fix is cheaper than what it replaces: a five-way bipolar tap costs the user
*less* than the dropdown and gives the engine *more*. Three further wins are
**free** — derived from data already in the closet, zero new input: directional
brand bias without needing a purchase (the cold-start fix for `brandBias.ts`), a
**measured** personal ease target in centimetres (revealed preference, replacing
the self-reported slim/regular/relaxed label), and confidence modulated by how
*consistent* a user's ease preference is — the defensible version of the founder's
"subjective weights should tune the confidence".

**Bad data turned out to be two problems, not one**, and conflating them would
have meant over-engineering the cheap case while under-defending the dangerous
one. Data about a user's own closet only degrades that user's own
recommendations — there is no incentive to lie and the feedback loop is
immediate — so the response is *consistency questions, never blocking or silent
discarding* (a contradicting item may be the most informative one they own). Only
**cross-user** aggregation, where one person's data moves a stranger's
recommendation, needs real defences: robust aggregation, minimum-evidence
thresholds, reputation weighting, per-account influence caps. That work is now
explicitly **blocked** — the SizeFlags paper's actual thresholds could not be
extracted from its PDF, and precedent that an approach works is not a
specification to copy.

**The interaction-cost budget (FIC)** answers "任何需要操作的都需要扣大分" with a
scoring rubric: cost points per input type (0 derived → 2 tap → 10 free text → 12
photo, with multipliers for memory load, judgement and required-ness) against
value points for what the engine actually gains, and a `value ≥ cost/2` bar.
Grounded in NN/g's interaction-cost definition and Baymard's finding that field
count matters more than step count. **The point weights are invented and the
document says so** — a forced-ranking device, not measured constants; the widely
quoted vendor form-field statistics are labelled as marketing studies and used
ordinally only. Applying the metric kills free-text fit notes and prompted photos,
defers per-area ratings, and shows the **existing dropdown has the worst
cost/value ratio in the closet flow**.

One design decision is deliberately **left open for the founder**: the requested
1–20 numeric comfort scale is *unipolar again* and would reproduce the exact
defect the whole document identifies. The likely resolution is a signed range
(−10…+10, tight→loose, 0 = perfect), but that is a decision, not an assumption,
so it is flagged rather than silently "fixed".

Also grounded a UX choice in a modelling fact: **"Just right" is pre-selected**
because ~75% of fit feedback in both public datasets is "fit" (ModCloth 52,222 of
76,059; RentTheRunway 142,042 of 192,523). Defaulting to the modal answer makes
the common case cost zero taps and charges only the rare, *informative* answers —
the label-imbalance problem turned into a UX decision.

### The animated figure — asked, researched, and the mechanism changed

Follow-up question: could this be an animation — a small figure wearing the
garment, where sliding tightens or loosens it, so the effect is visible?

**The instinct is right; the mechanism is contradicted by measurement research,
decisively enough to change the design rather than merely qualify it.** Funke
(*Social Science Computer Review*, 2016) compared formats that look nearly
identical but differ mechanically — VAS is point-and-click (two actions), a slider
is drag-and-drop (four). Break-off: radio buttons **1.5%**, slider scales
**4.2%**, and on smartphones and tablets **37% for sliders versus 2.3% for radio
buttons**. It is worst for respondents with a low final school grade (11% vs
2.2%), which points at cognitive load rather than dexterity. The recommendation in
the literature is explicit: radio buttons for discrete variables, VAS for
continuous, **avoid slider scales**.

Two further defects would have hit us specifically: a handle sitting at rest
**anchors** the answer toward wherever it starts, and if it starts at a valid
value we **cannot tell a real answer from an untouched control** — which would
silently corrupt the exact signal the rest of this design is built on.

Worth recording: **the FIC table predicted this ordering independently** (slider
5, pick-from-2-5 3) before the literature was consulted. Mild evidence the rubric
sits somewhere near reality — noted here because it would have been equally worth
recording had it come out backwards.

So the animation was moved off the input path rather than dropped. Ranked:
**(1) on `/check` as pure explanation** — collects nothing, so no break-off risk
at all, and it makes the per-size ease arithmetic the engine already computes
*visible*; **(2) in the closet as feedback on a tap**, where the figure animates as
a *consequence* of the five-way choice rather than the means of making it;
**(3) as the numeric mode**, which settles half of last section's open
question — tap a point on the line, no handle drawn at rest, never a drag handle.

**Two constraints that are not negotiable.** It must be **schematic, not
photoreal**: `fit-algorithm-research.md` §1 opens with the finding that every
mainstream image-based try-on transfers *appearance, not fit*, and concludes that
size recommendation must stay separate from any try-on visual — a realistic figure
would quietly make the promise the whole research file says nobody can keep. So:
ease drawn as a gap, the centimetre number printed beside the picture, and a look
that reads as a diagram of the computation. `OutfitMannequin.tsx` is the right
starting asset precisely because it is already abstract. And it must **not
re-introduce the pointer-driven re-render** fixed twice already in `MetalCard` and
`BadgeCoin` — CSS custom properties via ref, rAF-coalesced, never `setState` per
move. Placements 1 and 2 avoid continuous pointer tracking altogether, which is a
further reason to prefer them.

⚠ Recorded honestly: the *positive* half of the argument — that seeing the effect
helps someone answer more accurately — is **not directly evidenced for this task**.
The supporting literature is adjacent only. The *negative* half is directly
measured. The animation is therefore justified as an **explanation** feature, not
as the data-quality intervention it has not been shown to be.

209 tests, unchanged — no code was touched this session beyond the team credit.

---

## 2026-08-25 · Session 43 — Documentation truth-pass, memory published to the repo, and the message architecture

**Standing rule tightened this session:** a DEVLOG entry is owed for **every code
change and every push**, not once per session. Three pushes in this session
(`37add52`, `b02e6df`, `6d13f45`) went out without one — this entry is the
correction, and the rule now lives in memory so it doesn't drift again.

### Documentation that no longer matched reality

Audited every doc against facts known to have changed — test counts, Node version,
Lenis, badge dimensionality, deployment state.

**One was not stale prose, it was a trap.** `docs/DEPLOYMENT.md` §1 still said
*"while no database has been deployed yet (still true as of Session 33)"* and gave
the regenerate-`0_init`-from-empty recipe. A production database now exists **and
has applied `0_init`**, so following that block would rewrite an applied migration
and make Prisma refuse to deploy. Marked NO LONGER APPLICABLE, kept as history, and
the additive-migration block is now labelled the current procedure.

Also there: the known-limitations list claimed *"moderation has no review queue"* —
that shipped in Session 37. Replaced with what is genuinely still missing (appeals;
a crude auto-hide threshold), reordered so the **base64-images-in-Postgres wall**
leads, and added the Vercel Hobby commercial-use term and the
preview-deploys-have-no-database constraint.

Both READMEs and `Badge-Design.md` still claimed there is no flat badge variant,
untrue since the day before. `docs/RESUME.md` was a Session 39/40 artefact —
rewritten around current state. `app-web/README.md` was still untouched
`create-next-app` boilerplate.

### Memory published to the repo — curated, not copied

The founder asked for the assistant's project memory to live in the repo so the
teammate can read it. Published as **`docs/memory/`** with a README, on three lines:

- **Project knowledge goes in.** Architecture and invariants, performance traps,
  deployment, design system, threat model, ecosystem plan, backlog.
- **Notes about a person stay out.** Personal identifiers, working-style
  preferences, and one developer's machine setup are not project knowledge.
- **Two "feedback" notes were actually PRODUCT constraints** — no scraped brand
  imagery, and research-grounded features — republished as `principle-*.md` with
  the personal framing removed.

**A pre-commit credential sweep found something on its first pass:** a personal
email address sitting in the build-state notes. Also removed the Neon endpoint host
and Vercel org/project ids (harmless alone; useful to anyone who also has a
credential) and the seeded admin password — which was additionally sitting in
`docs/RESUME.md`, a shared repo. **Scrubbed from the private originals too, not just
the published copies**, because it should never have been written down in either.
The sweep is worth keeping as a habit: grep the staged copy for credential patterns
before every commit.

Also repointed twelve `[[links]]` in the published copies that referenced files
which stay private, so a reader never hits a dead reference.

**Two directories deleted** after verifying they were fully migrated:
`Self_project_memory` (byte-identical to the live memory dir) and an old Mac copy of
the repo (**605 MB**, last commit `07d135d` already contained in the live repo, no
processes using it, not a worktree, no config referencing it).

### Message architecture → sharper product copy

Filling in a message-architecture template produced two sentences better
than anything on the site, so they went into the product rather than staying in a
deck:

- The homepage parallax statement repeated the privacy point the section above
  already made. Replaced with the **point of view**: the industry keeps making the
  *picture* better — scans, avatars, models wearing your face — but **fit was never a
  picture problem; it is a memory problem, and the memory is already in your
  closet.** That reframes the category in two sentences.
- The hero now ends on **"When we aren't sure, we say so."** That clause is the
  actual differentiator and it was missing from the first thing anyone reads. Also
  "clothes you already own" rather than "already love" — *own* is the defensible
  claim.

`docs/business/message-architecture.html` is the filled template, laid out the way the
workbook lays it out (North Star / Strategy / Expression, each field beside its own
definition) so it reads as a completed worksheet rather than a pitch. Sourced claims
footnote to the research files. The DNA assessment came out **overwhelmingly
customer-centric with one challenger streak**, which is recorded as the reason Core
DNA is *"honest by construction"* rather than anything technology-led — the
defensible asset is being trusted, not being clever.

209 tests, clean build throughout.

---

## 2026-08-24 · Session 41 — New machine (Mac → Windows), toolchain rebuild, security patch, and two deploy blockers

**Context:** the founder changed computers. The project is now a fresh `git clone`
at `D:\Start-Up-Project\fit-passport` on **Windows 11**, replacing the old macOS
path. A clone carries source only, so everything gitignored — `node_modules`,
`.env`, `prisma/dev.db` — was absent, and the machine had no Node at all. Goal for
the session: get the app building and tested on the new machine, then deploy.

### Toolchain rebuild

- **Node.js 24.19.0 LTS** installed (winget). Worth stating plainly: the long-standing
  *"pinned to Node 18.20 — do not upgrade"* note was a **property of the old Mac**, not
  a requirement of this project. Next 14 needs ≥18.17 and Prisma 5.22 is happy on
  current LTS, so a clean machine is the moment that pin costs nothing to drop.
- `npm install` (475 packages) → `npm run db:push` (SQLite `dev.db` created) →
  `node scripts/seed-admin.mjs` (AK, member No.1, 12 closet items, 4 collections,
  2 outfits, 1 question).
- **Everything green on the new OS, first try:** `tsc` clean · **172/172** tests ·
  clean production build (56 routes) · live `next start` smoke — 10 pages 200, the
  middleware mints exactly one session cookie, profile round-trips, and the core loop
  returns **XL "true to size" @0.75** for chest 99 + regular (fixture path).
  No Windows-specific source changes were needed to get there.

### Security: Next.js 14.2.15 → 14.2.35

`npm audit` rated the pinned `next@14.2.15` **critical**. The advisory that actually
matters here is **CVE-2025-29927, authorization bypass in Next.js middleware** —
`src/middleware.ts` is precisely where this app mints and verifies the session cookie,
so a middleware bypass is a bypass of the entire auth model. Bumped to **14.2.35**,
the last patch of the 14.2 line: patch-level, no API surface change.

Re-verified after the bump: tsc clean, 172/172, clean build, and a fresh live smoke
confirming the middleware still mints one cookie per first page request and
`/api/view/[code]` still returns no `chestCm`/`waistCm`.

The remaining audit entries were **scoped, not waved away**. They resolve only in
Next 15/16 and cover features this app does not use: grepped and confirmed **no Server
Actions, no `next/image`, no i18n, no Pages Router, no `remotePatterns`** (`next.config.mjs`
sets only `reactStrictMode`). A major-version upgrade belongs before a real public
launch, not before a demo.

### Two blockers that would have failed the first deploy

Both are invisible locally — SQLite needs no migrations and has no connection pooler —
so both would have surfaced only as a red Vercel build.

1. **`prisma/migrations/migration_lock.toml` did not exist.** `prisma migrate deploy`
   (which `vercel-build` runs before `next build`) reads the connector from that file
   and aborts with *"Could not determine the connector from the migrations directory"*
   without it. It is normally written by `prisma migrate dev` — a command this project
   never ran, because `0_init` was diffed offline `--from-empty`. Added by hand,
   recording `provider = "postgresql"`.
2. **Migrations were aimed at the pooled connection.** Neon's `-pooler` host is
   PgBouncer in *transaction* mode; `prisma migrate deploy` takes *session*-level
   advisory locks, which transaction pooling cannot hold — the lock is acquired on one
   backend and released on another, so migrations hang or error. `gen-postgres-schema.mjs`
   now emits `directUrl = env("DIRECT_URL")` beside the pooled `url`, which is Prisma's
   supported split: **app → pooler, migrations → direct host.** The generator gained a
   matching guard so a changed datasource block fails loudly instead of quietly
   producing a schema with no `directUrl`.

Documented `DIRECT_URL` in `.env.example` and `docs/DEPLOYMENT.md` (§1 layout, §2 Neon
steps, and the required-env table).

**Verified before trusting any of it:** the generated Postgres schema passes
`prisma validate`; the committed `0_init` still matches the schema exactly (485 lines,
re-diffed `--from-empty` — no drift).

### Production database provisioned (Neon)

Neon project created (`us-east-2`). Both hosts were probed for real rather than assumed —
the string the founder was given had no `-pooler`, so it is the **direct** one and the
pooled variant was derived by inserting `-pooler` into the host. Both accept
connections.

Then the Vercel build was **rehearsed locally against the real database** rather than
being discovered in CI: `npm run db:pg:generate` → `prisma migrate deploy`. `0_init`
applied cleanly, the log confirms it went over the **direct** host (proving the
`directUrl` fix works), a rerun reports *"No pending migrations to apply"* (so the
Vercel build will not re-apply), and `SELECT id FROM "User"` succeeds (so the tables
are really there).

Afterwards `npx prisma generate` was re-run to restore the **SQLite** client locally —
`db:pg:generate` overwrites the generated client with the Postgres one, which would
otherwise break `npm run dev`. Confirmed by reading the local admin row back.

### Windows notes for future sessions

- `app-web/scripts/md-to-pdf.mjs:24` hard-codes the macOS Chrome path, so
  `npm run docs:pdf` cannot work here until it resolves a browser per platform.
  Not fixed this session — no PDF regeneration was needed.
- PowerShell blocks npm's `.ps1` shims under the default execution policy
  (`vercel login` → *"running scripts is disabled on this system"*). Calling
  `vercel.cmd` instead sidesteps it without weakening the machine-wide policy.
- Command translations for the old macOS notes: `rm -rf .next` →
  `Remove-Item -Recurse -Force .next`; `lsof -nP -iTCP:3000` →
  `Get-NetTCPConnection -LocalPort 3000`.

### SHIPPED — the app is live at https://fit-passport.vercel.app

First production deployment. Vercel project `fit-passport`, Node 24.x (matching local),
build completed in 45s.

Project configuration was done through the API rather than the dashboard, because
`vercel link` leaves **Root Directory = `.`**, which is wrong for this repo — the Next
app lives in `app-web/`, so a Git-triggered build would clone the root, find no app and
fail. Patched to `rootDirectory: "app-web"`, `buildCommand: "npm run vercel-build"`,
`framework: "nextjs"`.

**Environment variables are set for `production` ONLY, deliberately.** `vercel-build`
runs `prisma migrate deploy`, so a preview deployment that inherited `DATABASE_URL`
would migrate the *production* database from a feature branch — the exact hazard
`docs/DEPLOYMENT.md` §4.4 warns about. Preview builds will fail loudly for want of a
database, which is the safe failure. When previews are actually wanted, they get their
own Neon branch first. `SESSION_SECRET` was generated straight into the API call and
never written to disk or displayed.

### Production verification (docs/DEPLOYMENT.md §5)

Every claim below was executed against the live URL, not localhost:

- **12/12 pages return 200**, and the middleware mints exactly one session cookie.
- **Postgres writes work:** `POST /api/profile` (chest 99 / waist 78 / US) → read back
  identical. Three closet items added. This is the real proof the Neon wiring is live.
- **Core loop runs:** `/api/check` on the Uniqlo fixture URL returns a ranked size with
  reasons and provenance.
- **PRIVACY INVARIANT HOLDS.** `/api/view/<code>` was checked field by field for
  `chestCm, waistCm, hipCm, shoulderCm, sleeveCm, inseamCm, heightCm, weightKg` —
  **none present**. It returns only username, code, avatar, coarse bodyType, sex,
  shopsFor, canExport, followerCount, collections, closet, memberNo, badges. The public
  `/u/<code>` page renders 200 with no centimetre figure anywhere in the HTML.
- **Rate limiting is genuinely shared, not per-instance:** queried the Upstash REST API
  directly and found the app's counters (`rl:view:<ip>:<window>`) actually written there.
- **Admin path works:** production admin seeded with a freshly generated password (NOT
  the local `12345678`); login 200, `/admin` 200, `/api/admin/reports` 200 — the last
  one only answers to `role = "ADMIN"`, so the role check is confirmed end to end.

Afterwards `npx prisma generate` restored the SQLite client and the local suite was
re-run: 172/172, local admin still reads back from `dev.db`. Production work left local
development untouched.

### Engine observation worth following up (not a deploy issue)

The production check returned **M "too small" at confidence 1.0** where the same input
locally returned XL "true to size" at 0.75. The difference is correct behaviour: the
production account had just been given a Uniqlo t-shirt rated 5/5, which triggers the
[F1] anchor path, and the anchor dominates the measurement signal by design.

What looks wrong is the **confidence**. The anchor says M while the measurement verdict
on that same size says "too small" — a direct disagreement between two signals — and the
engine still reports 1.0. Confidence should fall when signals conflict, not sit at
maximum. This belongs to the already-queued "confidence-calibration sanity pass" and is
now a concrete, reproducible case for it rather than a vague to-do.

### Real-retailer fetch, measured on production (important, and it corrects an assumption)

Ran the §5 walk against two live retailer URLs. Both returned a sensible brand, category
and size — but both came back `sizesFrom: "estimated"` with confidence capped at 0.5,
i.e. no real size chart was read. Probed the two hosts directly to find out why:

| host | HTTP | bot-block markers | `<table>` count |
|---|---|---|---|
| patagonia.com | **404** | no | 0 |
| www2.hm.com | **403** | **yes** | 0 |

- Patagonia: the product URL written into `docs/DEPLOYMENT.md` §5 is simply **dead** — that
  item was retired since the runbook was written. Fixed the runbook to a stable example.
- H&M: **actively blocks server-side fetches.** This is `looksBlocked` doing precisely its
  job: it recognised the challenge page, refused to parse it as a product, and degraded to
  an honest estimate with the "⚠ sizes estimated — confirm the chart" wording and a capped
  confidence. The honesty machinery is verified working on a real hostile site.

**The assumption this corrects:** the queued Tier-1 item "set `ANTHROPIC_API_KEY` in prod so
extraction works on real sites" is only half true. The key unlocks the text LLM and the
vision size-chart OCR — but both operate on HTML we already hold. **A key cannot fix a 403.**
Where a retailer blocks the fetch, no model helps, because there is nothing to read.

So extraction robustness splits into two genuinely different problems:
1. **Pages we can fetch, whose charts are images or unstructured** → `ANTHROPIC_API_KEY`
   solves this, and the China research says image charts are the common case. Still worth
   doing first; it is cheap and unblocks a real segment.
2. **Pages we cannot fetch at all** (Cloudflare/Akamai/PerimeterX class) → needs a different
   mechanism entirely: a residential/proxy fetch layer, a headless browser service, an
   official retailer feed, or a user-side path (paste the chart, screenshot it, browser
   extension). None of these are in the tree today, and the choice has cost and legal
   dimensions worth deciding deliberately rather than drifting into.

This is now the sharpest open question against the "paste any product link" promise, and it
is backed by a measurement rather than a guess.

### Confidence calibration — fixed, with the production case as the test

The 1.0-confidence finding above turned out to expose a gap in the model, not a
tuning error. The existing rule (§4.5 of the research doc) lowers confidence when
the top two sizes are near-tied. It cannot catch this case, because **the margin
was wide** — decisive *precisely because* the anchor overrode the measurement
signal. A decisive margin is not the same as a confident answer.

Added `signalDisagreement()`: for each independent signal, find the size that
signal alone would pick; take the largest ladder distance from the ensemble's
winner. One step ×0.8, two or more ×0.65. Separately, any size whose own ordinal
verdict reads *too small* / *too big* is capped at 0.6.

Grounded in the framing the engine already uses (research doc now §4.6): under
"recommend the size most likely to be **kept**", a size one signal predicts will be
**returned** cannot also be a near-certain keep; and disagreement among independent
estimators is a standard uncertainty estimate in its own right.

Crucially the reason is **surfaced**, not just subtracted — `conflictNote` renders
on `/check` ("by your measurements, XL; by the strongest overall evidence, M").
A smaller number with no explanation is just a worse number, which would undercut
the explainability invariant.

Measured: **1.0 → 0.59** locally, **1.0 → 0.6** verified on production. Agreement
scores 0.90, one-step disagreement 0.72 — monotone as the theory predicts. The
[F1] anchor fix is intact: the anchor still wins the *size*, it just no longer wins
the *certainty* too. 172 → 178 tests.

### Fetch strategy — decided, and the deciding ratio instrumented

Wrote `docs/design/fetch-strategy.md` rather than leave "real-fetch robustness" as
a vague backlog line, because the 403 finding is an architecture question.

Priced the paid options honestly: ScrapingBee is $49/mo, but JS rendering costs 5
credits/request and **stealth proxies cost 75** — that $49 buys ~3,300 stealth
requests. Zyte and Bright Data both reach **~$16 per 1,000** on hard targets. The
bill scales with exactly the sites we fail on.

The stronger objection is legal. **hiQ v. LinkedIn** and **Meta v. Bright Data**
(N.D. Cal. 2024) both went the scraper's way on CFAA for *logged-out public* data —
but the low-risk profile both describe requires **respecting technical access
controls**, and a Cloudflare 403 is one. A stealth proxy's whole product is
defeating it. We would be spending a governance story that is currently an asset
(the governance concern) to win a few size charts. Bad trade.

**Decision:** key + a paste-the-chart fallback now; a **browser extension** later,
gated on evidence of real usage — it reads the page in the user's own browser as
themselves, so the block *disappears* rather than being defeated, it costs nothing
per request, and it handles JS-rendered size modals the server parser cannot reach.
Affiliate feeds noted as opportunistic. Stealth proxies rejected.

That decision turns on a ratio nobody had measured, so `source.fetch` now records
**`blocked` / `unreachable` / `ok` / `skipped`** beside `sizesFrom`. `looksBlocked`
already knew the difference; it just wasn't recorded. A block is also no longer
retried — the CDN said no once. Verified live: `www2.hm.com → blocked`,
`patagonia.com → unreachable`. 178 → 184 tests.

### Cost model — and a 20x cost bug found while writing it

`docs/design/cost-model.md`. Running cost today is genuinely **$0**. Per check with
a key: **~$0.012** (Haiku 4.5 at $1/1M in, $5/1M out). Demo scale ≈ **$4/month**.

Writing it surfaced a real bug: `MAX_PAGE_BYTES` was **600,000 chars ≈ 150K tokens
≈ $0.15 per extraction** — about **20x** the "~$0.007/check" advertised in
`.env.example`. Cut to **80KB (~$0.02 worst case)**, which is only safe because
`htmlToLlmText` emits `SIZE TABLES` before prose; the function is now exported and
three tests pin that property (including bloat-before-chart), because a comment
asserting it wasn't enough to justify a 7x cut. 184 → 187 tests.

**Two findings that matter more than the arithmetic:**
1. **The first thing that breaks is storage, not the LLM bill.** Item photos are
   base64 data URLs *inside Postgres*; Neon free is 0.5 GB ≈ **340 users with ten
   photos each**, after which writes fail for everyone. That arrives long before
   LLM spend gets interesting.
2. **Vercel Hobby forbids commercial use.** Pro ($20/member/mo) is a *licence*
   requirement the moment this charges anyone — not a resource limit that staying
   small avoids. Hobby's 100 GB bandwidth cap also has **no overage option**; it
   just stops.

Also recorded two optimisations **not** to chase: prompt caching needs a stable
≥1024-token prefix we don't have (every page differs), and the Batch API's 50%
discount is asynchronous while `/api/check` has a user waiting.

### Performance — the jank had a location, and the location explained it

Founder reported scroll jank specifically between *"Everything you know about your
fit."* and *"You keep the profile."*, plus "the server is sometimes slow". Two
different problems; both measured rather than guessed.

**The jank.** Those two headings are `ConvergingStack` and `ParallaxStatement` —
adjacent sections, each painting a decorative word at `text-[22vw]` and
`text-[38vw]` (≈317px and ≈547px of type on a 1440px viewport). One is
scroll-*scaled*, the other scroll-*translated*, and **neither was on its own
compositor layer**. Un-promoted, a transform re-rasterises the painted area every
frame, and that area is enormous. At the boundary **both** giant layers are on
screen repainting together — which is precisely why the jank had a location instead
of being uniform.

Fixed by adding `will-change: transform` to the elements that are actually
scroll-driven: both giant words, the parallax statement, the hero block, and the
three deck cards (those because they carry `shadow-lift`, and animating opacity on
a shadowed box repaints the shadow every frame unless it owns its layer).

Two deliberate restraints: **`will-change` alone, no `translateZ(0)`** — these are
framer-motion elements that compose `transform` themselves from x/y/rotate/scale,
so a raw transform string would fight framer for the same property; and **only
scroll-driven elements are promoted**, since promoting everything wastes GPU memory
and can end up slower than not promoting at all. Verified live: `will-change` is
present in the served page.

**The server.** Measured properly instead of assuming. Warm production latency is
fine — `/` 76–248ms, `/api/status` ~310ms median, `/api/community` ~196ms. Then a
deliberate 6-minute idle to let Neon's free-tier compute autosuspend:

```
COLD (after 6min idle) : 1,103 ms
WARM (next 3)          :   313, 251, 375 ms
PENALTY                :   852 ms
```

So the database cold start is **real and ~850ms**, and it lands on the homepage
because `/` fetches `/api/status` on mount. **But 1.1s is not "very slow"** — this
explains a noticeable first-hit delay, not a severe one, and it would be dishonest
to file it as the whole cause. Most of the perceived slowness was likely the scroll
jank above. Worth re-checking with the founder now that the promotion has shipped.

Practical note: keeping Neon warm 24/7 would exceed the free plan's 100 CU-hours,
so the cheap answer before a live demo is simply to hit the site a few times first.

### Round 2 on performance — three real causes, and one wrong first diagnosis

The founder reported the jank was unchanged, the tab was at ~800MB, and asked
whether this was a design problem or a server problem. Worth recording plainly:
**the first diagnosis was half wrong.** The `will-change` fix addressed
rasterisation cost, which was real but was not the bottleneck. Three separate
causes were.

**1. React state on every pointermove.** `MetalCard` called `setState` in
`onPointerMove`, re-rendering the whole subtree — SVG grain, agate veins, every
`CardField`, the badge seal — 60–120 times a second, and calling
`getBoundingClientRect` on each move as well: read layout → write state →
re-render → read layout. Now the tilt writes CSS custom properties straight to
the DOM, coalesced to one write per frame, measuring the rect once per hover.
**React renders zero times while the pointer moves.** The same bug existed a
second time in `BadgeCoin`, multiplied by however many badges were on screen.

**2. A leaked WebGL context.** `BadgeWebGL` disposed geometries, materials and the
renderer but never called `forceContextLoss()`. `dispose()` frees three.js's own
GPU objects, **not the context**. So every badge inspected in True 3D leaked a
live context; Chrome caps concurrent contexts (~16) and evicts the oldest, and
until then each holds GPU memory. That is exactly the "everything gets laggy
after navigating around" symptom — **and it never surfaces as an error.**

**3. Lenis.** Removed. It was the *amplifier* for every other scroll cost rather
than a cost of its own: native scrolling runs on the compositor, while Lenis
replaces it with a main-thread rAF loop whose synthetic scroll events make all
four `useScroll` sections re-measure — ~16 transforms recomputed and written per
frame — and with `lerp: 0.1` that continued ~20 frames after the wheel stopped.
`will-change` does nothing for layout thrash, which is why round one missed it.

It also explains the reported hitch when the pointer entered the "Why it works"
row: `data-lenis-prevent` existed *precisely because* Lenis fought that nested
scroller for control. Removing Lenis removed the conflict by construction.
Homepage 53 → 47.9 kB.

### Badges go flat — a design decision, made on measured evidence

Even after the above, the tab stayed heavy on the founder's Windows machine. The
arithmetic is the answer, and it is a **design** cost, not a defect: by the
Session 29–30 rule ("every badge is a dimensional struck medal, there is no flat
variant"), each badge is a stack of up to twelve rim slices inside
`preserve-3d` — every slice its own composited layer — over a face SVG carrying
**eighteen gradients and two filters**, one a `feDropShadow` (an offscreen blur
buffer). The trophy case renders **twenty at once**: roughly 140 layers and 40
filter passes, held in GPU memory whether visible or not, and textures are 4× the
CSS area at devicePixelRatio 2.

**Mac vs Windows is a real difference, not a excuse.** The same build was fine on
the Mac this was designed on; macOS's compositor and unified memory absorb heavy
layer counts that a Windows integrated-GPU path does not. That is why this went
unnoticed until the machine change — and it is a genuine confound in "it used to
be smooth locally", since that "locally" was a different computer.

Two no-visual-change optimisations first: rim-slice darkening moved from
`filter: brightness()` (a layer **and** an offscreen buffer, ×12 ×20) to a flat
black overlay gradient, and `content-visibility: auto` on badge tracks so
off-screen ones cost nothing. Then, on the founder's call, **`BadgeCoin` gained
`dimensional`, defaulting FALSE.** The flat path is one medallion SVG: no 3D
context, no rim stack, no back face, no pointer state.

The dimensional treatment is **not deleted** — it moved to the inspect stage,
which shows one badge at a time and is the moment the craft is actually being
looked at. The metal card is untouched and stays as designed. Restoring it later
is one default, or one prop per call site.

### Security — SSRF, and a confident-wrong-answer bug

Both prompted by the founder asking what happens if someone pastes a game top-up
link or something malicious. Both turned out to be real.

**SSRF: there was no guard at all.** `/api/check` fetches whatever URL is pasted,
and the only checks were "protocol is http(s)" and "hostname contains a dot" —
which **`169.254.169.254` satisfies**. On this platform that endpoint can return
live credentials to an unauthenticated GET. New `lib/urlSafety.ts` blocks private
and reserved IPv4/IPv6 (including the `::ffff:` mapped form used to smuggle a v4
address through v6), localhost and internal-by-convention suffixes, embedded
credentials (`https://shop.com@169.254.169.254/` reads as shop.com to a human),
and non-web ports used to probe internal services — plus a DNS check, failing
closed, for a public hostname pointing into private space.

**Redirects were the actual hole.** With `redirect: "follow"`, every check on the
original URL is worthless: an innocent public link can 302 straight to the
metadata endpoint. Now followed manually, four hops max, **every hop re-gated**.
Chart images for vision OCR go through the same gate — an `<img src>` at an
internal address is the same attack with one more step.

**Non-apparel links.** `detectCategory` defaulted to `"tshirt"` when nothing
matched, so a top-up page, an article or a download became a t-shirt and received
a confident size. For a tool whose whole proposition is that its answer can be
trusted, a confident wrong answer is the worst available failure. Unrecognised
pages now carry `source.categoryGuessed`, and `/api/check` returns **422** with a
plain explanation instead of writing a bogus product row.

That refusal immediately exposed a gap the tests caught: **the keyword table was
English-only**, so a Chinese product link would have been turned away as "not
clothing" — precisely the market `china-sizing-research.md` says matters most.
Added Chinese garment terms, and note the trap: **no `\b` anchors**, because word
boundaries are ASCII-defined and never match at a CJK boundary, so adding them
would have silently disabled every rule in the group.

Verified on production: three SSRF payloads → **422 refused**; a top-up link →
**422 refused**; a real garment link → **200**. 187 → **209 tests**.

### On Taobao (asked, answered, not built)

Taobao requires login for most product detail, which puts it on the **wrong side
of the line the case law draws** — `Meta v. Bright Data` let the contract claims
proceed specifically for data scraped *while logged in*. So it is not a harder
version of the H&M problem, it is a different category. The browser extension in
`fetch-strategy.md` is the answer here too, and Taobao only strengthens that
argument: the user is already logged in, in their own browser, as themselves —
there is no access control being circumvented.

### Still open

- **GitHub auto-deploy is NOT connected.** Both `vercel git connect` and a direct API
  `POST /v9/projects/{id}/link` fail (HTTP 400 / "Failed to connect"), because the Vercel
  GitHub App has not been installed on the `Kpewww` account with access to the private
  repo. That is a browser authorisation only the founder can grant. Until then, releases
  go out with `vercel deploy --prod` from the repo root.
- Neon is in `us-east-2` while Vercel functions run from `iad1`; the Hobby plan does not
  let functions be pinned to `cle1`, so this stays a ~10–15ms cross-region hop. Not worth
  moving the database for.
- The verification walk left one throwaway claimed account in production
  (`smoke…`, member No.2). Harmless and not listed in the community directory, but it
  should be cleaned up before any real user sees the member roster.
- No `ANTHROPIC_API_KEY` in production yet, so live pages still fall back to the
  deterministic path — the LLM text extract and the vision size-chart OCR are inert.

---

## 2026-08-20 · Session 40 — Real product-page fetching, phase 1 (deterministic size-chart parsing) + fit research

**Context:** the Session-39 audit named the #1 gap: sizes were *derived* from the URL
slug, not *read* from the page (`source.derived===true`). The founder said: make real
fetching work, and go research every existing AI fit / try-on product and paper
(Western + Chinese channels) to inform a better algorithm/prompt/logic. Contests,
deployment, and badge beautification are explicitly deferred.

**Also this session: the project moved.** The founder reorganised the Desktop; the repo
is now at `~/Desktop/Summer Intern Amazon/Kong Info/Self-Project/` (was
`~/Desktop/Kong Info/Self-Project/`). Nothing lost — same git repo, just relocated.

### What shipped — deterministic page parsing (no API key needed)

The biggest, cheapest win isn't the LLM — it's that a large share of real retail pages
already embed machine-readable data we were discarding. New **`src/lib/pageParse.ts`**
(pure, unit-tested, no network):
- **JSON-LD** schema.org `Product` → brand / name / material (handles a single node, an
  array, or an `@graph`; survives a malformed block by falling through to OpenGraph).
- **OpenGraph / meta** → title, `product:brand`, description → fit notes.
- **Gender inference** (women-before-men, plus 中文 女装/男装/中性).
- **`parseSizeTables(html)`** — the high-value piece: reads a real size chart out of an
  HTML `<table>`. Handles BOTH orientations (sizes-as-rows and sizes-as-columns),
  English + Chinese measurement headers (chest/bust/胸围, waist/腰围, shoulder/肩宽,
  sleeve/袖长, length/衣长), **inches→cm** auto-conversion (a chest median <65 reads as
  inches → ×2.54), collapses ranges ("96-100" → 98), and picks the richest table when a
  page has several.

**`extractorLLM.extractSmart`** rewritten as honest layers: fixture → trust it; else
**fetch the real page (no key required)** and parse deterministically — a found table
means `source.sizesFrom="page"` and we stop (no LLM spend); else, if `ANTHROPIC_API_KEY`
is set, the LLM reads a **table-preserving** text rendering (`htmlToLlmText` keeps
`<table>` rows as `a | b | c`; the system prompt is extract-only, never-recommend,
convert-to-cm); else we fall back to the URL estimate as `sizesFrom="estimated"`.

**Honesty end-to-end:** `ExtractedProduct.source.sizesFrom: "fixture"|"page"|"estimated"`;
`/check` shows **"✓ sizes read from the page"** vs **"⚠ sizes estimated — confirm the
chart"**; `/api/check` **caps confidence ≤0.5 when estimated** (applied at the route,
which knows provenance — the engine stays pure) and now **persists `waistCm`**, which was
silently dropped before. `FIT_DISABLE_PAGE_FETCH=1` turns off network fetching entirely.

**Verify:** `tsc` clean · **127** tests green (was 115; +12 in `pageParse.test.ts`) · clean
`next build` · live smoke with no key → `sizesFrom:"estimated"`, confidence capped 0.4.

### Research → `docs/design/fit-algorithm-research.md`

Web-research agents covered commercial size-rec products, VTO image models, and academic
size/fit papers; findings synthesised into `docs/design/fit-algorithm-research.md`
(Chinese-channel survey didn't complete — flagged as a gap). Headline: **all mainstream
image VTO transfers appearance, not fit** — Google's TryOnDiffusion states verbatim *"we
don't promise fit."* Validates our measurement-based transparent engine as the real
differentiator (keep size-rec separate from any try-on visual). Also: the commercial
"reference-garment" family == our closet anchor, and the academic "returns shift target
size by ±1" (Zalando η term) == our brand-bias learning — both independently validated.

### Engine upgrade (phase 2, same session) — multi-dimensional, honest fit

Acting on the research, the scoring engine went from **chest-only** to a real
multi-signal fit model, all still transparent/testable:
- **Multi-dimensional measurement fit** (`scoreMeasurementFit` replaces `scoreChestFit`):
  scores chest + waist + shoulder, each a soft Gaussian around a garment target,
  combined chest-dominant and **renormalised over whichever dims are present** — so
  chest-only inputs behave EXACTLY as before (all prior tests unchanged), while
  waist/shoulder refine it. The reason **names the binding dimension** ("chest works,
  but the shoulders run 3cm narrow"). Signal renamed `chest-fit → measurement-fit`.
- **Body-range awareness:** when a chart gives `bodyChestMin/Max` (the retailer's
  intended BODY range, e.g. Levi's), score membership in that range instead of guessing
  ease off the garment chest. (Was parsed but unused.)
- **Garment-aware ease** (`easeAdjustForCategory` in sizing.ts): coats/jackets/hoodies
  add layering room, base layers subtract; mid-weight tops stay at 0 (the tuned
  baseline — keeps tests exact).
- **Per-size ordinal verdict** (`too small / snug / true to size / relaxed / too big`),
  from the signed chest delta — the small/fit/large framing from the literature; shown
  as a coloured chip per size on `/check`.
- **Confidence tracks decisiveness:** every size's confidence is scaled by the top-two
  score margin, so two near-tied sizes (genuine ambiguity) report lower confidence, not
  just data-sparse ones.

**Verify:** `tsc` clean · **133** tests green (was 127; +6 engine tests for the new
behaviours) · clean build · live smoke: chest 100 + regular → XL "true to size",
`measurement-fit` signal + verdicts flowing through `/api/recommend`.

### Real-fetch robustness (phase 1b) + Chinese-channel research (in flight)

Hardening the fetch so it works on more real sites and stays polite:
- **Browser-like fetch.** Swapped the self-identifying "FitPassportBot" UA (which
  invited 403s) for a real Chrome UA + `Accept-Language` (en + zh); follow redirects;
  one retry on a transient miss.
- **Bot-block detection** (`looksBlocked`, pure/tested): 403/429/503, plus CAPTCHA /
  Cloudflare/PerimeterX/Akamai challenge markers and Chinese 安全验证/验证码 — a
  challenge page is treated as unreachable so we fall back to an honest estimate
  instead of parsing the challenge as if it were the product.
- **In-memory TTL cache** (per URL, 10 min, bounded 200): a user who re-checks the
  same product after tweaking their profile now costs ONE fetch, not N — measured
  ~0.12s (fetch) → ~0.02s (cache hit). Politer to the retailer, faster for the user.
- **Real offered size labels** (`parseSizeLabels`, pure/tested): when a page has no
  measurement chart but lists its sizes in a `<select>`/swatch, we rank those REAL
  labels instead of a synthesized ladder (the anchor / outcome / brand-bias signals
  all work on labels). Measurements still absent ⇒ provenance stays `estimated`.

`pageParse` tests 12→18; suite **133→139**.

### Detailed test hardening

Broadened coverage of the Session-40 work, especially the parts that were only
unit-tested at the leaf level:
- **`extractorLLM.test.ts` (new, 9 tests): the whole `extractSmart` pipeline with the
  network STUBBED** (`vi.stubGlobal("fetch")`, key unset so the deterministic path
  runs). Covers: real `<table>` → `sizesFrom:"page"`; JSON-LD identity + table; a 403
  and a 200-CAPTCHA both → honest `"estimated"`; offered `<select>` labels ranked
  (still `"estimated"`); a top's 号型 labels → real body-chest bands + `"page"`; **cache
  proven** (2nd check on a URL makes no new fetch); **one-retry-then-succeed** on a
  transient throw; non-HTML content-type ignored. Found & fixed a test-only gotcha:
  the `html.length < 200` "unreachable" guard tripped on too-small fixtures — padded
  them to realistic length (real pages are huge; the guard is correct).
- **`sizing.test.ts` (new, 8 tests):** ease monotonicity + the `regular=10` baseline
  the engine is tuned to; `easeAdjustForCategory` ordering (coat>jacket>hoodie>blazer>0,
  tops=0, tank<0, case-insensitive); `preferenceShift`; alpha normalization/distance.
- **`fitEngine.test.ts` (+4):** waist-only scoring (no chest); verdict omitted with no
  chest; body-range verdict lands snug/true/relaxed not too-small/big; never-crash with
  zero signals.

Suite **151 → 172**. `tsc` clean, build clean.

### Image size-chart OCR (A) + regional body prior (D)

Founder greenlit "A和D". **A — vision OCR of image size charts** (the common Chinese-PDP
case, key-gated): `findSizeChartImages` locates candidate chart `<img>`s (EN+CN tokens,
lazy `data-src`, absolute-resolved, best-first); `callVisionLLM` fetches up to two and
asks Claude vision to read the chart into our size schema (cm-normalised, extract-only).
Wired as step 3b in `extractSmart`, after the text LLM, before falling back to labels.
**Legal:** the image is fetched ONLY to read its numbers — never stored or displayed, so
the no-scraped-imagery rule holds. No key ⇒ this simply doesn't run.

**D — regional body prior** (governance-sensitive, done carefully): `regionBodyPrior`
returns a coarse chest/waist/shoulder from published anthropometric survey means
(SizeUSA/ANSUR, SizeUK, EN13402, HQL, SizeChina/GB-T), keyed off the self-reported
`region` + sex. It **never infers or stores ethnicity**, returns null for unknown region
or unspecified sex (never guesses sex), and is a **prior only** — filled in
`recommendService` solely when the user has no chest of their own, and any real
measurement/anchor dominates it. When used, the engine says "regional averages — add
yours for accuracy" and caps confidence ≤0.4. Grounded per the research doc §4b.

Suite **142→151**. Commits `3981713` (D) + this (A).

### Chinese-channel research → `docs/design/china-sizing-research.md` + 号型 parser

Research written up. Key takeaways: **cm is the only reliable cross-market key**
(Chinese RTW runs ~2 US sizes small — never translate S/M/L across markets; validates
our measurement-first design); **per-item/brand fit bias + community "true-to-size"
sentiment** are high-value (得物 尺码感受, SHEIN runs-small reviews) — extends our
brand-bias + ecosystem; and **Chinese size charts are frequently IMAGES** (stitched
detail-page images) → OCR + table reconstruction should be a first-class future path,
not an edge case. Return rates are high (brand stores 24%→35% 2021–H1 2024; livestream
~80%) with 尺码不合适 named a leading driver — the pain point is validated.

Shipped the one cheap, grounded win now: **`parseChineseSizeCode`** parses GB/T **号型**
codes like `160/84A` → { height 160, girth(bust) 84, bodyType A }. For top categories,
`extractSmart` turns a 号型 label into a real body-chest band (`bodyChestMin/Max`) that
feeds the range scorer — so these labels carry REAL body measurements, not a guess
(`sizesFrom:"page"`). Suite **139→142**. (Bottoms' waist 号型 and image-chart OCR are
noted as future.)

**Next (founder to pick):** deploy; a manual contest; population/anthropometric prior
(most governance-sensitive — see roadmap); or JS-rendered-chart handling (needs a
headless browser — currently out of scope).

---

## 2026-08-14 · Session 39 — Investor-style prospectus + badge design document (with a from-scratch MD→PDF renderer)

**Context:** the founder asked for two written deliverables, each as **Markdown +
PDF**, in a dedicated folder: (1) a **badge design document** — the reasoning behind
the system, how each medal's silhouette / colour / centre motif is chosen, and a
"cost-no-object" section on how I'd design the medals at my most creative *while
staying restrained and never gaudy*; (2) an **investor-prospectus-style** overview of
the whole project — problem, product as built, defensibility, target users, status,
and where it goes next.

### What shipped

- `docs/prospectus/Fit-Passport-Prospectus.md` + `.pdf` — the project prospectus.
  Sections: the problem (returns cost, closet-as-dataset), the five product pillars,
  why it's defensible (verified fit context, earned-only prestige, crowd fit-knowledge
  feeding the engine, privacy-as-feature), the three target audiences and the wedge,
  a status table (everything built + 115 tests), the honest monetisation options, the
  forward sequence, and team/context. Framed as a prospectus but with an explicit
  "not an offer of securities / figures are targets" disclaimer.
- `docs/prospectus/Badge-Design.md` + `.pdf` — the badge design doc. Why badges exist,
  the five design principles (legible rank, real depth, escalating-but-restrained
  ornament, meaningful marks, one-object-everywhere), the track/tier/capstone
  structure, the full metal ladder with the titanium-not-platinum rationale, every
  live medal listed with its motif, and a **§6 "if cost were no object"** section:
  PBR-lit material, quieter/more-precise silhouettes, deep-relief struck centres,
  near-monochrome palette so the three special metals *mean* something, motion as the
  luxury signal, and designing the twenty medals as one coherent jewellery-case set.

### The interesting part — rendering the PDFs

No `pandoc` / `weasyprint` / `wkhtmltopdf` on the machine, and no markdown lib in the
tree. Rather than add a dependency, I wrote **`app-web/scripts/md-to-pdf.mjs`**: a
small, correct Markdown-subset converter (headings, fenced code, GFM pipe tables,
blockquotes, single-level lists *with lazy continuation lines*, inline
bold/italic/code/links) that emits HTML styled in the **product's own design system**
— self-hosted Fraunces + Inter embedded by absolute `file://` path, cobalt accent,
porcelain paper, black table headers — then renders it via **headless Chrome
`--print-to-pdf`**. So the deck reads like the app, not like a generic export.
`npm run docs:pdf` regenerates both; `--keep-html` keeps the intermediate for
debugging. First render exposed a parser bug (wrapped list-item continuation lines
broke out into their own paragraph mid-list) — fixed by absorbing lazy continuations
into the current `<li>`. Verified both PDFs visually via screenshot.

**Verify:** `tsc` clean · 115/115 tests green · docs render clean. The script lives in
`scripts/` and isn't imported by the app, so no build-surface impact.

**Next:** deployment execution is still the founder's to do (Neon + Vercel). Ecosystem
density work continues; the manual $100 contest remains the demand test before event
tooling.

---

## 2026-08-13 · Session 38 — Badges made actually dimensional; platinum → titanium

**Context:** the founder, on the previous session's badge work: *"仍然不是立体的,每个
上面目前只是镀了一层膜而已"* — still not three-dimensional, each one just has a film
plated on it. Plus: silver and platinum are too close, replace one.

The feedback was right, and last session's answer was wrong for a reason worth
writing down.

### Why they looked like a film — three real causes

**1. A disc seen head-on IS a flat circle.** The rim slices that gave the coin its
thickness sat at rotation zero, which hides the edge *exactly* behind the face. So
thickness only existed while you were hovering — the rest of the time the geometry
was, correctly, a circle with a gradient on it. No amount of shading fixes that.
Every badge now sits at a **standing angle** (−15°/−22° at large sizes, gentler at
26px where foreshortening would eat the engraving), and hovering turns it *from*
there rather than *to* it.

**2. The perspective was nearly orthographic.** `perspective: size * 9` puts the
camera so far away that nothing foreshortens — another way of spelling "flat". Now
`size * 4.2`, so the turn produces visible trapezoidal projection.

**3. A bug I'd shipped: every 3D layer was a `rounded-full` box 6% WIDER than the
medal.** The edge stack, the back face and the travelling sheen were all circles of
the layout box (radius `size/2`) while the art is drawn at radius `size*0.44`. Round
badges therefore wore a phantom outer rim, and **a shield sat on a disc it had
nothing to do with** — which is very literally "a film on a disc". All three layers
are now clipped to the badge's real silhouette via `clip-path: path(…)`, reusing the
exported `shapePath()` so the CSS clip and the SVG art can't disagree.

### And the face got a real lighting model

The old art was gradients that didn't agree with each other. Now **one light
direction (top-left) drives everything**, which is the whole trick:

- **dome** — convex body gradient, light→mid→dark→rim, hotspot offset up-left;
- **terminator** — a shaded band hugging the away-from-light edge, clipped to the
  silhouette (so a shield shades like a shield);
- **rim light** — a thin catch of light on the top-left edge *only*, on the bevelled wall;
- **speck** — an offset elliptical hotspot, the single strongest cue that a surface
  is curved rather than printed;
- **recessed field, lit the OTHER way round** — dark where the light comes from,
  because the wall in front of it casts into it. That inversion is what says
  "sunken" instead of "raised", and it's what makes the collar read as a step;
- **occlusion** — the shadow the collar throws into the field, strongest on the
  light side;
- **motif in three passes** — a heavier cast shadow away from the light, a light lip
  toward it, then the face, all off one path.

Four stepped levels (rim → collar → field → motif), each with its own light and
shadow edge. That stack is what makes a medal read as *struck* rather than drawn —
and it survives a screenshot, unlike a hover effect.

### Platinum → titanium

Platinum's pale cool grey was near-identical to silver **two rungs below it**, which
breaks the one job a ladder has: showing rank at a glance. Replaced with
**Titanium** — mid-dark, violet-warm, and **brushed** (a new `BRUSHED_METALS` grain,
because that's what titanium actually looks like). Unmistakable against bright
silver, yellow gold and glassy obsidian, and it still reads as *above* gold.

Renamed everywhere in one pass: the `Metal` union, `METAL_RANK`, `METAL_STYLE`,
`METAL_CHIP`, `PALETTE`, `CARD_THEMES` (a "Titanium Edition" card finish), the four
tier-4 badge definitions, and the tests. Also migrated any stored
`User.cardMetal = "platinum"` — otherwise those cards would have silently fallen
back to the default lapis, since `resolveTheme` can't find a theme that no longer
exists (0 rows locally, but the migration belongs in the record).

**Verified.** tsc clean, 115 tests green. Rendered-HTML inspection of `/help` (all
20 badges, server-rendered): **0 NaN**, all eight new lighting layers present on
every badge (`dome/bevel/term/rimlight/speck/field/occl/collar/bodyclip` × 20), the
brushed pattern on **exactly the 4 titanium badges**, `clip-path: path(…)` carrying
a real shield outline, `Platinum` gone and `Titanium` present. Clean production
build; pages 200.

**Files touched**
```
app-web/src/components/BadgeMedallion.tsx   (one-light-direction relief; BRUSHED_METALS; shapePath exported)
app-web/src/components/BadgeCoin.tsx        (standing angle, thicker milled edge, tight perspective, silhouette-clipped layers)
app-web/src/lib/badges.ts                   (platinum → titanium)
app-web/src/lib/badges.test.ts              (titanium wording)
app-web/src/components/Badges.tsx           (titanium chip)
app-web/src/components/MetalCard.tsx        (Titanium Edition card finish)
README.md, DEVLOG.md
```

---

## 2026-08-12 · Session 37 — Admin account + review queue, membership numbers, block list, self-hosted fonts

**Context:** the founder asked for an admin account (`AK`) with every badge and
"all permissions", a membership number on every account shown on the passport, and
for me to start on the two things I'd flagged as missing before real users.

### 1. The `AK` admin account — and what "all permissions" honestly means

`node scripts/seed-admin.mjs` creates or refreshes it (idempotent): username **AK**,
password **12345678**, `role = "ADMIN"`, `grantAllBadges = true`, listed in the
community, plus a believable starter set — a full fit profile, **4 collections, 12
closet items across 9 brands, 2 outfits and 1 question**. The closet deliberately
isn't all 5-star: a wardrobe where everything fits perfectly teaches the engine
nothing, so there are three 3-star items with notes about *where* they sit wrong.

Three decisions worth defending:

- **There is no API that grants admin.** An endpoint that can mint admins is an
  endpoint that can be abused into minting admins, and this app has no second
  factor to fall back on. The role comes from a script you need database
  credentials to run.
- **"All permissions" is one permission: the review queue.** Admins deliberately
  *cannot* read anyone's measurements — the privacy invariant isn't a permission
  level, it's a property of the data model, and `/api/view/[code]` still doesn't
  select the cm fields for *anybody*, including AK.
- **`grantAllBadges` shows every badge without faking a single statistic.**
  `computeBadgeStats` still returns the truth; only `evaluateBadges(stats, grantAll)`
  presents them as earned. So the leaderboard, the engine and every other account's
  badges stay honest. Verified: AK shows 20/20 badges and all 8 metals while its
  real stats are unchanged.

`/admin` is guarded with a **404, not a 403** — an admin surface shouldn't confirm
it exists. Non-admins get the same page a typo gets.

### 2. Membership numbers

`User.memberNo`, unique, rendered as **`No. 00000001`** — embossed top-right on the
metal card (where a charge card carries its number), included in the PNG export, and
shown on the public profile and in the review queue.

Two constraints shaped it:
- **SQLite only allows `autoincrement()` on a primary key**, so `/api/auth/claim`
  takes `max+1` and retries on the unique-constraint violation. Cheap, and correct
  under the race that constraint exists to catch.
- **Numbers are issued at CLAIM, not on first visit.** It's a *membership* number;
  an anonymous session isn't a membership. An unclaimed passport shows
  `No. ————————` rather than inventing one. The seed script backfills existing
  accounts by join order, with the founder as **1**.

### 3. Block list

Reporting is for content that breaks the rules; **blocking is for someone you simply
don't want to see**. Conflating them is how a review queue fills with personal
friction and buries the actual abuse.

`Block` is one-directional to create and **enforced both ways**: blocking someone
removes their looks, questions and answers from your feeds *and* removes yours from
theirs — so it's an exit from someone's attention, not just a way to avert your own
eyes. It also **unfollows in both directions**, because leaving a follow in place
would keep pushing them into a feed you just opted out of. They are never told.

`lib/blocks.ts` centralises it (`invisibleUserIds` + `notBlocked`) because a feed
that forgets the filter leaks exactly the person the user asked never to see again.
Applied to the outfit feed, questions list, thread answers *and* the thread itself
(404, indistinguishable from a bad id), the leaderboard, and the directory. The two
public endpoints use `readSession()` rather than `getCurrentUser()` — minting an
anonymous account for every scraper that hits `/api/community` would be absurd.

### 4. Self-hosted fonts

`next/font/google` downloads at **build** time, so a deploy fails whenever Google
Fonts is unreachable — which happened twice last session on a network with no usable
IPv6 route. Both families now ship as latin variable subsets in `src/app/fonts/`
(120KB + 73KB), loaded with `next/font/local`. Both are **OFL 1.1**, which permits
redistribution, and neither is renamed, so no Reserved Font Name condition applies;
`src/app/fonts/LICENSE.md` records the provenance.

**The proof it worked:** this session's production build succeeded **without** the
`NODE_OPTIONS=--dns-result-order=ipv4first` workaround, and the served HTML contains
**zero** references to `fonts.gstatic.com` — the woff2 files come from
`/_next/static/media/`.

**Verified.** tsc clean, 115 tests green, clean production build, **12 pages + APIs
200**. Live: AK logs in → `memberNo 1`, `role ADMIN`, 20/20 badges, 8 metals, 12
items, 2 outfits, 1 question; `/api/admin/reports` **200 for AK, 404 for a
stranger** (GET and POST). Block smoke: before/after showed B's look and question
disappearing from AK's feeds, B's thread 404, **and the reverse** — AK's outfits and
AK's directory entry vanished for B; self-block 400; unblock restored everything.
Review-queue smoke: 2 reports (below the auto-hide threshold) appeared in the queue
with reasons and notes → admin **hid it manually** (a human overriding the
threshold) → gone for strangers → **restore cleared the reports** so three can't
instantly re-hide it → delete removed it (thread 404). Smoke accounts cleaned;
`0_init` regenerated (19 tables).

**Next up.** Ecosystem step 4 — run one **$100 contest manually**. Then appeals: a
hidden author currently learns *that* they were hidden but has no way to reply.

**Files touched**
```
app-web/prisma/schema.prisma                  (memberNo, role, grantAllBadges, Block)
app-web/scripts/seed-admin.mjs                (new — AK + membership backfill)
app-web/src/lib/admin.ts                      (new — the admin gate, 404 not 403)
app-web/src/lib/blocks.ts                     (new — both-ways block filter)
app-web/src/app/api/admin/reports/route.ts    (new — review queue GET/POST)
app-web/src/app/admin/page.tsx                (new — the queue UI)
app-web/src/app/api/block/route.ts            (new)
app-web/src/lib/badges.ts                     (evaluateBadges/earnedBadgeIds grantAll)
app-web/src/app/api/auth/claim/route.ts       (member number allocation + retry)
app-web/src/app/api/{status,auth/me,view/[code],community}/route.ts  (memberNo, role, grant)
app-web/src/app/api/{outfits,posts,posts/[id],leaderboard,community}/route.ts (block filters)
app-web/src/app/passport/page.tsx             (No. on the card)
app-web/src/lib/cardExport.ts                 (No. in the PNG)
app-web/src/app/u/[code]/page.tsx             (No. + Block control)
app-web/src/components/Nav.tsx                (Review tab for admins)
app-web/src/app/layout.tsx                    (next/font/local)
app-web/src/app/fonts/{Inter,Fraunces}.woff2, LICENSE.md   (new)
README.md, DEVLOG.md, docs/DEPLOYMENT.md, docs/design/community-ecosystem.md
```

---

## 2026-08-12 · Session 36 — Badges made genuinely 3D, Ask folded into Community, moderation, Redis rate limits

**Context:** four asks in one batch — badges look flat and their True-3D view was
missing; make every badge turnable everywhere; fold Ask into Community; then the
two items that had been sitting in the "before real users" pile.

### 1. Badges are now dimensional objects, everywhere

The complaint was fair: a badge was a flat SVG that *tilted*. Now there is exactly
one way a badge is drawn — **`components/BadgeCoin.tsx`** — and it's a struck medal:
a stack of rim slices for real thickness, a **back face** you can turn it over to
see, a **contact shadow** so it sits on the page rather than being printed on it,
and a specular that travels as it turns. **The `flat` prop is gone** along with
`Badge3D`; there is no flat variant to opt into.

Cost control matters because a community grid can hold 60 seals: slice count and
depth scale with size, so a 26px seal builds 3 extra divs while the 300px inspect
hero builds 12.

**The medallion art itself got real relief** (`BadgeMedallion.tsx`): a bevelled rim
lit from the top-left, an inner wall that shades the field below it, a **raised
collar → recessed field → engraved motif** three-level terrace, and the motif drawn
in **three passes** (light lip up-left, cast shadow down-right, face on top) so an
icon reads as raised metal rather than a printed glyph.

**Hover to turn, click to inspect — on every screen.** `BadgeSeal` now opens its
own inspect stage, so the `/help` "how to earn each" list, the passport, community
cards and `/u/[code]` all became interactive without touching those files. Two
details: seals live **inside `<Link>` cards**, so the click is `preventDefault` +
`stopPropagation`'d (following the same lesson as FollowButton), and `/badges` lost
its wrapper `<button>` because that would have nested a button in a button.

### 2. Why "True 3D" had gone missing — and the fix

Root cause was structural, not a typo: `lazy()` + `<Suspense>` with **no error
boundary**. If the chunk fails to load or the component throws on mount, React tears
down the subtree and you get a blank stage with nothing explaining it. Added
**`SafeBoundary`** (which logs rather than swallowing) and used it everywhere heavy
optional code is loaded.

Then I removed the choice entirely, per the brief: **no Flat / True-3D switch.** The
inspect stage always attempts WebGL and silently degrades to the dimensional CSS
medal if a context can't be created (`onUnavailable`), so nothing there is ever flat.

**And the 3D badge now has the badge's actual shape.** It used to be a cylinder for
every badge, which meant a shield rendered as a disc — two different awards. I
refactored the silhouettes into a single `outline()` definition of line/quadratic
segments, and both consumers read it: `shapePath()` emits the SVG path (identical
coordinates, so the 2D art didn't move) and the new `shapePolygon()` flattens the
same curves into points that `ExtrudeGeometry` extrudes with a bevel. The struck art
is laid on the front face as a texture, so engraving and geometry agree. Also fixed
a latent bug in the texture path: an `xmlns` is now injected if serialization ever
drops it, because the failure mode was a *silently blank* texture.

### 3. Ask folded into Community

`/ask` as a separate page made the community look emptier than it was, and asking
about fit and browsing other people's fit are the same activity. The page became
**`components/AskSection.tsx`**, rendered inside `/community` as a `#questions`
section; `/ask` is now a **redirect** so shared links still land somewhere sensible;
threads keep their own URL at `/ask/[id]`; the nav tab is gone, and `Community`
lights up for `/ask/*` via a new `also` prefix list.

### 4. Moderation — report + takedown

- **`Report`** model, unique on `(kind, targetId, reporterKey)`, session-keyed so an
  unclaimed visitor who lands on something abusive can still flag it.
- **`hidden`** on `Post` / `Answer` / `Outfit`. Hidden content leaves every listing,
  the board **and badge stats** (taken-down work shouldn't earn prestige) — but stays
  **visible to its author with an explanation**, because content that silently
  evaporates is how people conclude a product is broken.
- **Auto-hide at 3 distinct reporters** (`lib/reports.ts`, 12 tests). I've written
  down honestly that this is abusable by three coordinated accounts; it's set low
  anyway because nobody is watching a queue yet, `hidden` is reversible, and the
  failure mode I care about more is abuse staying up for days.
- **"Not their photo / brand imagery"** is an explicit report reason — that's our
  specific legal exposure, not a generic one.
- **`scripts/moderate.mjs`** is the authoritative operator path (`reports` / `show` /
  `hide` / `unhide` / `delete`). A CLI you need database credentials for beats
  inventing an admin role and its auth surface.

### 5. Rate limiting moved to Upstash Redis

Per-process counters are *meaningless* on serverless: with N instances the real limit
is `limit × N`. `rateLimit()` is now async and uses Upstash's REST API over plain
`fetch` when `UPSTASH_REDIS_REST_URL` + `_TOKEN` are set, otherwise the in-memory
path (so local dev still needs no services). No SDK, deliberately — one HTTP call is
the whole protocol and a dependency could drag the pinned Node 18 toolchain forward.

The window index is **baked into the key** (`rl:<key>:<window>`), which makes it one
atomic `INCR` plus an idempotent `EXPIRE … NX` — no read-modify-write race between
instances, and no way for a later hit to stretch the window. On a Redis error it
falls back to in-memory and **says so in the log**, rather than either locking
everyone out or silently dropping all protection.

**Verified against a real Redis-shaped server**, not just by reading the code: I ran
a stub Upstash `/pipeline` on port 7391, pointed dev at it, and hammered
`/api/report` — the 21st request returned **429** with a limit of 20, exactly as
specified. Then I pointed it at a dead port and confirmed requests still succeed with
`[rateLimit] Redis unavailable` in the log.

**Other verification.** tsc clean, **115 tests** green (107 → 115), clean production
build, 11 pages + 6 APIs 200 in production, `/ask` → 307. Reporting smoke with four
sessions: self-report 400, unknown reason 400, duplicate report deduped to 1,
third distinct reporter flipped `hidden` → the post vanished for outsiders (list
excluded it, thread 404) **while the author still saw it flagged**; then
`moderate.mjs unhide` restored it and `delete` removed it. Smoke data cleaned;
`0_init` regenerated (18 tables).

**Next up.** Ecosystem step 4 — run **one $100 contest manually** — plus a block
list and a real review queue before any public launch.

**Files touched**
```
app-web/src/components/BadgeCoin.tsx          (new — the one dimensional badge)
app-web/src/components/SafeBoundary.tsx       (new — no more blank lazy subtrees)
app-web/src/components/BadgeMedallion.tsx     (relief: bevel, terrace, embossed motif; outline()/shapePolygon())
app-web/src/components/BadgeInspect.tsx       (always 3D, CSS fallback, no toggle)
app-web/src/components/BadgeWebGL.tsx         (extrudes the real silhouette)
app-web/src/components/Badges.tsx             (flat removed; every seal inspectable)
app-web/src/app/badges/page.tsx               (no wrapper button / page-level modal)
app-web/src/components/AskSection.tsx         (moved from src/app/ask/page.tsx)
app-web/src/app/ask/page.tsx                  (now a redirect)
app-web/src/components/Nav.tsx                (Ask tab removed, `also` prefixes)
app-web/prisma/schema.prisma                  (Report + hidden on Post/Answer/Outfit)
app-web/src/lib/reports.ts, reports.test.ts   (new — 12 tests)
app-web/src/app/api/report/route.ts           (new)
app-web/src/components/ReportButton.tsx       (new)
app-web/scripts/moderate.mjs                  (new — operator takedown/restore)
app-web/src/lib/rateLimit.ts                  (Upstash REST + fallback, now async)
app-web/src/app/api/{posts,posts/[id],answers,outfits,leaderboard}/route.ts  (hidden filters, await rateLimit)
app-web/src/lib/badgeStats.ts                 (hidden content earns nothing)
app-web/.env.example, README.md, DEVLOG.md, docs/DEPLOYMENT.md, docs/design/community-ecosystem.md
```

---

## 2026-08-12 · Session 35 — Daily Top Outfits + Top Stylists (ecosystem step 3)

**Context:** step 3 in the sequencing list, described there as *"a leaderboard is
just a query; huge perceived liveness."* It is indeed just a query — the design
work was entirely in deciding **what** to count.

**Why a DAILY board beats a lifetime one.** Lifetime totals are a closed shop: the
top is occupied by whoever arrived first, and a newcomer can never appear, so they
stop looking. A board that resets at midnight means a look posted this morning can
top it tonight. So every number here is counted **inside a window** — never
all-time — and all-time likes are only ever a **tie-break**, which stops an old
favourite from camping at the top of today's board.

**`src/lib/leaderboard.ts`** (15 new tests) holds every decision:
- `windowStart()` uses **UTC** day boundaries, not the viewer's local midnight. A
  leaderboard has to be the *same* board for everyone or two people comparing ranks
  disagree. `week` is a **rolling** 7 UTC days including today, not an ISO calendar
  week — a rolling window keeps the board alive on a Monday morning.
- `STYLIST_WEIGHTS = { like: 1, helpful: 3 }`. A helpful vote on an answer outweighs
  a like on a look because it **costs the voter more thought** — somebody read a
  paragraph and decided it was useful. Verified live: an answerer with 1 like + 1
  helpful (score 4) outranks a poster with 2 likes (score 2).
- **Follower count is deliberately not an input.** Status here is what you did in
  the window, not an audience accumulated once.
- Zero-score members are dropped — appearing on a leaderboard with a score of 0 is
  worse than not appearing at all.
- Ties break deterministically (helpful, then username), because a board that
  reorders itself on refresh reads as broken.

**`/api/leaderboard?window=today|week`.** Counts likes and helpful votes cast
inside the window, attributing each to the *author* of the look/answer. That
attribution is why it tallies in JS instead of `groupBy`: the outfit's author isn't
a scalar on `OutfitLike`. Volumes are tiny now; the comment records that this
becomes a cached daily rollup if the feed grows (the doc's `Leaderboard` sketch —
derived, never stored as truth). Deactivated members are filtered at the query
level on both boards.

**Who may appear:** claimed, non-deactivated members — *not* gated on
`listedInCommunity`. That flag governs the public **closet directory**, whereas
posting a look or an answer is already a public act shown in the feed. The board
exposes nothing a feed row doesn't.

**UI — `components/TodayBoard.tsx`**, a two-card band at the **top** of
`/community`, above everything static, because it's the "what's happening right
now" hook. Top looks show the mannequin thumbnail, author and likes-in-window; top
stylists show **the make-up of the score** ("2 likes · 1 helpful answer"), not just
the number — same "explain the number" rule the fit engine follows. Rank 1–3 wear
gold/silver/bronze numerals drawn from the badge `PALETTE`, so the board speaks the
same metal language as the passport card. Both empty states point at the next
useful action rather than saying "nothing here", and the header obeys last
session's rule: fixed heading, fixed tab labels, no reflow on switch.

**What didn't work — a build failure with nothing to do with the code.**
`next build` failed twice on `next/font` — *"Failed to fetch Fraunces from Google
Fonts"* — while `curl` to the same URL returned 200 in 0.4s. The stack gave it
away: `connect ETIMEDOUT 2607:f8b0:400e:c1e::5f:443`, an **IPv6** address. Node was
preferring IPv6 where this network has no working route; curl had used IPv4.
`NODE_OPTIONS=--dns-result-order=ipv4first npm run build` built clean immediately.
Worth knowing that our production build depends on Google Fonts being reachable at
build time — **self-hosting the two fonts via `next/font/local` would remove that
dependency entirely**, and both Fraunces and Inter are OFL-licensed so we may
redistribute them. Left as a deliberate follow-up rather than smuggling a font
migration into a leaderboard commit.

**Verified.** tsc clean, **107 tests** green (92 → 107), clean production build,
all 12 pages + 5 APIs 200. Live smoke with three cookie jars: likes and a helpful
vote produced the expected board, `?window=week` widened it, `?window=decade` fell
back to today, and **deactivating a member removed both their look and their
helpful votes from the board in one step**. Smoke accounts deleted afterwards.

**Next up.** Step 4 is deliberately **not** code: run **one $100 contest manually**
and see whether anyone enters, before building any event tooling. Still open before
real users: report/flag on posts, and swapping the in-memory rate limiter for
Upstash Redis.

**Files touched**
```
app-web/src/lib/leaderboard.ts, leaderboard.test.ts   (new — windows + weights, 15 tests)
app-web/src/app/api/leaderboard/route.ts              (new)
app-web/src/components/TodayBoard.tsx                 (new)
app-web/src/app/community/page.tsx                    (board band + #looks anchor)
README.md, DEVLOG.md, docs/design/community-ecosystem.md
```

---

## 2026-08-12 · Session 34 — Ask & Answer with receipts (ecosystem step 2) + two UI fixes

**Context:** two bugs reported, then ecosystem step 2. Both bugs turned out to be
worth writing down for different reasons.

**Bug 1 — the feed's scope tabs "ran around" when switched.** Root cause was mine
from last session: the `<h2>` next to the tabs changed text with the scope
("Latest looks" ↔ "From people you follow"), so the tabs got pushed sideways by a
different-width sibling. The tab label also carried the follow count
(`Following · 3`), which resizes the control as you use it. Fix: **nothing in that
header may change width with state** — fixed heading, fixed tab labels, and the
scope is now explained by a caption line that always renders one line ("Most-liked
first…" / "Newest first, from the people you follow."), so there's no reflow at all.

**Bug 2 — "public closets 打不开, stuck loading."** Not a code bug: a **leftover
`next start` process from the previous session's production smoke test was still
holding port 3000**, my `pkill -f "next start"` hadn't matched it, and its `.next`
had since been clobbered by a dev build. It served a 500 for `/api/view/[code]` and
an HTML shell that never hydrated — which looks exactly like "loading forever".
Killing every Next process and starting one clean dev server fixed it. Lesson
logged: **when a page hangs on Loading, check what's actually listening on 3000
before reading any code.**

### Ecosystem step 2 — Ask & Answer

**The bet.** An answer that says "size up" is an opinion. An answer that says "size
up — here's the same brand in my closet, size M, rated 5/5, on an athletic build"
is **evidence**. Every design decision here serves that one difference, because
it's the thing a generic fashion forum structurally cannot do.

**Data model.** `Post` (kind `HELP|RECOMMEND|VERDICT`, title, body, optional
`knownGoodId` + `productUrl`, `resolvedAnswerId`), `Answer` (body, optional
`knownGoodId`), `AnswerVote` (`@@unique([answerId, voterKey])`). Attachments are
loose ids rather than relations, matching `OutfitItem.knownGoodId`: if the garment
is deleted the attachment just resolves to nothing.

**`src/lib/evidence.ts` is the privacy boundary.** One batched query returns
exactly brand · displayName · garment · gender · size · region · fit rating ·
colour · **the owner's coarse body type** — the same class of data
`/api/view/[code]` already exposes publicly. Precise cm are not in the table it
reads, let alone the response. Owners who deactivated are dropped, so an
attachment from a hidden account disappears everywhere at once.
`ownsClosetItem()` enforces that you may only attach **your own** garment —
otherwise "evidence" would be hearsay. Verified live: 400.

**`src/lib/posts.ts` holds the two decisions worth testing** (10 new tests):
`parsePostKind` (rejects unknown kinds instead of guessing) and `rankAnswers` —
**accepted answer first**, then most-helpful, then **oldest first**, so whoever
showed up early isn't outranked by a late duplicate.

**API.** `GET/POST /api/posts` (list with `?kind=`, `?unanswered=1`, `?mine=1`;
create rate-limited 10/10min), `GET/PATCH/DELETE /api/posts/[id]` (PATCH = accept
an answer, asker only), `POST/DELETE /api/answers` (20/10min), `POST
/api/answers/vote`. Posting and answering need a **claimed** account; reading and
voting are open, so a first-time visitor can still say an answer helped.

**One real bug I caught in my own code before shipping:** `DELETE /api/answers`
originally cleared `Post.resolvedAnswerId` *before* checking ownership — so anyone
could un-accept someone else's answer just by asking to delete it. Reordered to
authorize first. Verified live: A deleting B's answer → 404 **and the acceptance
survives**; B deleting its own → post correctly returns to unresolved.

**Badges — a fourth track, "The Counsel."** Answering is the only contribution
that costs knowledge instead of money, and the only one that needs *other people*
to rate you, so it earns its own ladder: Sounding Board (3 answers) → Trusted
Voice (10 answers + 8 helpful) → Fit Oracle (30 + 40 helpful + 3 accepted) →
Community Pillar (80 + 150 + 12). New **quatrefoil** silhouette (the four-lobed
guild mark) in `BadgeMedallion`, plus four new motif engravings — thimble, tailor's
tape, guild mark, and the Roman **fibula**, which the file's own header had
referenced for sessions without ever using. **Polymath now requires gold in all
four tracks** (was three); its rule and the four gold badges share one
`goldTracksDone()` helper so they can't drift apart.

**UI.** `/ask` — hero that states the receipts promise, a composer that asks for
the *kind* first (each with its own example placeholder so a vague question is
harder to write), kind filters + a **"Needs an answer"** filter, and rows that show
whether a question is answered. `/ask/[id]` — the thread, `EvidenceCard`s for the
receipts, helpful votes, "Mark as the answer" for the asker only, self-voting not
even offered. `ClosetAttachPicker` is shared by both composers. Nav gained **Ask**,
and active-tab matching became `startsWith` so `/ask/[id]` keeps the tab lit.

**Verified.** tsc clean, **92 tests** green (77 → 92), clean production build, all
11 pages 200. Three-cookie-jar live smoke: post with own evidence ✓, anonymous
post 403, unknown kind 400, borrowed evidence 400, short title 400, answer with
evidence ✓, anonymous answer 403, self-vote 400, duplicate vote deduped to 1,
non-asker accept 403, asker accept ✓, `unanswered` filter correctly excludes an
answered post, badge progress reads `1/3 answers`, and **deactivating the asker
removed the question from the list and 404'd the thread**. Smoke accounts deleted
from the dev DB afterwards; `0_init` Postgres migration regenerated (17 tables).

**Next up.** Step 3 = **Daily Top Outfits** (a leaderboard is just a query, big
perceived liveness), then **one manually-run $100 contest** to validate demand
before building any event tooling. Before real users: report/flag on posts, and
the in-memory rate limiter → Upstash Redis.

**Files touched**
```
app-web/prisma/schema.prisma                  (Post, Answer, AnswerVote)
app-web/prisma/migrations/0_init/migration.sql (regenerated)
app-web/src/lib/posts.ts, posts.test.ts       (new — kinds + rankAnswers, 10 tests)
app-web/src/lib/evidence.ts                   (new — attachment loader + privacy boundary)
app-web/src/lib/timeAgo.ts                    (new)
app-web/src/lib/badges.ts, badges.test.ts     (Counsel track, quatrefoil, Polymath ×4)
app-web/src/lib/badgeStats.ts                 (answersGiven / answerHelpful / answersAccepted)
app-web/src/components/BadgeMedallion.tsx     (quatrefoil + 4 motifs)
app-web/src/components/Evidence.tsx           (new — EvidenceCard, ClosetAttachPicker)
app-web/src/app/api/posts/route.ts            (new)
app-web/src/app/api/posts/[id]/route.ts       (new)
app-web/src/app/api/answers/route.ts          (new)
app-web/src/app/api/answers/vote/route.ts     (new)
app-web/src/app/ask/page.tsx                  (new)
app-web/src/app/ask/[id]/page.tsx             (new)
app-web/src/components/Nav.tsx                (Ask + nested-route active state)
app-web/src/app/community/page.tsx            (no-reflow scope header, Ask link)
README.md, DEVLOG.md, docs/design/community-ecosystem.md
```

---

## 2026-08-12 · Session 33 — Follow + a followed feed (ecosystem step 1)

**Context:** the ecosystem outline written last session sequences the work
smallest-first, and step 1 is *"follow + a followed feed — cheapest change with
the biggest retention effect."* This session builds exactly that and nothing else.

**Why this first.** Everything else in the plan (Ask & Answer, Daily Top,
contests) assumes a way to care about a *particular person*. Without follows the
community is one global list where the reader has no stake. A follow is the
smallest possible object that turns browsing into subscribing.

**Data model — one new table.** `Follow { followerId, followeeId, createdAt }`,
`@@unique([followerId, followeeId])` so re-following is idempotent rather than
duplicated, `@@index([followeeId])` because "how many followers does X have" is
the hot query. Both sides must be **claimed**: a follow needs a durable identity,
and since an anonymous session is free to mint, allowing it would make follower
counts inflatable — which contradicts the earned-only prestige idea the whole
badge system rests on.

**Ordering is a product decision, so it got its own tested module.**
`src/lib/feed.ts` — two scopes with deliberately *different* orderings:
- `everyone` → **most-liked first** (a discovery surface; quality should float up
  for a first-time reader), with recency as the tie-break so equally-liked fresh
  posts aren't stranded.
- `following` → **newest first** (a subscription surface; ranking by likes would
  bury the people you explicitly chose behind whoever is popular).

Extracting this out of the route handler is what makes it testable — 9 new tests
(`feed.test.ts`), suite now **77 green**.

**API.**
- `GET /api/follow` → `{ claimed, accountCode, following: [codes], followingCount,
  followerCount }`. One call gives the UI every follow button's state; the
  `accountCode` is there so a profile page can hide its own button.
- `POST /api/follow { accountCode, follow }` → toggle. Guards: claim required
  (403 `claim-required`), no self-follow (400), unknown/unclaimed/deactivated
  target (404), rate-limited 60/min per IP (follow-spam is the classic growth
  hack). Follows are upserted, so double-clicks are harmless.
- `GET /api/outfits?scope=following` → restricted to followed authors, ordered by
  `rankFeed`. Deactivated followees are filtered at the query level.
- Follower counts added to `/api/community` (`_count.followers`) and
  `/api/view/[code]`. **Deliberate:** who-follows-whom is social metadata and says
  nothing about a body — the privacy invariant is untouched.

**UI.**
- `components/FollowButton.tsx` — shared toggle. Two non-obvious details: it
  lives **inside a `<Link>`** on the member card, so it must `preventDefault` +
  `stopPropagation` or following someone navigates away; and for unclaimed
  visitors it routes to `/account` instead of being a dead button — following is
  one of the few moments where creating an account is *obviously* worth it.
- `/community` — the feed gained an `Everyone | Following · N` segmented switch,
  a `N followers · N following` line for claimed members, follow buttons on
  member cards (stacked under the badge seals so nothing crowds), and **three
  distinct empty states**: not claimed → "A feed of your own" + claim CTA;
  claimed with zero follows → "follow a few closets below"; following people who
  haven't posted → say so. A dead end is a design bug.
- `OutfitCard` gained an optional `authorAction` slot, and the author's name is
  now a link to their closet — see a look → open the closet → follow. That's the
  loop, and it didn't exist before.
- `/u/[code]` — follower count + a full-size follow button, hidden on your own
  profile.

**What worked.** Two-cookie-jar live smoke: anon → 403, A follows B → 200 with
`followerCount: 1`, re-follow idempotent, self-follow 400, bogus code 404, A's
following feed shows exactly B's look, B's own following feed is empty,
unfollow → feed empty. Then the privacy path: **deactivating B removed it from
A's follow list AND A's feed AND 404'd the profile** in one step. Clean
production build, all 10 pages + the new API 200.

**What didn't (twice, same root cause).** `POST /api/follow` returned 500 with
`Unknown field 'followers' on UserCountOutputType` — the *running dev server* had
the Prisma Client from **before** `db:push` regenerated it. Restarting dev fixed
it with no code change. Filed alongside the stale-`.next` gotcha: **after a schema
change, restart the dev server, or every new-table query 500s while typecheck
stays green.**

**Next up.** Ecosystem step 2 = Ask & Answer with closet-item attachments (our
unique utility). Then Daily Top Outfits (just a query), then one **manual** $100
contest to validate demand before any event tooling. Still open before real
users: swap the in-memory rate limiter for Upstash Redis.

**Files touched**
```
app-web/prisma/schema.prisma                  (Follow model + User relations)
app-web/src/lib/feed.ts                       (new — scope + ranking)
app-web/src/lib/feed.test.ts                  (new — 9 tests)
app-web/src/app/api/follow/route.ts           (new — GET summary, POST toggle)
app-web/src/app/api/outfits/route.ts          (scope=following, rankFeed)
app-web/src/app/api/community/route.ts        (followerCount)
app-web/src/app/api/view/[code]/route.ts      (followerCount)
app-web/src/components/FollowButton.tsx       (new)
app-web/src/components/OutfitCard.tsx         (authorAction slot, author link)
app-web/src/app/community/page.tsx            (scope tabs, empty states, follows)
app-web/src/app/u/[code]/page.tsx             (follow button + follower count)
docs/design/community-ecosystem.md            (step 1 marked shipped)
README.md, DEVLOG.md
```

---

## 2026-08-12 · Session 32 — Community card layering fix + ecosystem design outline

**Context:** founder reported a bug on the Public closets grid ("背景在上,图表在下")
and asked to think through how to grow the community into a real **ecosystem** —
help/recommendation posts, OOTD, budget styling contests ($100/$1,000/$10,000),
daily top outfits, top stylists — but **explicitly not to build it yet**, just to
capture the outline.

**Fixed — the layering bug.** In `community/page.tsx`'s `MemberCard`, the metal
banner is `position: relative` while the details row below it overlaps upward with
`-mt-7`. **Positioned siblings paint above STATIC ones regardless of DOM order**,
so the banner's `MetalSurface` layers were covering the avatar and badges. Fix:
the details row is now `relative z-10`. Checked `/u/[code]` — it doesn't use this
pattern, so the bug was isolated to the community grid.

**Written — `docs/design/community-ecosystem.md`** (planned, not built):
- **The premise:** a size engine gets people in the door but isn't a reason to
  return — once you know your size in a brand, you're done. Retention must come
  from ecosystem.
- **Two unfair advantages we already hold:** verified **fit context** (every member
  has a real closet, so "this looks good" becomes "this fits a body like mine, in
  this size, from this brand") and **earned-only prestige** (badges/metal card come
  from real data, so status is scarce and unpurchasable).
- **Three loops:** *Ask & Answer* (HELP/RECOMMEND/VERDICT posts whose answers can
  **attach a real closet item** as evidence) · *Show & Be Seen* (OOTD, **Daily Top
  Outfits** that reset so newcomers can win, **Top Stylists** ranked by earned
  signals, plus the missing primitive — **follow + a followed feed**) · *Compete &
  Belong* (**budget contests**: $100 weekly Thrift Run, $1,000 monthly Signature
  Look as the flagship, $10,000 seasonal Atelier; itemised-price submissions →
  voting → **commemorative badge**, which is exactly what the special metals
  amber/jade/amethyst were reserved for).
- **Defensibility:** fit-matched discovery ("people shaped like me" — doable
  without exposing measurements, since coarse body type is already public-safe),
  provenance on every look (buyable *and* wearable), earned-only status, and
  crowd fit-knowledge feeding back into the engine — the real moat.
- **Data-model sketch** (Post/Answer/Vote/Follow/Event/EventEntry/Leaderboard)
  reusing the existing `OutfitLike` voter-key pattern, `badges.ts`, `rateLimit.ts`.
- **Moderation is not an afterthought:** opt-in only, never loosen the privacy
  invariant, and report/flag + posting limits + block list + photo takedown before
  any launch.
- **Sequencing, smallest first:** follow-feed → Ask&Answer → Daily Top (just a
  query) → **run ONE $100 contest manually to validate demand** → only then build
  event tooling → fit-matched filtering once there's member density.

**Verified:** `tsc` clean · 68/68 vitest green · `next build` clean · `/community`
200 with the fix in place.

**Next:** founder returns to deployment later (Neon/Vercel account steps are
theirs); ecosystem build starts with the follow-feed when he gives the word.

---

## 2026-08-12 · Session 31 — Docs sync + deployment prep (Vercel + Neon Postgres)

**Context:** founder asked to sync the GitHub-facing docs (README etc.) and to
look at deploying — SQLite → Postgres on Vercel + Neon, with env vars.

**Docs:**
- **README rewritten** (was 46 stale lines): what the app actually does now, an
  architecture map, the **privacy invariant**, the no-brand-imagery rule, the key
  design decisions a contributor must know (engine isn't an LLM; `category` vs
  `Collection`; `authEdge` byte-compatibility; graceful degradation), current
  scripts, and a deployment pointer.
- **`docs/DEPLOYMENT.md`** — a real runbook: how the two databases coexist, Neon
  setup (use the **pooled** host), Vercel setup (root dir `app-web`, build command
  `npm run vercel-build`), required vs optional env-var tables, how to author
  future migrations, a verification walkthrough that ends on the privacy check,
  **honest known limitations**, and costs (~$0 at demo scale).
- `.env.example` now documents the local-SQLite vs production-Postgres split.

**Postgres without breaking local dev:**
- Established empirically that **Prisma rejects `env()` for `datasource.provider`**
  (validation error), so one schema can't serve both engines. Rather than
  hand-maintain two schemas, **`scripts/gen-postgres-schema.mjs` derives**
  `prisma/schema.postgres.prisma` from the single source schema (every model uses
  portable scalars). Generated file is gitignored; the generator **refuses to run**
  if the source stops being SQLite. Local `npm run dev` is completely unchanged.
- **Committed `prisma/migrations/0_init`** (337 lines of Postgres DDL), produced
  offline with `prisma migrate diff --from-empty`, so `prisma migrate deploy`
  works against Neon without ever needing a live DB locally.
- New scripts: `typecheck`, `db:push`, `db:pg:schema|generate|migrate`,
  `vercel-build` (generate → migrate deploy → next build), `postinstall`.

**Production hardening + two bugs my own changes caused (both caught by testing):**
- `SESSION_SECRET` is now **required in production** — with the dev fallback,
  anyone could forge a session cookie and read/write any account.
- **Bug 1 (mine):** the first guard threw at *module load*, which broke
  `next build` — the build runs with `NODE_ENV=production` but needs no secret.
  Fixed by resolving the secret **per call**. Verified both ways: no secret →
  `500` and **no cookie is minted**; with a secret → cookie signed, APIs 200.
  `auth.ts` and `authEdge.ts` kept identical so Node/Edge cookies cross-verify.
- **Bug 2 (environmental):** a production smoke test showed every page 404 while
  APIs worked. Root cause was **clobbered `.next` artifacts** (a dev server had
  overwritten the production build), not a code regression — a clean rebuild
  serves all 8 pages 200 under `next start`. Worth remembering: never trust a
  production smoke test taken after `npm run dev` has touched `.next`.
- Confirmed `prisma generate` tolerates a Postgres `DATABASE_URL` against the
  SQLite schema (exit 0), so `postinstall` can't break the Vercel build.

**Verified:** `tsc` clean · 68/68 vitest green · `next build` clean · production
`next start` serves home/check/passport/closet/badges/community/help/outfits +
`/api/status` all 200 · local dev restored and serving.

**Next:** the founder performs the actual Neon + Vercel account steps (I can't
provision those); then swap the rate limiter to Upstash Redis before real users.
Business deliverables (interviews, the opportunity deck, BMC/VPC) remain.

---

## 2026-08-12 · Session 30 — Card system (tilt/export/finish choice/banners), badge silhouettes + true 3D, converging layers, live converter

**Context:** founder approved the whole backlog and added: card glint should be
less obvious / a bit faster / less frequent; the card itself should turn in 3D on
hover; the card should be **exportable**; in community it becomes the user's
**banner**, so colour follows the person — and the user picks that colour **only
from metals they own**. Plus: make badges rival dedicated badge-design tools;
push the aesthetic further (oversized type, elements that overlap as you move).

**Built — the card system:**
- Extracted `components/MetalCard.tsx` (`CARD_THEMES` / `MetalSurface` /
  `MetalCard` / `CardField` / `resolveTheme`) so passport and community share one
  surface.
- **Glint retuned**: new `glint` keyframe crosses fast then waits (11s cycle,
  ~14% duty) at lower opacity — a passing reflection, not a running animation.
- **3D tilt** on pointer, deliberately limited (±7°/±9°) so text stays legible,
  with a pointer-tracked soft highlight.
- **`User.cardMetal`**: pick your finish, validated server-side to a metal you
  actually earned (`/api/profile/prefs`); `/api/status` returns `cardMetal` +
  `earnedMetals`; `CardMetalPicker` greys locked metals so the ladder stays
  aspirational. New `earnedMetals()` helper.
- **Export** (`lib/cardExport.ts`): re-draws the card as a standalone 1600×1000
  SVG then rasterises via canvas → PNG download. No html2canvas, exact gradients,
  crisp at any scale, and only code-public fields are drawn (never measurements).
- **Community rows are member cards** with a metal **banner** in that member's
  finish (API now returns `cardMetal`, falling back to their highest metal), with
  the avatar overlapping the banner edge.

**Built — badges:**
- **Silhouettes per track** (`BadgeDef.shape`), the way dedicated badge designers
  frame a rank: **shield** = The Wardrobe, **seal** = The Fit Record, **hexagon**
  = The Atelier, **rosette** = Rare Honors. `BadgeMedallion` draws the silhouette
  plus an inset engraved copy; fluting now only on round seals.
- **True 3D** (`BadgeWebGL`): a real three.js coin — cylinder rim + textured
  faces, physical metal material, procedural studio environment so rotation
  produces genuine specular travel; drag to turn, idle drift, graceful fallback.
  `BadgeInspect` gained a **Flat / True 3D** switch and the heavy path sits behind
  `React.lazy`, so `/badges` first load stays ~106kB. The face texture is the
  medallion SVG serialized from a hidden node.

**Built — aesthetics:**
- **`ConvergingStack`**: an oversized 26vw word behind three cards that start
  spread apart and **slide together into one stack as you scroll** (scroll-linked
  x/rotate; reduced motion keeps them laid out). Closing CTA type up to 8.5rem.
- **`LiveConverter` on /check**: choose tops/bottoms/shoes, type the size you
  wear, and every regional equivalent updates live from `lib/sizeConvert`
  (auto-detects + highlights the source scale, dashes until it parses, inline
  "indicative only" disclaimer) — the faers pattern, so the page is useful before
  you have a link.
- **Serif headings everywhere**: all 13 remaining `text-3xl font-bold` page h1s
  are now `font-serif text-4xl`.

**Verified:** `tsc` clean · 63/63 vitest green · `next build` clean (three.js
stays out of the initial bundle) · live: all 13 pages 200; converter + converging
section render.

**Next:** founder's finer card details; more badge motifs if wanted; deployment
(SQLite→Postgres); business deliverables.

---

## 2026-08-12 · Session 29 — Metal charge-card passport, 6-metal badge ladder, CS2-style inspect, first logo

**Context:** founder feedback: badge light too strong + motion too fast, and the
3D should apply everywhere; /check hero was visually off-centre; the passport
should be **one slab like an Amex metal card** (metallic, minimal, "flex"
worthy), coloured by the holder's **highest badge metal** (lapis cobalt default),
with the body-type figure removed; badges should be **much harder** and follow a
metal ladder (bronze→silver→gold→platinum→diamond→obsidian) with **special**
colours (amethyst / jade / amber) for unusual feats and **agate-style white
veining** from diamond up. Also: design a logo, and inspect badges the way CS2
lets you inspect a weapon skin.

**Built:**
- **Metal card passport.** `MetalCard` renders one slab: deep metal gradient,
  brushed micro-grain, broad diagonal sheen, slow travelling glint, inset hairline
  bevel. `CARD_THEMES` maps every metal to a card edition (Lapis / Bronze / …
  Obsidian) and the card takes the theme of `highestMetal(earnedBadges)`; top
  metals add agate striations. Layout is card-like: wordmark + Issued, portrait +
  holder, a 3-up detail row, verification + logo. Body-type figure removed from
  the card (now plain text below); all other details moved into panels **below**
  the card so the slab stays clean.
- **Badge ladder, harder.** `Metal` extended to bronze/silver/gold/**platinum**/
  diamond/obsidian + specials **amethyst/jade/amber**; added exported `METAL_RANK`
  (deduped an older local copy), `VEINED_METALS`, `highestMetal()`. Added a 4th
  **platinum** tier to every track (Grand Wardrobe 100 items/20 brands/6
  collections · Fit Scholar 60 refreshes+20 outcomes · Atelier Master 30 posts+500
  likes) and a **Polymath** (jade) special for gold in all three tracks. Every
  threshold raised (e.g. starter 5→8, curator 12/3→20/4, archivist 25/6→45/10,
  stylist 3→6, couturier 8/50→15/150); capstones retiered — acclaimed 100→250
  (diamond), tastemaker 500→1500 (amethyst), head-designer 1000→4000 (obsidian).
  Medallion art gained **agate white veining** for the top metals; fixed a stray
  non-ASCII character hiding in the gold hex (`"#e6ب23d".replace(...)`).
  Tests updated + a new platinum-threshold test (63 total).
- **CS2-style `BadgeInspect`.** Click a medallion → it lifts onto a dark stage:
  drag to turn in 3D, **real thickness** via stacked rim slices, an engraved back
  face with the metal name, a restrained raking light that tracks rotation, slow
  idle drift, and an info panel (title/tier/blurb/lore/progress). CSS 3D, not
  WebGL — the art is already crisp SVG, so we get depth with no shaders and no
  load wait.
- **Softer badge lighting** — `Badge3D` now uses one soft-light sheen (was a bright
  screen hot-spot + a hard glint streak) and slower, weightier tilt; applied to
  **every** badge via `BadgeSeal` (opt out with `flat`).
- **First logo** (`components/Logo.tsx`): a passport arch wrapping an F/P monogram
  over a measurement baseline; SVG + `currentColor`, so it works in ink, on metal,
  or in any badge colour. Wired into the Nav and the card's logo slot.
- **/check** hero centred; **/help** stopped duplicating earn rules (drives text
  from each badge's `blurb`, single source of truth).

**Verified:** `tsc` clean · 63/63 vitest green · `next build` clean · live: home,
passport, check, closet, help, outfits, community, badges all 200; new badges +
Platinum/Amethyst render on /help; logo present in the nav.

**Next:** founder will specify the card's finer details; optional true-WebGL badge
(Three.js) if CSS depth isn't enough; faers-style live calculator on /check.

---

## 2026-08-12 · Session 28 — Cohesion fixes (passport + check) + interactive 3D badges

**Context:** the dark-glass passport (Sess 27) broke cohesion — low-contrast
text (unreadable), a banner that differed from the body and from every other
(light) page, lost metallic sheen, a "Passed 2026" seal that doesn't fit
"filled out a passport," and a QR motif. Also home's check field ≠ the /check
page. Founder wants ONE unified style, and better/3D-interactive badges.

**Fixed:**
- **Passport back to the cohesive LIGHT system** (matches every other page):
  white card on `bg-paper`, high-contrast ink text (readable). Restored a
  **designed metallic banner** — cobalt→ink gradient with a static diagonal
  sheen + a slow moving light streak (`animate-[shimmer_6s]`) for a brushed-metal
  look. Seal word "Passed" → **"Issued"** (and the status pill → "Issued"); the
  **QR motif → a blank `LogoPlaceholder`** reserved for our future logo. Removed
  the dark `.glass-panel`/`CredLine`/`QRMotif` treatment; reused the readable
  `Line` component.
- **/check unified with the homepage**: eyebrow + serif headline, the same pill
  URL field + ink CTA family, hairline demo pills (was a plain bold h1 + boxy
  input with red focus). Dropped the now-unused `Button` import.
- **Interactive 3D badges**: new `Badge3D` wrapper (pure CSS 3D, no libs) —
  cursor-tracked `rotateX/Y` tilt + a moving gloss so a medallion can be "turned"
  and viewed like a struck coin; reverts smoothly on leave. Applied on the
  /badges trophy case; also cleaned that page's stray gray tokens to `paper/line`.
  (Adopted the referenced badge-tooling ideas — SVG medallion + CSS ring/gloss —
  rather than raster AI art; keeps it crisp, fast, on-palette.)

**Verified:** `tsc` clean · 62/62 vitest green · `next build` clean · live:
home/check/passport/closet/badges/outfits/community all 200; /check serves the
new serif hero.

**Next:** design an actual logo for the placeholder; optional faers-style live
calculator on /check; carry serif headings into remaining page headers.

---

## 2026-08-12 · Session 27 — Lighter homepage scroll + glass "credential" passport

**Context:** founder feedback on the fashion-scroll homepage — the pinned
"Why it works" horizontal section scroll-jacked (you had to scroll the whole
block to reach the last card; felt heavy/sticky). Also shared open-source
credential/badge references (Certo/Open Badges 3.0, OpenCred/W3C-VC Apple-Wallet
cards, GitHub Learn geometric badges) + a glassmorphic "cyber passport + collectable
badge wall" HTML template, to adopt. Chose (via options) the **cobalt-black luxe
glass** skin (not the template's neon-purple, which reads dev-portfolio not fashion).
Also noted faers.tech's clean live-calculator pattern for a future /check pass.

**Built:**
- **Homepage horizontal section reworked** to be **user-driven** (no scroll-jack):
  a drag-to-scroll row (pointer capture) + swipe + trackpad + prev/next arrows,
  proximity snap, hidden scrollbar, `data-lenis-prevent`, and a drag-vs-click
  guard. Removed the pinned `useScroll`→`x` mechanic. Tuned Lenis `duration:1.1`
  → `lerp:0.1` (snappier, less "sticky").
- **Passport VIEW rebuilt as a glass credential** (`ViewBook`): dark `bg-ink`
  band with ambient cobalt glow; a **holo foil edge** (cobalt→sky gradient 1px
  border) over a **dark frosted `.glass-panel`**; header wordmark + pulsing
  "Verified" pill; portrait in a cobalt ring; identity rows (`CredLine`, mono
  IDs); achievements (hover-meaning medallions); signature look (dark select +
  mannequin); body-type figure; and a footer with a **rotating dashed seal**
  (the user's top medallion, `animate-[spin_20s]`), the MRZ verification string
  (mono), and a decorative **QR motif**. All in the black/cobalt/porcelain system.
  Edit mode unchanged. Added `.glass-panel` to globals; `.no-scrollbar` util.

**Verified:** `tsc` clean · 62/62 vitest green · `next build` clean · live:
home + passport/closet/badges 200 (credential renders in VIEW mode once the
passport has content; markup validated by build).

**Next (optional):** apply the collectable-wall polish to the /badges page;
faers-style live calculator on /check; real product imagery in the lookbook.

---

## 2026-08-12 · Session 26 — Fashion-scrolling homepage (Lenis + Framer Motion)

**Context:** founder wants the homepage to be a "fashion scrolling design" —
parallax depth, sticky product-pinning, horizontal-scroll lookbook, scroll-driven
reveals — borrowing the immersive magazine feel but WITHOUT the impractical
load-wait/heavy intros. Asked for a complete first version to review.

**Built (`src/app/page.tsx`, full rebuild):** added deps **framer-motion@11** +
**lenis@1**. Homepage is now a scrolling narrative:
- **Lenis smooth inertia scroll**, homepage-only (init/destroy in a `useEffect`,
  scoped so other pages stay native) and **disabled under `prefers-reduced-motion`**.
- **Hero** (black band): the bold serif statement, now with a subtle scroll
  **parallax** (content drifts up + fades via `useScroll`/`useTransform`) + an
  animated scroll cue.
- **Sticky "how it works"**: a `sticky` pinned text column while three editorial
  step panels glide past and reveal (`whileInView`) — the sticky-pinning pattern.
- **Horizontal-scroll showcase**: a tall pinned section where vertical scroll
  translates a row of 5 lookbook cards **sideways** (measured distance →
  `useTransform` x). Cards use safe editorial visuals (color fields, the SVG
  `OutfitMannequin`, type) — no scraped/brand imagery. Reduced-motion falls back
  to a normal swipeable row.
- **Parallax statement**: layered depth — a giant faint "FIT" background word
  moves slower than the foreground serif statement.
- **Closing CTA** + the preserved **value-first content** (URL form in hero,
  returning-user dashboard / new-user guide) so nothing functional was lost.

**Practicality kept:** no loader, no WebGL, one light dep set; all motion degrades
gracefully. Legal: only type/color/our-own-SVG visuals — no brand images/video.

**Verified:** `tsc` clean · 62/62 vitest green · `next build` clean (home 152kB
first-load, framer-motion cost — acceptable for a marketing page) · live: home
serves all sections; closet/passport/check still 200 (Lenis scoped to home).

**Next:** optional real product photography/video into the lookbook frames;
carry the system into inner pages; consider Spline 3D garment later (opt-in).

---

## 2026-08-12 · Session 25 — Black-led + cobalt palette (research-grounded), bold black hero

**Context:** founder shared two awwwards refs (K95 — cobalt WebGL portfolio;
NOTHIN' — giant black grotesk) — loves the *first-impression impact* but finds
them impractical (heavy animation, load-wait). Directive: borrow the "眼前一亮"
moment, not the heavy motion; main color = high-end black + lighter tones; and
research color/typography psychology first. Grounding (Wikipedia color-psychology
synthesis, since Vogue blocked fetch): **black is the strongest evidence-backed
premium cue** (expensive/high-quality/authority/sophistication); **blue/violet
reinforce sophistication**; **saturation drives excitement** (use a strong accent
sparingly); ~62–90% of a snap product judgment is color; no universal color
(context-dependent). Fashion palette theory: true neutrals base → staples (navy/
beige/olive) → accents (red/cobalt/butter). Founder picked **cobalt** as the rare
accent (via previewed options).

**Built:**
- **Palette re-grounded** (`tailwind.config.ts`): retired warm-ivory/red for a
  cool **black-led + porcelain** system. Repointed the `brand` token to **cobalt
  `#2438d6`** (dark/light/tint) so *every* `text-brand`/`bg-brand` across the app
  flips to cobalt in ONE place. `paper` → cool porcelain (`#F3F3F1`), `ink` → cool
  near-black (`#17181c`), `line` cooled. `globals.css` roots + `ConfidenceRing`'s
  hardcoded `#A6192E` updated to cobalt.
- **Dual-surface principle:** black = statement (hero/brand), porcelain = the
  working surface you read/use (closet, passport…). Keeps impact AND usability.
- **Landing hero rebuilt black-led** (`page.tsx`): full-width `bg-ink` band, huge
  serif headline (text-6xl→8xl, `leading-[0.95]`), the accent word in cobalt
  italic, a glassy translucent URL field with a **cobalt CTA**, one clean staggered
  `rise` entrance — no loader, no wait. Guided content sits on porcelain below.

**Deliberately NOT done (practicality):** no WebGL/3D, no intro loader, no heavy
motion — impact is scale + contrast + one accent. Framer Motion / Lenis noted as
optional future polish; open-source refs given (GSAP now free, Three/R3F, Lenis,
SplitType, Fontshare, Codrops).

**Verified:** `tsc` clean · 62/62 vitest green · `next build` clean · live:
home + passport/closet/check/outfits/community/badges all 200; hero serves the
black `bg-ink` band + cobalt accent.

**Next:** carry cobalt/black/porcelain deeper per page; consider Framer Motion +
Lenis for tasteful fast motion; then real product-photography treatment.

---

## 2026-08-12 · Session 24 — Editorial design system (foundation pass): fashion-magazine aesthetic

**Context:** the founder wants a cross-cutting visual upgrade — "fashionable,
high-end, minimal, tasteful" for an audience of fashion-minded users, bloggers,
and taste-sharers; no text-heavy landing. Also cleared up a tech misconception
(AWS = hosting, Node = runtime; neither determines how a site *looks* — that's
CSS/typography/motion). Chosen direction (via a previewed options prompt):
**Editorial / fashion-magazine** — warm ivory paper, a characterful serif
display, hairline rules, generous whitespace.

**Built (foundation + landing, first pass):**
- **Design tokens** (`tailwind.config.ts`): `paper` ivory canvas (#F7F3EC + soft/
  dim), warm near-black `ink` (#201c18) + warm grays, `line` hairline color,
  `letterSpacing.editorial`, `boxShadow` warmed, new `rise` reveal animation.
  `fontFamily.serif`/`sans` via CSS vars.
- **Fonts** (`layout.tsx`): pair **Fraunces** (editorial serif display, `--font-serif`)
  with **Inter** (`--font-sans`); body defaults to sans on the `bg-paper` canvas.
  `globals.css`: paper/ink root vars, `optimizeLegibility`, `.eyebrow` small-caps
  label helper, serif tracking.
- **Landing hero** (`page.tsx`): rebuilt editorial — an eyebrow line, a large
  serif headline ("Know what fits, / *anywhere.*"), one supporting sentence, a
  refined pill URL field with an ink CTA, staggered `rise` entrance, and a
  hairline divider. Step numbers + section headings now serif.
- **Shared UI** (`ui.tsx`): primary button → **ink/black** (couture) with `paper`
  text (brand red demoted to a rare accent); secondary/ghost + inputs use the
  `line` hairline + `paper-soft` fills. `Card` ring → `line`.
- **Nav**: serif italic wordmark, underline-on-active links (no more red pills),
  ink pill for "Claim account", `bg-paper` bar.
- **Canvas cohesion**: swapped the full-page gray canvases (passport ×2, refresh
  ×2) to `bg-paper` so the whole site reads as one ivory surface. Small gray
  insets/chips left as subtle accents.

**Verified:** `tsc` clean · 62/62 vitest green · `next build` clean (Fraunces+Inter
fetched) · live: home/passport/closet/refresh 200; landing serves the new serif
hero markup.

**Next (rollout):** carry the editorial system deeper into each page (closet,
check, passport card, outfits, community, badges) — headings to serif, spacing/
imagery to magazine rhythm; consider Framer Motion/GSAP for richer reveals; then
a real product-photography treatment. Also still pending: drag-DnD reorder,
deployment, business deliverables.

---

## 2026-08-12 · Session 23 — Folder polish: custom colors, in-file inline edit + edit history, reorder mode, signature look

**Context:** founder review of the Session-22 folder view produced a batch of
fixes. (1) Folders should have a *user-chosen color*, settable at creation and
changeable later. (2) Clicking into a file gave no way to edit — edit should
happen right in the file. (3) The detail should show created / last-modified /
full edit-history times, where a "formal" edit is only counted once the user
stops editing for a while (rapid edits coalesce). (4) Community's toggle should
just say "Unlist". (5) Passport should optionally feature a *signature outfit*.
(6) The closet Refresh control needs a tooltip explaining what it does. (7)
Reorder was always-on and cluttered — folders AND items should reorder only
behind a single toggle.

**Built:**
- **Folder colors.** `Collection.color` (nullable key). `FOLDER_COLORS` map
  (8 named sleeves) + `FolderColorPicker` swatch row. Chosen at creation ("Folder
  color" field) and editable later via a swatch button in each folder header
  (grid view; Uncategorized excluded). `folderColorFor(color, seed)` falls back
  to the position-based auto color when none is picked. `/api/collections`
  POST/PATCH accept `color`.
- **In-file inline edit + timestamps.** `KnownGoodItem.editHistory` (JSON array
  of ISO timestamps). Closet PATCH now fetches the row, checks whether a tracked
  *content* field actually changed (reorder/move excluded), and **coalesces**:
  edits within a 30-min window advance the last history entry, longer gaps append
  a new one — so bursts count as one formal edit. `DetailSheet` now edits inline
  (renders the existing `EditRow` right inside the sheet, no bounce to the list)
  and shows a History block: Created · Last modified · expandable list of recorded
  edits. Verified via API: two rapid edits → 1 entry; a sortIndex-only PATCH adds
  none.
- **Reorder mode.** One `⇅ Reorder` toggle in the toolbar. OFF = clean (no
  arrows). ON = folder ▲▼ arrows in each collection header (swap sortIndex with
  neighbor via two collection PATCHes) + item ▲▼ arrows in the list, plus a hint
  banner. Item reorder arrows are now gated behind this instead of always showing.
- **Signature look on the passport.** `User.signatureOutfitId`; `/api/profile/prefs`
  accepts it (validated to be one of the user's own outfits); `/api/status`
  returns it. Passport VIEW gained a "Signature look" section: a dropdown of your
  outfits + an `OutfitMannequin` render of the chosen look (title/occasion/pieces/
  likes). Falls back to a compose-an-outfit link when you have none.
- **Community unlist** button label simplified from "Listed ✓ · Unlist" → "Unlist".
- **Refresh tooltip.** Both the per-folder and top "Refresh fit" controls now
  carry a title explaining it re-rates how pieces fit right now.

**Verified:** `tsc --noEmit` clean · 62/62 vitest green · `next build` clean ·
live: closet/passport/community/outfits/badges 200; collection color create +
PATCH, edit-history coalescing, and reorder-exclusion all confirmed via API.

**Next:** true drag-and-drop reorder (arrows shipped); global aesthetic pass;
deployment (SQLite→Postgres); business deliverables.

---

## 2026-08-12 · Session 22 — Full-path URL extraction, real filing-cabinet folder view, passport badge tooltips

**Context:** three founder asks. (1) The URL auto-fill was weak — the example
`patagonia.com/product/womens-fitz-roy-down-hoody/85506.html?dwvar_85506_color=SMTB`
returned an empty name + wrong category ("tshirt") even though the URL clearly
carries brand, garment, and gender. (2) The Session-21 "manila tile per item"
did not match the founder's mental model: a folder should be a real folder
holding *stacked file cards*, each peeking one key-info row, front file open,
hover to peek, click to pull fully out onto a "desk", plus a side "bucket" to
set a few items aside for comparison (mirroring pulling clothes out to plan an
outfit). (3) The passport should show the holder's badges and reveal each
medallion's meaning on hover.

**Built:**
- **Extractor upgraded to whole-path parsing (`lib/extractor.ts`).** Root cause:
  we only read the LAST path segment as the slug, so a trailing SKU (`85506.html`)
  hid the descriptive segment. Now: parse ALL path segments; `pickNameSlug()`
  scores each segment by real-word count and picks the richest; `detectCategory`
  + new `detectGender` run over the full path. Expanded category keywords to the
  whole taxonomy (bottoms/footwear/accessories) with order-sensitive matching —
  insulated outerwear (`down`, `puffer`, `parka`) matches as *jacket* before the
  generic hoodie rule, so "down hoody" → jacket. Gender detection (womens/mens/
  unisex, women-before-men) added to `ExtractedProduct` and threaded through
  `/api/closet/extract` → the closet add form now prefills the Line/gender field.
  Pure-numeric tokens ("00", "42") are dropped from names. New `garmentNoun()`
  gives a clean fallback ("Uniqlo T-shirt") when no name is recoverable.
- **7 new tests** in `extractor.test.ts` (Patagonia, Zara bare-SKU, Levi's/J.Crew
  bottoms, Nike footwear, women≠men, id-only URLs, unknown-brand provenance).
  Verified live: the Patagonia URL now returns Patagonia · Fitz Roy Down Hoody ·
  jacket · womens (was: empty name · tshirt).
- **Folder view rebuilt as a real filing cabinet (`closet/page.tsx`).** Each
  *collection* is now a colored, tabbed folder sleeve (6-color palette + neutral
  for Uncategorized) that is visually distinct from the white "file" cards inside.
  Items stack with a slight negative-margin tuck; every file shows one key-info
  row (glyph · color · name · type · size), the front-most file is open, and
  hovering any file expands its overview in place (thumb, brand, fit stars, color,
  ＋Bucket). Empty collections render an explicit empty-folder graphic.
  - **Detail sheet** (`DetailSheet`): clicking a file pulls it fully out onto a
    right-side desk sheet with the large thumb, all fields, per-variant size rows
    (edit/remove each), notes, Move-to-collection, and Add-to-bucket. Backdrop
    click closes. Reuses `MoveMenu`/`ItemThumb`/`safeNotes`.
  - **Comparison bucket** (`BucketPanel`): a floating panel that holds items set
    aside for side-by-side viewing; add from any file or the sheet, remove/clear,
    click a chip to reopen its sheet. Page-level `compareItems` state, reconciled
    against the latest item data on every reload (stale ids dropped). Explicitly
    labeled "not a saved list."
  - Old per-item `ItemTile` removed.
- **Passport badges (`components/Badges.tsx`, `passport/page.tsx`).** New
  `BadgeHoverSeal` shows a styled tooltip (title · metal tier · what it means ·
  cultural lore) on hover, anchored below-left so it stays inside the
  `overflow-hidden` passport card. `EarnedSealRow` renders ALL earned badges
  (pinned first). Passport now pulls `earnedBadgeIds` from `/api/status` and shows
  the full set with a "hover a medallion for its meaning" hint (was: pinned-only
  with a native title tooltip).

**Verified:** `tsc --noEmit` clean · 62/62 vitest green · `next build` clean ·
live: closet/passport/badges 200, extract endpoint returns correct
brand/name/category/gender for Patagonia + Uniqlo/H&M/Nike samples.

**Next:** collection drag-reorder; global "Apple-level" aesthetic pass;
deployment (SQLite→Postgres); business deliverables (interviews, opportunity deck).

---

## 2026-08-11 · Session 21 — Manila-folder tiles, icon view toggle, variant grid, corner-save placement

**Context:** founder UI polish (with a reference image of tabbed folder dividers):
folder view should look like stacked file folders where hovering makes a "file"
pop out toward the top-right revealing photo+info; view toggle should be a small
icon button; merge-variant list should be small tiles with hover-popover
descriptions; and the edit corner-save belongs INSIDE the card (not on the edge).

**Built:**
- **`ItemTile` redesigned as a manila folder:** a tab + gradient folder front
  showing just the name/type; on hover a "file" (photo + name + type + size +
  stars) slides up-and-right out of the folder's top-right corner (CSS
  translate + opacity, 300ms). Matches the founder's reference.
- **View toggle → icon buttons:** list = 3-line glyph, folders = folder glyph
  (SVG), with tooltips, replacing the "☰ List / ▦ Folders" text pills.
- **Merge variants → tiles:** the expanded variant list is now a 3–4 col grid of
  small tiles (thumbnail + size); hovering a tile pops a description card above
  it (size · color · stars + Edit/Unmerge/Remove).
- **Edit corner-save back inside the card:** `right-3 top-3` within the card; the
  Photo row reserves `pr-20` so its helper never sits under the button (the
  earlier overlap is gone without pushing the button off the edge).

**Verify:** `tsc` clean · `next build` clean · closet renders 200; the two dev-log
lines are just Fast-Refresh full-reload notices from editing, not runtime errors.

---

## 2026-08-11 · Session 20 — Security hardening: email reset, rate limits, export, image-gen, account controls

**Context:** founder batch — fix the edit-card corner-save overlap, add email as a
login method + username rules, then the deferred security/backlog set: real email
password reset, rate limiting, code-export button, a real image-gen provider, and
account safety (password reset without changing the code + soft-deactivate).

**Built:**
- **Bug fix:** edit-card corner "Save" no longer overlaps the Photo helper text —
  moved to the card's outer top-right (`-right-2 -top-2`) + `pr-14` on the Photo row.
- **Email login + username rules:** login & reset now accept **username / email /
  account code** (email detected by "@"). Username claim now rejects anything that
  looks like an email (would collide with email login); uniqueness already enforced.
- **Rate limiting** (`lib/rateLimit.ts`, in-memory fixed-window, per-IP): login
  10/5min, request-reset & recover 5/15min, reset 10/15min, `/api/view` 60/min,
  export 20/min. Returns 429 + Retry-After. (Per-process; swap for Redis before
  multi-instance prod.) Verified: 11th login → 429.
- **Real password reset (token flow):** schema `resetTokenHash` + `resetExpiresAt`.
  `/api/auth/request-reset` finds by identifier, stores a hashed one-time token
  (30-min expiry), emails a link via **Resend** (`lib/email.ts`); if email isn't
  configured it returns a `devLink` so beta can still reset. `/api/auth/reset`
  verifies token+expiry, sets the new password, logs in. **Account code never
  changes.** `/recover` rewritten to "send link"; new `/reset` page. Old
  `/api/auth/recover` kept for back-compat.
- **Export by code:** `/api/view/[code]/export` returns closet JSON as a download,
  **only when `exportPolicy === "anyone"`** (else 403); `/u/[code]` shows a
  "⬇ Export as JSON" button when allowed. Coarse-only, respects showBodyType.
- **Real image-gen:** `tryonImage.ts` gained a **Replicate FLUX schnell** provider
  (~$0.003/image) — set `REPLICATE_API_TOKEN` and the "✨ Photoreal preview" works
  with zero endpoint wiring (async create→poll→output). Generic `TRYON_API_URL`
  still supported as fallback. `.env.example` documents Replicate + Resend + APP_URL.
- **Account safety:** `/api/auth/change-password` (logged-in, verifies current pw,
  code unchanged) and `/api/auth/deactivate` (soft delete: `deactivated=true`,
  unlists from community, clears session). Deactivated accounts are rejected by
  login, `/api/view`, export, and the community directory. `/account` gained
  collapsible "Change password" + a red "Deactivate account" danger zone.

**Cost note (founder asked for cheapest model):** wired **Replicate FLUX schnell**
as the default photoreal path (~$0.003/img) — but I have no key and won't use a
fake one; founder adds `REPLICATE_API_TOKEN` to turn it on. Email = Resend free tier.

**Verify:** `tsc` clean · 55/55 tests · `next build` clean · live smoke: email-format
username rejected, email login works, devLink returned w/o mail provider, export 200
when policy=anyone, change-password 401/200, deactivate 401/200 → view 404, login
rate-limit 429 on 11th.

---

## 2026-08-11 · Session 19 — Closet add-by-URL + item photos + grid view, outfit closet-picker, bug fixes

**Context:** founder feedback batch — fix the outfits preview dead-end, drop the
ugly passport "FP" circle, let closet items be added by URL / named / photographed,
add a folder grid view, let outfits pull from the closet, and a corner Save on edit.
Plus questions on image-gen recommendation + brand-logo legality.

**Built:**
- **Bug fix — outfit preview dead-end:** the photoreal preview had no way back to
  the mannequin. Added a "← Stylized view" button and robust reset when pieces
  change; the "not set up" note no longer sticks.
- **Passport banner:** removed the right-side "FP" circle in both view & edit
  banners. The view banner still shows a real earned+pinned badge seal (that's
  meaningful), but no generic FP placeholder.
- **Closet item photos + names:** schema `KnownGoodItem.displayName` +
  `imageDataUrl` (user-uploaded, client-resized 320px JPEG — deliberately the
  user's OWN photo, never scraped brand art). Closet add + edit forms gained a
  photo upload and a Name field; list rows show a thumbnail + the name.
- **Add-by-URL:** paste a product URL → `/api/closet/extract` (reuses `extractSmart`)
  pre-fills brand / suggested name / category / sizes; user reviews, picks size,
  and can add their own photo before saving.
- **Folder/grid view:** a List ↔ Folders toggle. Grid renders stacked-card tiles
  showing the name; hover reveals info + photo. (`ItemThumb`, `ItemTile`.)
- **Outfits from closet:** composer got "+ Add from my closet" — a searchable
  picker that appends closet items as outfit pieces (with their brand/size/color).
- **Edit card corner Save:** small "Save" button pinned top-right of the edit card,
  in addition to the bottom button.

**Founder Q&A recorded:**
- *Image try-on:* recommend a dedicated **virtual-try-on API** (Google Vertex VTO,
  Kling/Kolors, FASHN.ai, or Replicate-hosted IDM-VTON) for garment-on-body
  fidelity; a plain text-to-image (Flux/SDXL/DALL·E via Replicate/Fal) for a
  cheaper stylized model shot. `/api/tryon` is provider-agnostic — set `TRYON_API_URL`.
- *Brand logos — LEGAL NOTE:* do **not** ship real brand logos by default.
  Trademark law permits *nominative* text reference ("this is a Nike item"), but
  displaying a brand's LOGO implies endorsement/affiliation (many brand guidelines
  forbid it) and hotlinking their image files adds copyright + bandwidth issues.
  Chosen safe path: brand shown as **styled text**; imagery is **user-uploaded
  photos of their own items** only. Revisit only with per-brand permission/official
  affiliate assets.

**Verify:** `tsc` clean · 55/55 tests · `next build` clean · live smoke: URL
extract fills brand/name/sizes, displayName + image persist, outfit-from-closet
posts, all pages 200.

---

## 2026-08-11 · Session 18 — Badge taxonomy (tracks + rare capstones) + escalating medallion craft

**Context:** founder wanted badges sorted, tiered per category, and rarer at the
top ("物以稀为贵"), plus a shape/finish that grows more refined with rank — with
real cultural/textile-history depth, tasteful (Roman/Chinese/art references), not
gaudy. Chose the **Tracks + Capstones** scheme with a **circle→relief→laurel**
finish ladder.

**Built:**
- `lib/badges.ts` restructured into **3 progression tracks × 3 tiers** + **3 rare
  capstones** (12 total):
  - The Wardrobe: Verified Closet → Curator → Wardrobe Archivist
  - The Fit Record: Truth-Teller → Calibrated → Open Closet
  - The Atelier: First Look → Stylist → Couturier
  - Rare Honors: Acclaimed (100 likes/look) → Tastemaker (500) → Head Designer (1000)
  Each badge gained `track`, `tier`, `finish` (0–5 ornateness), `motif` (icon key),
  and `lore` (a real history note — Roman fibula/wax tablet, guardaroba, Jacquard
  loom, imperial jade, etc). Renamed `public-figure`→`open-closet`; added
  `first-look`/`couturier`/`tastemaker`. New `badgesByTrack()` for grouped UI.
- `components/BadgeMedallion.tsx` reworked around the **finish ladder**: low tiers
  = plain struck coin + faint sheen; higher tiers add denser fluting, engraved
  rings, a guilloché field, deeper shadow/relief, a soft halo, rim star-points,
  and — only at the top (finish 5) — a **laurel wreath overflowing the rim**.
  Restraint tuned so it reads refined, not busy. Motif engravings are custom
  geometric line-art per badge (hanger, shelves, archive, wax tablet, gnomon,
  compass rose, needle, shears, loom, gem, obelisk, crown).
- `/badges` now **grouped by track** (tiers in order) with earned ✓ / dimmed
  unearned states, lore lines, and pinning kept (earned-only).
- `/help` earn-conditions updated for the new ids + shows lore.
- Lightweight extra: closet add form got an **in-store-only** checkbox (schema +
  API already supported `onlineAvailable`).

**LLM guidance recorded:** text extraction → Claude Haiku 4.5 (cheap, already
wired), Sonnet only for hard pages; images → external VTO/text-to-image (Claude
can't render), integration already key-gated.

**Verify:** `tsc` clean · 55/55 tests (badge-track grouping + new thresholds
covered) · `next build` clean · live smoke: 12 badges total, starter earns at 5
items, all pages 200.

---

## 2026-08-11 · Session 17 — Premium badge medallions + photoreal try-on integration

**Context:** founder felt the emoji-in-a-circle badges looked cheap and wanted
designed, glossy medallions; also greenlit wiring the real photoreal try-on path.

**Built:**

*Premium badge medallions:*
- `components/BadgeMedallion.tsx` — each badge is now a struck-metal SVG coin:
  metallic radial sheen per tier, a fluted/notched edge (36 notches), a recessed
  inner disc with rim bevel, a specular gloss arc, and a **custom geometric
  line-icon per badge** (hanger, shelves, archive, clipboard-check, target,
  globe, scissors, gem, crown) instead of emoji. Palettes tuned per tier
  (bronze/silver/gold/obsidian/diamond/jade). Scales cleanly; locked → grayscale
  + lock chip.
- `BadgeSeal` now delegates to `BadgeMedallion` (takes `id` for the icon; `glyph`
  kept for back-compat but unused). All callers (passport seal, badge library,
  help, chips, pinned seals) pass `id`.

*Photoreal try-on (honest, key-gated — same pattern as the LLM extractor):*
- `lib/tryonImage.ts` + `/api/tryon` — OFF unless `TRYON_API_URL` is set. When
  configured, POSTs a privacy-safe prompt (coarse body descriptor + garment list,
  **never** precise measurements) to a provider-agnostic text-to-image / VTO
  endpoint and returns an image URL/data-URL. Any failure → null.
- Outfits composer got a "✨ Photoreal preview" button: shows the generated image
  when available, otherwise a clear "isn't set up yet — using the stylized view"
  note. The stylized SVG mannequin remains the default. `.env.example` documents
  `TRYON_API_URL` / `TRYON_API_KEY`.
- Verified live: no key → `/api/tryon` returns `{configured:false}`, UI keeps the
  mannequin.

**Verify:** `tsc` clean · 54/54 tests · `next build` clean · pages 200 · no dev
runtime errors.

**Note:** photoreal output requires the user/founder to supply an image-gen API
(cost + provider theirs to choose). The integration + fallback are done; only the
external endpoint is unconfigured.

---

## 2026-08-11 · Session 16 — Outfits + likes (top badges made real), stylized try-on preview, passport/privacy polish

**Context:** founder greenlit the outfit-posting + likes line to make the
obsidian/diamond/jade badges real, asked for an "in-store only" flag, a virtual
try-on preview, and a batch of passport/privacy refinements + a help page.

**Built:**

*Outfits + likes (the top-badge engine):*
- Schema: `Outfit`, `OutfitItem`, `OutfitLike` (+ `KnownGoodItem.onlineAvailable`,
  `User.showBodyType`). Likes are anonymous-friendly — keyed by session id
  (`voterKey`), unique on (outfitId, voterKey) so one like per session; claimed
  users also store userId.
- APIs: `/api/outfits` (GET mine/feed, POST create, DELETE), `/api/outfits/like`
  (toggle, deduped).
- `/outfits` page: compose a look (garment types + colors), **live mannequin
  preview**, post; see your outfits with like counts. `/community` gained a
  "Latest looks" feed (most-liked first) with like buttons.
- **Top badges are now REAL** (were locked): Stylist = 3 posts, Acclaimed = 100
  likes on one look, Head Designer = 500 total likes. `badgeStats` feeds real
  outfitPosts / topOutfitLikes / outfitLikes. Verified live: 3 posts → Stylist.

*Stylized try-on preview (honest about scope):*
- `components/OutfitMannequin.tsx` — a deterministic layered SVG that morphs by
  body type and paints each garment layer in the outfit's colors (top→torso,
  bottom→legs, shoe→feet, hat→head, scarf→neck), with neutral defaults so a
  single-item look still renders. **Photoreal generation is NOT possible with
  our LLM** (Claude can't render images); `generatePhotoPreview()` is a
  documented scaffold that throws until an external image-gen/VTO API is wired.
  Told the founder this plainly.

*In-store-only flag:*
- Outfit + per-piece `onlineAvailable`; posts show a 🏬 "In-store only" tag (or
  "some pieces in-store only"). Closet API accepts the flag too.

*Passport / privacy polish:*
- Body type is now **hideable** — a `showBodyType` checkbox; `/api/view` and
  `/api/community` null out the body type when hidden. Re-verified no cm leak.
- "Notes" → **"Memo"**.
- Claim now **requires an explicit body-type choice** ("Prefer not to say" is a
  valid pick; empty placeholder blocks submit), with a separate show-publicly
  checkbox. Coarse types already expanded (petite…plus) in Session 15.

*Help page:*
- `/help` — how the app works + a badge table generated from the `BADGES` source
  of truth (never drifts), with plain-language earn conditions.

*Nav:* added Outfits + Help; condensed labels.

**Verify:** `tsc` clean · 54/54 tests · `next build` clean · live smoke: claim →
3 outfits earns Stylist; like dedups (double-like stays 1); in-store flag shows;
showBodyType=off hides body type in public view; no cm leak; all pages 200.

**Still staged (needs real scale, not faked):** photoreal try-on (needs an
image-gen/VTO API + key); Acclaimed/Head Designer require real like volume.

---

## 2026-08-11 · Session 15 — Prestige layer: badges, avatars, passport view-mode, community directory

**Context:** founder wants the passport to become a show-off object — an official
seal, earnable metal-tier badges (bronze→silver→gold→obsidian→diamond→jade),
titles like "Head Designer", avatars everywhere, a beautiful read-only passport
card after first fill, and an opt-in community directory with a "post yourself"
option. Explicitly agreed (AskUserQuestion): build what's real now, stage the
outfit/like-driven tiers as visible-but-locked; passport defaults to the polished
card, Edit flips to the form.

**Built:**

*Badge system (transparent, earned from real data — like the fit engine):*
- [`src/lib/badges.ts`](app-web/src/lib/badges.ts) — 9-badge ladder with metal
  tiers + a `METAL_STYLE` visual map. Earned badges: Verified Closet (5 items),
  Curator (12 items/3 collections), Wardrobe Archivist (25 items/6 brands),
  Truth-Teller (3 outcomes), Calibrated (10 refreshes), Open Closet (listed in
  community). **Staged/locked** with "coming soon": Stylist (obsidian), Acclaimed
  (diamond), Head Designer (jade) — these need outfit posts + likes, which don't
  exist yet, so they're shown locked rather than faked. Every badge has a
  plain-language blurb + progress text. `evaluateBadges`/`earnedBadgeIds`/`parsePinned`.
- [`src/lib/badgeStats.ts`](app-web/src/lib/badgeStats.ts) — one server helper
  computes real stats (closet size, brands, collections, outcomes, refreshes,
  community-listed) so status/view/community all agree.
- [`Badges.tsx`](app-web/src/components/Badges.tsx) — shared `Avatar`, `BadgeSeal`
  (metal medallion), `BadgeChip`, `PinnedSeals`.
- 8 new badge tests (54 total). Guard tested: locked badges never earn even with
  maxed stats; unearned badges can't be pinned (server filters).

*Passport view/edit mode:*
- `/passport` now defaults to a polished READ-ONLY card once it has content
  (avatar + official seal = your top pinned badge, or "FP" if none; identity
  lines; an Achievements row of pinned seals; body-type figure). An "✎ Edit"
  button flips to the existing inline-editable book; "Done editing" flips back.
  Empty passports open straight into edit.

*Badge library:*
- New `/badges` page — trophy case grouped into Earned / In progress / Coming
  soon, with progress text, and **pin up to 3** earned badges to the passport
  (writes `/api/profile/prefs`).

*Avatars + badges everywhere:*
- Home dashboard: identity strip (avatar + earned-badge count + pinned seals).
- `/u/[code]` public view: avatar + pinned/earned seals in the header.
- Community.

*Community directory + post-yourself:*
- New `/api/community` (opt-in listing, coarse info only, prestige-sorted).
- `/community` rewritten: a "Post yourself to the community" toggle (opt-in,
  claim-gated, unlist anytime), the code lookup, and a public grid of listed
  closets showing avatar + badges + item counts.

*Misc founder asks:*
- Coarse body types expanded to petite/slim/lean/average/athletic/curvy/broad/
  tall/plus (claim form + enum).
- Post-claim screen now leads with "View my passport →".
- BMI already removed (Session 14).

**Schema:** `User.listedInCommunity Boolean`, `User.pinnedBadges String`. New
route `/api/profile/prefs` (write-guarded by canEdit) for pinning + listing.

**Privacy:** re-verified `/api/view/[code]` leaks NO cm measurements even with
avatar/badges added. Avatar is cosmetic and intentionally public; precise body
data still never leaves the server.

**Staged for a future session (not faked):** outfit posting + likes + the
obsidian/diamond/jade "acclaim" tiers, and the Head Designer leaderboard. The
ladder shows them locked so the aspiration is visible.

**Verify:** `tsc` clean · 54/54 tests · `next build` clean · live smoke: claim →
add 5 clothes earns "starter" → pin + list → appears in community directory + on
public view; unearned-badge pin correctly rejected; no measurement leak; all
pages 200.

---

## 2026-08-11 · Session 14 — Size module cleanup + passport UX overhaul

**Context:** founder feedback: the size/converter block is the product's core but
was cluttered and confusing (converter always showed "43", no way to change the
scale cleanly). Plus a batch of passport asks and a claim-flow dead-end.

**Built:**

*Size module (the core) — decluttered & reusable:*
- `SizeConverter` is now **collapsible** — hidden behind a "Know it in another
  scale? Convert →" toggle so the size field stays clean. When open: pick your
  scale, and the input's **example placeholder follows the scale** (EU→"43",
  US→"10", cm→"27") instead of a fixed "43". Equivalents render as tap-to-adopt
  chips; adopting closes the panel.
- Each `Scale` gained an `example` field ([sizeConvert.ts](app-web/src/lib/sizeConvert.ts));
  scale labels are now human ("S / M / L", "EU number", "Waist (inches)").
  Scale parsers accept the bare value (scale already selected) so you just type
  "27" not "27 cm".
- `SizeInput` restructured to 4 clean rows: chips → input → one help line with a
  "what do these mean?" toggle → collapsed converter. The pants explainer moved
  behind that toggle.

*Passport:*
- **cm/in + kg/lb unit toggles** on Measurements. Fields STORE cm/kg but DISPLAY
  the chosen unit (`LenField`/`WeightField` convert on commit). Storage/engine
  untouched.
- **Region explained** inline ("which country's size labels to show first…").
- **Preferred fit is now multi-select, up to 3**, first = primary (badge "1st").
  Stored as CSV in the existing `preferredFit` column (no migration). Engine +
  recommendService use the FIRST token as the default; the Check page still
  previews any single fit. Server validates 1–3 valid tokens.
- **BMI removed** from the body-type card (founder said unnecessary).
- **Portrait upload** — click the portrait, image is client-resized to a 256px
  square JPEG data URL, stored in new `FitProfile.avatarDataUrl` (≤300KB,
  server-validated as a data:image). Falls back to initials. Never exposed by
  account code.
- **Sticky save bar** at the bottom of /passport: a live save dot + "Changes
  save automatically" + explicit Closet / claim actions, so users always know
  edits persist and how to keep them.

*Account:*
- Claim form is **no longer a dead-end** — added "← Edit my passport / closet"
  back links and copy clarifying nothing is locked until claim is pressed.

**Schema:** `FitProfile.avatarDataUrl String?` added; `preferredFit` semantics
changed to CSV (same column). `prisma db push` applied.

**Verify:** `tsc` clean · 46/46 tests · `next build` clean · live smoke: CSV
preferredFit stored + primary drives rec (oversized,slim → XL), avatar stored,
4-fit over-cap rejected (400), cm-entered chest round-trips.

---

## 2026-08-11 · Session 13 — Size converter + pants-number explainer

**Context:** founder didn't understand what the numeric pants sizes mean, and
wanted to enter a size in any scale (e.g. "I wear EU 43 shoes") and see the
equivalents.

**Built:**
- [`src/lib/sizeConvert.ts`](app-web/src/lib/sizeConvert.ts) — per-domain scale
  tables. Each domain (shoe / top / bottom) has a set of Scales that parse a raw
  string into a canonical rung and render it back. `convert(domain, raw, fromScale)`
  → equivalents in every scale. Shoes: EU ↔ US(men) ↔ UK ↔ cm (EU as canonical,
  US = EU−33, UK = US−1). Tops: alpha ↔ EU numeric. Bottoms: waist-inches ↔ cm
  ↔ alpha. Socks/accessories have no converter (returns []). Everything labeled
  "≈" — cross-scale is approximate.
- [`SizeConverter`](app-web/src/components/SizeConverter.tsx) — a panel under the
  size field: pick your scale, type your size, see equivalents as tap-to-adopt
  chips. Rendered by `SizeInput` for domains that support it.
- **Pants-number explainer** in `SizeInput`: "Numbers are inches: a single
  number is your waist (32 = 32″ ≈ 81cm). 32×34 = waist 32″ × inseam 34″
  (inseam = inner-leg length)." Shown as a 💡 hint for bottoms; a shorter one
  for shoes points at the converter.

**Verify:** `tsc` clean · 46/46 tests (9 new in `sizeConvert.test.ts`, incl. the
founder's EU 43 → US 10 / UK 9 / 27cm case) · `next build` clean.

---

## 2026-08-11 · Session 12 — Multi-garment domains, cross-domain disclaimer, body type + figure, brand-bias learning, LLM extractor scaffold

**Context:** the founder asked to knock out the whole roadmap in one pass so
they could experience it. I built four self-contained items end-to-end and
scaffolded a fifth (LLM extraction) as a dormant upgrade path — pets deliberately
deferred to its own session per their earlier directive.

**Built:**

1. **Garment taxonomy — the app now knows about more than tops.**
   [`src/lib/garments.ts`](app-web/src/lib/garments.ts) is the single source of
   truth: 18 garment types across four sections (Tops / Bottoms / Footwear /
   Accessories), each with a display label, emoji glyph, and size domain
   (derived from `sizeSystems.ts`). Closet add + edit forms now use a new
   sectioned `<CategoryPicker>` with `<optgroup>`s; the flat 7-type list is
   gone. `sizeSystems.ts` already knew the domains → shoes are numeric, socks
   are S–XL, pants are waist / W×L, accessories can be "One size." Default
   collections extended (Bottoms / Footwear / Accessories folders auto-file).
   Closet + refresh cards render `garmentLabel(category)` and `garmentGlyph`.

2. **Cross-domain disclaimer — "3 pairs of shoes → shirt rec" no longer lies.**
   The engine now derives the product's domain and the closet's domains. If
   they don't intersect (`domainRelevance === "cross"`), we (a) do NOT feed the
   irrelevant known-good items into the anchor signal, (b) hard-cap confidence
   at 0.35, (c) emit a plain-language `domainNote` the check page renders as an
   amber banner: "Your closet is footwear, but this is a top item. Sizing
   across garment types is unreliable…" Verified end-to-end via HTTP.

3. **Body-type derivation + illustrative figure + respectful out-of-scope path.**
   [`src/lib/bodyType.ts`](app-web/src/lib/bodyType.ts) derives two axes from
   the passport measurements — a volume band from BMI (petite / lean / average
   / solid / broad / extended) and a torso shape from chest-vs-waist (tapered /
   straight / full-waist). Degrades gracefully when data is missing. The two
   extreme bands trigger a **respectful scope note** — the wording talks about
   what standard S–XXL charts cover, never editorializes the person's body
   ("Your measurements sit above the range most standard S–XXL charts cover…").
   A `<BodyFigure>` SVG shows an abstract, faceless silhouette that widens /
   narrows by band and shape. Rendered as a new section on `/passport`.

4. **Per-user brand-bias learning — with pollution guards.**
   [`src/lib/brandBias.ts`](app-web/src/lib/brandBias.ts) reads THIS user's
   outcomes. Guards baked in (all founder-stated concerns): per-user only (no
   cross-user contamination), min-evidence threshold (≥2 same-direction
   outcomes), cancellation on contradictory reports, hard ±1-step cap. When a
   brand accumulates "too big" or "too small" signals, we shift the
   recommendation one alpha step, adding a new `brand-bias` signal to the
   engine with an explainable reason ("You've reported 2 Uniqlo items running
   too big — sized down one"). To make this actually MOVE the recommendation
   (an anchor rating goes stale), a non-neutral brand-bias downgrades the
   engine from `ANCHOR_W` to `DEFAULT_W`. Verified live: same closet + same
   product, 2 "too big" returns switched the pick from **M → S** with the
   right reason attached.

5. **LLM extractor scaffold — dormant until a key is set.**
   [`src/lib/extractorLLM.ts`](app-web/src/lib/extractorLLM.ts) — `extractSmart(url)`
   drop-in async replacement for `extractFromUrl`. If `ANTHROPIC_API_KEY` is
   unset, or the LLM call fails, or Zod validation fails → falls back to the
   deterministic extractor and the app behaves exactly as before. When enabled:
   Claude Haiku 4.5, `temperature=0`, strict JSON, timeouts + body-size caps,
   polite UA. **Never sends user body measurements** — only page text. Wired
   into `/api/check`. `.env.example` documents the switch.

**Test coverage:** 37/37 green. New test files: `sizeSystems.test.ts` (already
existed, 6), `bodyType.test.ts` (6), `brandBias.test.ts` (7), plus 3 new
cross-domain cases in `fitEngine.test.ts` (now 18).

**Verify:** `tsc` clean · 37/37 tests · `next build` clean (32 routes) · live
smoke passed for cross-domain, brand-bias direction shift, and body-type
rendering.

**Not done this session (intentional):**
- Pets — founder said separate session; PetProfile is in schema, ready.
- Aesthetic pass — deferred pending focused design session; piecemeal edits
  now would risk the "fancy but messy" outcome the founder warned about.
- Real LLM run — needs an ANTHROPIC_API_KEY.

**Governance selling point, worth keeping:** brand-bias is the
first example of the app learning from outcomes without becoming a black box.
Every shift attaches a plain-language reason; the guards (per-user, ≥2
evidence, cancellation, ±1 cap) are all in one auditable file — exactly the
"we can evaluate why the engine did what it did" story the proposal committed
to. The cross-domain disclaimer is the second: instead of returning a plausible
wrong answer, we say "we don't have the right evidence."

---

## 2026-08-11 · Session 11 — Size regularization + Refresh picker & smoother cards

**Context:** founder gave a broad roadmap (brand-bias learning, multi-dimensional
body types with an image + out-of-scope path, more garment domains incl. a
separate pets session, cross-domain rec disclaimers, LLM-as-judge exploration,
deployment). We discussed all of it (recorded in memory `project-fit-passport-roadmap`)
and picked the two concrete "fix now" items to implement this session.

**Built:**

1. **Sizes are now regularized per garment type.** Bug: the closet size field was
   a raw `<input>`, so `<` (or any junk) saved and displayed. New
   `src/lib/sizeSystems.ts` = single source of truth: garment category → size
   *domain* (top / bottom / shoe / sock / accessory) → valid shapes (regex),
   preset chips, and a human hint. New `SizeInput` component (one-tap preset
   chips + validated free text with inline error) replaces the raw input in both
   the closet add form and the edit row. Server-side, `/api/closet` POST & PATCH
   gained a Zod `.refine()` that rejects sizes not matching the category's
   domain. Verified live: `tshirt` `<` → HTTP 400; `tshirt` `M` → 200; `shoes`
   `M` → 400 (shoes aren't alpha-sized). 6 new tests, 21 total green.
   - **Design choice:** `sizeSystems.ts` is deliberately forward-compatible —
     pants/jeans/shorts/skirt/shoes/sneakers/boots/socks/hat/belt/scarf already
     have domains + patterns, so adding those garment types later (roadmap item
     #3) is just extending the closet CATEGORIES list + per-type input widgets,
     not reworking validation.

2. **Fit Refresh got a "pick what to refresh" step + smoother cards.** The
   `/refresh` page now has two phases: **pick** (choose one/several
   collections or Everything, pre-seeded from the `?collections=` link but always
   adjustable) → **cards**. Card motion is now velocity-aware: a quick flick
   commits even if the drag is short; release animates on a spring curve
   (`cubic-bezier(.22,1,.36,1)`); the next card rises + scales up to meet you as
   you drag; swipe-hint chips fade/scale with drag progress.

**Verify:** `tsc` clean · 21/21 tests · `next build` clean · live size-API smoke
passed. Committed 6e1f450, pushed to origin/main.

**Founder Q&A this session:** walked through the
current scoring logic (transparent 5-signal engine, adaptive anchor weights),
whether to move to "LLM as judge" (advised: no for the size decision — keep the
explainable engine as the differentiator + governance answer; yes for
extraction, explanation polish, and an optional confidence-only judge layer),
LLM cost (~$14 Haiku / ~$54 Sonnet per ~2000 checks, plus caching), and
deployment (SQLite is the blocker → Postgres on Vercel with pooled connections,
or Railway/Render with a persistent disk; ~$0–20/mo + a few $ LLM for beta).

**Next up:** LLM extraction (real size charts + product images, deterministic
fallback) is the highest-leverage next step; aesthetic polish pass; then the
larger roadmap items (brand-bias learning with pollution guards, body-type
dimensions, new garment domains).

---

## 2026-08-11 · Session 10 — Fit Refresh (card-stack comfort re-rating)

**Goal:** a delightful way to update how clothes feel as the body changes — a
Tinder-style card stack, one garment per card, a comfort slider that starts at
the current rating; swipe right / Save to record, swipe left / Skip = no change.
Triggerable per-collection, all, or prompted after a passport measurement edit.

### Schema
- New `ComfortCheck` (itemId, userId, rating 1-5, note?, reason, createdAt).
  `KnownGoodItem.fitRating` always mirrors the LATEST check; ComfortCheck keeps
  the full time-series for future trend analysis. `reason` ∈ refresh |
  measurement-change | add.

### API — `/api/closet/refresh`
- GET `?collections=<id,id|all>` → ordered items with `currentRating` (slider
  start) + collection name.
- POST `{itemId, rating, note?, reason?}` → txn: update item.fitRating +
  append ComfortCheck. POST `{itemId, skip:true}` → no write.

### UI — `/refresh`
- Card stack with a peek of the next card. Pointer-drag with rotation; release
  past ±110px commits save/skip; snap-back otherwise. Exit animation flings the
  card off-screen. Comfort `<input type=range>` 1–5 with labels
  (Doesn't fit…Perfect), starts at current, shows "Changed from X → Y".
  Button fallback (Skip / Save) + keyboard (←/→, number keys 1-5). Progress bar
  + completion summary (updated N · skipped M). Placeholder `GarmentThumb`
  (color swatch + emoji glyph) with a clear seam for a future real product image.

### Triggers
- Closet header: "↻ Refresh fit" button (all). Per-collection "↻ Refresh" link
  in each collection header (skips the virtual Uncategorized bucket).
- Passport: editing any body measurement (with ≥1 closet item) surfaces a
  dismissible "Your measurements changed → Refresh" banner.

### Verified
- `tsc` clean · `vitest` 15/15 · `next build` clean (32 routes) · live: demo
  seed → GET 5 items → record 5→3 (writes ComfortCheck, reason recorded) → skip
  writes nothing → item.fitRating=3 with 1 history row.

---

## 2026-08-11 · Session 09 — FIX passport persistence, fancy passport UI, garment gender, claim nudge

**Goal:** user report — "passport didn't save; no prompt to claim; even after
claiming, data wasn't retained; want fancy real-passport-looking editable UI;
add optional garment gender line (M/W/Unisex)."

### [BUG-01] Passport data disappearing — ROOT CAUSE + FIX
- **Diagnosis:** confirmed via reproducer — on first visit, the browser fires
  several concurrent no-cookie requests (`/api/auth/me`, `/api/status`,
  page HTML). Each API request hit `getCurrentUser()`, which created a NEW
  anonymous user and set its own Set-Cookie header. Browser kept only the
  last cookie → the profile/closet the user had just POSTed lived on a
  now-unreferenced userId. The DB test showed **3 User rows created in a
  single first visit.**
- **Fix:** added **`src/middleware.ts`** (Edge runtime) that mints the session
  cookie on any page navigation BEFORE any /api call fires. Middleware runs
  once per request, atomically, so all client-side /api calls carry the same
  cookie. `getCurrentUser()` reworked to **upsert by cookie's userId**
  (idempotent — concurrent same-cookie requests converge, they don't race);
  caught P2002 unique-constraint edge case with a re-read fallback.
- Added a parallel Edge-safe signing lib **`src/lib/authEdge.ts`** using Web
  Crypto (`crypto.subtle.sign`) so middleware can verify + issue the same
  HMAC-signed cookies as Node's `auth.ts` (byte-compatible).
- Verified live: 3-way concurrent first-visit → **1 User row**, profile
  survives, closet survives, and claiming preserves everything.

### Fancy passport UI at /passport
- New `src/app/passport/page.tsx`, replacing plain `/onboarding` as the primary
  entry (old route still works for bookmarks; Nav + all internal links now
  point to `/passport`). Design:
  - Gradient cover strip with subtle diagonal shine ("FIT PASSPORT · Sizing
    Identity")
  - Passport-photo-styled avatar (initials in a framed portrait box)
  - Mono-font "identity block" (Holder / Passport no. / Region / Preferred fit)
  - Sections: Sizing reference (sex chips + shopsFor multi-chips), Preferred
    fit (4 chips), Measurements (8 optional cm/kg fields), Region, Notes
  - Inline autosave on every change (blur/Enter for numeric+text; instant for
    chips) with a "Saved ✓ / Saving…" status line
  - Decorative MRZ-style footer that reflects the actual values you entered
- Style stayed restrained per the "simple + high-end, not gimmicky" directive.

### Garment gender line
- `KnownGoodItem.gender` = `"mens" | "womens" | "unisex" | null` (optional).
  Directly supports the cross-department shopping story (a woman buying
  men's tees is a real use case).
- Closet add/edit form: new "Line" chip select (—/Men's/Women's/Unisex).
- Item cards + public `/u/[code]` show a small **M/W/U** color badge.
- Demo seeder + view API + engine input all pass gender through.

### Guided flow — ClaimNudge floating card
- `src/components/ClaimNudge.tsx` mounted in root layout. Appears ONLY when:
  the user is unclaimed AND has actually entered data (`hasBody` or
  `closetCount ≥ 1`). Hidden on `/account`, `/login`, `/recover`. Dismissible
  per tab. Copy: "Save your passport — set a username + password so this
  doesn't disappear when you close the browser."

### Verified
- `tsc` clean · `vitest` 15/15 · `next build` clean (30 routes) · live
  concurrent-first-visit → single user, saved data survives claim.

---

## 2026-08-11 · Session 08 — biological sex, username login, email-only recovery

**Goal:** three founder requests: (1) add biological sex to the profile — as a
sizing reference AND to support cross-department shopping (men buying women's,
women buying men's); (2) let people log in by username, not just account code;
(3) recovery code was too clunky in practice — drop it and use email.

### Sex + cross-department shopping
- `FitProfile` gains `sex` (`male`/`female`/`unspecified`, all optional) and
  `shopsFor` (comma-separated of `mens`/`womens`/`unisex`). Onboarding has a
  new "Sizing reference" card with two rows of chip buttons + copy explaining
  a user can shop any department regardless of biological sex.
- Public view `/api/view/[code]` now returns `sex` + `shopsFor` (still no
  precise measurements — verified live: chest 92 does not leak). The public
  page surfaces a "⚡ Cross-department shopper — useful reference…" note when
  the shopper's departments differ from their biological sex.

### Username login
- `/api/auth/login` accepts `{ identifier }` (username OR account code), with
  a heuristic (looks like `FP-…`? → accountCode; else → username). Legacy
  `{ accountCode }` still works for backward compat. Uniform error message.
- `/login` UI has a single "Username or account code" field with an example
  showing both formats.

### Recovery = email only (recovery code removed)
- `/api/auth/claim` no longer generates/returns a recovery code and no longer
  writes `recoveryHash` (column kept in schema for now; explicitly nulled on
  claim to purge any residue).
- The scary red "save this code" warning + confirm checkbox is GONE. Account-
  ready screen now shows just the account code + (only if no email) a soft
  amber warning that they can't recover without an email.
- `/api/auth/recover` reworked: `{ identifier, email, newPassword }` — verifies
  the account with that identifier has EXACTLY that email on file, then resets
  and logs in. No emails are actually sent yet (MVP stage; noted in code that
  real send-token flow is required for prod). Uniform error message.
- `/recover` UI matches.
- `/api/auth/me` now exposes the user's own email so the Account status page
  can show it (with an explicit "none — can't reset password" if missing).

### Verified live
- profile stores `sex=female shopsFor=womens,mens` · claim response has no
  `recoveryCode` field · username login works, code login still works · email
  recovery works and rejects wrong email · public view exposes coarse sex but
  not chest.
- `tsc` clean · `vitest` 15/15 · `next build` clean (29 routes).

---

## 2026-08-10 · Session 07 — recovery/email, color wheel, reorder, merge UI, demo data

**Goal:** User feedback after the GitHub push: (1) recovery email + strong
"save your recovery code" warning; (2) color picker with a color wheel + two
rows of trendy colors; (3) finish the deferred Phase-2 items (reorder, merge-UI);
(4) one-click demo data.

### Recovery + email
- `email` (already on `User`) now collected at claim (optional, unique, lower-cased).
- `POST /api/auth/recover`: reset password via the one-time recovery code;
  rotates BOTH password and recovery code (old code invalidated), logs in,
  returns a fresh recovery code. Verified: old code rejected after use.
- Claim result screen rewritten as a **red, high-severity warning** with a
  copy button and a **"I've saved my recovery code" checkbox that gates the
  Continue button**. Claim form gained a "Recovery email (strongly
  recommended)" field. `/recover` page + link from `/login`.
- Email-based reset (send link to stored email) needs mail infra — deferred
  with an honest "coming soon" note; the recovery-code path works fully today.

### Color picker
- Expanded to **20 on-trend apparel colors in a 2-row swatch grid** + free-text
  + a **native color-wheel** (`<input type=color>`) styled as a swatch button.
  Preset map synced to the public `/u/[code]` view's `ColorDot`.

### Reorder + merge (finished the Phase-2 deferrals)
- `POST /api/closet/reorder` (assign sortIndex by array order, txn, user-scoped).
  Up/down arrows on standalone item cards; disabled at ends; reorders within a
  collection's standalone items.
- `POST /api/closet/group` (merge selected ids under a shared groupId / ungroup).
  Closet gained a **"Merge duplicates" select mode**: toggle → checkboxes on
  cards → Merge. Verified merging two Uniqlo items into one variant group.

### Demo data
- `POST /api/demo` resets the current user's closet/collections and seeds a
  chest-95 regular profile + 5 realistic items across collections. Surfaced as
  a subtle "Load demo data" link in the home new-user guide → redirects to /closet.

### Verified
- `tsc` clean · `vitest` 15/15 · `next build` clean (29 routes) · live smoke of
  demo load, email claim, recovery (+ old-code invalidation + relogin), merge.

---

## 2026-08-10 · Session 06 — closet organization (Phase 2)

**Goal:** The user's closet-organization request: default categories that are
user-renamable/movable, color tags, ordering, and merging same-garment
different-size/color into one card. Pure data + UI; the fit engine is untouched.

### Naming decision (important)
`KnownGoodItem.category` (tshirt/shirt/jacket) is the GARMENT TYPE the engine
matches on — NOT user-editable. The user-facing renamable folders are a new
`Collection` model, shown in the UI as "collections". Adding an item auto-files
it into the default collection for its garment type (Uniqlo tshirt → "T-Shirts").

### Schema
- New `Collection` (userId, name, sortIndex). `KnownGoodItem` gains
  `collectionId` (onDelete: SetNull), `color`, `sortIndex`, `groupId`,
  `groupName`. Grouping is DISPLAY-ONLY — the engine still reads every item
  individually, so variant-merging can't corrupt recommendations.
- `User` gains `collections` relation.

### Backend
- `src/lib/collections.ts`: garment-type → default-collection map, 5 default
  folders (T-Shirts/Shirts/Sweaters/Jackets/Other), `ensureDefaultCollections`
  (seed on first list), `collectionForGarment` (find-or-create on add).
- `GET/POST/PATCH/DELETE /api/collections` (list w/ item counts, create, rename/
  reorder, delete → items fall back to Uncategorized).
- `/api/closet` extended: POST auto-files + assigns end-of-list sortIndex; PATCH
  now partial (edit any field, move collection, recolor, reorder, group/ungroup).
- `/api/view/[code]` now returns collections + item color/collectionId (still
  NO precise measurements).

### Frontend
- `/closet` reworked: items grouped into collection sections; each section
  rename/delete; per-item Edit / Remove / move-to-collection dropdown; a color
  picker (9 presets + free text) with color dots on cards; "add collection"
  form; variant groups (shared groupId) collapse into one card with per-variant
  Edit/Unmerge/Remove.
- `/u/[code]` public view groups the shared closet by collection with color dots.

### Verified (live)
- Auto-file: tshirt→T-Shirts, shirt→Shirts, jacket→Jackets. Colors persist
  (preset name + custom hex). Rename T-Shirts→Tees + new "Gym" both work. Public
  view groups by collection and still leaks NO precise measurements.
- `tsc` clean · `vitest` 15/15 · `next build` clean (24 routes).

### Deferred (noted, not built)
- Manual up/down reorder UI (sortIndex is stored + honored; no drag/arrows yet).
- A "merge these into variants" trigger in the UI (grouping renders and unmerge
  works; creating a group needs a select-two-items affordance).
- Collection reorder UI (API supports sortIndex).

---

## 2026-08-10 · Session 05 — code-based identity, sharing, community (Phase 1)

**Goal:** Build the founder's novel identity idea: sign up → get an account
**code**; anyone with the code can VIEW the closet (read-only); editing needs a
**password** (= login). Plus a community entry point. Design + threat model
written first in `docs/design/identity-and-sharing.md`; decisions taken with the
user: (a) code exposes closet + COARSE body type only, never precise
measurements; (b) password REQUIRED at claim; (c) build identity before the
closet-organization work.

### Concept framing
Not true PKI — it's **capability(read) + credential(write)**. Account code =
bearer read-capability; password = bcrypt-hashed write-credential. Documented
that bearer codes can't be revoked once shared (offered rotation as future
escape hatch).

### Backend
- **Schema** (`User`): `claimed`, `accountCode` (unique, high-entropy),
  `username` (unique), `passwordHash`, `recoveryHash`, `bodyType` (coarse,
  shareable), `exportPolicy` ("owner"|"anyone"). Precise cm stays in FitProfile.
- **`src/lib/auth.ts`**: `generateAccountCode()` (Crockford base32, ~65-bit,
  `FP-XXXX-XXXX-XXXXX`), `normalizeAccountCode()`, `generateRecoveryCode()`,
  bcrypt `hashSecret`/`verifySecret`, and HMAC-signed session cookies
  (`encodeSession`/`decodeSession`, constant-time verify, no external JWT dep).
- **`src/lib/session.ts`** reworked: first visit mints an ANONYMOUS unclaimed
  user + signed cookie (keeps "just start adding clothes" frictionless);
  `getCurrentUser`, `setSession`, `clearSession`, `canEdit`.
- **Auth API**: `POST /api/auth/claim` (anon→claimed, returns code + one-time
  recovery code), `POST /api/auth/login` (code+password→edit session, uniform
  error to avoid code-existence leak), `POST /api/auth/logout`, `GET /api/auth/me`.
- **`GET /api/view/[code]`** — PUBLIC read-by-code. Prisma `select` deliberately
  OMITS `fitProfile`, so precise measurements can't leave the server. Returns
  username, coarse bodyType, closet items only.

### Frontend
- `/account`: claim form (username/password/coarse body type/export policy) →
  one-time reveal of account code + recovery code; status view when claimed
  (with public-view link + logout).
- `/login`: code + password.
- `/u/[code]`: public read-only closet view ("Viewing {username}'s closet",
  read-only badge, "measurements never shared by code" note, CTA to sign up).
- `/community`: code-entry to view a closet + "how sharing works" explainer;
  notes the public directory will be opt-in (Phase 3).
- `Nav`: shows `@username` when claimed, else a "Claim account" CTA; re-checks
  on navigation.

### Verified (live)
- Full flow: anon session stores chest 95 + closet → claim → code
  `FP-…` + recovery issued → **public view leaks NO precise measurements**
  (chest/waist/height/fitProfile absent; only closet + coarse "athletic") →
  login rejects wrong password, accepts correct → unknown code 404.
- `tsc` clean · `vitest` 15/15 · `next build` clean (all auth + view routes).

### Deferred / next
- Password recovery via recovery code (endpoint not built yet — code is issued
  and hashed, ready to wire).
- Rate-limiting on `/api/view` and `/api/auth/login` (noted in threat model).
- Code rotation escape hatch.
- Phase 2: closet organization (categories, tags, colors, ordering, merge
  same-garment variants) — the user's other request, intentionally after identity.

---

## 2026-08-10 · Session 04 — anchor-vs-preference fix, closet edit, brand autocomplete

**Goal:** Three user reports from the Session-03 review.

### [F2] "Every fit preference returns L on a Hermes shirt" — FIXED
- Root cause: the [F1] anchor-dominance fix (Session 02) worked *too* well. With
  a same-brand+same-category anchor (Hermes shirt L, 5/5), `known-good` weight
  (0.62) swamped everything, and `scoreKnownGood` measured distance from the
  EXACT anchor size — so slim/regular/relaxed/oversized all collapsed to L.
- Fix: a strong anchor now sets a **baseline** that the fit preference shifts.
  New `preferenceShift()` in `sizing.ts` (slim −1, regular 0, relaxed +1,
  oversized +2). `scoreKnownGood` targets `anchorIndex + preferenceShift(pref)`
  for strong (same-brand+same-cat) anchors; weak/cross-brand anchors are left
  un-shifted (their ladder alignment is already approximate). Explanations now
  read "Sized down from your Hermes L for a slim fit", etc.
- Removed the old, near-dead `scorePreference` signal (its shift logic was mostly
  0 and it now double-counted). `preferenceBonus` weight retired from use.
- Verified live with the user's exact closet: Hermes shirt now gives
  slim→M, regular→L, relaxed→XL, oversized→XL.
- Tests: updated the [F1] block to use `regular` for the exact-match assertion,
  added a 4-case "fit preference moves a strong anchor [Hermes bug]" block
  (incl. "the four preferences don't all collapse"). **15 tests, all green.**

### Closet editing
- `PATCH /api/closet` (user-scoped `updateMany` guard). Closet page now has an
  inline **Edit** mode per item (`EditRow`) alongside Remove — fixes "if I add
  something wrong I have to delete and re-add".

### Brand autocomplete (suggest, never lock)
- `src/lib/brands.ts`: ~70 well-known apparel brands + `suggestBrands()` with
  prefix-then-substring ranking, accent- and case-insensitive (so "her" →
  "Hermès"). Explicitly NOT a whitelist.
- `src/components/BrandInput.tsx`: free-text field with a suggestion dropdown
  (keyboard nav, outside-click close) that always allows typing an unlisted
  brand ("Not listed? Just type it — any brand works."). Wired into both the
  closet add form and the edit row.

### Verified
- `tsc` clean · `vitest` 15/15 · `next build` clean (16 routes) · live smoke of
  Hermes preference sweep + PATCH edit.

---

## 2026-08-10 · Session 03 — URL-aware extraction, fit toggle, interactive breakdown

**Goal:** Act on user feedback from the Session-02 walkthrough:
1. Default fit = regular, but let the result page preview slim/relaxed/oversized.
2. "Every URL returns M, doesn't look like it's actually running." → make the
   tool visibly read the specific page pasted.
3. Show the extracted product info (name, retailer, size chart) so the user
   trusts we read *their* page.
4. The ranked-sizes list felt static/misleading — make rows expandable.

### Extractor — now URL-aware (`src/lib/extractor.ts`)
- Two layers: (1) curated fixtures for the 3 demo products; (2) **URL-derived**
  extraction for everything else. Layer 2 parses the real URL: brand from the
  domain (`BRAND_TABLE` of 13 retailers, each with its own chest base + step +
  fit-notes so charts differ), category from slug keywords, product name from
  the slug. Unknown brands still derive retailer + name + a generic chart.
- Added `source` provenance (`host`, `derived`, `slug`) to every result so the
  UI can prove it read that page.
- `slugToName()` strips CMS noise (`productpage`, `p12345`, SKU-ish tokens,
  file extensions). Verified: Zara/H&M/Nike URLs now yield clean names.
- **Root cause of "everything returns M"**: the old extractor had ONE generic
  fallback, so every non-demo URL produced the same product+chart. Fixed.
  Verified live: Zara sweater→L, Nike hoodie→S, H&M shirt→L, Patagonia→S.

### Fit preference toggle
- New **`/api/recommend`** endpoint recomputes for an already-stored product
  with an optional `preferredFit` override — no duplicate product row, no
  mutation of the saved profile.
- Extracted shared `src/lib/recommendService.ts` so `/api/check` and
  `/api/recommend` assemble identical engine input.
- Result page has a slim/regular/relaxed/oversized segmented toggle; changing it
  re-runs the engine live (with an opacity transition). Seeds from the saved
  profile (default regular).

### Interactive breakdown + provenance UI (`/check`)
- New **provenance card**: "Read from {host}" badge, product name, a detail grid
  (retailer/brand/category/material/#sizes/fit-note), and the clickable source URL.
- Ranked size rows are now **expandable** (`SizeRow`): tap to reveal the signals
  it's based on (with per-signal weight, red dot for negative/outcome signals),
  the garment measurements pulled from the page (chest/shoulder/sleeve/… chips),
  and the match-score + confidence footer. The pick is expanded by default.

### Engine polish
- Added an **edge-of-range note** to explanations: when the pick is the
  largest/smallest size offered but the target implies wanting to go further,
  it says so plainly ("This is the largest size offered — for an oversized fit
  you're at the top of the range") instead of a confusing lone "chest N cm
  smaller than target" line. Article agreement (a/an) handled.

### Verified
- `tsc` clean · `vitest` 11/11 · `next build` clean (16 routes incl. new
  `/api/recommend`) · live smoke: URL variety + fit toggle + slug cleanup +
  edge note all confirmed.

### Next up
- Real LLM/VLM extraction to replace layer 2 for unknown pages (W6 milestone);
  keep the "confirm what we extracted" step.
- One-click "load demo data" for E-of-E.
- Let the user EDIT extracted product fields before scoring (proposal's
  user-confirmation mitigation) — the provenance card is the natural home.

---

## 2026-08-10 · Session 02 — [F1] engine fix + UX overhaul

**Goal:** Fix the [F1] anchor-weighting finding surfaced during the Session-01
walkthrough, then redesign the UI around one insight: *a visitor only wants to
know "what size should I buy?"* — so get them to value fast, then guide them to
add data that improves accuracy.

### Engine — [F1] fixed
- Added **adaptive weighting** to `fitEngine.ts`. `hasStrongAnchor()` detects a
  same-brand + same-category closet item rated ≥4/5. When present, the engine
  uses `ANCHOR_W` (known-good 0.62 / chest 0.18) instead of `DEFAULT_W`
  (chest 0.45 / known-good 0.35) — the owned-size anchor dominates and chest
  becomes a tie-breaker. Refactored all `score*` fns + `combine` to take a
  `Weights` param (no module-level mutable weight).
- 3 new regression tests ("anchor dominance [F1]"): owned-size wins; a low-rated
  anchor (fit ≤3) does NOT trigger dominance; cross-brand-only stays
  measurement-led. **11 tests total, all green.**
- Verified live: COS Oxford shirt for a slim chest-95 user who owns a COS EU 48
  now recommends **EU 48** (was EU 44 in Session 01).

### UX overhaul — value-first + guided
- **Design system** `src/components/ui.tsx`: `Button`, `LinkButton`, `Card`,
  `Field`, `EmptyState`, `ConfidenceRing` (SVG), `AccuracyBadge`, `Skeleton`.
  Extended Tailwind theme (brand tints, `ink` scale, card/lift shadows,
  fade-in-up + shimmer animations).
- **`/api/status`** (new): profile completeness snapshot — steps checklist,
  accuracy tier (low/medium/high), next-step pointer, last recommendation.
- **`/api/products`** (new): lists checked products. Fixes a real UX bug — the
  old history page derived the product picker from existing outcomes, which was
  circular (couldn't record a first outcome). Now you can log an outcome for any
  product you've checked.
- **Home** rebuilt as a guided dashboard: hero paste-URL box (submits straight
  to `/check?url=`), new-user 3-step guide vs returning-user progress checklist
  with accuracy badge + last-recommendation recap.
- **/check** is now the hero: auto-runs a URL passed from home, loading
  skeletons, big answer with `ConfidenceRing`, score bars per size, red dots for
  negative (outcome) signals, and a **benefit-framed accuracy nudge** ("add 3
  clothes you own → sharper sizing") driven by `/api/status`.
- **Onboarding**: preferred-fit as tappable cards (highest-signal/lowest-effort
  first), chest marked "most useful", save → guided next step.
- **Closet**: X/3 progress, star ratings, empty state, "goal met" celebration
  card linking to /check.
- **History**: empty state when nothing checked yet, primitives throughout.
- **Nav**: sticky, active-route aware, backdrop blur.

### Verified
- `tsc --noEmit` clean · `vitest` 11/11 · `next build` clean (all routes) ·
  live smoke of status→setup→check→[F1] path.

### Next up
- Optional: a one-click "load demo data" button for E-of-E so the dashboard
  shows a populated state instantly.
- W2 discovery: start shopper interviews with `docs/business/interview-guide.md`.
- Consider migrating SQLite→Postgres + real auth before beta (W12).

---

## 2026-08-10 · Session 01 — Repo bootstrap & core MVP loop

**Goal:** After the proposal was approved (Aug 9), turn the Fit Passport
proposal into a repo that (a) demos end-to-end today, (b) can grow into a real
beta by W13 per the 15-week plan, and (c) has the business deliverables framed up.

### What we built
- Repo layout at `/Users/xkk/Desktop/Kong Info/Self-Project/`:
  - `docs/proposals/` — archived the four PDFs (syllabus, official form, detailed proposal).
  - `docs/business/` — business and positioning deliverables live here.
  - `app-web/` — Next.js 14 (App Router, TypeScript, Tailwind v3) MVP.
- **Data model** in Prisma (`app-web/prisma/schema.prisma`): `User`, `FitProfile`,
  `KnownGoodItem`, `Product`, `SizeOption`, `FitRecommendation`, `FitOutcome`,
  `PetProfile` — mirrors §10.1 of the detailed proposal. SQLite for dev; the
  schema is portable to Postgres for beta.
- **Fit engine** (`src/lib/fitEngine.ts`): transparent, rule/score-based, no
  black-box ML in the recommendation step. Signals: chest-fit (Gaussian around
  body+ease), known-good similarity (alpha-ladder distance × brand/category
  match × trust), fit-preference bonus, outcome learning (returns penalize,
  keeps boost), completeness-driven confidence. Every recommendation carries
  per-signal reasons — the engine is auditable, not oracular.
- **Regional size normalization** (`src/lib/sizing.ts`): EU numeric → US alpha
  mapping for jackets; deterministic label parsing that also handles "US M",
  "EU 48", "M/L" ambiguity.
- **Extractor** (`src/lib/extractor.ts`): fixture-first for 3 demo retailers
  (Uniqlo, COS, Levi's). Real LLM extraction can slot into `extractFromUrl()`
  later — the consumer interface won't change. Chose fixtures deliberately per
  §16 Risk row on scraping (demo-safe on Nov 4 without depending on live
  retailer pages).
- **API routes** (`src/app/api/*/route.ts`): `/api/profile`, `/api/closet`,
  `/api/check`, `/api/outcome`. Zod-validated. Ownership-scoped by `userId`.
- **Screens** (App Router): landing (`/`), onboarding (`/onboarding`), closet
  (`/closet`), check-a-product (`/check`), fit history (`/history`).
- **Tests**: 8 vitest cases in `src/lib/fitEngine.test.ts` — cold-start,
  measurement-driven ranking, monotonicity across `slim → oversized`,
  outcome-learning penalty, explanation grounding. All green.

### Key decisions & tradeoffs
- **Next.js 14 + React 18** (not the latest Next 16). Node 18.20 on this
  machine can't run Next 16 or the latest Prisma. Pinned versions:
  `next@14.2.15`, `react@18.3.1`, `prisma@5.22.0`, `vitest@1.6.0`. Trade: no
  newest features (React 19 form actions, RSC-only mutations). Win: reliable
  install, well-understood upgrade path when Node is bumped.
- **Tailwind v3 (not v4)** — the scaffold left v4-flavored configs; I
  normalized to v3 which is stable in the Next 14 ecosystem.
- **No auth for MVP.** Single "demo user" shim in `src/lib/session.ts`. Every
  API route calls `getCurrentUser()`. Swapping to NextAuth/Clerk later is a
  one-file change. Rationale: proposal §9 explicitly de-scopes auth.
- **Fit engine is NOT an LLM.** The proposal (§10.2) says a transparent scoring
  model is preferable "because it can be evaluated." Following
  that literally. LLMs may still assist in *extraction* upstream, but the size
  decision is auditable arithmetic. This also directly addresses the
  "customer problem clarity" concern: we can show the reasoning, not just a
  guess.
- **SQLite** now for zero-config; migrate to Postgres before beta (W12–W13).

### What worked
- End-to-end smoke: `POST /api/profile` then `POST /api/check` with a Uniqlo
  URL returns a recommendation of "M" at 75% confidence for a body chest of
  92cm with regular fit, plus a grounded explanation. This proves the schema,
  engine, extractor, and API all agree.
- The unit tests caught two test-spec mistakes (I had confused garment
  measurements with body ranges). Fixing the tests, not the engine, was the
  right call — the engine's ease-based reasoning is correct.

### What didn't (yet)
- Latest Next.js scaffold assumes Node 20+. Wasted a few minutes reconciling
  configs. Documented pinned versions above so this doesn't recur.
- No auth means no real multi-user beta yet. Intentional but visible.
- Extractor is fixture-based. Real HTML parsing / LLM extraction not
  attempted this session — deliberately punted to W6 per the 15-week plan.

### Next up
- Wire the four business docs (project plan, BMC, VPC, interview guide, risks/
  legal) into `docs/business/`. Draft in this same session so the team has one
  coherent artifact set from day one.
- (Sess 02) First 5–8 shopper interviews via the guide — W2 milestone.
- (Sess 02) Add a "region + size chart" seed for a fourth retailer so we can
  demo cross-region recommendations at the mid-review.
- (Sess 03+) LLM extraction spike as a fallback when a URL doesn't match any
  fixture, gated behind a user-visible "we extracted this — confirm" step.

### Files touched
```
docs/proposals/*.pdf                          (moved from repo root)
docs/business/*                                 (created)
app-web/package.json                          (pinned Next 14 / React 18 / Prisma 5.22 / Vitest 1.6)
app-web/prisma/schema.prisma
app-web/src/app/layout.tsx, page.tsx
app-web/src/app/onboarding/page.tsx
app-web/src/app/closet/page.tsx
app-web/src/app/check/page.tsx
app-web/src/app/history/page.tsx
app-web/src/app/api/profile/route.ts
app-web/src/app/api/closet/route.ts
app-web/src/app/api/check/route.ts
app-web/src/app/api/outcome/route.ts
app-web/src/lib/db.ts, session.ts, sizing.ts, extractor.ts, fitEngine.ts
app-web/src/lib/fitEngine.test.ts             (8 tests, all green)
app-web/src/components/Nav.tsx
app-web/tailwind.config.ts, postcss.config.mjs, next.config.mjs, .eslintrc.json
DEVLOG.md, README.md, .gitignore              (created)
```
