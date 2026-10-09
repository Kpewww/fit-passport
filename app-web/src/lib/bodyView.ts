// What /body ("my 3D body", Session 98 phase 3) shows, decided without a DOM.
//
//   - BODY_TONES: the body's colour. The mannequin's own first; then the ten tones of
//     the Monk Skin Tone Scale, numbered as the scale numbers them, never named after
//     people (no ancestry is implied by any of them).
//   - bodyReadiness: what the passport holds, what it unlocks, what is still missing.
//     Height and weight are enough for a first, rough body; each girth after that
//     makes it the wearer's own.
//   - fitLink / readFitLink: /check hands one size's per-part fit to /body in the
//     URL, so nothing about a check has to be stored to show it again.

import { FORM_COLOUR, type Verdict, type Zone, type ZoneKey } from "./fitMapColours";

export const BODY_TONES = [
  { id: "form", hex: FORM_COLOUR },
  // The Monk Skin Tone Scale's ten swatches, 1 (lightest) to 10 (darkest): Dr. Ellis
  // Monk with Google, released under CC BY 4.0 (skintone.google; the values as listed
  // on Wikipedia's "Monk Skin Tone Scale", which cites Google's MST swatches page,
  // fetched 2026-10-09). The founder asked for real human skin tones (Session 98d).
  { id: "mst1", hex: "#f6ede4" },
  { id: "mst2", hex: "#f3e7db" },
  { id: "mst3", hex: "#f7ead0" },
  { id: "mst4", hex: "#eadaba" },
  { id: "mst5", hex: "#d7bd96" },
  { id: "mst6", hex: "#a07e56" },
  { id: "mst7", hex: "#825c43" },
  { id: "mst8", hex: "#604134" },
  { id: "mst9", hex: "#3a312a" },
  { id: "mst10", hex: "#292420" },
] as const;
export type ToneId = (typeof BODY_TONES)[number]["id"];

export type BodyFacts = {
  heightCm?: number | null;
  weightKg?: number | null;
  sex?: string | null;
  chestCm?: number | null;
  waistCm?: number | null;
  hipCm?: number | null;
  shoulderCm?: number | null;
};

export const READINESS_ITEMS = ["heightCm", "weightKg", "sex", "chestCm", "waistCm", "hipCm", "shoulderCm"] as const;
export type ReadinessItem = (typeof READINESS_ITEMS)[number];
const GIRTHS = ["chestCm", "waistCm", "hipCm", "shoulderCm"] as const;

export type Readiness = {
  /** locked: not enough to draw; rough: height and weight only; own: some girths; full: all of them. */
  level: "locked" | "rough" | "own" | "full";
  done: ReadinessItem[];
  missing: ReadinessItem[];
  /** What is still needed before anything can be drawn. */
  toUnlock: ReadinessItem[];
  /** Girths not given: the dress form estimates these from the realistic body. */
  girthsMissing: Array<(typeof GIRTHS)[number]>;
};

export function bodyReadiness(f: BodyFacts): Readiness {
  const has = (k: ReadinessItem) => (k === "sex" ? f.sex === "male" || f.sex === "female" : f[k] != null && (f[k] as number) > 0);
  const done = READINESS_ITEMS.filter(has);
  const missing = READINESS_ITEMS.filter((k) => !has(k));
  const toUnlock = (["heightCm", "weightKg"] as const).filter((k) => !has(k));
  const girthsMissing = GIRTHS.filter((k) => !has(k));
  const level = toUnlock.length ? "locked" : girthsMissing.length === GIRTHS.length ? "rough" : girthsMissing.length ? "own" : "full";
  return { level, done, missing, toUnlock, girthsMissing };
}

// ---- the link from /check ----

const CODE: Record<Verdict, string> = { "too small": "xs", snug: "s", "true to size": "t", relaxed: "r", "too big": "xb" };
const VERDICT = Object.fromEntries(Object.entries(CODE).map(([v, c]) => [c, v])) as Record<string, Verdict>;
const KEYS: ZoneKey[] = ["chest", "waist", "shoulder", "hip"];

export type FitView = { size: string; item: string | null; zones: Zone[] };

/** /body with one size's fit: `z=chest.s.-2.1,waist.t.0.3`, plus the size and the item's name. */
export function fitLink(v: FitView): string {
  const p = new URLSearchParams();
  p.set("size", v.size.slice(0, 20));
  if (v.item) p.set("item", v.item.slice(0, 80));
  p.set("z", v.zones.map((z) => `${z.key}.${CODE[z.verdict]}.${Math.round(z.deltaCm * 10) / 10}`).join(","));
  return `/body?${p.toString()}`;
}

/** The fit a link carries, or null; anything malformed is dropped, not trusted. */
export function readFitLink(params: URLSearchParams): FitView | null {
  const size = params.get("size")?.slice(0, 20);
  const raw = params.get("z");
  if (!size || !raw) return null;
  const zones: Zone[] = [];
  for (const part of raw.split(",").slice(0, 8)) {
    const [key, code, d] = part.split(".");
    const delta = Number(part.slice(key.length + code.length + 2));
    if (!KEYS.includes(key as ZoneKey) || !VERDICT[code] || !d || !Number.isFinite(delta) || Math.abs(delta) > 60) continue;
    if (zones.some((z) => z.key === key)) continue;
    zones.push({ key: key as ZoneKey, verdict: VERDICT[code], deltaCm: delta });
  }
  return zones.length ? { size, item: params.get("item")?.slice(0, 80) ?? null, zones } : null;
}

/**
 * Cup sizes by EN 13402: the cup is the bust girth minus the underbust girth, in 2 cm
 * steps (AA 10-12 cm, A 12-14 … ; lower bound exclusive). Source: EN 13402 as tabled by
 * mobilefish.com's EN 13402 pictogram help (fetched 2026-10-09). A chosen cup is fitted
 * to the middle of its range, on a woman's body only, through Anny's own cupsize
 * phenotype (annyBody.ts CUP_LOCAL, baked by tools/anny/bake.py). Anny reaches about
 * 12-26 cm.
 */
export const CUPS = { A: [12, 14], B: [14, 16], C: [16, 18], D: [18, 20], E: [20, 22], F: [22, 24] } as const;
export type Cup = keyof typeof CUPS;
