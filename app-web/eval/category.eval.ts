// Calibrating the category classifier's confidence threshold (Session 85d).
//
// Asks the real classifier (TypeSafe Jev, via lib/categoryModel.ts) about every
// name in category-names.json and reports, for each threshold, how many names
// would be answered and how many of those answers are right. The threshold to
// adopt is the lowest one whose answers are right at least TARGET of the time.
//
// Needs TYPESAFE_API_KEY, read from app-web/.env.local (git-ignored) or the
// environment. Without it the run is skipped. The key is never printed or saved;
// the results file holds names, answers and confidences only.
//
//   npx vitest run --config vitest.eval.config.ts eval/category.eval.ts

import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { classifyCategory, CATEGORY_CHOICES } from "../src/lib/categoryModel";

const HERE = __dirname;
const TARGET = 0.95;

function keyFromEnvLocal(): string | undefined {
  if (process.env.TYPESAFE_API_KEY) return process.env.TYPESAFE_API_KEY;
  const f = join(HERE, "..", ".env.local");
  if (!existsSync(f)) return undefined;
  const m = readFileSync(f, "utf8").match(/^TYPESAFE_API_KEY\s*=\s*"?([^"\r\n]+)"?\s*$/m);
  return m?.[1];
}

type Row = { name: string; category: string; set: "easy" | "hard" };
const { names } = JSON.parse(readFileSync(join(HERE, "category-names.json"), "utf8")) as { names: Row[] };
const key = keyFromEnvLocal();

describe("category classifier calibration", () => {
  it.skipIf(!key)("answers by confidence, and the threshold that keeps answers right", async () => {
    const answers: Array<Row & { got: string | null; confidence: number | null; note: string }> = [];
    for (const row of names) {
      let note = "";
      await classifyCategory({ name: row.name }, { TYPESAFE_API_KEY: key }, (w) => { note = w; });
      const m = /^jev: (\S+) ([\d.]+)$/.exec(note);
      answers.push({ ...row, got: m ? m[1] : null, confidence: m ? Number(m[2]) : null, note: m ? "" : note });
    }

    // "unclear" names have no right answer: any confident garment is wrong for them.
    const right = (a: (typeof answers)[number]) => a.category !== "unclear" && a.got === a.category;
    const thresholds = Array.from({ length: 13 }, (_, i) => Math.round((0.3 + i * 0.05) * 100) / 100);
    const table = thresholds.map((t) => {
      const answered = answers.filter((a) => a.confidence != null && a.confidence >= t);
      const ok = answered.filter(right).length;
      return { threshold: t, answered: answered.length, ofAll: answers.length, accuracy: answered.length ? ok / answered.length : null };
    });
    const pick = table.find((r) => r.accuracy != null && r.accuracy >= TARGET && r.answered > 0) ?? null;

    const out = {
      runAt: new Date().toISOString(),
      model: "jev-latest",
      n: answers.length,
      target: TARGET,
      choices: Object.keys(CATEGORY_CHOICES),
      table,
      recommended: pick?.threshold ?? null,
      wrong: answers.filter((a) => a.confidence != null && !right(a)).map(({ name, category, got, confidence }) => ({ name, expected: category, got, confidence })),
      failed: answers.filter((a) => a.confidence == null).map(({ name, note }) => ({ name, note })),
    };
    const file = join(HERE, "results", `category-calibration-${out.runAt.slice(0, 10)}.json`);
    writeFileSync(file, JSON.stringify(out, null, 2) + "\n");
    console.log(table.map((r) => `${r.threshold.toFixed(2)}  answered ${r.answered}/${r.ofAll}  accuracy ${r.accuracy == null ? "—" : (100 * r.accuracy).toFixed(1) + "%"}`).join("\n"));
    console.log(`recommended threshold (≥ ${TARGET * 100}% right): ${out.recommended}`);
    console.log(`wrong: ${out.wrong.length}, failed: ${out.failed.length} → ${file}`);
    expect(out.failed.length).toBeLessThan(names.length);
  });
});
