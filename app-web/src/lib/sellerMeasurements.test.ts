import { describe, it, expect } from "vitest";
import { readSeller, measurementsInText, normaliseSizeLabel, sizeInTitle, typedMeasurements, withTyped, isResaleHost } from "./sellerMeasurements";

// Titles and specifics copied from real eBay listings, 2026-09-30 (DEVLOG 80e).
describe("reading a seller's measurements from a listing", () => {
  it("doubles a pit-to-pit width into the garment's chest, and keeps what was written", () => {
    const r = readSeller({ title: `Coleman Shirt Mens XXL Red Buffalo Plaid Flannel Check 24" Pit To Pit 30" Long` });
    const chest = r.measurements.find((m) => m.field === "chest")!;
    expect(chest).toMatchObject({ value: 24, unit: "in", flat: true, unitInferred: false, source: "title" });
    expect(chest.cm).toBeCloseTo(121.9, 1); // 24 in × 2.54 × 2
    expect(r.measurements.find((m) => m.field === "length")).toMatchObject({ value: 30, unit: "in", flat: false });
    expect(r.sizeLabel).toBe("XXL");
  });

  it("reads the other ways sellers write it", () => {
    const chest = (t: string) => readSeller({ title: t }).measurements.find((m) => m.field === "chest");
    expect(chest(`Tommy Jeans Mens Large Orange Plaid Flannel Long Sleeve Shirt 24'' Pit To Pit`)?.value).toBe(24);
    expect(chest(`Gant Mens Shirt Flannel Button Down Lg Longsleeve Blue Red Plaid Pit To Pit 24in`)?.value).toBe(24);
    expect(chest(`P2P: 21.5"`)?.cm).toBeCloseTo(109.2, 1);
    expect(chest(`armpit to armpit 56 cm`)?.cm).toBe(112);
    expect(chest(`腋下平铺 56cm`)?.cm).toBe(112);
    expect(chest(`胸宽 55 厘米`)?.cm).toBe(110);
  });

  it("finds a measurement in the specifics, and treats a bare Chest Size as a size, not a measurement", () => {
    const r = readSeller({ specs: [["Chest Size", `25" Pit to Pit`], ["Size", "L"], ["Sleeve Length", "Long Sleeve"]] });
    expect(r.measurements.find((m) => m.field === "chest")?.value).toBe(25);
    expect(r.sizeLabel).toBe("L");
    expect(readSeller({ specs: [["Chest Size", "42R"]] }).measurements).toEqual([]);
  });

  it("never reads a bare 'chest' as a pit-to-pit — the user confirms it", () => {
    const r = readSeller({ title: "Vintage shirt chest 22 length 29" });
    expect(r.measurements.find((m) => m.field === "chest")).toBeUndefined();
    expect(r.ambiguous).toContainEqual(expect.objectContaining({ field: "chest", reason: "flat-or-around" }));
    expect(r.measurements.find((m) => m.field === "length")?.value).toBe(29);
  });

  it("skips two numbers after one label rather than guessing which is which", () => {
    const r = readSeller({ title: "Hayes Sanforized Flannel 40s 50s Button Up Shirt Size Large Pit to Pit 29x20 VTG" });
    expect(r.measurements.find((m) => m.field === "chest")).toBeUndefined();
    expect(r.ambiguous).toContainEqual(expect.objectContaining({ field: "chest", reason: "two-numbers" }));
    expect(r.sizeLabel).toBe("L");
  });

  it("does not take 'Long Sleeve' or a chest pocket for a measurement", () => {
    expect(measurementsInText(`Shirt 30" Long Sleeve`, "title").filter((f) => f.m)).toEqual([]);
    const pocket = readSeller({ lines: [`item: fw9x42pw9m msrp: $62.00 chest pocket 31" long mediumweight`] });
    expect(pocket.measurements).toEqual([expect.objectContaining({ field: "length", value: 31 })]);
  });

  it("infers a missing unit only when the number fits one unit, and says so", () => {
    expect(readSeller({ title: "pit to pit 22" }).measurements[0]).toMatchObject({ unit: "in", unitInferred: true });
    expect(readSeller({ title: "pit to pit 56" }).measurements[0]).toMatchObject({ unit: "cm", unitInferred: true, cm: 112 });
    // 150 is no garment's pit-to-pit in either unit.
    expect(readSeller({ title: "pit to pit 150" }).measurements).toEqual([]);
  });

  it("keeps disagreeing readings out of the answer, and shows both", () => {
    const r = readSeller({ title: `Shirt 24" pit to pit`, specs: [["Pit to Pit", `21"`]] });
    expect(r.measurements.find((m) => m.field === "chest")).toBeUndefined();
    expect(r.ambiguous.filter((a) => a.reason === "conflict")).toHaveLength(2);
  });

  it("reads a waist laid flat as half the waist", () => {
    expect(readSeller({ title: `Levi's 501 waist flat 16"` }).measurements[0]).toMatchObject({ field: "waist", flat: true });
    expect(readSeller({ title: `Levi's 501 waist flat 16"` }).measurements[0].cm).toBeCloseTo(81.3, 1);
  });
});

describe("the size a listing prints", () => {
  it("normalises the ways it is written", () => {
    expect(normaliseSizeLabel("Large")).toBe("L");
    expect(normaliseSizeLabel("2XL")).toBe("2XL");
    expect(normaliseSizeLabel("XXL (Men's)")).toBe("XXL");
    expect(normaliseSizeLabel("3X")).toBe("3XL");
    expect(normaliseSizeLabel("One Size")).toBeNull();
    expect(sizeInTitle("FREE PLANET MEN'S RELAXED FIT SKIING PRINT FLANNEL SHIRT SIZE L")).toBe("L");
    expect(sizeInTitle("Coleman Shirt Mens XXL Red")).toBe("XXL");
  });
});

describe("measurements the user types from the listing", () => {
  it("win over what was read, and keep their provenance", () => {
    const read = readSeller({ title: `Shirt 24" pit to pit` });
    const r = withTyped(read, typedMeasurements([{ field: "chest", value: 23, unit: "in", flat: true }]));
    expect(r.measurements).toHaveLength(1);
    expect(r.measurements[0]).toMatchObject({ source: "you", value: 23 });
  });
  it("drop a number no garment could have", () => {
    expect(typedMeasurements([{ field: "chest", value: 90, unit: "in", flat: true }])).toEqual([]);
  });
});

describe("which hosts sell one-off listings", () => {
  it("knows eBay across its sites and nothing else by accident", () => {
    expect(isResaleHost("www.ebay.com")).toBe(true);
    expect(isResaleHost("www.ebay.co.uk")).toBe(true);
    expect(isResaleHost("www.uniqlo.com")).toBe(false);
    expect(isResaleHost("notebay.com")).toBe(false);
  });
});
