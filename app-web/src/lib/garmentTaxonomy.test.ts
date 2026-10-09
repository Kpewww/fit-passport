// Garment types in two levels — Session 98. What this locks:
//   - every type is complete: a parent, an engine key, names in both languages;
//   - the 23 keys from before size, file and score exactly as they did;
//   - a finer type is sized as its engine key (a cardigan as a sweater);
//   - every category name in garmentCoverage.fixture.ts finds its type;
//   - the founder's case: 开衫 is under knitwear, outerwear and tops.

import { describe, expect, it } from "vitest";
import {
  ENGINE_CATEGORIES, GARMENT_TYPES, PARENT_ORDER, engineCategoryOf, garmentType, sameEngineCategory, typesUnder,
} from "./garmentTaxonomy";
import { refineType, searchGarmentTypes } from "./garmentSearch";
import { GARMENT_ALIASES } from "./garmentAliases";
import { COVERAGE } from "./garmentCoverage.fixture";
import { domainForCategory } from "./sizeSystems";
import { easeAdjustForCategory } from "./sizing";
import { defaultCollectionNameFor } from "./collections";
import { recommend, type EngineInput } from "./fitEngine";
import { en } from "../i18n/messages/en";
import { zh } from "../i18n/messages/zh";

// The 23 keys before Session 98, with the domain, ease and folder each had then.
const BEFORE: Record<string, { domain: string; ease: number; folder: string }> = {
  tshirt: { domain: "top", ease: 0, folder: "T-Shirts" }, top: { domain: "top", ease: 0, folder: "T-Shirts" },
  shirt: { domain: "top", ease: 0, folder: "Shirts" }, polo: { domain: "top", ease: 0, folder: "T-Shirts" },
  sweater: { domain: "top", ease: 0, folder: "Sweaters" }, hoodie: { domain: "top", ease: 4, folder: "Sweaters" },
  jacket: { domain: "top", ease: 6, folder: "Jackets" },
  pants: { domain: "bottom", ease: 0, folder: "Bottoms" }, jeans: { domain: "bottom", ease: 0, folder: "Bottoms" },
  shorts: { domain: "bottom", ease: 0, folder: "Bottoms" }, skirt: { domain: "bottom", ease: 0, folder: "Bottoms" },
  // Dresses, jumpsuits and swimsuits used to fall into "Other": they have folders now.
  dress: { domain: "onepiece", ease: 0, folder: "Dresses" }, jumpsuit: { domain: "onepiece", ease: 0, folder: "Dresses" },
  swimsuit: { domain: "onepiece", ease: 0, folder: "Swimwear" },
  shoes: { domain: "shoe", ease: 0, folder: "Footwear" }, sneakers: { domain: "shoe", ease: 0, folder: "Footwear" },
  boots: { domain: "shoe", ease: 0, folder: "Footwear" }, socks: { domain: "sock", ease: 0, folder: "Footwear" },
  hat: { domain: "accessory", ease: 0, folder: "Accessories" }, belt: { domain: "accessory", ease: 0, folder: "Accessories" },
  scarf: { domain: "accessory", ease: 0, folder: "Accessories" }, accessory: { domain: "accessory", ease: 0, folder: "Accessories" },
  other: { domain: "top", ease: 0, folder: "Other" },
};

