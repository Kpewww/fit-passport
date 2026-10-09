// The sculpted faces on the realistic body — Session 98, phase 3. Runs on the baked
// files the browser fetches.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { fitAnny, parseAnny, type AnnyMeta } from "./annyBody";
import { FACE_IDS, ellipsoidOf, faceFor, parseFace, placeFace, withoutEllipsoid, type HeadsMeta } from "./annyHead";
import { cutAtNeck } from "./neckCut";

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
  it("are the two kept, each whole and in range", () => {
    expect(heads.faces.map((f) => f.id).sort()).toEqual([...FACE_IDS].sort());
    for (const id of FACE_IDS) {
      const { m, face } = load(id);
      expect(face.positions.length).toBe(m.vertexCount * 3);
      expect(Math.max(...face.indices)).toBeLessThan(m.vertexCount);
    }
  });

  it("follow the body's sex", () => {
    expect(faceFor("female")).toBe("f1");
    expect(faceFor("male")).toBe("m1");
  });
});

describe("a face on a fitted body", () => {
  for (const [id, person] of [
    ["f1", { sex: "female" as const, heightCm: 158, weightKg: 50 }],
    ["m1", { sex: "male" as const, heightCm: 192, weightKg: 95 }],
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
      expect(cut.cutY).toBeLessThan(head.centre[1] - head.axes[1]);
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
      expect(girth).toBeGreaterThan(25);
      expect(girth).toBeLessThan(50);
    });
  }
});
