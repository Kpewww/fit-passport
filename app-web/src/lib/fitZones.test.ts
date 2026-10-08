// Per-part fit for the 3D fit view (Session 96). The view colours the body from these,
// so they must be the score's own numbers, never a second opinion.
import { describe, expect, it } from "vitest";
import { recommend, verdictFromDelta, zoneVerdict, type EngineInput } from "./fitEngine";

const SIZES = [
  { label: "S", chestCm: 100, waistCm: 92, shoulderCm: 44 },
  { label: "M", chestCm: 106, waistCm: 98, shoulderCm: 46 },
  { label: "L", chestCm: 112, waistCm: 104, shoulderCm: 48 },
];
const input = (profile: Partial<EngineInput["profile"]>): EngineInput => ({
  profile: { chestCm: null, waistCm: null, shoulderCm: null, preferredFit: "regular", ...profile },
  product: { brand: "Test", category: "tshirt" },
  sizes: SIZES,
  knownGood: [],
  outcomes: [],
});

describe("how a size sits on each part of the body", () => {
  it("gives every measured part, and agrees with the size's own verdict on the chest", () => {
    const out = recommend(input({ chestCm: 96, waistCm: 86, shoulderCm: 45 }));
    for (const r of out.ranked) {
      expect(r.zones?.map((z) => z.key).sort()).toEqual(["chest", "shoulder", "waist"]);
      expect(r.zones?.find((z) => z.key === "chest")?.verdict).toBe(r.verdict);
    }
  });

  it("names a part only when both the wearer and the chart gave it", () => {
    const out = recommend(input({ chestCm: 96 }));
    expect(out.ranked[0].zones?.map((z) => z.key)).toEqual(["chest"]);
    expect(recommend(input({})).ranked[0].zones).toBeUndefined();
  });

  it("reads room as plus and short as minus, in centimetres", () => {
    const m = recommend(input({ shoulderCm: 45 })).ranked.find((r) => r.label === "S")!;
    // A 44 cm shoulder on a 45 cm wearer, who wants 1 cm: 2 cm short.
    expect(m.zones).toEqual([{ key: "shoulder", deltaCm: -2, verdict: zoneVerdict(-2, 2.5) }]);
  });

  it("turns tight at the shoulder sooner than at the chest, as the score does", () => {
    expect(zoneVerdict(-3, 4)).toBe(verdictFromDelta(-3));
    expect(zoneVerdict(-3, 4)).toBe("snug");
    expect(zoneVerdict(-4, 2.5)).toBe("too small");
    expect(zoneVerdict(-4, 4)).toBe("snug");
  });
});
