// npm run guides — check every file in data/brand-guides/ and compile the verified
// body guides into src/lib/brandGuides.generated.json (Session 103). Exits 1 on any
// invalid file, naming it and the field. Rules: todo/people/09-brand-size-guides.md.
import { readdirSync, readFileSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = join(root, "data/brand-guides");
const out = join(root, "src/lib/brandGuides.generated.json");

// The schema lives in TypeScript (one copy, shared with the app): bundle it with the
// esbuild that Vite already installs, into a temporary CommonJS file, and load that.
const require = createRequire(import.meta.url);
const { buildSync } = require("esbuild");
const tmp = join(tmpdir(), `brand-guides-${process.pid}.cjs`);
buildSync({ entryPoints: [join(root, "src/lib/brandGuides.ts")], bundle: true, platform: "node", format: "cjs", outfile: tmp, logLevel: "error" });
const { GuideFile, compile } = require(tmp);
rmSync(tmp, { force: true });

// Files starting with "_" are examples, never data.
const files = readdirSync(dir).filter((f) => f.endsWith(".json") && !f.startsWith("_")).sort();
const ok = [];
let bad = 0;
for (const f of files) {
  let raw;
  try { raw = JSON.parse(readFileSync(join(dir, f), "utf8")); } catch (e) { console.error(`✗ ${f}: not JSON (${e.message})`); bad++; continue; }
  const p = GuideFile.safeParse(raw);
  if (!p.success) { console.error(`✗ ${f}: ${p.error.issues.map((i) => `${i.path.join(".") || "(file)"}: ${i.message}`).join("; ")}`); bad++; continue; }
  if (!existsSync(join(dir, p.data.screenshot))) { console.error(`✗ ${f}: screenshot ${p.data.screenshot} is missing`); bad++; continue; }
  ok.push(p.data);
}
const compiled = compile(ok);
writeFileSync(out, JSON.stringify(compiled, null, 2) + "\n");
const unverified = ok.filter((f) => !f.reviewed && !f.verifiedBy.length).length;
console.log(`${files.length} files · ${bad} invalid · ${unverified} waiting for review · ${compiled.length} counted (reviewed body guides)`);
process.exit(bad ? 1 : 0);
