// Runs the Sprint 5 evaluation and writes results/<date>.json and .md.
//
//   npm run eval                # B and S5, offline and reproducible
//   EVAL_LIVE=1 npm run eval    # also A — contacts each retailer once per case
//
// A vitest file only so it can import the product's TypeScript as-is; it has its
// own config (vitest.eval.config.ts) and never runs inside `npm test`.

import { describe, it } from "vitest";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  EVAL_DIR,
  loadCapture,
  loadCases,
  loadPersonas,
  loadTruth,
  personasFor,
  runA,
  runB,
  runS5,
  scoreRun,
  type CaseScore,
  type SystemName,
  type SystemRun,
} from "./lib";

type Row = {
  id: string;
  url: string;
  retailer: string;
  capture: { committed: boolean; capturedAt: string; stats: Record<string, number | string> } | null;
  truth: { verifiedBy: string[]; readOn: string; outcome: string } | null;
  runs: ReturnType<typeof summarise>[];
  scores: Partial<Record<SystemName, CaseScore>> | null;
};

function summarise(r: SystemRun) {
  const s = r.source ?? {};
  return {
    system: r.system,
    outcome: r.outcome,
    refusal: r.refusal,
    error: r.error,
    source: {
      sizesFrom: s.sizesFrom,
      fetch: s.fetch,
      extractedBy: s.extractedBy,
      measurementKind: s.measurementKind,
      measurementKindFrom: s.measurementKindFrom,
      sizesSynthesized: s.sizesSynthesized,
      categoryGuessed: s.categoryGuessed,
    },
    sizes: (r.sizes ?? []).map((z) => ({
      label: z.label,
      chestCm: z.chestCm,
      bodyChestMinCm: z.bodyChestMinCm,
      bodyChestMaxCm: z.bodyChestMaxCm,
    })),
    picks: r.picks,
    ms: r.ms,
  };
}

const hasMeasurement = (z: { chestCm?: number | null; bodyChestMinCm?: number | null }) =>
  z.chestCm != null || z.bodyChestMinCm != null;

function aggregate(rows: Row[]) {
  const systems: SystemName[] = ["A-server", "B-brand-chart", "S5-extension"];
  const out: Record<string, unknown> = {};
  for (const sys of systems) {
    const runs = rows.map((r) => r.runs.find((x) => x.system === sys)).filter((x): x is NonNullable<typeof x> => !!x);
    if (!runs.length) continue;
    const scored = rows.map((r) => r.scores?.[sys]).filter((x): x is CaseScore => !!x);
    const count = (f: (s: CaseScore) => boolean) => scored.filter(f).length;
    const readers: Record<string, number> = {};
    for (const r of runs) if (r.source.extractedBy) readers[r.source.extractedBy] = (readers[r.source.extractedBy] ?? 0) + 1;
    const values = scored.reduce((a, s) => ({ c: a.c + (s.values?.compared ?? 0), w: a.w + (s.values?.within ?? 0) }), { c: 0, w: 0 });
    const recs = scored.reduce((a, s) => ({ n: a.n + (s.recommendation?.scored ?? 0), ok: a.ok + (s.recommendation?.right ?? 0) }), { n: 0, ok: 0 });
    out[sys] = {
      cases: runs.length,
      answered: runs.filter((r) => r.outcome === "answer").length,
      refused: runs.filter((r) => r.outcome === "refuse").length,
      errors: runs.filter((r) => r.outcome === "error").length,
      pageObtained:
        sys === "A-server" ? runs.filter((r) => r.source.fetch === "ok").length
        : sys === "S5-extension" ? runs.filter((r) => r.source.fetch === "extension").length
        : 0,
      pageChart: runs.filter((r) => r.source.sizesFrom === "page").length,
      usableChart: runs.filter((r) => r.outcome === "answer" && r.sizes.filter(hasMeasurement).length >= 2).length,
      readers,
      withTruth: scored.length,
      outcomes: {
        rightAnswer: count((s) => s.outcome === "right-answer"),
        rightRefusal: count((s) => s.outcome === "right-refusal"),
        wrongAnswer: count((s) => s.outcome === "wrong-answer"),
        wrongRefusal: count((s) => s.outcome === "wrong-refusal"),
      },
      labelsExact: count((s) => s.labelsExact === true),
      valuesWithinTolerance: values,
      kindRight: count((s) => s.kindRight === true),
      recommendation: recs,
      provenanceRight: count((s) => s.provenanceRight === true),
    };
  }
  return out;
}

