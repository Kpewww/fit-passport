import { describe, expect, it } from "vitest";
import { fillFromEvidence, reviewedGuide } from "./evidenceEstimate";
import { calibrate, type Observation } from "./brandCalibration";
import { refusalFor } from "./checkPolicy";
import type { ExtractedProduct } from "./extractor";
import type { CompiledGuide } from "./brandGuides";

const product = (over: Omit<Partial<ExtractedProduct>, "source"> & { source?: Partial<ExtractedProduct["source"]> } = {}): ExtractedProduct => ({
  retailer: "x", brand: "Some Co", productName: "Tee", category: "tshirt", gender: "mens", material: "", fitNotes: "",
  sizes: [{ label: "S" }, { label: "M" }, { label: "L" }],
  ...over,
  source: { url: "https://someco.com/p/tee", host: "someco.com", derived: false, slug: "tee", sizesFrom: "estimated", fetch: "extension", categoryFrom: "page", ...(over.source ?? {}) },
} as ExtractedProduct);

const guide: CompiledGuide = { brand: "J.Crew", line: "mens", units: "in", sourceUrl: "https://www.jcrew.com/r/size-charts", capturedAt: "2026-10-22",
  rows: [{ label: "S", chestMin: 35, chestMax: 37 }, { label: "M", chestMin: 38, chestMax: 40 }, { label: "L", chestMin: 41, chestMax: 43 }] };
const noReports = { reports: async () => [] };
const us = () => "US";
const usReports = calibrate(["A", "B", "C"].flatMap((b, i) => ["S", "M", "L"].flatMap((l, j) => [1, 2].map((n): Observation =>
  ({ brand: b, url: `https://${b}.com/${n}`, line: "mens", label: l, bodyChestMinCm: 88 + 8 * j + i, bodyChestMaxCm: 96 + 8 * j + i, official: true })))), us);

describe("a chartless top is estimated from evidence (Session 103)", () => {
  it("the brand's reviewed guide is the brand's chart", async () => {
    const out = await fillFromEvidence(product({ brand: "J. Crew" }), { ...noReports, guides: [guide] });
    expect(out.source.sizesFrom).toBe("brand-chart");
    expect(out.source.chart).toEqual({ sourceUrl: guide.sourceUrl, capturedAt: "2026-10-22" });
    expect(out.sizes.find((s) => s.label === "M")).toMatchObject({ bodyChestMinCm: 96.5, bodyChestMaxCm: 101.6 });
    expect(refusalFor(out)).toBeNull();
  });

  it("replaces an invented ladder with the guide's own rows", async () => {
    const out = await fillFromEvidence(product({ brand: "J.Crew", sizes: [{ label: "XS", chestCm: 106 }], source: { sizesSynthesized: true } }), { ...noReports, guides: [guide] });
    expect(out.sizes.map((s) => s.label)).toEqual(["S", "M", "L"]);
    expect(out.source.sizesSynthesized).toBeUndefined();
  });

  it("a market standard when the brand has no guide (Japan: JIS)", async () => {
    const out = await fillFromEvidence(product({ brand: "Muji", source: { url: "https://www.muji.com/jp/p/tee" } }), { ...noReports, guides: [] });
    expect(out.source.sizesFrom).toBe("estimated");
    expect(out.source.estimate?.sources.join(" ")).toContain("JIS");
    expect(out.sizes.filter((s) => s.bodyChestMinCm != null)).toHaveLength(3);
  });

  it("US letters by the consensus of US brands, and a ladder is no longer refused", async () => {
    const before = product({ brand: "Gap", source: { sizesSynthesized: true, url: "https://www.gap.com/p" } });
    expect(refusalFor(before)?.error).toBe("no-chart-on-page");
    const out = await fillFromEvidence(before, { reports: async () => usReports, guides: [] });
    expect(out.source.sizesFrom).toBe("estimated");
    expect(out.source.estimate?.sources[0]).toContain("US brands");
    expect(refusalFor(out)).toBeNull();
  });

  it("nothing to go on: unknown brand, unknown line, not a top, or a listing", async () => {
    const cases = [
      product({ brand: "Nobody Knows Inc" }),
      product({ gender: undefined }),
      product({ category: "jeans" }),
      product({ source: { listing: true } as never }),
      product({ source: { sizesFrom: "page" } }),
    ];
    for (const c of cases) expect(await fillFromEvidence(c, { reports: async () => usReports, guides: [guide] })).toBe(c);
  });

  it("a page nobody read: only the brand's own guide, never a standard", async () => {
    const unread = product({ brand: "Gap", source: { fetch: "unreachable", url: "https://www.gap.com/p" } });
    expect(await fillFromEvidence(unread, { reports: async () => usReports, guides: [] })).toBe(unread);
    const withGuide = await fillFromEvidence(product({ brand: "J.Crew", source: { fetch: "blocked" } }), { ...noReports, guides: [guide] });
    expect(withGuide.source.sizesFrom).toBe("brand-chart");
  });

  it("a brand's outerwear chart does not size its T-shirt", async () => {
    const outer: CompiledGuide = { ...guide, appliesTo: ["jacket"] };
    const tee = await fillFromEvidence(product({ brand: "J.Crew", source: { url: "https://www.jcrew.com/p" } }), { reports: async () => usReports, guides: [outer] });
    expect(tee.source.sizesFrom).toBe("estimated"); // fell through to the US consensus
    const coat = await fillFromEvidence(product({ brand: "J.Crew", category: "jacket" }), { ...noReports, guides: [outer] });
    expect(coat.source.sizesFrom).toBe("brand-chart");
  });

  it("finds the brand from the store when the page names none (decision 03)", async () => {
    const out = await fillFromEvidence(product({ brand: "", retailer: "J.Crew" }), { ...noReports, guides: [guide] });
    expect(out.source.sizesFrom).toBe("brand-chart");
    // The extractor's placeholder is not a brand.
    const none = product({ brand: "", retailer: "Unknown retailer" });
    expect(await fillFromEvidence(none, { reports: async () => usReports, guides: [guide] })).toBe(none);
  });

  it("the page's own brand wins over the store's house chart", async () => {
    const other = product({ brand: "Nobody Knows Inc", retailer: "J.Crew" });
    const out = await fillFromEvidence(other, { reports: async () => usReports, guides: [guide] });
    expect(out.source.sizesFrom).not.toBe("brand-chart");
  });

  it("the store's country stands in for an unknown brand's market", async () => {
    const out = await fillFromEvidence(product({ brand: "Nobody Knows Inc", retailer: "Gap", source: { url: "https://www.gap.com/p" } }), { reports: async () => usReports, guides: [] });
    expect(out.source.sizesFrom).toBe("estimated");
    expect(out.source.estimate?.sources[0]).toContain("US brands");
  });

  it("a unisex top reads the men's chart", async () => {
    const out = await fillFromEvidence(product({ brand: "J.Crew", gender: "unisex" }), { ...noReports, guides: [guide] });
    expect(out.source.sizesFrom).toBe("brand-chart");
  });

  it("finds a guide by brand whatever the punctuation", () => {
    expect(reviewedGuide("j crew", "mens", [guide])).toBe(guide);
    expect(reviewedGuide("J.Crew", "womens", [guide])).toBeNull();
  });
});
