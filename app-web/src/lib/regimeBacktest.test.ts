// Session 101e: a backtest of reading closet labels by their country's standard.
//
// SYNTHETIC, and says so. Made-up wearers (men, chest 80-124 cm) each own one piece
// that fits, labelled by a standard: the size whose body range in that standard holds
// their chest. Each then checks a product with a real published body chart (Nike's
// men's tops, brandCharts.ts). The right answer is the Nike size whose own range
// holds their chest. The test compares:
//   before: the closet piece placed by its LETTER only (the engine before Session 101);
//   after:  the piece read by its standard into a chest estimate (closetChest.ts).
// It shows the mechanism is right. It is NOT a measured accuracy for real people:
// real garments drift from their standard, and only pilot outcomes can say by how much.
import { describe, expect, it } from "vitest";
import { recommend } from "./fitEngine";
import { chestFromCloset } from "./closetChest";
import { bodyChestFor, type Regime } from "./sizeRegimes";
import { BRAND_CHARTS, chartToSizes } from "./brandCharts";

const nike = BRAND_CHARTS.find((c) => c.brand === "Nike" && c.gender !== "womens")!;
const target = chartToSizes(nike) as never as Array<{ label: string; bodyChestMinCm: number; bodyChestMaxCm: number }>;

const LABELS: Record<string, string[]> = {
  JP: ["SS", "S", "M", "L", "LL", "3L", "4L", "5L"],
  KR: ["M", "L", "XL"],
  EU: ["XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL"],
};
const pieceFor = (regime: Regime, chest: number) =>
  LABELS[regime].find((l) => { const r = bodyChestFor(l, regime, "mens"); return r && chest >= r.minCm && chest < r.maxCm; }) ?? null;
const rightFor = (chest: number) => target.find((s) => chest >= s.bodyChestMinCm && chest < s.bodyChestMaxCm)?.label ?? null;
const step = (a: string, b: string) => Math.abs(target.findIndex((s) => s.label === a) - target.findIndex((s) => s.label === b));
const asAlpha = (l: string) => ({ SS: "XS", LL: "XL", "3L": "XXL", "4L": "XXXL", "5L": "4XL" } as Record<string, string>)[l] ?? l;

function backtest(regime: Regime) {
  let n = 0, beforeHit = 0, afterHit = 0, beforeNear = 0, afterNear = 0;
  for (let chest = 80; chest <= 124; chest += 1) {
    const label = pieceFor(regime, chest + 0.5);
    const right = rightFor(chest + 0.5);
    if (!label || !right) continue;
    n++;
    // Before: the label as a letter, no chest on file (the old behaviour).
    const before = recommend({
      profile: { preferredFit: "regular" }, product: { category: "tshirt", brand: "Nike" }, sizes: target as never,
      knownGood: [{ brand: "Other", category: "tshirt", size: asAlpha(label), fitRating: 5 }], outcomes: [],
    }, { skipStability: true }).best.label;
    const est = chestFromCloset([{ brand: "Other", category: "tshirt", size: label, fitRating: 5, region: regime }], () => null);
    const after = recommend({
      profile: { preferredFit: "regular", chestCm: est?.chestCm ?? null, chestIsEstimated: true },
      product: { category: "tshirt", brand: "Nike" }, sizes: target as never,
      knownGood: [{ brand: "Other", category: "tshirt", size: asAlpha(label), fitRating: 5 }], outcomes: [],
    }, { skipStability: true }).best.label;
    if (before === right) beforeHit++;
    if (after === right) afterHit++;
    if (step(before, right) <= 1) beforeNear++;
    if (step(after, right) <= 1) afterNear++;
  }
  return { regime, n, beforeHit, afterHit, beforeNear, afterNear };
}

const EXPECTED: Record<string, ReturnType<typeof backtest>> = {
  JP: { regime: "JP", n: 45, beforeHit: 1, afterHit: 40, beforeNear: 41, afterNear: 45 },
  KR: { regime: "KR", n: 23, beforeHit: 0, afterHit: 14, beforeNear: 14, afterNear: 23 },
  EU: { regime: "EU", n: 45, beforeHit: 32, afterHit: 32, beforeNear: 45, afterNear: 45 },
};

describe("backtest: closet labels read by their standard, against Nike's chart (synthetic)", () => {
  for (const regime of ["JP", "KR", "EU"] as Regime[]) {
    it(`${regime}: reading by the standard is never worse, and better where letters differ`, () => {
      const r = backtest(regime);
      expect(r.n).toBeGreaterThan(10);
      expect(r.afterHit).toBeGreaterThanOrEqual(r.beforeHit);
      expect(r.afterNear).toBeGreaterThanOrEqual(r.beforeNear);
      // The numbers in docs/design/size-calibration.md §2, pinned.
      expect(r).toEqual(EXPECTED[regime]);
    });
  }
});
