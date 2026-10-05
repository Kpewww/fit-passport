// The engine's two languages (engineText.ts) — Session 79.
//
// The English is guarded by every other engine test, which assert on it
// verbatim and pass unchanged. This file guards the Chinese:
//   • every message, called, contains no English words (only brands, size labels
//     and units, which are the same in both languages);
//   • it follows the copy spec's spacing rule;
//   • choosing Chinese changes ONLY the words — every score, confidence and pick
//     is identical to the English run.

import { describe, expect, it } from "vitest";
import { EN_TEXT, ZH_TEXT, type EngineText } from "./engineText";
import { recommend, type EngineInput } from "./fitEngine";
import { refusalFor } from "./checkPolicy";
import { extractFromUrl } from "./extractor";

// One set of arguments per message. Typed from the interface, so a new message
// does not compile until it is listed here — and therefore tested.
type Args = { [K in keyof EngineText]: EngineText[K] extends (...a: infer A) => string ? A : null };
const ARGS: Args = {
  matchesFit: ["regular", ["chest", "shoulder"], true],
  bindingDimension: ["shoulder", "2.0", false],
  versusTarget: ["chest", "2.6", true, "relaxed"],
  anchorRunsHere: ["Uniqlo M", "snug"],
  anchorRunsSteps: ["0.5", false, "Uniqlo M", "too-loose"],
  anchorShifted: [true, "COS L", "oversized"],
  anchorAdjustedSteps: [2, "COS L", "slim"],
  anchorMatches: ["Uniqlo M", "tshirt"],
  anchorSteps: [1, "Uniqlo M"],
  exchanged: ["M", "L", "Uniqlo"],
  returned: ["M", null, "tight"],
  kept: ["L", "COS"],
  implausible: [["x", "y"]],
  implausibleChestWaist: [58, 110],
  implausibleShoulderChest: [46, 58],
  fragile: [98.5, 103, 2],
  disagree: ["known-good", "L", "M"],
  verdictOff: ["XL", "too big"],
  closetScattered: null,
  largestSize: ["relaxed"],
  smallestSize: ["slim"],
  alternative: ["L", "bigger"],
  undeterminedHelp: null,
  limitedData: null,
  crossDomain: [["bottom", "shoe"], "top"],
  easeContradiction: [3, "regular"],
  easeAdjusted: [{ more: true, garments: 3, targetCm: "14.5", statedCm: 10, pref: "regular", excluded: 1 }],
  brandRuns: [true, 2, "Uniqlo"],
  refuseUnreadable: null,
  refuseNotApparel: null,
  refuseNotApparelPage: null,
  refuseUnsupported: ["shoe"],
  refuseNoChartExtension: null,
  refuseNoChartServer: null,
  notConnected: null,
  verdictName: ["snug"],
  refuseListingNoMeasurements: null,
  listingFlat: [{ field: "chest", value: 24, unit: "in", cm: 121.9, typed: false, unitInferred: true }],
  listingVsGarment: [{ refLabel: "Uniqlo L", refCm: 118, dir: "snug", deltaCm: 3.9 }],
  listingVsBody: [{ dim: "chest", targetCm: 110, bodyCm: 100, pref: "regular" }],
  listingVsLabel: [{ label: "L", refLabel: "COS L", dir: null }],
  listingEstimatedBody: null,
  listingFragile: [2.6],
  listingNothingToCompare: null,
};

function render(M: EngineText): Array<[string, string]> {
  return (Object.keys(ARGS) as Array<keyof EngineText>).map((k) => {
    const v = M[k];
    const a = ARGS[k];
    return [k, typeof v === "function" ? (v as (...x: unknown[]) => string)(...(a as unknown[])) : (v as string)];
  });
}

