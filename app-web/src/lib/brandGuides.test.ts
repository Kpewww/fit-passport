import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { GuideFile, compile, halfwayBands, type GuideFileT } from "./brandGuides";
import generated from "./brandGuides.generated.json";

const dir = join(__dirname, "../../data/brand-guides");
const names = readdirSync(dir).filter((f) => f.endsWith(".json") && !f.startsWith("_")).sort();

describe("brand size guides in data/brand-guides (Session 103)", () => {
  const parsed: GuideFileT[] = [];
  for (const f of names) {
    it(`${f} is valid and has its screenshot`, () => {
      const p = GuideFile.safeParse(JSON.parse(readFileSync(join(dir, f), "utf8")));
      expect(p.success, p.success ? "" : JSON.stringify(p.error.issues)).toBe(true);
      if (!p.success) return;
      expect(existsSync(join(dir, p.data.screenshot)), `missing ${p.data.screenshot}`).toBe(true);
      parsed.push(p.data);
    });
  }

  it("brandGuides.generated.json is up to date (run `npm run guides`)", () => {
    const all = names.map((f) => GuideFile.parse(JSON.parse(readFileSync(join(dir, f), "utf8"))));
    expect(generated).toEqual(JSON.parse(JSON.stringify(compile(all))));
  });

  it("only reviewed BODY guides count", () => {
    const base = { brand: "X", line: "mens", kind: "body", units: "cm", sourceUrl: "https://x.com/size", kindEvidence: "body measurements",
      capturedAt: "2026-10-22", capturedBy: "agent", screenshot: "screenshots/x.png",
      rows: [{ label: "S", chestMin: 88, chestMax: 96 }, { label: "M", chestMin: 96, chestMax: 104 }] } as const;
    const ok = GuideFile.parse({ ...base, reviewed: true });
    expect(compile([GuideFile.parse({ ...base, verifiedBy: ["A"] })])).toHaveLength(1); // older files
    expect(compile([ok])).toHaveLength(1);
    expect(compile([GuideFile.parse(base)])).toHaveLength(0);
    expect(compile([GuideFile.parse({ ...base, kind: "garment", reviewed: true })])).toHaveLength(0);
    expect(compile([GuideFile.parse({ ...base, kind: "body", reviewed: true })])).toHaveLength(1);
  });

  it("single printed numbers become bands halfway to the next size, marked derived (decision 07)", () => {
    const base = { brand: "X", line: "mens", kind: "body", units: "in", sourceUrl: "https://x.com/size", kindEvidence: "Body measurements",
      capturedAt: "2026-10-22", capturedBy: "agent", screenshot: "screenshots/x.png", reviewed: true };
    const f = GuideFile.parse({ ...base, rows: [{ label: "S", chest: 37 }, { label: "M", chest: 38.6 }, { label: "L", chest: 40.2 }] });
    expect(compile([f])).toEqual([expect.objectContaining({
      derived: true,
      rows: [{ label: "S", chestMin: 36.2, chestMax: 37.8 }, { label: "M", chestMin: 37.8, chestMax: 39.4 }, { label: "L", chestMin: 39.4, chestMax: 41 }],
    })]);
    // Not when the numbers do not rise, a label is printed twice, or the chart mixes ranges and single numbers.
    expect(compile([GuideFile.parse({ ...base, rows: [{ label: "S", chest: 38 }, { label: "M", chest: 38 }] })])).toEqual([]);
    expect(compile([GuideFile.parse({ ...base, rows: [{ label: "0", chest: 32 }, { label: "0", chest: 33 }, { label: "2", chest: 34 }] })])).toEqual([]);
    const mixed = compile([GuideFile.parse({ ...base, rows: [{ label: "XS", chest: 34 }, { label: "S", chestMin: 35, chestMax: 37 }, { label: "M", chestMin: 38, chestMax: 40 }] })]);
    expect(mixed[0].derived).toBeUndefined();
    expect(mixed[0].rows.map((r) => r.label)).toEqual(["S", "M"]);
  });

  it("halfway bands: the outer sizes mirror their one neighbour", () => {
    expect(halfwayBands([80, 84, 88])).toEqual([[78, 82], [82, 86], [86, 90]]);
    expect(halfwayBands([40])).toBeNull();
  });

  it("a printed range is chosen before a derived band", () => {
    const printed = { variant: "general" as const };
    const derived = { variant: "product" as const, appliesTo: ["tshirt" as const], derived: true as const };
    expect(pickGuide([derived, printed], "tshirt")).toBe(printed);
    expect(pickGuide([derived], "tshirt")).toBe(derived);
  });

  it("rejects the usual copying mistakes", () => {
    const base = { brand: "X", line: "mens", kind: "body", units: "in", sourceUrl: "https://x.com/size", kindEvidence: "Body measurements",
      capturedAt: "2026-10-22", capturedBy: "agent", screenshot: "screenshots/x.png" };
    const bad = (rows: unknown[], extra = {}) => GuideFile.safeParse({ ...base, ...extra, rows }).success;
    expect(bad([{ label: "S", chestMin: 36, chestMax: 38 }, { label: "M", chestMin: 40, chestMax: 38 }])).toBe(false); // max below min
    expect(bad([{ label: "S", chestMin: 36 }, { label: "M", chestMin: 38, chestMax: 40 }])).toBe(false); // half a range
    expect(bad([{ label: "S", chestMin: 36, chestMax: 38 }])).toBe(false); // one row
    expect(bad([{ label: "S", chestMin: 36, chestMax: 38 }, { label: "M", chestMin: 38, chestMax: 40 }], { sourceUrl: "http://x.com" })).toBe(false);
  });
});

import { isTopsChart, pickGuide } from "./brandGuides";

describe("which chart a product gets (Session 103: a guide applies to its own garments)", () => {
  const general = { id: "general", variant: "general" as const };
  const product = { id: "product", variant: "product" as const };
  const outerwear = { id: "outer", variant: "general" as const, appliesTo: ["jacket" as const] };
  const knit = { id: "knit", variant: "product" as const, appliesTo: ["sweater" as const] };

  it("an outerwear chart never sizes a T-shirt", () => {
    expect(pickGuide([outerwear], "tshirt")).toBeNull();
    expect(pickGuide([outerwear], "jacket")?.id).toBe("outer");
  });
  it("a chart for this garment first, then a product-page chart, then the general guide", () => {
    expect(pickGuide([general, product, knit], "sweater")?.id).toBe("knit");
    expect(pickGuide([general, product, knit], "tshirt")?.id).toBe("product");
    expect(pickGuide([general], "tshirt")?.id).toBe("general");
  });
  it("an outerwear-only chart is left out of the brand's calibration", () => {
    expect(isTopsChart(outerwear)).toBe(false);
    expect(isTopsChart({ appliesTo: undefined })).toBe(true);
    expect(isTopsChart(knit)).toBe(true);
  });
});
