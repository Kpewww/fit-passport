// Curated size charts, read from the brands' own published size guides.
//
// WHY THIS EXISTS. Before this file, a recognised brand's "size chart" was two
// invented numbers in `extractor.ts`'s `BRAND_TABLE` — a `chestBaseCm` and a
// `stepCm` — linearly extrapolated into a ladder by `buildSizes()`, with the
// shoulder, sleeve and length identical for all thirteen brands. That is how a
// Patagonia check came to display "XS–XL, chest 106/111/116/121/126": five
// measurements no page ever stated, for a site we cannot even read. Invariant ㊼
// now refuses to serve that ladder, which was the right emergency fix and left
// the underlying problem in place — we still had nothing true to say about the
// brands people actually shop.
//
// A published size chart is the thing we should have had all along. It is the
// brand's own statement about its own sizing, it changes rarely, and reading one
// costs nothing at check time because it is already here.
//
// WHY THIS IS NOT THE SCRAPING THE PROJECT REJECTED. `docs/design/fetch-strategy.md`
// §2 rejects defeating technical access controls — a 403, a bot gate — because
// the lowest-risk posture is "public factual data, respect technical access
// controls". Nothing here defeats anything:
//   • Every chart records the URL it came from and how it was captured.
//   • `capturedBy: "fetch"` means the page answered a plain request AND its
//     robots.txt permits the path. Nike's robots.txt is literally
//     "# www.nike.com robots.txt -- just crawl it." with only */member/inbox
//     disallowed. J.Crew was deliberately NOT captured this way: its size-chart
//     page loads its numbers from */sizecharts-module/, which its robots.txt
//     disallows.
//   • `capturedBy: "manual"` means a person opened the page in their own browser
//     and typed the numbers in. That is the only route for a gated brand, and it
//     is a person using a website the way it is meant to be used.
// Measurements are facts, and facts are not copyrightable (Feist v. Rural, 499
// U.S. 340). ⚠️ Two caveats a lawyer should confirm before this library grows:
// the *arrangement* of a chart can carry a thin compilation copyright, and a
// site's terms may say more than its robots.txt. The safe form — the one used
// here — is to store the NUMBERS and never a copy of anyone's table markup or
// page layout.
//
// WHAT A CHART IS AND IS NOT. Most US brands publish BODY ranges ("size L fits a
// chest of 104–112cm"). That is `kind: "body"`, and it answers "who is this size
// for". It is NOT the same claim as a garment's flat chest, and conflating the
// two would put a body number where the engine expects a garment number and make
// every recommendation one full size wrong. So a body chart emits
// `bodyChestMinCm/MaxCm` — which `fitEngine.ts` already scores against — and
// never `chestCm`. A body chart also cannot feed the personal ease target
// (`personalEase.ts`), which needs `garment − body` and therefore needs a garment
// side. Japanese brands (Uniqlo, MUJI) tend to publish flat garment measurements
// instead, and per product rather than per brand, so they may never fit this
// shape at all.

import type { Gender } from "./extractor";
import { domainForCategory, type SizeDomain } from "./sizeSystems";
import { normalizeToAlpha } from "./sizing";

/** Units exactly as the brand printed them. See `rows` for why we keep them. */
export type ChartUnits = "in" | "cm";

/**
 * Whether the numbers describe the WEARER or the GARMENT. These are different
 * claims and the engine consumes them through different fields.
 */
export type ChartKind = "body" | "garment";

/** How the numbers got here — the provenance that makes the chart auditable. */
export type CaptureMethod = "fetch" | "manual";

/**
 * One row of a published chart, in the chart's own units.
 *
 * Ranges are stored as min/max because that is what body charts print. A garment
 * chart printing a single value sets min === max, so one shape covers both and
 * the reader never has to guess which convention a given brand used.
 */
export type BrandChartRow = {
  /** The size label exactly as the brand prints it ("M", "3XL", "EU 48"). */
  label: string;
  chestMin?: number;
  chestMax?: number;
  waistMin?: number;
  waistMax?: number;
};

export type BrandChart = {
  brand: string;
  /** Host substrings that select this chart, matched like `BRAND_TABLE`'s keys. */
  hostKeys: string[];
  gender: Gender;
  domain: SizeDomain;
  kind: ChartKind;
  units: ChartUnits;
  /** The page a human can open to check every number in `rows`. */
  sourceUrl: string;
  /** ISO date. Charts go stale; the UI shows this so nobody trusts it blindly. */
  capturedAt: string;
  capturedBy: CaptureMethod;
  /** Anything the brand states that changes how the numbers should be read. */
  note?: string;
  rows: BrandChartRow[];
};

/** Exact by definition (international inch). */
export const CM_PER_INCH = 2.54;

export function inToCm(inches: number): number {
  // One decimal. The source is printed to 0.5in ≈ 1.3cm, so more precision would
  // be inventing significance the chart does not have.
  return Math.round(inches * CM_PER_INCH * 10) / 10;
}

