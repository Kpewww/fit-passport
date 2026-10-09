// The realistic body (Anny), fitted to measurements — Session 97, Track 2. Runs on the
// baked file the browser fetches, so what is tested is what ships.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { CUPS, blendCorners, estimateGirths, fitAnny, girthAt, parseAnny, type AnnyMeta, type Cup } from "./annyBody";
import { dressFormGeometry } from "./dressForm3d";
import { REGION } from "./fitMapColours";

const DIR = join(__dirname, "..", "..", "public", "anny");
const meta = JSON.parse(readFileSync(join(DIR, "body.json"), "utf8")) as AnnyMeta;
const buf = gunzipSync(readFileSync(join(DIR, "body.bin.gz")));
const data = parseAnny(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), meta);

const PEOPLE = [
  { name: "a man", m: { sex: "male" as const, heightCm: 178, weightKg: 74, chestCm: 98, waistCm: 84, hipCm: 98, shoulderCm: 46 } },
  { name: "a woman", m: { sex: "female" as const, heightCm: 165, weightKg: 60, chestCm: 88, waistCm: 72, hipCm: 96, shoulderCm: 39 } },
  { name: "a larger man", m: { sex: "male" as const, heightCm: 183, weightKg: 98, chestCm: 112, waistCm: 102, hipCm: 108, shoulderCm: 49 } },
];

