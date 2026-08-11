import { describe, expect, it } from "vitest";
import { domainForCategory, isValidSize, presetSizesFor } from "./sizeSystems";

describe("sizeSystems", () => {
  it("maps categories to the right domain", () => {
    expect(domainForCategory("tshirt")).toBe("top");
    expect(domainForCategory("jeans")).toBe("bottom");
    expect(domainForCategory("sneakers")).toBe("shoe");
    expect(domainForCategory("socks")).toBe("sock");
    expect(domainForCategory("belt")).toBe("accessory");
    expect(domainForCategory("totally-unknown")).toBe("top"); // safe fallback
  });

  it("accepts valid top sizes", () => {
    for (const s of ["S", "M", "L", "XL", "XXL", "M/L", "EU 48", "48", "UK 10", "US L"]) {
      expect(isValidSize("tshirt", s)).toBe(true);
    }
  });

  it("rejects junk and stray punctuation for tops", () => {
    for (const s of ["<", "?", "", "   ", "M!", "abc", "1234567890123"]) {
      expect(isValidSize("tshirt", s)).toBe(false);
    }
  });

  it("validates bottoms by waist / WxL", () => {
    expect(isValidSize("jeans", "32")).toBe(true);
    expect(isValidSize("jeans", "32x32")).toBe(true);
    expect(isValidSize("jeans", "32×34")).toBe(true);
    expect(isValidSize("jeans", "W32 L30")).toBe(true);
    expect(isValidSize("jeans", "M")).toBe(true); // alpha bottoms exist too
    expect(isValidSize("jeans", "<")).toBe(false);
  });

  it("validates shoes as numeric / regional, not alpha", () => {
    expect(isValidSize("shoes", "9")).toBe(true);
    expect(isValidSize("shoes", "9.5")).toBe(true);
    expect(isValidSize("shoes", "EU 42")).toBe(true);
    expect(isValidSize("shoes", "27cm")).toBe(true);
    expect(isValidSize("shoes", "M")).toBe(false); // shoes aren't sized M
  });

  it("offers presets per domain", () => {
    expect(presetSizesFor("tshirt")).toContain("M");
    expect(presetSizesFor("shoes")).toContain("9");
    expect(presetSizesFor("socks")).toContain("One size");
  });
});
