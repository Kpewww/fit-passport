# Fit Passport — Development Log

This log doubles as the course-required **Weekly Journal** (20% of final grade,
49-800). One dated entry per work session: what we built, why, what worked, what
didn't, and what's next. Concrete decisions and file references so the log maps
straight into the Reflection Essay at the end of the semester.

Team: Xiangchen Kong · Alyssa Qi. Instructor: Sheryl Root. Fall 2026.

---

## Open engine-tuning findings (running list)

- **[F1] Chest signal can override a good same-brand anchor. → FIXED 2026-08-10 (Sess 02).**
  Walkthrough finding: a slim user (chest 95) with a known-good COS EU 48 in the
  closet got recommended EU 44 for a new COS shirt, because that product's chart
  runs loose and the chest-fit weight (0.45) outweighed the known-good weight
  (0.35). Fix = **adaptive weighting** in `fitEngine.ts`: when the closet has a
  same-brand + same-category item rated ≥4/5 (`hasStrongAnchor`), the engine
  switches from `DEFAULT_W` (chest 0.45 / known-good 0.35) to `ANCHOR_W`
  (chest 0.18 / known-good 0.62) — the anchor dominates and chest-fit becomes a
  tie-breaker. Low-rated anchors (fit ≤3) do NOT trigger this. Cross-brand-only
  closets also stay measurement-led. Covered by 3 regression tests in the
  "anchor dominance [F1]" describe block (11 tests total, all green). This is
  exactly the "which signals actually matter" evidence the proposal calls for
  (§10.2) — we can now show the same product yields different recommendations
  depending on whether the user owns a same-brand anchor.

---

## 2026-08-10 · Session 07 — recovery/email, color wheel, reorder, merge UI, demo data

**Goal:** User feedback after the GitHub push: (1) recovery email + strong
"save your recovery code" warning; (2) color picker with a color wheel + two
rows of trendy colors; (3) finish the deferred Phase-2 items (reorder, merge-UI);
(4) one-click demo data.

### Recovery + email
- `email` (already on `User`) now collected at claim (optional, unique, lower-cased).
- `POST /api/auth/recover`: reset password via the one-time recovery code;
  rotates BOTH password and recovery code (old code invalidated), logs in,
  returns a fresh recovery code. Verified: old code rejected after use.
- Claim result screen rewritten as a **red, high-severity warning** with a
  copy button and a **"I've saved my recovery code" checkbox that gates the
  Continue button**. Claim form gained a "Recovery email (strongly
  recommended)" field. `/recover` page + link from `/login`.
- Email-based reset (send link to stored email) needs mail infra — deferred
  with an honest "coming soon" note; the recovery-code path works fully today.

### Color picker
- Expanded to **20 on-trend apparel colors in a 2-row swatch grid** + free-text
  + a **native color-wheel** (`<input type=color>`) styled as a swatch button.
  Preset map synced to the public `/u/[code]` view's `ColorDot`.

### Reorder + merge (finished the Phase-2 deferrals)
- `POST /api/closet/reorder` (assign sortIndex by array order, txn, user-scoped).
  Up/down arrows on standalone item cards; disabled at ends; reorders within a
  collection's standalone items.
- `POST /api/closet/group` (merge selected ids under a shared groupId / ungroup).
  Closet gained a **"Merge duplicates" select mode**: toggle → checkboxes on
  cards → Merge. Verified merging two Uniqlo items into one variant group.

### Demo data
- `POST /api/demo` resets the current user's closet/collections and seeds a
  chest-95 regular profile + 5 realistic items across collections. Surfaced as
  a subtle "Load demo data" link in the home new-user guide → redirects to /closet.

### Verified
- `tsc` clean · `vitest` 15/15 · `next build` clean (29 routes) · live smoke of
  demo load, email claim, recovery (+ old-code invalidation + relogin), merge.

---

## 2026-08-10 · Session 06 — closet organization (Phase 2)

**Goal:** The user's closet-organization request: default categories that are
user-renamable/movable, color tags, ordering, and merging same-garment
different-size/color into one card. Pure data + UI; the fit engine is untouched.

