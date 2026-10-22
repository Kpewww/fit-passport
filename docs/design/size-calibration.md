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

**Not yet done.** The engine does not use the brand offsets yet. Wiring them in
(grade B, above the standard) is the next step, once enough brands pass the minimum.

## 4. Standards: the full list, found 2026-10-22

**Status key:**
- **In hand**: the founder has a copy.
- **Withdrawn**: the standard has been withdrawn, but it still describes older
  garments.
- **Not verified**: the status was not confirmed in an official catalogue.

### Body measurements to size (what the engine uses)

| Region | Number | Year | Scope | Status |
|---|---|---|---|---|
| China | GB/T 1335.1 | 2008 | Men 号型 | Current; in hand |
| China | GB/T 1335.2 | 2008 | Women 号型 | Current; in hand |
| China | GB/T 1335.3 | 2009 | Children 号型 | Current (reviewed 2025-05-30, continues); not in hand |
| Japan | JIS L 4001 | 2023 | Infants | Current; not in hand |
| Japan | JIS L 4002 | 2023 | Boys | Current; not in hand |
| Japan | JIS L 4003 | 2023 | Girls | Current; not in hand |
| Japan | JIS L 4004 | 2023 | Adult men | Current; in hand |
| Japan | JIS L 4005 | 2023 | Adult women | Current; in hand |
| Japan | JIS L 4006 | not verified | Foundation garments | Not verified |
| Japan | JIS L 4007 | not verified | Socks | Not verified |
| Korea | KS K 0050 | 2025 | Adult men | Current; in hand |
| Korea | KS K 0051 | 2025 | Adult women | Current; in hand |
| Korea | KS K 0052 | 2019 | Infants | Not verified |
| Korea | KS K 9400 | not verified | Boys (teen) | Not verified |
| Korea | KS K 0088 / KS K 0059 / KS K 0070 | not verified | Socks / hats / bras | Not verified |
| US | ASTM D6240/D6240M | 24a | Men 34–52 S/R/T | Current; in hand |
| US | ASTM D8077/D8077M | 16 (2022) | Mature big men 46–64 | In hand |
| US | ASTM D5585 | 21 | Misses 00–20 | Current; in hand |
| US | ASTM D7878/D7878M | 23 | Misses Petite 00P–20P | Current; in hand |
| US | ASTM D6960/D6960M | 16 (2023) | Plus women 14W–40W | In hand |
| US | ASTM D7197/D7197M | 21 | Misses maternity 2–22 | In hand (not used yet) |
| US | ASTM D6192/D6192M | 19 (2023) | Girls 2–20, plus | Current; not in hand |
| US | ASTM D6458/D6458M | 19 | Boys 2–20 | Current; not in hand |
| US | ASTM D6829 | 02 | Juniors 0–19 | Withdrawn 2024; not in hand |
| Europe | EN 13402-3 | 2017 | Body measurements and intervals (letters, Annex A) | Current at DIN; in hand |
| Europe | EN 13402-1 / -2 | 2001 / 2002 | Terms and measuring / primary dimensions | Partly replaced by ISO 8559 |
| UK | BS 3666 | 1982 | Women 8–32 | "Current, under review" at BSI; in hand |
| Germany | DIN 61516-1 / -2 | 1978 | "Control body dimensions for clothes" (principles / application) | Withdrawn; not in hand. Whether it defines the 44–56 numbers is NOT verified |
| Australia | AS 1344 | 1997 | Women | Withdrawn (2017 per Intertek; 2009 per one paper); not in hand |
| Australia | AS 1182 | 1997 | Infants and children | Not verified; not in hand |
| Russia | GOST 31399 | 2009 | Typical men's figures | Current per catalogues; not in hand |
| Russia | GOST 31396 | 2009 | Typical women's figures | Current per catalogues; not in hand |
| Brazil | ABNT NBR 16060 | 2012 | Men | Not verified; not in hand |
| Brazil | ABNT NBR 13377 | 1995 | Men, women, children (general) | Not verified; not in hand |
| Brazil | ABNT NBR 16933 | 2021 | Women (one mention) | Not verified |
| Mexico | NMX-A-182 | 1977 (DGN-A-182) | Body measurements | Not verified; may be superseded |
| Indonesia | SNI 2161 | 2010 | Men's T-shirts | Valid per BSN |
| Indonesia | SNI 3539 | 2010 | Men's shirts | Not verified |
| Indonesia | SNI 4656 / SNI 8362 | 2013 / 2016 | Women's trousers / underwear | Not verified |
| India | (INDIAsize charts, Textiles Committee) | 2026 | Men and women | A Textiles Committee document; no BIS number found |

