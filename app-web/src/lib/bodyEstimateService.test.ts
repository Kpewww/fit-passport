import { describe, expect, it } from "vitest";
import { buildBodyEvidence } from "./bodyEstimateService";
import { calibrate, type Observation } from "./brandCalibration";

const piece = (id: string, brand: string, category: string, size: string, fitDirection: number | null, extra = {}) =>
  ({ id, brand, category, size, fitRating: 5, fitDirection, region: null, gender: null, displayName: null, ...extra });
const nikeSizes = [
  { label: "M", chestCm: null, bodyChestMinCm: 95.3, bodyChestMaxCm: 104.1, bodyWaistMinCm: null, bodyWaistMaxCm: null, bodyHipMinCm: null, bodyHipMaxCm: null },
  { label: "L", chestCm: null, bodyChestMinCm: 104.1, bodyChestMaxCm: 111.8, bodyWaistMinCm: null, bodyWaistMaxCm: null, bodyHipMinCm: null, bodyHipMaxCm: null },
];
const bought = (purchasedSize: string, decision: string, fitDirection: number | null, exchangedForSize: string | null = null) =>
  ({ purchasedSize, decision, exchangedForSize, fitDirection, product: { brand: "Nike", category: "tshirt", rawJson: null, sizeOptions: nikeSizes } });

describe("the body estimate from what is stored (Session 102)", () => {
  it("the founder's Muji XL alone: JIS LL", () => {
    const e = buildBodyEvidence([piece("a", "Muji", "tank", "XL", 0)], [], null, []).estimates;
    expect(e.chest).toMatchObject({ lo: 104, hi: 112 });
  });

  it("narrows with a tight piece, then with a return", () => {
    const one = buildBodyEvidence([piece("a", "Muji", "tank", "XL", 0)], [], null, []).estimates.chest!;
    const two = buildBodyEvidence([piece("a", "Muji", "tank", "XL", 0), piece("b", "Uniqlo", "tshirt", "XL", -6)], [], null, []).estimates.chest!;
    const three = buildBodyEvidence([piece("a", "Muji", "tank", "XL", 0), piece("b", "Uniqlo", "tshirt", "XL", -6)], [bought("L", "return", -6)], null, []).estimates.chest!;
    expect(one.hi - one.lo).toBe(8);
    expect(two).toMatchObject({ lo: 108, hi: 112 });
    expect(three.lo).toBeGreaterThanOrEqual(two.lo);
    expect(three.used.map((c) => c.kind)).toContain("returned-small");
  });

  it("an exchange is the strongest word: the size swapped to", () => {
    const e = buildBodyEvidence([], [bought("M", "exchange", -6, "L")], null, []).estimates.chest!;
    expect(e).toMatchObject({ lo: 104.1, hi: 111.8 });
    expect(e.used[0]).toMatchObject({ kind: "exchanged", label: "Nike L" });
  });

  it("reads waist from bottoms, height from a 号型, and keeps the piece's chest for the engine", () => {
    const r = buildBodyEvidence([piece("j", "Uniqlo", "jeans", "M", 0), piece("t", "Bosideng", "jacket", "175/96A", 0)], [], null, []);
    expect(r.estimates.waist).toMatchObject({ lo: 76, hi: 84 });
    expect(r.estimates.height).toMatchObject({ lo: 172.5, hi: 177.5 });
    expect(r.pieceChest.get("t")).toMatchObject({ minCm: 94, maxCm: 98 });
    expect(r.pieceChest.get("j")).toBeNull();
  });

  it("a US letter: nothing without charts, the consensus once three US brands report it (Session 103)", () => {
    const tee = piece("u", "Some Co", "tshirt", "M", 0, { region: "US", gender: "mens" });
    expect(buildBodyEvidence([tee], [], null, []).estimates.chest).toBeUndefined();
    const o = (b: string, i: number, n: number): Observation =>
      ({ brand: b, url: `https://${b}.com/p${n}`, line: "mens", label: "M", bodyChestMinCm: 96 + i, bodyChestMaxCm: 104 + i });
    const reports = calibrate(["A", "B", "C"].flatMap((b, i) => [o(b, i, 1), o(b, i, 2)]), () => "US");
    const r = buildBodyEvidence([tee], [], null, reports);
    expect(r.estimates.chest).toMatchObject({ lo: 97, hi: 105 });
    expect(r.pieceChest.get("u")!.evidence.grade).toBe("B");
  });
});