describe("every type", () => {
  it("has a unique key, a parent, an engine key and names in both languages", () => {
    const keys = GARMENT_TYPES.map((g) => g.key);
    expect(new Set(keys).size).toBe(keys.length);
    const enCat = en.garment.cat as Record<string, string>;
    const zhCat = zh.garment.cat as Record<string, string>;
    for (const g of GARMENT_TYPES) {
      expect(g.parents.length, g.key).toBeGreaterThan(0);
      expect(ENGINE_CATEGORIES as readonly string[], g.key).toContain(g.engine);
      expect(enCat[g.key], g.key).toBe(g.label);
      expect(zhCat[g.key], g.key).toBeTruthy();
    }
    expect(Object.keys(enCat).sort()).toEqual([...keys].sort());
  });

  it("has search words, and no words for a type that does not exist", () => {
    for (const g of GARMENT_TYPES) expect(GARMENT_ALIASES[g.key]?.length, g.key).toBeGreaterThan(0);
    expect(Object.keys(GARMENT_ALIASES).sort()).toEqual(GARMENT_TYPES.map((g) => g.key).sort());
  });

  it("leaves no parent empty, and none a wall of words", () => {
    for (const p of PARENT_ORDER) {
      expect(typesUnder(p).length, p).toBeGreaterThanOrEqual(3);
      expect(typesUnder(p).length, p).toBeLessThanOrEqual(18);
    }
  });

  it("is sized as its engine key: domain and folder follow from it", () => {
    for (const g of GARMENT_TYPES) expect(domainForCategory(g.key), g.key).toBe(domainForCategory(g.engine));
  });
});

describe("the 23 keys from before", () => {
  for (const [key, was] of Object.entries(BEFORE)) {
    it(`${key} is its own engine key, with the domain, ease and folder it had`, () => {
      expect(garmentType(key)).toBeDefined();
      expect(engineCategoryOf(key)).toBe(key);
      expect(domainForCategory(key)).toBe(was.domain);
      expect(easeAdjustForCategory(key)).toBe(was.ease);
      expect(defaultCollectionNameFor(key)).toBe(was.folder);
    });
  }

  it("a key nobody knows still reads as a top, as before", () => {
    expect(domainForCategory("kaftan-ish")).toBe("top");
    expect(engineCategoryOf("Kaftan-ish")).toBe("kaftan-ish");
  });
});

describe("a finer type, to the engine", () => {
  const SWEATERS = [
    { label: "S", chestCm: 100 },
    { label: "M", chestCm: 106 },
    { label: "L", chestCm: 112 },
  ];
  const input = (closetCategory: string): EngineInput => ({
    profile: { chestCm: null, waistCm: null, shoulderCm: null, preferredFit: "regular" },
    product: { brand: "COS", category: "sweater" },
    sizes: SWEATERS,
    knownGood: [{ brand: "COS", category: closetCategory, size: "L", fitRating: 5 }],
    outcomes: [],
  });

  it("anchors a sweater on a cardigan from the same brand, exactly as on a sweater", () => {
    const asSweater = recommend(input("sweater"));
    const asCardigan = recommend(input("cardigan"));
    expect(asCardigan.best.label).toBe("L");
    expect(asCardigan.best.label).toBe(asSweater.best.label);
    expect(asCardigan.best.confidence).toBeCloseTo(asSweater.best.confidence, 6);
  });

  it("is the same kind of garment as its engine key, and not as another", () => {
    expect(sameEngineCategory("cardigan", "sweater")).toBe(true);
    expect(sameEngineCategory("trench", "jacket")).toBe(true);
    expect(sameEngineCategory("leggings", "pants")).toBe(true);
    expect(sameEngineCategory("cardigan", "jacket")).toBe(false);
  });

  it("keeps its own ease where the ease table has one", () => {
    expect(easeAdjustForCategory("coat")).toBe(8);
    expect(easeAdjustForCategory("blazer")).toBe(3);
    expect(easeAdjustForCategory("tank")).toBe(-3);
    expect(easeAdjustForCategory("sweatshirt")).toBe(4);
    expect(easeAdjustForCategory("trench")).toBe(6); // a jacket's
    expect(easeAdjustForCategory("cardigan")).toBe(0); // a sweater's
  });

  it("files where its parent's pieces go", () => {
    expect(defaultCollectionNameFor("cardigan")).toBe("Sweaters");
    expect(defaultCollectionNameFor("trench")).toBe("Jackets");
    expect(defaultCollectionNameFor("qipao")).toBe("Dresses");
    expect(defaultCollectionNameFor("leggings")).toBe("Bottoms");
    expect(defaultCollectionNameFor("longsleeve-tee")).toBe("T-Shirts");
    expect(defaultCollectionNameFor("blouse")).toBe("Shirts");
    expect(defaultCollectionNameFor("bra")).toBe("Intimates");
  });
});

