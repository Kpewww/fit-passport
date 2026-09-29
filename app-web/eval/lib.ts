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

export const EVAL_DIR = dirname(fileURLToPath(import.meta.url));
const CM_PER_INCH = 2.54;
/** Half an inch, the printing precision of an inch chart, in cm. */
export const VALUE_TOLERANCE_CM = 1.3;

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------

export type Persona = {
  id: string;
  sex: "male" | "female";
  chestCm: number;
  waistCm: number;
  shoulderCm: number;
  preferredFit: "regular";
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

export type Pick = { label: string; confidence: number; undetermined: boolean; verdict?: string };

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
    const raw = recommend({
      profile: { chestCm: p.chestCm, waistCm: p.waistCm, shoulderCm: p.shoulderCm, preferredFit: p.preferredFit },
      product: { brand: extracted.brand, category: extracted.category },
      sizes: engineSizes(extracted.sizes),
      knownGood: [],
      outcomes: [],
    });
    const result = applyProvenanceCap(raw, extracted.source.sizesFrom);
    picks[p.id] = {
      label: result.best.label,
      confidence: result.best.confidence,
      undetermined: result.undetermined,
      verdict: result.best.verdict,
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
  recommendation?: { scored: number; right: number; wrong: string[] };
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
  const rec = { scored: 0, right: 0, wrong: [] as string[] };
  for (const p of personas) {
    const ok = acceptableSizes(truth, p.chestCm);
    const pick = run.picks[p.id];
    if (!ok || !pick || pick.undetermined) continue;
    rec.scored++;
    if (ok.map(labelKey).includes(labelKey(pick.label))) rec.right++;
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
