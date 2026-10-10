# The order, and why

Session 78 cleared the four items that did not need the benchmark to rank them
(body-chart confidence, category from the page, body waist, stated ranges and the
visible table). What remains:

| | Task | Blocked on |
|---|---|---|
| 03 | Size charts that are not `<table>` | A real capture of such a chart (see the file) |
| 07 | Closet photos out of the database | A Vercel Blob store the founder creates; needed before a real cohort |
| ~~08~~ | ~~Demo fixtures may hold body numbers in garment fields~~ — **done (Session 85c)**: Uniqlo now carries the real page's body chart; COS and Levi's demos use made-up links, so there is no page to check them against | — |
| ~~09~~ | ~~Re-capture the eval pages~~ — **done on this machine**: 9 captures (2026-09-29) are present and S5 runs; H&M and REI remain `people/02` | — |
| 10 | A size chart that is a picture inside a Taobao description | Picker built (Session 83); needs a real read and a real listing to check the 30-picture cap |
| 11 | Marketplaces' per-size 身高/体重 range as a weak signal | Design questions in the file |
| 12 | How far a seller's measurement can be off (`LISTING.flatNoiseCm`, assumed), and whether to read measuring photos | Listings with known garment measurements; a decision on photos |
| 13 | /closet (136 kB vs ~128 kB) and /check (126 kB vs ~119 kB) are over their JS budgets | Splitting the two pages — see the file |
| 14 | 3D try-on: the fit map on /check and /body are built (Sessions 97–98); next the 人台 / 写实 toggle on /check and the /outfits preview on the 3D body | The founder's review of /body |
| 15 | Realistic heads for /body: MetaHuman chosen (Session 98h); converter built and self-tested (`tools/metahuman/`) | Six exported faces: `people/07-metahuman-faces.md` |
