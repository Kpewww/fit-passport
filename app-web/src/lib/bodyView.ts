// What /body ("my 3D body", Session 98 phase 3) shows, decided without a DOM.
//
//   - BODY_TONES: the body's colour. The mannequin's own first; then measured human
//     skin (skinHex), by number and undertone, never named after people.
//   - bodyReadiness: what the passport holds, what it unlocks, what is still missing.
//     Height and weight are enough for a first, rough body; each girth after that
//     makes it the wearer's own.
//   - fitLink / readFitLink: /check hands one size's per-part fit to /body in the
//     URL, so nothing about a check has to be stored to show it again.

import { FORM_COLOUR, type Verdict, type Zone, type ZoneKey } from "./fitMapColours";

/**
 * Skin as people actually measure (Session 98g). The Monk swatches used before are
 * design colours: MST 3 is L* 93, where measured skin sits near L* 58-65, so as a
 * surface colour under physical light they came out washed out, and the founder found
 * them unreal ("the East Asian skin is not right either").
 *
 * Measured, by spectrophotometer, in CIELAB:
 *   - Xiao et al. 2017, Skin Res Technol 23:21-29, Table 2 (960 people, 4 sites):
 *     means L* 58.0-60.5, a* 9.0-9.8, b* 14.6-17.9;
 *   - Everett, Budescu & Sommers 2012, Clin Nurs Res 21:495, Table 1 (237 women,
 *     forearm): L* 65.0 / 59.5 / 47.3 (SD 7.7), a* 7.1-9.4, b* 17.4-20.1.
 * Redness hardly differs between people (a* about 9); lightness and yellowness do. So:
 * six lightness steps over the measured range (L* 70 to 33), and three undertones that
 * move a* and b* within the measured spread. Named by number and undertone only.
 */
export const SKIN_LIGHTNESS = [70, 63, 56, 49, 41, 33] as const;
export const UNDERTONES = { pink: { da: 1.2, db: -3 }, neutral: { da: 0, db: 0 }, yellow: { da: -0.8, db: 2.8 } } as const;
export type Undertone = keyof typeof UNDERTONES;

/** CIELAB (D65) to an sRGB hex. */
export function labToHex(L: number, a: number, b: number): string {
  const fy = (L + 16) / 116, fx = fy + a / 500, fz = fy - b / 200;
  const inv = (t: number) => (t ** 3 > 0.008856 ? t ** 3 : (t - 16 / 116) / 7.787);
  const X = 0.95047 * inv(fx), Y = inv(fy), Z = 1.08883 * inv(fz);
  const lin = [3.2406 * X - 1.5372 * Y - 0.4986 * Z, -0.9689 * X + 1.8758 * Y + 0.0415 * Z, 0.0557 * X - 0.204 * Y + 1.057 * Z];
  return "#" + lin.map((c) => {
    const v = Math.max(0, Math.min(1, c));
    return Math.round((v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055) * 255).toString(16).padStart(2, "0");
  }).join("");
}

/** A skin colour: lightness step 1 (lightest) to 6, in an undertone. Yellowness rises a
 *  little as skin darkens, as both studies found (b* 17 at L* 65 to about 20 at 47). */
export function skinHex(step: number, undertone: Undertone): string {
  const L = SKIN_LIGHTNESS[Math.max(1, Math.min(6, step)) - 1];
  const u = UNDERTONES[undertone];
  return labToHex(L, 9 + u.da, 17 + (65 - L) * 0.1 + u.db);
}

export const BODY_TONES = [
  { id: "form", hex: FORM_COLOUR },
  ...SKIN_LIGHTNESS.map((_, i) => ({ id: `skin${i + 1}` as const, hex: skinHex(i + 1, "neutral") })),
] as const;
export type ToneId = "form" | `skin${1 | 2 | 3 | 4 | 5 | 6}`;

/** The colour drawn for a tone choice and an undertone. */
export function toneHex(tone: ToneId, undertone: Undertone): string {
  return tone === "form" ? FORM_COLOUR : skinHex(Number(tone.slice(4)), undertone);
}

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
 * phenotype (annyBody.ts CUP_LOCAL, baked by tools/anny/bake.py). Anny itself reaches
 * about 12-26 cm.
 */
export const CUPS = {
  A: [12, 14], B: [14, 16], C: [16, 18], D: [18, 20], E: [20, 22], F: [22, 24],
  // Beyond Anny's own range (about 26 cm), reached by extrapolating its cup change
  // (annyBody CUP_MAX), as Anny's extrapolate_phenotypes allows (Session 98f).
  G: [24, 26], H: [26, 28], I: [28, 30], J: [30, 32],
} as const;
export type Cup = keyof typeof CUPS;
