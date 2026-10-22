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

## Grade A, still to obtain

| Region | Standard | Would give |
|---|---|---|
| Japan | JIS L 4004:2023, JIS L 4005:2023 | men's/women's letter and 号数 sizes → body |
| Korea | KS K 0050, KS K 0051 (latest) | men's/women's 85–110 sizes → body |
| United States | ASTM D6240/D6240M-24a, ASTM D5585 (latest) | men's chest sizes; women's Misses 00–20 |
| Australia | AS 1344-1997 | women's 6–24 |
| International | ISO 8559-2:2017 | primary dimensions for size labels |

Until then a Japanese, Korean, US, Chinese-letter or Australian label has no body range,
and the engine says so rather than guessing.

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
