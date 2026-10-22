# Size regimes: where every number comes from

Session 101 (2026-10-21). Code: `app-web/src/lib/sizeRegimes.ts`, `closetChest.ts`,
`brandRegistry.ts`, `data/brandRegistry.json`.

## Evidence grades

| Grade | What | Cited as |
|---|---|---|
| A | A national or international standard | standard number + table or clause |
| B | A brand's own published size guide | address + date read |
| C | A public dataset fact (a brand's country) | Wikidata QID |
| D | Fit Passport's own outcome reports, per brand, past a minimum count | (not yet used) |

Third-party size-chart sites are never evidence. Checked 2026-10-21: for Gucci IT 48,
size.ly gives chest 101 cm and italist gives 120 cm. They may point to where a brand's
own guide is, nothing more. tailorsizeguide.com (2026-10-21) cites no source for its
conversions and reserves all rights, so it is not used either.

## Grade A, in hand

The founder supplied these copies on 2026-10-21. They are copyrighted and are NOT in
this repository. Only individual values are cited, with their table or clause.

| Standard | Used for | Where |
|---|---|---|
| GB/T 1335.1-2008 服装号型 男子 | 号型 "175/96A": 型 is the body chest (tops) or waist (bottoms), net body; chest graded in 4 cm steps, so ±2 cm | §3.2, §4.1.3, §4.3 |
| GB/T 1335.2-2008 服装号型 女子 | the same for women | §3.2, §4.1.3 |
| EN 13402-3:2017 (DIN EN 13402-3:2017-12, English translation) | letter size → body chest range, men: XXS 70–78, XS 78–86, S 86–94, M 94–102, L 102–110, XL 110–118, XXL 118–130, 3XL 130–142 | Annex A (informative), Table A.24 |
| EN 13402-3:2017 | letter size → body bust range, women: XXS 66–74, XS 74–82, S 82–90, M 90–98, L 98–106, XL 106–118, XXL 118–130, 3XL 130–142 | Annex A, Table A.25 |

The EN tables are "examples" a country or company may adopt (§5.3.1, A.1). A reason built
on them says "European standard example". They are applied to brands of CEN member
countries only (the member list on the standard's cover page), and to tops only.

GB/T 1335 defines 号型, not letter sizes: a Chinese brand's "XL" has no grade A meaning.

## Grade A, read in Session 101d (2026-10-22)

The founder supplied these copies; they are not in this repository. All except KS are
scans, so every value was read from a rendered page image and checked.

| Standard | Used for | Where |
|---|---|---|
| JIS L 4004:2023 | Japanese men's letters, by chest: SS 72–80, S 80–88, M 88–96, L 96–104, LL (XL) 104–112, 3L 112–120, 4L 120–128, 5L 128–136 | Table 16 |
| JIS L 4005:2023 | Japanese women's letters, by bust: SS 65–73 … 6L 121–129 | Table 15 |
| JIS L 4005:2023 | women's 号数 3–21, by bust: 74, 77, 80, 83, 86, 89, 92, 96, 100, 104 | Tables 1, 2, 12 |
| KS K 0050:2025 | Korean men's numbers (the number is the chest, 80–110); letters M 85–93, L 93–101, XL 101–108 | Tables 10, 14-1 |
| KS K 0051:2025 | Korean women's numbers (75–105); letters S 72–82, M 82–89, L 89–98, XL 98–109 | Tables 9, 14-1 |
| ASTM D6240/D6240M-24a | US men's chest sizes 34–52: the size is the chest in inches. No letter sizes | Table 1 |
| ASTM D8077/D8077M-16(2022) | US big men 46–64, the same rule | Table 2 |
| ASTM D5585-21 | US Misses 00–20, bust cm (00 79.06 … 20 116.84) | Table 2 |
| ASTM D7878/D7878M-23 | US Petite 00P–20P: the same busts as D5585 | Table 2 |
| ASTM D6960/D6960M-16(2023) | US Plus 14W–40W, bust cm (14W 105.41 … 40W 170.18) | Table 2 |
| BS 3666:1982 | UK women's 8–32, bust from–to (8 78–82 … 32 135–139) | Table 1 |

**How the tables become ranges.** Where a table gives one value per size (the KS
numbers, the JIS 号数, the ASTM tables), the range reaches halfway to each neighbouring
size. Where it gives ranges, they are used as printed.

**In the folder but not used:**
- **ISO 8559-1:2017 and ISO 8559-2:2017.** These define how to measure the body and
  which dimensions a label states. They hold no size tables.
- **ASTM D7197-21 (maternity).** It is not yet used.
- **ISO/ASTM 52951:2026.** It is an additive-manufacturing standard, unrelated to
  clothing.

## Grade A, still missing

| Region | Standard | What it would give |
|---|---|---|
| Australia | AS 1344-1997 | women's sizes |
| United States | ASTM D6829 (withdrawn 2024) | juniors, for older garments |
| Germany | DIN 61516-1, DIN 61516-2 (withdrawn) | European men's numbers 44–56, which most luxury houses use |

**Still no standard meaning, for any edition:**
- **A Chinese letter size.** GB/T 1335 defines only 号型.
- **A US letter size.** ASTM defines chest numbers only.

These can only come from brand guides (grade B).

## Grade C: the brand registry

`app-web/scripts/brands/build-registry.mjs` builds `data/brandRegistry.json`:
- **From Wikidata (CC0)**: fashion labels, fashion houses, clothing brands and clothing
  store chains, plus items whose industry or product is clothing, fashion, footwear,
  sportswear or luxury goods.
- **From OpenStreetMap's name-suggestion-index (BSD-3-Clause)**: the brand QIDs of
  clothes, shoes, sports, accessories and department-store shops.

- **From Wikipedia categories** (Session 101b): the clothing, fashion, sportswear and
  shoe brand categories of the English, Chinese, Japanese and Korean Wikipedias. Only
  the member articles' QIDs are taken.
- **From Wikidata descriptions** ("clothing brand", "服装品牌", "ファッションブランド",
  "패션 브랜드"…).
- **From trade classifications** (clothing wholesale, textile industry): only items with
  a Wikipedia article or an official website.

**Country.** Each brand's country is, in order:
1. its country of origin (P495);
2. its country (P17);
3. the country of its headquarters (P159) or of where it was founded (P740);
4. for a category member with none of these, the country its category names. These
   rows carry `countryFrom: "category"`.

A brand with no country is left out.

**Filtering.** Members found only through categories, products or trade classes are
dropped when their class or industry is plainly not clothing (hotels, champagne,
jewellery, cars, electronics…). The test is a regex on the English labels of their
P31 and P452.

**Sampled after filtering (2026-10-21):** there is still some noise (a watchmaker, a
golf club). The registry is only used to find a brand's country, so a wrong row costs
one brand's regime.

**Build history:**

| Build | Brands | Notes |
|---|---|---|
| 1 | 4,604 | Wikidata and OSM only |
| 2 | 7,058 | CN 157, HK 61, JP 489, KR 146, IT 378, FR 547, US 1,659 |

## Grade B: brand guides, in batches

Not started. Each brand guide is to be recorded in `brandCharts.ts`, the same way as
the Nike and Patagonia guides already there (address and date read).
