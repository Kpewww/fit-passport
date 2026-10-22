// Session 102: does the estimate narrow, and stay right, as evidence accumulates?
//
// SYNTHETIC, like regimeBacktest.test.ts. Made-up men, chest 80.5-123.5 cm, each:
//   1. owns one Japanese piece that fits (the JIS letter whose range holds their chest);
//   2. also owns a second piece of that letter, which they call tight if their chest
//      is in its upper half and loose otherwise (how a person near a boundary feels it);
//   3. also returned a Nike size: the one just below their right Nike size, as too small.
// After each stage: the estimate's width, whether it still holds their true chest, and
// whether the check against Nike's chart picks their right size.
import { describe, expect, it } from "vitest";
import { recommend } from "./fitEngine";
import { estimate, pieceConstraints, purchaseConstraints, type Constraint } from "./bodyEstimate";
import { bodyChestFor, type BodyRange } from "./sizeRegimes";
import { BRAND_CHARTS, chartToSizes } from "./brandCharts";

const nike = chartToSizes(BRAND_CHARTS.find((c) => c.brand === "Nike" && c.gender !== "womens")!) as never as Array<{ label: string; bodyChestMinCm: number; bodyChestMaxCm: number }>;
const JP = ["SS", "S", "M", "L", "LL", "3L", "4L", "5L"];
const range = (b: { bodyChestMinCm: number; bodyChestMaxCm: number }): BodyRange => ({ minCm: b.bodyChestMinCm, maxCm: b.bodyChestMaxCm, evidence: { grade: "B", source: "Nike", sourceZh: "Nike" } });

function run() {
  const stages = [0, 1, 2].map(() => ({ n: 0, widthSum: 0, holds: 0, right: 0 }));
  for (let chest = 80.5; chest <= 123.5; chest += 1) {
    const jp = JP.map((l) => ({ l, r: bodyChestFor(l, "JP", "mens")! })).find(({ r }) => chest >= r.minCm && chest < r.maxCm);
    const ni = nike.findIndex((s) => chest >= s.bodyChestMinCm && chest < s.bodyChestMaxCm);
    if (!jp || ni < 1) continue;
    const cs: Constraint[][] = [];
    cs[0] = pieceConstraints({ label: `Muji ${jp.l}`, fitRating: 5, fitDirection: 0, body: { chest: jp.r } });
    const upper = chest > (jp.r.minCm + jp.r.maxCm) / 2;
    cs[1] = [...cs[0], ...pieceConstraints({ label: `Other ${jp.l}`, fitRating: 3, fitDirection: upper ? -5 : 5, body: { chest: jp.r } })];
    cs[2] = [...cs[1], ...purchaseConstraints({ label: `Nike ${nike[ni - 1].label}`, decision: "return", fitDirection: -6, bought: { chest: range(nike[ni - 1]) } })];
    cs.forEach((c, i) => {
      const e = estimate(c).chest;
      if (!e) return;
      const st = stages[i];
      st.n++; st.widthSum += e.hi - e.lo;
      if (chest >= e.lo && chest <= e.hi) st.holds++;
      const pick = recommend({ profile: { chestCm: e.mid, chestIsEstimated: true, preferredFit: "regular" }, product: { category: "tshirt", brand: "Nike" }, sizes: nike as never, knownGood: [], outcomes: [] }, { skipStability: true }).best.label;
      if (pick === nike[ni].label) st.right++;
    });
  }
  return stages.map((s) => ({ n: s.n, meanWidthCm: Math.round((s.widthSum / s.n) * 10) / 10, holds: s.holds, right: s.right }));
}

describe("estimate backtest (synthetic): narrows as evidence accumulates", () => {
  it("each stage is narrower, still holds the true chest, and picks right at least as often", () => {
    const [one, two, three] = run();
    expect(two.meanWidthCm).toBeLessThan(one.meanWidthCm);
    expect(three.meanWidthCm).toBeLessThanOrEqual(two.meanWidthCm);
    expect(two.holds).toBe(two.n);
    expect(three.holds).toBe(three.n);
    expect(two.right).toBeGreaterThanOrEqual(one.right);
    expect(three.right).toBeGreaterThanOrEqual(two.right);
    // Pinned: the numbers in docs/design/size-calibration.md §2b.
    expect([one, two, three]).toEqual(EXPECTED);
  });
});

const EXPECTED = [
  { n: 35, meanWidthCm: 8, holds: 35, right: 31 },
  { n: 35, meanWidthCm: 4, holds: 35, right: 33 },
  // A return one size below adds no new floor here: the tight/loose report already set
  // it higher. Kept as measured, not tuned.
  { n: 35, meanWidthCm: 4, holds: 35, right: 33 },
];
