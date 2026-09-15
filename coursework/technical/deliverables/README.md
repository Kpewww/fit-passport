# Technical course deliverables

Use this folder for the technical course's Sprint reports and submission-facing artifacts.

Recommended structure:

```
deliverables/
  sprint-1/
  sprint-2/
  sprint-3/
  ...
```

The report can live here, but the **working baseline / PoC stays in the real implementation** under `app-web/` and is referenced from the report. This avoids creating a classroom-only copy of the system that can drift from production.

For Sprint 3, the relevant reproducible implementation is currently:
- `app-web/src/lib/brandCharts.ts`
- `app-web/src/lib/pageParse.ts`
- `app-web/src/lib/extractorLLM.ts`
- `app-web/src/app/api/check/route.ts`
- `app-web/scripts/capture-chart.mjs`
- the associated unit/integration tests
