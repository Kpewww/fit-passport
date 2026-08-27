# Fit Passport Logo Asset Manifest

This directory contains the selected **Fit Thread** logo-mark exports. The naming
pattern is:

```text
fit-passport-mark-{colour}-{background}.{format}
```

- `mark` means the symbol without the “Fit Passport” wordmark.
- `black` describes the mark colour in the current monochrome phase.
- `transparent` and `on-white` describe the intended background treatment.
- `source-exports/` preserves supplied exports that are useful for reference but
  do not yet qualify as production masters.

## Current Files

| File | Actual structure | Recommended use | Status |
|---|---|---|---|
| `fit-passport-mark-master.svg` | Tight 536.03 × 501.64 viewBox; **one path**, `fill="currentColor"` | **The canonical master.** Recolour, resize, derive everything from this | **Production master** |
| `fit-passport-mark-reverse.svg` | Same geometry, `fill="#ffffff"` | Dark grounds, and any tool that ignores `currentColor` (print, embroidery, third-party) | **Production** |
| `fit-passport-mark-micro.svg` | Same path, stroked +16 units to thicken it | 24–40 px use. **Not** a scaled master — see the measurements below | **Production, with a stated floor** |
| `fit-passport-mark-black-transparent.svg` | 1024 × 1024 viewBox; two vector paths | Figma import, light-background web prototypes, vector reconstruction reference | **Best current vector source, cleanup required** |
| `fit-passport-mark-black-transparent.png` | 1024 × 1024 RGBA | Documents, decks, social/profile mockups, rapid prototypes | Ready for light backgrounds |
| `fit-passport-mark-black-on-white.svg` | 1024 × 1024 viewBox; white background path plus black mark path | White-background layouts and reconstruction reference | Vector, but not the canonical master |
| `fit-passport-mark-black-on-white.png` | 1024 × 1024 RGB | Documents and systems that require a flattened white background | Ready for white backgrounds |
| `source-exports/fit-passport-mark-black-transparent-export.pdf` | One 768 × 768 pt page containing a 2048 × 2048 RGB JPEG | Archive/reference and simple placement workflows | **Flattened white; not transparent or vector** |
| `source-exports/fit-passport-mark-black-on-white-export.pdf` | One 768 × 768 pt page containing a 2048 × 2048 RGB JPEG | Archive/reference and simple placement workflows | **Raster PDF; not a vector print master** |

## What the cleanup actually did (2026-08-27)

The white correction path was **measured before being removed**, not assumed to be
junk. Rendering with and without it differs by **101 pixels out of 1,048,576
(0.0096%)**, in five clusters of 9–15 pixels each. Magnified, every one is a 1–2 px
sliver along the *edge* of a stroke — tracer residue — not a gap *across* a stroke.
That distinction mattered: in a thread mark, a gap across a stroke would be an
over/under crossing, and deleting those would have flattened the weave. They were
not crossings, so the path was safe to drop.

The master's coordinates were then translated to a tight origin and verified: with
both files cropped to the same box, **zero pixels differ by more than an
anti-aliasing threshold**, and the best alignment offset is (0, 0). The geometry is
the original, moved — not redrawn.

## The size floor, measured

On the 536-unit-wide artwork: median stroke **24 units (4.5% of width)**, and the
tightest 5% of interior gaps are **20 units**. Those two numbers set everything.

- The stroke is under one device pixel below ~32 px.
- Thickening is capped by the gaps: the micro variant grows the stroke by 16
  (24 → 41.5, gaps 20 → 6). More than that and strokes merge into each other.

Rendered at **true device pixels** (`tests/size-test-device-pixels.png`):

| Size | Master | Micro |
|---|---|---|
| 48 px | good | solid |
| 32 px | readable, light | **good** |
| 24 px | hairline | visible, but the P bowl's counter fills |
| 16–20 px | **illegible** | **illegible** |

**So a 16 px favicon cannot be produced from this geometry by any amount of
thickening.** It needs a simplified glyph — fewer strokes, wider counters — which
is a design decision, not an export setting. That is the one item in the "next
asset set" below that is blocked on a drawing, not on tooling.

Judge small sizes on the **device-pixel** sheet, not the retina one: 26 CSS px on a
2× screen gets 52 device pixels and flatters the mark, which is exactly how a logo
ends up illegible in the one place it is smallest. `tests/size-test.mjs` regenerates
both.

## Important Findings

The transparent SVG is a real vector rather than an embedded bitmap. However, it
contains one dark principal path and a second white correction path. The white path
produces several tiny white slivers when the file is previewed on a dark background.
The current black mark is intended for light backgrounds, but the correction path
still prevents this file from becoming the canonical recolourable master.

The two PDFs both render correctly on white, but each contains a JPEG rather than
vector paths. The export labelled “transparent” was flattened to white during PDF
creation. Keep both as supplied source exports; do not describe either as a vector
PDF or use them to generate future variants.

## Usage Rules for the Current Set

- Prefer the transparent PNG for immediate documents and mockups on white or Warm
  Ivory.
- Prefer the transparent SVG for Figma reconstruction and temporary light-background
  web use.
- Do not place the black mark on a dark background. A true reverse-white SVG has not
  been produced yet.
- Do not recolour the current transparent SVG until the white correction path has
  been removed and the silhouette has been optically checked.
- Do not use either PDF as the source for resizing, recolouring, animation, cutting,
  embroidery, or professional print production.
- Keep the 1024 × 1024 canvas exports as historical/source assets; create tightly
  bounded production exports only after the master geometry is approved.

## Required Next Asset Set

1. ~~`fit-passport-mark-master.svg`~~ — **done 2026-08-27**
2. ~~`fit-passport-mark-reverse.svg`~~ — **done 2026-08-27**
3. ~~`fit-passport-mark-micro.svg`~~ — **done 2026-08-27**, with a measured floor:
   it holds to ~24 px and fails below 20 px
4. `fit-passport-lockup-horizontal.svg` — mark plus approved wordmark. **Blocked on
   choosing the wordmark typeface**; the app currently pairs the mark with an
   italic serif set in Fraunces, which is a placeholder, not a decision.
5. `fit-passport-lockup-stacked.svg` — same blocker
6. `fit-passport-mark-print.pdf` — a true vector PDF from the master. Not yet
   generated; no blocker beyond tooling
7. **Favicon — blocked on a drawing, not an export.** See "The size floor,
   measured": no thickening of this geometry survives 16 px. The app still ships
   the previous mark's `favicon.ico`.

Only after those monochrome assets pass size and background testing should the team
choose the permanent accent colour and begin motion or badge adaptation.

See [LOGO_CONCEPT.md](../../LOGO_CONCEPT.md) or
[LOGO_CONCEPT.zh-CN.md](../../LOGO_CONCEPT.zh-CN.md) for the full narrative,
symbolism, colour direction, motion concept, and application rules.
