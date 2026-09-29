// Runs the Sprint 5 evaluation and writes results/<date>.json and .md.
//
//   npm run eval                # B and S5, offline and reproducible
//   EVAL_LIVE=1 npm run eval    # also A — contacts each retailer once per case
//
// A vitest file only so it can import the product's TypeScript as-is; it has its
// own config (vitest.eval.config.ts) and never runs inside `npm test`.

import { describe, it } from "vitest";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  EVAL_DIR,
  FRAGILE_BELOW,
  calibration,
  guardrails,
  stabilityOf,
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
  type GuardrailResult,
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
  /** Needs no truth: behaviour on adversarial personas, per system. */
  guardrails: Partial<Record<SystemName, GuardrailResult[]>>;
  /** Needs no truth: how firmly each ordinary pick holds, per system. */
  stability: Partial<Record<SystemName, Array<{ persona: string; agreement: number }>>>;
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
      // Threshold-free calibration of graded picks; null at n = 0, never a made-up score.
      calibration: calibration(scored.flatMap((s) => s.recommendation?.graded ?? [])),
      stability: (() => {
        const all = rows.flatMap((r) => r.stability[sys] ?? []);
        const mean = all.length ? Math.round((all.reduce((a, x) => a + x.agreement, 0) / all.length) * 1000) / 1000 : null;
        return {
          picks: all.length,
          meanAgreement: mean,
          fragile: all.filter((x) => x.agreement < FRAGILE_BELOW).length,
          fragileBelow: FRAGILE_BELOW,
        };
      })(),
      guardrails: (() => {
        const all = rows.flatMap((r) => r.guardrails[sys] ?? []);
        return {
          checks: all.length,
          passed: all.filter((g) => g.passed).length,
          failures: all.filter((g) => !g.passed).map((g) => `${g.persona}: ${g.check} — ${g.detail}`),
        };
      })(),
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
    "Picks are listed for the case's personas in order (men 92/100/108 cm, women 84/92/100 cm, then the adversarial personas); `?` = undetermined.",
    "Adversarial personas are never scored for accuracy — only checked for the promised behaviour (guardrails below).",
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
  lines.push(
    "",
    "## Robustness and calibration",
    "",
    "| system | stable picks | fragile | guardrails | graded | Brier | conf − hit rate | confidently wrong |",
    "|---|---|---|---|---|---|---|---|",
  );
  for (const [sys, v] of Object.entries(summary) as Array<[string, any]>) {
    const c = v.calibration;
    const st = v.stability;
    lines.push(
      `| ${sys} | ${st.picks} (mean agreement ${st.meanAgreement ?? "—"}) | ${st.fragile} below ${st.fragileBelow} | ` +
        `${v.guardrails.passed}/${v.guardrails.checks} | ${c.n} | ${c.brier ?? "— (n = 0)"} | ${c.gap ?? "—"} | ` +
        `${c.confidentlyWrong.count} of ${c.n} above ${c.confidentlyWrong.above} |`,
    );
  }
  lines.push(
    "",
    "Brier and calibration need ground truth (`eval/truth/`); until two people have read each chart, they are `n = 0` by design — the harness never grades against its own output (invariant 66).",
  );
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
        guardrails: Object.fromEntries(runs.map((r) => [r.system, guardrails(r, people)])),
        stability: Object.fromEntries(runs.map((r) => [r.system, stabilityOf(r, people)])),
      });
    }
    const summary = aggregate(rows);
    const date = new Date().toISOString().slice(0, 10);
    const dir = join(EVAL_DIR, "results");
    mkdirSync(dir, { recursive: true });
    // Never overwrite a results file: a dated result is a record, and a second run
    // on the same day (it happened in Session 78) replaced a committed one.
    const base = join(dir, `${date}${live ? "-live" : ""}`);
    let stem = base;
    for (let k = 2; existsSync(`${stem}.json`) || existsSync(`${stem}.md`); k++) stem = `${base}-run${k}`;
    writeFileSync(`${stem}.json`, JSON.stringify({ date, live, personas, summary, rows }, null, 2) + "\n");
    writeFileSync(`${stem}.md`, markdown(date, live, rows, summary));
    console.log(markdown(date, live, rows, summary));
  }, 900_000);
});
