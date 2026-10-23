// The Vercel build (Session 103). `npm run vercel-build` runs this.
//
// Production: generate the Postgres client, apply migrations, build — as before.
// Preview (any other branch): generate and build only. Migrations never run from
// a preview: a branch must not change the production database, and Preview has
// no DIRECT_URL, which `prisma migrate deploy` needs (PR #2's previews failed on
// exactly that, Prisma P1012). A preview build still proves the code compiles.

import { execSync } from "node:child_process";

const run = (cmd, env = process.env) => execSync(cmd, { stdio: "inherit", env });
const env = process.env.VERCEL_ENV ?? "development";

// The derived schema names DIRECT_URL; `generate` only needs it to parse.
const genEnv = { ...process.env, DIRECT_URL: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "postgresql://preview:preview@localhost:5432/preview" };
run("npm run db:pg:generate", genEnv);

if (env === "production") {
  run("npx prisma migrate deploy --schema prisma/schema.postgres.prisma");
} else {
  console.log(`[vercel-build] ${env}: migrations run only in production; skipped.`);
}

run("npx next build");
