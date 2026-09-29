// Sprint 5 evaluation harness — runs each case through the three systems and
// scores them against human ground truth. See eval/README.md for the method.
//
// Everything here reuses the product's own code: the same extractor, parser,
// refusal policy, engine input and engine. The harness adds only the loading
// and the scoring, so a number in the results is a number the product produces.

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { extractSmart } from "../src/lib/extractorLLM";
import { extractFromUrl, type ExtractedProduct, type ExtractedSize } from "../src/lib/extractor";
import { applyProvenanceCap, refusalFor } from "../src/lib/checkPolicy";
import { recommend } from "../src/lib/fitEngine";
import { engineSizes } from "../src/lib/engineInput";
import { normalizeToAlpha } from "../src/lib/sizing";
import { CONFIDENCE_CAPS, EVAL, STABILITY } from "../src/lib/scoringConstants";

export const EVAL_DIR = dirname(fileURLToPath(import.meta.url));
const CM_PER_INCH = 2.54;
/** Half an inch, the printing precision of an inch chart, in cm. */
export const VALUE_TOLERANCE_CM = 1.3;

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------

/**
 * A garment in an eval persona's closet. The garment chest is given relative to
 * the persona's chest, so the same closet means the same thing on every body.
 */
export type ClosetItem = {
  brand: string;
  category: string;
  size: string;
  fitDirection: number;
  garmentOverChestCm: number;
};

/**
 * An ADVERSARIAL persona is not scored for accuracy — there is no right size for a
 * body that doesn't exist. It is checked for BEHAVIOUR the product promises
 * (scoring-system.md §9): input that cannot be true is detected, capped, and
 * named, never presented with ordinary confidence. These are properties of our
 * own output, not a claim about the truth (invariant 66).
 */
export type Adversarial = "absurd-body" | "contradictory-closet";

export type Persona = {
  id: string;
  sex: "male" | "female";
  chestCm: number;
  waistCm: number;
  shoulderCm: number;
  preferredFit: "regular";
  closet?: ClosetItem[];
  adversarial?: Adversarial;
};

export type Case = {
  id: string;
  url: string;
  retailer: string;
  category: string;
  gender: "mens" | "womens" | "unisex";
  capture: string;
  notes?: string;
};

export type TruthSize = {
  label: string;
  chestMin?: number;
  chestMax?: number;
  chest?: number;
  chestFlat?: number;
};

export type Truth = {
  id: string;
  verifiedBy: string[];
  readOn: string;
  outcome: "answer" | "refuse";
  refusal?: string | null;
  chart?: {
    where: "page-table" | "page-image" | "separate-page" | "none";
    kind: "body" | "garment" | "unstated";
    kindEvidence?: string;
    units: "in" | "cm";
    sizes: TruthSize[];
  };
};

export type Capture = {
  url: string;
  capturedAt: string;
  extensionVersion: string;
  /** false from the automated capture; null when a person captured it and confirms. */
  loggedIn: boolean | null;
  capturedBy?: string;
  html: string;
  stats: Record<string, number | string>;
};

const readJson = <T>(p: string): T => JSON.parse(readFileSync(p, "utf8")) as T;

export function loadPersonas(): Persona[] {
  return readJson<{ personas: Persona[] }>(join(EVAL_DIR, "personas.json")).personas;
}

export function loadCases(): Case[] {
  const dir = join(EVAL_DIR, "cases");
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => readJson<Case>(join(dir, f)));
}

/** Committed capture first, then the git-ignored local one. */
export function loadCapture(id: string): { capture: Capture; committed: boolean } | null {
  const committed = join(EVAL_DIR, "captures", `${id}.capture.json`);
  if (existsSync(committed)) return { capture: readJson<Capture>(committed), committed: true };
  const local = join(EVAL_DIR, "local", "captures", `${id}.capture.json`);
  if (existsSync(local)) return { capture: readJson<Capture>(local), committed: false };
  return null;
}

export function loadTruth(id: string): Truth | null {
  const p = join(EVAL_DIR, "truth", `${id}.json`);
  return existsSync(p) ? readJson<Truth>(p) : null;
}

// ---------------------------------------------------------------------------
// Systems
// ---------------------------------------------------------------------------

export type SystemName = "A-server" | "B-brand-chart" | "S5-extension";

export type Pick = {
  label: string;
  confidence: number;
  undetermined: boolean;
  verdict?: string;
  /** Share of the perturbation grid that keeps this pick (stability.ts). */
  agreement?: number | null;
  holdsForChestCm?: [number, number] | null;
  conflictNote?: string | null;
  /** For a persona with a closet: the same check with the closet emptied. */
  emptyClosetConfidence?: number;
};

