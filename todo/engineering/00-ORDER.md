# The order, and why

Session 78 cleared the four items that did not need the benchmark to rank them
(body-chart confidence, category from the page, body waist, stated ranges and the
visible table). What remains:

| | Task | Blocked on |
|---|---|---|
| 03 | Size charts that are not `<table>` | A real capture of such a chart (see the file) |
| 07 | Closet photos out of the database — **built (Session 100d)** | The Blob store: `people/08-blob-store.md` |
| ~~08~~ | ~~Demo fixtures may hold body numbers in garment fields~~ — **done (Session 85c)**: Uniqlo now carries the real page's body chart; COS and Levi's demos use made-up links, so there is no page to check them against | — |
| ~~09~~ | ~~Re-capture the eval pages~~ — **done on this machine**: 9 captures (2026-09-29) are present and S5 runs; H&M and REI remain `people/02` | — |
| 10 | A size chart that is a picture inside a Taobao description | Picker built (Session 83); needs a real read and a real listing to check the 30-picture cap |
| ~~11~~ | ~~Marketplaces' per-size 身高/体重 range as a weak signal~~ — **done (Session 100)**: `sellerBodyRanges` + `scoreSellerRange`; the height × weight lookup grid is still unread | — |
| 12 | How far a seller's measurement can be off (`LISTING.flatNoiseCm`, assumed), and whether to read measuring photos | Listings with known garment measurements; a decision on photos |
| ~~13~~ | ~~/closet and /check over their JS budgets~~ — **done (Session 100)**: /check 116 kB, /closet 126 kB after splitting | — |
| 14 | 3D try-on: the fit map on /check and /body (Sessions 97–98); the 人台 / 写实 toggle on /check and the /outfits 3D preview (Session 100). Nothing open but realistic heads (15) | — |
| 15 | Realistic heads for /body: MetaHuman chosen (Session 98h); converter built and self-tested (`tools/metahuman/`) | Six exported faces: `people/07-metahuman-faces.md` |
| 16 | Before real users: what a walk through the live site found — **all fixed (Sessions 100d–e)** but the Blob store | — |