### Naming decision (important)
`KnownGoodItem.category` (tshirt/shirt/jacket) is the GARMENT TYPE the engine
matches on — NOT user-editable. The user-facing renamable folders are a new
`Collection` model, shown in the UI as "collections". Adding an item auto-files
it into the default collection for its garment type (Uniqlo tshirt → "T-Shirts").

### Schema
- New `Collection` (userId, name, sortIndex). `KnownGoodItem` gains
  `collectionId` (onDelete: SetNull), `color`, `sortIndex`, `groupId`,
  `groupName`. Grouping is DISPLAY-ONLY — the engine still reads every item
  individually, so variant-merging can't corrupt recommendations.
- `User` gains `collections` relation.

### Backend
- `src/lib/collections.ts`: garment-type → default-collection map, 5 default
  folders (T-Shirts/Shirts/Sweaters/Jackets/Other), `ensureDefaultCollections`
  (seed on first list), `collectionForGarment` (find-or-create on add).
- `GET/POST/PATCH/DELETE /api/collections` (list w/ item counts, create, rename/
  reorder, delete → items fall back to Uncategorized).
- `/api/closet` extended: POST auto-files + assigns end-of-list sortIndex; PATCH
  now partial (edit any field, move collection, recolor, reorder, group/ungroup).
- `/api/view/[code]` now returns collections + item color/collectionId (still
  NO precise measurements).

### Frontend
- `/closet` reworked: items grouped into collection sections; each section
  rename/delete; per-item Edit / Remove / move-to-collection dropdown; a color
  picker (9 presets + free text) with color dots on cards; "add collection"
  form; variant groups (shared groupId) collapse into one card with per-variant
  Edit/Unmerge/Remove.
- `/u/[code]` public view groups the shared closet by collection with color dots.

### Verified (live)
- Auto-file: tshirt→T-Shirts, shirt→Shirts, jacket→Jackets. Colors persist
  (preset name + custom hex). Rename T-Shirts→Tees + new "Gym" both work. Public
  view groups by collection and still leaks NO precise measurements.
- `tsc` clean · `vitest` 15/15 · `next build` clean (24 routes).

### Deferred (noted, not built)
- Manual up/down reorder UI (sortIndex is stored + honored; no drag/arrows yet).
- A "merge these into variants" trigger in the UI (grouping renders and unmerge
  works; creating a group needs a select-two-items affordance).
- Collection reorder UI (API supports sortIndex).

---

## 2026-08-10 · Session 05 — code-based identity, sharing, community (Phase 1)

**Goal:** Build the founder's novel identity idea: sign up → get an account
**code**; anyone with the code can VIEW the closet (read-only); editing needs a
**password** (= login). Plus a community entry point. Design + threat model
written first in `docs/design/identity-and-sharing.md`; decisions taken with the
user: (a) code exposes closet + COARSE body type only, never precise
measurements; (b) password REQUIRED at claim; (c) build identity before the
closet-organization work.

### Concept framing
Not true PKI — it's **capability(read) + credential(write)**. Account code =
bearer read-capability; password = bcrypt-hashed write-credential. Documented
that bearer codes can't be revoked once shared (offered rotation as future
escape hatch).

### Backend
- **Schema** (`User`): `claimed`, `accountCode` (unique, high-entropy),
  `username` (unique), `passwordHash`, `recoveryHash`, `bodyType` (coarse,
  shareable), `exportPolicy` ("owner"|"anyone"). Precise cm stays in FitProfile.
- **`src/lib/auth.ts`**: `generateAccountCode()` (Crockford base32, ~65-bit,
  `FP-XXXX-XXXX-XXXXX`), `normalizeAccountCode()`, `generateRecoveryCode()`,
  bcrypt `hashSecret`/`verifySecret`, and HMAC-signed session cookies
  (`encodeSession`/`decodeSession`, constant-time verify, no external JWT dep).
- **`src/lib/session.ts`** reworked: first visit mints an ANONYMOUS unclaimed
  user + signed cookie (keeps "just start adding clothes" frictionless);
  `getCurrentUser`, `setSession`, `clearSession`, `canEdit`.
- **Auth API**: `POST /api/auth/claim` (anon→claimed, returns code + one-time
  recovery code), `POST /api/auth/login` (code+password→edit session, uniform
  error to avoid code-existence leak), `POST /api/auth/logout`, `GET /api/auth/me`.
