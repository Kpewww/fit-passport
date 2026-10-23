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

  it("single points (Arc'teryx): the nearest printed point", () => {
    const t = truth("cm", [{ label: "S", chest: 94 }, { label: "M", chest: 102 }, { label: "L", chest: 109 }]);
    expect(acceptableSizes(t, 92)).toEqual(["S"]);
    expect(acceptableSizes(t, 100)).toEqual(["M"]);
    expect(acceptableSizes(t, 108)).toEqual(["L"]);
    expect(acceptableSizes(t, 98)).toEqual(["S", "M"]); // exactly between: both
  });

  it("a label printed twice is one size (Patagonia's two XS rows)", () => {
    const t = truth("in", [{ label: "XS", chest: 36 }, { label: "XS", chest: 37 }, { label: "S", chest: 38 }, { label: "S", chest: 39 }]);
    expect(acceptableSizes(t, 36.6 * 2.54)).toEqual(["XS"]);
    expect(acceptableSizes(t, 38.9 * 2.54)).toEqual(["S"]);
  });

  it("garment charts and one-point charts are not scored", () => {
    expect(acceptableSizes({ id: "g", verifiedBy: [], outcome: "answer", chart: { where: "page-table", kind: "garment", units: "cm", sizes: [{ label: "M", chest: 100 }, { label: "L", chest: 106 }] } } as never, 100)).toBeNull();
    expect(acceptableSizes(truth("cm", [{ label: "M", chest: 100 }]), 100)).toBeNull();
  });
});
