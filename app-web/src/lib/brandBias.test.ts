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
    expect(r.reason).toMatch(/\bbig\b/); // names the direction; wording covers closet reports too
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

describe("closet reports as brand evidence", () => {
  // The cold-start fix: outcomes need a purchase to have happened and been
  // recorded, which most users never do. A signed closet report is the same
  // observation, available on day one.

  it("learns a brand runs small from two closet reports, with no outcomes at all", () => {
    const b = biasForBrand("Uniqlo", [], [
      { brand: "Uniqlo", category: "shirt", fitDirection: -10 },
      { brand: "Uniqlo", category: "jacket", fitDirection: -5 },
    ], "tshirt");
    expect(b.direction).toBe("small");
    expect(b.shift).toBe(1);
    expect(b.reason).toBeTruthy();
  });

  it("learns a brand runs big the same way", () => {
    const b = biasForBrand("COS", [], [
      { brand: "COS", category: "shirt", fitDirection: 10 },
      { brand: "COS", category: "jacket", fitDirection: 5 },
    ], "tshirt");
    expect(b.direction).toBe("big");
    expect(b.shift).toBe(-1);
  });

  it("EXCLUDES same-category items so the anchor is not counted twice", () => {
    // scoreKnownGood already moves the anchor by a same-brand+same-category
    // item's direction. Counting it here as well would apply one observation to
    // the recommendation twice.
    const b = biasForBrand("Uniqlo", [], [
      { brand: "Uniqlo", category: "tshirt", fitDirection: -10 },
      { brand: "Uniqlo", category: "tshirt", fitDirection: -10 },
    ], "tshirt");
    expect(b.evidence).toBe(0);
    expect(b.shift).toBe(0);
  });

  it("still needs two agreeing reports — one is not evidence", () => {
    const b = biasForBrand("Uniqlo", [], [
      { brand: "Uniqlo", category: "shirt", fitDirection: -10 },
    ], "tshirt");
    expect(b.shift).toBe(0);
  });

  it("cancels when the reports contradict each other", () => {
    const b = biasForBrand("Uniqlo", [], [
      { brand: "Uniqlo", category: "shirt", fitDirection: -10 },
      { brand: "Uniqlo", category: "jacket", fitDirection: 10 },
    ], "tshirt");
    expect(b.direction).toBe("neutral");
    expect(b.shift).toBe(0);
  });

  it("ignores near-centre reports — 'basically fine' is not a complaint", () => {
    const b = biasForBrand("Uniqlo", [], [
      { brand: "Uniqlo", category: "shirt", fitDirection: -2 },
      { brand: "Uniqlo", category: "jacket", fitDirection: -1 },
      { brand: "Uniqlo", category: "polo", fitDirection: 0 },
    ], "tshirt");
    expect(b.evidence).toBe(0);
    expect(b.shift).toBe(0);
  });

  it("ignores other brands", () => {
    const b = biasForBrand("Uniqlo", [], [
      { brand: "COS", category: "shirt", fitDirection: -10 },
      { brand: "Zara", category: "jacket", fitDirection: -10 },
    ], "tshirt");
    expect(b.evidence).toBe(0);
  });

  it("combines with outcomes rather than replacing them", () => {
    const b = biasForBrand(
      "Uniqlo",
      [{ productBrand: "Uniqlo", decision: "return", overallFit: 2, areaIssues: { chest: "tight" } }],
      [{ brand: "Uniqlo", category: "jacket", fitDirection: -10 }],
      "tshirt",
    );
    expect(b.evidence).toBe(2);
    expect(b.direction).toBe("small");
  });

  it("still caps at one ladder step no matter how many reports agree", () => {
    const b = biasForBrand("Uniqlo", [], [
      { brand: "Uniqlo", category: "shirt", fitDirection: -10 },
      { brand: "Uniqlo", category: "jacket", fitDirection: -10 },
      { brand: "Uniqlo", category: "polo", fitDirection: -10 },
      { brand: "Uniqlo", category: "sweater", fitDirection: -10 },
      { brand: "Uniqlo", category: "hoodie", fitDirection: -10 },
    ], "tshirt");
    expect(b.shift).toBe(1);
  });

  it("behaves exactly as before when no closet is passed", () => {
    const withArg = biasForBrand("Uniqlo", [], [], "tshirt");
    const without = biasForBrand("Uniqlo", []);
    expect(withArg).toEqual(without);
  });
});