- **`GET /api/view/[code]`** — PUBLIC read-by-code. Prisma `select` deliberately
  OMITS `fitProfile`, so precise measurements can't leave the server. Returns
  username, coarse bodyType, closet items only.

### Frontend
- `/account`: claim form (username/password/coarse body type/export policy) →
  one-time reveal of account code + recovery code; status view when claimed
  (with public-view link + logout).
- `/login`: code + password.
- `/u/[code]`: public read-only closet view ("Viewing {username}'s closet",
  read-only badge, "measurements never shared by code" note, CTA to sign up).
- `/community`: code-entry to view a closet + "how sharing works" explainer;
  notes the public directory will be opt-in (Phase 3).
- `Nav`: shows `@username` when claimed, else a "Claim account" CTA; re-checks
  on navigation.

### Verified (live)
- Full flow: anon session stores chest 95 + closet → claim → code
  `FP-…` + recovery issued → **public view leaks NO precise measurements**
  (chest/waist/height/fitProfile absent; only closet + coarse "athletic") →
  login rejects wrong password, accepts correct → unknown code 404.
- `tsc` clean · `vitest` 15/15 · `next build` clean (all auth + view routes).

### Deferred / next
- Password recovery via recovery code (endpoint not built yet — code is issued
  and hashed, ready to wire).
- Rate-limiting on `/api/view` and `/api/auth/login` (noted in threat model).
- Code rotation escape hatch.
- Phase 2: closet organization (categories, tags, colors, ordering, merge
  same-garment variants) — the user's other request, intentionally after identity.

---

## 2026-08-10 · Session 04 — anchor-vs-preference fix, closet edit, brand autocomplete

**Goal:** Three user reports from the Session-03 review.

### [F2] "Every fit preference returns L on a Hermes shirt" — FIXED
- Root cause: the [F1] anchor-dominance fix (Session 02) worked *too* well. With
  a same-brand+same-category anchor (Hermes shirt L, 5/5), `known-good` weight
  (0.62) swamped everything, and `scoreKnownGood` measured distance from the
  EXACT anchor size — so slim/regular/relaxed/oversized all collapsed to L.
- Fix: a strong anchor now sets a **baseline** that the fit preference shifts.
  New `preferenceShift()` in `sizing.ts` (slim −1, regular 0, relaxed +1,
  oversized +2). `scoreKnownGood` targets `anchorIndex + preferenceShift(pref)`
  for strong (same-brand+same-cat) anchors; weak/cross-brand anchors are left
  un-shifted (their ladder alignment is already approximate). Explanations now
  read "Sized down from your Hermes L for a slim fit", etc.
- Removed the old, near-dead `scorePreference` signal (its shift logic was mostly
  0 and it now double-counted). `preferenceBonus` weight retired from use.
- Verified live with the user's exact closet: Hermes shirt now gives
  slim→M, regular→L, relaxed→XL, oversized→XL.
- Tests: updated the [F1] block to use `regular` for the exact-match assertion,
  added a 4-case "fit preference moves a strong anchor [Hermes bug]" block
  (incl. "the four preferences don't all collapse"). **15 tests, all green.**

### Closet editing
- `PATCH /api/closet` (user-scoped `updateMany` guard). Closet page now has an
  inline **Edit** mode per item (`EditRow`) alongside Remove — fixes "if I add
  something wrong I have to delete and re-add".

### Brand autocomplete (suggest, never lock)
- `src/lib/brands.ts`: ~70 well-known apparel brands + `suggestBrands()` with
  prefix-then-substring ranking, accent- and case-insensitive (so "her" →
  "Hermès"). Explicitly NOT a whitelist.
- `src/components/BrandInput.tsx`: free-text field with a suggestion dropdown
  (keyboard nav, outside-click close) that always allows typing an unlisted
  brand ("Not listed? Just type it — any brand works."). Wired into both the
  closet add form and the edit row.

### Verified
- `tsc` clean · `vitest` 15/15 · `next build` clean (16 routes) · live smoke of
  Hermes preference sweep + PATCH edit.

---

## 2026-08-10 · Session 03 — URL-aware extraction, fit toggle, interactive breakdown

