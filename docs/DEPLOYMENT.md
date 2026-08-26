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
prisma/schema.prisma               # source of truth (sqlite) — EDIT THIS ONE
scripts/gen-postgres-schema.mjs    # swaps the provider, adds directUrl
prisma/schema.postgres.prisma      # GENERATED (gitignored), built on deploy
prisma/migrations/migration_lock.toml  # records provider = postgresql — REQUIRED
prisma/migrations/0_init/          # committed Postgres migration
```

`migration_lock.toml` is not decoration: without it `prisma migrate deploy` cannot
determine the connector for the migrations directory and fails the build outright.
It is normally written by `prisma migrate dev`, which we never ran (the initial
migration was diffed offline `--from-empty`), so it had to be added by hand.

Every model uses only portable scalars (`String`, `Int`, `Float`, `Boolean`,
`DateTime`), so swapping the provider is sufficient. The generator refuses to run
if the source schema is no longer SQLite, so this can't silently break.

> ⚠️ **NO LONGER APPLICABLE — read this before following the block below.**
> A production database **has** been deployed (Neon, 2026-08-24) and it **has
> applied `0_init`**. Rewriting an applied migration makes Prisma refuse to
> deploy, so the "regenerate from empty" recipe below is now the *wrong* move and
> is kept only to explain how `0_init` came to exist. **Use the additive-migration
> recipe in the next block instead.**

**Historical — while no database had been deployed** (true up to Session 33), the
simplest correct move after a schema change was to *regenerate* `0_init` from empty
— no shadow database needed, and no applied history to conflict with:

```bash
cd app-web
npm run db:push                    # apply locally (SQLite)
npm run db:pg:schema               # refresh prisma/schema.postgres.prisma
npx prisma migrate diff --from-empty \
  --to-schema-datamodel prisma/schema.postgres.prisma \
  --script > prisma/migrations/0_init/migration.sql
```

**THIS IS THE CURRENT PROCEDURE.** A real database has applied `0_init`
(2026-08-24), so every schema change from now on is an *additive* migration —
rewriting an applied one makes Prisma refuse to deploy:

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

**No shadow database to hand? For a purely ADDITIVE change you don't need one.**
Diff the two schema *datamodels* directly — the before and after — which is an
offline operation:

```bash
cd app-web
git show <commit-before-your-change>:app-web/prisma/schema.prisma > /tmp/old.prisma
# generate the Postgres variant of BOTH, using scripts/gen-postgres-schema.mjs
# (swap prisma/schema.prisma temporarily, and PUT IT BACK), then:
npx prisma migrate diff \
  --from-schema-datamodel /tmp/old.pg.prisma \
  --to-schema-datamodel   prisma/schema.postgres.prisma \
  --script > prisma/migrations/$(date +%Y%m%d%H%M%S)_change/migration.sql
```

Before trusting it, **verify the chain**: regenerate `0_init` from the OLD schema
with `--from-empty` and confirm it reproduces the committed file byte for byte. If
it does, the new migration stacks onto it cleanly. If it does not, the migration
history has already drifted and this shortcut is unsafe — get a shadow database.

> ### ⚠️ `npm run db:push` IS NOT A MIGRATION
>
> `db:push` writes to the **local SQLite file only**. Production applies
> **committed migrations** via `prisma migrate deploy`. Change the schema, run only
> `db:push`, and everything local stays green — typecheck, tests, production build,
> local smoke — while production gets a Prisma Client querying columns its database
> does not have. **Every endpoint touching those tables returns 500.**
>
> This happened on 2026-08-25 (three columns for the signed fit scale). The
> symptom was `/passport` stuck on its loading state: the page rendered fine, and
> `/api/status` was 500 behind it.
>
> `src/lib/schemaMigrations.test.ts` now fails when a column in `schema.prisma`
> has no migration. It needs no database — it compares the schema text against the
> migration SQL — and it is the alarm for exactly this mistake.

---

## 2. Create the database (Neon)

1. Sign up at **neon.tech** (the free tier is enough for a demo).
2. Create a project → note **both** connection strings. Neon shows them under
   *Connection Details*; the only difference is the `-pooler` suffix on the host:
   - **pooled** → `postgresql://user:pass@ep-xxx-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require`
   - **direct** → `postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require`

   The running app uses the **pooled** host (`DATABASE_URL`) — serverless functions
   open many short connections, and the pooler is what keeps that from exhausting
   Postgres. **Migrations must use the direct host** (`DIRECT_URL`): the pooler is
   PgBouncer in *transaction* mode, and `prisma migrate deploy` takes *session*-level
   advisory locks, which transaction pooling cannot hold — a lock acquired on one
   backend gets released on another, so the migration hangs or errors. The generated
   Postgres schema declares both (`scripts/gen-postgres-schema.mjs`).
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
| `DATABASE_URL` | Neon **pooled** (`-pooler`) connection string | the running app |
| `DIRECT_URL` | the same string **without** `-pooler` | `prisma migrate deploy` at build time — see §2 |
| `SESSION_SECRET` | 32 random bytes | signs session cookies |
| `APP_URL` | `https://your-app.vercel.app` | absolute links in reset emails |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL | shared rate-limit counters |
| `UPSTASH_REDIS_REST_TOKEN` | its REST token | ditto |

