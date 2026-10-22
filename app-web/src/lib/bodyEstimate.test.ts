import { describe, expect, it } from "vitest";
import { estimate, pieceConstraints, purchaseConstraints } from "./bodyEstimate";
import { bodyHeightFor, bodyHipFor, type BodyRange } from "./sizeRegimes";

const R = (minCm: number, maxCm: number): BodyRange => ({ minCm, maxCm, evidence: { grade: "A", source: "test", sourceZh: "test" } });
const XL = R(104, 112), L = R(96, 104), M = R(88, 96);

describe("a body estimate that narrows with evidence (Session 102)", () => {
  it("one piece that fits: its range", () => {
    expect(estimate(pieceConstraints({ label: "Muji XL", fitRating: 5, fitDirection: 0, body: { chest: XL } })).chest)
      .toMatchObject({ lo: 104, hi: 112, mid: 108 });
  });

  it("a tight piece alone is one-sided: no estimate", () => {
    expect(estimate(pieceConstraints({ label: "Uniqlo L", fitRating: 3, fitDirection: -5, body: { chest: L } })).chest).toBeUndefined();
  });

  it("a fitting XL and a tight XL: the upper half of XL", () => {
    const c = [
      ...pieceConstraints({ label: "Muji XL", fitRating: 5, fitDirection: 0, body: { chest: XL } }),
      ...pieceConstraints({ label: "Other XL", fitRating: 3, fitDirection: -6, body: { chest: XL } }),
    ];
    expect(estimate(c).chest).toMatchObject({ lo: 108, hi: 112, mid: 110 });
  });

  it("a loose piece caps from above", () => {
    const c = [
      ...pieceConstraints({ label: "A L", fitRating: 5, body: { chest: R(96, 112) } }),
      ...pieceConstraints({ label: "B XL", fitRating: 3, fitDirection: 6, body: { chest: XL } }),
    ];
    expect(estimate(c).chest).toMatchObject({ lo: 96, hi: 108 });
  });

  it("purchases: kept, returned small, returned big, exchanged", () => {
    expect(estimate(purchaseConstraints({ label: "X L", decision: "keep", bought: { chest: L } })).chest).toMatchObject({ lo: 96, hi: 104 });
    const small = purchaseConstraints({ label: "X M", decision: "return", fitDirection: -6, bought: { chest: M } });
    expect(small[0]).toMatchObject({ kind: "returned-small", lo: 92, hi: null });
    const big = purchaseConstraints({ label: "X XL", decision: "return", fitDirection: 6, bought: { chest: XL } });
    expect(big[0]).toMatchObject({ kind: "returned-big", lo: null, hi: 108 });
    expect(estimate(purchaseConstraints({ label: "X M", decision: "exchange", fitDirection: -6, bought: { chest: M }, exchangedLabel: "X L", exchangedTo: { chest: L } })).chest)
      .toMatchObject({ lo: 96, hi: 104 });
    expect(purchaseConstraints({ label: "X M", decision: "return", bought: { chest: M } })).toEqual([]);
  });

  it("returned too small, plus a fitting piece: narrows to the overlap", () => {
    const c = [
      ...pieceConstraints({ label: "Muji XL", fitRating: 5, body: { chest: R(100, 112) } }),
      ...purchaseConstraints({ label: "Nike L", decision: "return", fitDirection: -6, bought: { chest: R(104, 112) } }),
    ];
    expect(estimate(c).chest).toMatchObject({ lo: 108, hi: 112 });
  });

  it("sets aside, and names, evidence that contradicts stronger evidence", () => {
    const c = [
      ...purchaseConstraints({ label: "Nike L", decision: "keep", bought: { chest: L } }),
      ...pieceConstraints({ label: "Old S", fitRating: 5, body: { chest: R(80, 88) } }),
    ];
    const e = estimate(c).chest!;
    expect(e).toMatchObject({ lo: 96, hi: 104 });
    expect(e.ignored.map((x) => x.label)).toEqual(["Old S"]);
  });

  it("keeps dimensions apart", () => {
    const e = estimate(pieceConstraints({ label: "Q 175/96A", fitRating: 5, body: { chest: R(94, 98), height: R(172.5, 177.5) } }));
    expect(e.chest).toMatchObject({ mid: 96 });
    expect(e.height).toMatchObject({ mid: 175 });
  });
});

describe("hip and height tables (Session 102)", () => {
  it("reads women's hips by JIS L 4005 Table 15 and BS 3666 Table 1", () => {
    expect(bodyHipFor("M", "JP", "womens")).toMatchObject({ minCm: 87, maxCm: 95 });
    expect(bodyHipFor("LL", "JP", "womens")).toMatchObject({ minCm: 97, maxCm: 105 });
    expect(bodyHipFor("12", "UK", "womens")).toMatchObject({ minCm: 91, maxCm: 95 });
    expect(bodyHipFor("M", "JP", "mens")).toBeNull();
    expect(bodyHipFor("M", "US", "womens")).toBeNull();
  });
  it("reads height from a 号型 and from KS height suffixes", () => {
    expect(bodyHeightFor("175/96A", null, "mens")).toMatchObject({ minCm: 172.5, maxCm: 177.5 });
    expect(bodyHeightFor("L(T)", "KR", "mens")).toMatchObject({ minCm: 170, maxCm: 182 });
    expect(bodyHeightFor("S(P)", "KR", "womens")).toMatchObject({ minCm: 145, maxCm: 155 });
    expect(bodyHeightFor("M(P)", "KR", "mens")).toBeNull(); // KS K 0050 has no P for men
    expect(bodyHeightFor("M", "JP", "mens")).toBeNull();
  });
});
