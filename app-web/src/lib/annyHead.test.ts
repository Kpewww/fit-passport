// The sculpted faces on the realistic body — Session 98, phase 3. Runs on the baked
// files the browser fetches.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { fitAnny, parseAnny, type AnnyMeta } from "./annyBody";
import { FACE_IDS, defaultHead, ellipsoidOf, parseFace, placeFace, withoutEllipsoid, type HeadsMeta } from "./annyHead";

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
  it("are the four chosen, each whole and in range", () => {
    expect(heads.faces.map((f) => f.id).sort()).toEqual([...FACE_IDS].sort());
    for (const id of FACE_IDS) {
      const { m, face } = load(id);
      expect(face.positions.length).toBe(m.vertexCount * 3);
      expect(Math.max(...face.indices)).toBeLessThan(m.vertexCount);
    }
  });

  it("follow the sex the wearer gave, and the form's head without one", () => {
    expect(defaultHead("female")).toBe("f1");
    expect(defaultHead("male")).toBe("m1");
    expect(defaultHead(null)).toBe("form");
  });
});

describe("a face on a fitted body", () => {
  for (const [id, person] of [
    ["f1", { sex: "female" as const, heightCm: 158, weightKg: 50 }],
    ["m2", { sex: "male" as const, heightCm: 192, weightKg: 95 }],
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
