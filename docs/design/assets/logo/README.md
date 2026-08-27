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
| `fit-passport-mark-black-transparent.svg` | 1024 × 1024 viewBox; two vector paths | Figma import, light-background web prototypes, vector reconstruction reference | **Best current vector source, cleanup required** |
| `fit-passport-mark-black-transparent.png` | 1024 × 1024 RGBA | Documents, decks, social/profile mockups, rapid prototypes | Ready for light backgrounds |
| `fit-passport-mark-black-on-white.svg` | 1024 × 1024 viewBox; white background path plus black mark path | White-background layouts and reconstruction reference | Vector, but not the canonical master |
| `fit-passport-mark-black-on-white.png` | 1024 × 1024 RGB | Documents and systems that require a flattened white background | Ready for white backgrounds |
| `source-exports/fit-passport-mark-black-transparent-export.pdf` | One 768 × 768 pt page containing a 2048 × 2048 RGB JPEG | Archive/reference and simple placement workflows | **Flattened white; not transparent or vector** |
| `source-exports/fit-passport-mark-black-on-white-export.pdf` | One 768 × 768 pt page containing a 2048 × 2048 RGB JPEG | Archive/reference and simple placement workflows | **Raster PDF; not a vector print master** |

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

The next design pass should produce:

1. `fit-passport-mark-master.svg` - a clean, tightly bounded, single-colour vector
   master with no background and no white correction objects;
2. `fit-passport-mark-reverse.svg` - a deliberate white mark for dark grounds;
3. `fit-passport-mark-micro.svg` - an optically adjusted version for 16–32 px use;
4. `fit-passport-lockup-horizontal.svg` - mark plus approved wordmark;
5. `fit-passport-lockup-stacked.svg` - stacked mark and wordmark;
6. `fit-passport-mark-print.pdf` - a true vector PDF generated from the cleaned
   master;
7. favicon and PNG exports generated from the micro/master SVGs rather than traced
   independently.

Only after those monochrome assets pass size and background testing should the team
choose the permanent accent colour and begin motion or badge adaptation.

See [LOGO_CONCEPT.md](../../LOGO_CONCEPT.md) or
[LOGO_CONCEPT.zh-CN.md](../../LOGO_CONCEPT.zh-CN.md) for the full narrative,
symbolism, colour direction, motion concept, and application rules.
