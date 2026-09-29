# Decide: stop scoring the invented ladder on pages we CAN read?

**Recommended: decide after the benchmark counts how many cases it affects.**

## Where it stands

`BRAND_TABLE` in `extractor.ts` holds two invented constants per brand —
a `chestBaseCm` and a `stepCm` — which `buildSizes()` extrapolates into a full
ladder, with shoulder, sleeve and length **identical for all thirteen brands**.
That mechanism is what once showed a user "XS–XL, chest 106/111/116/121/126": five
measurements no page ever stated.

It is already refused on a page the **browser** handed us (invariant 59,
`no-chart-on-page`). It is still served on a page our **server** read and found no
chart in (`fetch: "ok"`).

## The choice

Extend the refusal to `fetch: "ok"` as well — i.e. retire `BRAND_TABLE`.

- **For:** it is invented data presented as measurement, and the honesty rule does
  not have an exception for how the page arrived.
- **Against:** it currently answers where we would otherwise refuse, and nobody has
  counted how often that answer would have been right anyway.

The evaluation now counts it — Everlane is already answered from the invented
ladder in `results/2026-09-29-live.md`, and scored WRONG by invariant 66.

## Decide when

The benchmark has ground truth (`todo/people/01-ground-truth.md`), so the count is
real rather than a guess. **The scope of today's rule is pinned by a test**, so
widening it is a deliberate edit, not a drift.