### Definitions and method (no size tables)

| Region | Number | Year | Scope | Status |
|---|---|---|---|---|
| International | ISO 8559-1 | 2017 | Body measurement definitions | Current; in hand |
| International | ISO 8559-2 | 2017 | Primary and secondary dimensions | Withdrawn 2025-09-18, revised as ISO 8559-2:2025; 2017 copy in hand |
| International | ISO 8559-3 | 2018 | How to build body tables | Current |
| International | ISO 3635, 3636, 3637, 4416, 4417, 4418 | 1977–1981 | Old size designation | Withdrawn |

**Gaps worth closing, in order of what they unlock:**
1. **US brand charts for letters** (no standard exists). These come through product
   pages, or a person entering them by hand.
2. **Italian/French men's numbers (44–56).** No current standard is known to define them; EN 13402-3 replaced the national systems. Read them from luxury brands' own guides (grade B), not from DIN 61516, whose content is unverified.
3. **GB/T 1335.3 and JIS L 4001–4003.** Children.
4. **GOST 31399/31396.** Russian sizes, only if the pilot reaches there.

Sources for the status claims:
- [ASTM D13.55](https://www.astm.org/membership-participation/technical-committees/committee-d13/subcommittee-d13/jurisdiction-d1355)
- [Boken (JIS 2023)](https://www.boken.or.jp/knowledge/fiber/size/42996/)
- [JSA L 4001:2023](https://webdesk.jsa.or.jp/books/W11M0090/index/?bunsyo_id=JIS+L+4001%3A2023)
- [GB/T 1335.3-2009](https://openstd.samr.gov.cn/bzgk/std/newGbInfo?hcno=71B55A431E3A4A6DB41406EF9EEA122A)
- [KS K 0050](https://www.kssn.net/search/stddetail.do?itemNo=K001010123915)
- [KS K 0051](https://www.kssn.net/search/stddetail.do?itemNo=K001010123908)
- [ISO/TC 133](https://www.iso.org/committee/52374/x/catalogue/)
- [ISO 8559-2](https://www.iso.org/standard/64075.html)
- [DIN EN 13402-3](https://www.dinmedia.de/en/standard/din-en-13402-3/269491924)
- [AS 1344](https://www.intertekinform.com/en-gb/standards/as-1344-1997-127936_saig_as_as_270395/)
- [GOST 31396](https://en.gostinfo.ru/catalog/Details/?id=4577406)
- [GOST 31399](http://docs.cntd.ru/document/gost-31399-2009)
- [ABNT](https://www.redalyc.org/journal/5140/514054176010/html/)
- [Mexico DGN-A-182](https://dof.gob.mx/nota_detalle.php?codigo=4632327&fecha=06%2F07%2F1977)
- [BSN SNI](https://pesta.bsn.go.id/produk/by_ics/2?ics_no=61&key=)
- [India Textiles Committee](https://textilescommittee.gov.in/wp-content/uploads/2026/09/Standard-_Standard-Body-Measurement-Size-Charts-and-Apparel-Size-Labeling-for-Indian-Male-and-Female-1.pdf)
- [DIN 61516-1](https://www.dinmedia.de/en/standard/din-61516-1/783070)
