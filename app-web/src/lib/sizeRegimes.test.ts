import { describe, expect, it } from "vitest";
import { bodyChestFor, regimeForCountry, regimeFromField } from "./sizeRegimes";
import { isValidSize } from "./sizeSystems";

describe("size regimes", () => {
  it("reads a Chinese 号型 as the body chest it names, by GB/T 1335 (±2 cm, §4.1.3)", () => {
    const r = bodyChestFor("175/96A", null, "mens");
    expect(r).toMatchObject({ minCm: 94, maxCm: 98, evidence: { grade: "A" } });
    expect(r!.evidence.source).toMatch(/GB\/T 1335\.1-2008/);
    expect(bodyChestFor("165/84B", null, "womens")!.evidence.source).toMatch(/GB\/T 1335\.2/);
  });

  it("reads a European letter size by EN 13402-3 Table A.24 / A.25", () => {
    expect(bodyChestFor("M", "IT", "mens")).toMatchObject({ minCm: 94, maxCm: 102 });
    expect(bodyChestFor("XXL", "FR", "mens")).toMatchObject({ minCm: 118, maxCm: 130 });
    expect(bodyChestFor("2XL", "EU", "mens")).toMatchObject({ minCm: 118, maxCm: 130 });
    expect(bodyChestFor("M", "EU", "womens")).toMatchObject({ minCm: 90, maxCm: 98 });
    expect(bodyChestFor("M", "EU", "mens")!.evidence.source).toMatch(/Table A\.24/);
  });

  it("answers null where no evidence is in hand yet: no guessing", () => {
    expect(bodyChestFor("XL", "JP", "mens")).toBeNull();
    expect(bodyChestFor("XL", "US", "mens")).toBeNull();
    expect(bodyChestFor("XL", "CN", "mens")).toBeNull();
    expect(bodyChestFor("XL", null, "mens")).toBeNull();
    expect(bodyChestFor("M", "EU", "mens", "bottom")).toBeNull();
  });

  it("maps countries to regimes, and CEN members to the European one", () => {
    expect(regimeForCountry("JP")).toBe("JP");
    expect(regimeForCountry("HK")).toBe("CN");
    expect(regimeForCountry("ES")).toBe("EU");
    expect(regimeForCountry("GB")).toBe("UK");
    expect(regimeForCountry("BR")).toBeNull();
    expect(regimeFromField("de")).toBe("EU");
  });

  it("lets the closet store a 号型 and 4XL to 6XL", () => {
    for (const v of ["175/96A", "170/88", "165 / 84B", "4XL", "6XL", "XXXXL"]) expect(isValidSize("tshirt", v)).toBe(true);
    expect(isValidSize("jeans", "175/80A")).toBe(true);
    expect(isValidSize("tshirt", "175/")).toBe(false);
  });
});
