// Real product pages, replayed inside `npm test`.
//
// Every evaluation case whose capture is COMMITTED (eval/captures/) and has human
// ground truth (eval/truth/) runs through the browser-assisted path here, offline,
// and must give the honest outcome: the right answer inside the acceptable sizes,
// or the right refusal. A parser change that breaks a real page fails the ordinary
// suite instead of waiting for the next evaluation run. See eval/README.md.
//
// Until captures may be committed (an open decision), there is nothing to replay,
// and this says so rather than passing silently.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadCapture, loadCases, loadPersonas, loadTruth, personasFor, runS5, scoreRun } from "../../eval/lib";

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
      expect(score.recommendation?.wrong ?? [], `${c.id} answered outside the retailer's chart`).toEqual([]);
      expect(["right-answer", "right-refusal"]).toContain(score.outcome);
    });
  }
});
