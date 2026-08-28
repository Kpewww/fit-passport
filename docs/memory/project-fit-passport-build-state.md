---
name: project-fit-passport-build-state
description: "Fit Passport app — durable architecture, data model, routes, invariants, and active gotchas (read before coding)"
metadata:
  node_type: memory
  type: project
  originSessionId: ff70f30d-84e1-4230-9852-546155e0d6ff
  modified: 2026-08-20T22:49:54.406Z
---

Durable build state of the [[project-fit-passport]] web app. **Per-session history lives in the repo's `DEVLOG.md`** (through Session 56) — this file keeps only what isn't obvious from the code/DEVLOG. Repo: **github.com/Kpewww/fit-passport** (private; keychain has creds → `git push` works). **No machine path is recorded here on purpose** — the project has moved computers twice and every hard-coded path died with the move. A fresh clone has source only; `node_modules`, `.env` and `prisma/dev.db` are absent until set up (recipe in `docs/RESUME.md`). The in-repo **`docs/RESUME.md`** is the path-independent cold-start brief. The repo has its own local commit identity — check `git config user.email` rather than assuming the global one. **Chat 中文; commit messages + DEVLOG English** ([[principle-evidence-and-logging]]). Every feature must be research-grounded ([[principle-research-grounded]]).

**Stack (pinned for Node 18.20 — do NOT upgrade Next/Prisma without upgrading Node):** Next.js 14.2.15 (App Router, src dir), React 18.3, TS, Tailwind v3, Prisma 5.22 + SQLite (`app-web/prisma/dev.db`), Zod, bcryptjs, Vitest; Framer Motion + Lenis (motion); three.js (lazy, badge inspect only). Self-hosted fonts `src/app/fonts/{Inter,Fraunces}.woff2` via `next/font/local` (Google Fonts fetch at build time died on IPv6 — self-hosting removed that dependency; both OFL 1.1).

**Commands:** `npm run typecheck`, `npm test` (**285 tests as of Session 59**), `npm run build`, `npm run db:push` after schema edits, `npm run docs:pdf` (regenerate prospectus/badge PDFs). Prod build/deploy uses `npm run vercel-build`.

**Prisma models:** User, FitProfile, Collection, KnownGoodItem, ComfortCheck, Product, SizeOption, FitRecommendation, FitOutcome, Outfit/OutfitItem/OutfitLike, Follow, Post/Answer/AnswerVote, Report, Block, PetProfile.
- **User**: claimed, accountCode?(unique `FP-XXXX-XXXX-XXXXX`), username?, email?, passwordHash?, bodyType?(coarse), exportPolicy(owner|anyone), listedInCommunity, pinnedBadges(CSV≤3), signatureOutfitId?, **memberNo?**(Int unique, `No.00000001`), **role**("USER"|"ADMIN"), **grantAllBadges**, deactivated, reset-token fields.
- **FitProfile** (1:1): sex?, shopsFor?, height/weight/chest/waist/hip/shoulder/sleeve/inseam cm (optional), **preferredFit = CSV≤3 of slim/regular/relaxed/oversized (FIRST = primary)**, region(US/EU/UK/JP/CN), avatarDataUrl?, notes.
- **Collection**: user-renamable folder (name, color?, sortIndex) — DISTINCT from **KnownGoodItem.category** (garment type the engine uses, NOT renamable).
- **KnownGoodItem**: brand, displayName?, category, gender?, size, region?, fitRating(1-5), areaNotesJson?, editHistory(JSON), collectionId?, color?, imageDataUrl?(user photo only), onlineAvailable, productUrl?, group fields.

**Routes** (`src/app/api/`): profile, profile/prefs, closet(+extract/reorder/group/refresh), collections, check, recommend, outcome, status, community, outfits(+like), follow, posts(+[id]), answers(+vote), leaderboard, block, report, admin/reports, tryon, view/[code](+export), auth/{claim,login,logout,me,request-reset,reset,change-password,deactivate}. **Pages:** `/`, `/passport`(VIEW metal card vs EDIT), `/closet`(filing-cabinet folder view + list), `/check`, `/community`(directory + Today board + Ask + outfit feed), `/u/[code]`, `/outfits`, `/badges`, `/help`, `/admin`(review queue), `/account`, `/login`, `/reset`, `/refresh`, `/history`.

