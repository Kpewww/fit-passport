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
`coursework/startup/product-design/information-architecture.md`. Measured: `/closet` shows **23 input
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
`coursework/startup/product-design/LOGO_CONCEPT.md`. Old DEVLOG entries still name the old path on purpose.

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
`coursework/startup/product-design/passport-card-mockup.html`. No orphaned components or lib modules
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

**SESSION 74 UPDATE (2026-09-15).** 439 → **449 tests**. The page path learned the
difference between a body and a garment measurement.

`parseSizeTables` always wrote `chestCm`, so a page's body chart got the wearer's
ease added on top of a number that already was the wearer — **XL for a 100cm
chest**, measured. Now `detectMeasurementKind(html)` reads the page's own words,
and `foldByLabel` collapses repeated labels into the range the chart meant.

**NEW INVARIANTS:**
**(57)** **A page's chart is GARMENT measurements unless something says otherwise,
and "otherwise" must have a source.** Order: the page's own words, then the brand's
published convention from `brandCharts` (`chartFor`), and `source.measurementKindFrom`
records which. Defaulting to body would silently re-interpret every page ever
parsed. **The signal is not always on the page**: patagonia.com states "body
measurements" on its size-GUIDE page and states nothing at all in its product-page
modal — measured, not assumed. What carries over from the brand is the CONVENTION,
never the numbers; their modal chart is a different chart from their guide chart.
**(58)** **Fold repeated size labels before the engine sees them.** A chart pairing
alpha with numeric sizes prints one row per numeric size — patagonia.com gives XS
twice, S twice, M twice — so the ladder otherwise receives several rows sharing a
label. Folded, those repeats ARE the stated body range for that letter; a letter
appearing once gets a band at the midpoints to its neighbours.

**One definition of the midpoint rule.** `sizing.midpointBand` now holds it and
`brandCharts.pointRange` delegates — the page parser needed the same reading and a
second copy would be invariant ㉛ again.

**Provenance has one home:** `source.chart.kind` became `source.measurementKind`,
set by whichever layer produced the numbers, plus `measurementKindFrom`
("page" | "brand").

**Trap re-encountered, caught by a test:** the Chinese patterns in
`detectMeasurementKind` were written with `\b`, which is ASCII-defined and never
matches at a CJK boundary — the whole group was dead. That is **invariant ⑫**, and
it only surfaced because a test covered the Chinese case.

**Measured outcome:** a 100cm chest against Patagonia's own product chart returns
**S (snug 0.639) / M (relaxed 0.615)** — correctly a near-tie, since 100cm falls in
the gap between S (96.5–99.1) and M (101.6–104.1). It was XL.

**SESSION 75 UPDATE (2026-09-28).** 449 → **475 tests**. Sprint 5 begins: the
browser extension. This session is its server side only — no extension code yet.

The audit behind it (full account in DEVLOG Session 75) found `/api/check` behaving
wrongly for a browser caller in three ways, all fixed: an invented ladder scored on
a supplied page with no chart; a cookieless request minted a new account; no rate
limit on the one route that spends money. Also fixed: `/api/recommend` ignored the
provenance cap, and the LLM/vision branches kept a stale brand-chart credit.

**New module `src/lib/checkPolicy.ts`** (pure): `refusalFor` (the ㊼/⑪/㉜ refusals,
moved verbatim from the route, plus `no-chart-on-page`), `applyProvenanceCap`
(`PROVENANCE_CAP` estimated 0.5 / brand-chart 0.75), `sessionGate` +
`isExtensionRequest` (header `x-fp-client: extension/<version>`),
`sourceFromRawJson`. **New `source` fields:** `sizesSynthesized` (the
`buildSizes()` ladder — no source stated these numbers) and `extractedBy`
(`table | llm-text | llm-vision | hao-xing`, set only with `sizesFrom: "page"`).
`extractorLLM.creditPage()` is the single place page data replaces a brand chart.

**Rate limits on `/api/check`:** 30 / 10 min per session, 300 / 10 min per IP as a
backstop. Working values, not measurements. Session first because a campus network
or a demo room puts many users behind one IP.

**Cookie evidence, for the extension:** Chrome's docs — an extension's request to a
site it holds host permission for is treated as same-site (so `fp_session`,
SameSite=Lax, is sent) — *"and does not apply if third-party cookies are
blocked."* Content scripts are subject to the page's same-origin policy and must not
call our API; the popup or service worker does. **`/api/auth/me` and `/api/status`
both go through `getCurrentUser()`**, so probing identity from a cookieless client
mints an account — use an extension-marked `/api/check` (401 when there is no
session) to test cookie delivery on production.

**NEW INVARIANTS:**
**(59)** **An invented ladder is never scored on a page the browser handed us.**
`sizesSynthesized` marks it where `buildSizes()` runs and every replacement clears
it; `refusalFor` returns 422 `no-chart-on-page` for `fetch: "extension"`. A page's
real offered labels (no measurements) still pass — a closet anchor can rank real
labels. **Scope is pinned by a test:** the same ladder on a server-read page
(`fetch: "ok"`) is still served; widening that is the `BRAND_TABLE` retirement
decision, the founder's call.
**(60)** **An extension request never mints an account.** No session → 401
`not-connected`, decided before `getCurrentUser()` runs. Website requests unchanged.
**(61)** **Every route that returns a recommendation applies the provenance cap
through `applyProvenanceCap`.** The inline copy in the check route is how
`/api/recommend` came to skip it.

**Found, measured-first, NOT fixed (the Sprint 5 benchmark decides the order):**
`recommendService` drops a size's `waistCm` (waist scoring at `fitEngine.ts:311`
never runs in production); range cells collapse to midpoints; "Body width" / 胸宽
unmapped and 胸宽 read as chest-in-inches; most-rows table wins regardless of
visibility; no body/garment detection on the LLM/vision path; the outcome loop
ignores `exchange`, drops `exchangedForSize`, and penalises both neighbours of a
return regardless of direction.

