# Technical implementation map

Use this as the technical-course entry point into the shared codebase.

## Recommendation core

| Concern | Canonical implementation |
|---|---|
| Fit scoring | `app-web/src/lib/fitEngine.ts` |
| End-to-end recommendation service | `app-web/src/lib/recommendService.ts` |
| Size systems / normalization | `app-web/src/lib/sizeSystems.ts`, `app-web/src/lib/sizing.ts` |
| Personal fit/ease | `app-web/src/lib/personalEase.ts`, closet/fit-direction modules |
| Confidence and evidence | fit-engine/recommendation modules + associated tests |

## Data acquisition

| Concern | Canonical implementation |
|---|---|
| URL / deterministic extraction | `app-web/src/lib/extractor.ts` |
| Real-page parsing | `app-web/src/lib/pageParse.ts` |
| Layered fetch + optional LLM/VLM + browser HTML | `app-web/src/lib/extractorLLM.ts` |
| Curated first-party brand charts | `app-web/src/lib/brandCharts.ts` |
| Check API / refusal gates | `app-web/src/app/api/check/route.ts` |
| Offline chart capture | `app-web/scripts/capture-chart.mjs` |

## Technical evidence

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
- `DEVLOG.md`

## Current measured state

Session 74 (2026-09-15): **449 automated tests**. The most recent technical correction distinguishes body-vs-garment measurement semantics on real page charts, folds repeated size labels before scoring, and records provenance for the semantic interpretation.
