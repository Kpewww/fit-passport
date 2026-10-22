// Brand calibration: how a brand's own charts sit against its country's standard
// (Session 101e). Evidence grade B (sizeRegimes.ts).
//
// Where the observations come from: size charts already read from product pages in
// the ordinary course of a check (Product + SizeOption), and the curated charts in
// brandCharts.ts. Nothing is fetched for this. A page that refused us was never
// read (docs/design/fetch-strategy.md §2), so nothing here bypassed anything.
//
// Only BODY ranges count: a garment's flat chest is a different claim (invariant ㊿).
// A brand is reported once it has charts from at least MIN_PAGES distinct pages, so
// one odd product page cannot speak for a brand.
//
// What it says, per brand and size: the median body chest the brand's pages give,
// and, where the brand's country has a standard (sizeRegimes.ts), how far that sits
// from the standard, in cm and in the standard's own size steps.

import { bodyChestFor, regimeForCountry, type Regime } from "./sizeRegimes";

export const MIN_PAGES = 2;
/** US letters have no standard; a cross-brand consensus needs this many US brands. */
export const MIN_BRANDS_FOR_CONSENSUS = 3;

export type Observation = {
  brand: string;
  /** The page the chart was read from: what makes the number checkable. */
  url: string;
  line: string | null;
  label: string;
  bodyChestMinCm: number;
  bodyChestMaxCm: number;
};

export type BrandSizeRow = {
  label: string;
  pages: number;
  medianMidCm: number;
  /** The standard's range for this label in the brand's regime, when one exists. */
  standard: { minCm: number; maxCm: number; source: string } | null;
  /** Brand median minus the standard's midpoint, cm; positive = the brand runs larger. */
  offsetCm: number | null;
  /** The same offset in the standard's steps (its range width): +1 is one size larger. */
  offsetSteps: number | null;
};

export type BrandReport = {
  brand: string;
  country: string | null;
  regime: Regime | null;
  line: string;
  pages: number;
  urls: string[];
  sizes: BrandSizeRow[];
  /** Median offset in steps over the sizes that have a standard, or null. */
  runs: number | null;
};

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const r1 = (x: number) => Math.round(x * 10) / 10;
const normLabel = (l: string) => {
  const s = l.trim().toUpperCase().replace(/\s+/g, "");
  return ({ XXXL: "3XL", "2XL": "XXL" } as Record<string, string>)[s] ?? s;
};

export function calibrate(
  observations: Observation[],
  countryOf: (brand: string) => string | null,
): BrandReport[] {
  const groups = new Map<string, Observation[]>();
  for (const o of observations) {
    if (!(o.bodyChestMaxCm > o.bodyChestMinCm) || o.bodyChestMinCm < 50 || o.bodyChestMaxCm > 200) continue;
    const line = o.line === "womens" ? "womens" : "mens";
    const k = `${o.brand.trim().toLowerCase()}|${line}`;
    groups.set(k, [...(groups.get(k) ?? []), { ...o, line }]);
  }
  const out: BrandReport[] = [];
  for (const obs of groups.values()) {
    const urls = [...new Set(obs.map((o) => o.url))];
    if (urls.length < MIN_PAGES) continue;
    const brand = obs[0].brand.trim();
    const line = obs[0].line!;
    const country = countryOf(brand);
    const regime = regimeForCountry(country);
    const byLabel = new Map<string, Observation[]>();
    for (const o of obs) byLabel.set(normLabel(o.label), [...(byLabel.get(normLabel(o.label)) ?? []), o]);
    const sizes: BrandSizeRow[] = [];
    for (const [label, os] of byLabel) {
      const pages = new Set(os.map((o) => o.url)).size;
      if (pages < MIN_PAGES) continue;
      const mid = median(os.map((o) => (o.bodyChestMinCm + o.bodyChestMaxCm) / 2));
      const std = regime ? bodyChestFor(label, regime, line) : null;
      const stdMid = std ? (std.minCm + std.maxCm) / 2 : null;
      const width = std ? std.maxCm - std.minCm : null;
      sizes.push({
        label, pages, medianMidCm: r1(mid),
        standard: std ? { minCm: std.minCm, maxCm: std.maxCm, source: std.evidence.source } : null,
        offsetCm: stdMid != null ? r1(mid - stdMid) : null,
        offsetSteps: stdMid != null && width ? Math.round(((mid - stdMid) / width) * 100) / 100 : null,
      });
    }
    if (!sizes.length) continue;
    sizes.sort((a, b) => a.medianMidCm - b.medianMidCm);
    const steps = sizes.map((s) => s.offsetSteps).filter((x): x is number => x != null);
    out.push({ brand, country, regime, line, pages: urls.length, urls, sizes, runs: steps.length ? Math.round(median(steps) * 100) / 100 : null });
  }
  return out.sort((a, b) => b.pages - a.pages || a.brand.localeCompare(b.brand));
}

/**
 * US letters by consensus of US brands' own charts: the median, over brands, of each
 * brand's median body chest for that letter. Null until MIN_BRANDS_FOR_CONSENSUS
 * brands report the letter: two brands are an anecdote.
 */
export function usLetterConsensus(reports: BrandReport[], line: "mens" | "womens") {
  const us = reports.filter((r) => r.regime === "US" && r.line === line);
  const per = new Map<string, number[]>();
  for (const r of us) for (const s of r.sizes) per.set(s.label, [...(per.get(s.label) ?? []), s.medianMidCm]);
  const out: Record<string, { midCm: number; brands: number }> = {};
  for (const [label, mids] of per) if (mids.length >= MIN_BRANDS_FOR_CONSENSUS) out[label] = { midCm: r1(median(mids)), brands: mids.length };
  return out;
}
