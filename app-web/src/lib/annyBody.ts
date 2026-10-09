// A realistic body fitted to the wearer's measurements — Session 97, Track 2.
//
// The body is NAVER's Anny (Apache 2.0; MakeHuman-derived assets CC0), baked offline
// by tools/anny/bake.py into public/anny/body.bin.gz: corner meshes at the gender,
// muscle and weight anchors (Anny's shape is multilinear between them, so blending
// them is exact) and the linear deltas of its "measure" local changes. Here those are
// blended for this wearer and the girths fitted to theirs:
//
//   1. gender from the sex they gave (Anny: 0 male, 1 female; 0.5 when not given);
//      weight from BMI — a stated mapping (BMI_TO_WEIGHT), not a survey; muscle 0.5;
//   2. the stature scaled to theirs (Anny's own height is fixed at its middle);
//   3. chest, waist and hip girth and shoulder breadth fitted by moving the matching
//      measure changes, measured the way a tape is: the convex hull of a horizontal
//      slice through the body (our own slicing — MakeHuman's ruler vertex lists are
//      AGPL and are not copied).
//
// What cannot be fitted within Anny's range stays off, and says by how much: every
// fit returns its residual per measurement, and the page prints it.
//
// Pure: no three.js, no DOM; tested in Node against the baked file.

import { landmarkFraction, type BodyMeasurementsInput } from "./bodyMesh";
import { REGION, type BodyGeometryData, type ZoneKey } from "./fitMapColours";

export type AnnyMeta = {
  vertexCount: number;
  faceCount: number;
  unitPerCm: number;
  layout: { indices: [number, number]; regions: [number, number]; corners: [number, number]; locals: [number, number] };
  anchors: { gender: number[]; muscle: number[]; weight: number[] };
  corners: Array<{ gender: number; muscle: number; weight: number }>;
  locals: string[];
  /** The ellipsoid head: [first, count] of its vertices and of its faces (the last of each). */
  headEllipsoid?: { vertices: [number, number]; faces: [number, number] };
};

export type AnnyData = {
  meta: AnnyMeta;
  indices: Uint16Array;
  regions: Uint8Array;
  /** Corner meshes, cm, in `meta.corners` order. */
  corners: Float32Array[];
  /** Per local change: [incr delta, decr delta], cm. */
  locals: Array<[Float32Array, Float32Array]>;
};

/** Read the baked file. */
export function parseAnny(buffer: ArrayBuffer, meta: AnnyMeta): AnnyData {
  const n = meta.vertexCount * 3;
  const toCm = (offset: number, count: number) => {
    const raw = new Int16Array(buffer, offset, count);
    const out = new Float32Array(count);
    for (let i = 0; i < count; i++) out[i] = raw[i] / meta.unitPerCm;
    return out;
  };
  const [io, ic] = meta.layout.indices;
  const [ro, rc] = meta.layout.regions;
  const [co, cc] = meta.layout.corners;
  const [lo, lc] = meta.layout.locals;
  return {
    meta,
    indices: new Uint16Array(buffer, io, ic),
    regions: new Uint8Array(buffer, ro, rc),
    corners: Array.from({ length: cc }, (_, k) => toCm(co + k * n * 2, n)),
    locals: Array.from({ length: lc }, (_, k) => [toCm(lo + (2 * k) * n * 2, n), toCm(lo + (2 * k + 1) * n * 2, n)] as [Float32Array, Float32Array]),
  };
}

/** Hat weights of a value over sorted anchors (Anny's linear interpolation). */
function hat(value: number, anchors: number[]): number[] {
  const v = Math.min(anchors[anchors.length - 1], Math.max(anchors[0], value));
  return anchors.map((a, i) => {
    const prev = anchors[i - 1];
    const next = anchors[i + 1];
    if (v === a) return 1;
    if (prev != null && v > prev && v < a) return (v - prev) / (a - prev);
    if (next != null && v > a && v < next) return (next - v) / (next - a);
    return 0;
  });
}

