import { describe, it, expect } from "vitest";
import { extractFromUrl } from "./extractor";

describe("extractFromUrl — full-path parsing", () => {
  it("reads brand, category, gender and name from a Patagonia URL where the id is the last segment", () => {
    const r = extractFromUrl(
      "https://www.patagonia.com/product/womens-fitz-roy-down-hoody/85506.html?dwvar_85506_color=SMTB",
    );
    expect(r.brand).toBe("Patagonia");
    // "down hoody" → insulated jacket, matched before the generic hoodie rule
    expect(r.category).toBe("jacket");
    expect(r.gender).toBe("womens");
    // descriptive slug recovered from the MIDDLE segment, gender word stripped
    expect(r.productName).toContain("Fitz Roy Down Hoody");
    expect(r.productName).not.toMatch(/^Patagonia (jacket|item)$/);
  });

  it("does not fall back to tshirt when the last segment is a bare SKU", () => {
    const r = extractFromUrl("https://www.zara.com/us/en/ribbed-tank-top/p04424303.html");
    expect(r.brand).toBe("Zara");
    expect(r.category).not.toBe("jacket");
    expect(r.productName.toLowerCase()).toContain("tank");
  });

  it("detects bottoms from the path", () => {
    const jeans = extractFromUrl("https://www.levi.com/US/en_US/clothing/men/jeans/501-original/p/005010115");
    expect(jeans.category).toBe("jeans");
    expect(jeans.gender).toBe("mens");

    const chinos = extractFromUrl("https://www.jcrew.com/p/mens/categories/clothing/pants/chino/BX291");
    expect(chinos.category).toBe("pants");
    expect(chinos.gender).toBe("mens");
  });

  it("detects footwear and accessories", () => {
    // URL literally says "shoes" → honest read is shoes (footwear domain)
    expect(extractFromUrl("https://www.nike.com/t/air-force-1-mens-shoes/CW2288-111").category).toBe("shoes");
    expect(extractFromUrl("https://www.nike.com/t/pegasus-41-mens-road-running-sneakers/x").category).toBe("sneakers");
    expect(extractFromUrl("https://example.com/accessories/wool-scarf/12345").category).toBe("scarf");
  });

  it("women's is not mistaken for men's", () => {
    // non-fixture host so we exercise the URL-derived path, not a curated match
    const r = extractFromUrl("https://www.everlane.com/en/women/tops/relaxed-tee/98765");
    expect(r.gender).toBe("womens");
  });

  it("still works when the URL has no descriptive slug (id only)", () => {
    const r = extractFromUrl("https://www.uniqlo.com/us/en/products/E455360-000");
    expect(r.brand).toBe("Uniqlo");
    // no readable name → falls back to a brand + noun label, never crashes
    expect(r.productName).toContain("Uniqlo");
    expect(r.sizes.length).toBeGreaterThan(0);
  });

  it("marks unknown brands as derived and keeps provenance", () => {
    const r = extractFromUrl("https://someshop.example/collections/mens-hoodie/cool-pullover-hoodie-42");
    expect(r.source.derived).toBe(true);
    expect(r.source.host).toBe("someshop.example");
    expect(r.category).toBe("hoodie");
    expect(r.gender).toBe("mens");
  });
});
