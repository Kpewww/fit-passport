// A rounder body from the coarse one — Session 98f.
//
// The founder: the chest looks angular. The realistic body ships Anny's coarse topology
// (1,229 vertices; the next one up has 12,272) because it is fitted in the browser. Its
// silhouette is therefore faceted where the surface curves most. Here each triangle is
// replaced by four on a curved PN triangle (Vlachos et al., "Curved PN Triangles",
// I3D 2001): the original vertices stay where they are, and each edge is bent along
// the surface normals at its ends. Because it interpolates, a girth the fit reached
// is kept, where an approximating scheme (Loop) would shrink it. Two levels: 16
// triangles for each one. Then the torso is evened out without shrinking (smoothTorso).
//
// Pure: no three.js, no DOM.

import type { BodyGeometryData } from "./fitMapColours";

type Mesh = { positions: Float32Array; indices: Uint32Array | Uint16Array; regions: Uint8Array | null };

function vertexNormals(pos: Float32Array, idx: ArrayLike<number>): Float32Array {
  const n = new Float32Array(pos.length);
  for (let t = 0; t < idx.length; t += 3) {
    const a = idx[t] * 3, b = idx[t + 1] * 3, c = idx[t + 2] * 3;
    const ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2];
    const vx = pos[c] - pos[a], vy = pos[c + 1] - pos[a + 1], vz = pos[c + 2] - pos[a + 2];
    // Area-weighted: the cross product's length is twice the triangle's area.
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    for (const v of [a, b, c]) { n[v] += nx; n[v + 1] += ny; n[v + 2] += nz; }
  }
  for (let i = 0; i < n.length; i += 3) {
    const l = Math.hypot(n[i], n[i + 1], n[i + 2]) || 1;
    n[i] /= l; n[i + 1] /= l; n[i + 2] /= l;
  }
  return n;
}

function once(m: Mesh): Mesh {
  const P = m.positions, I = m.indices;
  const N = vertexNormals(P, I);
  const pos: number[] = Array.from(P);
  const reg: number[] = m.regions ? Array.from(m.regions) : [];
  const mid = new Map<number, number>();
  const nv = P.length / 3;
  const edge = (a: number, b: number) => {
    const key = a < b ? a * nv + b : b * nv + a;
    const had = mid.get(key);
    if (had != null) return had;
    const out = pos.length / 3;
    // The cubic edge curve of a PN triangle at its middle: (b300 + 3 b210 + 3 b120 + b030) / 8.
    const wab = (P[b * 3] - P[a * 3]) * N[a * 3] + (P[b * 3 + 1] - P[a * 3 + 1]) * N[a * 3 + 1] + (P[b * 3 + 2] - P[a * 3 + 2]) * N[a * 3 + 2];
    const wba = (P[a * 3] - P[b * 3]) * N[b * 3] + (P[a * 3 + 1] - P[b * 3 + 1]) * N[b * 3 + 1] + (P[a * 3 + 2] - P[b * 3 + 2]) * N[b * 3 + 2];
    for (let k = 0; k < 3; k++) {
      const p0 = P[a * 3 + k], p1 = P[b * 3 + k];
      const b210 = (2 * p0 + p1 - wab * N[a * 3 + k]) / 3;
      const b120 = (2 * p1 + p0 - wba * N[b * 3 + k]) / 3;
      pos.push((p0 + 3 * b210 + 3 * b120 + p1) / 8);
    }
    if (m.regions) reg.push(m.regions[a] === m.regions[b] ? m.regions[a] : Math.min(m.regions[a], m.regions[b]));
    mid.set(key, out);
    return out;
  };
  const idx: number[] = [];
  for (let t = 0; t < I.length; t += 3) {
    const a = I[t], b = I[t + 1], c = I[t + 2];
    const ab = edge(a, b), bc = edge(b, c), ca = edge(c, a);
    idx.push(a, ab, ca, ab, b, bc, ca, bc, c, ab, bc, ca);
  }
  return { positions: new Float32Array(pos), indices: new Uint32Array(idx), regions: m.regions ? new Uint8Array(reg) : null };
}

/** The body, rounded by `levels` of PN subdivision (each multiplies the triangles by 4). */
export function pnSubdivide<T extends BodyGeometryData>(body: T, levels = 2): T {
  let m: Mesh = { positions: body.positions, indices: body.indices, regions: body.regions ?? null };
  for (let i = 0; i < levels; i++) m = once(m);
  return { ...body, positions: m.positions, indices: m.indices, regions: m.regions };
}

/**
 * Taubin smoothing of the torso (Taubin, "A signal processing approach to fair surface
 * design", SIGGRAPH 1995): a shrinking step (lambda) then an inflating one (mu), so the
 * surface is evened out without losing volume. PN triangles bend edges only where the
 * coarse normals differ, which left flat facets on a medium bust (Session 98f, seen on
 * cup C). Only torso vertices move; edges of open boundaries stay put.
 */
export function smoothTorso<T extends BodyGeometryData>(body: T, iterations = 4, torso = 0): T {
  const P = body.positions.slice();
  const I = body.indices;
  const R = body.regions;
  const n = P.length / 3;
  const nbrs: Array<Set<number>> = Array.from({ length: n }, () => new Set());
  const edgeUse = new Map<number, number>();
  for (let t = 0; t < I.length; t += 3) {
    for (let e = 0; e < 3; e++) {
      const a = I[t + e], b = I[t + (e + 1) % 3];
      nbrs[a].add(b); nbrs[b].add(a);
      const key = a < b ? a * n + b : b * n + a;
      edgeUse.set(key, (edgeUse.get(key) ?? 0) + 1);
    }
  }
  const fixed = new Uint8Array(n);
  for (const [key, uses] of edgeUse) if (uses === 1) { fixed[Math.floor(key / n)] = 1; fixed[key % n] = 1; }
  const movable: number[] = [];
  for (let v = 0; v < n; v++) if (!fixed[v] && R && R[v] === torso && nbrs[v].size > 0) movable.push(v);
  const step = (f: number) => {
    const next = P.slice();
    for (const v of movable) {
      let x = 0, y = 0, z = 0;
      for (const u of nbrs[v]) { x += P[u * 3]; y += P[u * 3 + 1]; z += P[u * 3 + 2]; }
      const k = nbrs[v].size;
      next[v * 3] = P[v * 3] + f * (x / k - P[v * 3]);
      next[v * 3 + 1] = P[v * 3 + 1] + f * (y / k - P[v * 3 + 1]);
      next[v * 3 + 2] = P[v * 3 + 2] + f * (z / k - P[v * 3 + 2]);
    }
    P.set(next);
  };
  for (let i = 0; i < iterations; i++) { step(0.5); step(-0.53); }
  return { ...body, positions: P };
}

/** What /body draws: PN-rounded, then the torso evened out. */
export function roundBody<T extends BodyGeometryData>(body: T): T {
  return smoothTorso(pnSubdivide(body, 2), 6);
}
