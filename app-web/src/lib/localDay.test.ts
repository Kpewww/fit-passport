import { describe, expect, it } from "vitest";
import { dayDiff, localDay, monthGrid, shiftMonth } from "./localDay";

describe("calendar days (Session 104)", () => {
  it("a local day is the wearer's date", () => {
    expect(localDay(new Date(2026, 9, 24, 23, 30))).toBe("2026-10-24");
  });
  it("October 2026 starts on a Thursday and fills whole weeks", () => {
    const g = monthGrid(2026, 10);
    expect(g[0].slice(0, 5)).toEqual([null, null, null, null, "2026-10-01"]);
    expect(g.every((r) => r.length === 7)).toBe(true);
    expect(g.flat().filter(Boolean)).toHaveLength(31);
  });
  it("months wrap across years", () => {
    expect(shiftMonth(2026, 12, 1)).toEqual({ year: 2027, month: 1 });
    expect(shiftMonth(2026, 1, -1)).toEqual({ year: 2025, month: 12 });
    expect(dayDiff("2026-10-20", "2026-10-24")).toBe(4);
  });
});
