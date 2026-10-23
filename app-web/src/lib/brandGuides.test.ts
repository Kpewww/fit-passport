import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { GuideFile, compile, type GuideFileT } from "./brandGuides";
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

  it("single printed numbers are kept as printed but never counted as a range", () => {
    const f = GuideFile.parse({ brand: "X", line: "mens", kind: "body", units: "in", sourceUrl: "https://x.com/size", kindEvidence: "Body measurements",
      capturedAt: "2026-10-22", capturedBy: "agent", screenshot: "screenshots/x.png", reviewed: true,
      rows: [{ label: "S", chest: 36 }, { label: "M", chest: 40 }] });
    expect(compile([f])).toEqual([]);
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
