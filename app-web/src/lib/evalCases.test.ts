// Real product pages, replayed inside `npm test`.
//
// Every evaluation case whose capture is COMMITTED (eval/captures/) and has human
// ground truth (eval/truth/) runs through the browser-assisted path here, offline,
// and must give the honest outcome: the right answer inside the acceptable sizes,
// or the right refusal. A parser change that breaks a real page fails the ordinary
// suite instead of waiting for the next evaluation run. See eval/README.md.
//
// Captures are committed gzipped (Session 103, `npm run captures:pack`). A case the
// system does not get right yet is allowed only as recorded in eval/replay-baseline.json
// (written by `npm run eval`): an honest outcome must stay honest, a known gap may not
// get worse, and anything new that is wrong fails.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { EVAL_DIR, loadCapture, loadCases, loadPersonas, loadTruth, personasFor, runS5, scoreRun } from "../../eval/lib";

const baselinePath = join(EVAL_DIR, "replay-baseline.json");
const baseline: Record<string, string> = existsSync(baselinePath) ? JSON.parse(readFileSync(baselinePath, "utf8")) : {};
const HONEST = ["right-answer", "right-refusal"];

const personas = loadPersonas();
const replayable = loadCases()
  .map((c) => ({ c, cap: loadCapture(c.id), truth: loadTruth(c.id) }))
  .filter((x) => x.cap?.committed && x.truth);

let savedKey: string | undefined;
beforeEach(() => {
  // Offline and deterministic: no network, no LLM.
  savedKey = process.env.ANTHROPIC_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
  vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("offline replay"); }));
});
afterEach(() => {
  vi.unstubAllGlobals();
  if (savedKey !== undefined) process.env.ANTHROPIC_API_KEY = savedKey;
});

describe("real pages, replayed through the extension path", () => {
  if (replayable.length === 0) {
    it.skip("no committed capture has ground truth yet — see eval/README.md", () => {});
    return;
  }
  for (const { c, cap, truth } of replayable) {
    it(`${c.id} gives the honest outcome`, async () => {
      const people = personasFor(c, personas);
      const run = await runS5(c, cap!.capture, people);
      const score = scoreRun(truth!, run, people);
      const known = baseline[c.id];
      if (known && !HONEST.includes(known)) {
        // A recorded gap: it may improve, never turn into a different wrong.
        expect([...HONEST, known], `${c.id}: was ${known}, now ${score.outcome}`).toContain(score.outcome);
        return;
      }
      expect(score.recommendation?.wrong ?? [], `${c.id} answered outside the retailer's chart`).toEqual([]);
      expect(HONEST, `${c.id}: ${score.outcome} (if this is an accepted gap, run npm run eval to record it)`).toContain(score.outcome);
    });
  }
});
