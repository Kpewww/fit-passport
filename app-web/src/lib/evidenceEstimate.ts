// When a page has no size chart, estimate from evidence instead of refusing (Session 103).
//
// The founder's call: "when we cannot be sure, give an estimate". The old fallback
// was a generic ladder of invented numbers, which was rightly refused. What exists
// now is evidence, so a top with letter (or standard) sizes and no chart gets body
// ranges from, strongest first:
//   1. the brand's own size guide, reviewed by a person (data/brand-guides): that IS
//      the brand's chart, so it is credited as "brand-chart", like Nike and Patagonia;
//   2. the size standard of the brand's market (sizeRegimes.ts: GB/T, JIS, KS,
//      EN 13402-3, ASTM numbers, BS 3666);
//   3. for US letters, which no standard defines, the brand's own US charts or the
//      consensus of US brands (brandCalibration.ts usLetterChest).
// Steps 2 and 3 leave `sizesFrom: "estimated"` (capped at 0.5 confidence, as before)
// and record what the estimate rests on in `source.estimate`, so the reason says so.
// A page we never read keeps its refusal unless the brand's own guide applies: the
// product is then still unknown, but the brand's numbers are real.

import type { ExtractedProduct, ExtractedSize } from "./extractor";
import type { CompiledGuide } from "./brandGuides";
import guides from "./brandGuides.generated.json";
import { bodyChestFor, regimeForCountry, type BodyRange } from "./sizeRegimes";
import { marketOf, normLabel, usLetterChest, type BrandReport } from "./brandCalibration";
import { lookupBrand } from "./brandRegistry";
import { domainForCategory } from "./sizeSystems";

const CM = 2.54;
const r1 = (x: number) => Math.round(x * 10) / 10;
const brandKey = (b: string) => b.toLowerCase().replace(/[^a-z0-9]/g, "");

/** A reviewed guide for this brand and line, or null. */
export function reviewedGuide(brand: string, line: "mens" | "womens", list: CompiledGuide[] = guides as CompiledGuide[]): CompiledGuide | null {
  const k = brandKey(brand);
  if (!k) return null;
  return list.find((g) => brandKey(g.brand) === k && g.line === line) ?? null;
}

function guideSizes(g: CompiledGuide): ExtractedSize[] {
  const cm = (v: number) => (g.units === "in" ? r1(v * CM) : v);
  return g.rows
    .filter((r) => r.chestMin != null && r.chestMax != null)
    .map((r) => ({
      label: r.label,
      bodyChestMinCm: cm(r.chestMin!), bodyChestMaxCm: cm(r.chestMax!),
      ...(r.waistMin != null && r.waistMax != null ? { bodyWaistMinCm: cm(r.waistMin), bodyWaistMaxCm: cm(r.waistMax) } : {}),
    }));
}

export type EstimateDeps = {
  /** Brand reports for the US letter consensus; empty in tests unless given. */
  reports: () => Promise<BrandReport[]>;
  guides?: CompiledGuide[];
};

/**
 * Fill a chartless top's sizes from evidence. Returns the product unchanged when
 * there is nothing to go on: an unknown brand, an unknown line, a non-top, or
 * fewer than two sizes with evidence.
 */
export async function fillFromEvidence(out: ExtractedProduct, deps: EstimateDeps): Promise<ExtractedProduct> {
  const src = out.source;
  if (src.sizesFrom !== "estimated" || src.listing) return out;
  if (domainForCategory(out.category ?? "") !== "top") return out;
  if (src.categoryGuessed) return out; // not known to be clothing: the refusal stands
  const line = out.gender === "womens" ? "womens" : out.gender === "mens" ? "mens" : null;
  if (!line || !out.brand) return out;
  const neverRead = src.fetch === "unreachable" || src.fetch === "blocked";

  // 1. The brand's own reviewed guide.
  const guide = reviewedGuide(out.brand, line, deps.guides);
  if (guide) {
    const rows = guideSizes(guide);
    const byLabel = new Map(rows.map((r) => [normLabel(r.label), r]));
    // The page's own labels when it listed real ones; the guide's rows otherwise.
    const sizes = src.sizesSynthesized
      ? rows
      : out.sizes.map((s) => {
          const m = byLabel.get(normLabel(s.label));
          return m ? { ...s, ...m, label: s.label } : s;
        });
    if (sizes.filter((s) => s.bodyChestMinCm != null).length >= 2) {
      const next = { ...out, sizes, source: { ...src, sizesFrom: "brand-chart" as const, chart: { sourceUrl: guide.sourceUrl, capturedAt: guide.capturedAt }, measurementKind: "body" as const, measurementKindFrom: "brand" as const } };
      delete next.source.sizesSynthesized;
      return next;
    }
  }
  if (neverRead) return out; // a standard says nothing about a product nobody read

  // 2 and 3. The market's standard, then the US letter consensus.
  const regime = regimeForCountry(marketOf(src.url ?? "") ?? lookupBrand(out.brand)?.country ?? null);
  if (!regime) return out;
  const reports = regime === "US" ? await deps.reports().catch(() => []) : [];
  const sources = new Set<string>();
  const sourcesZh = new Set<string>();
  const sizes = out.sizes.map((s) => {
    const r: BodyRange | null =
      bodyChestFor(s.label, regime, line, "top") ?? (regime === "US" ? usLetterChest(reports, out.brand!, s.label, line) : null);
    if (!r) return { label: s.label };
    sources.add(r.evidence.source);
    sourcesZh.add(r.evidence.sourceZh);
    return { label: s.label, bodyChestMinCm: r1(r.minCm), bodyChestMaxCm: r1(r.maxCm) };
  });
  if (sizes.filter((s) => s.bodyChestMinCm != null).length < 2) return out;
  const next = {
    ...out,
    sizes,
    source: { ...src, measurementKind: "body" as const, estimate: { sources: [...sources], sourcesZh: [...sourcesZh] } },
  };
  delete next.source.sizesSynthesized;
  return next;
}
