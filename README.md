# Fit Passport

*[English](README.md) · [简体中文](README.zh-CN.md)*

> **One body. One fit identity. Any store.**
> A consumer-owned fit layer for apparel. Live at **https://fit-passport.vercel.app**

Team: Xiangchen Kong · Alyssa Qi · Jenny Cao · Nicolas Wang

Sizes never agree across brands. Fit Passport keeps **one portable profile** you
own — your measurements, your preferred fit, and the clothes that already fit you
— and translates it to the product page you are looking at, through a **browser
extension** (pasting a link on the site still works, as a beta: many large shops
block servers from reading their pages). Every recommendation shows its
reasoning, because the engine is a transparent rule/score model, **not** a black
box. The site and the extension speak **English and 简体中文**.

---

## Quick start

```bash
cd app-web
npm install
npm run db:push        # create/refresh the local SQLite database
npm run dev            # http://localhost:3000
```

Other scripts:

```bash
npm test               # unit tests (fit engine, badges, extractor, converters…)
npm run typecheck      # tsc --noEmit
npm run build          # production build

npm run eval           # the evaluation (app-web/eval/README.md)

node scripts/pack-extension.mjs                # repack the extension zip the site offers
node scripts/pack-extension.mjs --store        # the Chrome Web Store package (store-build/)
node scripts/seed-admin.mjs                    # create/refresh the admin account
node scripts/moderate.mjs reports              # open content reports
node scripts/moderate.mjs unhide POST <id>     # restore something hidden wrongly
```

Fonts are **self-hosted** (`src/app/fonts/`, both OFL 1.1) rather than fetched from
Google at build time — a build shouldn't depend on a third party being reachable.

Local dev needs **no API keys and no cloud services** — SQLite plus sensible
fallbacks everywhere. Optional keys unlock extras (see
[`app-web/.env.example`](app-web/.env.example)).

