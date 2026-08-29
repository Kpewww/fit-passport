---
name: project-fit-passport-logo
description: "Fit Passport logo — the Fit Thread mark, its cleaned master/reverse/micro files, and the measured size floor that blocks the favicon"
metadata:
  node_type: memory
  type: project
---

The mark is **The Fit Thread / Ariadne Thread Signet**: one continuous line folding
into an abstract **FP**. The primary reading is **Ariadne's thread** — the labyrinth
is sizing that disagrees across brands and regions, the thread is the wearer's
accumulated fit memory, and the way back out is an explainable recommendation. The
half of the myth that matters is that *Ariadne gives Theseus the means to navigate
without taking over*, which is the product's whole posture.

Approved public wording (`LOGO_CONCEPT.md` §16, use these rather than paraphrasing):

> **One thread through the maze of fit.**
>
> Across brands, sizing becomes a labyrinth. Fit Passport keeps the thread: what you
> wore, how it felt, and what worked. The mark is a single thread folded into FP, a
> personal signet that guides you back to your fit.
>
> *Internal:* the logo is not a picture of clothing. It is the memory that travels
> through clothing.

⚠ **This note previously said "the line is the measurement, the loop is the garment
it comes back around to." That reading is nowhere in the concept document** — it was
invented in a summary, and had reached `Logo.tsx`'s header and the `/help` page
before anyone checked it against the source. Secondary readings that ARE documented:
the weaver's shuttle (§4 — each fit outcome is one pass, and a pattern emerges over
time) and the personal signet (§5). **`docs/design/LOGO_CONCEPT.md` is the source of
truth for meaning; this file is a pointer, not a paraphrase.** Assets and the
measured numbers are in `brand/README.md`.

## The production files (cleaned 2026-08-27)

- **`fit-passport-mark-master.svg`** — the canonical one. Tight 536.03 × 501.64
  viewBox, **single path**, `fill="currentColor"`. Derive everything from this.
- **`fit-passport-mark-reverse.svg`** — same geometry, explicit white. Kept as its
  own file because print, embroidery and third-party tools ignore `currentColor`
  and would render it black on a dark ground.
- **`fit-passport-mark-micro.svg`** — same path, stroked +16 units. **Not** a
  scaled master. For 24–40 px.
- **`fit-passport-mark-favicon.svg`** (+ `-reverse`) — a **different, simpler
  glyph** for 16–20 px, drawn on a 16-unit grid with a 2-unit stroke so edges land
  on pixel boundaries. Ships as `app-web/src/app/{favicon.ico,icon.svg,apple-icon.png}`.

`app-web/src/components/Logo.tsx` is **generated from the master** — edit the SVG
and re-derive, do not hand-tweak the path in the component. It picks micro under
40 px and master above.

## The two numbers that govern everything

On the 536-unit-wide artwork: median stroke **24 units (4.5% of width)**; tightest
5% of interior gaps **20 units**.

- The stroke falls under one device pixel below ~32 px.
- **Thickening is capped by the gaps, not by taste.** Micro grows the stroke by 16
  (24 → 41.5, gaps 20 → 6). More merges the strokes into each other.

Measured at **true device pixels**: 48 solid · 32 good · 24 visible but the P
bowl's counter fills · **16–20 illegible, both weights**.

## Hard facts, so they are not re-derived

- **The supplied SVG's white path was tracer residue, not weave crossings.** Checked
  before deleting: 101 px of 1,048,576 differ, in five clusters, every one a 1–2 px
  sliver along a stroke *edge* rather than a gap *across* one. In a thread mark that
  distinction decides whether deleting flattens the design.
- **The master is the original geometry translated, not redrawn.** Verified: with
  both cropped to the same box, zero pixels differ beyond anti-aliasing, best
  alignment (0,0).
- **Judge small sizes at deviceScaleFactor 1.** A retina screenshot gives 26 CSS px
  fifty-two device pixels and flatters the mark — that is how a logo ends up
  illegible in the one place it is smallest. `tests/size-test.mjs` renders both.

## Traps

- **A supplied "fixed" SVG (2026-08-27) was a bitmap in an SVG wrapper** — zero
  paths, one `<rect>` filled by a `<pattern>` over an embedded PNG, 146 KB against
  5 KB for the real vector. And its embedded PNG was **byte-identical** to one
  already in the repo, so there was no redraw to adopt. **Check for `<path>` before
  believing any SVG is vector**, whatever the filename says.
- Supplied PDFs from the same tool are JPEG placements, not vector. Never generate
  variants from them.

## BLOCKED, and on what

- ~~Favicon~~ — **done 2026-08-27.** A 16x16 raster concept was supplied; the
  concept was right (simplify to the P and its loop) but a lone 16 px bitmap has no
  vector source for the 32/48/180 sizes browsers also want. Redrawn as vector:
  **404 bytes** at 16 px against the raster's 10,197, and crisp at 24/32/48.
- **Lockups (horizontal / stacked).** Blocked on choosing the wordmark typeface.
  The app pairs the mark with italic Fraunces today; that is a placeholder, not a
  decision.
- **Colour, motion, badge adaptation.** Deliberately parked. The plan puts them
  after monochrome passes size testing, and 16 px has not passed. Candidate accents
  when it does: Oxblood `#781F2B` (recommended start), Deep Aubergine `#2B172C`,
  Ultramarine `#2737B8`, over Ink Black `#171416` and Warm Ivory `#F3EFE7`.

**Palette: SETTLED 2026-08-27 — cool porcelain `#F3F3F1` wins.** The logo documents
had named Warm Ivory `#F3EFE7` while the app ran on cool porcelain; two systems
disagreeing was worse than either choice. Warm Ivory is retired everywhere,
including the size-test harness. The mark is monochrome and inherits
`currentColor`, so this changes the ground it is tested on, not the geometry.

---

**SESSION 59 (2026-08-28) — the assets moved.** They now live in **`brand/`** at the
repo root, not `docs/design/assets/logo/`, because the app builds from them: they are
build inputs, not documentation. `src/lib/logoAsset.test.ts` fails if `Logo.tsx`'s
inlined path, viewBox or micro stroke width drifts from the assets — see
[[project-fit-passport-build-state]] invariant ㉚. The concept write-up stays at
`docs/design/LOGO_CONCEPT.md`.

---

**SESSION 61–62 (2026-08-28) — the metaphor is now ON the site, and had to be
corrected once first.** `/help` has a "The mark" section showing the mark at 96px
beside the story. **The first version was written from this memory file's summary
rather than from `LOGO_CONCEPT.md`, and carried the invented measurement/garment
reading** — the founder caught it. Rewritten from §16's approved wording: the public
line, the product explanation, a three-row Ariadne mapping (labyrinth = sizing that
disagrees / thread = what you've worn and how it fit / way back out = a
recommendation that shows its reasoning), and the closing *"not a picture of
clothing — the memory that travels through clothing."* It carries the document's own
disclaimer that the myth is a lens rather than a provenance claim, and states the
size floor in plain language so the favicon being a different glyph reads as a
decision.

**The lesson is about direction, not wording.** A summary is downstream of its
source; when a summary is the thing you reach for, its errors ship. The mark's
meaning has exactly one source of truth and it is not this file.
