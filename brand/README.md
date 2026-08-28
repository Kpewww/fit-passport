# Fit Passport Logo Asset Manifest

> **These are build inputs, not documentation.** They moved out of
> `docs/design/assets/logo/` in Session 59 because the app renders from them:
> `app-web/src/components/Logo.tsx` carries the master's path, and
> `src/lib/logoAsset.test.ts` fails if the two ever drift. The written story
> behind the mark stays in [docs/design/LOGO_CONCEPT.md](../docs/design/LOGO_CONCEPT.md).

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
| `fit-passport-mark-favicon.svg` | A **different, simplified glyph** on a 16-unit grid, 2-unit stroke | 16–20 px: favicons, app icons, anywhere below the micro floor | **Production** |
| `fit-passport-mark-favicon-reverse.svg` | Same glyph, explicit white | Dark browser chrome and dark app icons | **Production** |
| `fit-passport-mark-black-transparent.svg` | 1024 × 1024 viewBox; two vector paths | Figma import, light-background web prototypes, vector reconstruction reference | **Best current vector source, cleanup required** |
| `fit-passport-mark-black-transparent.png` | 1024 × 1024 RGBA | Documents, decks, social/profile mockups, rapid prototypes | Ready for light backgrounds |
| `fit-passport-mark-black-on-white.svg` | 1024 × 1024 viewBox; white background path plus black mark path | White-background layouts and reconstruction reference | Vector, but not the canonical master |
| `fit-passport-mark-black-on-white.png` | 1024 × 1024 RGB | Documents and systems that require a flattened white background | Ready for white backgrounds |
| `source-exports/fit-passport-mark-black-transparent-export.pdf` | One 768 × 768 pt page containing a 2048 × 2048 RGB JPEG | Archive/reference and simple placement workflows | **Flattened white; not transparent or vector** |
| `source-exports/fit-passport-mark-black-on-white-export.pdf` | One 768 × 768 pt page containing a 2048 × 2048 RGB JPEG | Archive/reference and simple placement workflows | **Raster PDF; not a vector print master** |

## Supplied "fixed" SVG, 2026-08-27 — it is a bitmap, not a repair

A replacement `FP_logo_trans_back 1.svg` was supplied as a corrected vector. It is
not. It contains **zero paths**: one `<rect>` filled by a `<pattern>` that
references an embedded 1024x1024 RGBA PNG. 146 KB of SVG wrapper around a raster,
against 5 KB for the genuine vector it was meant to replace.

**And the bitmap inside it is not new artwork.** Its SHA-256 is byte-for-byte
identical to `fit-passport-mark-black-transparent.png`, already in this directory.
So there is no smoother redraw to adopt - the pixels are the ones we already had.
The accompanying PDF is likewise still a JPEG placement, not vector.

Both are kept in `source-exports/` under names that say what they are. **Do not
use either to generate variants.** The canonical geometry remains
`fit-passport-mark-master.svg`, which was derived from the original *real* vector.

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
7. ~~Favicon~~ — **unblocked and done 2026-08-27.** A simplified glyph was drawn
   (`fit-passport-mark-favicon.svg`): one continuous line that curves over, loops
   and descends, keeping the thread's signature and dropping everything the size
   cannot hold. On a 16-unit grid with a 2-unit stroke, so edges land on pixel
   boundaries instead of averaging to grey. The 16 px PNG is **404 bytes**; the
   supplied raster concept it is based on was 10,197 bytes and had no vector
   source, so it could not produce the 32 / 48 / 180 sizes browsers also ask for.
   Shipped as `app-web/src/app/{favicon.ico,icon.svg,apple-icon.png}`.

Only after those monochrome assets pass size and background testing should the team
choose the permanent accent colour and begin motion or badge adaptation.

See [LOGO_CONCEPT.md](../docs/design/LOGO_CONCEPT.md) or
[LOGO_CONCEPT.zh-CN.md](../docs/design/LOGO_CONCEPT.zh-CN.md) for the full narrative,
symbolism, colour direction, motion concept, and application rules.


## Palette — settled 2026-08-27

The logo system originally named **Warm Ivory `#F3EFE7`** as the light ground while
the app runs on **cool porcelain `#F3F3F1`**. Two systems disagreeing is worse than
either choice, so it is decided: **`#F3F3F1` (Cool Porcelain) wins.** Warm Ivory is
retired; if you find it in a logo document it is stale.

The mark is monochrome and inherits `currentColor`, so this changes nothing about
the geometry - only the ground it is tested and presented on. `tests/size-test.mjs`
tests against `#F3F3F1`.