// ---------------------------------------------------------------------------
// The library.
//
// TO ADD A BRAND: open its size guide in a browser, type the numbers in exactly
// as printed, set `units` to what the page shows, set `kind` by whether the page
// says "body measurements" or gives flat garment measurements, and record the URL
// and today's date. Do not convert by hand — `chartToSizes` converts, and a test
// pins the conversion. Do not fill a brand in from a third-party size-chart
// aggregator: those are someone else's compilation, they are frequently stale,
// and they are the one input shape with a real copyright question attached.
// ---------------------------------------------------------------------------

export const BRAND_CHARTS: BrandChart[] = [
  {
    brand: "Nike",
    hostKeys: ["nike"],
    gender: "mens",
    domain: "top",
    kind: "body",
    units: "in",
    sourceUrl: "https://www.nike.com/size-fit/mens_tops_alpha",
    capturedAt: "2026-09-08",
    capturedBy: "fetch",
    // Nike states this on the page itself, and it is the reason `kind` is "body".
    note: "Nike states: “The measurements on the size chart are body measurements.”",
    rows: [
      { label: "XS", chestMin: 31.5, chestMax: 35, waistMin: 25.5, waistMax: 29 },
      { label: "S", chestMin: 35, chestMax: 37.5, waistMin: 29, waistMax: 32 },
      { label: "M", chestMin: 37.5, chestMax: 41, waistMin: 32, waistMax: 35 },
      { label: "L", chestMin: 41, chestMax: 44, waistMin: 35, waistMax: 38 },
      { label: "XL", chestMin: 44, chestMax: 48.5, waistMin: 38, waistMax: 43 },
      { label: "XXL", chestMin: 48.5, chestMax: 53.5, waistMin: 43, waistMax: 47.5 },
      // Kept because the chart prints them. `chartToSizes` drops 4XL — the
      // engine's ALPHA_LADDER has no rung above XXXL — and that drop is tested
      // rather than left to be discovered as a silently missing size.
      { label: "3XL", chestMin: 53.5, chestMax: 58, waistMin: 47.5, waistMax: 52.5 },
      { label: "4XL", chestMin: 58, chestMax: 63, waistMin: 52.5, waistMax: 57 },
    ],
  },
];

/**
 * The chart for a host + category + gender, or null.
 *
 * Returns null rather than falling back to a near-miss on purpose: a women's
 * chart served for a men's product, or a tops chart served for trousers, is worse
 * than having no chart, because the caller would present it as the brand's own
 * published sizing. The caller's job when this returns null is to read the page
 * or refuse — not to guess.
 */
export function chartFor(
  host: string,
  category: string,
  gender: Gender | undefined,
): BrandChart | null {
  const h = host.toLowerCase();
  const domain = domainForCategory(category);
  for (const chart of BRAND_CHARTS) {
    if (!chart.hostKeys.some((k) => h.includes(k))) continue;
    if (chart.domain !== domain) continue;
    // A unisex chart answers for anyone. A gendered chart answers only for its
    // own gender, and for a product whose gender we could not detect we decline:
    // men's and women's ladders differ by roughly a full size at the same label.
    if (chart.gender !== "unisex" && chart.gender !== gender) continue;
    return chart;
  }
  return null;
}

/** The shape `extractor.ts` consumes. Structurally its `ExtractedSize`. */
export type ChartSize = {
  label: string;
  region?: string;
  chestCm?: number;
  waistCm?: number;
  bodyChestMinCm?: number;
  bodyChestMaxCm?: number;
};

/**
 * A chart's rows as sizes in centimetres, dropping any label the engine's ladder
 * cannot place.
 *
 * The drop matters. `normalizeToAlpha` knows XXS…XXXL; a row labelled "4XL" has
 * no rung, and `alphaIndex` would return null for it downstream — so it would be
 * carried all the way into scoring and silently ignored there instead. Dropping
 * it here means what we show is what we scored.
 */
export function chartToSizes(chart: BrandChart): ChartSize[] {
  const toCm = (v: number) => (chart.units === "in" ? inToCm(v) : v);
  const out: ChartSize[] = [];

  for (const row of chart.rows) {
    if (normalizeToAlpha(row.label) == null) continue;

    const size: ChartSize = { label: row.label };

    if (row.chestMin != null && row.chestMax != null) {
      if (chart.kind === "body") {
        // The retailer's own body range — the strongest input `scoreMeasurementFit`
        // takes. Deliberately NOT `chestCm`: that field means the garment's flat
        // chest, and a body number sitting in it reads as a garment roughly one
        // size smaller than it is.
        size.bodyChestMinCm = toCm(row.chestMin);
        size.bodyChestMaxCm = toCm(row.chestMax);
      } else {
        // A garment chart printing a range is unusual; take the midpoint and say
        // so here rather than silently preferring one end.
        size.chestCm = toCm((row.chestMin + row.chestMax) / 2);
      }
    }

    if (row.waistMin != null && row.waistMax != null && chart.kind === "garment") {
      size.waistCm = toCm((row.waistMin + row.waistMax) / 2);
    }

    out.push(size);
  }

  return out;
}

/** How stale a chart is, for the UI that has to disclose it. */
export function chartAgeDays(chart: BrandChart, now: Date = new Date()): number {
  const captured = new Date(`${chart.capturedAt}T00:00:00Z`).getTime();
  return Math.floor((now.getTime() - captured) / 86_400_000);
}