**SESSION 75b UPDATE (2026-09-28).** 475 → **499 tests**. The extension exists:
`browser-extension/` (MV3, no build step, ID pinned by the manifest `key`:
`odbdhmcfjbhikmlfmgafbkkbknkkaecp`; README has install, permissions, privacy).
`capture.js` builds an allowlisted reduced document (meta, Product/Breadcrumb
JSON-LD cut to key allowlist, `<h1>`, measurement tables as text cells + dialog
context, the body/garment sentence from its own element, size selects, swatch
values, chart images). Popup: preview → user presses Check → `/api/check` with
`credentials: "include"` + `x-fp-client`. `/check?product=<id>` reopens a stored
check via `/api/recommend`. `jsdom` is a devDependency for
`extensionCapture.test.ts`.

**Measured (fresh logged-out profile, chest 100 cm):** Patagonia (server-blocked)
→ S/M near-tie, S 21%, page·table·body(brand), 11 KB of 1.78 MB (−99.4%), 16 ms;
same against **production → 200, so the session cookie reaches the deployed API
from the extension origin**. Nike → no chart on the PDP (separate size page) →
curated chart → M 30% (correct). **Uniqlo → L at 65%, WRONG (right: M)** — two
pre-existing parser bugs the extension is first to reach: (a) mixed-fraction inches
`31 1/2-34 3/4` parse as range (31, 1) → 16, dragging the column median under 65 so
the whole chart is "converted" from inches, non-monotone; (b) "Compare all product
measurements with previous purchases" (site chrome) matched the GARMENT pattern on
a BODY chart. Fix is 75c.

**NEW INVARIANTS:**
**(62)** **The extension reads a page only on a click, sends an allowlisted reduced
document — never the page — shows it before sending, and the server stores what it
read, never the page.** `activeTab` + `scripting`, no content scripts, no retailer
host permission. Pinned by `extensionCapture.test.ts` privacy block and the
stored-prose test. The first design leaked a cart address through a ±100-char
page-text window; sentences now come from their own element; header/nav/footer/form
are never read.
**(63)** **`capture.js` may not drift from `pageParse.ts`.** `KIND_PATTERNS`,
`SIZE_SELECT_RE`, `CHART_IMG_TOKENS` equal; `MEASURE_RE` ⊇ every `MEASURE_MAP`
alternative — compared by test (the extension has no build step, so it carries
copies). Behaviourally: `parsePage(capture(page))` must equal `parsePage(page)` on
the round-trip fixtures.

**Pre-existing, seen on rendered pages, NOT fixed:** `metaContent` truncates
`og:title` at an apostrophe (`Men's …` → "Men", probed); the engine's alternative
line says the BIGGER size suits "a snugger fit"; "What the numbers look like" is an
empty card for body-range charts.

**Tooling:** `browser-extension/scripts/try-pages.mjs` (real pages → capture → API
from the extension origin; `--click`, `--shots`, `--save-captures`; measurement
only, invariant (52)); `make-icons.mjs` (icons from `brand/` masters, favicon glyph
at 16/32 per ㉖).

**SESSION 75c UPDATE (2026-09-28).** 499 → **507 tests**. Uniqlo fixed: the real
page through the extension now returns **M, true to size** (was L at 65%); M band
96.1–104.0 cm vs stated 95.9–104.1. Patagonia/Nike unchanged.

`pageParse.ts`: **`cellNumbers`** reads `31 1/2`, `31-1/2`, `31½` as one number
(fraction only for denominators 2/3/4/8/16, so `32/34` stays two numbers);
**`resolveMeasurementKind(stated, brandFallback, ranged)`** is the ONE place the
body/garment precedence lives — page-body > table-range > page-garment > brand >
unstated; **`parseSizeChart`** returns `{sizes, kind, kindFrom}` and `parsePage`
exposes `measurementKind` / `measurementKindFrom`, which `extractorLLM` now takes
instead of re-deciding; **`risesWithSize`** refuses a table whose chest (else waist)
falls by >1 cm in ladder order. `measurementKindFrom` gains `"table"`.
`engineInput.ts` → `engineSizes()`: the one size mapping for routes, tests and the
harness.

**NEW INVARIANTS:**
**(64)** **A range per size is body measurements, recorded as
`measurementKindFrom: "table"`.** Outranks a page-wide "garment" (read off the whole
page — on uniqlo.com it was site chrome), never a page-wide "body", and can never
argue for garment. (57)'s rule stands: "otherwise" needs a source; the table's own
shape is one. One old test that read an unstated range chart as garment midpoints
was changed on purpose.
**(65)** **A chart whose numbers fall as the sizes rise is refused.** Would have
refused the Uniqlo garbage on its own; catches misreads not yet met.

**CORRECTION to the Session 75 audit list:** "`recommendService` drops `waistCm`" is
currently CORRECT behaviour, not a bug to fix alone. The parser moves a body chart's
chest into `bodyChestMin/Max` but leaves its waist in the garment `waistCm`; Uniqlo,
Nike and Patagonia all carry body waist columns. Passing waist before a body-waist
field exists would repeat ㊿ one column over. `engineInput.ts` says so in place.

**NEW FINDING, not fixed:** `computeConfidence` grants the +35 measurement weight
only for a size with a garment `chestCm`; body-range sizes never qualify, so every
body-chart answer sits near the floor (Uniqlo 30%, Nike 30%, Patagonia near-tie
21%) and `/check`'s "+35 points" offer cannot pay out on them. Touches ㊱/㊴'s
promise — decide together.

