// The realistic body (Anny), fitted to measurements — Session 97, Track 2. Runs on the
// baked file the browser fetches, so what is tested is what ships.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { blendCorners, fitAnny, girthAt, parseAnny, type AnnyMeta } from "./annyBody";
import { REGION } from "./fitMapColours";

const DIR = join(__dirname, "..", "..", "public", "anny");
const meta = JSON.parse(readFileSync(join(DIR, "body.json"), "utf8")) as AnnyMeta;
const buf = readFileSync(join(DIR, "body.bin"));
const data = parseAnny(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), meta);

const PEOPLE = [
  { name: "a man", m: { sex: "male" as const, heightCm: 178, weightKg: 74, chestCm: 98, waistCm: 84, hipCm: 98, shoulderCm: 46 } },
  { name: "a woman", m: { sex: "female" as const, heightCm: 165, weightKg: 60, chestCm: 88, waistCm: 72, hipCm: 96, shoulderCm: 39 } },
  { name: "a larger man", m: { sex: "male" as const, heightCm: 183, weightKg: 98, chestCm: 112, waistCm: 102, hipCm: 108, shoulderCm: 49 } },
];

describe("the baked Anny body", () => {
  it("is the coarse mesh plus a mannequin head, every vertex in a region, every face in range", () => {
    // 1,229 from Anny's coarse topology, 314 for the ellipsoid head (2 poles + 13 rings of 24).
    expect(meta.vertexCount).toBe(1229 + 314);
    expect(data.regions.length).toBe(meta.vertexCount);
    expect(Math.max(...data.indices)).toBeLessThan(meta.vertexCount);
    expect([...new Set(data.regions)].sort()).toEqual([REGION.torso, REGION.arm, REGION.leg, REGION.head]);
  });

  it("blends exactly to a corner at a corner", () => {
    const k = meta.corners.findIndex((c) => c.gender === 1 && c.muscle === 0.5 && c.weight === 0);
    expect(blendCorners(data, { gender: 1, muscle: 0.5, weight: 0 })).toEqual(data.corners[k]);
  });
});

describe("fitting it to a person", () => {
  for (const { name, m } of PEOPLE) {
    it(`brings ${name}'s girths within 1 cm, and stands at their height`, () => {
      const fit = fitAnny(data, m);
      for (const [key, r] of Object.entries(fit.residuals)) expect(Math.abs(r!), `${key} ${r}`).toBeLessThanOrEqual(1);
      let lo = Infinity, hi = -Infinity;
      for (let i = 1; i < fit.body.positions.length; i += 3) { lo = Math.min(lo, fit.body.positions[i]); hi = Math.max(hi, fit.body.positions[i]); }
      expect(lo).toBeCloseTo(0, 6);
      expect(hi).toBeCloseTo(m.heightCm, 3);
    });
  }

  it("reports what it could not reach, rather than hiding it", () => {
    const fit = fitAnny(data, { sex: "male", heightCm: 178, chestCm: 160 });
    expect(fit.residuals.chest!).toBeLessThan(-1);
  });

  it("measures a girth from torso triangles only", () => {
    const fit = fitAnny(data, PEOPLE[0].m);
    const g = girthAt(fit.body.positions, data.indices, data.regions, fit.body.landmarks.waist!, [REGION.torso]);
    expect(g).toBeCloseTo(84, 0);
  });
});
