# Multi-chart brand survey, 2026-10-24 — PARTIAL

55 guide files across 19 brands (excluding `_example.json`); 39 inherited and 16 new. Counts below describe repository coverage, not a complete brand catalog. Existing guides were not silently broadened or re-reviewed. All new files use `reviewed:false` and an explicit `variant` and category scope where applicable. The added Burberry numeric chart is product-sourced; other new charts are general. Nike regular tops cover tops generally. Tall/Slim/Petite/Big variants were excluded. Product-popup equivalence remains unverified unless explicitly stated.

Research used signed-out official pages in the user's Chrome. Columbia's CAPTCHA was skipped. Full raw page dumps were discarded to avoid retaining unrelated navigation/session links. Sources for inherited charts are in their JSON; screenshots below support the newly added charts and selected blockers. No exhaustive all-product search was completed, so D remains partial.

| Brand | Files and covered scope | Observed distinctions / conflicts | Missing coverage and reason |
|---|---|---|---|
| Abercrombie & Fitch | 2 product tops, men/women | Both current product popups verified: general Tops body ranges match existing files; women unisex-marketed crew explicitly uses women sizing | Other product-category sampling remains unfinished; no access block |
| Banana Republic | 4: existing men jacket/women tops; NEW men shirts/sweaters and women jacket | Category selector resolved. Men chest overlaps but shirt waist differs from outerwear from M up. Women outerwear differs from Tops in bust, waist and extent | Men blazer screen supplies availability labels only, not independent regular measurement rows; Japan-only table excluded. Product popup comparisons unfinished |
| Burberry | 3: men/women alpha knitwear; NEW women numeric knitwear | Both product modals verified. Women numeric and alpha measurements differ even where CN labels match; preserved separately, no inferred conversion | Other garment-category product sampling unfinished, not site-blocked |
| Calvin Klein | 5: men/women general; NEW women activewear, sweater/Jeans tops, outerwear | Women body guidance verified. Mainline tees/shirts identical; Jeans tees/shirts match mainline sweater; Jeans/mainline outerwear identical. Deduplicated. Men classic families still differ | Men Jeans/Est1978 lack sufficiently specific chest body/garment evidence; mainline body quote cannot safely be transferred. Product comparisons unfinished |
| Columbia | 2: general men's/women's tops, body | Official size-fit page exposed categories then Press & Hold CAPTCHA | Stopped at CAPTCHA; no bypass. Category tables not captured |
| Everlane | 2 product tees, men/women | Both current product popups match existing rows. Relaxed/box-cut product styling does not change printed body chart | Other product categories unfinished; no access block |
| Gap | 5: general men/women; product regular men/women and women unisex | Adult selection resolved; general Men Tops & Outerwear and Women Tops/Outerwear/Dresses rechecked. Existing general/product differences retained | Additional product-category sampling unfinished; no access block |
| Gucci | 2: general men/women, body | Landing distinguishes men's Shirts & Tops and women's Dresses & Tops; singleton chest values | No separate category charts on inspected landing; product-popup comparisons pending |
| J.Crew | 3: men/women Tops plus men jacket | Women Outerwear & Blazers matches Tops rows; Men Suiting matches Outerwear rows. Notes record dedup. Men Tops adds XXXL | General upper-body menu categories checked; product-popup comparisons unfinished |
| L.L.Bean | 2: general men/women tops, body | Regular men's M chest 38–40; women's regular distinct from Petite/Plus/Tall | No distinct regular category table observed on landing; product popup comparisons pending |
| Levi's | 2: general men/women tops, body | Men's ranges vs women's singleton measurements; regular women's M chest 37 in | No separate category chart observed on landing; product comparisons pending. Big/Tall/Plus excluded |
| Madewell | 1 women Tops | Tops chart matches existing exact labels, including duplicated 0 / XS. Dresses has different labels but is outside requested upper-garment category schema | No additional regular Tops category chart on guide; product comparison unfinished. Petite/Plus/Short/Tall excluded |
| Moncler | 4: general men/women tops plus NEW men/women jacket | Outerwear uses native numeric Moncler labels; tops use alpha labels. Preserve native labels rather than US aliases | Product-specific equivalence unverified; no numeric-label/alpha-label contradiction inferred |
| Nike | 2 NEW general tops, men/women | Women regular XXS–XXL added. NBA/WNBA jersey table observed with different XS chest/waist; explicit body wording | Jersey page does not specify mens/womens line and schema lacks unisex: not assigned by guess. Further product/sport chart sampling unfinished |
| Patagonia | 3: general men/women plus men product | Women general table rechecked; Better Sweater product modal exactly matches it, so no duplicate added. Inherited men general/product difference retained | Other product families unfinished; current women comparison resolved |
| Ralph Lauren | 2: men polo garment; women body | Women current modal matches existing Clothing body table; no separate Product tab exposed. Men wording/garment-dimension conflict retained | Men classification needs human review; other product-family sampling unfinished |
| Saint Laurent | 2 product charts: men shirt, women Ready to Wear | Country selector was ordinary navigation, now completed. Both body tables match existing rows | No access gate remains; other men garment-category sampling unfinished |
| Tommy Hilfiger | 7: existing men/women mainline; NEW men Jeans Tops, regular Dress Shirts, Outerwear, Suit Blazers; women Jeans Tops/Outerwear | Body wording explicitly repeated per category. Prior polo label corrected to Tommy Jeans Tops. Women Jeans Tops and Outerwear identical, deduplicated. Outerwear 4XL/5XL jumps preserved and flagged | Unisex table prints repeating fractions (e.g. 31 1/9) that cannot be copied exactly into finite JSON numbers; not rounded. Loungewear/underwear excluded from this outer-clothing pass. Product comparisons unfinished |
| Under Armour | 2 general tops, men/women | Both guides checked. One numeric table per gender; fit descriptions vary without separate numeric charts. Tall adds length; Plus excluded | No additional regular category table on inspected guides; product comparisons unfinished |

