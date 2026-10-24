// The evaluation's rule for the right size (eval/lib.ts acceptableSizes). Lives with
// the unit tests so `npm test` guards it; the evaluation itself runs separately.
import { describe, expect, it } from "vitest";
import { acceptableSizes } from "../../eval/lib";

const truth = (units: "in" | "cm", sizes: Array<Record<string, unknown>>) =>
  ({ id: "t", verifiedBy: [], outcome: "answer", chart: { where: "page-table", kind: "body", units, sizes } }) as never;

describe("the right size from a body chart", () => {
  it("ranges: the one containing the chest; in a gap, both neighbours", () => {
    const t = truth("cm", [{ label: "S", chestMin: 86, chestMax: 94 }, { label: "M", chestMin: 96, chestMax: 104 }]);
    expect(acceptableSizes(t, 90)).toEqual(["S"]);
    expect(acceptableSizes(t, 95)).toEqual(["S", "M"]);
  });

  it("single points (Arc'teryx): at a number, that size; between two, either", () => {
    const t = truth("cm", [{ label: "S", chest: 94 }, { label: "M", chest: 102 }, { label: "L", chest: 109 }]);
    expect(acceptableSizes(t, 94.3)).toEqual(["S"]);
    expect(acceptableSizes(t, 100)).toEqual(["S", "M"]); // "M, or S if you like it snugger"
    expect(acceptableSizes(t, 108)).toEqual(["M", "L"]);
    expect(acceptableSizes(t, 90)).toEqual(["S"]); // below the smallest: the end
    expect(acceptableSizes(t, 115)).toEqual(["L"]);
  });

  it("a label printed twice spans both numbers (Patagonia's two XS rows)", () => {
    const t = truth("in", [{ label: "XS", chest: 36 }, { label: "XS", chest: 37 }, { label: "S", chest: 38 }, { label: "S", chest: 39 }, { label: "M", chest: 40 }]);
    expect(acceptableSizes(t, 36.6 * 2.54)).toEqual(["XS"]);
    expect(acceptableSizes(t, 37.5 * 2.54)).toEqual(["XS", "S"]);
    expect(acceptableSizes(t, 39.4 * 2.54)).toEqual(["S", "M"]); // the case that prompted the rule
  });

  it("garment charts and one-point charts are not scored", () => {
    expect(acceptableSizes({ id: "g", verifiedBy: [], outcome: "answer", chart: { where: "page-table", kind: "garment", units: "cm", sizes: [{ label: "M", chest: 100 }, { label: "L", chest: 106 }] } } as never, 100)).toBeNull();
    expect(acceptableSizes(truth("cm", [{ label: "M", chest: 100 }]), 100)).toBeNull();
  });
});

import { sameProduct } from "../../eval/lib";

describe("is the link still the same product? (Session 103, by standard name)", () => {
  it("small changes keep the case", () => {
    expect(sameProduct("AIRism Cotton T-Shirt", "Men's AIRism Cotton Crew Neck T-Shirt", "Uniqlo")).toBe(true);
    expect(sameProduct("AIRism Cotton T-Shirt", "UNIQLO AIRism Cotton T-shirt (Short Sleeve)", "Uniqlo")).toBe(true);
    expect(sameProduct("Better Sweater Fleece Jacket", "Men's Better Sweater® Fleece Jacket", "Patagonia")).toBe(true);
  });

  it("another product drops the case from scoring", () => {
    expect(sameProduct("AIRism Cotton T-Shirt", "Ultra Light Down Jacket", "Uniqlo")).toBe(false);
    expect(sameProduct("Atom Hoody", "Beta Jacket", "Arc'teryx")).toBe(false);
  });

  it("nothing to compare is not a change", () => {
    expect(sameProduct("AIRism Cotton T-Shirt", "", "Uniqlo")).toBe(true);
  });
});
