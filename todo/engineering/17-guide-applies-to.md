# A brand guide applies to the garments it was printed for

**Found in Session 103 (quick check of the 39 collected guides).** Many brands publish more than one
chart, and the engine treats a brand's guide as valid for every top of that brand:

- **Per category, with different numbers:**
  - Banana Republic men's (the stored guide is the OUTERWEAR chart);
  - Moncler (outerwear vs tops);
  - Calvin Klein women's activewear;
  - Burberry women's (alpha vs numeric tables disagree);
  - Everlane (a chart per product).
- **General guide vs product-page chart:**
  - Patagonia men's: they disagree at a 92 cm chest, the one miss in the first graded evaluation;
  - Gap women's: US 4 is 33.25 vs 34.25 in.
- **Per fit** (Tall/Slim/Big/Petite; Ralph Lauren Classic/Slim): we keep Regular only, which is right.

**Do:**
- Add an optional `appliesTo` (closet category keys, e.g. `["jacket","coat"]`) and `variant`
  ("general" | "product") to `GuideFile`.
- `reviewedGuide` / `fillFromEvidence` pick the guide whose `appliesTo` contains the product's category,
  preferring "product" over "general".
- Calibration keeps one observation set per brand and line as now.
- Then ask the agent to fill `appliesTo` on the existing files.

**Blocked on:** the founder's go-ahead (raised 2026-10-24).
