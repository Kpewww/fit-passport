// The realistic body's face — Session 98, phase 3.
//
// The founder chose a sculpture's face, eyes closed (tools/anny/bake_heads.py). A face is baked against an average body of its sex
// and carries that body's head ellipsoid; here it is moved and scaled from that
// ellipsoid onto the fitted body's own, and the body's ellipsoid is left out of
// the drawing so the face takes its place.
//
// Pure: no three.js, no DOM; tested in Node against the baked files.

import type { AnnyData } from "./annyBody";

// Faces by ancestry and sex (Session 98f), chosen by the wearer and never inferred:
// Anny's statistical average faces (tools/anny/bake_heads.py), no real person's likeness.
export const ANCESTRIES = ["af", "ea", "eu"] as const;
export type Ancestry = (typeof ANCESTRIES)[number];
export type FaceId = `${"f" | "m"}-${Ancestry}`;
export const FACE_IDS: FaceId[] = ["f-af", "f-ea", "f-eu", "m-af", "m-ea", "m-eu"];
/** "none": the neck cut a little above its base, as a shop mannequin (lib/neckCut.ts).
 *  The default: no face is assumed for anyone. */
export type HeadChoice = Ancestry | "none";
export const HEAD_CHOICES: HeadChoice[] = ["none", ...ANCESTRIES];

/** The face for this ancestry on a body of this sex. */
export function faceFor(sex: "female" | "male", ancestry: Ancestry): FaceId {
  return `${sex === "female" ? "f" : "m"}-${ancestry}`;
}

export type FaceMeta = {
  id: FaceId;
  sex: "female" | "male";
  ancestry: Ancestry;
  vertexCount: number;
  faceCount: number;
  ref: { centre: [number, number, number]; axes: [number, number, number] };
  /** The chin's height in the bake's space. */
  chinY: number;
};
export type HeadsMeta = { unitPerCm: number; faces: FaceMeta[] };
export type Face = { indices: Uint16Array; positions: Float32Array };

/** A face file (already gunzipped). */
export function parseFace(buffer: ArrayBuffer, meta: FaceMeta, unitPerCm: number): Face {
  const ic = meta.faceCount * 3;
  const raw = new Int16Array(buffer, ic * 2, meta.vertexCount * 3);
  const positions = new Float32Array(raw.length);
  for (let i = 0; i < raw.length; i++) positions[i] = raw[i] / unitPerCm;
  return { indices: new Uint16Array(buffer, 0, ic), positions };
}


/** Centre and semi-axes of the body's ellipsoid head, from its own vertices. */
export function ellipsoidOf(positions: Float32Array, range: [number, number]): { centre: number[]; axes: number[] } {
  const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
  for (let v = range[0]; v < range[0] + range[1]; v++) {
    for (let k = 0; k < 3; k++) {
      lo[k] = Math.min(lo[k], positions[v * 3 + k]);
      hi[k] = Math.max(hi[k], positions[v * 3 + k]);
    }
  }
  return { centre: lo.map((l, k) => (l + hi[k]) / 2), axes: lo.map((l, k) => (hi[k] - l) / 2) };
}

/** The face moved from its reference ellipsoid onto this body's. */
export function placeFace(face: Face, meta: FaceMeta, bodyPositions: Float32Array, data: AnnyData): Float32Array {
  const range = data.meta.headEllipsoid?.vertices;
  if (!range) throw new Error("body.json has no headEllipsoid; re-bake with tools/anny/bake.py");
  const { centre, axes } = ellipsoidOf(bodyPositions, range);
  const out = new Float32Array(face.positions.length);
  for (let i = 0; i < out.length; i += 3) {
    for (let k = 0; k < 3; k++) {
      out[i + k] = centre[k] + (face.positions[i + k] - meta.ref.centre[k]) * (axes[k] / meta.ref.axes[k]);
    }
  }
  return out;
}

/** The face's chin on this body: the same move and scale as placeFace. */
export function placedChinY(meta: FaceMeta, bodyPositions: Float32Array, data: AnnyData): number {
  const range = data.meta.headEllipsoid?.vertices;
  if (!range) throw new Error("body.json has no headEllipsoid");
  const { centre, axes } = ellipsoidOf(bodyPositions, range);
  return centre[1] + (meta.chinY - meta.ref.centre[1]) * (axes[1] / meta.ref.axes[1]);
}

/** The body's triangles without its ellipsoid head (they are the last ones). */
export function withoutEllipsoid(data: AnnyData): Uint16Array {
  const f = data.meta.headEllipsoid?.faces;
  return f ? data.indices.subarray(0, f[0] * 3) : data.indices;
}
