import { describe, it, expect } from "vitest";
import { bodyPlausibility } from "./plausibility";
import { recommend } from "./fitEngine";
import { CONFIDENCE_CAPS } from "./scoringConstants";

describe("measurements that describe no plausible body", () => {
  it("passes ordinary and unusual-but-real bodies", () => {
    expect(bodyPlausibility({ chestCm: 100, waistCm: 86, shoulderCm: 46 })).toEqual([]);
    expect(bodyPlausibility({ chestCm: 120, waistCm: 76 })).toEqual([]); // strongly V-shaped
    expect(bodyPlausibility({ chestCm: 110, waistCm: 125 })).toEqual([]); // waist above chest
  });

  it("flags a pair that no body has — usually a typo", () => {
    expect(bodyPlausibility({ chestCm: 58, waistCm: 110 })).toEqual(["chest 58 cm with waist 110 cm"]);
    expect(bodyPlausibility({ chestCm: 100, shoulderCm: 80 })).toEqual(["shoulder 80 cm with chest 100 cm"]);
  });

  it("lowers confidence and says which numbers, rather than refusing or changing them", () => {
    const sizes = [{ label: "S", chestCm: 64 }, { label: "M", chestCm: 70 }, { label: "L", chestCm: 76 }];
    const out = recommend({
      profile: { chestCm: 58, waistCm: 110, preferredFit: "regular" },
      product: { brand: "X", category: "tshirt" }, sizes, knownGood: [], outcomes: [],
    });
    expect(out.best.confidence).toBeLessThanOrEqual(CONFIDENCE_CAPS.implausibleBody);
    expect(out.conflictNote).toMatch(/chest 58 cm with waist 110 cm/);
    expect(out.ranked.length).toBe(3); // still answered
  });
});
