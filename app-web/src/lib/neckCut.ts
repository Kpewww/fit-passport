// The headless body: the realistic body cut straight across the neck — Session 98d.
//
// The founder: keep one face per sex, and offer a version with no head, the neck cut
// horizontally, as a dress form is. The cut is at 60% of the way from the shoulder
// line up to the jaw (the bottom of the body's head ellipsoid), the middle of the
// neck. Triangles crossing it are clipped to it, and the opening is closed with a
// flat cap whose rim vertices are its own, so the edge stays sharp under lighting.
//
// Pure: no three.js, no DOM.

import type { AnnyData } from "./annyBody";
import { ellipsoidOf, withoutEllipsoid } from "./annyHead";
import { REGION, type BodyGeometryData } from "./fitMapColours";

export const NECK_CUT_FRACTION = 0.6;

/** Height of the cut, in the body's space. */
export function neckCutY(body: BodyGeometryData, data: AnnyData): number {
  const range = data.meta.headEllipsoid?.vertices;
  if (!range || body.landmarks.shoulder == null) throw new Error("needs the head ellipsoid and a shoulder landmark");
  const { centre, axes } = ellipsoidOf(body.positions, range);
  const jaw = centre[1] - axes[1];
  return body.landmarks.shoulder + NECK_CUT_FRACTION * (jaw - body.landmarks.shoulder);
}

export function cutAtNeck(body: BodyGeometryData, data: AnnyData): BodyGeometryData & { cutY: number } {
  const y = neckCutY(body, data);
  const pos: number[] = Array.from(body.positions);
  const regions: number[] = Array.from(body.regions ?? new Uint8Array(body.positions.length / 3));
  const tri = withoutEllipsoid(data);
  const out: number[] = [];
  const onEdge = new Map<string, number>();
  const rim: number[] = [];
  const Y = (i: number) => pos[i * 3 + 1];
  const cross = (a: number, b: number) => {
    const key = a < b ? `${a}:${b}` : `${b}:${a}`;
    const had = onEdge.get(key);
    if (had != null) return had;
    const s = (y - Y(a)) / (Y(b) - Y(a));
    const i = pos.length / 3;
    for (let k = 0; k < 3; k++) pos.push(pos[a * 3 + k] + s * (pos[b * 3 + k] - pos[a * 3 + k]));
    pos[i * 3 + 1] = y;
    regions.push(REGION.head);
    onEdge.set(key, i);
    rim.push(i);
    return i;
  };

  for (let t = 0; t < tri.length; t += 3) {
    const v = [tri[t], tri[t + 1], tri[t + 2]];
    const above = v.map((i) => Y(i) > y);
    const n = above.filter(Boolean).length;
    if (n === 0) { out.push(...v); continue; }
    if (n === 3) continue;
    // Clip the polygon to the part below the plane, keeping the winding.
    const poly: number[] = [];
    for (let e = 0; e < 3; e++) {
      const a = v[e], b = v[(e + 1) % 3];
      const aa = above[e], ba = above[(e + 1) % 3];
      if (!aa) poly.push(a);
      if (aa !== ba) poly.push(cross(a, b));
    }
    for (let k = 1; k + 1 < poly.length; k++) out.push(poly[0], poly[k], poly[k + 1]);
  }

  // The cap: the rim in order of angle round its centre, fanned, facing up.
  if (rim.length >= 3) {
    let cx = 0, cz = 0;
    for (const i of rim) { cx += pos[i * 3]; cz += pos[i * 3 + 2]; }
    cx /= rim.length; cz /= rim.length;
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
      const a = copy[k], b = copy[(k + 1) % copy.length];
      // Increasing angle in x-z runs clockwise seen from above, so (centre, b, a) faces +y.
      out.push(centre, b, a);
    }
  }

  return {
    positions: new Float32Array(pos),
    indices: new Uint32Array(out),
    regions: new Uint8Array(regions),
    landmarks: body.landmarks,
    cutY: y,
  };
}