export type SystemRun = {
  system: SystemName;
  outcome: "answer" | "refuse" | "error";
  refusal?: string;
  source?: Partial<ExtractedProduct["source"]>;
  sizes?: ExtractedSize[];
  picks: Record<string, Pick>;
  ms: number;
  error?: string;
};

export function personasFor(c: Case, all: Persona[]): Persona[] {
  if (c.gender === "mens") return all.filter((p) => p.sex === "male");
  if (c.gender === "womens") return all.filter((p) => p.sex === "female");
  return all;
}

/** Refuse, or recommend for every persona — exactly as /api/check decides. */
function decide(system: SystemName, extracted: ExtractedProduct, personas: Persona[], started: number): SystemRun {
  const refusal = refusalFor(extracted);
  const base = {
    system,
    source: extracted.source,
    sizes: extracted.sizes,
    ms: Date.now() - started,
  };
  if (refusal) return { ...base, outcome: "refuse", refusal: refusal.error, picks: {} };
  const picks: Record<string, Pick> = {};
  for (const p of personas) {
    const run = (withCloset: boolean) => recommend({
      profile: { chestCm: p.chestCm, waistCm: p.waistCm, shoulderCm: p.shoulderCm, preferredFit: p.preferredFit },
      product: { brand: extracted.brand, category: extracted.category },
      sizes: engineSizes(extracted.sizes),
      knownGood: (withCloset ? p.closet ?? [] : []).map((k) => ({
        brand: k.brand,
        category: k.category,
        size: k.size,
        fitRating: 3,
        fitDirection: k.fitDirection,
        garmentChestCm: p.chestCm + k.garmentOverChestCm,
        // As if added by link with the retailer's garment chart — the only closet
        // numbers the ease learner trusts (personalEase TRUSTED_PROVENANCE). Any other
        // label and the reports are silently skipped, which the guardrail would miss.
        garmentMeasuredFrom: "page",
      })),
      outcomes: [],
    });
    const result = applyProvenanceCap(run(true), extracted.source.sizesFrom);
    picks[p.id] = {
      label: result.best.label,
      confidence: result.best.confidence,
      undetermined: result.undetermined,
      verdict: result.best.verdict,
      agreement: result.stability?.agreement ?? null,
      holdsForChestCm: result.stability?.holdsForChestCm ?? null,
      conflictNote: result.conflictNote,
      ...(p.closet?.length
        ? { emptyClosetConfidence: applyProvenanceCap(run(false), extracted.source.sizesFrom).best.confidence }
        : {}),
    };
  }
  return { ...base, outcome: "answer", picks };
}

export async function runS5(c: Case, capture: Capture, personas: Persona[]): Promise<SystemRun> {
  const started = Date.now();
  try {
    const extracted = await extractSmart(capture.url || c.url, { html: capture.html });
    return decide("S5-extension", extracted, personas, started);
  } catch (e) {
    return { system: "S5-extension", outcome: "error", error: String(e), picks: {}, ms: Date.now() - started };
  }
}

export function runB(c: Case, personas: Persona[]): SystemRun {
  const started = Date.now();
  const extracted = extractFromUrl(c.url);
  // B is the world where our server never got the page: the curated chart or a
  // refusal. Marking the fetch as not obtained is what makes ㊼ refuse the
  // synthesized ladder here, as production does for a blocked retailer.
  extracted.source.fetch = "blocked";
  return decide("B-brand-chart", extracted, personas, started);
}

export async function runA(c: Case, personas: Persona[]): Promise<SystemRun> {
  const started = Date.now();
  try {
    const extracted = await extractSmart(c.url);
    return decide("A-server", extracted, personas, started);
  } catch (e) {
    return { system: "A-server", outcome: "error", error: String(e), picks: {}, ms: Date.now() - started };
  }
}

// ---------------------------------------------------------------------------
// Scoring against truth
// ---------------------------------------------------------------------------

const toCm = (v: number, units: "in" | "cm") => (units === "in" ? v * CM_PER_INCH : v);
const labelKey = (l: string) => (normalizeToAlpha(l) ?? l.trim().toUpperCase());

/**
 * The sizes the retailer's own chart says fit this wearer — body charts only.
 * The stated range that contains the chest; in a gap, both neighbours. Null for a
 * garment chart (no retailer rule; see README) or a chart with no ranges.
 */
