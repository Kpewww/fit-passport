// Generate the PRODUCTION (Postgres) Prisma schema from the local (SQLite) one.
//
// Why: Prisma's `datasource.provider` must be a string literal — it cannot read
// an env var — so a single schema file can't serve both SQLite locally and
// Postgres in production. Rather than hand-maintain two files (guaranteed drift),
// we keep ONE source of truth (`prisma/schema.prisma`) and mechanically derive
// the Postgres copy here. Every model in this app uses only portable scalar types
// (String/Int/Float/Boolean/DateTime), so swapping the provider is sufficient.
//
// The derived schema also gains a `directUrl`, which the SQLite source has no use
// for. See the comment on the replacement below.
//
// Run: node scripts/gen-postgres-schema.mjs
// Output: prisma/schema.postgres.prisma (generated — do not edit by hand)

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, "..", "prisma", "schema.prisma");
const out = join(here, "..", "prisma", "schema.postgres.prisma");

const schema = readFileSync(src, "utf8");

if (!/provider\s*=\s*"sqlite"/.test(schema)) {
  console.error(
    "gen-postgres-schema: expected the source schema to use the sqlite provider. " +
      "If the local provider changed, update this script.",
  );
  process.exit(1);
}

const banner = `// GENERATED FILE — do not edit.
// Produced from prisma/schema.prisma by scripts/gen-postgres-schema.mjs.
// Edit the source schema instead, then re-run the script.

`;

// Swap the provider AND add `directUrl`.
//
// `prisma migrate deploy` must NOT run over a pooled connection. Neon's pooled
// (`-pooler`) host is PgBouncer in TRANSACTION mode, and migrations take
// SESSION-level advisory locks — a lock taken on one backend can be released on
// another, so the migration either hangs or errors. Prisma's answer is a second
// URL used only for migrations: the app keeps the pooled host in `url` (serverless
// opens many short connections, which is exactly what the pooler is for), while
// migrations use the direct host in `directUrl`.
//
// Both are supplied by the deployment environment: DATABASE_URL = the `-pooler`
// string, DIRECT_URL = the same string with `-pooler` removed. See docs/DEPLOYMENT.md.
const DATASOURCE_RE = /provider\s*=\s*"sqlite"\s*\n\s*url\s*=\s*env\("DATABASE_URL"\)/;

if (!DATASOURCE_RE.test(schema)) {
  console.error(
    "gen-postgres-schema: could not find the expected sqlite datasource block " +
      '(provider = "sqlite" followed by url = env("DATABASE_URL")). ' +
      "If the datasource block changed, update this script.",
  );
  process.exit(1);
}

const postgres =
  banner +
  schema.replace(
    DATASOURCE_RE,
    'provider  = "postgresql"\n  url       = env("DATABASE_URL")\n  directUrl = env("DIRECT_URL")',
  );

writeFileSync(out, postgres);
console.log(`gen-postgres-schema: wrote ${out}`);
