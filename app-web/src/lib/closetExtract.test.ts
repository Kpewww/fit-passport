import { describe, it, expect } from "vitest";
import { closetExtract } from "./closetExtract";
import { extractFromUrl, type ExtractedProduct } from "./extractor";
import { DEMO_PRODUCTS } from "./demoProducts";

// Shapes taken from real links measured on 2026-09-30 (DEVLOG Session 80c).
const ladder = ["XS", "S", "M", "L", "XL"].map((label, i) => ({ label, chestCm: 92 + 5 * i, shoulderCm: 42 + i }));
type Src = Omit<ExtractedProduct["source"], "derived">;
function product(source: Src, over: Partial<ExtractedProduct> = {}): ExtractedProduct {
  return { retailer: "Shop", brand: "Shop", productName: "A Tee", category: "tshirt", sizes: ladder, source: { derived: true, ...source }, ...over } as ExtractedProduct;
}

describe("closet add-by-link: what a pasted link may pre-fill", () => {
  it("pre-fills nothing from a store that blocked us (H&M, Arc'teryx)", () => {
    const hm = product({ url: "u", host: "www2.hm.com", fetch: "blocked", sizesFrom: "estimated", sizesSynthesized: true, categoryGuessed: true });
    expect(closetExtract(hm)).toEqual({ result: "unreadable", host: "www2.hm.com" });
    const arc = product({ url: "u", host: "arcteryx.com", fetch: "blocked", sizesFrom: "estimated", sizesSynthesized: true, categoryFrom: "url" });
    expect(closetExtract(arc).result).toBe("unreadable");
  });

  it("pre-fills nothing from a page with no garment on it (a Taobao login wall)", () => {
    const tb = product({ url: "u", host: "item.taobao.com", fetch: "ok", sizesFrom: "estimated", sizesSynthesized: true, categoryGuessed: true }, { brand: "", productName: "" });
    expect(closetExtract(tb).result).toBe("unreadable");
  });

  it("never offers an invented ladder as sizes or measurements (Everlane: page read, no chart)", () => {
    const ev = product({ url: "u", host: "www.everlane.com", fetch: "ok", sizesFrom: "estimated", sizesSynthesized: true, categoryFrom: "url" }, { productName: "The Organic Cotton Crew | White" });
    const r = closetExtract(ev);
    if (r.result !== "read") throw new Error("expected read");
    expect(r.suggestedName).toBe("The Organic Cotton Crew | White");
    expect(r.sizeLabels).toEqual([]);
    expect(r.sizeRows).toEqual([]);
    expect(r.measuredFrom).toBeNull();
    // The category came from words in the URL: offered, but still asked.
    expect(r.category).toBe("tshirt");
    expect(r.categoryFromPage).toBe(false);
  });

  it("offers a real chart's rows with their provenance, and skips the category the page named", () => {
    const page = product({ url: "u", host: "shop.test", fetch: "ok", sizesFrom: "page", categoryFrom: "page-structured" });
    const r = closetExtract(page);
    if (r.result !== "read") throw new Error("expected read");
    expect(r.sizeLabels).toEqual(["XS", "S", "M", "L", "XL"]);
    expect(r.sizeRows[2]).toMatchObject({ label: "M", chestCm: 102, shoulderCm: 44 });
    expect(r.measuredFrom).toBe("page");
    expect(r.categoryFromPage).toBe(true);
  });

  it("offers a page's real size labels even without measurements, dropping ones invalid for the category", () => {
    // Gap: the page's swatch values read as 1/2/3/4/5 — not t-shirt sizes.
    const gap = product(
      { url: "u", host: "www.gap.com", fetch: "ok", sizesFrom: "estimated", categoryFrom: "page-name" },
      { sizes: ["1", "2", "3"].map((label) => ({ label })) },
    );
    const r = closetExtract(gap);
    if (r.result !== "read") throw new Error("expected read");
    expect(r.sizeLabels).toEqual([]);
    const withLabels = closetExtract(product({ url: "u", host: "x", fetch: "ok", sizesFrom: "estimated", categoryFrom: "page-name" }, { sizes: [{ label: "S" }, { label: "M" }] }));
    if (withLabels.result !== "read") throw new Error("expected read");
    expect(withLabels.sizeLabels).toEqual(["S", "M"]);
    expect(withLabels.sizeRows).toEqual([]);
  });

  it("keeps a brand guide's rows but does not call its labels the page's (Nike)", () => {
    const nike = product({ url: "u", host: "www.nike.com", fetch: "ok", sizesFrom: "brand-chart", categoryFrom: "url" });
    const r = closetExtract(nike);
    if (r.result !== "read") throw new Error("expected read");
    expect(r.sizeLabels).toEqual([]);
    expect(r.measuredFrom).toBe("brand-chart");
  });

  it("asks the category when the extractor's category is not one of the closet's (parka; dress became one in Session 84, coat in 98)", () => {
    const r = closetExtract(product({ url: "u", host: "x", fetch: "ok", sizesFrom: "page", categoryFrom: "page-structured" }, { category: "parka" }));
    if (r.result !== "read") throw new Error("expected read");
    expect(r.category).toBeNull();
    expect(r.categoryFromPage).toBe(false);
  });

  it("keeps the finer type the product's name gives, sized the same (Session 98)", () => {
    const r = closetExtract(product({ url: "u", host: "x", fetch: "ok", sizesFrom: "page", categoryFrom: "page-structured" }, { category: "sweater", productName: "Ribbed Wool Cardigan" }));
    if (r.result !== "read") throw new Error("expected read");
    expect(r.category).toBe("cardigan");
    expect(r.categoryFromPage).toBe(true);
  });

  it("marks a demo link's sample as a demo, through the real extractor", () => {
    const r = closetExtract(extractFromUrl(DEMO_PRODUCTS[1].url));
    expect(r).toMatchObject({ result: "read", demo: true, brand: "COS", measuredFrom: "fixture", categoryFromPage: true });
  });
});
