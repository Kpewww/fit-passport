# Type ground truth for the 11 evaluation cases

**Who:** two people, working independently.
**Effort:** an afternoon between them. **Blocks:** every Sprint 5 number.

## What

For each case in `app-web/eval/cases/`, open the retailer's page **in your own
browser**, read its size chart, and type what it says into
`app-web/eval/truth/<case id>.json`. Copy `truth/_template.json` to start.

The 11 cases:

```
arcteryx-atom-hoody-mens        nike-dri-fit-legend-tee-mens    patagonia-better-sweater-womens
everlane-organic-cotton-crew    nike-size-help-page             rei-rainier-rain-jacket-mens
gap-classic-tee-mens            nike-air-force-1-shoe-mens      uniqlo-airism-cotton-tee-mens
hm-regular-fit-tee-mens         patagonia-better-sweater-mens
```

## Why it matters more than anything else on this board

The harness already runs (`npm run eval`) and already tells us what each system
*did*. With no truth it cannot tell us whether any of it was **right** — every
case currently reads `truth: pending`, and every accuracy metric reads 0.

It is also the only part of the evaluation that cannot be automated, by design:
**Fit Passport never defines its own ground truth** (invariant 66). Truth read by
our own parser would be the engine grading itself.

## Rules that make it valid

- **From the retailer's page, never from our capture or our output.**
- **Numbers exactly as printed, in the chart's own units.** Do not convert — the
  harness converts, and a test pins the conversion.
- **Record the words that decided body vs garment**, verbatim, in `kindEvidence`.
  This is the field that settles arguments later; "body measurements" and
  "measured flat" are different claims about the same numbers.
- **Both names in `verifiedBy`.** Independently means neither of you sees the
  other's file first.
- A page with no chart, or one that is not a garment, is a **real case**: fill in
  `outcome: "refuse"` and which refusal is correct. Failure is evidence.

## Done when

All 11 files exist in `app-web/eval/truth/`, `npm run eval` reports
`withTruth: 11`, and the accuracy columns in `results/<date>.md` have numbers.

## Why / full method

`app-web/eval/README.md`, and `docs/memory/project-fit-passport-next-steps.md`
(Session 75d).