**Goal:** Act on user feedback from the Session-02 walkthrough:
1. Default fit = regular, but let the result page preview slim/relaxed/oversized.
2. "Every URL returns M, doesn't look like it's actually running." → make the
   tool visibly read the specific page pasted.
3. Show the extracted product info (name, retailer, size chart) so the user
   trusts we read *their* page.
4. The ranked-sizes list felt static/misleading — make rows expandable.

### Extractor — now URL-aware (`src/lib/extractor.ts`)
- Two layers: (1) curated fixtures for the 3 demo products; (2) **URL-derived**
  extraction for everything else. Layer 2 parses the real URL: brand from the
  domain (`BRAND_TABLE` of 13 retailers, each with its own chest base + step +
  fit-notes so charts differ), category from slug keywords, product name from
  the slug. Unknown brands still derive retailer + name + a generic chart.
- Added `source` provenance (`host`, `derived`, `slug`) to every result so the
  UI can prove it read that page.
- `slugToName()` strips CMS noise (`productpage`, `p12345`, SKU-ish tokens,
  file extensions). Verified: Zara/H&M/Nike URLs now yield clean names.
- **Root cause of "everything returns M"**: the old extractor had ONE generic
  fallback, so every non-demo URL produced the same product+chart. Fixed.
  Verified live: Zara sweater→L, Nike hoodie→S, H&M shirt→L, Patagonia→S.

### Fit preference toggle
- New **`/api/recommend`** endpoint recomputes for an already-stored product
  with an optional `preferredFit` override — no duplicate product row, no
  mutation of the saved profile.
- Extracted shared `src/lib/recommendService.ts` so `/api/check` and
  `/api/recommend` assemble identical engine input.
- Result page has a slim/regular/relaxed/oversized segmented toggle; changing it
  re-runs the engine live (with an opacity transition). Seeds from the saved
  profile (default regular).

