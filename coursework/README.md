# Coursework split

Fit Passport is one project being built through two different course lenses. The codebase stays shared; the coursework is separated so each class can evaluate the part contributed by relevant coursework and within the scope of the class

## Technical course

See [technical/](technical/).

Focus:
- software implementation and architecture
- technical/data feasibility and highest-risk assumptions
- baselines and reproducible proof-of-concepts
- fit engine, extraction pipeline, provenance, confidence, privacy and failure modes
- testing, deployment, performance, infrastructure and access constraints

The canonical implementation remains in `app-web/`. We do **not** fork the product code for the class.

## Startup course

See [startup/](startup/).

Focus:
- customer discovery and problem validation
- market/competitive positioning
- value proposition and business model
- go-to-market, messaging and monetization hypotheses
- product scope, user experience, brand and final product delivery

## Shared project core

These are project-wide and intentionally stay outside either course folder:
- `app-web/` — production application and tests
- `brand/` — build-time brand assets
- `docs/design/` — technical research and engineering design notes
- `docs/memory/` — decisions, invariants and project memory
- `docs/DEPLOYMENT.md` — operations/deployment
- `DEVLOG.md` — chronological development record

Course folders should reference the shared core instead of duplicating it.
