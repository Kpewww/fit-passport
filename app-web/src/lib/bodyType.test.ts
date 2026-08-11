import { describe, expect, it } from "vitest";
import { deriveBodyType } from "./bodyType";

describe("bodyType.deriveBodyType", () => {
  it("degrades gracefully with no data", () => {
    const r = deriveBodyType({});
    expect(r.volume).toBeNull();
    expect(r.shape).toBe("unknown");
    expect(r.inScope).toBe(true); // don't scope-flag if we don't know
    expect(r.figureKey).toBe("unknown");
    expect(r.have.volume).toBe(false);
  });

  it("puts a 175cm / 70kg person in 'average'", () => {
    const r = deriveBodyType({ heightCm: 175, weightKg: 70 });
    expect(r.volume).toBe("average");
    expect(r.bmi).toBeCloseTo(22.9, 1);
  });

  it("flags out-of-scope for extended volume, respectfully", () => {
    const r = deriveBodyType({ heightCm: 170, weightKg: 110 });
    expect(r.volume).toBe("extended");
    expect(r.inScope).toBe(false);
    expect(r.scopeNote).toContain("size charts");
    // Wording must be about the CHART, never a judgment of the person.
    expect(r.scopeNote?.toLowerCase() ?? "").not.toContain("your body is");
  });

  it("flags out-of-scope for petite volume too", () => {
    const r = deriveBodyType({ heightCm: 175, weightKg: 45 });
    expect(r.volume).toBe("petite");
    expect(r.inScope).toBe(false);
    expect(r.scopeNote).toContain("Petite");
  });

  it("derives torso shape from chest vs waist", () => {
    expect(deriveBodyType({ chestCm: 100, waistCm: 78 }).shape).toBe("tapered");
    expect(deriveBodyType({ chestCm: 95, waistCm: 90 }).shape).toBe("straight");
    expect(deriveBodyType({ chestCm: 95, waistCm: 100 }).shape).toBe("full-waist");
  });

  it("combines volume + shape in the label", () => {
    const r = deriveBodyType({ heightCm: 175, weightKg: 70, chestCm: 100, waistCm: 78 });
    expect(r.label).toMatch(/Average/);
    expect(r.label).toMatch(/tapered/);
  });
});