export function acceptableSizes(truth: Truth, chestCm: number): string[] | null {
  const chart = truth.chart;
  if (!chart || chart.kind !== "body") return null;
  const ranged = chart.sizes
    .filter((s) => s.chestMin != null && s.chestMax != null)
    .map((s) => ({ label: s.label, lo: toCm(s.chestMin!, chart.units), hi: toCm(s.chestMax!, chart.units) }));
  if (ranged.length < 2) return null;
  const inside = ranged.filter((s) => chestCm >= s.lo - 0.05 && chestCm <= s.hi + 0.05).map((s) => s.label);
  if (inside.length) return inside;
  const below = ranged.filter((s) => s.hi < chestCm).pop();
  const above = ranged.find((s) => s.lo > chestCm);
  return [below?.label, above?.label].filter((l): l is string => !!l);
}

export type CaseScore = {
  outcome: "right-answer" | "right-refusal" | "wrong-answer" | "wrong-refusal";
  labelsExact?: boolean;
  labelsJaccard?: number;
  values?: { compared: number; within: number };
  kindRight?: boolean;
  recommendation?: {
    scored: number;
    right: number;
    wrong: string[];
    /** One entry per scored pick — the input to Brier and the confidently-wrong rate. */
    graded: Array<{ persona: string; confidence: number; right: boolean }>;
  };
  provenanceRight?: boolean;
};

export function scoreRun(truth: Truth, run: SystemRun, personas: Persona[]): CaseScore {
  const chart = truth.chart;
  const answered = run.outcome === "answer";
  let outcome: CaseScore["outcome"];
  if (truth.outcome === "refuse") outcome = answered ? "wrong-answer" : "right-refusal";
  else outcome = answered ? "right-answer" : "wrong-refusal";

  const score: CaseScore = { outcome };
  // An answer built on the synthesized ladder is a wrong answer whatever label it
  // lands on: those measurements came from no page at all (invariants ㊼, (59)).
  // Baseline A does this on a readable page with no chart — the BRAND_TABLE
  // question the founder still has open.
  if (answered && run.source?.sizesSynthesized) score.outcome = "wrong-answer";
  if (!answered || !chart || !run.sizes) return score;

  // Labels.
  const got = new Set(run.sizes.map((s) => labelKey(s.label)));
  const want = new Set(chart.sizes.map((s) => labelKey(s.label)));
  const inter = [...got].filter((l) => want.has(l)).length;
  const union = new Set([...got, ...want]).size;
  score.labelsJaccard = union ? inter / union : 0;
  score.labelsExact = inter === got.size && inter === want.size;

  // Values: ranges at both ends, single values directly, flat widths doubled.
  let compared = 0;
  let within = 0;
  for (const t of chart.sizes) {
    const s = run.sizes.find((x) => labelKey(x.label) === labelKey(t.label));
    if (!s) continue;
    const close = (a: number | undefined, b: number) => {
      compared++;
      if (a != null && Math.abs(a - b) <= VALUE_TOLERANCE_CM) within++;
    };
    if (t.chestMin != null && t.chestMax != null) {
      close(s.bodyChestMinCm, toCm(t.chestMin, chart.units));
      close(s.bodyChestMaxCm, toCm(t.chestMax, chart.units));
    } else if (t.chest != null) {
      // A single printed value: a garment chest, or a body point the parser banded.
      const v = toCm(t.chest, chart.units);
      if (chart.kind === "body") {
        compared++;
        if (s.bodyChestMinCm != null && s.bodyChestMaxCm != null && v >= s.bodyChestMinCm - 0.05 && v <= s.bodyChestMaxCm + 0.05) within++;
      } else close(s.chestCm, v);
    } else if (t.chestFlat != null) {
      close(s.chestCm, 2 * toCm(t.chestFlat, chart.units));
    }
  }
  score.values = { compared, within };

  // Body vs garment.
  const gotKind = run.source?.measurementKind ?? "unstated";
  score.kindRight = gotKind === chart.kind;

  // Recommendation, body charts only.
  const rec = { scored: 0, right: 0, wrong: [] as string[], graded: [] as Array<{ persona: string; confidence: number; right: boolean }> };
  for (const p of personas) {
    if (p.adversarial) continue; // checked by guardrails(), never scored for accuracy
    const ok = acceptableSizes(truth, p.chestCm);
    const pick = run.picks[p.id];
    if (!ok || !pick || pick.undetermined) continue;
    rec.scored++;
    const right = ok.map(labelKey).includes(labelKey(pick.label));
    rec.graded.push({ persona: p.id, confidence: pick.confidence, right });
    if (right) rec.right++;
    else rec.wrong.push(`${p.id}: ${pick.label} (acceptable ${ok.join("/")})`);
  }
  score.recommendation = rec;
  if (rec.wrong.length) score.outcome = "wrong-answer";

  // Provenance: a page chart credited to the page, and nothing else claiming it.
  const from = run.source?.sizesFrom;
  score.provenanceRight =
    chart.where === "page-table" || chart.where === "page-image"
      ? run.system === "B-brand-chart" ? from !== "page" : from === "page" || from === "brand-chart"
      : from !== "page";
  if (run.system === "S5-extension" && run.source?.fetch !== "extension") score.provenanceRight = false;

  return score;
}