describe("the founder's cardigan", () => {
  it("is one type, under knitwear, outerwear and tops", () => {
    for (const p of ["knitwear", "outerwear", "tops"] as const) {
      expect(typesUnder(p).map((g) => g.key), p).toContain("cardigan");
    }
    expect(GARMENT_TYPES.filter((g) => g.key === "cardigan")).toHaveLength(1);
  });

  it("is found first by any of its names", () => {
    for (const q of ["开衫", "cardigan", "Cardigans", "针织开衫", "毛衣开衫", "开襟毛衣", "女士针织开衫外套"]) {
      expect(searchGarmentTypes(q)[0]?.key, q).toBe("cardigan");
    }
  });
});

// What the picker searches: the aliases, plus the names shown in either language.
const shown = (k: string) => [(en.garment.cat as Record<string, string>)[k], (zh.garment.cat as Record<string, string>)[k]];

describe("coverage: every category name a shop uses finds its type", () => {
  for (const { name, expect: want, source } of COVERAGE) {
    it(`${source}: ${name}`, () => {
      const first = searchGarmentTypes(name, shown)[0]?.key;
      expect([want].flat(), `${name} found ${first ?? "nothing"}`).toContain(first);
    });
  }

  it("lists enough names to mean something", () => {
    expect(COVERAGE.length).toBeGreaterThanOrEqual(150);
  });
});

describe("search", () => {
  // The picker ships one language's names, so the other language's name has to be
  // reachable through the aliases: a reader of the English site can type 开衫.
  for (const [lang, other] of [["en", zh], ["zh", en]] as const) {
    it(`finds every ${lang === "en" ? "Chinese" : "English"} name from the ${lang} site`, () => {
      const here = (k: string) => [((lang === "en" ? en : zh).garment.cat as Record<string, string>)[k]];
      const missed = GARMENT_TYPES.filter((g) => {
        const name = (other.garment.cat as Record<string, string>)[g.key];
        return searchGarmentTypes(name, here)[0]?.key !== g.key;
      }).map((g) => `${g.key}: ${(other.garment.cat as Record<string, string>)[g.key]} -> ${searchGarmentTypes((other.garment.cat as Record<string, string>)[g.key], here)[0]?.key}`);
      expect(missed).toEqual([]);
    });
  }

  it("ignores case, spaces, hyphens and slashes", () => {
    expect(searchGarmentTypes("T-SHIRT")[0].key).toBe("tshirt");
    expect(searchGarmentTypes("t shirt")[0].key).toBe("tshirt");
    expect(searchGarmentTypes("down jacket")[0].key).toBe("down-jacket");
  });

  it("finds nothing for nothing", () => {
    expect(searchGarmentTypes("   ")).toEqual([]);
    expect(searchGarmentTypes("zzzz")).toEqual([]);
  });
});

describe("refineType: a closet piece's type from its name", () => {
  it("narrows to a type the engine sizes the same way", () => {
    expect(refineType("sweater", "Ribbed Cardigan")).toBe("cardigan");
    expect(refineType("jacket", "Wool Overcoat")).toBe("coat");
    expect(refineType("jacket", "Lightweight Puffer Vest")).toBe("gilet");
    expect(refineType("tshirt", "Long Sleeve Tee")).toBe("longsleeve-tee");
    expect(refineType("pants", "女士高腰打底裤")).toBe("leggings");
    expect(refineType("sweater", "羊毛针织开衫")).toBe("cardigan");
  });

  it("never crosses into another engine key, and matches Latin words whole", () => {
    expect(refineType("sweater", "Knit Dress")).toBe("sweater");
    expect(refineType("jacket", "Harvest Jacket")).toBe("jacket");
    expect(refineType("tshirt", null)).toBe("tshirt");
    expect(refineType("shirt", "Oxford Shirt")).toBe("shirt");
  });
});