**Runs on Node 24 LTS.** (Older notes say "pinned to Node 18.20" — that was a
previous machine's constraint, not a project requirement; it is lifted.)

**The extension, locally:** `chrome://extensions` → Developer mode → *Load
unpacked* → `browser-extension/`. Its popup has a server switch; pick
`localhost:3000`. Details, permissions and what it sends:
[`browser-extension/README.md`](browser-extension/README.md).

---

## What it does today

| Area | What's there |
|---|---|
| **Browser extension** | The way in — **[in the Chrome Web Store](https://chromewebstore.google.com/detail/fit-passport/ciecejomnniicliemefagfegkmgfkgfe)** since 2026-10-05; the zip of `browser-extension/` is a backup on `/help` (listing material: [`docs/store/`](docs/store/chrome-web-store.md)). On first install it opens `/extension/welcome`. Click it on a product page: it reads that tab only, sends a reduced copy (title, product data, size charts, size options — never forms, cart, account or reviews, and you can see exactly what goes first) and shows one size with its reasons. Reads Tmall/Taobao parameter lists, eBay item specifics and — with a permission asked once on a click — the seller's description. Says plainly when a page is a sign-in or a hidden-details page instead of guessing. |
| **Second-hand listings** | No size chart? The seller's measurements are read instead — pit to pit ×2 is the garment's chest, never compared with a body — and judged against your closet or measurements: *likely fits / may be tight / may be loose*, with the reason and what would settle it. Typed-in measurements work on `/check` too. |
| **To-buy list** | Save a product from the extension (`/saved` on the site). Kept in its own table: it never counts as clothes you own, never trains the engine, never earns a badge. "Bought it" moves it into the closet, with a fit report. |
| **Passport** | A metal charge-card identity page — the **Fit Card** — portrait, holder, region, preferred fit, verification line. Its finish is themed by your highest earned badge (and you can pick any metal you've earned). Exports as a PNG. |
| **Closet** | Collections with custom folder colours, item photos, add-by-URL (pre-fills only what the page really said; demo data is labelled), variant merging, a filing-cabinet folder view (drag files out onto a "desk", set items aside in a comparison bucket), and edit history. Each garment records **which way it misses** on a signed scale (*too tight … just right … too loose*), in words or as a number — that direction is what the engine can actually act on, and the old 1–5 star rating is now derived from it rather than asked for separately. |
| **Size check** | (Beta, since the extension leads.) Paste any product link (bare domains fine) → the extractor reads the **real page** (schema.org JSON-LD, OpenGraph, and on-page size-chart tables; optional vision OCR for image-only charts; Chinese `号型` codes) → a transparent engine ranks every size across **chest + waist + shoulder** with per-signal reasons and an ordinal verdict (*too small … true to size … too big*). It says honestly whether the sizes were **read from the page** or **estimated**, and caps confidence when estimating. Plus a live multi-region size converter. |
| **Fit refresh** | Re-rate how garments feel over time; bodies change, so the profile tracks drift. Reports **direction**, not a grade — see below. |
| **Outfits** | Compose looks on a body-typed SVG mannequin, post them, collect likes. Optional photoreal try-on when an image key is set. |
| **Community** | Opt-in directory of members (each with a metal banner in their card finish), plus an outfit feed you can switch between **Everyone** (most-liked first) and **Following** (people you follow, newest first). Following requires a claimed account on both sides, so follower counts stay earned. |
| **The board** | Daily **Top looks** and **Top stylists**, counted inside a UTC-day (or rolling-week) window so it resets and a newcomer can win today. Stylist standing is `likes + 3 × helpful answers` — never follower count. |
| **Ask & Answer** | Fit questions with **receipts** — a question or an answer can attach a garment the author actually owns (brand · size · fit rating · the build it fits), so replies carry evidence, not hunches. Helpful votes, an accepted answer, and a "needs an answer" filter. Lives inside **Community**; threads get their own URL. |
| **Moderation** | Report any post, answer or look. Three distinct reporters auto-hide it (reversible); hidden content stays visible to its author so it never silently vanishes. Admins get a **review queue** at `/admin` to override the threshold either way; `node scripts/moderate.mjs` is the CLI equivalent. |
| **Blocking** | Block a person from their profile. Enforced **both ways** — their looks, questions and answers leave your feeds and the directory, and yours leave theirs. Blocking also unfollows in both directions. They're never told. |
| **Membership number** | Every claimed account gets a sequential `No. 00000042`, embossed on the passport card (and in its PNG export) and shown on the public profile. Issued at claim — an anonymous session isn't a membership yet. |
| **Badges** | Four 4-tier tracks (bronze → silver → gold → **titanium**) — wardrobe, fit record, atelier, counsel — plus rare capstones (diamond / obsidian) and special honours (amethyst / jade / amber). Titanium replaced platinum, whose pale grey was near-indistinguishable from silver two rungs below. Every badge everywhere is a **dimensional struck medal**: it stands at an angle so its milled edge and thickness are visible *before* you touch it, is lit from one consistent direction (dome, terminator, rim light, recessed field, embossed motif), turns under the cursor, and lifts into an inspect stage that extrudes its real silhouette in WebGL. **Since 2026-08-25 the list views render a FLAT medallion by default** — the dimensional treatment costs ~140 composited layers on the trophy case, which was too heavy on lower-powered machines, so it now lives in the inspect stage where one badge is looked at closely. `BadgeCoin`'s `dimensional` prop restores it.|
| **Identity** | Anonymous session → claim an account → a shareable high-entropy account code. Login by username, email, or code. Password reset by email, change password, soft-deactivate. |

### Privacy invariant

**Your account code lets someone read your closet and a *coarse* body type —
never your precise measurements.** `/api/view/[code]` deliberately doesn't select
the cm fields, community listing is opt-in, body type can be hidden, and
deactivated accounts are invisible to all external access. See
[docs/design/identity-and-sharing.md](docs/design/identity-and-sharing.md).
What the site and the extension keep and send, in plain words:
[`/privacy`](https://fit-passport.vercel.app/privacy).

### A note on imagery

We show **brand names as text only** and only ever display **user-uploaded
photos**. No scraped brand imagery or logos — a deliberate trademark/copyright
decision.

---

## Architecture

```
app-web/
  src/app/            # Next.js App Router pages + /api route handlers
  src/i18n/           # English (the source) and Chinese messages; parity tests
  src/components/     # UI: MetalCard, BadgeMedallion, BadgeInspect, OutfitMannequin, …
  src/lib/            # Domain logic (all unit-tested where it matters)
    fitEngine.ts      #   the transparent multi-dimensional scoring engine
    extractor.ts      #   URL → product (brand/garment/gender/size ladder)
    pageParse.ts      #   deterministic real-page parsing (JSON-LD, tables, 号型, chart images)
    extractorLLM.ts   #   fetch + parse the real page; optional Claude text/vision, cached, block-aware
    populationPrior.ts#   region cold-start body prior (survey-grounded, governance-safe)
    badges.ts         #   badge ladder + metals (single source of truth)
    fitDirection.ts   #   the signed fit scale (-10 too tight … +10 too loose)
    closetConsistency.ts # confidence from how much a wearer's own reports agree
    sellerMeasurements.ts / listingJudgement.ts # second-hand: the seller's tape → a judgement
    auth.ts / authEdge.ts  # HMAC sessions (Node + Edge, byte-compatible)
  prisma/schema.prisma     # data model (SQLite locally, Postgres in prod)
  middleware.ts       # mints the session cookie before any API call
  scripts/pack-extension.mjs # the extension zip (committed) and the store package
browser-extension/    # the MV3 extension: capture.js reads the page, popup.js answers
brand/                # the Fit Thread mark — BUILD INPUTS, not documentation.
                      #   Logo.tsx renders the master's path; a test fails if they drift
docs/
  RESUME.md           # cold-start brief
  DEPLOYMENT.md       # Vercel + Neon runbook
  memory/             # shared decisions, invariants and traps
  design/             # shared technical research and engineering design notes
  store/              # the Chrome Web Store listing: copy, justifications, images
todo/                 # the board: what to do next, by who can move it
coursework/
  technical/          # technical-course lens and deliverables
  startup/            # startup/market/product documents and deliverables
DEVLOG.md             # per-session development log — decisions, and what they cost
```

**Where things live.** `docs/` is what you *read*; `brand/` is what the app and the
print files are *built from*. The mark used to sit under `docs/design/assets/`, which
made it look optional — it is not, and `src/lib/logoAsset.test.ts` now fails if
`Logo.tsx` and the master SVG disagree.

**Stack:** Next.js 14.2 · React 18 · TypeScript · Tailwind 3 · Prisma 5 · Zod ·
Vitest (**~730 tests**) · Framer Motion (motion) · three.js (lazy, badge inspect only).

Key design decisions worth knowing before contributing:

- **The engine is not an LLM.** Rules and weights across chest/waist/shoulder, so it
  can be tested and explained. An LLM only ever *extracts* product data (page text or
  a chart image), never decides a size.
- **Honest provenance.** The size chart is tagged `page` (read from the product page)
  vs `estimated` (synthesized from the brand); the UI says which, and confidence is
  capped when estimating. Same for the regional body prior — a cold-start guess is
  labelled and never overrides the user's own data. All grounded in
  [docs/design/fit-algorithm-research.md](docs/design/fit-algorithm-research.md).
- **`KnownGoodItem.category` is the engine's garment type** and is not renamable.
  `Collection` is the user-facing folder — that's the one users rename.
- **`authEdge.ts` must stay byte-compatible with `auth.ts`.** Middleware runs on
  the Edge runtime and signs the same cookies the Node side verifies.
- **Everything key-gated degrades gracefully.** No key → a working fallback, never
  an error.
- **Changing `prisma/schema.prisma` requires a migration.** `npm run db:push` only
  writes to local SQLite; production applies committed migrations. Skipping this
  took production down once — `src/lib/schemaMigrations.test.ts` now fails when a
  column has no migration. Recipe in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).
- **The fit input is never a drag slider**, and mobile navigation lives in
  `Nav.tsx`'s menu panel — every nav link is `sm:block`, so without it a phone has
  no navigation at all. Both are measured decisions; see
  [docs/design/closet-signal-and-interaction-cost.md](docs/design/closet-signal-and-interaction-cost.md)
  and `app-web/scripts/mobile-audit.mjs`.

---

## Coursework tracks

This repository supports two course lenses without forking the product. The **technical track** focuses on implementation, feasibility, baselines, data/algorithm decisions and reproducible engineering evidence. The **startup track** focuses on customer/market validation, positioning, business model, product delivery and brand. See [coursework/](coursework/) for the split.

---

## Deployment

Production runs on **Vercel + Neon Postgres**. Local stays on SQLite; the Postgres
schema is *derived* from the same source schema at build time, so the two can't
drift.

Full runbook, env-var table, verification checklist, known limitations and costs:
**[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)**.

---

## Startup & product documents

| Document | Location |
|---|---|
| Prospectus — the full picture in one read | [coursework/startup/prospectus/Fit-Passport-Prospectus.md](coursework/startup/prospectus/Fit-Passport-Prospectus.md) |
| Message architecture — positioning and voice | [coursework/startup/business/message-architecture.html](coursework/startup/business/message-architecture.html) |
| Project plan | [coursework/startup/business/project-plan.md](coursework/startup/business/project-plan.md) |
| Business Model Canvas | [coursework/startup/business/business-model-canvas.md](coursework/startup/business/business-model-canvas.md) |
| Value Proposition Canvas | [coursework/startup/business/value-proposition-canvas.md](coursework/startup/business/value-proposition-canvas.md) |
| Customer interview guide | [coursework/startup/business/interview-guide.md](coursework/startup/business/interview-guide.md) |
| Risks, legal & governance | [coursework/startup/business/risks-and-legal.md](coursework/startup/business/risks-and-legal.md) |
| Logo concept and rationale | [coursework/startup/product-design/LOGO_CONCEPT.md](coursework/startup/product-design/LOGO_CONCEPT.md) · [简体中文](coursework/startup/product-design/LOGO_CONCEPT.zh-CN.md) |
| Brand asset manifest — which file to use where | [brand/README.md](brand/README.md) |
| Project memory — decisions, invariants, traps | [docs/memory/README.md](docs/memory/README.md) |
| Development log | [DEVLOG.md](DEVLOG.md) |

---

*A working prototype, not a shipping product. It is deployed, tested and used, but
it has not been hardened for commercial traffic — see
[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for the known limitations.*
