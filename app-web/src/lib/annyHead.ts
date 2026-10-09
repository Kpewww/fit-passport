// The realistic body's face — Session 98, phase 3.
//
// The founder chose a sculpture's face, eyes closed, a few per sex
// (tools/anny/bake_heads.py). A face is baked against an average body of its sex
// and carries that body's head ellipsoid; here it is moved and scaled from that
// ellipsoid onto the fitted body's own, and the body's ellipsoid is left out of
// the drawing so the face takes its place. "Form" keeps the ellipsoid.
//
// Pure: no three.js, no DOM; tested in Node against the baked files.

import type { AnnyData } from "./annyBody";

export type FaceId = "f1" | "f2" | "m1" | "m2";
export type HeadChoice = FaceId | "form";
export const FACE_IDS: FaceId[] = ["f1", "f2", "m1", "m2"];

export type FaceMeta = {
  id: FaceId;
  sex: "female" | "male";
  vertexCount: number;
  faceCount: number;
  ref: { centre: [number, number, number]; axes: [number, number, number] };
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

/** The default face for a sex the wearer gave; the form's head when none was given. */
export function defaultHead(sex: string | null | undefined): HeadChoice {
  return sex === "female" ? "f1" : sex === "male" ? "m1" : "form";
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

/** The body's triangles without its ellipsoid head (they are the last ones). */
export function withoutEllipsoid(data: AnnyData): Uint16Array {
  const f = data.meta.headEllipsoid?.faces;
  return f ? data.indices.subarray(0, f[0] * 3) : data.indices;
}
