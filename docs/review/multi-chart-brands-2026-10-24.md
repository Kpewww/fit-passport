# Multi-chart brand survey, 2026-10-24 — PARTIAL

43 guide files across 19 brands (excluding `_example.json`); 39 inherited and 4 new. Counts below describe repository coverage, not a complete brand catalog. Existing guides were not silently broadened or re-reviewed. All four new files use `reviewed:false` and `variant:general`; only jacket charts specify `appliesTo:["jacket"]`. Nike's regular men's tops chart covers tops generally. Tall/Slim/Petite/Big variants were excluded. Product-popup equivalence remains unverified unless explicitly stated.

Research used signed-out official pages in the user's Chrome. Columbia's CAPTCHA was skipped. Full raw page dumps were discarded to avoid retaining unrelated navigation/session links. Sources for inherited charts are in their JSON; screenshots below support the newly added charts and selected blockers. No exhaustive all-product search was completed, so D remains partial.

| Brand | Files and covered scope | Observed distinctions / conflicts | Missing coverage and reason |
|---|---|---|---|
| Abercrombie & Fitch | 2: men's/women's product tops, body | Men's sweater popup says Tops, regular M chest 37.5–40.5 in; Tall is separate length | Women's and other category/product comparisons not completed |
| Banana Republic | 2: men's general jacket; women's general tops | Men's regular Outerwear chart accessible; Tall/Japan options separate | Shirts selection did not yield a confidently verified changed table; other categories pending |
| Burberry | 2: men's/women's product sweater, body | Men's polo-linked popup explicitly titled Men's Knitwear; retained knitwear scope (M chest 38.6 in) | Other categories and women's current popup not verified |
| Calvin Klein | 2: general men's/women's tops, body | Main men's shirt/jacket ranges match outerwear/sweater/T-shirt ranges. Jeans subfamilies differ: M chest 41 or 42; Est1978 unisex top 46 / outerwear 48 | Additional family charts need explicit body/garment evidence and scope before import; women's comparison pending. Slim/ultraslim excluded |
| Columbia | 2: general men's/women's tops, body | Official size-fit page exposed categories then Press & Hold CAPTCHA | Stopped at CAPTCHA; no bypass. Category tables not captured |
| Everlane | 2: men's/women's product T-shirt, body | Men's Archive Long-Sleeve Crew popup matches existing regular body ranges (M 38–40 in), despite relaxed product description | Women's and other garment families not verified |
| Gap | 5: general men/women; product regular men/women; women's unisex | Existing general/product differences retained from upstream | Current landing initially showed Boys; adult switch not conclusively verified. No fresh adult equivalence claim |
| Gucci | 2: general men/women, body | Landing distinguishes men's Shirts & Tops and women's Dresses & Tops; singleton chest values | No separate category charts on inspected landing; product-popup comparisons pending |
| J.Crew | 3: general men/women tops plus NEW men's jacket | Outerwear XS–XXL matches overlapping Tops values; Tops additionally has XXXL. Different category/extent retained | Women's/category product comparisons pending. Tall excluded |
| L.L.Bean | 2: general men/women tops, body | Regular men's M chest 38–40; women's regular distinct from Petite/Plus/Tall | No distinct regular category table observed on landing; product popup comparisons pending |
| Levi's | 2: general men/women tops, body | Men's ranges vs women's singleton measurements; regular women's M chest 37 in | No separate category chart observed on landing; product comparisons pending. Big/Tall/Plus excluded |
| Madewell | 1: general women's tops, body | Tops/dresses overlap numerically but size-label correspondence differs (00/XS vs 00/XXS) | Exact label/family mapping needs verification before dedup/import; Petite/Plus/Short/Tall excluded |
| Moncler | 4: general men/women tops plus NEW men/women jacket | Outerwear uses native numeric Moncler labels; tops use alpha labels. Preserve native labels rather than US aliases | Product-specific equivalence unverified; no numeric-label/alpha-label contradiction inferred |
| Nike | 1 NEW: general men's tops, body | Regular XXS–4XL with chest/waist ranges; Tall repeats girth but adds length | Women's/unisex and product chart comparison still pending |
| Patagonia | 3: general men/women plus men's product tops, body | Inherited general/product discrepancies retained (e.g. men's S 37 vs 38–39 in) | Current landing reached; complete product and women's comparison not finished |
| Ralph Lauren | 2: men's product polo garment; women's product body | Men's popup says Body Measurements yet includes back length/shoulder/sleeve and M chest44. Existing garment classification preserved | Wording conflict requires human review; women's/other categories pending |
| Saint Laurent | 2: men's product shirt; women's product tops, body | Product page reached country welcome dialog | Chart not opened this run; current product/category coverage unverified |
| Tommy Hilfiger | 2: general men/women tops, body | Men's multiple tables differ: polo M40, regular dress shirt M47, outerwear M38.5–40.1, suiting M42–43.5 in | Need body/garment evidence and family scope before import; women's pending. Slim/Athletic/Tall excluded |
| Under Armour | 2: general men/women tops, body | Men's regular chart MD37–41 in; compression/fitted descriptions do not supply distinct numeric charts; Tall adds length | Women's/product comparison pending |

## New chart evidence

Paths below are relative to `app-web/data/brand-guides/`.

| New guide | Official source | Screenshot evidence | Dedup/scope decision |
|---|---|---|---|
| `nike-mens.json` | https://www.nike.com/size-fit/mens_tops_alpha | `screenshots/nike-mens.jpg`, `nike-mens-middle.jpg`, `nike-mens-right.jpg` in same folder | New brand; body wording explicit. Regular rows only; hip/height omitted from schema |
| `jcrew-mens-outerwear.json` | https://www.jcrew.com/r/size-charts | `screenshots/jcrew-mens-outerwear.jpg` | Separate jacket scope and missing XXXL distinguish it from inherited Tops. Measuring quote retained from existing same-source guide |
| `moncler-mens-outerwear.json` | https://www.moncler.com/en-us/client-service/size_guide | `screenshots/moncler-mens-outerwear.jpg` | Native numeric labels 00–8; jacket-only body chart |
| `moncler-womens-outerwear.json` | https://www.moncler.com/en-us/client-service/size_guide | `screenshots/moncler-womens-outerwear.jpg` | Native numeric labels 000–7; jacket-only body chart |

Additional research evidence: `brand-audit-2026-10-24/abercrombie-chart.jpg` and `brand-audit-2026-10-24/columbia-blocked.jpg`. These are not extension screenshots. New guides require human review; no uncertain Calvin Klein/Tommy/Madewell chart was converted into purported verified data.
