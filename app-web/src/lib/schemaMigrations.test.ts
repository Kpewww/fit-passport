// Guard: every column in schema.prisma must exist in the committed migrations.
//
// WHY THIS EXISTS. On 2026-08-25 three columns were added to schema.prisma and
// only `npm run db:push` was run — which touches the LOCAL SQLite file. Production
// applies committed migrations with `prisma migrate deploy`, so Postgres never got
// the columns while the generated client happily queried them. Every endpoint
// reading User or KnownGoodItem returned 500 in production, and the passport page
// sat forever on its loading state.
//
// Nothing caught it: typecheck passed, all 237 tests passed, the production build
// succeeded, and the local smoke test was green — because local SQLite HAD the
// columns. The failure only existed in the gap between the two databases, which is
// precisely the gap no other check looks at.
//
// This test closes that gap with no database of any kind: it reads the schema and
// the migration SQL as text and compares the columns they describe. It is not a
// substitute for the migration procedure in docs/DEPLOYMENT.md — it is the alarm
// that goes off when someone forgets it.

import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const PRISMA_DIR = join(process.cwd(), "prisma");
const MIGRATIONS_DIR = join(PRISMA_DIR, "migrations");

// Prisma scalar types map to columns. Anything else in a model block is a
// relation (its type is another model), and relations are not columns — their
// foreign keys are declared as their own scalar fields.
const SCALARS = new Set([
  "String", "Int", "Float", "Boolean", "DateTime", "BigInt", "Decimal", "Bytes", "Json",
]);

/** model name -> column names, read from the Prisma schema. */
function columnsFromSchema(schemaPath: string): Map<string, Set<string>> {
  const text = readFileSync(schemaPath, "utf8");
  const out = new Map<string, Set<string>>();

  const modelRe = /^model\s+(\w+)\s*\{([\s\S]*?)^\}/gm;
  let m: RegExpExecArray | null;
  while ((m = modelRe.exec(text)) !== null) {
    const [, model, body] = m;
    const cols = new Set<string>();
    for (const rawLine of body.split("\n")) {
      const line = rawLine.trim();
      if (!line || line.startsWith("//") || line.startsWith("///") || line.startsWith("@@")) continue;
      const f = /^(\w+)\s+(\w+)(\[\])?/.exec(line);
      if (!f) continue;
      const [, field, type, isList] = f;
      if (isList) continue; // a list is a relation, never a column here
      if (!SCALARS.has(type)) continue; // a model type is a relation
      cols.add(field);
    }
    out.set(model, cols);
  }
  return out;
}

/** table name -> column names, read from every committed migration's SQL. */
function columnsFromMigrations(dir: string): Map<string, Set<string>> {
  const out = new Map<string, Set<string>>();
  const add = (table: string, col: string) => {
    if (!out.has(table)) out.set(table, new Set());
    out.get(table)!.add(col);
  };

  const files = readdirSync(dir)
    .filter((n) => statSync(join(dir, n)).isDirectory())
    .sort() // lexical sort == chronological, given the timestamp prefixes
    .map((n) => join(dir, n, "migration.sql"));

  for (const file of files) {
    let sql: string;
    try {
      sql = readFileSync(file, "utf8");
    } catch {
      continue; // a directory without migration.sql isn't a migration
    }

    // CREATE TABLE "X" ( ... );  — take the quoted identifier at the start of
    // each line inside the parens as a column.
    const createRe = /CREATE TABLE\s+"(\w+)"\s*\(([\s\S]*?)\n\);/g;
    let c: RegExpExecArray | null;
    while ((c = createRe.exec(sql)) !== null) {
      const [, table, body] = c;
      for (const rawLine of body.split("\n")) {
        const line = rawLine.trim();
        const col = /^"(\w+)"\s+\w/.exec(line);
        if (col) add(table, col[1]);
      }
    }

    // ALTER TABLE "X" ADD COLUMN "y" ...
    const alterRe = /ALTER TABLE\s+"(\w+)"\s+ADD COLUMN\s+"(\w+)"/g;
    let a: RegExpExecArray | null;
    while ((a = alterRe.exec(sql)) !== null) add(a[1], a[2]);

    // ALTER TABLE "X" DROP COLUMN "y" — honour removals so the comparison
    // reflects the end state rather than everything ever mentioned.
    const dropRe = /ALTER TABLE\s+"(\w+)"\s+DROP COLUMN\s+"(\w+)"/g;
    let d: RegExpExecArray | null;
    while ((d = dropRe.exec(sql)) !== null) out.get(d[1])?.delete(d[2]);
  }
  return out;
}

describe("schema and migrations agree", () => {
  const schema = columnsFromSchema(join(PRISMA_DIR, "schema.prisma"));
  const migrated = columnsFromMigrations(MIGRATIONS_DIR);

  it("parses something from both sides (the test itself must not silently pass)", () => {
    // A regex that quietly matches nothing would make every assertion below
    // vacuously true, which is worse than no test at all.
    expect(schema.size).toBeGreaterThan(10);
    expect(migrated.size).toBeGreaterThan(10);
    expect(schema.get("User")?.size ?? 0).toBeGreaterThan(5);
    expect(migrated.get("User")?.size ?? 0).toBeGreaterThan(5);
  });

  it("has a migration for every model", () => {
    const missing = [...schema.keys()].filter((m) => !migrated.has(m));
    expect(missing, `models with no CREATE TABLE in prisma/migrations: ${missing.join(", ")}`).toEqual([]);
  });

  it("has a migration for every column", () => {
    // THE ONE THAT MATTERS. If this fails, the schema was changed without running
    // the additive-migration recipe in docs/DEPLOYMENT.md §1 — local SQLite has
    // the column and production Postgres does not, and production will 500 on
    // every query touching the table.
    const missing: string[] = [];
    for (const [model, cols] of schema) {
      const have = migrated.get(model);
      if (!have) continue; // reported by the test above
      for (const col of cols) if (!have.has(col)) missing.push(`${model}.${col}`);
    }
    expect(
      missing,
      `columns in schema.prisma with no migration: ${missing.join(", ")}\n` +
        `Run the additive-migration recipe in docs/DEPLOYMENT.md §1 — db:push alone ` +
        `only updates local SQLite, and production applies committed migrations.`,
    ).toEqual([]);
  });

  it("keeps the connector lock file, which migrate deploy needs", () => {
    // Its absence cost a deploy once (Session 41): `prisma migrate deploy` reads
    // the connector from here and aborts without it.
    const lock = readFileSync(join(MIGRATIONS_DIR, "migration_lock.toml"), "utf8");
    expect(lock).toContain("postgresql");
  });
});
