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

**Stack (pinned for Node 18.20 — do NOT upgrade Next/Prisma without upgrading Node):** Next.js 14.2.15 (App Router, src dir), React 18.3, TS, Tailwind v3, Prisma 5.22 + SQLite (`app-web/prisma/dev.db`), Zod, bcryptjs, Vitest; Framer Motion + Lenis (motion); three.js (lazy: badge inspect AND the 3D dress form / ease shell in `BodyMesh3D.tsx`, Sessions 66-67 — the 'badge inspect only' this line used to say went stale the day the dress form shipped). Self-hosted fonts `src/app/fonts/{Inter,Fraunces}.woff2` via `next/font/local` (Google Fonts fetch at build time died on IPv6 — self-hosting removed that dependency; both OFL 1.1).

**Commands:** `npm run typecheck`, `npm test` (**419 tests as of Session 72**), `npm run build`, `npm run db:push` after schema edits, `npm run docs:pdf` (regenerate prospectus/badge PDFs). Prod build/deploy uses `npm run vercel-build`.

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

**Extraction reality, measured in production:** `source.fetch` now records `blocked | unreachable | ok | skipped`. Real result: **H&M = blocked, Patagonia = blocked (see the correction below), Allbirds = ok.** `ANTHROPIC_API_KEY` is set in prod, but it **cannot fix a 403** — it only helps pages we actually fetched. See `docs/design/fetch-strategy.md` (decision: no stealth proxies, browser extension later) and `docs/design/cost-model.md`.


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

---

**SESSION 60 (2026-08-28) — two ways the engine was inventing answers, found by
driving the live site rather than reading it.** 285 → 300 tests.

㉜ **`/api/check` refuses any category the engine cannot score.** The scoreable set
is `SCOREABLE_DOMAINS` in `sizeSystems.ts` — **`top` and `bottom` only** — and it
lives there, not in the route, because adding to it is not a UI decision: it needs a
real `FitProfile` field to compare against. There is no foot length, head or neck
measurement, so footwear, socks and accessories cannot be scored at all. Without the
guard, `buildSizes` in `extractor.ts` hands a shoe page **the same letter ladder and
chest measurements it would give a t-shirt**, and the engine dutifully scores them:
measured on production, a men's sneaker URL returned **"XS" at 24% confidence**. This
is invariant ⑪ extended to the case its wording missed — a page we *can* read, for a
garment we cannot measure anyone against.

㉝ **A total tie is reported as `undetermined`, never as a pick.** When no signal
produces a reason and every candidate scores identically, `best` is just the first
rung of the ladder. Measured before the flag existed: an empty profile with an empty
closet returned **XS at 0.24 on a t-shirt**, all five sizes tied at 0.20, with an
explanation claiming the pick was *"based on your closet and preference"* — a closet
that did not exist. `/check` now renders "We can't tell these apart" instead of a
48px size with a confidence ring, and the "Alternative: S is close" line is
suppressed, because calling the second rung close implies the first was ahead of it.
**Ladder position is not evidence.**

㉞ **The onboarding question set is governed the same way the closet's is.**
`lib/onboardingFlow.ts` + `onboardingFlow.test.ts`, mirroring `addFlow`. Engine
reference counts settled it: `chestCm` 32 · `shoulderCm` 19 · `waistCm` 15 ·
`region` 15 · `preferredFit` 12 · `sex` 9, against **`hipCm` 0 · `heightCm` 0 ·
`weightKg` 0 · `inseamCm` 0 · `shopsFor` 0 · `notes` 0**. The engine's five
`sleeveCm` hits are the GARMENT's sleeve on `SizeOptionInput` — the wearer's own
sleeve is never scored, which looks like a hit in a grep and is pinned by a test for
exactly that reason. **`BLOCKING_STEPS` is empty and a test enforces it**: a first
size check must be able to run on an empty profile. 10 visible inputs → **0 on the
first screen**, 3.2 → **1.9 screens** at 390px.