**Why the Upstash pair is in the *required* table:** without it, rate limits are
counted per serverless instance, so the effective limit is `limit × instances` —
i.e. no limit. Create a free Redis at **upstash.com**, copy the REST URL and REST
token from its dashboard. The app talks to it over the REST API with plain
`fetch` (no SDK, so nothing drags the toolchain forward), and falls
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
| `ANTHROPIC_API_KEY` | LLM text extract + vision size-chart OCR (Claude Haiku 4.5) | **SET in production since 2026-08-25.** ~$0.012/check, capped ~$0.026. Only page text is sent, never measurements. NOTE: it cannot fix a 403 — it only helps pages we actually fetched. |
| `REPLICATE_API_TOKEN` | photoreal try-on (FLUX schnell) | ~$0.003/image; coarse body descriptor only |
| `RESEND_API_KEY` + `EMAIL_FROM` | password-reset emails | without it, `/recover` shows the link on screen |
| `TRYON_API_URL` / `TRYON_API_KEY` | generic image provider | alternative to Replicate |

See `app-web/.env.example` for the full annotated list.

---

## 4. Known limitations to fix before real users

These are honest gaps, not oversights — they're fine for a demo and must
be addressed before a public launch.

1. **Images are base64 data URLs** in Postgres (portraits, item photos). This is
   **the first hard wall in the design**, not a nice-to-have: Neon's free tier is
   0.5 GB ≈ **340 users with ten photos each**, after which writes fail for
   *everyone*, not just heavy users. It arrives long before model spend matters.
   Move to object storage (Vercel Blob / S3 / R2) before inviting a cohort — a
   code change plus a free tier, not a bill. See `docs/design/cost-model.md` §5.
2. **No backups configured.** Neon has point-in-time restore on paid tiers; at
   minimum, export periodically.
3. **Auto-hide is still gameable at the margin.** Reports auto-hide content at 3
   distinct reporters (`src/lib/reports.ts`), which three coordinated accounts
   could trigger. A human review queue exists at `/admin` (Session 37) and can
   override either way, and `node scripts/moderate.mjs` is the CLI equivalent —
   but the threshold itself is still crude, and **appeals do not exist**: a hidden
   author can see they were hidden but cannot reply.
4. **Preview deployments have no database of their own.** `prisma migrate deploy`
   runs during build, so a preview inheriting `DATABASE_URL` would migrate
   *production* from a feature branch. Mitigated for now by scoping every env var
   to the `production` target only — which means preview builds fail outright.
   Give previews their own Neon branch before enabling them.
5. **Vercel Hobby forbids commercial use.** A licence term, not a resource limit:
   the moment this charges anyone, Pro ($20/member/month) is required. Hobby's
   100 GB bandwidth cap also has **no overage option** — it simply stops.

---

## 4b. Creating the admin account

The review queue at `/admin` needs an account with `role = "ADMIN"`. There is
deliberately **no API** that grants the role, so it comes from a script run against
the production database:

```bash
cd app-web
DATABASE_URL="<neon pooled url>" ADMIN_USERNAME=AK ADMIN_PASSWORD='<a real password>' \
  node scripts/seed-admin.mjs
```

It is idempotent, and it also backfills membership numbers (founder = 1, everyone
else by join order). **Change the password from the local default before running it
against production.**

---

## 5. Verifying a deployment

After the first deploy, walk the critical path:

```
/                → loads, hero renders
/check           → paste "uniqlo.com/us/en/products/airism-cotton-t-shirt"
                   (bare domain must work) → returns Uniqlo / tshirt / a size
                   NOTE: expect `sizesFrom: "estimated"` on most real retailers —
                   many (H&M, and anything behind Cloudflare/Akamai) return 403 to
                   server-side fetches, so the app honestly degrades instead of
                   inventing a chart. Verify the WARNING renders, not just a size.
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

So a demo with a few dozen testers is **effectively free**, plus cents for
any LLM/image usage.
