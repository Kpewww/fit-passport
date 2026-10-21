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

Each brand's country is its country of origin (P495), else its country (P17), else its
headquarters' country. A brand with no country is left out.

- **First build** (2026-10-21): 4,604 brands.
- **Still to do**:
  - the 6,000+ target;
  - better coverage of Chinese, Japanese and Korean brands;
  - filtering out a few non-fashion items (e.g. Snap Inc.).

## Grade B: brand guides, in batches

Not started. Each brand guide is to be recorded in `brandCharts.ts`, the same way as
the Nike and Patagonia guides already there (address and date read).
