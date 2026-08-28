import { describe, expect, it } from "vitest";
import {
  SCOREABLE_DOMAINS,
  domainForCategory,
  domainLabel,
  isValidSize,
  presetSizesFor,
} from "./sizeSystems";

describe("what the engine may score", () => {
  // Production, before this guard existed: a men's sneaker URL came back
  // "XS" at 24% confidence, because the estimated-size fallback hands every
  // category the same letter ladder with chest measurements attached. The
  // engine has no foot length to compare against, so the number was invented.
  it("scores only the domains FitProfile has a measurement for", () => {
    expect([...SCOREABLE_DOMAINS].sort()).toEqual(["bottom", "top"]);
  });

  it("refuses footwear, socks and accessories", () => {
    for (const category of ["sneakers", "shoes", "boots", "socks", "hat", "belt", "scarf"]) {
      expect(SCOREABLE_DOMAINS).not.toContain(domainForCategory(category));
    }
  });

  it("still allows every top and bottom", () => {
    for (const category of ["tshirt", "shirt", "sweater", "jacket", "hoodie", "polo",
                            "pants", "jeans", "shorts", "skirt"]) {
      expect(SCOREABLE_DOMAINS).toContain(domainForCategory(category));
    }
  });

  // Adding a domain here without adding the body field it needs would put the
  // fabricated-answer bug straight back. This is the tripwire for that.
  it("names every domain in plain English for the refusal message", () => {
    for (const d of ["top", "bottom", "shoe", "sock", "accessory"] as const) {
      expect(domainLabel(d)).toMatch(/^[a-z]+$/);
    }
    expect(domainLabel("shoe")).toBe("footwear");
  });
});

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
