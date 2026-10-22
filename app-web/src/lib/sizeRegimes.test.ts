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

  it("answers null where no evidence is in hand: no guessing", () => {
    expect(bodyChestFor("XL", "US", "mens")).toBeNull(); // ASTM defines no letters
    expect(bodyChestFor("XL", "CN", "mens")).toBeNull(); // GB/T 1335 defines no letters
    expect(bodyChestFor("12", "AU", "womens")).toBeNull(); // AS 1344 not in hand
    expect(bodyChestFor("48", "IT", "mens")).toBeNull(); // European numbers: no standard
    expect(bodyChestFor("XL", null, "mens")).toBeNull();
    expect(bodyChestFor("M", "EU", "mens", "bottom")).toBeNull();
  });

  // Values checked against the rendered pages, Session 101d.
  it("reads Japanese letters by JIS L 4004 / 4005 (XL is LL)", () => {
    expect(bodyChestFor("XL", "JP", "mens")).toMatchObject({ minCm: 104, maxCm: 112 });
    expect(bodyChestFor("LL", "JP", "mens")).toMatchObject({ minCm: 104, maxCm: 112 });
    expect(bodyChestFor("M", "JP", "mens")!.evidence.source).toBe("JIS L 4004:2023 Table 16");
    expect(bodyChestFor("3L", "JP", "mens")).toMatchObject({ minCm: 112, maxCm: 120 });
    expect(bodyChestFor("M", "JP", "womens")).toMatchObject({ minCm: 79, maxCm: 87 });
    expect(bodyChestFor("9号", "JP", "womens")).toMatchObject({ minCm: 81.5, maxCm: 84.5 });
    expect(bodyChestFor("11AR", "JP", "womens")).toMatchObject({ minCm: 84.5, maxCm: 87.5 });
  });

  it("reads Korean letters and chest numbers by KS K 0050 / 0051", () => {
    expect(bodyChestFor("L", "KR", "mens")).toMatchObject({ minCm: 93, maxCm: 101 });
    expect(bodyChestFor("100", "KR", "mens")).toMatchObject({ minCm: 97.5, maxCm: 102.5 });
    expect(bodyChestFor("M(T)", "KR", "womens")).toMatchObject({ minCm: 82, maxCm: 89 });
    expect(bodyChestFor("90", "KR", "womens")!.evidence.source).toBe("KS K 0051:2025 Table 9");
  });

  it("reads US numbers by ASTM: men's chest inches, Misses, Petite and Plus", () => {
    const m40 = bodyChestFor("40", "US", "mens")!;
    expect(m40.minCm).toBeCloseTo(100.3, 1);
    expect(m40.maxCm).toBeCloseTo(102.9, 1);
    expect(bodyChestFor("40R", "US", "mens")).toMatchObject({ minCm: m40.minCm });
    expect(bodyChestFor("58", "US", "mens")!.evidence.source).toMatch(/D8077/);
    expect(bodyChestFor("8", "US", "womens")).toMatchObject({ minCm: 90.8, maxCm: 93.4 });
    expect(bodyChestFor("8P", "US", "womens")).toMatchObject({ minCm: 90.8 });
    expect(bodyChestFor("18W", "US", "womens")!.minCm).toBeCloseTo(111.8, 1);
  });

  it("reads UK women's numbers by BS 3666 Table 1", () => {
    expect(bodyChestFor("12", "UK", "womens")).toMatchObject({ minCm: 86, maxCm: 90 });
    expect(bodyChestFor("16", "UK", "womens")).toMatchObject({ minCm: 95, maxCm: 99 });
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
