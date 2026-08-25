# `app-web`

The Next.js application. **Start at the repository root
[`README.md`](../README.md)** ([简体中文](../README.zh-CN.md)) — it covers what the
product is, what's built, the architecture, and the design decisions worth knowing
before contributing.

This file only carries what is specific to this directory.

```bash
npm install
cp .env.example .env    # local needs only DATABASE_URL="file:./dev.db"
npm run db:push         # create/refresh the local SQLite database
npm run dev             # http://localhost:3000
```

| Command | Does |
|---|---|
| `npm test` | Vitest unit tests |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run build` | production build |
| `npm run db:push` | apply schema changes to the local SQLite DB |
| `npm run db:pg:generate` | generate the **Postgres** client — ⚠️ run `npx prisma generate` afterwards to restore the SQLite one, or local dev breaks |
| `npm run vercel-build` | what production runs: derive the Postgres schema → migrate → build |
| `node scripts/seed-admin.mjs` | create/refresh the admin account |
| `node scripts/moderate.mjs reports` | open content reports |

Deployment (Vercel + Neon), including the **two** database URLs production needs:
[`../docs/DEPLOYMENT.md`](../docs/DEPLOYMENT.md).
