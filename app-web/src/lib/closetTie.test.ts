// Session 101, the founder's own closet: a Muji XL (bought in China) and a Rythm M,
// checked against an Independent Trading hoodie chart (flat chest, inches). The two
// pieces put M and XL level, and the engine showed M because it came first.
import { describe, expect, it } from "vitest";
import { parseSizeGrid } from "./pageParse";
import { isUndetermined, recommend } from "./fitEngine";

const grid = [
  ["DESCRIPTION", "XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL", "6XL"],
  ["BODY LENGTH FROM HPS", "27.5", "28.5", "29.5", "30.5", "31.5", "32.5", "33.5", "34", "34.5", "35"],
  ["CHEST WIDTH 1\" BELOW ARMHOLE", "20.5", "21", "23", "24.5", "26.5", "27.5", "28.5", "30", "31.5", "33"],
  ["SLEEVE LENGTH FROM CENTER BACK TO HEM", "34.5", "35.5", "36.5", "37.5", "38.5", "39.5", "40.5", "41", "41.5", "42"],
];
const closet = [
  { id: "muji", brand: "Muji", category: "top", size: "XL", fitRating: 5 },
  { id: "rythm", brand: "Rythm", category: "shirt", size: "M", fitRating: 5 },
];

describe("two closet pieces that disagree", () => {
  const sizes = parseSizeGrid(grid, "")!.sizes as never;

  it("reads the chart: flat chest doubled, M = 46 in", () => {
    expect((sizes as Array<{ label: string; chestCm: number }>).find((s) => s.label === "M")!.chestCm).toBeCloseTo(116.8, 1);
  });

  it("is a tie that names both pieces, not an M", () => {
    for (const locale of ["en", "zh"] as const) {
      const out = recommend({ profile: { preferredFit: "regular" }, product: { category: "hoodie" }, sizes, knownGood: closet, outcomes: [] }, { locale });
      expect(out.undetermined).toBe(true);
      expect(isUndetermined(out.ranked)).toBe(true);
      expect(out.explanation).toMatch(/Muji XL/);
      expect(out.explanation).toMatch(/Rythm M/);
    }
  });

  it("a chest on file settles it", () => {
    const out = recommend({ profile: { chestCm: 110, preferredFit: "regular" }, product: { category: "hoodie" }, sizes, knownGood: closet, outcomes: [] });
    expect(out.undetermined).toBe(false);
    expect(out.best.label).toBe("L");
  });
});
