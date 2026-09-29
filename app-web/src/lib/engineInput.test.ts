import { describe, it, expect } from "vitest";
import { engineSizes } from "./engineInput";

// `engineSizes` is the ONE place stored size rows become engine input, shared by
// /api/check, /api/recommend, the evaluation harness and the tests. A field it
// drops is a field no route can ever score — which is exactly what happened to
// waist until Session 78.
describe("engineSizes", () => {
  it("passes both ways a chart states waist", () => {
    const [garment, body] = engineSizes([
      { label: "M", waistCm: 88 },
      { label: "M", bodyWaistMinCm: 81.3, bodyWaistMaxCm: 88.9 },
    ]);
    expect(garment.waistCm).toBe(88);
    expect([body.bodyWaistMinCm, body.bodyWaistMaxCm]).toEqual([81.3, 88.9]);
  });

  it("keeps a body waist out of the garment field", () => {
    // Invariant ㊿: a body number in a garment slot gets the wearer's ease added
    // on top of their own measurement.
    const [body] = engineSizes([{ label: "M", bodyWaistMinCm: 81.3, bodyWaistMaxCm: 88.9 }]);
    expect(body.waistCm).toBeNull();
  });

  it("turns missing values into null rather than undefined", () => {
    // The engine distinguishes "not stated" with `!= null`; undefined and null
    // both pass that, but a stray 0 would not, so nothing is defaulted to a number.
    const [s] = engineSizes([{ label: "S" }]);
    for (const k of ["chestCm", "waistCm", "bodyChestMinCm", "bodyWaistMinCm", "shoulderCm"] as const) {
      expect(s[k]).toBeNull();
    }
  });
});
