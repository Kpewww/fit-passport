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

