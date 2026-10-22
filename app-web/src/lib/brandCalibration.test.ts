import { describe, expect, it } from "vitest";
import { calibrate, usLetterConsensus, type Observation } from "./brandCalibration";

const o = (brand: string, url: string, label: string, min: number, max: number, line: string | null = "mens"): Observation =>
  ({ brand, url, line, label, bodyChestMinCm: min, bodyChestMaxCm: max });
const country = (b: string) => ({ uniqlo: "JP", zara: "ES", a: "US", b: "US", c: "US" } as Record<string, string>)[b.toLowerCase()] ?? null;

describe("brand calibration", () => {
  it("needs two pages before it speaks for a brand", () => {
    expect(calibrate([o("Uniqlo", "u1", "M", 88, 96)], country)).toEqual([]);
  });

  it("measures a Japanese brand against JIS: on the standard is 0 steps", () => {
    const [r] = calibrate([o("Uniqlo", "u1", "M", 88, 96), o("Uniqlo", "u2", "M", 88, 96), o("Uniqlo", "u2", "L", 96, 104), o("Uniqlo", "u3", "L", 96, 104)], country);
    expect(r).toMatchObject({ regime: "JP", pages: 3, runs: 0 });
    expect(r.sizes.find((s) => s.label === "M")).toMatchObject({ offsetCm: 0, offsetSteps: 0, standard: { source: "JIS L 4004:2023 Table 16" } });
  });

  it("says how far a brand runs from its standard, in steps", () => {
    // EN 13402-3 M is 94-102 (mid 98, width 8); this brand's M is 102-110 (mid 106).
    const [r] = calibrate([o("Zara", "z1", "M", 102, 110), o("Zara", "z2", "M", 102, 110)], country);
    expect(r.sizes[0]).toMatchObject({ offsetCm: 8, offsetSteps: 1 });
    expect(r.runs).toBe(1);
  });

  it("keeps lines apart and skips nonsense ranges", () => {
    const rs = calibrate([o("Zara", "z1", "M", 90, 98, "womens"), o("Zara", "z2", "M", 90, 98, "womens"), o("Zara", "z3", "M", 0, 0)], country);
    expect(rs).toHaveLength(1);
    expect(rs[0].line).toBe("womens");
  });

  it("forms a US letter consensus only from three US brands", () => {
    const two = calibrate(["A", "B"].flatMap((b) => [o(b, `${b}1`, "M", 96, 104), o(b, `${b}2`, "M", 96, 104)]), country);
    expect(usLetterConsensus(two, "mens")).toEqual({});
    const three = calibrate(["A", "B", "C"].flatMap((b, i) => [o(b, `${b}1`, "M", 96 + i, 104 + i), o(b, `${b}2`, "M", 96 + i, 104 + i)]), country);
    expect(usLetterConsensus(three, "mens")).toEqual({ M: { midCm: 101, brands: 3 } });
  });
});

import { offsetFor } from "./brandOffsets";
describe("brand offsets at check time", () => {
  const reports = calibrate([o("Zara", "z1", "M", 102, 110), o("Zara", "z2", "M", 102, 110), o("Zara", "z1", "L", 110, 118), o("Zara", "z2", "L", 110, 118)], country);
  it("uses the label's own offset, else the brand's median", () => {
    expect(offsetFor(reports, "zara", "mens", "M", "EU")).toEqual({ offsetCm: 8, pages: 2 });
    expect(offsetFor(reports, "Zara", "mens", "XL", "EU")).toEqual({ offsetCm: 8, pages: 2 });
    expect(offsetFor(reports, "Zara", "womens", "M", "EU")).toBeNull();
    expect(offsetFor(reports, "Unknown", "mens", "M", "EU")).toBeNull();
    expect(offsetFor(reports, "Zara", "mens", "M", "JP")).toBeNull(); // another market's pages say nothing
  });
});

describe("an official brand-wide guide (Session 101h)", () => {
  it("speaks for the brand alone, without the page minimum", () => {
    const [r] = calibrate([{ ...o("A", "https://a.example/size-guide", "M", 96, 104), official: true }], country);
    expect(r).toMatchObject({ brand: "A", pages: 1 });
    expect(r.sizes[0]).toMatchObject({ label: "M", medianMidCm: 100 });
  });
});

import { marketOf } from "./brandCalibration";
describe("markets (Session 101h): a brand's US pages do not calibrate its Japanese labels", () => {
  it("reads the market from the address", () => {
    expect(marketOf("https://www.uniqlo.com/us/en/products/E1")).toBe("US");
    expect(marketOf("https://www.uniqlo.com/jp/ja/products/E1")).toBe("JP");
    expect(marketOf("https://www.muji.com.cn/x")).toBe("CN");
    expect(marketOf("https://www.zara.com/kr/ko/x")).toBe("KR");
    expect(marketOf("https://shop.example.co.uk/x")).toBe("GB");
    expect(marketOf("https://www.nike.com/size-fit/mens-tops")).toBeNull();
  });
  it("calibrates each market against its own standard", () => {
    const rs = calibrate([
      o("Uniqlo", "https://www.uniqlo.com/us/en/p1", "M", 96, 104), o("Uniqlo", "https://www.uniqlo.com/us/en/p2", "M", 96, 104),
      o("Uniqlo", "https://www.uniqlo.com/jp/ja/p1", "M", 88, 96), o("Uniqlo", "https://www.uniqlo.com/jp/ja/p2", "M", 88, 96),
    ], country);
    const jp = rs.find((r) => r.regime === "JP")!, us = rs.find((r) => r.regime === "US")!;
    expect(jp.runs).toBe(0);
    expect(us.runs).toBeNull(); // US letters have no standard
    expect(offsetFor(rs, "Uniqlo", "mens", "M", "JP")).toEqual({ offsetCm: 0, pages: 2 });
  });
});
