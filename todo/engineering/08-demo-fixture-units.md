# Check the demo fixtures for body numbers in garment fields

**Found in Session 78d3. Evidence, not proof — verify before changing demo data.**

## What was seen

The first product in `/check`'s "Try:" row is the Uniqlo AIRism fixture
(`extractor.ts` FIXTURES). For a wearer with a **100 cm chest** at regular fit it
recommends **XL**.

Its chart stores `chestCm` — the **garment** field — as XS 92 · S 96 · **M 100** ·
L 104 · XL 110. The engine adds 10 cm of regular ease to a garment chest, targets
110, and lands on XL.

In Session 75c the **real** Uniqlo AIRism page, read through the extension, was a
**body** chart with M = **95.9–104.1 cm** — whose midpoint is exactly **100**. If the
fixture's numbers are really body measurements, this is invariant ㊿ inside our own
demo: a body number in a garment field, making the most-clicked demo answer two
sizes too big. The real page's own rule says a 100 cm chest is an M.

## What to do

1. Open the Uniqlo AIRism page in a browser and read whether its chart states body
   or garment measurements, and the numbers.
2. If body: move the fixture's numbers to `bodyChestMinCm/MaxCm` (the ranges the page
   states), exactly as `brandCharts.ts` does for Nike. Add a test that the demo
   recommends what the page's own rule says for a 100 cm chest.
3. Do the same check for the other three fixtures (COS Oxford, Levi's Trucker, Zara
   Knit Sweater).

## Why it matters

These are the products a first-time visitor is invited to try. A demo that
recommends XL to someone whose real answer is M is the worst possible first
impression for a product whose promise is the right size.

## Resolved (Session 85c, 2026-10-05)

- **Uniqlo:** the real page (E474244, captured through the extension 2026-09-29) is a
  body chart in inches; the fixture now carries its chest and waist ranges, in cm, for
  XS–3XL. A 100 cm chest at a regular fit gets **M** (`demoFixtures.test.ts`).
  Shoulder, sleeve, length and the model line had no source and were dropped.
- **COS, Levi's:** their demo links (`demoProducts.ts`) are made-up URLs, so there is
  no page to read; the fixtures stay as illustrations, already labelled "demo" in the
  UI. Levi's is internally consistent (body ranges, garment chest about 14 cm more);
  COS is a garment chart. **Zara** has no fixture at all.
