// Garment words the category rules must know (Session 84). The founder's first
// store-extension checks — an adidas "Satin Polka Dots TT Track Top" and an H&M
// "Lace-Trimmed Velvet Top" — were refused as "not a garment": no rule knew the
// word top. Both pages refuse automated browsers, so the real names stand in for
// the pages here.
import { describe, expect, it } from "vitest";
import { detectCategoryStrict } from "./extractor";
import { domainForCategory, SCOREABLE_DOMAINS } from "./sizeSystems";
import { refusalFor } from "./checkPolicy";
import { extractFromUrl, withUserCategory } from "./extractor";

describe("the category rules know tops, one-pieces and underwear", () => {
  it.each([
    ["Satin Polka Dots TT Track Top", "jacket"],
    ["satin polka dots tt track top", "jacket"], // the URL slug, separators as spaces
    ["Lace-Trimmed Velvet Top", "top"],
    ["Ribbed Tank Top", "top"],
    ["Silk Camisole", "top"],
    ["Oversized Poplin Blouse", "top"],
    ["Square-Neck Bodysuit", "top"],
    ["Linen Tunic", "top"],
    ["Satin Slip Dress", "dress"],
    ["Poplin Shirt Dress", "dress"],
    ["Denim Jumpsuit", "jumpsuit"],
    ["Cotton Overalls", "jumpsuit"],
    ["Ribbed Swimsuit", "swimsuit"],
    ["Seamless Sports Bra", "underwear"],
    ["Wool Two-Piece Suit", "jacket"],
    ["蕾丝吊带上衣", "top"],
    ["法式碎花连衣裙", "dress"],
    ["健身背心", "top"],
  ])("%s → %s", (name, cat) => {
    expect(detectCategoryStrict(name)).toBe(cat);
  });

  it.each([
    ["Slim Fit Dress Shirt", "shirt"], // a dress shirt is a shirt
    ["Pleated Dress Pants", "pants"],
    ["Top-Stitched Straight Jeans", "jeans"],
    ["Wool Top Coat", "jacket"],
    ["Heavyweight T-Shirt", "tshirt"],
    ["Hooded Top", "hoodie"],
  ])("does not mistake %s (→ %s)", (name, cat) => {
    expect(detectCategoryStrict(name)).toBe(cat);
  });

  it("finds nothing in a bag named after its handle", () => {
    expect(detectCategoryStrict("Leather Top-Handle Bag")).toBeNull();
  });

  it("scores tops and one-pieces (Session 84b); recognises underwear without pretending to score it", () => {
    expect(domainForCategory("top")).toBe("top");
    expect(SCOREABLE_DOMAINS).toContain(domainForCategory("top"));
    expect(domainForCategory("dress")).toBe("onepiece");
    expect(domainForCategory("underwear")).toBe("intimate");
    expect(SCOREABLE_DOMAINS).not.toContain("intimate");
  });
});

describe("what the shopper is told", () => {
  it("an H&M top read by the extension is no longer 'not a garment'", () => {
    const ex = extractFromUrl("https://www2.hm.com/en_us/productpage.1369399001.html");
    // The URL names nothing; the page's name is what the extension sends.
    const named = { ...ex, category: detectCategoryStrict("Lace-Trimmed Velvet Top")!, productName: "Lace-Trimmed Velvet Top" };
    named.source = { ...ex.source, categoryGuessed: false, categoryFrom: "page-name", fetch: "extension", sizesFrom: "estimated", sizesSynthesized: true };
    const r = refusalFor(named);
    expect(r?.error).not.toBe("not-apparel");
    expect(r?.error).toBe("no-chart-on-page"); // the chart sits behind H&M's size-guide button
  });

  it("a page the extension read, whose garment nobody could name, asks the shopper (84d)", () => {
    const ex = extractFromUrl("https://shop.test/p/12345");
    ex.source = { ...ex.source, categoryGuessed: true, sizesFrom: "estimated", fetch: "extension" };
    const r = refusalFor(ex);
    expect(r?.error).toBe("pick-category");
    expect(r?.message).not.toMatch(/paste/i);
    // A page nobody read keeps the old answer (a pasted link our server read
    // asks too, since 85b).
    ex.source = { ...ex.source, fetch: "skipped" };
    expect(refusalFor(ex)?.error).toBe("not-apparel");
  });

  it("the shopper's choice applies over a guess, never over what the page said", () => {
    const guessed = extractFromUrl("https://shop.test/p/12345");
    guessed.source = { ...guessed.source, categoryGuessed: true };
    const picked = withUserCategory(guessed, "dress");
    expect(picked).toMatchObject({ category: "dress", source: { categoryGuessed: false, categoryFrom: "user" } });
    const named = extractFromUrl("https://shop.test/p/mens-oxford-shirt");
    expect(withUserCategory(named, "dress").category).toBe(named.category);
  });
});