### Interactive breakdown + provenance UI (`/check`)
- New **provenance card**: "Read from {host}" badge, product name, a detail grid
  (retailer/brand/category/material/#sizes/fit-note), and the clickable source URL.
- Ranked size rows are now **expandable** (`SizeRow`): tap to reveal the signals
  it's based on (with per-signal weight, red dot for negative/outcome signals),
  the garment measurements pulled from the page (chest/shoulder/sleeve/… chips),
  and the match-score + confidence footer. The pick is expanded by default.

### Engine polish
- Added an **edge-of-range note** to explanations: when the pick is the
  largest/smallest size offered but the target implies wanting to go further,
  it says so plainly ("This is the largest size offered — for an oversized fit
  you're at the top of the range") instead of a confusing lone "chest N cm
  smaller than target" line. Article agreement (a/an) handled.

### Verified
- `tsc` clean · `vitest` 11/11 · `next build` clean (16 routes incl. new
  `/api/recommend`) · live smoke: URL variety + fit toggle + slug cleanup +
  edge note all confirmed.

### Next up
- Real LLM/VLM extraction to replace layer 2 for unknown pages (W6 milestone);
  keep the "confirm what we extracted" step.
- One-click "load demo data" for E-of-E.
- Let the user EDIT extracted product fields before scoring (proposal's
  user-confirmation mitigation) — the provenance card is the natural home.

---

## 2026-08-10 · Session 02 — [F1] engine fix + UX overhaul

**Goal:** Fix the [F1] anchor-weighting finding surfaced during the Session-01
walkthrough, then redesign the UI around one insight: *a visitor only wants to
know "what size should I buy?"* — so get them to value fast, then guide them to
add data that improves accuracy.

### Engine — [F1] fixed
- Added **adaptive weighting** to `fitEngine.ts`. `hasStrongAnchor()` detects a
  same-brand + same-category closet item rated ≥4/5. When present, the engine
  uses `ANCHOR_W` (known-good 0.62 / chest 0.18) instead of `DEFAULT_W`
  (chest 0.45 / known-good 0.35) — the owned-size anchor dominates and chest
  becomes a tie-breaker. Refactored all `score*` fns + `combine` to take a
  `Weights` param (no module-level mutable weight).
- 3 new regression tests ("anchor dominance [F1]"): owned-size wins; a low-rated
  anchor (fit ≤3) does NOT trigger dominance; cross-brand-only stays
  measurement-led. **11 tests total, all green.**
- Verified live: COS Oxford shirt for a slim chest-95 user who owns a COS EU 48
  now recommends **EU 48** (was EU 44 in Session 01).

### UX overhaul — value-first + guided
- **Design system** `src/components/ui.tsx`: `Button`, `LinkButton`, `Card`,
  `Field`, `EmptyState`, `ConfidenceRing` (SVG), `AccuracyBadge`, `Skeleton`.
  Extended Tailwind theme (brand tints, `ink` scale, card/lift shadows,
  fade-in-up + shimmer animations).
- **`/api/status`** (new): profile completeness snapshot — steps checklist,
  accuracy tier (low/medium/high), next-step pointer, last recommendation.
- **`/api/products`** (new): lists checked products. Fixes a real UX bug — the
  old history page derived the product picker from existing outcomes, which was
  circular (couldn't record a first outcome). Now you can log an outcome for any
  product you've checked.
- **Home** rebuilt as a guided dashboard: hero paste-URL box (submits straight
  to `/check?url=`), new-user 3-step guide vs returning-user progress checklist
  with accuracy badge + last-recommendation recap.
- **/check** is now the hero: auto-runs a URL passed from home, loading
  skeletons, big answer with `ConfidenceRing`, score bars per size, red dots for
  negative (outcome) signals, and a **benefit-framed accuracy nudge** ("add 3
  clothes you own → sharper sizing") driven by `/api/status`.
- **Onboarding**: preferred-fit as tappable cards (highest-signal/lowest-effort
  first), chest marked "most useful", save → guided next step.
- **Closet**: X/3 progress, star ratings, empty state, "goal met" celebration
  card linking to /check.
- **History**: empty state when nothing checked yet, primitives throughout.
- **Nav**: sticky, active-route aware, backdrop blur.

### Verified
- `tsc --noEmit` clean · `vitest` 11/11 · `next build` clean (all routes) ·
  live smoke of status→setup→check→[F1] path.

### Next up
- Optional: a one-click "load demo data" button for E-of-E so the dashboard
  shows a populated state instantly.
- W2 discovery: start shopper interviews with `docs/course/interview-guide.md`.
- Consider migrating SQLite→Postgres + real auth before beta (W12).

---

## 2026-08-10 · Session 01 — Repo bootstrap & core MVP loop

**Goal:** After Prof. Root's approval email (Aug 9), turn the Fit Passport
proposal into a repo that (a) demos end-to-end today, (b) can grow into a real
beta by W13 per the 15-week plan, and (c) has course deliverables framed up.

### What we built
- Repo layout at `/Users/xkk/Desktop/Kong Info/Self-Project/`:
  - `docs/proposals/` — archived the four PDFs (syllabus, official form, detailed proposal).
  - `docs/course/` — course-facing deliverables live here.
  - `app-web/` — Next.js 14 (App Router, TypeScript, Tailwind v3) MVP.
- **Data model** in Prisma (`app-web/prisma/schema.prisma`): `User`, `FitProfile`,
  `KnownGoodItem`, `Product`, `SizeOption`, `FitRecommendation`, `FitOutcome`,
  `PetProfile` — mirrors §10.1 of the detailed proposal. SQLite for dev; the
  schema is portable to Postgres for beta.
- **Fit engine** (`src/lib/fitEngine.ts`): transparent, rule/score-based, no
  black-box ML in the recommendation step. Signals: chest-fit (Gaussian around
  body+ease), known-good similarity (alpha-ladder distance × brand/category
  match × trust), fit-preference bonus, outcome learning (returns penalize,
  keeps boost), completeness-driven confidence. Every recommendation carries
  per-signal reasons — the engine is auditable, not oracular.
- **Regional size normalization** (`src/lib/sizing.ts`): EU numeric → US alpha
  mapping for jackets; deterministic label parsing that also handles "US M",
  "EU 48", "M/L" ambiguity.
- **Extractor** (`src/lib/extractor.ts`): fixture-first for 3 demo retailers
  (Uniqlo, COS, Levi's). Real LLM extraction can slot into `extractFromUrl()`
  later — the consumer interface won't change. Chose fixtures deliberately per
  §16 Risk row on scraping (demo-safe on Nov 4 without depending on live
  retailer pages).
- **API routes** (`src/app/api/*/route.ts`): `/api/profile`, `/api/closet`,
  `/api/check`, `/api/outcome`. Zod-validated. Ownership-scoped by `userId`.
- **Screens** (App Router): landing (`/`), onboarding (`/onboarding`), closet
  (`/closet`), check-a-product (`/check`), fit history (`/history`).
- **Tests**: 8 vitest cases in `src/lib/fitEngine.test.ts` — cold-start,
  measurement-driven ranking, monotonicity across `slim → oversized`,
  outcome-learning penalty, explanation grounding. All green.

### Key decisions & tradeoffs
- **Next.js 14 + React 18** (not the latest Next 16). Node 18.20 on this
  machine can't run Next 16 or the latest Prisma. Pinned versions:
  `next@14.2.15`, `react@18.3.1`, `prisma@5.22.0`, `vitest@1.6.0`. Trade: no
  newest features (React 19 form actions, RSC-only mutations). Win: reliable
  install, well-understood upgrade path when Node is bumped.
- **Tailwind v3 (not v4)** — the scaffold left v4-flavored configs; I
  normalized to v3 which is stable in the Next 14 ecosystem.
- **No auth for MVP.** Single "demo user" shim in `src/lib/session.ts`. Every
  API route calls `getCurrentUser()`. Swapping to NextAuth/Clerk later is a
  one-file change. Rationale: proposal §9 explicitly de-scopes auth.
- **Fit engine is NOT an LLM.** The proposal (§10.2) says a transparent scoring
  model is preferable for the course "because it can be evaluated." Following
  that literally. LLMs may still assist in *extraction* upstream, but the size
  decision is auditable arithmetic. This also directly addresses Prof. Root's
  "customer problem clarity" concern: we can show the reasoning, not just a
  guess.
- **SQLite** now for zero-config; migrate to Postgres before beta (W12–W13).

### What worked
- End-to-end smoke: `POST /api/profile` then `POST /api/check` with a Uniqlo
  URL returns a recommendation of "M" at 75% confidence for a body chest of
  92cm with regular fit, plus a grounded explanation. This proves the schema,
  engine, extractor, and API all agree.
- The unit tests caught two test-spec mistakes (I had confused garment
  measurements with body ranges). Fixing the tests, not the engine, was the
  right call — the engine's ease-based reasoning is correct.

### What didn't (yet)
- Latest Next.js scaffold assumes Node 20+. Wasted a few minutes reconciling
  configs. Documented pinned versions above so this doesn't recur.
- No auth means no real multi-user beta yet. Intentional but visible.
- Extractor is fixture-based. Real HTML parsing / LLM extraction not
  attempted this session — deliberately punted to W6 per the 15-week plan.

### Next up
- Wire the four course docs (project plan, BMC, VPC, interview guide, risks/
  legal) into `docs/course/`. Draft in this same session so the team has one
  coherent artifact set from day one.
- (Sess 02) First 5–8 shopper interviews via the guide — W2 milestone.
- (Sess 02) Add a "region + size chart" seed for a fourth retailer so we can
  demo cross-region recommendations at the mid-review.
- (Sess 03+) LLM extraction spike as a fallback when a URL doesn't match any
  fixture, gated behind a user-visible "we extracted this — confirm" step.

### Files touched
```
docs/proposals/*.pdf                          (moved from repo root)
docs/course/*                                 (created)
app-web/package.json                          (pinned Next 14 / React 18 / Prisma 5.22 / Vitest 1.6)
app-web/prisma/schema.prisma
app-web/src/app/layout.tsx, page.tsx
app-web/src/app/onboarding/page.tsx
app-web/src/app/closet/page.tsx
app-web/src/app/check/page.tsx
app-web/src/app/history/page.tsx
app-web/src/app/api/profile/route.ts
app-web/src/app/api/closet/route.ts
app-web/src/app/api/check/route.ts
app-web/src/app/api/outcome/route.ts
app-web/src/lib/db.ts, session.ts, sizing.ts, extractor.ts, fitEngine.ts
app-web/src/lib/fitEngine.test.ts             (8 tests, all green)
app-web/src/components/Nav.tsx
app-web/tailwind.config.ts, postcss.config.mjs, next.config.mjs, .eslintrc.json
DEVLOG.md, README.md, .gitignore              (created)
```
