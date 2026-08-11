import { describe, expect, it } from "vitest";
import { biasForBrand } from "./brandBias";

describe("brandBias.biasForBrand", () => {
  it("returns neutral with no outcomes", () => {
    const r = biasForBrand("Uniqlo", []);
    expect(r.direction).toBe("neutral");
    expect(r.shift).toBe(0);
    expect(r.reason).toBeNull();
  });

  it("requires >=2 same-direction outcomes before shifting", () => {
    const one = biasForBrand("Uniqlo", [
      { productBrand: "Uniqlo", decision: "return", areaIssues: { chest: "loose" } },
    ]);
    expect(one.direction).toBe("neutral");
    expect(one.shift).toBe(0);
  });

  it("shifts DOWN when the user reports the brand runs big twice", () => {
    const r = biasForBrand("Uniqlo", [
      { productBrand: "Uniqlo", decision: "return", areaIssues: { chest: "loose" } },
      { productBrand: "Uniqlo", decision: "return", areaIssues: { shoulders: "loose" } },
    ]);
    expect(r.direction).toBe("big");
    expect(r.shift).toBe(-1);
    expect(r.reason).toMatch(/Uniqlo/);
    expect(r.reason).toMatch(/too big/);
  });

  it("shifts UP when the user reports the brand runs small twice", () => {
    const r = biasForBrand("Zara", [
      { productBrand: "Zara", decision: "return", areaIssues: { chest: "tight" } },
      { productBrand: "Zara", decision: "return", areaIssues: { shoulders: "tight" } },
    ]);
    expect(r.direction).toBe("small");
    expect(r.shift).toBe(1);
  });

  it("cancels when the user reports contradictory outcomes", () => {
    const r = biasForBrand("H&M", [
      { productBrand: "H&M", decision: "return", areaIssues: { chest: "loose" } },
      { productBrand: "H&M", decision: "return", areaIssues: { chest: "tight" } },
    ]);
    expect(r.direction).toBe("neutral");
    expect(r.shift).toBe(0);
    expect(r.evidence).toBe(2);
  });

  it("ignores outcomes from other brands", () => {
    const r = biasForBrand("Uniqlo", [
      { productBrand: "Zara", decision: "return", areaIssues: { chest: "loose" } },
      { productBrand: "Zara", decision: "return", areaIssues: { chest: "loose" } },
    ]);
    expect(r.direction).toBe("neutral");
  });

  it("caps shift at ±1 even with lots of outcomes", () => {
    const many = Array.from({ length: 10 }, () => ({
      productBrand: "COS",
      decision: "return" as const,
      areaIssues: { chest: "loose" },
    }));
    const r = biasForBrand("COS", many);
    expect(r.shift).toBe(-1); // never -2, never -3
  });
});
