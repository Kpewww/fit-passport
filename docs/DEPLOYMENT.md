# Deploying Fit Passport (Vercel + Neon Postgres)

This is the runbook for putting the app on the internet. It assumes the repo as
it stands: **Next.js 14 App Router + Prisma**, SQLite locally, **Postgres in
production**.

Two things are true and worth stating up front:

- **Local development does not change.** `npm run dev` still uses
  `prisma/dev.db` (SQLite), so day-to-day work needs zero setup.
- **Production runs Postgres.** SQLite can't work on Vercel — the filesystem is
  ephemeral and read-only, so every deploy (and every serverless instance) would
  see a different, empty database.

---

## 1. How the two databases coexist

Prisma requires `datasource.provider` to be a **string literal** — it cannot read
an env var — so one schema file cannot serve both engines. Rather than
hand-maintain two schemas (which always drift), we keep **one source of truth**
and derive the other:

```
prisma/schema.prisma            # source of truth (sqlite) — EDIT THIS ONE
scripts/gen-postgres-schema.mjs # swaps the provider
prisma/schema.postgres.prisma   # GENERATED (gitignored), built on deploy
prisma/migrations/0_init/       # committed Postgres migration
```

Every model uses only portable scalars (`String`, `Int`, `Float`, `Boolean`,
`DateTime`), so swapping the provider is sufficient. The generator refuses to run
if the source schema is no longer SQLite, so this can't silently break.

**While no database has been deployed yet** (still true as of Session 33), the
simplest correct move after a schema change is to *regenerate* `0_init` from empty
— no shadow database needed, and there's no applied history to conflict with:

```bash
cd app-web
npm run db:push                    # apply locally (SQLite)
npm run db:pg:schema               # refresh prisma/schema.postgres.prisma
npx prisma migrate diff --from-empty \
  --to-schema-datamodel prisma/schema.postgres.prisma \
  --script > prisma/migrations/0_init/migration.sql
```

**Once a real database has applied `0_init`, stop doing that** — rewriting an
applied migration makes Prisma refuse to deploy. From then on add an *additive*
migration instead:

```bash
cd app-web
npm run db:push                    # apply locally (SQLite)
npm run db:pg:schema               # refresh prisma/schema.postgres.prisma
npx prisma migrate diff \
  --from-migrations prisma/migrations \
  --to-schema-datamodel prisma/schema.postgres.prisma \
  --shadow-database-url "$SHADOW_DATABASE_URL" \
  --script > prisma/migrations/$(date +%Y%m%d%H%M%S)_change/migration.sql
```

(`SHADOW_DATABASE_URL` can be any throwaway Postgres database — e.g. a second
Neon branch. For the initial migration no shadow DB was needed because it was
diffed `--from-empty`.)

---

## 2. Create the database (Neon)

1. Sign up at **neon.tech** (free tier is enough for the course demo).
2. Create a project → note the **pooled** connection string. It looks like:
   `postgresql://user:pass@ep-xxx-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require`
   Use the **pooled** (`-pooler`) host — serverless functions open many short
   connections, and the pooler is what keeps that from exhausting Postgres.
3. Optionally create a second **branch** (e.g. `shadow`) for future migrations.

---

## 3. Deploy (Vercel)

1. Push to GitHub (already done: `github.com/Kpewww/fit-passport`).
2. On **vercel.com** → *Add New Project* → import the repo.
3. **Root Directory: `app-web`** (the Next app is not at the repo root).
4. **Build Command:** `npm run vercel-build`
   This runs, in order: generate the Postgres schema → `prisma generate` →
   `prisma migrate deploy` (creates/updates tables) → `next build`.
5. Add the environment variables below, then deploy.

### Required environment variables

| Variable | Value | Why |
|---|---|---|
| `DATABASE_URL` | Neon **pooled** connection string | the database |
| `SESSION_SECRET` | 32 random bytes | signs session cookies |
| `APP_URL` | `https://your-app.vercel.app` | absolute links in reset emails |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL | shared rate-limit counters |
| `UPSTASH_REDIS_REST_TOKEN` | its REST token | ditto |

**Why the Upstash pair is in the *required* table:** without it, rate limits are
counted per serverless instance, so the effective limit is `limit × instances` —
i.e. no limit. Create a free Redis at **upstash.com**, copy the REST URL and REST
token from its dashboard. The app talks to it over the REST API with plain
`fetch` (no SDK, so nothing drags the pinned Node 18 toolchain forward), and falls
back to in-process counters if Redis is unreachable rather than locking everyone
out — check the logs for `[rateLimit] Redis unavailable` if limits behave oddly.

Generate the secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

> **The app now refuses to boot in production without `SESSION_SECRET`.** That is
> deliberate: with the dev fallback secret, anyone could forge a session cookie
> and read or write any account.

### Optional environment variables

Everything below degrades gracefully when unset — the app stays fully usable.

| Variable | Unlocks | Notes |
|---|---|---|
| `ANTHROPIC_API_KEY` | real product-page extraction (Claude Haiku) | ~$0.007/check; only page text is sent, never measurements |
| `REPLICATE_API_TOKEN` | photoreal try-on (FLUX schnell) | ~$0.003/image; coarse body descriptor only |
| `RESEND_API_KEY` + `EMAIL_FROM` | password-reset emails | without it, `/recover` shows the link on screen |
| `TRYON_API_URL` / `TRYON_API_KEY` | generic image provider | alternative to Replicate |

See `app-web/.env.example` for the full annotated list.

---

## 4. Known limitations to fix before real users

These are honest gaps, not oversights — they're fine for a course demo and must
be addressed before a public launch.

1. **Moderation has no review queue.** Reports auto-hide content at 3 distinct
   reporters (`src/lib/reports.ts`), which three coordinated accounts could abuse.
   `hidden` is reversible and `node scripts/moderate.mjs` is the authoritative
   takedown/restore path, but a real queue is needed before scale.
2. **Images are base64 data URLs** in Postgres (portraits, item photos). Simple
   and private, but it bloats rows. Move to object storage (Vercel Blob / S3) if
   the closet grows.
3. **No backups configured.** Neon has point-in-time restore on paid tiers; at
   minimum, export periodically.
4. **`prisma migrate deploy` runs during build.** Fine for one environment; with
   preview deployments pointing at the same database, a schema change from a
   branch could hit production. Give previews their own Neon branch.

---

## 5. Verifying a deployment

After the first deploy, walk the critical path:

```
/                → loads, hero renders
/check           → paste "patagonia.com/product/womens-fitz-roy-down-hoody/85506.html"
                   (bare domain must work) → returns Patagonia / jacket / a size
/passport        → edit, reload, values persisted (proves Postgres writes)
/account         → claim an account → note the account code
/u/<code>        → public view works, shows closet, NO measurements
/community       → opt in, appears in the directory with a metal banner
```

The last two matter most: they're the privacy invariant. `/api/view/[code]` must
never return `chestCm`/`waistCm`/etc.

---

## 6. Cost at demo scale

| Item | Cost |
|---|---|
| Vercel Hobby | $0 |
| Neon free tier | $0 |
| Domain (optional) | ~$12/yr |
| `ANTHROPIC_API_KEY` | ~$0.007 per product check |
| `REPLICATE_API_TOKEN` | ~$0.003 per try-on image |
| Resend free tier | $0 (~3,000 emails/mo) |

So a course demo with a few dozen testers is **effectively free**, plus cents for
any LLM/image usage.