function cell(run: ReturnType<typeof summarise> | undefined, personaIds: string[]): string {
  if (!run) return "—";
  if (run.outcome === "error") return `error`;
  if (run.outcome === "refuse") return `refuse: ${run.refusal}`;
  const s = run.source;
  const picks = personaIds.map((id) => run.picks[id]).filter(Boolean).map((p) => (p.undetermined ? "?" : p.label));
  const kind = s.measurementKind ? `${s.measurementKind}/${s.measurementKindFrom}` : "unstated";
  return `${picks.join(" ")} · ${s.sizesFrom}${s.extractedBy ? ":" + s.extractedBy : ""} · ${kind}`;
}

function markdown(date: string, live: boolean, rows: Row[], summary: Record<string, unknown>): string {
  const lines: string[] = [];
  lines.push(`# Sprint 5 evaluation — ${date}`, "");
  lines.push(
    `Systems: B (curated chart only), S5 (browser-assisted)${live ? ", A (server URL path, live)" : ""}. ` +
      `${rows.length} cases · ${rows.filter((r) => r.capture).length} with a capture · ` +
      `${rows.filter((r) => r.truth).length} with ground truth.`,
    "",
    "Picks are listed for the case's personas in order (men 92/100/108 cm, women 84/92/100 cm); `?` = undetermined.",
    "",
  );
  lines.push(`| case | capture | truth | B | S5${live ? " | A" : ""} |`, `|---|---|---|---|---${live ? "|---" : ""}|`);
  for (const r of rows) {
    // Persona ids from whichever system answered — not only from the first run,
    // which left a refused-by-B, answered-by-S5 case (Uniqlo) with no picks shown.
    const ids = Object.keys(r.runs.find((x) => Object.keys(x.picks).length)?.picks ?? {});
    const cap = r.capture
      ? `${r.capture.stats.tablesKept}/${r.capture.stats.tablesSeen} tables · ${Math.round(Number(r.capture.stats.payloadChars) / 1024)} of ${Math.round(Number(r.capture.stats.domChars) / 1024)} KB`
      : "none";
    const truth = r.truth ? r.truth.outcome : "pending";
    const by = (sys: SystemName) => cell(r.runs.find((x) => x.system === sys), ids);
    lines.push(`| ${r.id} | ${cap} | ${truth} | ${by("B-brand-chart")} | ${by("S5-extension")}${live ? ` | ${by("A-server")}` : ""} |`);
  }
  lines.push("", "## Summary", "", "```json", JSON.stringify(summary, null, 2), "```", "");
  return lines.join("\n");
}

describe("Sprint 5 evaluation", () => {
  it("runs every case through the systems and writes the results", async () => {
    const live = process.env.EVAL_LIVE === "1";
    const personas = loadPersonas();
    const rows: Row[] = [];
    for (const c of loadCases()) {
      const people = personasFor(c, personas);
      const cap = loadCapture(c.id);
      const truth = loadTruth(c.id);
      const runs: SystemRun[] = [runB(c, people)];
      if (cap) runs.push(await runS5(c, cap.capture, people));
      if (live) runs.push(await runA(c, people));
      const scores = truth
        ? (Object.fromEntries(runs.map((r) => [r.system, scoreRun(truth, r, people)])) as Partial<Record<SystemName, CaseScore>>)
        : null;
      rows.push({
        id: c.id,
        url: c.url,
        retailer: c.retailer,
        capture: cap ? { committed: cap.committed, capturedAt: cap.capture.capturedAt, stats: cap.capture.stats } : null,
        truth: truth ? { verifiedBy: truth.verifiedBy, readOn: truth.readOn, outcome: truth.outcome } : null,
        runs: runs.map(summarise),
        scores,
      });
    }
    const summary = aggregate(rows);
    const date = new Date().toISOString().slice(0, 10);
    const dir = join(EVAL_DIR, "results");
    mkdirSync(dir, { recursive: true });
    const stem = join(dir, `${date}${live ? "-live" : ""}`);
    writeFileSync(`${stem}.json`, JSON.stringify({ date, live, personas, summary, rows }, null, 2) + "\n");
    writeFileSync(`${stem}.md`, markdown(date, live, rows, summary));
    console.log(markdown(date, live, rows, summary));
  }, 900_000);
});