// ---------------------------------------------------------------------------
// Behaviour checks that need no truth
// ---------------------------------------------------------------------------

export type GuardrailResult = { persona: string; check: string; passed: boolean; detail: string };

/**
 * What the product promises for input that cannot be true (scoring-system.md
 * §9.1). Checked on every answered case, with or without ground truth, because
 * none is needed: these are statements about our own output.
 */
export function guardrails(run: SystemRun, personas: Persona[]): GuardrailResult[] {
  if (run.outcome !== "answer") return [];
  const out: GuardrailResult[] = [];
  for (const p of personas) {
    const pick = run.picks[p.id];
    if (!p.adversarial || !pick) continue;
    const note = pick.conflictNote ?? "";
    if (p.adversarial === "absurd-body") {
      const capped = pick.confidence <= CONFIDENCE_CAPS.implausibleBody + 1e-9;
      const named = note.includes("look unusual together");
      out.push({
        persona: p.id,
        check: "absurd body is capped and named",
        passed: capped && named,
        detail: `confidence ${pick.confidence} (cap ${CONFIDENCE_CAPS.implausibleBody})${named ? "" : "; explanation does not name the measurements"}`,
      });
    } else {
      // Saying so is not enough: the number must not treat the reports as evidence
      // either. This check first passed on the message alone while confidence rose
      // 46% → 75% (Session 78f).
      const named = note.includes("contradict each other");
      const base = pick.emptyClosetConfidence;
      const noGain = base != null && pick.confidence <= base + 1e-9;
      out.push({
        persona: p.id,
        check: "contradictory closet is not learned from, adds no confidence, and says so",
        passed: named && noGain,
        detail:
          `confidence ${pick.confidence} vs ${base ?? "?"} with an empty closet` +
          (named ? "" : "; no contradiction in the explanation"),
      });
    }
  }
  return out;
}

/** Stability of every answered, determined pick for ordinary personas. */
export function stabilityOf(run: SystemRun, personas: Persona[]): Array<{ persona: string; agreement: number }> {
  if (run.outcome !== "answer") return [];
  return personas
    .filter((p) => !p.adversarial)
    .map((p) => ({ persona: p.id, pick: run.picks[p.id] }))
    .filter((x) => x.pick && !x.pick.undetermined && x.pick.agreement != null)
    .map((x) => ({ persona: x.persona, agreement: x.pick!.agreement! }));
}

/**
 * Calibration over graded picks. Reported with its n and null at n = 0 — a score
 * computed from nothing is not a score. Two numbers, both threshold-free:
 *   • Brier = mean (confidence − right)², 0 is perfect, 0.25 is a constant 50%;
 *   • gap   = mean confidence − hit rate, positive = over-confident.
 * Plus the headline guardrail: wrong picks shown above EVAL.confidentAbove.
 */
export function calibration(graded: Array<{ confidence: number; right: boolean }>) {
  const n = graded.length;
  const wrong = graded.filter((g) => !g.right);
  const confidentlyWrong = wrong.filter((g) => g.confidence > EVAL.confidentAbove).length;
  if (!n) return { n, brier: null, meanConfidence: null, hitRate: null, gap: null, confidentlyWrong: { count: 0, of: 0, above: EVAL.confidentAbove } };
  const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  const r3 = (x: number) => Math.round(x * 1000) / 1000;
  const meanConfidence = mean(graded.map((g) => g.confidence));
  const hitRate = graded.filter((g) => g.right).length / n;
  return {
    n,
    brier: r3(mean(graded.map((g) => (g.confidence - (g.right ? 1 : 0)) ** 2))),
    meanConfidence: r3(meanConfidence),
    hitRate: r3(hitRate),
    gap: r3(meanConfidence - hitRate),
    confidentlyWrong: { count: confidentlyWrong, of: n, above: EVAL.confidentAbove },
  };
}

export const FRAGILE_BELOW = STABILITY.fragileBelow;
