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

// A pasted link is untrusted input. Before this, an unrecognised page silently
// became a "tshirt" and got a confident size — the worst failure mode for a tool
// whose whole proposition is that its answer can be trusted.
describe("non-apparel links are recognised as such", () => {
  const guessed = (url: string) => extractFromUrl(url).source.categoryGuessed;

  it("flags a game top-up page (代充) as not-apparel", () => {
    expect(guessed("https://shop.example.com/product/steam-wallet-top-up-100")).toBe(true);
    expect(guessed("https://example.com/代充/王者荣耀点券")).toBe(true);
  });

  it("flags articles, logins and downloads as not-apparel", () => {
    expect(guessed("https://news.example.com/2026/08/markets-roundup")).toBe(true);
    expect(guessed("https://example.com/account/login")).toBe(true);
    expect(guessed("https://cdn.example.com/files/setup.exe")).toBe(true);
  });

  it("does NOT flag real garment links", () => {
    expect(guessed("https://www.uniqlo.com/us/en/products/mens-linen-shirt")).toBe(false);
    expect(guessed("https://shop.example.com/p/womens-wool-coat-navy")).toBe(false);
    expect(guessed("https://example.cn/p/男士牛仔裤")).toBe(false);
  });
});

// Chinese storefronts are a stated target market, so a Chinese product URL must
// not be turned away by the not-apparel refusal.
describe("Chinese garment terms are recognised", () => {
  const cat = (url: string) => extractFromUrl(url).category;
  const guessed = (url: string) => extractFromUrl(url).source.categoryGuessed;

  it("classifies common Chinese garment words", () => {
    expect(cat("https://example.cn/p/男士牛仔裤")).toBe("jeans");
    expect(cat("https://example.cn/p/女士连衣裙")).toBe("dress");
    expect(cat("https://example.cn/p/纯棉衬衫")).toBe("shirt");
    expect(cat("https://example.cn/p/加厚羽绒服")).toBe("jacket");
    expect(cat("https://example.cn/p/宽松卫衣")).toBe("hoodie");
    expect(cat("https://example.cn/p/圆领短袖")).toBe("tshirt");
  });

  it("puts bottoms before tops, so 牛仔裤 is not read as an 外套", () => {
    expect(cat("https://example.cn/p/牛仔裤外套")).toBe("jeans");
  });

  it("still refuses a Chinese page that is not clothing", () => {
    expect(guessed("https://example.cn/p/游戏点券代充")).toBe(true);
  });
});

// The brand-chart layer (layer 2a). It replaced the case where a recognised
// brand got a ladder extrapolated from two invented constants — the mechanism
// that produced Patagonia's "chest 106/111/116/121/126", five numbers no page
// ever stated.
describe("layer 2a — the brand's own published size chart", () => {
  const nikeTop = "https://www.nike.com/t/mens-dri-fit-training-t-shirt/ABC123";

  it("uses the curated chart for a brand and garment we have one for", () => {
    const out = extractFromUrl(nikeTop);
    expect(out.source.sizesFrom).toBe("brand-chart");
    expect(out.brand).toBe("Nike");
  });

  it("serves the brand's BODY ranges, not an invented garment chest", () => {
    // The distinction the whole layer rests on. `chestCm` is the garment's flat
    // chest; Nike published body ranges. A body number in the garment field would
    // make every Nike recommendation wrong by about a full size, in the same
    // direction, which reads as a tuning problem rather than a bug.
    const out = extractFromUrl(nikeTop);
    const m = out.sizes.find((s) => s.label === "M")!;
    expect(m.bodyChestMinCm).toBe(95.3);
    expect(m.bodyChestMaxCm).toBe(104.1);
    expect(m.chestCm).toBeUndefined();
    expect(out.sizes.every((s) => s.chestCm === undefined)).toBe(true);
  });

  it("carries a source URL and a capture date, so every number is checkable", () => {
    const out = extractFromUrl(nikeTop);
    expect(out.source.chart?.sourceUrl).toMatch(/^https:\/\/www\.nike\.com\//);
    expect(out.source.chart?.capturedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(out.source.chart?.kind).toBe("body");
  });

  it("keeps derived=true so extractSmart still tries to read the real page", () => {
    // A brand chart is not product-specific. If the page IS readable, its own
    // chart must win — returning early here would trade the better source for
    // the more convenient one.
    expect(extractFromUrl(nikeTop).source.derived).toBe(true);
  });

  it("falls through to the synthesized ladder for a brand with no chart", () => {
    const out = extractFromUrl("https://www.patagonia.com/product/mens-rain-jacket/85220.html");
    expect(out.source.sizesFrom).toBe("estimated");
    expect(out.source.chart).toBeUndefined();
  });

  it("does not use a men's tops chart for women's, or for trousers", () => {
    const womens = extractFromUrl("https://www.nike.com/t/womens-dri-fit-t-shirt/ABC123");
    expect(womens.source.sizesFrom).toBe("estimated");
    const pants = extractFromUrl("https://www.nike.com/t/mens-training-pants/ABC123");
    expect(pants.source.sizesFrom).toBe("estimated");
  });
});