**Also:** `/check` now shows the API's human `message` on a refusal instead of the
machine slug — the route writes a careful sentence and the page was throwing it away.

---

**SESSION 61 (2026-08-28) — the invitation is grounded in the answer.** 300 → 304 tests.

㉟ **`CONFIDENCE_WEIGHTS` lives in `lib/confidenceWeights.ts`, a leaf module with no
imports — not in `fitEngine.ts`.** Two forces, both real. It must have ONE home
because `/check` now tells people what a measurement or a closet garment is worth,
and that promise has to be the arithmetic the scorer runs (the four-copy colour
palette, invariant ㉛, is the counterexample). But importing it *from the engine*
pulled sizing, sizeSystems, brandBias, fitDirection and closetConsistency into the
client bundle — **measured: /check went 8.91 → 10.2 kB, back to 9.33 kB once the
constant moved to its own file.** A shared constant that a client component needs
belongs in a leaf, not in the module that happens to use it most.

㊱ **The UI says "up to +35 points", and the "up to" is load-bearing.** A first draft
claimed a flat +35 and a test caught it: `computeConfidence`'s raw sum then passes
through **six** caps and multipliers — cross-domain 0.35, report consistency, top-2
margin, signal agreement, and hard caps at 0.6 and 0.4 — every one of which can only
shrink it. A bare floor case measures **0.18, not the 0.30** the constant alone
implies. The tests now pin the property that is true (confidence never exceeds the
weight sum; never exceeds the floor with no evidence) rather than the equality that
isn't, and the copy was corrected to match the code rather than the reverse.

㊲ **`/passport`'s edit grid stays dense, on purpose.** It is an EDIT surface —
someone changing one number should see all of them — and Session 58 made the same
call about the closet's edit form. What was wrong was *defaulting a first-time
visitor into it*: an empty passport opens in edit mode, so a newcomer met eight blank
number fields (10 inputs, 3.3 screens at 390px). An empty passport now offers the
guided `/onboarding` above the grid — an offer, not a redirect, and `/check`'s
"add your measurements" CTA points there too.

---

**SESSION 63 UPDATE (2026-09-01).** 304 → **314 tests**. One bug, worth the invariant.

**"Set your fit preference" was ticked before anyone touched it.** `getCurrentUser()`
creates the `User` **and** a seeded `FitProfile` (`preferredFit: "regular"`,
`region: "US"`) in the same upsert, and `/api/status` runs through
`getCurrentUser()`. So the status call created the profile, then queried for it,
then found the row it had just made: `done: !!profile` was true on the first request
for everyone. Clearing the browser cache did nothing — a fresh cookie just minted a
fresh already-"done" row.

