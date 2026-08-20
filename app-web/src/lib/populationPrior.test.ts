import { describe, expect, it } from "vitest";
import { regionBodyPrior } from "./populationPrior";

describe("populationPrior", () => {
  it("gives a coarse body for a known region + sex", () => {
    expect(regionBodyPrior("US", "male")).toEqual({ chestCm: 105, waistCm: 92, shoulderCm: 46 });
    const cn = regionBodyPrior("CN", "female")!;
    expect(cn.chestCm).toBe(85);
    expect(cn.waistCm).toBe(68); // 85 - 17
  });
  it("returns null when region or sex is unknown (never guesses sex)", () => {
    expect(regionBodyPrior("US", "unspecified")).toBeNull();
    expect(regionBodyPrior(null, "male")).toBeNull();
    expect(regionBodyPrior("MARS", "female")).toBeNull();
  });
  it("reflects that CN/JP means run smaller than US/EU", () => {
    expect(regionBodyPrior("CN", "male")!.chestCm).toBeLessThan(regionBodyPrior("US", "male")!.chestCm);
    expect(regionBodyPrior("JP", "female")!.chestCm).toBeLessThan(regionBodyPrior("EU", "female")!.chestCm);
  });
});