describe("the baked Anny body", () => {
  it("carries Anny's cup-size change as its last local change", () => {
    expect(meta.locals.at(-1)).toBe("phenotype-cupsize");
  });

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

describe("a body from height and weight alone (Session 98)", () => {
  const people = [
    { sex: "male" as const, heightCm: 178, weightKg: 74 },
    { sex: "female" as const, heightCm: 163, weightKg: 55 },
    { sex: "male" as const, heightCm: 185, weightKg: 105 },
  ];
  for (const m of people) {
    it(`gives the dress form girths to draw for ${m.sex}, ${m.heightCm} cm, ${m.weightKg} kg`, () => {
      const fit = fitAnny(data, m);
      const est = estimateGirths(data, fit);
      // Human ranges, not targets: the point is a drawable, plausible form.
      expect(est.chestCm).toBeGreaterThan(70); expect(est.chestCm).toBeLessThan(135);
      expect(est.waistCm).toBeGreaterThan(55); expect(est.waistCm).toBeLessThan(125);
      expect(est.hipCm).toBeGreaterThan(75); expect(est.hipCm).toBeLessThan(135);
      expect(est.shoulderCm).toBeGreaterThan(30); expect(est.shoulderCm).toBeLessThan(60);
      expect(dressFormGeometry({ ...m, ...est })).not.toBeNull();
    });
  }

  it("grows with weight", () => {
    const light = estimateGirths(data, fitAnny(data, { sex: "male", heightCm: 178, weightKg: 62 }));
    const heavy = estimateGirths(data, fitAnny(data, { sex: "male", heightCm: 178, weightKg: 98 }));
    expect(heavy.waistCm).toBeGreaterThan(light.waistCm + 5);
  });

  it("reads back the girths a full fit was given, so the estimate measures what the fit measured", () => {
    const fit = fitAnny(data, PEOPLE[0].m);
    const est = estimateGirths(data, fit);
    expect(Math.abs(est.chestCm - PEOPLE[0].m.chestCm)).toBeLessThanOrEqual(1);
    expect(Math.abs(est.waistCm - PEOPLE[0].m.waistCm)).toBeLessThanOrEqual(1);
  });
});

describe("a chosen cup size (Session 98d, EN 13402: bust minus underbust)", () => {
  const woman = { sex: "female" as const, heightCm: 165, weightKg: 58 };
  it("reaches every cup from A to J within 1 cm, and the bust grows with it", () => {
    let lastBust = 0;
    for (const cup of Object.keys(CUPS) as Cup[]) {
      const fit = fitAnny(data, { ...woman, cup });
      expect(Math.abs(fit.residuals.cup!), `${cup} ${fit.residuals.cup}`).toBeLessThanOrEqual(1);
      const c = fit.body.landmarks.chest!;
      const bust = Math.max(...Array.from({ length: 16 }, (_, i) => girthAt(fit.body.positions, data.indices, data.regions, c - 10 + i, [0])));
      expect(bust).toBeGreaterThan(lastBust);
      lastBust = bust;
    }
  });
  it("keeps a measured bust while it sets the cup", () => {
    const fit = fitAnny(data, { ...woman, chestCm: 90, cup: "D" });
    expect(Math.abs(fit.residuals.chest!)).toBeLessThanOrEqual(1);
    expect(Math.abs(fit.residuals.cup!)).toBeLessThanOrEqual(1);
  });
  it("is not applied to a man's body", () => {
    const fit = fitAnny(data, { sex: "male", heightCm: 178, weightKg: 74, cup: "C" });
    expect(fit.residuals.cup).toBeUndefined();
    expect(fit.localWeights["phenotype-cupsize"]).toBeUndefined();
  });
});

describe("a cup with a measured bust looks its size (Session 98f: an F looked like a B)", () => {
  // How far the breasts stand out: the front of the torso at the bust, minus at the underbust.
  const projection = (pos: Float32Array, chestY: number) => {
    let bust = -Infinity, under = -Infinity;
    for (let v = 0; v < data.regions.length; v++) {
      if (data.regions[v] !== 0 || Math.abs(pos[v * 3]) > 12) continue;
      const y = pos[v * 3 + 1], z = pos[v * 3 + 2];
      if (y > chestY - 9 && y < chestY + 3) bust = Math.max(bust, z);
      if (y > chestY - 16 && y < chestY - 11) under = Math.max(under, z);
    }
    return bust - under;
  };
  // Pairs this body can wear (measured, Session 98g: at bust 88 cups A to F fit exactly,
  // at 92 A to H).
  for (const [chestCm, small, large] of [[88, "B", "F"], [92, "C", "H"]] as const) {
    it(`keeps a ${chestCm} cm bust, and ${large} stands out well past ${small}`, () => {
      const at = (cup: Cup) => fitAnny(data, { sex: "female", heightCm: 165, weightKg: 58, chestCm, cup });
      const b = at(small), f = at(large);
      for (const fit of [b, f]) {
        expect(Math.abs(fit.residuals.chest!), `chest ${fit.residuals.chest}`).toBeLessThanOrEqual(1);
        expect(Math.abs(fit.residuals.cup!), `cup ${fit.residuals.cup}`).toBeLessThanOrEqual(1);
      }
      const pb = projection(b.body.positions, b.body.landmarks.chest!), pf = projection(f.body.positions, f.body.landmarks.chest!);
      expect(pf - pb, `B ${pb.toFixed(1)} F ${pf.toFixed(1)}`).toBeGreaterThan(2);
    });
  }
});

describe("a cup the body cannot carry at that bust", () => {
  it("is reported as a residual, not hidden (bust 84 with an H: an underbust of 57 cm)", () => {
    const fit = fitAnny(data, { sex: "female", heightCm: 165, weightKg: 58, chestCm: 84, cup: "H" });
    expect(Math.abs(fit.residuals.chest!)).toBeLessThanOrEqual(1);
    expect(fit.residuals.cup!).toBeLessThan(-1);
  });
});

describe("the underbust is taken at the breast's fold (ISO 8559-1), Session 98g", () => {
  it("draws an A cup with breasts: not at Anny's flattest", () => {
    const fit = fitAnny(data, { sex: "female", heightCm: 165, weightKg: 58, cup: "A" });
    expect(fit.localWeights["phenotype-cupsize"]!).toBeGreaterThan(-0.8);
    expect(fit.cupMeasure!.bustCm - fit.cupMeasure!.underbustCm).toBeCloseTo(13, 0);
  });
  it("finds Anny's average woman a B by EN 13402", () => {
    const fit = fitAnny(data, { sex: "female", heightCm: 165, weightKg: 58, cup: "B" });
    expect(Math.abs(fit.localWeights["phenotype-cupsize"] ?? 0)).toBeLessThan(0.2);
  });
});
