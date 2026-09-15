# Technical course track

This track treats Fit Passport primarily as a **technical system**. The goal is not to re-pitch the startup; it is to show that the system can be built, tested and defended with evidence.

## Current technical focus

The highest-risk path is the size-data pipeline:

```
retailer page / browser-supplied HTML
        ↓
page parser + measurement-kind detection
        ↓
page data > curated brand chart > estimated fallback > refusal
        ↓
transparent fit engine
        ↓
ranked sizes + confidence + provenance + explanation
```

As of Session 74 (2026-09-15), the repository has 449 automated tests. The page path now distinguishes **body measurements** from **garment measurements**, folds repeated alpha labels into ranges, and records where that semantic interpretation came from.

## Canonical implementation

Do not duplicate these files into coursework. They are the working proof:

- `app-web/src/lib/fitEngine.ts` — transparent recommendation engine
- `app-web/src/lib/pageParse.ts` — deterministic page/size-table parsing
- `app-web/src/lib/extractorLLM.ts` — layered extraction and browser-supplied HTML path
- `app-web/src/lib/brandCharts.ts` — curated first-party brand size charts
- `app-web/src/app/api/check/route.ts` — end-to-end size-check API and refusal gates
- `app-web/scripts/capture-chart.mjs` — reproducible chart-capture utility
- matching `*.test.ts` files — baselines, regressions and reproducibility evidence

## Technical research and decisions

- `docs/design/fit-algorithm-research.md`
- `docs/design/brand-size-charts.md`
- `docs/design/fetch-strategy.md`
- `docs/design/china-sizing-research.md`
- `docs/design/closet-signal-and-interaction-cost.md`
- `docs/design/3d-body-and-tryon.md`
- `docs/design/identity-and-sharing.md`
- `docs/design/cost-model.md`
- `docs/DEPLOYMENT.md`
- `docs/memory/project-fit-passport-build-state.md`
- `docs/memory/project-fit-passport-next-steps.md`

## Course deliverables

Put technical-course submissions in [deliverables/](deliverables/). Keep reports short and point to the canonical code/tests above for the working baseline or proof-of-concept.