export type Phenotype = { gender: number; muscle: number; weight: number };

/** The body at a phenotype: the corners blended multilinearly. */
export function blendCorners(data: AnnyData, p: Phenotype): Float32Array {
  const { anchors, corners } = data.meta;
  const hg = hat(p.gender, anchors.gender);
  const hm = hat(p.muscle, anchors.muscle);
  const hw = hat(p.weight, anchors.weight);
  const out = new Float32Array(data.meta.vertexCount * 3);
  corners.forEach((c, k) => {
    const w = hg[anchors.gender.indexOf(c.gender)] * hm[anchors.muscle.indexOf(c.muscle)] * hw[anchors.weight.indexOf(c.weight)];
    if (w === 0) return;
    const mesh = data.corners[k];
    for (let i = 0; i < out.length; i++) out[i] += w * mesh[i];
  });
  return out;
}

function withLocals(base: Float32Array, data: AnnyData, weights: number[]): Float32Array {
  const out = base.slice();
  weights.forEach((w, k) => {
    if (w === 0) return;
    const d = w > 0 ? data.locals[k][0] : data.locals[k][1];
    const a = Math.abs(w);
    for (let i = 0; i < out.length; i++) out[i] += a * d[i];
  });
  return out;
}

// ---- measuring, the way a tape does ----

function hullPerimeter(pts: Array<[number, number]>): number {
  if (pts.length < 3) return 0;
  const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: number[], a: number[], b: number[]) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: number[][] = [];
  for (const q of p) { while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], q) <= 0) lower.pop(); lower.push(q); }
  const upper: number[][] = [];
  for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], q) <= 0) upper.pop(); upper.push(q); }
  const hull = lower.slice(0, -1).concat(upper.slice(0, -1));
  let per = 0;
  for (let i = 0; i < hull.length; i++) {
    const a = hull[i], b = hull[(i + 1) % hull.length];
    per += Math.hypot(b[0] - a[0], b[1] - a[1]);
  }
  return per;
}

/** The tape girth at height y over the triangles whose vertices are all in `keep`. */
export function girthAt(pos: Float32Array, indices: Uint16Array, regions: Uint8Array, y: number, keep: number[]): number {
  const pts: Array<[number, number]> = [];
  for (let t = 0; t < indices.length; t += 3) {
    const v = [indices[t], indices[t + 1], indices[t + 2]];
    if (!v.every((i) => keep.includes(regions[i]))) continue;
    for (let e = 0; e < 3; e++) {
      const a = v[e], b = v[(e + 1) % 3];
      const ya = pos[a * 3 + 1], yb = pos[b * 3 + 1];
      if ((ya - y) * (yb - y) > 0 || ya === yb) continue;
      const s = (y - ya) / (yb - ya);
      pts.push([pos[a * 3] + s * (pos[b * 3] - pos[a * 3]), pos[a * 3 + 2] + s * (pos[b * 3 + 2] - pos[a * 3 + 2])]);
    }
  }
  return hullPerimeter(pts);
}

function extentY(pos: Float32Array): [number, number] {
  let lo = Infinity, hi = -Infinity;
  for (let i = 1; i < pos.length; i += 3) { lo = Math.min(lo, pos[i]); hi = Math.max(hi, pos[i]); }
  return [lo, hi];
}

/** Shoulder breadth: the body's widest reach within a band at shoulder height. */
function shoulderBreadth(pos: Float32Array, regions: Uint8Array, y: number): number {
  // Torso and arm: the top of the shoulder is the deltoid, which Anny skins to the arm.
  let lo = Infinity, hi = -Infinity;
  for (let v = 0; v < regions.length; v++) {
    if ((regions[v] !== REGION.torso && regions[v] !== REGION.arm) || Math.abs(pos[v * 3 + 1] - y) > 2) continue;
    lo = Math.min(lo, pos[v * 3]); hi = Math.max(hi, pos[v * 3]);
  }
  return hi > lo ? hi - lo : 0;
}

