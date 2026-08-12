// Generate the PRODUCTION (Postgres) Prisma schema from the local (SQLite) one.
//
// Why: Prisma's `datasource.provider` must be a string literal — it cannot read
// an env var — so a single schema file can't serve both SQLite locally and
// Postgres in production. Rather than hand-maintain two files (guaranteed drift),
// we keep ONE source of truth (`prisma/schema.prisma`) and mechanically derive
// the Postgres copy here. Every model in this app uses only portable scalar types
// (String/Int/Float/Boolean/DateTime), so swapping the provider is sufficient.
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

const postgres = banner + schema.replace(/provider\s*=\s*"sqlite"/, 'provider = "postgresql"');

writeFileSync(out, postgres);
console.log(`gen-postgres-schema: wrote ${out}`);
