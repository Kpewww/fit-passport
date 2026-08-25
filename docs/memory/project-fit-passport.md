---
name: project-fit-passport
description: "Fit Passport — consumer-owned fit-identity web MVP for apparel, with pet extension"
metadata: 
  node_type: memory
  type: project
  originSessionId: ff70f30d-84e1-4230-9852-546155e0d6ff
  modified: 2026-08-12T17:56:06.771Z
---

**Fit Passport** — "One body. One fit identity. Any store." A consumer-owned fit layer: user keeps one portable profile (body info, preferred fit, known-good garments, keep/return/exchange outcomes). Paste a product URL → system extracts sizing data → recommends a size with confidence + explanation. Learns from outcomes.

**Team:** Xiangchen Kong ([[user-xiangchen-kong]]) + Alyssa Qi. For course [[project-course-49800]].

**Semester MVP scope (narrow):** responsive web app, human apparel only (tops/shirts/jackets). Create profile → add 3-5 known-good items → paste product URL → get ranked size + confidence + explanation → record keep/return/exchange. Stretch: small dog/cat pet-profile prototype, regional sizing, VTO proof-of-concept. Out of scope: footwear/jewelry production, custom body-scan model, native apps, retailer integrations.

**Tech stack (proposed):** React/Next.js responsive web frontend; lightweight API (Next.js API routes or FastAPI); PostgreSQL (or equivalent) for profiles/products/sizes/recs/outcomes; LLM/VLM-assisted product-page extraction into normalized schema (user can correct); **transparent rule/score-based fit engine** (NOT a black-box ML model — must be explainable/testable); template-or-LLM explanation layer grounded in engine output; optional external VTO API only.

**Core data model:** FitProfile, KnownGoodItem, Product, SizeOption, FitRecommendation, FitOutcome, PetProfile.

**Differentiation:** consumer-owned & portable (vs retailer-embedded True Fit/Sizebay); any-store via pasted URL (no retailer integration needed); learns fit *experience* not just measurements; outcome-based learning; explainability; cross-domain architecture (apparel→pets→shoes→rings).

**Positioning vs competitors:** not competing on body-scan accuracy (3DLOOK/Bold Metrics), dataset size (True Fit), or visual realism (Google Doppl). Wedge = ownership + portability of the fit profile. Size recommendation is kept separate from virtual try-on.

**5 hypotheses (H1-H5):** H1 cross-brand sizing creates friction; H2 portable profile beats generic chart; H3 known-good items + prefs improve recs; H4 outcome feedback improves later recs; H5 architecture generalizes to pets.

**Repo state as of 2026-08-10 (Session 01):**
- Layout: `docs/proposals/` (PDFs), `docs/course/` (course deliverables), `app-web/` (Next.js MVP), `DEVLOG.md`, `README.md`, `.gitignore`, `git init` done.
- `app-web/` = **Next.js 14 (pinned) + React 18 + TS + Tailwind v3 + Prisma 5.22 + Vitest 1.6**. Pinned to Node 18.20 (this machine's version). Do not upgrade to Next 16 / Prisma 6 without upgrading Node first.
- Prisma schema at `app-web/prisma/schema.prisma` with all 7 models from proposal §10.1 (SQLite dev.db).
- Fit engine at `app-web/src/lib/fitEngine.ts` — transparent rule/score model, NOT an LLM. 8 vitest cases green (`fitEngine.test.ts`).
- 4 API routes: `/api/profile`, `/api/closet`, `/api/check`, `/api/outcome`. Zod-validated.
- 4 screens (App Router): `/` landing, `/onboarding`, `/closet`, `/check`, `/history`.
- Single-user shim in `src/lib/session.ts` — swap to real auth pre-beta (W12).
- Extractor is fixture-based (Uniqlo/COS/Levi's); real LLM extraction is W6 milestone.
- End-to-end smoke tested via real HTTP: body chest 92cm → recommends M @75% for Uniqlo AIRism tee with grounded reasons.

**Course deliverables drafted (v0.1)** in `docs/course/`: project-plan, business-model-canvas, value-proposition-canvas, interview-guide, risks-and-legal (directly addresses Prof. Root's 3 concerns), weekly-journal-template.

**Current build state (files, models, routes, gotchas) lives in [[project-fit-passport-build-state]]** — read that before touching the app. Repo is on GitHub (private): github.com/Kpewww/fit-passport; I can push directly (keychain has creds).

Features shipped through **Session 22 (2026-08-12)**: guided dashboard, VIEW/EDIT `/passport` (autosave, unit toggles, portrait, multi-fit, **earned-badge row with hover-meaning tooltips**), closet (collections/color/gender/reorder/merge/**add-by-URL**/**item photos**/**filing-cabinet folder view: colored folders holding stacked file cards + detail-sheet pull-out + comparison bucket**), URL-aware size checker (**whole-path extraction: brand/name/category/gender**, fit-pref toggle, explainable ranks, **cross-domain disclaimer**), multi-garment domains + **size converter** (EU/US/UK/cm), **per-user brand-bias learning**, **body-type derivation + figure**, code-based identity + sharing + **community directory** + **outfits & likes**, **badge system** (3 tracks×3 tiers + 3 capstones, glossy SVG medallions), **Fit Refresh** card-stack, and security: rate-limiting, real **email password reset** (Resend), **export-by-code**, **change-password/deactivate**, **image-gen try-on** (Replicate FLUX schnell). All key-gated integrations degrade gracefully without keys. Persistence race fixed via middleware.

See [[project-fit-passport-build-state]] for the full current architecture (read before coding), [[feedback-detailed-devlog]] for the ongoing log, [[project-identity-sharing-idea]] for the auth/sharing design, [[project-fit-passport-next-steps]] for backlog, [[feedback-brand-logo-legal]] and [[feedback-language-chinese-chat-english-commits]] for constraints.
