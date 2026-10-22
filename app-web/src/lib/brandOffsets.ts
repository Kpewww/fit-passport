// Brand calibration at check time (Session 101h). Server only.
//
// The observations behind /admin's "Brand calibration" panel, computed once and kept
// for CACHE_MS, so a check never waits on the aggregation. A closet piece whose brand
// has a report shifts its standard body range by how far that brand's own charts sit
// from the standard: for its own label when that label has enough pages, else the
// brand's median over its labels. Grade B (sizeRegimes.ts), always named in the reason.

import { prisma } from "./db";
import { calibrate, type BrandReport, type Observation } from "./brandCalibration";
import { lookupBrand } from "./brandRegistry";
import type { Regime } from "./sizeRegimes";
import { BRAND_CHARTS, chartToSizes } from "./brandCharts";
import type { CompiledGuide } from "./brandGuides";
import guides from "./brandGuides.generated.json";

const CACHE_MS = 10 * 60 * 1000;
let cache: { at: number; reports: BrandReport[]; observations: number } | null = null;

const lineOf = (raw: string | null) => {
  try { const g = raw ? JSON.parse(raw)?.gender : null; return g === "womens" ? "womens" : g === "mens" ? "mens" : null; } catch { return null; }
};

/** Body-chart rows read by ordinary checks, plus the curated charts. Fetches nothing. */
export async function loadObservations(): Promise<Observation[]> {
  const rows = await prisma.sizeOption.findMany({
    where: { bodyChestMinCm: { not: null }, bodyChestMaxCm: { not: null }, product: { brand: { not: null } } },
    select: { label: true, bodyChestMinCm: true, bodyChestMaxCm: true, product: { select: { brand: true, url: true, rawJson: true } } },
    take: 20000,
  });
  const obs: Observation[] = rows
    // An uploaded picture has no page to check it against: not evidence for a brand.
    .filter((r) => r.product.brand && /^https?:/.test(r.product.url))
    .map((r) => ({
      brand: r.product.brand!, url: r.product.url.split("?")[0], line: lineOf(r.product.rawJson),
      label: r.label, bodyChestMinCm: r.bodyChestMinCm!, bodyChestMaxCm: r.bodyChestMaxCm!,
    }));
  for (const c of BRAND_CHARTS.filter((c) => c.kind === "body")) {
    for (const s of chartToSizes(c)) {
      if (s.bodyChestMinCm == null || s.bodyChestMaxCm == null) continue;
      obs.push({ brand: c.brand, url: c.sourceUrl, line: c.gender === "womens" ? "womens" : "mens", label: s.label, bodyChestMinCm: s.bodyChestMinCm, bodyChestMaxCm: s.bodyChestMaxCm, official: true });
    }
  }
  // Guides an admin typed in from the brand's own page (Session 101h).
  const entries = await prisma.brandChartEntry.findMany({ where: { kind: "body" }, take: 2000 });
  for (const e of entries) {
    let rows: Array<{ label: string; chestMin?: number; chestMax?: number }> = [];
    try { rows = JSON.parse(e.rowsJson); } catch { continue; }
    const cm = (v: number) => (e.units === "in" ? Math.round(v * 2.54 * 10) / 10 : v);
    for (const r of rows) {
      if (r.chestMin == null || r.chestMax == null) continue;
      obs.push({ brand: e.brand, url: e.sourceUrl, line: e.line, label: r.label, bodyChestMinCm: cm(r.chestMin), bodyChestMaxCm: cm(r.chestMax), official: true });
    }
  }
  // Guides collected into the repo and verified by a person (brandGuides.ts).
  for (const g of guides as CompiledGuide[]) {
    const cm = (v: number) => (g.units === "in" ? Math.round(v * 2.54 * 10) / 10 : v);
    for (const r of g.rows) {
      if (r.chestMin == null || r.chestMax == null) continue;
      obs.push({ brand: g.brand, url: g.sourceUrl, line: g.line, label: r.label, bodyChestMinCm: cm(r.chestMin), bodyChestMaxCm: cm(r.chestMax), official: true });
    }
  }
  return obs;
}

/** Forget the cached report, so a newly entered guide counts on the next check. */
export function invalidateBrandReports() { cache = null; }

export async function brandReports(): Promise<{ reports: BrandReport[]; observations: number }> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache;
  try {
    const obs = await loadObservations();
    cache = { at: Date.now(), reports: calibrate(obs, (b) => lookupBrand(b)?.country ?? null), observations: obs.length };
  } catch {
    cache = { at: Date.now(), reports: [], observations: 0 };
  }
  return cache;
}

/** How far a brand's own charts put this label from its standard, or null. */
export function offsetFor(reports: BrandReport[], brand: string, line: string | null | undefined, label: string, regime: Regime | null) {
  // Only the market the piece was bought in: a brand's US pages say nothing about
  // its Japanese labels (brandCalibration.ts, marketOf).
  const r = reports.find((x) => x.brand.toLowerCase() === brand.trim().toLowerCase() && x.line === (line === "womens" ? "womens" : "mens") && x.regime === regime);
  if (!r || r.runs == null) return null;
  const own = r.sizes.find((s) => s.label === label.trim().toUpperCase() && s.offsetCm != null);
  const offsets = r.sizes.map((s) => s.offsetCm).filter((x): x is number => x != null).sort((a, b) => a - b);
  const median = offsets.length ? offsets[offsets.length >> 1] : null;
  const offsetCm = own?.offsetCm ?? median;
  return offsetCm == null ? null : { offsetCm, pages: r.pages };
}
