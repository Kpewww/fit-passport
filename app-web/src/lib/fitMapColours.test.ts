// The fit map colours what the zones say and nothing more (Session 97).
import { describe, expect, it } from "vitest";
import { FADE_CM, FORM_COLOUR, REGION, VERDICT_COLOUR, colourAtHeight, fitMapColours, linearRgb, type BodyGeometryData } from "./fitMapColours";

// Five vertices up one line: below the waist, at the waist, between, at the chest, far above.
const body = (regions?: Uint8Array): BodyGeometryData => ({
  positions: new Float32Array([0, 80, 0, 0, 100, 0, 0, 115, 0, 0, 130, 0, 0, 160, 0]),
  indices: new Uint16Array([0, 1, 2]),
  regions,
  landmarks: { waist: 100, chest: 130, shoulder: 145 },
});
const at = (c: Float32Array, v: number) => [c[v * 3], c[v * 3 + 1], c[v * 3 + 2]];

describe("the fit map's colours", () => {
  it("puts each verdict's colour exactly on its part", () => {
    const c = fitMapColours(body(), [
      { key: "waist", deltaCm: -3, verdict: "snug" },
      { key: "chest", deltaCm: 4, verdict: "relaxed" },
    ]);
    at(c, 1).forEach((x, i) => expect(x).toBeCloseTo(linearRgb(VERDICT_COLOUR.snug)[i], 6));
    at(c, 3).forEach((x, i) => expect(x).toBeCloseTo(linearRgb(VERDICT_COLOUR.relaxed)[i], 6));
  });

  it("blends straight between two parts, and fades into the form beyond the last", () => {
    const stops = [{ y: 0, colour: [0, 0, 0] as [number, number, number] }, { y: 10, colour: [1, 1, 1] as [number, number, number] }];
    colourAtHeight(5, stops, [0.5, 0.5, 0.5]).forEach((x) => expect(x).toBeCloseTo(0.5, 9));
    colourAtHeight(10 + FADE_CM, stops, [0.2, 0.2, 0.2]).forEach((x) => expect(x).toBeCloseTo(0.2, 9));
    expect(colourAtHeight(10 + FADE_CM / 2, stops, [0, 0, 0])[0]).toBeCloseTo(0.5, 6);
  });

  it("leaves the whole body the form's grey when there are no zones — nothing to say", () => {
    const c = fitMapColours(body(), undefined);
    const form = linearRgb(FORM_COLOUR);
    for (let v = 0; v < 5; v++) at(c, v).forEach((x, i) => expect(x).toBeCloseTo(form[i], 6));
  });

  it("colours only the torso: a top's chest says nothing about an arm", () => {
    const regions = new Uint8Array([REGION.torso, REGION.torso, REGION.torso, REGION.arm, REGION.torso]);
    const c = fitMapColours(body(regions), [{ key: "chest", deltaCm: -7, verdict: "too small" }]);
    const form = linearRgb(FORM_COLOUR);
    at(c, 3).forEach((x, i) => expect(x).toBeCloseTo(form[i], 6));
  });

  it("colours a leg by the hip alone", () => {
    const regions = new Uint8Array([REGION.leg, REGION.leg, REGION.torso, REGION.torso, REGION.torso]);
    const b = { ...body(regions), landmarks: { ...body().landmarks, hip: 80 } };
    const c = fitMapColours(b, [{ key: "hip", deltaCm: -7, verdict: "too small" }, { key: "waist", deltaCm: 3, verdict: "relaxed" }]);
    at(c, 0).forEach((x, i) => expect(x).toBeCloseTo(linearRgb(VERDICT_COLOUR["too small"])[i], 6));
    const form = linearRgb(FORM_COLOUR);
    // 20 cm above the hip, a leg vertex has faded to the form; the waist does not reach it.
    at(c, 1).forEach((x, i) => expect(x).toBeCloseTo(form[i], 6));
  });

  it("ignores a part the body has no landmark for", () => {
    const c = fitMapColours(body(), [{ key: "hip", deltaCm: 2, verdict: "relaxed" }]);
    const form = linearRgb(FORM_COLOUR);
    at(c, 1).forEach((x, i) => expect(x).toBeCloseTo(form[i], 6));
  });

  it("tells a part that fits apart from a part nobody measured", () => {
    expect(VERDICT_COLOUR["true to size"]).not.toBe(FORM_COLOUR);
  });
});
