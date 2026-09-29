// Regenerate the calibration table in docs/design/scoring-system.md from the
// registry. Run after changing any constant in src/lib/scoringConstants.ts:
//
//   node scripts/scoring-table.mjs        (from app-web/)
//
// It shells out to vitest because the registry is TypeScript.
// `scoringConstants.test.ts` fails if the table is missing a key or shows a
// value other than the current one, so forgetting to run this is caught.
import { execSync } from "node:child_process";
import { writeFileSync, readFileSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const probe = join(root, "src/lib/__scoring_table.test.ts");
const out = join(root, ".scoring-table.json");
writeFileSync(probe, `import { it } from "vitest"; import { writeFileSync } from "node:fs"; import * as R from "./scoringConstants";
it("t", () => { const val = (p: string) => p.split(".").reduce((o: any, k) => o?.[k], R as any);
  writeFileSync(${JSON.stringify(out)}, JSON.stringify(Object.entries(R.PROVENANCE).map(([k, v]) => ({ k, v: val(k), p: v.provenance, s: v.source })))); });`);
try { execSync(`npx vitest run ${probe}`, { cwd: root, stdio: "ignore" }); } finally { rmSync(probe, { force: true }); }
const rows = JSON.parse(readFileSync(out, "utf8")); rmSync(out, { force: true });
const count = (p) => rows.filter((r) => r.p === p).length;
const docPath = join(root, "..", "docs", "design", "scoring-system.md");
let doc = readFileSync(docPath, "utf8");
const head = doc.slice(0, doc.indexOf("| Constant | Value | Provenance | Source |"));
doc = head + "| Constant | Value | Provenance | Source |\n|---|---|---|---|\n" +
  rows.map((r) => `| \`${r.k}\` | ${JSON.stringify(r.v)} | ${r.p} | ${String(r.s).replace(/\|/g, "/")} |`).join("\n") + "\n";
doc = doc.replace(/(\| \*\*measured\*\* \|[^|]*\| \*\*)\d+(\*\* \|)/, `$1${count("measured")}$2`)
         .replace(/(\| \*\*cited\*\* \|[^|]*\| \*\*)\d+(\*\* \|)/, `$1${count("cited")}$2`)
         .replace(/(\| \*\*assumed\*\* \|[^|]*\| \*\*)\d+(\*\* \|)/, `$1${count("assumed")}$2`)
         .replace(/\*\*Read the counts plainly\.\*\* \d+ of \d+ numbers/, `**Read the counts plainly.** ${count("assumed")} of ${rows.length} numbers`);
writeFileSync(docPath, doc);
console.log(`scoring-system.md: ${rows.length} constants (${count("assumed")} assumed, ${count("measured")} measured, ${count("cited")} cited)`);