// ---- the fit ----

/**
 * BMI to Anny's weight phenotype. ⚠ A stated mapping, not a measurement: Anny's
 * "weight" is a relative slider, so its middle is placed at a BMI of 22 and its ends
 * at 17 and 32. The girths are fitted afterwards, so this only chooses the starting
 * shape — the residuals say how well the end result matches.
 */
export const BMI_TO_WEIGHT: Array<[number, number]> = [[17, 0], [22, 0.5], [32, 1]];

function weightFromBmi(bmi: number | null): number {
  if (bmi == null) return 0.5;
  const [a, b, c] = BMI_TO_WEIGHT;
  if (bmi <= a[0]) return 0;
  if (bmi >= c[0]) return 1;
  return bmi < b[0] ? ((bmi - a[0]) / (b[0] - a[0])) * 0.5 : 0.5 + ((bmi - b[0]) / (c[0] - b[0])) * 0.5;
}

type Target = { key: "chest" | "waist" | "hip" | "shoulder"; cm: number };

/**
 * Which local changes move each measurement, in order: the measure change first, and
 * when it runs out of Anny's range (±1), the next. A woman's bust past the measure
 * change's reach, or a waist past it, keeps going instead of stopping short.
 */
export const FIT_CHAINS: Record<Target["key"], string[]> = {
  chest: ["measure-bust-circ-incr", "measure-underbust-circ-incr", "breast-volume-vert-up"],
  waist: ["measure-waist-circ-incr", "stomach-pregnant-incr"],
  hip: ["measure-hips-circ-incr", "hip-scale-horiz-incr"],
  shoulder: ["measure-shoulder-dist-incr", "torso-vshape-incr"],
};

export type AnnyFit = {
  body: BodyGeometryData;
  /** Measured minus asked, cm, for every measurement given. */
  residuals: Partial<Record<"chest" | "waist" | "hip" | "shoulder" | "height", number>>;
  phenotype: Phenotype;
  localWeights: Record<string, number>;
};