## New chart evidence

Paths below are relative to `app-web/data/brand-guides/`.

| New guide | Official source | Screenshot evidence | Dedup/scope decision |
|---|---|---|---|
| `nike-mens.json` | https://www.nike.com/size-fit/mens_tops_alpha | `screenshots/nike-mens.jpg`, `nike-mens-middle.jpg`, `nike-mens-right.jpg` in same folder | New brand; body wording explicit. Regular rows only; hip/height omitted from schema |
| `jcrew-mens-outerwear.json` | https://www.jcrew.com/r/size-charts | `screenshots/jcrew-mens-outerwear.jpg` | Separate jacket scope and missing XXXL distinguish it from inherited Tops. Measuring quote retained from existing same-source guide |
| `moncler-mens-outerwear.json` | https://www.moncler.com/en-us/client-service/size_guide | `screenshots/moncler-mens-outerwear.jpg` | Native numeric labels 00–8; jacket-only body chart |
| `moncler-womens-outerwear.json` | https://www.moncler.com/en-us/client-service/size_guide | `screenshots/moncler-womens-outerwear.jpg` | Native numeric labels 000–7; jacket-only body chart |

Additional research evidence: `brand-audit-2026-10-24/abercrombie-chart.jpg` and `brand-audit-2026-10-24/columbia-blocked.jpg`. These are not extension screenshots. New guides require human review; no uncertain Calvin Klein/Tommy/Madewell chart was converted into purported verified data.

## Follow-up evidence and genuine remaining gaps

The follow-up resolved previously unfinished selections and added 12 more guides (16 new in total). New files and screenshots are listed exactly in changed-files-2026-10-24.txt. All remain unreviewed. Per-chart source URLs, verbatim body wording, scope, exclusions and dedup notes are in JSON. Research screenshots in brand-audit-2026-10-24 now also show verified duplicate tables and rechecked product modals.

Confirmed access blocker: Columbia Press & Hold CAPTCHA (columbia-blocked.jpg), not retried. Evidence/schema blockers: CK men Jeans/Est1978 chest classification; Nike NBA/WNBA missing explicit mens/womens line; Tommy unisex repeating fractions. Banana Republic men blazer availability grid contains size labels rather than independent regular measurement rows; no numbers inferred (banana-republic-blazer-labels-only.jpg).

These blockers do not explain every remaining gap. Product comparisons for brands represented only by general pages (Gucci, L.L.Bean, Levi's, Moncler and others), and other garment-family samples on product-only sources, are still unfinished research. No claim is made that all such pages are inaccessible or that all distinct tables have been exhausted. D remains PARTIAL. The existing PR must retain that status.
