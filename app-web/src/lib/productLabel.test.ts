import { describe, it, expect } from "vitest";
import { productLabel } from "./productLabel";

describe("productLabel", () => {
  it("does not say the brand twice", () => {
    // The real case: the dashboard read "M for Uniqlo Uniqlo AIRism Cotton Crew
    // Neck T-Shirt", because extractors take the product name from the page
    // title and a page title leads with the retailer.
    expect(productLabel("Uniqlo", "Uniqlo AIRism Cotton Crew Neck T-Shirt"))
      .toBe("Uniqlo AIRism Cotton Crew Neck T-Shirt");
  });

  it("prepends the brand when the name does not carry it", () => {
    expect(productLabel("COS", "Oxford Shirt")).toBe("COS Oxford Shirt");
  });

  it("ignores case when deciding", () => {
    expect(productLabel("UNIQLO", "uniqlo airism tee")).toBe("uniqlo airism tee");
  });

  it("does not strip a brand that merely appears later in the name", () => {
    // "Made for Uniqlo" is not a name that starts with the brand.
    expect(productLabel("Uniqlo", "Collab tee made for Uniqlo"))
      .toBe("Uniqlo Collab tee made for Uniqlo");
  });

  it("handles a missing side without printing 'undefined'", () => {
    expect(productLabel("Uniqlo", null)).toBe("Uniqlo");
    expect(productLabel(null, "Oxford Shirt")).toBe("Oxford Shirt");
    expect(productLabel(null, null)).toBe("");
    expect(productLabel("  ", "Oxford Shirt")).toBe("Oxford Shirt");
  });
});
