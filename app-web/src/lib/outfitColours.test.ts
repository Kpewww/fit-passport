import { describe, expect, it } from "vitest";
import { REGION, linearRgb, type BodyGeometryData } from "./fitMapColours";
import { coverFor, outfitColours } from "./outfitColours";

// A stick body: one vertex per (region, height). Floor 0, hip 90, waist 105, chest 125,
// shoulder 145; arms hang from 145 down to 75. Knee = 0.55 × 90 = 49.5, ankle 7.2.
const V: Array<[number, number]> = [
  [REGION.torso, 140], [REGION.torso, 120], [REGION.torso, 100], [REGION.torso, 92], [REGION.torso, 85],
  [REGION.arm, 140], [REGION.arm, 110], [REGION.arm, 78],
  [REGION.leg, 80], [REGION.leg, 40], [REGION.leg, 3],
  [REGION.head, 160],
];
const body: BodyGeometryData = {
  positions: new Float32Array(V.flatMap(([, y]) => [0, y, 0])),
  indices: new Uint32Array([0, 1, 2]),
  regions: new Uint8Array(V.map(([r]) => r)),
  landmarks: { hip: 90, waist: 105, chest: 125, shoulder: 145 },
};
const at = (cols: Float32Array, i: number) => Array.from(cols.slice(i * 3, i * 3 + 3));
const rgb = (hex: string) => linearRgb(hex).map((c) => Math.fround(c));
const BARE = "#9aa0ad", RED = "#cc0000", BLUE = "#0000cc", BLACK = "#111111";
const idx = (region: number, y: number) => V.findIndex(([r, h]) => r === region && h === y);

describe("an outfit painted on a 3D body", () => {
  it("knows where each kind of garment goes, by its engine key", () => {
    expect(coverFor("tshirt")).toBe("top-short");
    expect(coverFor("hoodie")).toBe("top-long");
    expect(coverFor("jeans")).toBe("bottom-long");
    expect(coverFor("shorts")).toBe("bottom-short");
    expect(coverFor("dress")).toBe("dress");
    expect(coverFor("sneakers")).toBe("shoe");
    expect(coverFor("watch")).toBe("none");
  });

  it("a T-shirt covers the torso above the hip and the top of the arm only", () => {
    const c = outfitColours(body, [{ category: "tshirt", colour: RED }], BARE);
    expect(at(c, idx(REGION.torso, 120))).toEqual(rgb(RED));
    expect(at(c, idx(REGION.torso, 85))).toEqual(rgb(BARE));
    expect(at(c, idx(REGION.arm, 140))).toEqual(rgb(RED));
    expect(at(c, idx(REGION.arm, 110))).toEqual(rgb(BARE));
  });

  it("a long sleeve reaches the wrist but leaves the hand", () => {
    const c = outfitColours(body, [{ category: "sweater", colour: RED }], BARE);
    expect(at(c, idx(REGION.arm, 110))).toEqual(rgb(RED));
    expect(at(c, idx(REGION.arm, 78))).toEqual(rgb(BARE));
  });

  it("a top is drawn over trousers where they meet; trousers stop at the ankle; shoes below", () => {
    const c = outfitColours(body, [
      { category: "tshirt", colour: RED }, { category: "jeans", colour: BLUE }, { category: "sneakers", colour: BLACK },
    ], BARE);
    expect(at(c, idx(REGION.torso, 100))).toEqual(rgb(RED)); // between waist and hip: the top's
    expect(at(c, idx(REGION.torso, 85))).toEqual(rgb(BLUE));
    expect(at(c, idx(REGION.leg, 40))).toEqual(rgb(BLUE));
    expect(at(c, idx(REGION.leg, 3))).toEqual(rgb(BLACK));
  });

  it("shorts and a skirt leave the lower leg bare", () => {
    const shorts = outfitColours(body, [{ category: "shorts", colour: BLUE }], BARE);
    expect(at(shorts, idx(REGION.leg, 80))).toEqual(rgb(BLUE));
    expect(at(shorts, idx(REGION.leg, 40))).toEqual(rgb(BARE));
    const skirt = outfitColours(body, [{ category: "skirt", colour: BLUE }], BARE);
    expect(at(skirt, idx(REGION.leg, 40))).toEqual(rgb(BARE));
  });

  it("a dress covers the whole torso and the legs to the knee, and a jacket over it wins the torso", () => {
    const c = outfitColours(body, [{ category: "dress", colour: BLUE }, { category: "jacket", colour: RED }], BARE);
    expect(at(c, idx(REGION.torso, 85))).toEqual(rgb(BLUE));
    expect(at(c, idx(REGION.torso, 120))).toEqual(rgb(RED));
    expect(at(c, idx(REGION.leg, 80))).toEqual(rgb(BLUE));
    expect(at(c, idx(REGION.leg, 40))).toEqual(rgb(BARE));
  });

  it("never paints the head, and an empty outfit is the bare body", () => {
    const c = outfitColours(body, [{ category: "jumpsuit", colour: RED }], BARE);
    expect(at(c, idx(REGION.head, 160))).toEqual(rgb(BARE));
    const none = outfitColours(body, [], BARE);
    for (let i = 0; i < V.length; i++) expect(at(none, i)).toEqual(rgb(BARE));
  });

  it("on the dress form (no regions) only the torso cover shows", () => {
    const form: BodyGeometryData = { ...body, regions: null };
    const c = outfitColours(form, [{ category: "tshirt", colour: RED }, { category: "sneakers", colour: BLACK }], BARE);
    expect(at(c, idx(REGION.torso, 120))).toEqual(rgb(RED));
    expect(at(c, idx(REGION.leg, 3))).toEqual(rgb(BARE)); // a "leg" vertex is torso here, and no shoe covers torso
  });
});
