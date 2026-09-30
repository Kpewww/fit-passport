import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { PatchBody, SaveBody, offeredLabels, savedUrlKey } from "./savedInput";
import { ItemSchema } from "./closetItemInput";

describe("the to-buy list recognises the same product saved twice", () => {
  it("ignores www, a trailing slash, tracking parameters and their order", () => {
    const a = savedUrlKey("https://www.uniqlo.com/us/en/products/E474244-000/00/?utm_source=x&colorDisplayCode=00");
    const b = savedUrlKey("uniqlo.com/us/en/products/E474244-000/00");
    expect(a).toBe(b);
  });
  it("keeps the parameters that name the product (Taobao's id, Gap's pid)", () => {
    expect(savedUrlKey("https://item.taobao.com/item.htm?spm=a1&id=735442198384")).toBe("item.taobao.com/item.htm?id=735442198384");
    expect(savedUrlKey("https://item.taobao.com/item.htm?id=1")).not.toBe(savedUrlKey("https://item.taobao.com/item.htm?id=2"));
    expect(savedUrlKey("https://www.gap.com/browse/product.do?pid=440775082&vid=1")).toBe("gap.com/browse/product.do?pid=440775082");
  });
  it("refuses what is not a link", () => {
    expect(savedUrlKey("not a link")).toBeNull();
  });
});

describe("what a save may contain", () => {
  it("keeps a category only if the closet can file it", () => {
    expect(SaveBody.parse({ url: "https://x.test/p", category: "shirt" }).category).toBe("shirt");
    expect(SaveBody.parse({ url: "https://x.test/p", category: "dress" }).category).toBeNull();
  });
  it("leaves out of an edit what the edit does not mention (changing the size kept wiping the category)", () => {
    const edit = PatchBody.parse({ id: "s1", size: "L" });
    expect(Object.entries(edit).filter(([, v]) => v !== undefined)).toEqual([["id", "s1"], ["size", "L"]]);
  });
  it("offers only sizes the page listed — never an invented ladder or a brand guide's labels", () => {
    const sizes = [{ label: "S" }, { label: "M" }, { label: "M" }];
    expect(offeredLabels(sizes, { sizesFrom: "page" })).toEqual(["S", "M"]);
    expect(offeredLabels(sizes, { sizesFrom: "estimated", sizesSynthesized: true })).toEqual([]);
    expect(offeredLabels(sizes, { sizesFrom: "brand-chart" })).toEqual([]);
  });
});

describe("a saved product joins the closet only as a garment the user has worn", () => {
  const base = { brand: "COS", category: "shirt", size: "M", fromSavedId: "s1" };
  it("is refused without a fit report — the default rating would make it a known-good anchor", () => {
    expect(ItemSchema.safeParse(base).success).toBe(false);
  });
  it("is accepted with one", () => {
    expect(ItemSchema.safeParse({ ...base, fitDirection: -3 }).success).toBe(true);
  });
  it("leaves the ordinary add unchanged (a report is still optional there)", () => {
    expect(ItemSchema.safeParse({ brand: "COS", category: "shirt", size: "M" }).success).toBe(true);
  });
});

describe("nothing that learns or counts reads the to-buy list", () => {
  // The whole point of a separate table (schema comment on SavedItem): the engine,
  // badges, the public view, the community and evidence never see a product that
  // nobody has worn. Only the list's own route and the closet's move may touch it.
  const SRC = join(dirname(fileURLToPath(import.meta.url)), "..");
  const files = (d: string): string[] =>
    readdirSync(d).flatMap((f) => {
      const p = join(d, f);
      return statSync(p).isDirectory() ? files(p) : /\.(ts|tsx)$/.test(f) && !/\.test\./.test(f) ? [p] : [];
    });
  const ALLOWED = new Set(["app/api/saved/route.ts", "app/api/closet/route.ts"]);
  it("finds savedItem only where it is allowed", () => {
    const readers = files(SRC)
      .filter((f) => /prisma\.savedItem|savedItem\./.test(readFileSync(f, "utf8")))
      .map((f) => relative(SRC, f).split("\\").join("/"));
    expect(readers.filter((f) => !ALLOWED.has(f))).toEqual([]);
    expect(readers.length).toBeGreaterThan(0);
  });
});
