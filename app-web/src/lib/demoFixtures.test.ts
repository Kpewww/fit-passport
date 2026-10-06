// The demo products a first-time visitor is invited to try must answer what the
// real page's own rule says (todo 08, Session 85). The Uniqlo fixture used to
// hold made-up garment chests, and a 100 cm chest got XL; the real page's body
// chart puts 100 cm squarely in M (37¾–41 in).
import { describe, expect, it } from "vitest";
import { extractFromUrl } from "./extractor";
import { DEMO_PRODUCTS } from "./demoProducts";
import { engineSizes } from "./engineInput";
import { recommend } from "./fitEngine";

describe("the Uniqlo demo", () => {
  const ex = extractFromUrl(DEMO_PRODUCTS[0].url);

  it("carries the page's body ranges, not garment chests", () => {
    expect(ex.source.sizesFrom).toBe("fixture");
    const m = ex.sizes.find((s) => s.label === "M")!;
    expect([m.bodyChestMinCm, m.bodyChestMaxCm]).toEqual([95.9, 104.1]);
    expect(ex.sizes.every((s) => s.chestCm == null)).toBe(true);
  });

  it("recommends M for a 100 cm chest at a regular fit, as the page's chart does", () => {
    const r = recommend({
      profile: { chestCm: 100, waistCm: 82, preferredFit: "regular" },
      product: { brand: ex.brand, category: ex.category },
      sizes: engineSizes(ex.sizes),
      knownGood: [],
      outcomes: [],
    });
    expect(r.best?.label).toBe("M");
  });
});