export function fitAnny(data: AnnyData, m: BodyMeasurementsInput & { weightKg?: number | null }): AnnyFit {
  const sex = m.sex ?? null;
  const stature = m.heightCm ?? 170;
  const bmi = m.weightKg != null && m.heightCm != null ? m.weightKg / (m.heightCm / 100) ** 2 : null;
  const phenotype: Phenotype = { gender: sex === "male" ? 0 : sex === "female" ? 1 : 0.5, muscle: 0.5, weight: weightFromBmi(bmi) };
  const base = blendCorners(data, phenotype);
  const [y0, y1] = extentY(base);
  const scale = stature / (y1 - y0);
  const level = (key: "chest" | "waist" | "hip" | "shoulder") => y0 + (y1 - y0) * landmarkFraction(key, sex);

  const targets: Target[] = [];
  if (m.chestCm != null) targets.push({ key: "chest", cm: m.chestCm });
  if (m.waistCm != null) targets.push({ key: "waist", cm: m.waistCm });
  if (m.hipCm != null) targets.push({ key: "hip", cm: m.hipCm });
  if (m.shoulderCm != null) targets.push({ key: "shoulder", cm: m.shoulderCm });

  const weights = data.meta.locals.map(() => 0);
  const measure = (pos: Float32Array, key: Target["key"]) => {
    const y = level(key);
    if (key === "shoulder") return shoulderBreadth(pos, data.regions, y) * scale;
    // Hips include the tops of the thighs, as a tape round the seat does.
    const keep = key === "hip" ? [REGION.torso, REGION.leg] : [REGION.torso];
    return girthAt(pos, data.indices, data.regions, y, keep) * scale;
  };

  // One Newton step per measurement per round, on the first change in its chain that
  // still has room to move in the needed direction.
  for (let round = 0; round < 6; round++) {
    for (const t of targets) {
      const g0 = measure(withLocals(base, data, weights), t.key);
      if (Math.abs(g0 - t.cm) < 0.05) continue;
      for (const local of FIT_CHAINS[t.key]) {
        const k = data.meta.locals.indexOf(local);
        if (k < 0) continue;
        const step = weights[k] > 0.9 ? -0.1 : 0.1;
        const trial = weights.slice(); trial[k] += step;
        const slope = (measure(withLocals(base, data, trial), t.key) - g0) / step;
        if (Math.abs(slope) < 1e-6) continue;
        const want = weights[k] + (t.cm - g0) / slope;
        const moved = Math.max(-1, Math.min(1, want));
        if (moved === weights[k]) continue; // already at its limit that way: the next change
        weights[k] = moved;
        break;
      }
    }
  }

  const fitted = withLocals(base, data, weights);
  const residuals: AnnyFit["residuals"] = {};
  for (const t of targets) residuals[t.key] = Math.round((measure(fitted, t.key) - t.cm) * 10) / 10;

  // Feet on the ground, in the wearer's centimetres.
  const out = new Float32Array(fitted.length);
  for (let i = 0; i < fitted.length; i += 3) {
    out[i] = fitted[i] * scale;
    out[i + 1] = (fitted[i + 1] - y0) * scale;
    out[i + 2] = fitted[i + 2] * scale;
  }
  if (m.heightCm != null) residuals.height = 0;
  const landmarks: Partial<Record<ZoneKey, number>> = {};
  for (const key of ["chest", "waist", "hip", "shoulder"] as const) landmarks[key] = (level(key) - y0) * scale;

  const localWeights: Record<string, number> = {};
  data.meta.locals.forEach((l, k) => { if (weights[k] !== 0) localWeights[l] = Math.round(weights[k] * 1000) / 1000; });
  return {
    body: { positions: out, indices: data.indices, regions: data.regions, landmarks },
    residuals,
    phenotype,
    localWeights,
  };
}

/**
 * The girths of a fitted body, measured the way the fit measures them (Session 98):
 * how the dress form is drawn when the passport has a height and a weight but no
 * girths. ⚠ An estimate from Anny's average shape for that height, weight and sex,
 * for DRAWING only. It is never stored and never reaches the engine (invariant 98).
 */
export function estimateGirths(data: AnnyData, fit: AnnyFit): { chestCm: number; waistCm: number; hipCm: number; shoulderCm: number } {
  const pos = fit.body.positions;
  const at = (key: "chest" | "waist" | "hip") =>
    Math.round(girthAt(pos, data.indices, data.regions, fit.body.landmarks[key]!, key === "hip" ? [REGION.torso, REGION.leg] : [REGION.torso]) * 10) / 10;
  return {
    chestCm: at("chest"),
    waistCm: at("waist"),
    hipCm: at("hip"),
    shoulderCm: Math.round(shoulderBreadth(pos, data.regions, fit.body.landmarks.shoulder!) * 10) / 10,
  };
}

/** A baked file's bytes, gunzipped when they arrive gzipped. Vercel serves a .gz as
 *  it is, but a proxy may already have inflated it; the magic number decides. */
export async function inflate(buffer: ArrayBuffer): Promise<ArrayBuffer> {
  const head = new Uint8Array(buffer, 0, Math.min(2, buffer.byteLength));
  if (head[0] !== 0x1f || head[1] !== 0x8b) return buffer;
  const stream = new Blob([buffer]).stream().pipeThrough(new DecompressionStream("gzip"));
  return new Response(stream).arrayBuffer();
}

/** The body, fetched and parsed: what /body and /lab/body load. */
export async function loadAnny(): Promise<AnnyData> {
  const [meta, bin] = await Promise.all([
    fetch("/anny/body.json").then((r) => r.json() as Promise<AnnyMeta>),
    fetch("/anny/body.bin.gz").then((r) => r.arrayBuffer()).then(inflate),
  ]);
  return parseAnny(bin, meta);
}
