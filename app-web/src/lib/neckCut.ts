// The headless body: the realistic body cut straight across the neck — Session 98d.
//
// The founder: offer a version with no head, the neck cut horizontally, as a dress
// form is, and (98f) leave a little neck, like a shop mannequin: see neckCutY. Triangles crossing it are clipped to it, and the opening is closed with a
// flat cap whose rim vertices are its own, so the edge stays sharp under lighting.
//
// Pure: no three.js, no DOM.

import { girthAt, type AnnyData } from "./annyBody";
import { ellipsoidOf, withoutEllipsoid } from "./annyHead";
import { REGION, type BodyGeometryData } from "./fitMapColours";

const RIM_TUCK_CM = 3;
const RIM_TUCK = 0.12;

/**
 * Height of the cut, in the body's space. The founder: leave a little neck, like a shop
 * mannequin (Session 98f). Measured on a 160 cm woman: going up from the shoulder line
 * the girth narrows over the trapezius from 71 to 30 cm in the lower 58% of
 * shoulder-to-jaw; the first cut (at 60%) sat at the neck's base and showed no neck,
 * the second (three quarters up the neck) caught the jaw. The cut is at the narrowest.
 */
export function neckCutY(body: BodyGeometryData, data: AnnyData): number {
  const range = data.meta.headEllipsoid?.vertices;
  if (!range || body.landmarks.shoulder == null) throw new Error("needs the head ellipsoid and a shoulder landmark");
  const { centre, axes } = ellipsoidOf(body.positions, range);
  const jaw = centre[1] - axes[1];
  const shoulder = body.landmarks.shoulder;
  const tri = withoutEllipsoid(data);
  const regions = body.regions ?? data.regions;
  const steps = 24;
  const girths: Array<[number, number]> = [];
  for (let i = 0; i <= steps; i++) {
    const y = shoulder + ((jaw - shoulder) * i) / steps;
    girths.push([y, girthAt(body.positions, tri, regions, y, [REGION.torso, REGION.head])]);
  }
  // The neck's narrowest point: a shop mannequin is cut there. Above it the girth
  // widens again into the jaw, and a cut higher up left a piece of chin on the
  // headless body (the founder, Session 98g).
  const valid = girths.filter(([, g]) => g > 0);
  const narrowest = valid.reduce((best, p) => (p[1] < best[1] ? p : best));
  return narrowest[0];
}

/** Clip triangles to one side of the plane y = level, keeping the winding; new vertices
 *  where edges cross it are appended to `pos` (and `regions`) and listed in `rim`. */
function clipAtPlane(
  pos: number[], regions: number[] | null, tri: ArrayLike<number>, level: number, keep: "below" | "above",
): { out: number[]; rim: number[] } {
  const out: number[] = [];
  const rim: number[] = [];
  const onEdge = new Map<string, number>();
  const gone = (i: number) => (keep === "below" ? pos[i * 3 + 1] > level : pos[i * 3 + 1] < level);
  const cross = (a: number, b: number) => {
    const key = a < b ? `${a}:${b}` : `${b}:${a}`;
    const had = onEdge.get(key);
    if (had != null) return had;
    const ya = pos[a * 3 + 1], yb = pos[b * 3 + 1];
    const s = (level - ya) / (yb - ya);
    const i = pos.length / 3;
    for (let k = 0; k < 3; k++) pos.push(pos[a * 3 + k] + s * (pos[b * 3 + k] - pos[a * 3 + k]));
    pos[i * 3 + 1] = level;
    regions?.push(REGION.head);
    onEdge.set(key, i);
    rim.push(i);
    return i;
  };
  for (let t = 0; t < tri.length; t += 3) {
    const v = [tri[t], tri[t + 1], tri[t + 2]];
    const off = v.map(gone);
    const n = off.filter(Boolean).length;
    if (n === 0) { out.push(...v); continue; }
    if (n === 3) continue;
    const poly: number[] = [];
    for (let e = 0; e < 3; e++) {
      const a = v[e], b = v[(e + 1) % 3];
      if (!off[e]) poly.push(a);
      if (off[e] !== off[(e + 1) % 3]) poly.push(cross(a, b));
    }
    for (let k = 1; k + 1 < poly.length; k++) out.push(poly[0], poly[k], poly[k + 1]);
  }
  return { out, rim };
}

export type NeckCut = BodyGeometryData & { cutY: number; rim: number[]; axis: [number, number] };

/**
 * The body cut at the neck, capped flat (the headless body), or with `cap: false` left
 * open for a face (joinFaceAtNeck).
 */
export function cutAtNeck(body: BodyGeometryData, data: AnnyData, opts: { cap?: boolean; at?: number } = {}): NeckCut {
  const y = opts.at ?? neckCutY(body, data);
  const pos: number[] = Array.from(body.positions);
  const regions: number[] = Array.from(body.regions ?? new Uint8Array(body.positions.length / 3));
  const { out, rim } = clipAtPlane(pos, regions, withoutEllipsoid(data), y, "below");
  let cx = 0, cz = 0;
  for (const i of rim) { cx += pos[i * 3]; cz += pos[i * 3 + 2]; }
  cx /= rim.length || 1; cz /= rim.length || 1;

  // The cap: the rim in order of angle round its centre, fanned, facing up, with its
  // own copies of the rim vertices so the edge stays sharp.
  if (opts.cap !== false && rim.length >= 3) {
    const ring = rim
      .map((i) => ({ i, a: Math.atan2(pos[i * 3 + 2] - cz, pos[i * 3] - cx) }))
      .sort((p, q) => p.a - q.a);
    const centre = pos.length / 3;
    pos.push(cx, y, cz); regions.push(REGION.head);
    const copy = ring.map(({ i }) => {
      const j = pos.length / 3;
      pos.push(pos[i * 3], y, pos[i * 3 + 2]); regions.push(REGION.head);
      return j;
    });
    for (let k = 0; k < copy.length; k++) {
      // Increasing angle in x-z runs clockwise seen from above, so (centre, b, a) faces +y.
      out.push(centre, copy[(k + 1) % copy.length], copy[k]);
    }
  }

  return {
    positions: new Float32Array(pos),
    indices: new Uint32Array(out),
    regions: new Uint8Array(regions),
    landmarks: body.landmarks,
    cutY: y,
    rim,
    axis: [cx, cz],
  };
}