// Words that are the same in both languages: brands and codes from the args
// above, size labels, units, and the product's own name.
const SAME_IN_BOTH = new Set(["Uniqlo", "COS", "XL", "XXL", "cm", "Polo", "AI", "Fit", "Passport", "Cookie"]);
const englishWords = (s: string) => (s.match(/[A-Za-z]{2,}/g) ?? []).filter((w) => !SAME_IN_BOTH.has(w));
// The copy spec writes "T 恤" and "Polo 衫" with the space, like every Latin letter
// beside a Chinese one.
const tightSpacing = (s: string) => /[一-鿿][A-Za-z0-9]|[A-Za-z0-9][一-鿿]/.test(s);

describe("the engine's Chinese", () => {
  it("says every message without English words", () => {
    const leaks = render(ZH_TEXT).filter(([, s]) => englishWords(s).length).map(([k, s]) => `${k}: ${s}`);
    expect(leaks).toEqual([]);
  });

  it("follows the spacing rule", () => {
    const tight = render(ZH_TEXT).filter(([, s]) => tightSpacing(s)).map(([k, s]) => `${k}: ${s}`);
    expect(tight).toEqual([]);
  });

  it("is a different sentence from the English for every message", () => {
    const en = new Map(render(EN_TEXT));
    const same = render(ZH_TEXT).filter(([k, s]) => en.get(k) === s).map(([k]) => k);
    expect(same).toEqual([]);
  });
});

// A shopper and a closet that between them produce most of the engine's notes:
// a measurement reason, a closet anchor with a direction, an outcome, brand bias,
// a contradictory set of measured reports, a scattered closet, a verdict note.
const INPUT: EngineInput = {
  profile: { chestCm: 100, waistCm: 86, shoulderCm: 46, preferredFit: "regular" },
  product: { brand: "Uniqlo", category: "tshirt" },
  sizes: [
    { label: "S", chestCm: 96, shoulderCm: 43 },
    { label: "M", chestCm: 104, shoulderCm: 45 },
    { label: "L", chestCm: 110, shoulderCm: 47 },
    { label: "XL", chestCm: 116, shoulderCm: 49 },
  ],
  knownGood: [
    { brand: "Uniqlo", category: "tshirt", size: "M", fitRating: 2, fitDirection: -5 },
    { brand: "COS", category: "shirt", size: "L", fitRating: 4, fitDirection: 10 },
    { brand: "Uniqlo", category: "sweater", size: "L", fitRating: 2, fitDirection: -10 },
  ],
  outcomes: [{ purchasedSize: "M", decision: "return", productBrand: "Uniqlo", productCategory: "tshirt", fitDirection: -8 }],
} as EngineInput;

describe("choosing Chinese changes only the words", () => {
  it("gives the same sizes, scores, confidences and stability", () => {
    const en = recommend(INPUT);
    const zh = recommend(INPUT, { locale: "zh" });
    const numbers = (o: typeof en) => ({
      ranked: o.ranked.map((r) => [r.label, r.score, r.confidence, r.verdict, r.reasons.map((x) => [x.signal, x.weight])]),
      stability: o.stability,
      undetermined: o.undetermined,
    });
    expect(numbers(zh)).toEqual(numbers(en));
  });

  it("writes the whole explanation, notes and reasons in Chinese", () => {
    const zh = recommend(INPUT, { locale: "zh" });
    const text = [zh.explanation, zh.conflictNote ?? "", zh.domainNote ?? "", zh.alternative ?? "", ...zh.ranked.flatMap((r) => r.reasons.map((x) => x.message))];
    expect(text.join(" ").length).toBeGreaterThan(40); // the scenario did produce prose
    expect(text.flatMap(englishWords)).toEqual([]);
  });

  it("refuses in Chinese", () => {
    const e = extractFromUrl("https://www.example-store.test/p/sneakers-runner");
    const zh = refusalFor(e, ZH_TEXT);
    const en = refusalFor(e, EN_TEXT);
    expect(zh?.error).toBe(en?.error);
    expect(zh && englishWords(zh.message)).toEqual([]);
  });
});