**NEW INVARIANT:**
㊳ **A `FitProfile` row existing proves nothing — it is seeded for every visitor on
their first request.** Never gate UI on `!!profile`. Ask
`hasStatedProfile()` from `src/lib/profileCompleteness.ts`, which needs **two**
signals because neither alone is enough: `updatedAt > createdAt` (Prisma sets them
exactly equal on create — measured, delta 0 — and this is the only thing that
catches a user whose real answer *is* the seeded default), **or** a nullable
no-default field holding a value (which catches single-`create` rows like the demo
seeder's, where timestamps match but the values are real).

**Known gap left in place on purpose:** `hasBody` is chest/height/waist, but
`scoreMeasurementFit` scores chest/waist/**shoulder** and never reads height — so a
shoulder-only user is told they have no measurements and a height-only user is told
they do. Changing it moves the displayed accuracy tier for existing users, so it is
a product decision. Recorded in the module, not left to be rediscovered.

**Debugging note that generalised:** the bug was found by `curl`-ing `/api/status`
with no cookie *before* reading any component — invariant ⑧'s "check the API first"
applies to wrong state, not just to a hung page. `/check` renders the same checklist
off `hasBody` and showed the step correctly undone; two surfaces disagreeing is a
strong signal about which one is lying.

---

**SESSION 64 UPDATE (2026-09-01).** 314 → **321 tests**.

**`hasBody` completed — and it turned out to be two questions, not one.** It was
chest/height/waist. `scoreMeasurementFit` scores **chest 0.6 / waist 0.22 /
shoulder 0.18** and reads nothing else; `recommendService.ts` never even passes
height, weight, hip, sleeve or inseam into `EngineInput`. So the flag counted a
dimension the engine cannot use and missed one it does. (Height is not dead —
`deriveBodyType` uses height + weight for the coarse body type. It just has nothing
to do with picking a size.)

**NEW INVARIANT:**
㊴ **"Can we size this person" and "would another measurement raise confidence" are
different questions, and `src/lib/profileCompleteness.ts` answers them separately.**
`hasBodyMeasurement` = chest ∪ waist ∪ shoulder (`ENGINE_SCORED_DIMENSIONS`, pinned
by a test so adding a `FitProfile` field cannot silently widen the claim) → accuracy
tier and first-run nudges. `hasChestMeasurement` = chest only → any UI offering
confidence points, because `computeConfidence` grants
`CONFIDENCE_WEIGHTS.measurements` for `hasChest && size.chestCm != null` **and
nothing else**. Gating `/check`'s "+35 points" on the wrong one told a waist-only
user the offer was closed while the points were still unclaimed.

**Help page — the mark section is a specimen plate.** Reversed on ink, the Ariadne
mapping as three numbered steps across, a pull quote, and the mark rendered at
96/40/24/16 px next to the caption claiming it fails below ~20. **The copy did not
change** — it is the concept document's own wording (Session 62) and only the
presentation moved. The size demo was checked at `deviceScaleFactor: 1` per ㉖; at 2x
it would have flattered the 16px mark and quietly contradicted its own caption.

---

**SESSION 66 UPDATE (2026-09-01).** 321 → **340 tests**.

**A measured 3D body shipped**, opt-in on `/passport`. `src/lib/bodyMesh.ts`
(pure geometry — elliptical cross-sections at hip/waist/chest/shoulder, each
carrying the circumference the user typed) + `src/components/BodyMesh3D.tsx`
(three.js loft). The flat `BodyFigure` stays the default.

**NEW INVARIANTS:**
㊵ **The 3D body renders measurements, never invents them.** It refuses to draw
from an empty profile, and `circumferenceCm` is **null for every inferred ring**
so the UI cannot print a centimetre the user did not give. The neck/base rings
that stop it reading as a vase live in a separate `drawingRings()`, are never
listed, and sit entirely outside the measured range — all pinned by tests. A
learned body model (Anny, MHR) was available and permissive and was still
rejected: its job is to plausibly invent what you did not measure, which is the
one thing this project does not do.
㊶ **Use `centripetal` Catmull-Rom for the body loft.** Uniform parameterisation
overshoots the sharp shoulder→neck step enough to bulge the neck wider than the
shoulder — the first render looked like a vase. Centripetal still interpolates its
control points, so measured rings stay on their measured values.

**Visual language, decided:** it looks like a **tailor's dress form**, and that is
the answer rather than a compromise — a dress form is a body's measurements made
into an object for fitting clothes, and nobody mistakes one for a photo of
themselves. It satisfies invariant ⑲ by construction instead of by caption.

**Next step is the ease shell** (garment measurements as a second translucent
surface); after that, capturing size charts at add-time, which the backlog already
wanted for the personal-ease-target work. See `docs/design/3d-body-and-tryon.md` §8.

---

**SESSION 67 UPDATE (2026-09-01).** 340 → **353 tests**. A schema change, done with
a migration.

**The ease shell** — `garmentShellRings()` in `bodyMesh.ts`, drawn by `BodyMesh3D`
via an optional `garment` prop, offered on `/check` beneath the 2D `FitFigure`
(never replacing it). Coloured by **sign**: cobalt when the garment has room,
amber when it measures smaller than the wearer — because a too-small garment
renders *inside* the form and the only visible part is where the body bursts out,
which a viewer can otherwise read as decoration. Open tube, no caps; camera frames
the union of body and shell.

**`KnownGoodItem` now stores the garment's own measurements**
(`garmentChestCm/ShoulderCm/SleeveCm/LengthCm` + `garmentMeasuredFrom`), captured
from the chart at add-by-URL time. `/api/closet/extract` used to fetch a full chart
and return only the labels. **This unblocks the personal ease target in
centimetres**, which the Session 46–48 note recorded as *not derivable* — that note
is now superseded.

**NEW INVARIANTS:**
㊷ **A stored garment measurement must carry its provenance.** `garmentMeasuredFrom`
is enforced by a zod refinement on `/api/closet`, not by convention: a number off
the retailer's chart and one from the extractor's fallback ladder are
indistinguishable on screen, and that difference is what `source.sizesFrom` exists
to preserve. The closet shows a "garment measured" / "garment estimated" badge.
㊸ **The size chart the shell is drawn from states a chest and a shoulder and
nothing else.** Below the chest the shell holds that circumference **straight
down**, stated as an assumption in the UI — narrowing towards the body would invent
a taper the garment may not have.

**A hole in the migration guard, found and closed.** `schemaMigrations.test.ts`
anchored its regex as `ALTER TABLE … ADD COLUMN`, so on Prisma's comma-joined
multi-column `ALTER` it saw only the **first** column and reported four correctly
migrated ones as missing. That is a false alarm on the first multi-column migration
anyone writes, and a guard that cries wolf gets skipped past — which would have
disarmed the alarm for the outage it exists to prevent. Now parses whole
`ALTER TABLE … ;` statements, with the parser pinned by its own tests. The fix makes
it report *fewer* missing columns, so it was re-verified in the dangerous direction:
a column with no migration still turns it red.

**Privacy re-checked:** the new columns are **not** in `/api/view/[code]`'s allow-list
`select`, so an account-code holder does not see them. Widening it stays invariant ⑳.

---

**SESSION 68 UPDATE (2026-09-01).** 353 → **381 tests**. The engine now reads the
garment measurements Session 67 captured.

**The personal ease target is BUILT** — `src/lib/personalEase.ts`. It learns the
ease this wearer actually lives in and the engine scores with it in place of the
constant behind their stated slim/regular/relaxed label. **The "not derivable"
correction in `closet-signal-and-interaction-cost.md` §1.2 is superseded.**

**NEW INVARIANTS:**
㊹ **A learned ease target is capped at one ladder step from the stated
preference**, needs **two** measured garments minimum (four for full weight), uses
the **median**, ignores `estimated` provenance entirely, loses all weight when the
garments disagree by a full ladder step, and is attached as a **weight-0 reason**
on every size — it moved the target they were all measured against, so it belongs
in the explanation even though it pushed no size over another.
㊺ **Cross-brand anchors are placed by MEASUREMENT, not by size label** — when we
have a read garment chest and the product states chests. `scoreKnownGood` used
`alphaIndex(kg.size)`, so a Roomy Brand M (118cm) and a Uniqlo M (100cm) sat at
the same rung and the engine recommended a garment **18cm smaller** than the one
the wearer said fits. **Same-brand anchors deliberately stay on the label**: the
ladder already lines up within a brand, the label is what the wearer recognises,
and [F1] anchor dominance depends on that path.

**How ㊺ was found, because the method generalises:** an end-to-end run of the new
ease feature said "you wear +18cm of room" and then recommended a *smaller* size.
The result was absurd rather than merely surprising, which is the signal worth
chasing instead of tuning around — and the cause turned out to be a decade-old
approximation sitting next to the new code, not the new code.

**Note on writing engine tests:** two expectations here were wrong before the code
was. With a body chest present the measurement term (0.45) outranks a weak
cross-brand anchor (0.35 × 0.75), so a test meant to isolate anchor behaviour must
drop the chest or it is testing something else.

---

**SESSION 69 UPDATE (2026-09-01).** 381 → **384 tests**.

**NEW INVARIANT:**
㊻ **A weight-0 reason is CONTEXT and must still reach the explanation.**
`topReasons` ranks by absolute weight and takes two, so a reason that legitimately
carries no weight — the personal ease target moves the target every size is
measured against, rather than pushing one over another — was permanently buried.
The screen showed "chest 14.5cm smaller than your regular target" while regular
means 10cm, with nothing saying why. Zero-weight reasons are appended after the
top two now: the explanation still leads with what told the sizes apart.

**Method note, which generalises beyond this bug:** Sessions 66–68 were verified by
unit tests and by end-to-end API calls, and both passed. This only appeared in a
screenshot of the rendered page. **Checking the rendered page is a separate act
from checking the code** — a feature can be right in the engine, right through the
API, and still unreadable.

---

**SESSION 70 CORRECTION + UPDATE (2026-09-01).** 384 tests.

**"Patagonia = unreachable" was wrong in what it implied.** Measured directly:
`patagonia.com/` returns **200 with 409KB**, a nonsense path returns **410 with
their own 318KB error page**, and a real, in-stock product path returns a bare
**10-byte `Not found\n` with no content-type**. The site is up and answering; it
gates product pages against non-browser clients, and returns 404 rather than 403
so the client is not told it was detected. It belongs in the **blocked** column —
which matters, because "unreachable" reads as a transient network problem while
"blocked" is the category the browser-extension decision was made for.

`looksBlocked` does not catch it (403/429/503 plus challenge markers), and a bare
404 cannot be distinguished from a genuinely dead link without guessing, so the
classifier was left alone. **The policy in `fetch-strategy.md` §2 settles what we
do about it: a gate is a technical access control, and defeating it with spoofed
headers is the move this project rejected on legal-posture grounds.** We cannot
read Patagonia product pages, and that is a decision, not a bug.

**NEW INVARIANT:**
㊼ **If the fetch failed AND the sizes are estimated, refuse — do not serve a
ladder.** Nothing on screen would have come from the retailer: brand from the
domain, category from a word in the URL, sizes from a generic ladder we keep for
known brands. The Patagonia check was showing **XS–XL with chest
106/111/116/121/126** — five measurements no page ever stated — and then telling
the user it couldn't tell them apart. `/api/check` now returns 422 `unreadable`.
This is invariant ⑪ one step wider: ⑪ covered a page we could read but couldn't
find a garment on; this covers the page we never saw.

**Copy: the tie was being announced four times.** "No recommendation yet", "We
can't tell these apart", "All N sizes scored the same…", and the engine's own
four-sentence explanation. Now the heading states the fact once and the engine's
line does the one job the heading cannot — say what is missing. The homepage's
three-sentence lede is one sentence. **Repeating a limitation does not make it
clearer; it makes the product read as an apology.**

---

**SESSION 71 UPDATE (2026-09-01).** 384 → **389 tests**. Copy and order, no engine
change.

**NEW INVARIANT:**
㊽ **Order the homepage by intent: someone who has already given us data gets
their dashboard directly under the hero.** It used to sit at **screen 5.6 of 10**
behind four consecutive sections restating the same proposition. Now screen 1.2.
Anonymous visitors still get the full case in its original order — verified
separately, since the branch is easy to break silently.

**Reference pages are exempt from copy-trimming.** `/help` (1033 words) and
`/badges` (417, almost all prose) are dense because reading is what they are for,
and `/badges` rows are generated from `badges.ts`. Cutting a page someone opened
in order to read is cargo-culting the "too much text" complaint rather than
answering it.

**Measured reading load, 390px logged in, for future comparison:** `/` 654→584
words and 398→338 prose; longest single block 36→25. **Total height barely moved
(10 → 9.8 screens) — the win was what you reach first, not how much exists below.**

**A Next App Router `page` file may only export the framework's own symbols.**
Exporting a helper from `page.tsx` fails the build's generated type check
(`.next/types/app/page.ts`), which typecheck catches but only after a build has
generated the types. Helpers go in `lib/` — see `src/lib/productLabel.ts`, added
because the dashboard was printing "Uniqlo Uniqlo AIRism…".

---

**NUMBERING NOTE (2026-09-03).** Invariants **㉜–㊲ were issued twice**: once by the
Session 60–62 work and once by Sessions 63–67, because two lines of work numbered
from the same stale count without seeing each other. The second set has been
renumbered to **㊳–㊸**, and everything after it shifted to match, so the list is
unambiguous again. **DEVLOG entries from Sessions 63–70 still carry the old
numbers** — they are a historical record and were accurate when written; resolve
them against this list by description rather than by number. Before adding a new
invariant, take the number from the BOTTOM of this file, not from memory.

---

**SESSION 72 UPDATE (2026-09-08).** 389 → **419 tests**. Curated brand size charts,
plus two bugs that only the rendered page showed.

**The invented ladder is no longer the only thing we can say about a walled brand.**
`BRAND_TABLE` gave each of thirteen brands a `chestBaseCm` and a `stepCm`, and
`buildSizes()` extrapolated them linearly with shoulder/sleeve/length **identical for
all thirteen**. That arithmetic is where Patagonia's `XS 106 · S 111 · M 116 · L 121 ·
XL 126` came from. `src/lib/brandCharts.ts` now holds charts read from the brands' own
published size guides, behind a new provenance `sizesFrom: "brand-chart"` that ranks
between `page` and `estimated`. One brand captured so far (Nike men's tops).

**Measured blocking landscape (2026-09-08, plain client, no header spoofing):** Nike
200 with a robots.txt reading "just crawl it" · J.Crew 200 but its numbers load from
`*/sizecharts-module/`, **disallowed by its own robots.txt** · Patagonia the same
bare 10-byte 404 as Session 70, on the size guide as well as on products · Uniqlo
connection failure even on the homepage · COS/Adidas/H&M/Zara 403. **A gate that
blocks products usually blocks the size guide, and readable ≠ permitted.**

**NEW INVARIANTS:**
㊾ **A curated chart stores numbers the brand published, never a third party's
compilation, and always with the URL and date that make it checkable.** A chart nobody
can trace back to a page is indistinguishable from the invented ladder it replaced; a
test enforces that every `sourceUrl` is on the brand's own domain. `capturedBy:
"fetch"` additionally requires robots.txt to permit the path — hence Nike in and
J.Crew out. `capturedBy: "manual"` (a person reading it in their own browser) is the
only route for a gated brand and is the intended use of a website, not a bypass of it.
㊿ **A body range and a garment measurement are different claims and must never share
a field.** `kind: "body"` emits `bodyChestMinCm/MaxCm`; only `kind: "garment"` may set
`chestCm`. A body number in the garment field makes every recommendation from that
brand wrong by roughly a full size **in the same direction**, which presents as a
tuning problem rather than a bug. Corollary: a body chart **cannot** feed
`personalEase.ts`, which learns `garment − body` and so needs a garment side.
**(51)** **`verdictFromDelta`'s input is GARMENT-relative** — negative means this size
is smaller than you want. The garment branch satisfies this naturally
(`size.chestCm - target`); the body-range branch computed `b - mid`, which is
**wearer**-relative, so every verdict off a retailer body range was inverted: with a
100cm chest against Nike's chart, L read "too small" and S read "too big". Only the
verdict was affected — `sub` uses the unsigned distance, so rankings were always right
— which is why it survived, along with the fact that the one existing test looked at
the *winning* size, where the two conventions differ by a fraction of a centimetre.
Pinned now by a monotonicity check across the whole ladder.

**GLYPH NOTE:** the circled-number characters end at ㊿ (50). Invariant 51 onward is
written `(51)`, `(52)` … Same rule as before: take the next number from the BOTTOM of
this file, never from memory.

**Also fixed:** `normalizeToAlpha` did not understand `2XL`/`3XL` — the way most US
retailers print the top of the ladder. They normalised to null, `alphaIndex` returned
null, and the size was displayed and then silently never scored. Handled from 2 up;
`1X` is deliberately left alone (a women's plus-size label on a different ladder, not
a synonym for XL) and `4XL`+ returns null rather than clamping to a rung it does not
occupy.

**Method note, and it is the same one as Session 69.** Both bugs above passed
typecheck, 400+ unit tests and end-to-end API calls. The inverted verdicts were found
by reading a live `/check` ladder; the "MEASUREMENTS FROM THE PAGE" overclaim (shown
for a check where no page was ever read) existed **only** in the render. Looking at
the rendered page is a separate act from checking the code, and it caught something
on the very next feature after the session that first recorded it.

**See also** `docs/design/brand-size-charts.md` — the capture recipe, the legal
posture with its ⚠️ caveats, and the open questions (staleness, brand fit-lines, and
retiring `BRAND_TABLE`'s invented constants once enough charts are real).

**SESSION 72b UPDATE (2026-09-08).** 419 → **430 tests**. Patagonia captured, and
the block finally diagnosed.

**We are NOT IP-blocked.** Same machine, same IP, Playwright Chromium:
`headless: true` blocked, **`headless: false` returns 200** — on `rei.com` and on
Patagonia's size-fit page. And it is not Patagonia-specific: with the same client
`akamai.com`, `homedepot.com`, `rei.com`, `northface.com` all 403 while
`llbean.com` and `google.com` are fine. **The gate keys on headless-automation
fingerprints, not on the network.** Consequences: residential proxies were not
only rejected on posture, they were the **wrong diagnosis**; and the
browser-extension thesis is now **measured rather than assumed** — the user's own
browser is not what is refused. A Python scraper is in curl's class and adds
nothing.

**NEW INVARIANT:**
**(52)** **A headed browser is for CURATION, never for check-time transport.** A
one-off read of a published reference page, output typed into `brandCharts.ts`, is
a person using a website as intended. Driving a browser per user request is
automated access at scale against a control built to stop exactly that — and is
not viable on serverless anyway. Check-time order stays: read the page if
readable → curated chart → refuse.

**There is no standard size-chart shape.** Nike states ranges; Patagonia women's
states two numeric sizes per letter (so the per-letter range is the chart's own);
Patagonia men's prints **one value per size**. `pointRange()` turns a point into a
range at the midpoints to its neighbours — the reading such a chart is written
for — with end rows extending outward by their own half-step, and tests pinning
that consecutive sizes neither gap nor overlap. It is the one place we compute
rather than transcribe, which is why it is named, isolated and tested.

**The original bug report now answers.** `patagonia.com/product/mens-insulated-boulder-fork-rain-jacket/85220.html`
returns **M / "relaxed" / 0.25** off Patagonia's own chart, with
`fetch: "unreachable"` still recorded honestly.

**Gotcha that bit immediately:** two of my own tests used Patagonia as the "brand
with no chart" fixture and correctly went red once it had one. The replacement
tried Levi's and hit a **demo fixture** — fixtures match by URL substring
regardless of domain. Use **adidas** for "recognised brand, no chart, no fixture".

**SESSION 72c (2026-09-08). Settled: we cannot scrape every URL at request time.**

Tested with a real headed browser on real product pages: Patagonia yielded a chart
**only after clicking "Size Guide"** (and its modal holds several tables at once);
REI and H&M had **no size-guide control and 0 tables**; Uniqlo returned **HTTP 200
with the title "Access Denied"** — a soft block that a status-code check misses
entirely. One of four, at **10–15s per page**.

**NEW INVARIANT:**
**(53)** **The scraping configuration that works and the one we can deploy are
disjoint.** What gets past bot protection is a browser with a real window;
serverless has no display, so the only deployable variant is headless, which is
exactly what is detected. This is not a policy limit that could be bought around —
it is why the runtime order (**readable page → curated chart → refuse**) is the
architecture rather than a compromise, and why the browser extension is the only
route to product-specific numbers from a protected retailer.

**Extraction, not access, is now the hard part.** A headed browser lifted Gap,
Adidas and COS from 403 to 200 — and still returned zero tables, because modern
PDPs hydrate long after `DOMContentLoaded` and hide the chart behind a control
named differently on every site. For brand-level guides the remaining bottleneck
is simply *finding each brand's size-guide URL*, which is a per-brand lookup and
not automatable by guessing (4 of 7 guessed URLs 404'd).

**Tool:** `app-web/scripts/capture-chart.mjs` — headed capture for curation, prints
the tables and the body-vs-garment sentence and then stops. It decides nothing: a
person still picks which table applies and confirms the measurement kind. Needs
playwright, which stays out of the dependencies (same arrangement as
`mobile-audit.mjs`).

**SESSION 73 UPDATE (2026-09-10).** 430 → **439 tests**. `/api/check` now accepts
`{ url, html }` — the browser-extension transport.

`extractSmart(url, { html })` skips the fetch when markup is supplied; parser, LLM,
engine and refusals are all unchanged.

**NEW INVARIANTS:**
**(54)** **`sizesFrom` and `fetch` answer different questions and must not be
collapsed.** Supplied markup means the numbers still came off the retailer's real
page (`sizesFrom: "page"`) but WE fetched nothing (`fetch: "extension"`). Claiming
`"ok"` would say the server read a page it never requested. Supplied HTML also
beats a fixture: serving demo data while holding the real page is the same
substitution as the invented ladder.
**(55)** **Strip HTML comments before counting table cells.** patagonia.com's
size-guide modal carries `<!-- <th width="15%"></th>-->` between two real header
cells; counted, the header had six columns against the rows' five and **`chestCm`
read the Waist column** — a 100cm chest was recommended **3XL** off a ladder of
entirely plausible numbers. Every value was a real measurement, just the wrong one,
and the numeric-size column happened to duplicate the waist digits, which hid it
further.
**(56)** **Clear `source.chart` when page data supersedes the brand chart.**
`extractFromUrl` attaches the curated guide's URL and date before anything is read;
leaving it behind made `/check` credit "Patagonia's published size guide" for
numbers that came off the product page. `dropBrandChartCredit()`, called at all
three sites. **A stale provenance label is the same failure as a wrong one.**

**Measured, for whoever builds the extension:** a heavy PDP is **1353 KB** raw and
**253 KB** after dropping `<script>/<style>/<svg>/<iframe>` and unread attributes —
81% smaller with the size table intact. The 1 MB cap on `html` is sized against
that. Pruning is also the privacy control: a logged-in page carries the user's
cart, address and order history, and only the product should leave the browser.

**KNOWN WRONG, NEXT UP:** `parseSizeTables` has **no notion of body vs garment** —
it always writes `chestCm`. Patagonia's chart is body measurements (its page says
so in a sentence we do not read), so the engine adds ~10cm ease on top and lands a
full size high: **XL for a 100cm chest**, measured end to end. This is invariant ㊿
on the page path, it is **pre-existing and independent of transport**, and the
extension makes it constant rather than occasional. Also unhandled: that chart
yields **16 sizes with duplicated labels** (each letter spans two numeric sizes) —
`brandCharts.ts` models this, `pageParse.ts` does not.
