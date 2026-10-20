# The closet page is over its JavaScript budget

**Found in Session 88c.** The R7 rule is every page at most 10% over its R0 First
Load JS. /closet's R0 baseline was **116 kB** (DEVLOG, Session 76 icons table), so
the cap is ~128 kB.

Measured with `npm run build`, 2026-10-06:

| | First Load JS |
|---|---|
| before Session 88c (earlier sessions' growth) | 132 kB |
| after 88c (photo sources, delete with undo, batch add, look-alike hint) | 135 kB |
| after 88e (in-place delete confirm, animated undo toast) | 136 kB |

Loading the batch panel on demand saved 0.1 kB — its parts (brand box, category
picker, photo sources) are on the page anyway — so it was not kept.

What could bring it back under: split `app/closet/page.tsx` (2,300+ lines, one client
bundle) so the detail sheet, the add flow and the folder view load when opened;
check what the shared chunk pulls in for this page (`ANALYZE`-style bundle report).

## /check is over too (found Session 97)

`npm run build`, 2026-10-08: **/check 125 kB** before Session 97's fit map, **126 kB** after.
Its R0 baseline was 108 kB (DEVLOG, Session 76), so the cap is ~119 kB. The last recorded
reading was 114 kB (Session 78b); the growth since came from later sessions, not one change.
The fit map adds 1 kB, since three.js and the 3D code load lazily. Same remedy as /closet:
split the 1,500-line page so the result's secondary cards load when shown.

Session 98a: /closet **140 kB** (the shared colour picker, the product-link check, the optional add step).
Session 98b: /closet **144 kB**, /outfits **132 kB**. The two-level type browser and its search words load on
demand. The 103-type list itself is in the shared chunk, because sizeSystems, GarmentIcon and the names read it.

## Done (Session 100)

/check **130 → 116 kB**, /closet **144 → 126 kB** (`next build`, First Load JS).
- `confidenceWeights.ts` is a leaf again. Its values had been re-exported from
  scoringConstants, which dragged the PROVENANCE registry onto every page that showed
  the promise. The registry itself moved to `scoringProvenance.ts`.
- /check: the converter, the listing forms, the ease diagram, the evidence guide, the
  fit map card, the source row and the judgement card are separate files loaded with
  `next/dynamic`.
- /closet: the add flow, the edit row, the detail sheet and batch add load when opened.
