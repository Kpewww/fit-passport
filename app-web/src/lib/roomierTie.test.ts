// The founder's default (Session 103): fit first; on a near-tie, the slightly roomier size.
import { describe, expect, it } from "vitest";
import { recommend } from "./fitEngine";

const sizes = [
  { label: "S", bodyChestMinCm: 88, bodyChestMaxCm: 96 },
  { label: "M", bodyChestMinCm: 96, bodyChestMaxCm: 104 },
  { label: "L", bodyChestMinCm: 104, bodyChestMaxCm: 112 },
];
const at = (chestCm: number) =>
  recommend({ profile: { chestCm, preferredFit: "regular" }, product: { brand: "X", category: "tshirt" }, sizes, knownGood: [], outcomes: [] } as never);

describe("fit first, roomier on a near-tie", () => {
  it("on the boundary, the roomier size, with the snugger one as the alternative", () => {
    const r = at(104);
    expect(r.best.label).toBe("L");
    expect(r.best.reasons.some((x) => /roomier/.test(x.message))).toBe(true);
    expect(r.alternative).toMatch(/M is close/);
  });
  it("a clear fit is never overruled", () => {
    expect(at(100).best.label).toBe("M");
    expect(at(103).best.label).toBe("M"); // L only offered as the roomier alternative
    expect(at(103).alternative).toMatch(/L is close/);
  });
});