**Extraction pipeline** (`lib/extractor.ts` + `lib/pageParse.ts` + `lib/extractorLLM.ts`): `extractSmart(url)` is layered — fixture → **fetch the real page** (browser UA, `looksBlocked` bot-block detection, TTL cache, 1 retry) → deterministic `parsePage` (JSON-LD, OpenGraph, on-page `<table>` size charts both orientations + EN/CN headers + inch→cm; `parseSizeLabels` for offered labels; `parseChineseSizeCode` for GB/T `160/84A` 号型 → body-chest band on TOP categories) → if `ANTHROPIC_API_KEY`: text LLM, then **vision OCR** of chart images (`findSizeChartImages`+`callVisionLLM`, key-gated) → else URL estimate. **`source.sizesFrom: "fixture"|"page"|"estimated"`** drives honest UI ("read from the page" vs "estimated") and confidence caps. `FIT_DISABLE_PAGE_FETCH=1` disables network. **LLM ONLY extracts, never picks a size; chart images fetched only to read numbers, never stored/displayed.**

**Fit engine** (`lib/fitEngine.ts`, transparent rule/score, NOT an LLM): `scoreMeasurementFit` scores **chest+waist+shoulder** (soft Gaussians, chest-dominant, renormalised over present dims → chest-only == legacy behaviour), names the binding dimension; uses retailer body-range (`bodyChestMin/Max`) when present; garment-aware ease (`easeAdjustForCategory`, tops=0 baseline); per-size ordinal **verdict** (too small…true to size…too big); confidence scales with top-2 margin. Plus known-good anchor (same-brand+same-category rated≥4 → ANCHOR_W dominates, [F1]), outcome learning, per-user brand-bias (`brandBias.ts`, pollution-guarded ±1), domain-relevance cross-domain cap. **Region cold-start prior** (`populationPrior.ts`): fills chest/waist/shoulder from published survey means by region+sex ONLY when user has none; sets `chestIsEstimated` → confidence capped ≤0.4 + "regional averages" wording; **never infers/stores ethnicity, never guesses sex, never overrides real data**.

**Badges** (`lib/badges.ts` = single source of truth): 4 tracks × 4 tiers (bronze→silver→gold→**titanium**) — wardrobe(shield)/fit-record(circle)/atelier(hexagon)/counsel(quatrefoil) — + rare capstones (diamond/obsidian) + special metals (amethyst/jade/amber). Earned from REAL stats (`badgeStats.ts`); `grantAllBadges` flips presentation only (never fakes stats). Rendering: `BadgeMedallion` (struck-metal SVG, one top-left light, finish ladder, agate veins on diamond+), `BadgeCoin` (dimensional — standing angle so thickness shows at rest, real rim slices; **NO flat variant**), `BadgeSeal` (hover=turn, click=inspect), `BadgeWebGL` (extrudes the real silhouette via shared `outline()`/`shapePath()`/`shapePolygon()`). Passport = one Amex-style **MetalCard** themed by highest earned metal (user-pickable from owned only), PNG export via `cardExport.ts`, reused as community banner.