**SESSION 75d UPDATE (2026-09-28).** 507 tests + 1 honest skip. **The evaluation
harness exists:** `app-web/eval/` — README (the method), `personas.json`, `cases/`
(11 real pages), `truth/_template.json`, `lib.ts` (systems A/B/S5 + scoring, all on
the product's own code), `run.eval.ts` → `results/<date>.{json,md}`. `npm run eval`
(offline B + S5); `EVAL_LIVE=1 npm run eval` adds A. `vitest.eval.config.ts` keeps it
out of `npm test`; `src/lib/evalCases.test.ts` replays COMMITTED captures with truth
(none yet — skips, and says why). Captures live in git-ignored
`app-web/eval/local/captures/` until the founder decides (#2).

**NEW INVARIANT:**
**(66)** **Fit Passport never defines its own ground truth.** Truth = two people
from the retailer's page; acceptable sizes = the retailer's rule (body range holds
the chest; both neighbours in a gap), computed by the harness; garment charts
unscored until an external ease reference; an answer from a synthesized ladder is
scored WRONG.

**First run (truth pending):** A read a page chart on 0/11, S5 on 3/9 captured;
A answered Everlane from the invented ladder (decision #3 now counted). Found:
charts not written as `<table>` (Gap divs, Arc'teryx framework JSON) are invisible
to capture AND parser, and the reduced capture then leaves the LLM path nothing;
category is taken only from URL + JSON-LD, so Gap's "Classic T-Shirt" and Uniqlo
(A) were refused not-apparel with a false message. **Automated browsers are now
refused even headed** (H&M, REI "Access Denied"; Patagonia "Hang Tight"
intermittently) — Session 72b's "headed gets through" no longer holds reliably;
evaluation captures of such sites are made by hand via the popup's **Save this
capture**.

---

## Session 76 (2026-09-28) — redesign R0 + R1: icons, no emoji, primitives

See [[project-fit-passport-design-system]] (the "Editorial Atelier" section) for
the design rules.

Code:
- `components/Icon.tsx` + generated `icons.generated.ts` (`npm run icons`);
- `GarmentIcon.tsx`;
- `ui.tsx` primitives;
- tailwind type scale and semantic colours;
- `garments.ts` / `badges.ts` lost their `glyph` fields;
- `vitest.config.ts` has the JSX runtime and the `@/` alias, so tests can import
  components.

First Load JS after R1 is within +10% of the R0 baseline on every page:
- / 163 (baseline 156);
- /check 115 (108);
- /closet 124 (116);
- /login 106 (98.6).

**NEW INVARIANTS:**

**(67)** **No emoji in the product.** `src/lib/noEmoji.test.ts` scans non-comment
source for `\p{Extended_Pictographic}` (except © ® ™) and ★ ☆. Use an icon or a
word. Arrows and ✓ are typography and are allowed, but R2–R6 convert them to icons.

**(68)** **One icon set, one weight.** Icons come from `components/Icon.tsx`
(generated Phosphor Light; Fill only for toggles) or `GarmentIcon`, never a second
library or a raw `@phosphor-icons/react` import.
- To add one: list it in `UI` in `scripts/gen-icons.mjs` and run `npm run icons`.
  That writes `components/icons/<Name>.tsx` plus the `Icon.tsx` re-export barrel.
- **Keep one icon per module, and keep `package.json` `"sideEffects": ["*.css"]`.**
  This is what lets each page carry only its own icons. Measured: all icons in
  one module put every used icon on every page (+10 kB on /login), and a
  top-level `make()` factory kept all 59 paths even marked PURE.
- **If a module ever needs an import for its side effects, add it to
  `sideEffects`** or webpack may drop it.

**Session 76 R3 (closet gallery):**
- **Default view:** gallery (4:5 cards, the user photo as cover, colour field +
  `GarmentIcon` otherwise). "All" is one flat grid; sections appear when a chip
  is chosen or in reorder mode. List and Folders remain.
- **Photos:** `resizeGarmentPhoto` gives a 600×750 centre crop at JPEG 0.82,
  stepping down to ≤90 KB. Measured: 11 KB for a smooth photo, 72.5 KB for
  worst-case noise.
- **Photo entry:** the camera control on the card, and the detail sheet (drop, or
  replace / remove). The new piece's card carries an *Add a photo* nudge.
- **The photo is still outside the four-question add flow (㉙).**

**(69)** **No typographic arrows or ticks standing in for icons** (→ ← ↻ ✓ ✕ ✦ ↓ ⌄ ▲ ▼ ✎ ＋).
`src/lib/noGlyphArrows.test.ts` strips comments and scans every `.tsx`. Use
`components/Icon.tsx`, or a word when the arrow meant "to" or "for". ≈ – — × are allowed.
Session 76 R6 also mapped stock green/amber/red/neutral classes to `ok/warn/bad` +
paper/line/ink everywhere except where colour is content (badges, metals, mannequin
garments, closet folder skins).

**SESSION 78a (2026-09-29).** 495 (really 520 — see below) → **545 tests, exit 0.**

**Read the exit code, not the "Tests" line.** After a pull that added `jsdom`,
node_modules was stale; `extensionCapture.test.ts` (25 tests) never loaded and
`npm test` exited 1 while the summary line looked green. Fix: `npm ci` (does not
rewrite the lockfile). Likely the source of the 507-vs-495 discrepancy.

**NEW INVARIANTS:**
**(70)** **A size "states its chest" in either form** — garment `chestCm` or body
`bodyChestMin/Max` (`statesChest`). The measurement weight used to require the
garment form, pinning every body chart near the floor (Nike 0.30 → 0.65 after).
**(71)** **The category is always one of our keys.** `resolveCategory` runs every
source — JSON-LD, URL, product name, `<h1>`, the LLM's answer — through
`detectCategoryStrict`. Raw JSON-LD used to reach `domainForCategory`, whose
fallback is "top", so "Men's Sneakers" could be sized as a t-shirt past ㉜. A
garment named only by the page with no chart is refused `no-chart-on-page`, which
keeps founder decision #3 (invented ladder on server-read pages) undecided.
**(72)** **Body-range membership has one definition** — `bodyRangeFit`, shared by
chest and waist. The sign convention inside it was inverted once (51).

**Waist now reaches the engine** as `bodyWaistMin/Max` (body charts) or `waistCm`
(garment). Schema columns already existed — no migration. **Stated ranges survive
parsing** (`GridSize.ranges`); `midpointBand` only for single printed values.
**Visible tables win** (`VISIBLE_CHART_ATTR`, drift-tested against `capture.js`).
**The LLM path uses the same kind rule** (`applyMeasurementKind`).

**Keyword traps found by tests:** `t-shirt` arrives as "t shirt"; "button-down"
matched the insulated rule's "down" (→ jacket); "short-sleeve" matched shorts (→
scored on waist). All fixed and pinned.

**Gap, measured:** with Size Guide pressed, no measurement chart in the DOM at all;
the only "chest" is the review summary. The 75d "Gap builds charts from divs" note
is not reproducible — `todo/engineering/03` now waits on a hand capture.

**SESSION 78g (2026-09-29).** 550 tests. **The extension is the homepage's front
door; the URL box is folded and labelled beta.**

- **Download:** `public/downloads/fit-passport-extension-<version>.zip`, packed
  deterministically by `app-web/scripts/pack-extension.mjs` (no deps, fixed
  timestamps). `extensionZip.test.ts` rebuilds it and byte-compares — **after any
  change in `browser-extension/`, run `node scripts/pack-extension.mjs` in
  app-web/** or the suite goes red. Committed, not built, because Vercel reads
  nothing outside `app-web/`.
- **One constant** `extensionDistribution.ts` — switch `kind: "zip"` → `"store"`
  when the Chrome Web Store listing exists; `/extension` already renders both.
- **`/extension`** is a server component; claims Chrome-tested only.
- Design record: `docs/design/browser-extension.md`.

**SESSION 78b (2026-09-29).** 556 tests. **Every scoring constant lives in
`src/lib/scoringConstants.ts` with a provenance** — 83 values: **80 assumed, 1
measured, 2 cited**. Spec: `docs/design/scoring-system.md` (calibration table
generated from the registry).

**NEW INVARIANT:**
**(73)** **No scoring number without a provenance.** A new constant goes into
`scoringConstants.ts` with `measured` (and its n), `cited` (and the source), or
`assumed`; an assumed one must also appear in the spec's calibration table.
`scoringConstants.test.ts` enforces all of it. The registry imports nothing (㉟).

**Measured, pending Phase D:** real curated charts step **8.3 cm** between sizes
(median, n = 19) vs the **4.5 cm** `LADDER_STEP_CHEST_CM` used to turn a fit feeling
into centimetres (from 2 demo fixtures).

**SESSION 78c (2026-09-29).** 566 tests. **Stability replaced the top-two margin
factor** (`stability.ts`): a deterministic grid (chest/waist ±½, ±1 × 2 cm; chart
±1 cm; ≤75 runs, ~1 ms) → `agreement` scales confidence 0.6–1.0, `holdsForChestCm`
shown on `/check`; below 0.75 agreement the confidence panel says the pick is close.

**NEW INVARIANTS:**
**(74)** **Body-range scoring is continuous and monotone.** Just-outside used to
score 1.0 against 0.94 just-inside, so picks oscillated within ~2 cm of every
boundary (94.5 cm → M on Nike's chart, inside S). Fixed; pinned by continuity
(≤0.01 per 0.1 cm; legit max measured 0.0064) and monotonicity tests.
**(75)** **Decisiveness = stability in the wearer's centimetres**, and a fragile
pick always says so.

**After changing any constant:** `node scripts/scoring-table.mjs` in app-web/ —
`scoringConstants.test.ts` now also fails on a stale VALUE in the spec's table.

**SESSION 78d (2026-09-29).** Size step recalibrated **4.5 → 8.3 cm** (median of 19
steps across the curated charts; a test recomputes it). **Fit reports are intervals**
(± a quarter step; extremes open-ended); the closet is read as the largest set of
reports that can all be true — majority learned with exclusions named, no majority →
nothing learned and the explanation says so.

**NEW INVARIANT:**
**(76)** **A fit report is an interval, and contradictory reports are never averaged.**
Learn only from a strict majority of mutually consistent reports; name what was left
out; with no majority, keep the stated preference and say why.

**SESSION 78d3 (2026-09-29).** 582 tests. **Outcomes are signed.**
`FitOutcome.fitDirection` (migration `20260929180000_outcome_fit_direction`). Returns/
exchanges must state a direction (validation in `lib/outcomeInput.ts`); `overallFit`
derived. `scoreOutcome`: exchange boosts the swapped-to size; a return penalises only in
its direction (no direction → only that size). `brandBias` reads signed outcomes and
exchange direction.

**NEW INVARIANT:**
**(77)** **An outcome is read in the direction it was wrong.** Never penalise the
neighbour on the other side of a directional return; never read a size as confirmed
by a keep that did not fit; never ignore an exchange.

**Session 78e — deliberate abuse (spec §9).** Own data can only hurt its owner:
`plausibility.ts` caps confidence at `CONFIDENCE_CAPS.implausibleBody` and names the
odd pair; `personalEase` drops reports whose implied ease is outside `EASE_CM` ±
`plausibleMarginSteps` steps BEFORE the consistency vote. Status (leaderboard, badges,
answer order) counts only claimed, non-author votes (`countedVotes.ts`). Local dev has
NO Upstash (empty env) — the in-memory limiter resets when Next recompiles a route, so
a live limit test can over-admit by one reload's worth.

**NEW INVARIANTS:**
**(78)** **Implausible input is detected, never learned from, never silently altered.**
Exclude it before any vote, cap confidence, and name what was excluded.
**(79)** **A vote that ranks anything counts only from a claimed account that is not
the author** — and the number shown is the number ranked by.

**Session 78f — eval measures robustness.** `eval/` now reports stability, Brier /
conf−hit gap / confidently-wrong (null at n = 0), and guardrails on adversarial
personas; results are never overwritten (`-runN`). S5 needs the git-ignored
`eval/local/captures` — absent after a machine move. A guardrail must check the
NUMBER as well as the message: the first version passed on the message while
confidence rose 46% → 75%.

**NEW INVARIANT:**
**(80)** **"Not learned from" holds for the whole engine.** When measured closet
reports contradict with no majority, they are removed from the closet that the
anchor, brand bias, anchor weights and confidence read — not just from the ease.

**Open (todo/engineering/08):** the Uniqlo demo fixture recommends XL at chest 100 —
likely body numbers in the garment field (real page M = 95.9–104.1, midpoint 100).

**Session 79 (2026-09-29) — Chinese version + 中|EN switch; Tmall pages read.**
Home-grown i18n in `app-web/src/i18n/` (no dependency): `messages/en.ts` is the
source, `zh.ts` is typed `Messages` so a missing key fails tsc; `t` / `t.rich` / `t.n`
with `{name}` values and a small tag set (`RICH_TAGS` in `format.ts`). Locale order:
`x-fp-lang` header → `fp-lang` cookie → Accept-Language → en. Reading the cookie makes
every page dynamic (ƒ) — accepted. Stored values stay English keys (categories, default
folders, colours, lines, body types); only display translates (`i18n/garment.ts`,
`people.ts`, `badges.ts`). Badge Chinese lives in `lib/badgeText.ts`. Chinese fonts are
system CJK stacks under `:lang(zh)` (a CJK webfont is megabytes); italics off in zh. Copy
spec: `docs/design/chinese-copy.md` (glossary, spacing, classical-phrasing budget).
Chrome's zh-CN labels were verified from its locale.pak (加载未打包的扩展程序, not
加载已解压的) — don't write them from memory. The extension popup has its own switch
(`browser-extension/i18n.js`, localStorage) and sends `x-fp-lang`. Tmall: brand/gender
come from 参数信息 by LABEL (class names are hashed), the name from the cleaned
`<title>`; Taobao's shopper profile (我的档案, 身高/体重) is never read.

**NEW INVARIANTS:**
**(81)** **Every sentence a person reads goes through the messages** (`useT`/`getT`),
never written into JSX. `i18n/untranslated.test.ts` fails on two Latin words in a row
in JSX text or a placeholder/aria-label/title/alt/label/hint; `/admin` is exempt.
**(82)** **Engine prose comes only from `EngineText`** (`lib/engineText.ts`); the
English implementation is the wording the tests pin, and zh must carry the same numbers.
**(83)** **API sentences for people go through `say(req, english)`** with Chinese in
`API_ZH`; machine codes a client branches on (`claim-required`, `not-connected`) are
never translated.

**SESSION 80 (2026-09-30).** 637 → **701 tests**. Six pushes (80a–80f).

- **Chinese copy = the founder's revision** (`docs/design/chinese-copy-2026-09-30.md`, kept as
  the record): all 1,122 message keys, `engineText`, `badgeText`, `apiText`, `/admin` (now
  translated). Imported by parsing, not retyping. Deviations only where the revision's own rules
  demand them — listed in `docs/design/chinese-copy.md`. Chrome's zh-CN label is
  **加载未打包的扩展程序** (read from Chrome 155's `Locales/zh-CN.pak`).
- **Header:** desktop tabs from `lg`; the tab row keeps the English width in both languages
  (`min-w-[32.5rem]` + `justify-between`) — measured Δ 0 px. Footer credit `© 2026 Fit Passport`,
  no footer language switch.
- **Extension zip is packed with LF** (`pack-extension.mjs`): a Windows checkout
  (`core.autocrlf`) made the committed zip test stale on a clean tree.
- **Closet add-by-link:** `lib/closetExtract.ts`. Demo fixtures answer only the links in
  `lib/demoProducts.ts` and are labelled demo. `guessBrand` matches whole host labels.
- **To-buy list:** `SavedItem` table, `/api/saved`, `/saved`, extension 0.4.0 "Save to buy".
  `extractSmart(…, { noModel: true })` for saving. `ItemSchema` moved to `lib/closetItemInput.ts`.
- **One-off listings:** `lib/sellerMeasurements.ts`, `lib/listingJudgement.ts`,
  `sizesFrom: "seller"`, `source.listing`, refusal `no-measurements-listing`, constants
  `LISTING` + `CONFIDENCE_CAPS.provenance.seller`. Extension 0.5.0 reads eBay item specifics and,
  with an optional host permission, measurement lines from the `itm.ebaydesc.com` frame.
  `easeFor`, `verdictFromDelta`, `isUndetermined` are exported from `fitEngine.ts` and shared.
- eBay refuses our server ("Error Page") and began refusing automated browsers mid-session;
  resale hosts are marketplaces (no brand from the host).
- **Taobao/Tmall (80f, real signed-in access):** chart + 参数信息 read on two items, save 200 → 409 on
  four; then Taobao's risk control hid item details (访问异常提示) and redirected to sign-in for the
  automated browser. Extension **0.5.1**: `found.gate` (`login` | `paused`) — the popup says so and
  offers no check. `capture.js` VERSION is pinned to the manifest (it had stayed 0.3.0).

**NEW INVARIANTS:**
**(84)** **A to-buy product is not an owned garment and lives in its own table.** Nothing that
learns or counts reads `SavedItem` (`savedInput.test.ts` scans for it); it becomes a
`KnownGoodItem` only through the closet add flow **with a fit report** (`fromSavedId`
requires `fitDirection`), else the default `fitRating` 4 would make it a known-good anchor.
**(85)** **A flat width doubled is a GARMENT circumference** — written to the garment field,
never compared with a body directly (㊿). What could mean more than one thing ("Chest 22",
"29x20", disagreeing readings) is not used; the user confirms it.
**(86)** **One real size → a judgement, never a ranking.** Same target and verdict scale as the
engine; a stored tie is never shown as a recommendation (`isUndetermined` on the stored
ranking).
**(87)** **The extension's optional host permission is requested only on a click and reads only
measurement lines.** Free text on a listing page is never read (other sellers' measurements are
on the same page).

**SESSION 81 (2026-09-30).** 701 → **729 tests**.
- **Chinese display headlines are drawn without punctuation** by `components/Headline.tsx`
  (founder's request): end-of-line ，。、；：？！… hidden, inside a line a 0.5 em gap with
  clauses kept whole, 「穿」 → 穿 in the accent colour. The copy keeps its punctuation;
  screen readers still get it. zh hero 8rem from sm, `min(4.5rem, (100vw−2rem)/4.6)` below.
- **`SignalsDeck`** (the old ConvergingStack) is back on the homepage, deck from `lg`, grid
  below; icons instead of numbers; backdrop centred with framer `y`.
- **Passport cover:** 合身卡 / Fit Card (was 国际合身身份 / International Sizing Identity).
- Chrome Web Store: US$5 once per account; blockers are the manifest `key`, the localhost
  host permission, and a missing privacy page (`todo/people/05`).

**NEW INVARIANT:**
**(88)** **Every translated serif headline goes through `Headline`** (`headline.test.tsx` scans
`app/`). Punctuation in Chinese display type is a drawing decision, never removed from the
strings.

**SESSION 82 (2026-09-30).** 729 → **731 tests**. Extension **0.6.0**.
- Nav order: closet, passport, outfits, community, extension, check, help (founder).
- `Headline` drops only pause marks (，。、；：…); ？！ and 「」 are drawn, brackets with `halt`
  (`.cjk-halt`); the in-line gap is a widened space (collapses at a break).
- Chrome Web Store prepared: `pack-extension.mjs --store` → `app-web/store-build/` (no `key`, no
  localhost, no `captureTool`); `/privacy` (EN/ZH, footer); `docs/store/` (listing copy, images,
  `make-images.mjs`). `CONTACT_EMAIL` (`lib/siteContact.ts`) is null until the founder picks one.
- config.js `captureTool` gates "Save this capture"; popup hides the server switch with one origin.

**NEW INVARIANT:**
**(89)** **The store package is the download minus `key`, the dev server and `captureTool` —
nothing else** (`extensionZip.test.ts` compares every other file byte for byte).

**SESSION 83 (2026-10-01).** 731 → **744 tests**. Extension **0.7.0**. A size chart that is
only a picture: the capture lists pickable pictures (sent only when picked), `/api/check`
takes `chartImage`, `chartImage.ts` caches each read by address in `ChartImageRead` (also
"not a chart"; failures not cached), `features.chartImage` gates the popup button (true iff
`ANTHROPIC_API_KEY`). `sizeDirection` (fitEngine) words the alternative by which way it lies.
Local dev has no key: test the flow by seeding a `ChartImageRead` row and running dev with a
placeholder key — a cache hit never calls the model. Test pages must sit under a
host-permitted origin (the popup cannot be clicked in automation, so activeTab is never
granted), and the popup's server must be set via localStorage `fp-origin`.

**NEW INVARIANT:**
**(90)** **A picture's address leaves the browser only when the shopper picks it, and we keep
the numbers read from it, never the picture.** A table on the page outranks any picture.

**SESSION 84 (2026-10-05).** 731 → **783 tests**. Extension **0.7.1**. (Session 83 was the other
machine's, 10/01: chart-picture picker, 0.7.0.)
- **Categories:** `top` (tank, cami, bodysuit, blouse, the bare word last); track tops and suits →
  jacket; `dress`/`jumpsuit`/`swimsuit` in a new `onepiece` domain, **scored on chest, waist and hip**
  (hip only for onepiece; `DIMENSIONS.hip` weight 0.6); `underwear` in `intimate`, refused.
  Hip is parsed (body ranges and garment), stored (`SizeOption.bodyHipMin/MaxCm`, migration
  `20261005120000_size_body_hip`), and shown on /check.
- **Classifier:** `lib/categoryModel.ts` — TypeSafe Jev after the word rules fail (name + page
  category only), confidence ≥ 0.6, Haiku fallback behind `CATEGORY_FALLBACK=haiku`.
  `TYPESAFE_API_KEY` NOT set yet. `categoryFrom: "model"`; a confident `not_clothing` sets
  `source.notClothing`.
- **Refusals:** extension page + guessed category → `pick-category` (popup picker, `category` in
  /api/check, `withUserCategory`); `not-apparel` stays for server-read pages and `notClothing`.
- Tie text `undeterminedNoChart` when the wearer's chest is on file and sizes carry no numbers.

**NEW INVARIANT:**
**(91)** **A word rule, then a classifier, then the shopper — never "not a garment" for a page the
shopper clicked on unless something positively said it is not clothing.** The shopper's choice never
overrules what the page said.

**SESSION 85 (2026-10-05).** 783 → **788 tests**. Extension **0.7.2** (store has 0.6.0).
- **Store-first:** `EXTENSION_DISTRIBUTION = { kind: "store", href: STORE_URL }` (item `ciecejomnniicliemefagfegkmgfkgfe`);
  the zip is `EXTENSION_ZIP`, offered only on `/help#manual-install`. Homepage CTAs open the listing;
  `/extension` is a short intro; `/extension/welcome` (noindex) is opened by `background.js` on first install.
  `LinkButton` has `external`.
- **pick-category** now also for server-read pages (`fetch: ok`) and for ANY page with a chart whose garment nobody
  named (no more silent tshirt default); `/check` has `CategoryPicker`. Listings exempt.
- Uniqlo demo fixture = the real page body chart (M 95.9–104.1); 100 cm chest → M (`demoFixtures.test.ts`).
- `eval/category.eval.ts` + `eval/category-names.json` (133) calibrate Jev; needs `TYPESAFE_API_KEY` in `app-web/.env.local`.

**SESSION 86 (2026-10-06).** 791 tests. **Vercel Web Analytics:** `components/SiteAnalytics.tsx` in the root layout;
`beforeSend` drops query strings and maps `/u/<code>` → `/u/[code]` (the code is a read capability). Installed with
`--legacy-peer-deps` (npm 11 walks the optional SvelteKit peer into a Vite conflict); plain `npm install`/`npm ci` pass.
Its script skips `navigator.webdriver` — automated checks see no page views unless they present as a visitor.

**SESSION 88 (2026-10-06).** 791 → **807 tests**. Extension **0.8.0** (store still 0.6.0).
- **Women's sizes:** `womensSizes.ts` (US rung; DE/EU +30, FR +32, IT +36, UK +4; blitzresults +
  sizechart.com). `normalizeToAlpha(label, line)`; line = page `rawJson.gender` → piece `gender` →
  sole `shopsFor`. Converters: 男装|女装, EU opens into FR/IT. Bare women's number = DE (a recorded
  choice: sources disagree on "EU"). Men's not split by country (sources contradict).
- **Pieces:** `KnownGoodInput.{id,name}`, `Reason.itemId`, `EngineText.pieceLabel`; `styleWords.ts` +
  `KNOWN_GOOD.styleMismatch` 0.6 (assumed): a same-style piece leads; /check `ClosetBasis`.
- **Closet:** delete waits `UNDO_MS` 6 s before the server (keepalive, flushed on pagehide);
  `DELETE /api/closet?ids=`; `PhotoSource` (upload/paste/getDisplayMedia+crop/camera); `BatchAdd` (≤20);
  `KnownGoodItem.photoFrom`. /closet First Load JS 135 kB, over the ~128 kB cap (todo/engineering/13).
- **Extension 0.8.0:** "I own this, add to closet" = captureVisibleTab + crop to `found.mainPicture`;
  site links; `/api/closet` POST has the extension session gate.
- Test notes: local SQLite needs `npm run db:push` after another machine adds columns; `npm ci` keeps the
  lockfile (and wipes ad-hoc playwright — install it in the scratchpad instead); an extension test cannot
  get `activeTab`, use a scratch copy with `<all_urls>`.

**NEW INVARIANT:**
**(92)** **A closet photo is shown to its owner only.** No public route selects `imageDataUrl` or pulls
closet rows whole (`closetPhotoPrivacy.test.ts`); a shop screenshot is taken only on the shopper's click.

**SESSION 89 (2026-10-06).** 807 → **815 tests**. **The mark's reveal:** `components/AnimatedFitPassportLogo.tsx`
(`hero` ~2.6 s once per session / `quick` ~0.9 s), thread on an overlay over `<Logo>`, centerline in
`lib/logoCenterline.ts` (re-derive with `brand/tests/centerline-fit.mjs --write`), timing in `lib/logoReveal.ts`.
Homepage hero (white), `/extension/welcome` + onboarding step 1 via `AnimatedFitPassportLogoLazy` (keeps Framer
off their first load). `/brand/reveal` presents it; `scripts/record-logo.mjs` → `app-web/brand-build/`.
- Recording gotchas: Playwright `clock.install()` keeps running in real time — `pauseAt` it; Framer hands HTML
  opacity/transform to WAAPI (real time) unless the element has `onUpdate`; CSS transitions are real time too.
  Playwright's bundled ffmpeg only does mjpeg→VP8 WebM and needs `-i pipe:0`.
- Test selector: the overlay is `svg[data-fp-reveal]` (plain `svg[aria-hidden]` matches nav icons).

**NEW INVARIANT:**
**(93)** **The reveal ends on `<Logo>` itself, never a drawn approximation.** The centerline is a drawing aid;
the settled frame must stay pixel-identical to a static `<Logo>` (0 px at 12 size/ground/variant cases).

**SESSION 90 (2026-10-06).** 815 → **818 tests**. Reveal redrawn by **two threads at the mark's weight**:
A (top-left: entryBar → notch → innerCurl), B (bottom-right: lowerLoop → crossing → spineUp); each driven by one
progress value (`lib/logoReveal.ts` `threads()`); connectors fade so the mark's gaps appear. Variants hero / quick /
**intro**. Homepage: inline `<head>` script (`lib/homeIntro.ts`) marks `html[data-fp-intro="play"]` before paint on a
session's first `/`; `HomeIntro.tsx` draws a giant mark and flies it onto `[data-fp-hero-mark]`; every other arrival
plays the inline hero reveal (`yieldToIntro`). `/help` "The mark" links `/brand/reveal`. `record-logo.mjs --intro`.
- Gotcha: a lead-in must end along the piece's start direction or it folds back (B's "^").

**SESSION 92 (2026-10-06).** 818 → **835 tests**. **New address https://www.fitpassport.fit** (`lib/site.ts`
`SITE_ORIGIN`; robots/sitemap read it). Old address `fit-passport.vercel.app`: pages move in `middleware.ts`
(`legacyMove`), `/api/*` stays. Session hand-over: `/api/session/carry` (new) → `/send` (old, signs
`encodeCarryPass` in `lib/auth.ts`, HMAC over `"carry." + body`, 60 s, bound to `fp_carry` state) →
`/receive` (new; `receiveDecision`: adopt only if the new account is empty — `accountHasData`); `fp_carried`
short-cuts later visits. Extension **0.9.0**: host permission + default origin the new address, every page opens
via `openSite()` → carry. Privacy page lists `fp_carry`/`fp_carried`. E2E: 14 checks on two local hosts (DEVLOG).

**NEW INVARIANT:**
**(94)** **The old address never moves `/api/*`, and a session crosses addresses only on a pass bound to the
browser that asked.** Older extensions depend on the first; the second is what stops a link from signing
someone into another person's account.

**SESSION 92b–d (2026-10-06).** 835 → **848 tests**. **One account per browser** (`lib/accountMerge.ts`): the founder's
store 0.7.1 used the old address's cookie, the site the new one — two accounts. The hand-over now folds them:
`mergePlan` (claimed stays; else new address's unless empty; two claimed untouched), `foldAccount` (closet, folders,
products, checks, outcomes, outfits, pets, saved; profile fills gaps only) + `User.mergedIntoId` (migration
`20261006180000_user_merged_into`); `getCurrentUser()` follows it and rewrites the cookie. Old middleware sends
`accountHint` (`&h=`) so carry re-runs whenever the two differ. **Rough guess** (`lib/roughGuess.ts`): only on a dead
heat — same-brand same label (cap 0.45) or S–XL ladder across types (cap 0.3), never from shoes; else names the
unplaceable piece. **Logo:** `centerline-fit.mjs` `straighten` on spineUp's start — the stem's kink at the crossing is gone.

**NEW INVARIANT:**
**(95)** **A browser ends with one account at both addresses, and a claimed account is never folded.** Folding moves an
unclaimed account's things into the one that stays and overwrites nothing; a rough guess runs only on a dead heat.

**SESSION 95 (2026-10-08).** 848 → **849 tests**. Extension **0.9.1** (store 0.9.0 live). Chinese display brackets
cut by margin (`.cjk-open`/`.cjk-close` in globals.css), not `halt` — Songti SC has none; the zh hero is
`width: fit-content` with line 2 (`.hero-line`) justified. `/outfits` uses `PageHeader`. Brand chart + page labels:
letters only when the chart is letters and the page offers ≥2 (`extractorLLM.ts` `chartKey`/`isLetterSize`);
capture.js reads on-screen swatches first. `BadgeMedallion` trig rounded (`q()`) — hydration-safe.
- Testing two hosts or live shop pages: `browser-extension/scripts/try-pages.mjs` (needs playwright resolvable —
  symlink a node_modules temporarily) with `--save-captures` gives HTML to replay through `/api/check`.

**SESSION 97 (2026-10-08).** 849 → **863 tests**. **3D fit map on /check** (Track 1): `SizeScore.zones`
(`fitEngine.ts`, `zoneVerdict`), `/api/check` body adds hip/height/inseam/sex (`recommendService.ts` `bodyForView`),
`bodyMesh.ts` proportions = **ANSUR II** ratios by sex (cited, pages in module), shell takes chart waist/hip,
`lib/fitMapColours.ts` (palette + `BodyGeometryData` interface), `lib/dressForm3d.ts` (indexed loft),
`components/FitMap3D.tsx` (one renderer per body; size change recolours only). `/check` card loads on scroll.
Old `EaseIn3D` + `check.threeD.*` removed; `BodyMesh3D` still serves /passport. /check is 126 kB vs ~119 kB cap
(pre-existing, todo/eng/13). **Track 2 (Anny) next** — see DEVLOG Session 97.

**NEW INVARIANT:**
**(96)** **A fit-map colour says only what `SizeScore.zones` says.** No zone → the form's grey; the centimetres
and verdict word are printed beside every coloured part.

**SESSION 97b (2026-10-09).** 863 → **873 tests**. Anny: `tools/anny/bake.py` (venv, anny 0.6.1) →
`public/anny/body.bin|json|NOTICE` (1,543 verts incl. ellipsoid mannequin head, 90 KB gz); `lib/annyBody.ts`
`fitAnny` (girths within 1 cm on 3 fixtures, residuals returned); `/lab/body` (noindex, robots `/lab/`, exempt
from the untranslated guard). Legs coloured by the hip only.

**SESSION 98a (2026-10-09).** 873 → **875 tests**. `fitDirection` is **Float** (1 decimal, `clampDirection` 0.1-grained;
migration `20261009120000_fit_direction_decimal`). `Field as="div"` for any composite control — a `<label>` forwards
a tap on a gap to its first button (the fit-scale "bounce"). `components/ColorPicker.tsx` (swatches, hex, wheel; no
typed names), `ProductLinkCheck.tsx` (edit sheet reads a link via `/api/closet/extract`). Add flow: optional 5th step
(`OPTIONAL_STEPS` in `lib/addFlow.ts`, outside the FIC budget).

**SESSION 98b (2026-10-09).** 875 → **1,276 tests** (358 are one-per-name coverage). **Two-level garment types:**
`lib/garmentTaxonomy.ts` (11 parents, 103 types, a type may sit under several parents), `garmentAliases.ts` (search
words), `garmentSearch.ts` (search + `refineType`, lazy in the browser), `garmentCoverage.fixture.ts` (Google +
Shopify downloaded; JD/Taobao from memory, UNVERIFIED). Picker = `CategoryPicker.tsx` (button/inline) +
`CategoryBrowser.tsx` (lazy chunk). Engine untouched: comparisons via `sameEngineCategory`, domain/ease via
`engineCategoryOf` (own ease key first). A missing type → add the name to the fixture first, then a type or alias.

**NEW INVARIANT:**
**(97)** **A garment type is sized as its engine key, and the 23 keys from before never change.** Every type names one
of the 23 (+ `underwear`); "same kind of garment" means the same engine key; the extractor and the extension still
speak only the 23. `garmentTaxonomy.test.ts` pins their domain, ease and folder.

**SESSION 98c (2026-10-09).** 1,276 → **1,295 tests**. **`/body` "my 3D body"** (`app/body/BodyStudio.tsx`):
dress form / realistic, faces (`tools/anny/bake_heads.py` → `public/anny/head-*.bin.gz`, `lib/annyHead.ts`
`placeFace`), body tones (`lib/bodyView.ts`), fit colours via URL from /check (`fitLink`), checklist linking to
`/passport?edit=1&focus=measurements|reference`. Assets now **`.bin.gz`** (`inflate` in annyBody.ts); run
`bake.py` before `bake_heads.py`. Egg head now reaches the crown (it was ~7 cm short). `BodyMesh3D.tsx` deleted;
entry card `components/Body3DEntry.tsx` on both passport views.

**NEW INVARIANT:**
**(98)** **An estimated body is for drawing only.** Girths measured on Anny from height and weight
(`estimateGirths`) fill the dress form on /body, say "estimated", and are never stored, sent or scored.

**SESSION 98d–e (2026-10-09).** → **1,301 tests**. Pop-overs placed against the window in a portal
(`components/useAnchoredPanel.ts`; type picker + colour pop-over). /body: heads = face (f1/m1 only) / form / none
(`lib/neckCut.ts`); tones = mannequin + Monk Skin Tone Scale 1–10 (CC BY 4.0, credited); skin lighting = physical
levels + NeutralToneMapping + tinted sheen (FitMap3D `skin`); sex switch (view only); cup A–F by EN 13402
(bust − underbust), Anny `phenotype-cupsize` baked from the "all" mode at default ancestry (never varied).
FitMap3D rebuilds on a whole-mesh checksum (two sampled vertices missed a cup change).

