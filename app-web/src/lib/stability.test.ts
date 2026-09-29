// "Small changes should not swing the whole result." A pick CAN flip at a real
// boundary — that is correct — but a flip the wearer's own tape-measure error could
// cause must never be presented confidently. These tests pin the properties that
// make that true, on a body-range ladder shaped like Nike's published chart.
import { describe, it, expect } from "vitest";
import { recommend, type EngineInput } from "./fitEngine";
import { measureStability, stabilityFactor } from "./stability";
import { STABILITY } from "./scoringConstants";

const LADDER = [
  { label: "S", bodyChestMinCm: 88.9, bodyChestMaxCm: 95.3 },
  { label: "M", bodyChestMinCm: 95.3, bodyChestMaxCm: 104.1 },
  { label: "L", bodyChestMinCm: 104.1, bodyChestMaxCm: 111.8 },
  { label: "XL", bodyChestMinCm: 111.8, bodyChestMaxCm: 123.2 },
];
const input = (chestCm: number, sizes = LADDER): EngineInput => ({
  profile: { chestCm, preferredFit: "regular" },
  product: { brand: "Nike", category: "tshirt" },
  sizes,
  knownGood: [],
  outcomes: [],
});
const ORDER = ["S", "M", "L", "XL"];

describe("stability — measured in the wearer's own centimetres", () => {
  it("is fully stable deep inside a size's range, and says over what range it holds", () => {
    const out = recommend(input(99.7)); // centre of M
    expect(out.best.label).toBe("M");
    expect(out.stability!.agreement).toBe(1);
    const [lo, hi] = out.stability!.holdsForChestCm!;
    expect(lo).toBeLessThanOrEqual(99.7);
    expect(hi).toBeGreaterThanOrEqual(99.7);
    expect(hi - lo).toBeGreaterThan(4); // M spans ~8.8 cm
  });

  it("is fragile on a boundary, and the confidence and the explanation both say so", () => {
    const centred = recommend(input(99.7));
    const edge = recommend(input(104.1)); // exactly the M/L boundary
    expect(edge.stability!.agreement).toBeLessThan(STABILITY.fragileBelow);
    expect(edge.best.confidence).toBeLessThan(centred.best.confidence);
    expect(edge.conflictNote).toMatch(/holds for a chest between/);
    expect(centred.conflictNote ?? "").not.toMatch(/holds for a chest between/);
  });

  it("is deterministic — the same input always gives the same stability", () => {
    expect(recommend(input(103)).stability).toEqual(recommend(input(103)).stability);
  });

  it("maps agreement onto the same range the old margin factor used", () => {
    expect(stabilityFactor(1)).toBe(1);
    expect(stabilityFactor(0.5)).toBe(STABILITY.floor);
    expect(stabilityFactor(0)).toBe(STABILITY.floor); // never below the floor
    expect(stabilityFactor(0.75)).toBeCloseTo((1 + STABILITY.floor) / 2, 10);
  });

  it("runs the grid it claims: 5 chest × 3 chart offsets with no waist", () => {
    const s = measureStability(input(100), "M", (i) => recommend(i, { skipStability: true }).best.label);
    expect(s.runs).toBe(5 * 3);
  });
});

describe("properties of the scorer that small changes rely on", () => {
  it("is continuous: a 0.1 cm change moves no size's score by more than 0.01", () => {
    // Measured: the steepest LEGITIMATE slope is 0.0064 per 0.1 cm, ~4 cm outside a
    // range where the smooth fall-off is steepest. The defect this guards against —
    // scoring just-outside a range above just-inside it — was a ~0.016 jump at
    // every edge. The first version of this test allowed 0.03 and missed it; a
    // bound loose enough to pass a discontinuity tests nothing.
    for (let c = 86; c <= 124; c += 0.7) {
      const a = recommend(input(c), { skipStability: true }).ranked;
      const b = recommend(input(c + 0.1), { skipStability: true }).ranked;
      for (const r of a) {
        const r2 = b.find((x) => x.label === r.label)!;
        expect(Math.abs(r.score - r2.score), `${r.label} at ${c.toFixed(1)} cm`).toBeLessThan(0.01);
      }
    }
  });

  it("is monotone: a bigger chest never picks a smaller size", () => {
    let prev = -1;
    for (let c = 86; c <= 124; c += 0.5) {
      const i = ORDER.indexOf(recommend(input(c)).best.label);
      expect(i, `chest ${c}`).toBeGreaterThanOrEqual(prev);
      prev = i;
    }
  });

  it("does not depend on the order the chart lists its sizes", () => {
    const shuffled = [LADDER[2], LADDER[0], LADDER[3], LADDER[1]];
    for (const c of [92, 99.7, 108, 118]) {
      expect(recommend(input(c, shuffled)).best.label).toBe(recommend(input(c)).best.label);
    }
  });

  it("does not change its pick when a row is listed twice", () => {
    const doubled = [...LADDER, LADDER[1]];
    for (const c of [92, 99.7, 108]) {
      expect(recommend(input(c, doubled)).best.label).toBe(recommend(input(c)).best.label);
    }
  });
});