**Invariants (do not break):** ① fit engine transparent, not LLM. ② **Privacy:** `/api/view/[code]` returns closet + coarse bodyType only, NEVER cm fields; deactivated → invisible everywhere; community/leaderboard use `readSession()` not `getCurrentUser()` (else scrapers mint anon users). ③ **No scraped brand imagery/logos** — brand = text, images = user-uploaded only (`STOLEN_IMAGE` report reason exists). ④ `authEdge.ts` (Web Crypto) byte-compatible with `auth.ts` (Node). ⑤ `KnownGoodItem.category` (engine type) ≠ `Collection` (user folder). ⑥ **`SESSION_SECRET` required in prod but resolved PER CALL** (never at module load, or `next build` breaks). ⑦ Admin = **script-only** (`scripts/seed-admin.mjs`; the local seed credentials are that script's defaults — production uses a generated password); no API grants role; admins still can't read measurements. ⑧ Reporting = bad content; Block = a person (both-ways, `lib/blocks.ts`). ⑨ Rate limiter (`lib/rateLimit.ts`, async) needs Upstash Redis in prod (memory counters meaningless on serverless).

**Active gotchas:** • **Stale `.next`** — a prod smoke after `npm run dev` is unreliable; `rm -rf .next && npm run build` first. • **Zombie server** — page hangs on "Loading…"? `lsof -nP -iTCP:3000 -sTCP:LISTEN` before reading code; kill all `next` procs, start one dev. • **Stale Prisma Client** — restart dev after `db:push` or new-table queries 500 while tsc/tests stay green. • **CSS painting** — a positioned banner followed by negative-margin content needs `relative z-10` on the content (positioned siblings paint over static ones). • **Authorize BEFORE side effects** (even cleanup). • **No header element may change width with state** (reflow). • Extractor **fixtures match by URL substring regardless of domain** (harmless). • Test fetch fixtures must be **>200 chars** or extractSmart's unreachable-guard trips. • three.js lazy imports need `SafeBoundary` (a failed chunk silently blanks the subtree).

**Env keys (all OPTIONAL; app works without them):** `SESSION_SECRET` (prod), `ANTHROPIC_API_KEY` (LLM text + vision extract), `UPSTASH_REDIS_REST_URL`/`_TOKEN` (rate limit), `REPLICATE_API_TOKEN`/`TRYON_API_URL` (photoreal try-on, else mannequin), `RESEND_API_KEY`+`EMAIL_FROM` (reset emails), `APP_URL`. In `app-web/.env.example`.

**See also:** [[project-fit-passport-design-system]] (visual system), [[project-fit-passport-deployment]] (Vercel+Neon), [[project-fit-passport-community-ecosystem]] (ecosystem plan), [[project-fit-passport-next-steps]] (backlog), [[project-identity-sharing-idea]] (auth/threat model), and `docs/design/*research*.md` (fit + China research).

---

**SESSION 41–42 UPDATE (2026-08-24/25) — the app is LIVE at https://fit-passport.vercel.app.** Stack corrections: **Node 24 LTS** (the "pinned to Node 18.20" line above is a dead constraint from the old Mac), **Next 14.2.35** (security patch — CVE-2025-29927 middleware auth bypass matters here because `src/middleware.ts` is exactly where the session cookie is minted), **Lenis REMOVED** (see [[project-fit-passport-performance]]). **209 tests.**

**NEW INVARIANTS — do not break:**
⑩ **SSRF guard on every user-supplied fetch.** `lib/urlSafety.ts` gates `/api/check`: private/reserved IPv4+IPv6 (incl. `::ffff:` mapped), localhost/`.local`/`.internal`, embedded credentials (`https://shop.com@169.254.169.254/`), non-80/443 ports, plus a DNS check that **fails closed**. Redirects are followed **manually, 4 hops max, re-gating every hop** — `redirect: "follow"` invalidates every check on the original URL and is the standard bypass. Chart images for vision OCR go through the same gate. `resolvesToPrivateAddress` skips DNS only when `NODE_ENV === "test"` (vitest can't stub DNS; static checks still run).
⑪ **Never return a confident size for a non-apparel page.** `detectCategoryStrict` returns null when nothing matches (it used to default to `"tshirt"`, so a 代充 page / article / download got a confident size). `source.categoryGuessed` + `sizesFrom: "estimated"` ⇒ `/api/check` returns **422 `not-apparel`** and writes no Product row.
⑫ **Category keywords include Chinese, and must NOT use `\b`** — word boundaries are ASCII-defined and never match at a CJK boundary, so adding them silently disables the whole group.
⑬ **`MAX_PAGE_BYTES` is a cost control (80KB ≈ $0.02/check).** It was 600KB ≈ $0.15, ~20× the documented estimate. Safe only because `htmlToLlmText` emits `SIZE TABLES` before prose — tests pin that property.
⑭ **Confidence falls when signals disagree** (`signalDisagreement` in `fitEngine.ts`) and the reason is surfaced as `conflictNote` on `/check`. A lower number with no explanation would break the explainability invariant.

**Extraction reality, measured in production:** `source.fetch` now records `blocked | unreachable | ok | skipped`. Real result: **H&M = blocked, Patagonia = unreachable, Allbirds = ok.** `ANTHROPIC_API_KEY` is set in prod, but it **cannot fix a 403** — it only helps pages we actually fetched. See `docs/design/fetch-strategy.md` (decision: no stealth proxies, browser extension later) and `docs/design/cost-model.md`.


---

**SESSION 45 UPDATE (2026-08-25) — the SIGNED FIT SCALE shipped. 209 → 237 tests.**

**New single source of truth: `lib/fitDirection.ts`.** A signed integer −10 (too
tight) … 0 (just right) … +10 (too loose). New columns:
`KnownGoodItem.fitDirection Int?`, `ComfortCheck.direction Int?`,
`User.fitScaleMode String @default("descriptive")`.

**Engine:** `KnownGoodInput.fitDirection` feeds `scoreKnownGood` —
`directionToLadderShift()` moves the anchor (full range = one ladder step, matching
the ±1 return-shift term in Guigourès et al.). Applies to cross-brand anchors too;
the *preference* shift stays same-brand-only.

**NEW INVARIANTS — do not break:**
⑮ **`fitRating` is DERIVED from `fitDirection`, never asked for separately**
(`ratingFromDirection()`). It still drives stars, badge stats and legacy anchor
trust, so it cannot be deleted. **A centred report MUST map to `>= 4`** or
`hasStrongAnchor()` stops firing and the [F1] anchor fix silently dies — pinned by
a test.
⑯ **A directed anchor is trusted at `DIRECTED_ANCHOR_TRUST` (0.9), not
`fitRating/5`** — otherwise "too tight" is penalised twice, once by the correction
and again by the low stars it attracts.
⑰ **Anything that writes `fitRating` must write `fitDirection` too.** Fit Refresh
was the first case: writing only the grade left a stale direction contradicting a
fresh rating on the same row.
⑱ **The fit input is NEVER a drag slider.** Descriptive mode is radio semantics;
numeric mode is a tap-on-the-line VAS. Measured break-off: sliders 37% on
phones/tablets vs 2.3% for radio buttons (Funke 2016). Also: a resting handle makes
non-response indistinguishable from a real answer.
⑲ **`FitFigure` is a DIAGRAM, not a try-on.** Schematic, true proportion, no
exaggerated gap, centimetre number printed beside it, caption says "Not a preview
of how it will look" — because the research file's first conclusion is that
image-based try-on transfers appearance, not fit.
⑳ **`fitDirection` is NOT exposed by `/api/view/[code]`** (allow-list `select`).
Widening what a bearer code reveals is a governance decision — founder's call, not
a feature side effect.

**`body` (chest/waist/shoulder + `estimated`) is now returned by `/api/check` and
`/api/recommend`** so `FitFigure` can draw without a second round trip. That is the
user's OWN session — the privacy invariant governs `/api/view/[code]`, re-verified
as returning no measurement field of any kind.

**Mode plumbing:** `FitScaleProvider` / `useFitScale` (context, in
`FitDirectionInput.tsx`) carries the per-user mode; mounted on `/closet` and
`/refresh`, read from `/api/status`, persisted via `/api/profile/prefs`. Sticky per
user, **never per item**.

Design + sources: `docs/design/closet-signal-and-interaction-cost.md`;
summary in [[project-fit-passport-closet-signal-design]].


---

**SESSION 46–48 UPDATE (2026-08-25). 237 → 265 tests.**

**A production outage worth knowing about (Session 46).** Three columns were added
to `schema.prisma` and only `npm run db:push` was run — that writes to **local
SQLite**. Production applies **committed migrations**, so Postgres never got the
columns while the client queried them: `/api/status`, `/api/closet` and
`/api/collections` all 500'd. **The symptom was `/passport` stuck on "Loading…"** —
the page rendered, the API behind it did not. Typecheck, 237 tests, the production
build and a 14-page local smoke were ALL green, because local SQLite had the
columns. Full account + the no-shadow-database fix recipe in
[[project-fit-passport-deployment]].

**NEW INVARIANTS:**
㉑ **Changing `schema.prisma` requires a migration.** `db:push` is not one.
`src/lib/schemaMigrations.test.ts` fails when a column has no migration — it needs
no database, and it was verified to go red on the real bug before being kept.
㉒ **Closet reports feed brand bias, and must NOT double-count the anchor.**
`biasForBrand` takes the product's category and **excludes closet items of that
type**, because `scoreKnownGood` already moved the anchor by them. Anchor handles
same-category; brand bias generalises across categories.
㉓ **Report-consistency confidence is ASYMMETRIC by design** (`closetConsistency.ts`).
Scatter lowers confidence (floor 0.85) with the reason surfaced; agreement does NOT
raise it, and being *consistently* off-centre is not penalised — scatter means we
know less, offset just means they buy up.
㉔ **Mobile navigation must exist.** Every nav link is `hidden … sm:block`; the menu
panel in `Nav.tsx` IS the phone navigation. Before Session 48 nothing took their
place and the app was unreachable past the homepage on a phone.
㉕ **`min-w-0` belongs on flex AND grid items.** Both default to `min-width: auto`
and refuse to shrink below content, so `truncate` alone does nothing. `body` has
`overflow-x-clip`, so an overflow is **silently clipped, not scrollable** — it will
never show up as a horizontal scrollbar. Measure with
`app-web/scripts/mobile-audit.mjs`.

**Not derivable, contrary to an earlier design note:** a personal ease target in
centimetres. `KnownGoodItem` stores **no garment measurements**, so `ease = garment
− body` has no garment side. It needs the size chart captured at add-by-URL time.
See [[project-fit-passport-closet-signal-design]].

**Open governance question for the founder:** whether `fitDirection` should be
visible to an account-code holder. Currently **no** — the view endpoint's allow-list
`select` excludes it, and widening what a bearer code reveals is a decision, not a
feature side effect.


---

**SESSION 49–56 UPDATE (2026-08-27).** 265 tests, unchanged — this stretch was
documentation, brand and measurement rather than engine work.

**Structural:** `docs/course/` → **`docs/business/`**. Course framing removed from
the published docs; the work itself is unchanged.

**Brand.** `src/components/Logo.tsx` now renders the **Fit Thread** mark and is
**generated from `brand/fit-passport-mark-master.svg`** — edit the
SVG and re-derive rather than hand-editing the path in the component. It picks
weight automatically: micro under 40px, master above. Favicon assets live at
`src/app/{favicon.ico,icon.svg,apple-icon.png}` and are picked up automatically by
the App Router.

**NEW INVARIANTS:**
㉖ **The mark has size floors.** Master ≥40px, micro 24–40px, and **16–20px needs
the separately drawn favicon glyph** — no amount of thickening makes the full mark
survive there. Judge small sizes at `deviceScaleFactor=1`; a retina screenshot gives
26 CSS px fifty-two device pixels and flatters it.
㉗ **Check for `<path>` before believing an SVG is vector.** A supplied "fixed" SVG
was a `<rect>`+`<pattern>` over an embedded PNG — 146KB against 5KB for the real
vector — and its bitmap was byte-identical to one already in the repo. Filenames and
intent both said "fixed".
㉘ **Palette: cool porcelain `#F3F3F1`.** Warm Ivory `#F3EFE7` is retired from the
logo documents. Two systems disagreeing was worse than either choice.

**Measurement tooling now in the repo** (both need `npx playwright install chromium`;
playwright is deliberately NOT a dependency):
- `app-web/scripts/mobile-audit.mjs` — element rectangles at phone viewports.
  Measures rectangles, not document scroll width, because `body`'s `overflow-x-clip`
  hides overflow rather than making it scrollable.
- `brand/tests/size-test.mjs` — the mark at real sizes and true
  device pixels, on the approved grounds.

**Information architecture is sketched, NOT built** —
`docs/design/information-architecture.md`. Measured: `/closet` shows **23 input
controls and 104 tappable elements** over 5.5 screens; the homepage runs 9.8. The
least dense page is `/refresh`, and it is the only flow that already asks one
question at a time. See [[project-fit-passport-next-steps]].

---

**SESSION 58 UPDATE (2026-08-27).** 265 → **273 tests**.

**The closet add form is now a four-question flow, not an eleven-field grid.**
`AddItemFlow` in `src/app/closet/page.tsx`, with its question set, FIC weights and
readiness rule extracted to **`src/lib/addFlow.ts`** so `addFlow.test.ts` can hold
them. Brand → category → size → fitDirection, one screen each, modelled on
`/refresh`. The add-by-URL box lives on step 1 and skips ahead to the size question
when extraction returns a brand and a category.

**NEW INVARIANT:**
㉙ **A question only belongs on the closet add path if `fitEngine.ts` reads its
answer.** Measured by grep, not by intuition: `gender` and `color` appear **zero**
times in `fitEngine.ts`, and `areaNotesJson` is stored and displayed but never
scored. Those, plus name, photo and the in-store flag, sit behind "Add details
(optional)" and stay editable on the item. The four that remain cost 12 + 5 + 10 + 3
= **30 FIC, exactly the §3.2 first-run budget**, so any fifth question breaks it —
`addFlow.test.ts` fails on both the budget and the missing engine use, verified red
before being kept. Also pinned there: **category must be asked before size**, because
`isValidSize(category, size)` would otherwise validate against the default category.

**Measured effect** (same script, same account, 390px, `deviceScaleFactor=1`):
input controls on `/closet` **28 → 15**, tappable elements **127 → 84**, height
**5.5 → 4.5 screens**, sub-44px tap targets **21 → 14**, no horizontal overflow
either way. The tap-target figure fell because fewer small controls are on screen at
once, not because anything got bigger.

**Note on the Session 56 numbers:** the sketch recorded 23 inputs / 104 tappable for
this page. Different script, different closet contents — not comparable with the pair
above, and neither is wrong.

---

**SESSION 59 UPDATE (2026-08-28).** 273 → **285 tests**. A tidying pass, no product
change.

**Repo layout changed: `brand/` is now top-level.** The logo masters, delivery
exports, archived raw exports and `tests/size-test.mjs` moved out of
`docs/design/assets/logo/`. **`docs/` is what you read; `brand/` is what the app and
the print files are built from.** The written story stays in
`docs/design/LOGO_CONCEPT.md`. Old DEVLOG entries still name the old path on purpose.

**NEW INVARIANTS:**
㉚ **`Logo.tsx` inlines the master's path as a string — it does not load the SVG.**
So the artwork of record and what users see are two copies. `src/lib/logoAsset.test.ts`
fails when they drift (path, viewBox, and `MICRO_STROKE` against the micro asset's
`stroke-width`), and re-checks ㉗ on every shipped mark: a `<path>` present, no
`<image>` and no embedded base64 bitmap. Verified red on a 0.01-unit nudge before
being kept. **If it fails, re-derive the component from the SVG — never the reverse.**
㉛ **The garment colour palette has exactly one home: `src/lib/colors.ts`.** It had
four (closet page, `/refresh`, `/u/[code]`, `OutfitMannequin`) in two different
shapes. They agreed by luck; nothing enforced it, and a colour added to the picker
would have rendered as **no dot** on the three pages that never heard about it.
`colorHex` returns null when it cannot resolve (draw nothing); `colorHexOr` takes a
fallback, for the mannequin, which must paint something.

**Also:** `credentials_layout.html` was a design mockup at the repo root under a name
that tripped the standing credential sweep on every commit — now
`docs/design/passport-card-mockup.html`. No orphaned components or lib modules
(checked by import). Both READMEs now list `docs/memory/` and `docs/RESUME.md`, which
they had never mentioned.
