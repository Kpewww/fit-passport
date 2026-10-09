// The sculpted faces on the realistic body — Session 98, phase 3. Runs on the baked
// files the browser fetches.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { fitAnny, parseAnny, type AnnyMeta } from "./annyBody";
import { FACE_IDS, ellipsoidOf, faceFor, parseFace, placeFace, placedChinY, withoutEllipsoid, type HeadsMeta } from "./annyHead";
import { cutAtNeck, joinFaceAtNeck, joinLevel } from "./neckCut";
import { pnSubdivide, roundBody } from "./pnSubdivide";
import { girthAt } from "./annyBody";

const DIR = join(__dirname, "..", "..", "public", "anny");
const meta = JSON.parse(readFileSync(join(DIR, "body.json"), "utf8")) as AnnyMeta;
const buf = gunzipSync(readFileSync(join(DIR, "body.bin.gz")));
const data = parseAnny(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), meta);
const heads = JSON.parse(readFileSync(join(DIR, "heads.json"), "utf8")) as HeadsMeta;
const load = (id: string) => {
  const m = heads.faces.find((f) => f.id === id)!;
  const b = gunzipSync(readFileSync(join(DIR, `head-${id}.bin.gz`)));
  return { m, face: parseFace(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength), m, heads.unitPerCm) };
};

describe("the baked faces", () => {
  it("are the six baked (A, B, C for each sex), each whole and in range", () => {
    expect(heads.faces.map((f) => f.id).sort()).toEqual([...FACE_IDS].sort());
    for (const id of FACE_IDS) {
      const { m, face } = load(id);
      expect(face.positions.length).toBe(m.vertexCount * 3);
      expect(Math.max(...face.indices)).toBeLessThan(m.vertexCount);
    }
  });

  it("are chosen as A, B or C, for the body's sex", () => {
    expect(faceFor("female", "b")).toBe("f-b");
    expect(faceFor("male", "a")).toBe("m-a");
  });
});

describe("a face on a fitted body", () => {
  for (const [id, person] of [
    ["f-b", { sex: "female" as const, heightCm: 158, weightKg: 50 }],
    ["f-a", { sex: "female" as const, heightCm: 172, weightKg: 64 }],
    ["m-c", { sex: "male" as const, heightCm: 192, weightKg: 95 }],
    ["m-b", { sex: "male" as const, heightCm: 170, weightKg: 68 }],
  ] as const) {
    it(`sits where ${person.sex} ${person.heightCm} cm's head is, at its size (${id})`, () => {
      const fit = fitAnny(data, person);
      const { m, face } = load(id);
      const placed = placeFace(face, m, fit.body.positions, data);
      const body = ellipsoidOf(fit.body.positions, meta.headEllipsoid!.vertices);
      // The face's skull lies around the body's head: its top within a few cm of
      // the ellipsoid's, and nothing of it above the body's height.
      let top = -Infinity;
      for (let i = 1; i < placed.length; i += 3) top = Math.max(top, placed[i]);
      expect(Math.abs(top - (body.centre[1] + body.axes[1]))).toBeLessThan(3);
      expect(top).toBeLessThan(person.heightCm + 1.5);
      // And its neck reaches below the ellipsoid, into the body's neck.
      let bottom = Infinity;
      for (let i = 1; i < placed.length; i += 3) bottom = Math.min(bottom, placed[i]);
      expect(bottom).toBeLessThan(body.centre[1] - body.axes[1]);
    });
  }

  it("leaves the ellipsoid out of the body's triangles, and only it", () => {
    const tri = withoutEllipsoid(data);
    expect(tri.length).toBe((meta.faceCount - meta.headEllipsoid!.faces[1]) * 3);
    expect(Math.max(...tri)).toBeLessThan(meta.headEllipsoid!.vertices[0]);
  });
});

describe("the headless body (Session 98d)", () => {
  for (const person of [{ sex: "female" as const, heightCm: 160, weightKg: 52 }, { sex: "male" as const, heightCm: 188, weightKg: 90, chestCm: 104 }]) {
    it(`is cut straight across the neck and closed, for ${person.sex} ${person.heightCm} cm`, () => {
      const fit = fitAnny(data, person);
      const cut = cutAtNeck(fit.body, data);
      // Nothing drawn above the cut.
      let top = -Infinity;
      for (const i of cut.indices) top = Math.max(top, cut.positions[i * 3 + 1]);
      expect(top).toBeCloseTo(cut.cutY, 4);
      // The cut is in the neck: above the shoulders, under the jaw.
      const head = ellipsoidOf(fit.body.positions, meta.headEllipsoid!.vertices);
      expect(cut.cutY).toBeGreaterThan(fit.body.landmarks.shoulder!);
      // A little neck left, as on a shop mannequin: at the neck's narrowest, above the
      // shoulders' slope and under the jaw.
      const jaw = head.centre[1] - head.axes[1];
      const sh = fit.body.landmarks.shoulder!;
      expect(cut.cutY).toBeGreaterThan(sh + 0.6 * (jaw - sh));
      expect(cut.cutY).toBeLessThan(jaw);
      const g = (y: number) => girthAt(fit.body.positions, withoutEllipsoid(data), data.regions, y, [0, 3]);
      for (const dy of [-1, 1]) expect(g(cut.cutY + dy) + 0.05).toBeGreaterThanOrEqual(g(cut.cutY));
      // The cap: triangles lying in the plane, facing up, covering a neck-sized disc.
      let capTris = 0, area = 0;
      for (let t = 0; t < cut.indices.length; t += 3) {
        const [a, b, c] = [cut.indices[t], cut.indices[t + 1], cut.indices[t + 2]];
        const ys = [a, b, c].map((i) => cut.positions[i * 3 + 1]);
        if (ys.some((v) => Math.abs(v - cut.cutY) > 1e-4)) continue;
        const P = (i: number) => [cut.positions[i * 3], cut.positions[i * 3 + 2]];
        const [pa, pb, pc] = [P(a), P(b), P(c)];
        // y of (b-a) x (c-a), with (x, z) coordinates: up means negative z-x cross.
        const ny = (pb[1] - pa[1]) * (pc[0] - pa[0]) - (pb[0] - pa[0]) * (pc[1] - pa[1]);
        expect(ny, "a cap triangle faces up").toBeGreaterThan(0);
        area += Math.abs(ny) / 2;
        capTris++;
      }
      expect(capTris).toBeGreaterThan(6);
      const girth = 2 * Math.sqrt(Math.PI * area); // the circle with that area
      // A neck's girth, not the shoulders'.
      expect(girth).toBeGreaterThan(22);
      expect(girth).toBeLessThan(45);
    });
  }
});

