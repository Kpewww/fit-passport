// Session 101, the founder's own closet: a Muji XL (bought in China) and a Rythm M,
// checked against an Independent Trading hoodie chart (flat chest, inches). The two
// pieces put M and XL level, and the engine showed M because it came first.
import { describe, expect, it } from "vitest";
import { parseSizeGrid } from "./pageParse";
import { isUndetermined, recommend } from "./fitEngine";
import { chestFromCloset } from "./closetChest";
import { lookupBrand } from "./brandRegistry";

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

  it("with the standards in hand, the Muji XL reads as Japanese (JIS L 4004) and settles it", () => {
    // The path recommendService takes when no chest is on file (Session 101d).
    const est = chestFromCloset(closet, (b) => lookupBrand(b)?.country ?? null)!;
    expect(est).toMatchObject({ lo: 104, hi: 112, chestCm: 108 });
    const out = recommend({
      profile: { chestCm: est.chestCm, chestIsEstimated: true, chestNote: "from the Muji XL", preferredFit: "regular" },
      product: { category: "hoodie" }, sizes, knownGood: closet, outcomes: [],
    });
    expect(out.undetermined).toBe(false);
    expect(["L", "XL"]).toContain(out.best.label);
  });

  it("the Muji piece itself votes by centimetres (Session 101h), not by its letter", () => {
    const withBody = [{ ...closet[0], bodyChest: { minCm: 104, maxCm: 112 } }, closet[1]];
    const out = recommend({
      profile: { chestCm: 108, chestIsEstimated: true, preferredFit: "regular" },
      product: { category: "hoodie" }, sizes, knownGood: withBody, outcomes: [],
    });
    expect(out.best.label).toBe("L");
    const l = out.ranked.find((r) => r.label === "L")!;
    // The Muji anchor now points at L: body 108 + regular hoodie ease is nearest L's 124.5 cm.
    expect(l.reasons.some((r) => r.signal === "known-good" && r.itemId === "muji" && r.weight > 0)).toBe(true);
  });

  it("a chest from the closet is not called a regional average (Session 102)", () => {
    for (const locale of ["en", "zh"] as const) {
      const out = recommend({
        profile: { chestCm: 110, chestIsEstimated: true, chestNote: "from the Muji XL", preferredFit: "regular" },
        product: { category: "hoodie" }, sizes, knownGood: closet, outcomes: [],
      }, { locale });
      expect(out.explanation).not.toMatch(/regional|地区平均/);
      const prior = recommend({
        profile: { chestCm: 110, chestIsEstimated: true, preferredFit: "regular" },
        product: { category: "hoodie" }, sizes, knownGood: [], outcomes: [],
      }, { locale });
      expect(prior.explanation).toMatch(/regional|地区平均/);
    }
  });
});
