---
name: project-fit-passport-logo
description: "Fit Passport logo — the Fit Thread mark, its cleaned master/reverse/micro files, and the measured size floor that blocks the favicon"
metadata:
  node_type: memory
  type: project
---

The mark is **Fit Thread**: one continuous line drawing an F and a P, the line
standing for the measurement and the loop for the garment it comes back around to.
Full narrative in `docs/design/LOGO_CONCEPT.md`; assets and the numbers in
`docs/design/assets/logo/README.md`.

## The production files (cleaned 2026-08-27)

- **`fit-passport-mark-master.svg`** — the canonical one. Tight 536.03 × 501.64
  viewBox, **single path**, `fill="currentColor"`. Derive everything from this.
- **`fit-passport-mark-reverse.svg`** — same geometry, explicit white. Kept as its
  own file because print, embroidery and third-party tools ignore `currentColor`
  and would render it black on a dark ground.
- **`fit-passport-mark-micro.svg`** — same path, stroked +16 units. **Not** a
  scaled master.

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

## BLOCKED, and on what

- **Favicon.** No amount of thickening survives 16 px. It needs a **simplified
  glyph** — fewer strokes, wider counters — which is a drawing decision, not an
  export setting. The app still ships the previous mark's `favicon.ico`.
- **Lockups (horizontal / stacked).** Blocked on choosing the wordmark typeface.
  The app pairs the mark with italic Fraunces today; that is a placeholder, not a
  decision.
- **Colour, motion, badge adaptation.** Deliberately parked. The plan puts them
  after monochrome passes size testing, and 16 px has not passed. Candidate accents
  when it does: Oxblood `#781F2B` (recommended start), Deep Aubergine `#2B172C`,
  Ultramarine `#2737B8`, over Ink Black `#171416` and Warm Ivory `#F3EFE7`.

**Note a palette tension for whoever picks the colour:** the logo system names
**Warm Ivory `#F3EFE7`**, while the app's design system runs on **cool porcelain
`#F3F3F1`** — Session 25 replaced warm ivory deliberately, and
[[project-fit-passport-design-system]] says warm-ivory values found in the app are
stale. Two systems currently disagree; someone has to decide which wins rather than
letting both persist.
