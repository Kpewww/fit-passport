// Women's sizes across countries — Session 88.

import { describe, expect, it } from "vitest";
import { renderWomens, womensLetter, womensUsNumber } from "./womensSizes";
import { normalizeToAlpha } from "./sizing";
import { convert, scalesForDomain } from "./sizeConvert";
import { recommend, type EngineInput } from "./fitEngine";

describe("women's sizes by country", () => {
  it("reads one size written five ways as the same rung (blitzresults: US 2 = DE 32 = FR 34 = IT 38 = UK 6)", () => {
    for (const label of ["US 2", "EU 32", "DE 32", "FR 34", "IT 38", "UK 6", "32"]) {
      expect(womensUsNumber(label), label).toBe(2);
    }
    expect(womensLetter(2)).toBe("XS");
    expect(womensUsNumber("US 00")).toBe(-2);
    expect(womensUsNumber("FR 35")).toBeNull(); // not on the ladder
    expect(renderWomens(1, "FR")).toBe("32–34");
    expect(renderWomens(-2, "US")).toBe("00");
  });

  it("puts women's labels on the alpha ladder only for the women's line", () => {
    expect(normalizeToAlpha("FR 34", "womens")).toBe("XS");
    expect(normalizeToAlpha("IT 42", "womens")).toBe("S");
    expect(normalizeToAlpha("38", "womens")).toBe("M"); // a bare number is EU/DE: 38 = US 8
    expect(normalizeToAlpha("EU 44", "womens")).toBe("L"); // US 14
    // The men's reading is unchanged when the line is men's or unknown.
    expect(normalizeToAlpha("44")).toBe("S");
    expect(normalizeToAlpha("44", "mens")).toBe("S");
    expect(normalizeToAlpha("FR 34")).toBeNull();
  });
});

describe("the converter, women's line", () => {
  const byId = (rows: ReturnType<typeof convert>) => Object.fromEntries(rows.map((r) => [r.scaleId, r.value]));

  it("shows US XS as FR 32–34, not EU 44", () => {
    const rows = byId(convert("top", "XS", "ALPHA", "womens"));
    expect(rows.US).toBe("US 0–2");
    expect(rows.EU).toBe("EU 30–32");
    expect(rows.FR).toBe("FR 32–34");
    expect(rows.IT).toBe("IT 36–38");
    expect(rows.UK).toBe("UK 4–6");
  });

  it("converts an exact number exactly", () => {
    const rows = byId(convert("top", "FR 34", "FR", "womens"));
    expect(rows.US).toBe("US 2");
    expect(rows.EU).toBe("EU 32");
    expect(rows.IT).toBe("IT 38");
    expect(rows.UK).toBe("UK 6");
    expect(rows.ALPHA).toBe("XS");
  });

  it("files the countries under EU, and keeps UK on its own", () => {
    const scales = scalesForDomain("top", "womens");
    expect(scales.filter((s) => s.parent === "EU").map((s) => s.id)).toEqual(["FR", "IT"]);
    expect(scales.find((s) => s.id === "UK")?.parent).toBeUndefined();
  });

  it("leaves the men's converter as it was", () => {
    expect(byId(convert("top", "XS", "ALPHA")).EU).toBe("EU 44");
    expect(byId(convert("top", "XS", "ALPHA", "mens")).EU).toBe("EU 44");
  });
});

describe("the engine reads a women's closet piece", () => {
  const input = (gender: string | null): EngineInput => ({
    profile: { chestCm: null, waistCm: null, shoulderCm: null, preferredFit: "regular" },
    product: { brand: "Sandro", category: "sweater", gender },
    sizes: [{ label: "XS" }, { label: "S" }, { label: "M" }, { label: "L" }],
    knownGood: [{ brand: "Sandro", category: "sweater", size: "FR 40", fitRating: 5, gender: "womens" }],
    outcomes: [],
  });

  it("anchors on a women's FR 40 (US 8, M) instead of dropping it", () => {
    const out = recommend(input("womens"));
    expect(out.best.label).toBe("M");
    expect(out.best.reasons.some((r) => r.signal === "known-good")).toBe(true);
  });
});
