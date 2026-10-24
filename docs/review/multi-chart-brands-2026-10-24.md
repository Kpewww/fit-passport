# Multi-chart brand survey, 2026-10-24

66 guide files across 19 brands (excluding _example.json): 39 inherited and 27 new. The finite follow-up comparison list is now investigated, with supported outcomes and limitations below. This is representative category-family coverage, not an exhaustive SKU catalog or a claim that inaccessible/ambiguous charts are complete. D remains qualified by the listed access, UI and measurement/schema blockers; B/C remain blocked.

All new guides are reviewed:false, with no human reviewer signature. Official source URLs, exact measurement evidence, variant and applicable categories are in each JSON. Tall/Slim/Petite/Big variants were not imported. Numeric equality is deduplicated; ambiguous classification and repeating fractions were not guessed. Retailer research stayed signed out in the user’s Chrome.

| Brand | Files | Compared scope / outcome | Remaining limitation |
|---|---:|---|---|
| Abercrombie & Fitch | 2 | Men sweater/classic shirt; women sweatshirt/jacket share Tops tables | Matched; Tall height variant excluded |
| Banana Republic | 5 | General men shirts vs jackets differ; product men shirt/jacket match respective general. Women product shirt differs general; new file | Men blazer availability grid has no independent measurements; women general outerwear retained |
| Burberry | 4 | Men Shirts numeric new; alpha equals Knitwear. Women Shirts numeric/alpha equal Knitwear. Jacket headings repeat tables | Jacket samples Relaxed/oversized: equality observed, no new regular applicability inferred |
| Calvin Klein | 5 | General women activewear/sweater/outerwear collected; products men shirt/sweater and women sweater/jacket differ | Measurement semantics unresolved in product popups; men Jeans/Est1978 also lacks specific classification evidence |
| Columbia | 2 | Inherited men/women general | ACCESS BLOCKED: Press & Hold CAPTCHA; no retry/bypass |
| Everlane | 2 | Men tee/sweater/jacket same; women tee/sweater/shirt same | No additional table in sampled families |
| Gap | 5 | General men/women; product regular men/women and women unisex. Current both regular popups match product files | General/product differences retained; Tall/Petite excluded |
| Gucci | 3 | Women product shirt/jacket body table adds XXXL/4XL to general; men tee/jacket share ranges unlike general singletons | Men product body/garment semantics unresolved |
| J.Crew | 3 | Men Tops and Outerwear distinct extent; women Tops/Outerwear same. Men sweater/jacket and women jacket products match | No duplicate; general Suiting equals Outerwear |
| L.L.Bean | 2 | Men regular tee product matches general | UI BLOCKED: women cardigan Size Chart twice gave no dialog; no equality claimed |
| Levi’s | 4 | Both product Tops & Outerwear differ general; two new body charts | Regular only; Big/Tall/Plus excluded |
| Madewell | 2 | New men general Tops; both gender tee products match respective general | Dresses outside upper schema; Plus/Petite excluded |
| Moncler | 4 | Both genders numeric Outerwear vs alpha Tops; both product families matched each gender | No duplicate or inferred alpha/numeric equivalence |
| Nike | 2 | Men Legend tee and women basketball hoodie Size Guide links use collected general | SCHEMA BLOCKED: NBA/WNBA jersey page lacks explicit mens/womens assignment |
| Patagonia | 3 | Women Better Sweater matches general; men shirt and regular Better Sweater jacket share distinct product table | General/product difference retained |
| Ralph Lauren | 5 | Women shirt/sweater body tables match. New men generic body, classic dress-shirt body, regular suit/sportcoat body | Existing men polo garment/body wording conflict requires human review; no silent correction |
| Saint Laurent | 3 | New men Ready to Wear jacket/tee body table differs Shirts; women jacket/shirt same | Tee discovery resolved; alpha conversion gaps not inferred |
| Tommy Hilfiger | 8 | General men/women families plus new mens loungewear tops; product broad upper tables differ | Product semantics unresolved; men XS waist39.5→30.5 invalid range. Unisex repeating fractions not rounded |
| Under Armour | 2 | Both gender regular product tops match general; fit descriptions do not add numeric tables | Plus/Tall excluded |

## Evidence and reproducibility

The full chronological source/product IDs, observed values and screenshot names are in [matrix-followup-notes.md](brand-audit-2026-10-24/matrix-followup-notes.md). Later RESOLVED entries supersede earlier discovery checkpoints. Guide screenshots are under app-web/data/brand-guides/screenshots; comparison/blocker screenshots are under docs/review/brand-audit-2026-10-24. These are retailer research screenshots, not extension test evidence. New wide tables have supplementary right-column screenshots.

## Remaining action

Human review is required before accepting new guide data. Columbia requires permitted manual access; L.L.Bean women requires a functioning product chart; CK/Gucci-men/Tommy product charts require authoritative body-versus-garment evidence. Nike jersey requires an explicit supported gender assignment; Tommy unisex requires exact representable source/schema treatment. No production configuration/code changes were made to remove these limits. The PR remains draft because B/C were not executed and these D limitations remain.
