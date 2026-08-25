---
name: project-fit-passport-deployment
description: "Fit Passport deployment setup — local SQLite vs production Postgres, Vercel+Neon runbook, prod gotchas"
metadata: 
  node_type: memory
  type: project
  originSessionId: ff70f30d-84e1-4230-9852-546155e0d6ff
  modified: 2026-08-12T22:34:33.317Z
---

How [[project-fit-passport]] is set up to deploy (prepared Session 31, 2026-08-12). Full runbook lives in the repo at **`docs/DEPLOYMENT.md`** — read that first; this is the summary + the traps.

**The two-database design.** Verified empirically: **Prisma REJECTS `env()` for `datasource.provider`** (validation error), so one schema file cannot serve SQLite + Postgres. Solution in place: `prisma/schema.prisma` stays **SQLite and is the single source of truth**; `app-web/scripts/gen-postgres-schema.mjs` *derives* `prisma/schema.postgres.prisma` (gitignored, generated at build) by swapping the provider — safe because every model uses portable scalars only. The generator **exits 1 if the source schema is no longer sqlite**. **Local `npm run dev` is unchanged (SQLite, zero setup).** Do NOT hand-write a second schema.

**Migrations.** `prisma/migrations/0_init/migration.sql` (337 lines) is committed, generated offline via `prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.postgres.prisma --script` — no live DB needed. After any schema change: `npm run db:push` (local) then diff a new migration against `prisma/migrations` (needs a throwaway Postgres as shadow DB; command is in DEPLOYMENT.md).

**Scripts (`app-web/package.json`):** `typecheck`, `db:push` (local SQLite), `db:pg:schema|generate|migrate`, **`vercel-build`** = `db:pg:generate && prisma migrate deploy --schema prisma/schema.postgres.prisma && next build`, plus `postinstall: prisma generate`. Verified `prisma generate` tolerates a Postgres `DATABASE_URL` against the SQLite schema (exit 0), so postinstall won't break Vercel.

**Vercel settings:** Root Directory = **`app-web`** (app isn't at repo root); Build Command = **`npm run vercel-build`**. Required env: `DATABASE_URL` (Neon **pooled** `-pooler` host), `SESSION_SECRET`, `APP_URL`. Optional (all degrade gracefully): `ANTHROPIC_API_KEY`, `REPLICATE_API_TOKEN`, `RESEND_API_KEY`+`EMAIL_FROM`, `TRYON_API_URL/KEY`.

**`SESSION_SECRET` is now REQUIRED in production** (`lib/auth.ts` + `lib/authEdge.ts`, identical logic so Node/Edge cookies cross-verify). It is resolved **per call, NOT at module load** — an import-time throw breaks `next build`, which runs with `NODE_ENV=production` but needs no secret. Verified: no secret → 500 and no cookie minted; with secret → cookie signed, APIs 200.

**GOTCHA when smoke-testing production locally:** `npm run dev` overwrites `.next`, so a later `next start` can serve **404 on every page while APIs still work**. That is stale artifacts, not a regression — `rm -rf .next && npm run build` first. (Cost me a false alarm once.)

**Known limitations to fix before real users** (documented honestly in DEPLOYMENT.md): (1) **rate limiter is per-instance in-memory** (`lib/rateLimit.ts`) → swap for Upstash Redis, otherwise login/reset limits are ineffective on serverless; (2) portraits/item photos are base64 data URLs in Postgres → move to blob storage if closets grow; (3) no backups configured; (4) `migrate deploy` runs during build, so give preview deployments their own Neon branch.

**Not done / needs the founder:** actually creating the Neon project and Vercel project (I can't provision accounts). Cost at demo scale ≈ $0 + cents for LLM/image calls.

**UPDATE 2026-08-24 (Session 41) — two things the original runbook got wrong, both found before the first deploy:**
1. **`prisma/migrations/migration_lock.toml` was missing** and must be committed. `prisma migrate deploy` reads the connector from it and aborts with "Could not determine the connector from the migrations directory" otherwise. It is normally written by `prisma migrate dev`, which this project never ran (0_init was diffed offline `--from-empty`), so it never existed. Added, recording `provider = "postgresql"`.
2. **Production needs TWO urls, not one.** `DATABASE_URL` = Neon **pooled** (`-pooler`) for the running app; **`DIRECT_URL`** = the same string without `-pooler`, used only by `prisma migrate deploy`. Neon's pooler is PgBouncer in *transaction* mode and migrations take *session*-level advisory locks, which it cannot hold. `scripts/gen-postgres-schema.mjs` now emits `directUrl = env("DIRECT_URL")` and hard-fails if the datasource block no longer matches.

**Neon project is LIVE** (created 2026-08-24, region `us-east-2`; the endpoint host and both connection strings live in the Vercel env vars — never write them down here). `0_init` has **already been applied** from the local machine, so the first Vercel build's `migrate deploy` is a no-op. The whole build was rehearsed locally against the real DB before touching Vercel — that is the pattern to repeat: `npm run db:pg:generate` + `prisma migrate deploy` locally with the prod env vars beats discovering a failure in CI.

**GOTCHA:** `npm run db:pg:generate` overwrites the generated Prisma Client with the **Postgres** one. Run `npx prisma generate` afterwards to restore the SQLite client, or local `npm run dev` breaks.

**Also on this machine:** PowerShell's default execution policy blocks npm's `.ps1` shims, so `vercel login` fails with "running scripts is disabled on this system" — call `vercel.cmd` instead rather than weakening the policy.

**LIVE as of 2026-08-24 (Session 41): https://fit-passport.vercel.app**
- Vercel project `fit-passport`, Node 24.x, framework nextjs. Org/project ids are in `.vercel/project.json` (gitignored) and in the Vercel dashboard — look them up, do not record them.
- **`vercel link` sets Root Directory to `.`, which is WRONG here** — the Next app is in `app-web/`. Fixed via `PATCH https://api.vercel.com/v9/projects/{id}` with `rootDirectory: "app-web"`, `buildCommand: "npm run vercel-build"`. The CLI has no command for this; the API is the way. CLI auth token lives at `%APPDATA%\xdg.data\com.vercel.cli\auth.json`.
- **Env vars are set for `production` target ONLY, on purpose** — a preview deploy inheriting `DATABASE_URL` would run `prisma migrate deploy` against PRODUCTION from a feature branch. Preview builds failing for want of a DB is the safe outcome; give previews their own Neon branch before enabling them.
- `.vercel/` lives at the REPO ROOT (moved there from `app-web/`) so `vercel deploy --prod` uploads the whole repo and lets `rootDirectory` resolve. Added to `.gitignore`.
- **GitHub auto-deploy is NOT connected** — `vercel git connect` and `POST /v9/projects/{id}/link` both fail until the founder installs the Vercel GitHub App on the `Kpewww` account with access to the private repo. Until then release with `vercel deploy --prod` from the repo root.
- **Production admin exists**: username `AK`, member No.1, password generated at seed time (NOT the local default). Seeding prod = `db:pg:generate` → run `scripts/seed-admin.mjs` with prod env → `npx prisma generate` to restore the SQLite client.
- Verified live: 12/12 pages 200, Postgres read/write, core `/api/check` loop, Upstash actually receiving `rl:*` counters, and the **privacy invariant** (`/api/view/[code]` returns no cm/kg field of any kind).
- Not yet set in prod: `ANTHROPIC_API_KEY` (so LLM + vision OCR extraction are inert), `RESEND_API_KEY`, `REPLICATE_API_TOKEN`.
