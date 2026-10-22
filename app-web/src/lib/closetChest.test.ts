import { describe, expect, it } from "vitest";
import { chestFromCloset } from "./closetChest";
import { lookupBrand, registrySize } from "./brandRegistry";

const country = (b: string) => lookupBrand(b)?.country ?? null;

describe("chest from the closet's labels", () => {
  it("uses a European brand's letter by EN 13402-3", () => {
    const r = chestFromCloset([{ brand: "Zara", category: "tshirt", size: "M", fitRating: 5 }], country);
    expect(r).toMatchObject({ lo: 94, hi: 102, chestCm: 98 });
  });

  it("overlaps two pieces, and gives nothing when they contradict", () => {
    const both = chestFromCloset([
      { brand: "Zara", category: "tshirt", size: "M", fitRating: 5 },
      { brand: "Anything", category: "shirt", size: "175/100A", fitRating: 5 },
    ], country);
    expect(both).toMatchObject({ lo: 98, hi: 102 });
    expect(chestFromCloset([
      { brand: "Zara", category: "tshirt", size: "S", fitRating: 5 },
      { brand: "Gucci", category: "tshirt", size: "XL", fitRating: 5 },
    ], country)).toBeNull();
  });

  it("skips what does not fit, bottoms, and regimes with no evidence (a US letter)", () => {
    expect(chestFromCloset([{ brand: "Zara", category: "tshirt", size: "M", fitRating: 2 }], country)).toBeNull();
    expect(chestFromCloset([{ brand: "Zara", category: "jeans", size: "M", fitRating: 5 }], country)).toBeNull();
    expect(chestFromCloset([{ brand: "Nike", category: "tshirt", size: "XL", fitRating: 5 }], country)).toBeNull();
  });

  it("reads a Muji XL as Japanese, by JIS L 4004 (the founder's own piece)", () => {
    expect(chestFromCloset([{ brand: "Muji", category: "top", size: "XL", fitRating: 5 }], country)).toMatchObject({ lo: 104, hi: 112, chestCm: 108 });
    // Chosen on the piece, the regime wins over the brand's country.
    expect(chestFromCloset([{ brand: "Muji", category: "top", size: "XL", fitRating: 5, region: "EU" }], country)).toMatchObject({ lo: 110, hi: 118 });
  });

  it("finds brands by name or alias, each with a QID", () => {
    expect(lookupBrand("MUJI")).toMatchObject({ country: "JP" });
    expect(lookupBrand("Gucci")).toMatchObject({ country: "IT" });
    expect(lookupBrand("uniqlo")!.q).toMatch(/^Q\d+$/);
    expect(registrySize()).toBeGreaterThan(4000);
  });
});
