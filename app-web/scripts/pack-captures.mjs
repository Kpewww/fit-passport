// npm run captures:pack — gzip the evaluation captures into the repo (Session 103).
//
// The founder decided the captures are committed (todo/decisions/01, closed): anyone
// can then re-run the benchmark, and npm test replays them (src/lib/evalCases.test.ts).
// Reads eval/local/captures/<id>.capture.json (git-ignored) and writes
// eval/captures/<id>.capture.json.gz. A capture taken while logged in is refused:
// only logged-out pages go in the repo.
import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const from = join(root, "eval/local/captures");
const to = join(root, "eval/captures");
if (!existsSync(from)) { console.error(`nothing to pack: ${from} does not exist`); process.exit(1); }
mkdirSync(to, { recursive: true });
let packed = 0, refused = 0;
for (const f of readdirSync(from).filter((f) => f.endsWith(".capture.json")).sort()) {
  const raw = readFileSync(join(from, f));
  const cap = JSON.parse(raw.toString("utf8"));
  if (cap.loggedIn === true) { console.error(`✗ ${f}: taken while logged in, not packed`); refused++; continue; }
  const gz = gzipSync(raw, { level: 9 });
  writeFileSync(join(to, `${f}.gz`), gz);
  console.log(`✓ ${f}: ${(raw.length / 1024).toFixed(1)} KB → ${(gz.length / 1024).toFixed(1)} KB`);
  packed++;
}
console.log(`${packed} packed, ${refused} refused (logged in)`);
