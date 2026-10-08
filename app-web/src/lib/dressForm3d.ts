// The dress form as geometry — Session 97.
//
// `bodyMesh.ts` decides the cross-sections (pure numbers); this lofts them into an
// indexed mesh in the shape every body hands the fit-map renderer
// (`fitMapColours.ts` BodyGeometryData). Anny will hand over the same shape from
// its baked mesh, so the renderer never knows which body it is drawing.
//
// Uses three.js for its centripetal Catmull-Rom only. Import it from lazily loaded
// code: three.js must never reach a page's first load.

import * as THREE from "three";
import { bodyCrossSections, drawingRings, garmentShellRings, type BodyMeasurementsInput, type GarmentMeasurements, type ShellRing } from "./bodyMesh";
import type { BodyGeometryData, ZoneKey } from "./fitMapColours";

export const RADIAL_SEGMENTS = 48;
// Interpolated rings between each control pair: a body, not stacked hoops; still cheap.
const RINGS_BETWEEN = 8;

type Ring = { y: number; halfWidth: number; halfDepth: number };

/**
 * Loft rings into an indexed surface. Indices wrap round each ring, so the seam
 * shares its vertices and smooth normals have no crease (three.js manual, custom
 * BufferGeometry). Width, depth and height each follow a centripetal Catmull-Rom
 * through the control rings — it passes through them, so a measured ring keeps its
 * measured girth, and unlike the uniform kind it does not overshoot the sharp
 * shoulder-to-neck step (the first render bulged into a vase for that reason).
 */
export function loft(control: Ring[], caps: boolean): { positions: Float32Array; indices: Uint32Array } {
  const spline = (pick: (r: Ring) => number) =>
    new THREE.CatmullRomCurve3(control.map((r, i) => new THREE.Vector3(i, pick(r), 0)), false, "centripetal");
  const cw = spline((r) => r.halfWidth);
  const cd = spline((r) => r.halfDepth);
  const cy = spline((r) => r.y);

  const steps = (control.length - 1) * RINGS_BETWEEN;
  const pos: number[] = [];
  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    const w = cw.getPoint(t).y, d = cd.getPoint(t).y, y = cy.getPoint(t).y;
    for (let i = 0; i < RADIAL_SEGMENTS; i++) {
      const a = (i / RADIAL_SEGMENTS) * Math.PI * 2;
      pos.push(Math.cos(a) * w, y, Math.sin(a) * d);
    }
  }
  const idx: number[] = [];
  const at = (s: number, i: number) => s * RADIAL_SEGMENTS + (i % RADIAL_SEGMENTS);
  for (let s = 0; s < steps; s++) {
    for (let i = 0; i < RADIAL_SEGMENTS; i++) {
      idx.push(at(s, i), at(s + 1, i), at(s + 1, i + 1));
      idx.push(at(s, i), at(s + 1, i + 1), at(s, i + 1));
    }
  }
  if (caps) {
    for (const [s, up] of [[0, false], [steps, true]] as const) {
      const centre = pos.length / 3;
      pos.push(0, pos[at(s, 0) * 3 + 1], 0);
      for (let i = 0; i < RADIAL_SEGMENTS; i++) {
        if (up) idx.push(centre, at(s, i + 1), at(s, i));
        else idx.push(centre, at(s, i), at(s, i + 1));
      }
    }
  }
  return { positions: new Float32Array(pos), indices: new Uint32Array(idx) };
}

/** The dress form for these measurements, or null when there is nothing measured to draw. */
export function dressFormGeometry(m: BodyMeasurementsInput): BodyGeometryData | null {
  const sections = bodyCrossSections(m);
  if (sections.length < 2) return null;
  const ends = drawingRings(sections);
  const control = [...ends.below.slice().reverse(), ...sections, ...ends.above].sort((a, b) => a.y - b.y);
  const { positions, indices } = loft(control, true);
  const landmarks: Partial<Record<ZoneKey, number>> = {};
  for (const s of sections) landmarks[s.key] = s.y;
  return { positions, indices, regions: null, landmarks };
}

/** The garment shell around that form: an open tube, so it reads as a garment's
 *  cross-section and not a solid the body is inside. Null with no garment chest. */
export function shellGeometry(m: BodyMeasurementsInput, garment: GarmentMeasurements): { positions: Float32Array; indices: Uint32Array } | null {
  const rings: ShellRing[] = garmentShellRings(bodyCrossSections(m), garment);
  if (rings.length < 2) return null;
  return loft(rings, false);
}
