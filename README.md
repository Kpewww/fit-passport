# Fit Passport

> **One body. One fit identity. Any store.**
> A consumer-owned fit layer for apparel — Fall 2026, CMU 49-800 *Start Up Creation in Practice*.

Team: Xiangchen Kong · Alyssa Qi  Instructor: Prof. Sheryl Root

Sizes never agree across brands. Fit Passport keeps **one portable profile** you
own — your measurements, your preferred fit, and the clothes that already fit you
— then translates it to any product page you paste. Every recommendation shows
its reasoning, because the engine is a transparent rule/score model, **not** a
black box.

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
```

Local dev needs **no API keys and no cloud services** — SQLite plus sensible
fallbacks everywhere. Optional keys unlock extras (see
[`app-web/.env.example`](app-web/.env.example)).

**Requires Node 18.20.** Dependencies are pinned to it — don't upgrade Next/Prisma
without upgrading Node first.

---

## What it does today

| Area | What's there |
|---|---|
| **Passport** | A metal charge-card identity page — portrait, holder, region, preferred fit, verification line. Its finish is themed by your highest earned badge (and you can pick any metal you've earned). Exports as a PNG. |
| **Closet** | Collections with custom folder colours, item photos, add-by-URL, variant merging, a filing-cabinet folder view (drag files out onto a "desk", set items aside in a comparison bucket), and edit history. |
| **Size check** | Paste any product link (bare domains fine) → the extractor reads brand / garment / gender / size chart → the engine ranks every size with per-signal reasons. Plus a live multi-region size converter. |
| **Fit refresh** | Re-rate how garments feel over time; bodies change, so the profile tracks drift. |
| **Outfits** | Compose looks on a body-typed SVG mannequin, post them, collect likes. Optional photoreal try-on when an image key is set. |
| **Community** | Opt-in directory of members (each with a metal banner in their card finish) plus an outfit feed. |
| **Badges** | 4-tier tracks (bronze → silver → gold → platinum) + rare capstones (diamond / obsidian) and special honours (amethyst / jade / amber). Struck-metal SVG medallions with per-track silhouettes, an inspect stage you can turn in 3D, and an optional true-WebGL view. |
| **Identity** | Anonymous session → claim an account → a shareable high-entropy account code. Login by username, email, or code. Password reset by email, change password, soft-deactivate. |

### Privacy invariant

**Your account code lets someone read your closet and a *coarse* body type —
never your precise measurements.** `/api/view/[code]` deliberately doesn't select
the cm fields, community listing is opt-in, body type can be hidden, and
deactivated accounts are invisible to all external access. See
[docs/design/identity-and-sharing.md](docs/design/identity-and-sharing.md).

### A note on imagery

We show **brand names as text only** and only ever display **user-uploaded
photos**. No scraped brand imagery or logos — a deliberate trademark/copyright
decision.

---

## Architecture

```
app-web/
  src/app/            # Next.js App Router pages + /api route handlers
  src/components/     # UI: MetalCard, BadgeMedallion, BadgeInspect, OutfitMannequin, …
  src/lib/            # Domain logic (all unit-tested where it matters)
    fitEngine.ts      #   the transparent scoring engine
    extractor.ts      #   URL → product (brand/garment/gender/size ladder)
    extractorLLM.ts   #   optional Claude upgrade, falls back cleanly
    badges.ts         #   badge ladder + metals (single source of truth)
    auth.ts / authEdge.ts  # HMAC sessions (Node + Edge, byte-compatible)
  prisma/schema.prisma     # data model (SQLite locally, Postgres in prod)
  middleware.ts       # mints the session cookie before any API call
docs/
  DEPLOYMENT.md       # Vercel + Neon runbook
  design/             # design notes (identity threat model, community ecosystem plan)
  course/             # course deliverables
  proposals/          # original proposal PDFs
DEVLOG.md             # per-session development log (also the Weekly Journal)
```

**Stack:** Next.js 14.2 · React 18 · TypeScript · Tailwind 3 · Prisma 5 · Zod ·
Vitest · Framer Motion + Lenis (motion) · three.js (lazy, badge inspect only).

Key design decisions worth knowing before contributing:

- **The engine is not an LLM.** Rules and weights, so it can be tested and
  explained. An LLM only ever *extracts* product data, never decides a size.
- **`KnownGoodItem.category` is the engine's garment type** and is not renamable.
  `Collection` is the user-facing folder — that's the one users rename.
- **`authEdge.ts` must stay byte-compatible with `auth.ts`.** Middleware runs on
  the Edge runtime and signs the same cookies the Node side verifies.
- **Everything key-gated degrades gracefully.** No key → a working fallback, never
  an error.

---

## Deployment

Production runs on **Vercel + Neon Postgres**. Local stays on SQLite; the Postgres
schema is *derived* from the same source schema at build time, so the two can't
drift.

Full runbook, env-var table, verification checklist, known limitations and costs:
**[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)**.

---

## Course deliverables

| Deliverable | Location |
|---|---|
| Weekly Journal | [DEVLOG.md](DEVLOG.md) |
| Project Plan | [docs/course/project-plan.md](docs/course/project-plan.md) |
| Business Model Canvas | [docs/course/business-model-canvas.md](docs/course/business-model-canvas.md) |
| Value Proposition Canvas | [docs/course/value-proposition-canvas.md](docs/course/value-proposition-canvas.md) |
| Customer interview guide | [docs/course/interview-guide.md](docs/course/interview-guide.md) |
| Risks, legal & governance | [docs/course/risks-and-legal.md](docs/course/risks-and-legal.md) |

---

*This is a student project and a demo, not a shipping product.*