/** A closed outline as radius by angle round an axis, interpolated (wrapping). */
function radiusByAngle(pos: ArrayLike<number>, ids: number[], cx: number, cz: number): (a: number) => number {
  const pts = ids
    .map((i) => ({ a: Math.atan2(pos[i * 3 + 2] - cz, pos[i * 3] - cx), r: Math.hypot(pos[i * 3] - cx, pos[i * 3 + 2] - cz) }))
    .sort((p, q) => p.a - q.a);
  return (a: number) => {
    if (!pts.length) return 0;
    let k = pts.findIndex((p) => p.a > a);
    if (k < 0) k = 0;
    const hi = pts[k], lo = pts[(k - 1 + pts.length) % pts.length];
    let span = hi.a - lo.a, at = a - lo.a;
    if (span <= 0) span += 2 * Math.PI;
    if (at < 0) at += 2 * Math.PI;
    return lo.r + (hi.r - lo.r) * Math.min(1, at / span);
  };
}

/** How far under a face's chin it is joined to the body, cm: the stub's level passes
 *  1-1.5 cm above the chin (measured, Session 98f) and would slice the jaw. */
export const JOIN_UNDER_CHIN_CM = 1.5;

/** The level a face is joined at: the stub's, or under its chin if that is lower. */
export function joinLevel(body: BodyGeometryData, data: AnnyData, chinY: number): number {
  return Math.min(neckCutY(body, data), chinY - JOIN_UNDER_CHIN_CM);
}

/** How far below the cut the body is eased onto the face's neck, cm. */
export const JOIN_BLEND_CM = 3;

/**
 * A face joined to the body at the neck (Session 98f). The founder saw a ring, then a
 * gap at the nape, where the face's neck and the body's overlapped: two meshes never
 * agree. So both are cut at the same level, and the body's rim is moved, angle by
 * angle round the neck, onto the face's rim; the body below eases into it over
 * JOIN_BLEND_CM. The surface is then continuous.
 */
export function joinFaceAtNeck(cut: NeckCut, face: { positions: Float32Array; indices: ArrayLike<number> }): {
  body: NeckCut; face: { positions: Float32Array; indices: Uint32Array };
} {
  const y = cut.cutY;
  const [cx, cz] = cut.axis;
  const fpos: number[] = Array.from(face.positions);
  const { out: ftri, rim: frim } = clipAtPlane(fpos, null, face.indices, y, "above");
  if (frim.length < 3 || cut.rim.length < 3) {
    return { body: cut, face: { positions: new Float32Array(fpos), indices: new Uint32Array(ftri) } };
  }
  const faceR = radiusByAngle(fpos, frim, cx, cz);
  const bodyR = radiusByAngle(cut.positions, cut.rim, cx, cz);
  const pos = cut.positions.slice();
  const used = new Set<number>(cut.indices);
  for (const v of used) {
    const dy = y - pos[v * 3 + 1];
    if (dy < -1e-6 || dy > JOIN_BLEND_CM || cut.regions?.[v] === REGION.arm) continue;
    const dx = pos[v * 3] - cx, dz = pos[v * 3 + 2] - cz;
    const r = Math.hypot(dx, dz);
    if (r < 1e-6) continue;
    const a = Math.atan2(dz, dx);
    // Full at the rim, fading to nothing JOIN_BLEND_CM below it (smoothstep).
    const t = 1 - dy / JOIN_BLEND_CM;
    const w = t * t * (3 - 2 * t);
    const target = r + (faceR(a) - bodyR(a));
    const nr = r + w * (target - r);
    pos[v * 3] = cx + (dx / r) * nr;
    pos[v * 3 + 2] = cz + (dz / r) * nr;
  }
  // A narrow skirt under the face's edge, a little inside it: the body's edge has far
  // fewer points than the face's, and between them it dips under the face's curve,
  // which showed as a hairline crack. It has its own copies of the edge's vertices,
  // so the face's normals are untouched, and faces outward: with the ring in order of
  // increasing angle, (top k, top k+1, bottom k) has an outward normal.
  const ring = frim
    .map((i) => ({ i, a: Math.atan2(fpos[i * 3 + 2] - cz, fpos[i * 3] - cx) }))
    .sort((p, q) => p.a - q.a);
  const top = ring.map(({ i }) => {
    const j = fpos.length / 3;
    fpos.push(fpos[i * 3], fpos[i * 3 + 1], fpos[i * 3 + 2]);
    return j;
  });
  const bottom = ring.map(({ i }) => {
    const j = fpos.length / 3;
    fpos.push(cx + (fpos[i * 3] - cx) * SKIRT_IN, y - SKIRT_CM, cz + (fpos[i * 3 + 2] - cz) * SKIRT_IN);
    return j;
  });
  for (let k = 0; k < ring.length; k++) {
    const k1 = (k + 1) % ring.length;
    ftri.push(top[k], top[k1], bottom[k], top[k1], bottom[k1], bottom[k]);
  }

  return {
    body: { ...cut, positions: pos },
    face: { positions: new Float32Array(fpos), indices: new Uint32Array(ftri) },
  };
}

const SKIRT_CM = 0.8;
const SKIRT_IN = 0.97;