describe("rounding the body (PN triangles, Session 98f)", () => {
  const fit = fitAnny(data, { sex: "female", heightCm: 165, weightKg: 58, chestCm: 92, cup: "E" });
  const round = pnSubdivide({ ...fit.body, indices: withoutEllipsoid(data) }, 2);
  it("keeps every original vertex where it was, with 16 triangles for each", () => {
    expect(round.indices.length).toBe(withoutEllipsoid(data).length * 16);
    for (let i = 0; i < fit.body.positions.length; i++) expect(round.positions[i]).toBe(fit.body.positions[i]);
  });
  it("keeps the girths the fit reached, within 1.5%, after the torso is evened out too", () => {
    const round = roundBody({ ...fit.body, indices: withoutEllipsoid(data) });
    for (const key of ["chest", "waist", "hip"] as const) {
      const keep = key === "hip" ? [0, 2] : [0];
      const y = fit.body.landmarks[key]!;
      const before = girthAt(fit.body.positions, withoutEllipsoid(data), data.regions, y, keep);
      const after = girthAt(round.positions, round.indices as unknown as Uint16Array, round.regions!, y, keep);
      expect(Math.abs(after - before) / before, key).toBeLessThan(0.015);
    }
  });
});

describe("under a face, the body is cut open at the neck", () => {
  it("has no cap, and the face's neck reaches below the cut", () => {
    const fit = fitAnny(data, { sex: "female", heightCm: 165, weightKg: 58 });
    const open = cutAtNeck(fit.body, data, { cap: false });
    const capped = cutAtNeck(fit.body, data);
    expect(open.indices.length).toBeLessThan(capped.indices.length);
    const { m, face } = load("f-c");
    const placed = placeFace(face, m, fit.body.positions, data);
    let bottom = Infinity;
    for (let i = 1; i < placed.length; i += 3) bottom = Math.min(bottom, placed[i]);
    expect(bottom).toBeLessThan(open.cutY - 1);
  });
});

describe("a face joined to the body at the neck (Session 98f)", () => {
  for (const [id, person] of [["f-b", { sex: "female" as const, heightCm: 160, weightKg: 52 }], ["m-a", { sex: "male" as const, heightCm: 186, weightKg: 88 }]] as const) {
    it(`meets the body's edge all the way round the neck (${id})`, () => {
      const fit = fitAnny(data, person);
      const { m, face } = load(id);
      const cut = cutAtNeck(fit.body, data, { cap: false, at: joinLevel(fit.body, data, placedChinY(m, fit.body.positions, data)) });
      expect(cut.cutY).toBeLessThan(placedChinY(m, fit.body.positions, data));
      const joined = joinFaceAtNeck(cut, { positions: placeFace(face, m, fit.body.positions, data), indices: face.indices });
      const [cx, cz] = cut.axis;
      const polar = (p: Float32Array, i: number) => [Math.atan2(p[i * 3 + 2] - cz, p[i * 3] - cx), Math.hypot(p[i * 3] - cx, p[i * 3 + 2] - cz)];
      // The face's rim: its vertices on the cut level.
      const faceRim: number[][] = [];
      for (let i = 0; i < joined.face.positions.length / 3; i++) if (Math.abs(joined.face.positions[i * 3 + 1] - cut.cutY) < 1e-4) faceRim.push(polar(joined.face.positions, i));
      expect(faceRim.length).toBeGreaterThan(20);
      let worst = 0;
      for (const v of cut.rim) {
        const [a, r] = polar(joined.body.positions, v);
        const near = faceRim.reduce((best, p) => (Math.abs(p[0] - a) < Math.abs(best[0] - a) ? p : best));
        worst = Math.max(worst, Math.abs(near[1] - r));
      }
      // Within a few millimetres, by the face's nearest point (its edge is interpolated
      // between them, so this overstates the gap a little).
      expect(worst).toBeLessThan(0.7);
      // Nothing of the face below the cut but its skirt, which stays within 1 cm.
      for (const i of joined.face.indices) expect(joined.face.positions[i * 3 + 1]).toBeGreaterThanOrEqual(cut.cutY - 1);
    });
  }
});
