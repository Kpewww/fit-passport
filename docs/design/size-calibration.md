# Size calibration: what the standards change, and how we know

Session 101e (2026-10-22). Code: `app-web/src/lib/regimeBacktest.test.ts`,
`brandCalibration.ts`, `/api/admin/calibration`, the "Brand calibration" panel on /admin.
Sources of every number: `size-regimes-sources.md`.

## 1. The same letter is not the same body

The body chest each standard, or each brand's own chart, gives for a letter, in cm:

| Men | Korea (KS K 0050 T14-1) | Japan (JIS L 4004 T16) | Europe (EN 13402-3 A.24) | Nike (brand chart) | Patagonia (brand chart) |
|---|---|---|---|---|---|
| S | — | 80–88 | 86–94 | 88.9–95.3 | 91.4–97.8 |
| M | 85–93 | 88–96 | 94–102 | 95.3–104.1 | 97.8–106.7 |
| L | 93–101 | 96–104 | 102–110 | 104.1–111.8 | 106.7–115.6 |
| XL | 101–108 | 104–112 | 110–118 | 111.8–123.2 | 115.6–123.2 |
| XXL | — | 112–120 (3L) | 118–130 | 123.2–135.9 | 123.2–134.6 |

| Women | Japan (JIS L 4005 T15) | Korea (KS K 0051 T14-1) | Europe (EN 13402-3 A.25) |
|---|---|---|---|
| S | 72–80 | 72–82 | 82–90 |
| M | 79–87 | 82–89 | 90–98 |
| L | 86–94 | 89–98 | 98–106 |
| XL | 93–101 | 98–109 | 106–118 |

- **The same letter differs by up to about 13 cm.** A men's M is 85–93 in Korea and
  97.8–106.7 at Patagonia: about one and a half sizes apart.
- **A letter read alone is usually one size off between Asia and the US.** This is why
  the founder's Muji XL was read as an American XL.
- **Grades.** Korea, Japan and Europe are grade A (standards). Nike and Patagonia are
  grade B (their own published charts, `brandCharts.ts`).

## 2. Backtest (SYNTHETIC)

**Setup.**
- **Wearers:** made-up men, chest 80–124 cm in 1 cm steps.
- **Their closet:** each owns one piece that fits, labelled the way the regime's
  standard would label their chest.
- **The check:** each checks a product carrying Nike's published body chart.
- **The right answer:** the Nike size whose own range holds their chest.
- **Before:** the piece placed by its letter only, which is the engine before Session
  101.
- **After:** the piece read by its standard into a chest estimate (`closetChest.ts`).

**Results.**

| Piece labelled by | Wearers | Right, before | Right, after | Within one size, before | Within one size, after |
|---|---|---|---|---|---|
| Japan (JIS) | 45 | 1 | 40 | 41 | 45 |
| Korea (KS; M–XL only) | 23 | 0 | 14 | 14 | 23 |
| Europe (EN) | 45 | 32 | 32 | 45 | 45 |

**What it shows.**
- Japanese and Korean letters were almost always one size off. Read by their
  standards, they are mostly right.
- European letters already sat close to Nike's, so nothing changed for them.
- The remaining misses are wearers near a size boundary. A piece only says "somewhere
  in this range", and the estimate takes the middle.

**What it does not show.** This is not an accuracy figure for real people. Real
garments drift from their standard (section 1 shows brands do), and wearers choose
looser or tighter fits. Only pilot outcomes (kept, returned, too big, too small) can
measure accuracy. The test runs in CI, so a regression in the mechanism fails the build.

## 3. Brand calibration (grade B, accumulating)

`brandCalibration.ts` measures how each brand's own charts sit against its country's
standard, in cm and in size steps.

**Where the charts come from.**
- Body charts already read from product pages during ordinary checks (`SizeOption`),
  plus the curated charts in `brandCharts.ts`.
- Nothing is fetched for calibration. A page that refused us was never read
  (`fetch-strategy.md` §2). Most US brands' size-guide pages answer 403 to a plain
  request (Columbia, Carhartt, Lands' End, Hanes, Gildan, AE, Wrangler: checked
  2026-10-22), so they arrive only through product pages, or by a person typing them
  in.

**Rules.**
- A brand is reported once it has charts from 2 or more distinct pages.
- Garment (flat) charts are excluded, because they make a different claim.
- **US letters.** ASTM defines none. A cross-brand consensus is formed per letter only
  once 3 or more US brands report it (`usLetterConsensus`). Until then a US letter is
  not converted. This is the honest gap that section 1's Nike/Patagonia rows show.

**Where to read it.** On /admin, under "Brand calibration".

**Wired in.** The engine uses the brand offsets since Session 101h (see 3b).

## 3b. Wired in (Session 101h)

**How it flows into a check:**
- A closet piece's label is read by its market's standard (`sizeRegimes.ts`).
- It is then shifted by its brand's own charts **for the same market**
  (`brandOffsets.ts`). The evidence becomes grade B, and the brand and page count are
  named.
- The piece is placed on the product's ladder by centimetres (`anchorIndexByBody`,
  `fitEngine.ts`), not by its letter.

**Markets.** A page's market is read from its address (`marketOf`: `/us/`, `.co.jp`…).
- The local data showed why this matters: uniqlo.com/us pages sat a full JIS step above
  JIS.
- So the US pages calibrate only US-bought pieces, and a JP-bought Uniqlo is untouched
  by them.

**Admin entry.** Brands' own guides can be typed in on /admin ("Enter a brand's size
guide"). Such a guide counts as official and brand-wide, so it needs no page minimum.

**Bottoms.**
- Waist is read by JIS Tables 15/16, KS K 0050/0051 Table 14-2, and a bottoms 号型
  (GB/T 1335 §3.2, §4.1.4).
- With no waist on file, closet bottoms give an estimate (`waistFromCloset`). It is
  capped like any estimated body.

## 4. Standards

Superseded by `sizing-standards-list.md` (Session 101g), which has every edition with its source and reason. It also drops the earlier unverified claim about DIN 61516.
