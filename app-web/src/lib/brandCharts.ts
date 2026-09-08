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
  /**
   * A SINGLE stated value, for charts that print one number per size rather than
   * a range ("M — chest 40 in"). Patagonia's men's chart is like this; Nike's
   * gives ranges. `chartToSizes` turns a point into a range at the midpoints to
   * its neighbours — see `pointRange` for why that is a reading of the chart
   * rather than an invention, and why it is done in one documented place.
   */
  chest?: number;
  waist?: number;
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

  // Patagonia. The case this whole layer was built for: its edge refuses every
  // automated client, so the app can never read a Patagonia page at check time.
  // These numbers came from the published guide, read in a real browser.
  //
  // Its two charts are shaped differently from each other AND from Nike's, which
  // is the general lesson: there is no standard size-chart shape.
  {
    brand: "Patagonia",
    hostKeys: ["patagonia"],
    gender: "mens",
    domain: "top",
    kind: "body",
    units: "in",
    sourceUrl: "https://www.patagonia.com/guides/size-fit/mens/",
    capturedAt: "2026-09-08",
    capturedBy: "manual",
    note: "Patagonia states: “Find your exact size using the body measurements below,” and “Chest is usually the best size predictor.”",
    // ONE value per size, not a range — hence `chest` rather than chestMin/Max.
    rows: [
      { label: "XXS", chest: 33 },
      { label: "XS", chest: 35 },
      { label: "S", chest: 37 },
      { label: "M", chest: 40 },
      { label: "L", chest: 44 },
      { label: "XL", chest: 47 },
      { label: "XXL", chest: 50 },
      { label: "XXXL", chest: 56 },
    ],
  },
  {
    brand: "Patagonia",
    hostKeys: ["patagonia"],
    gender: "womens",
    domain: "top",
    kind: "body",
    units: "in",
    sourceUrl: "https://www.patagonia.com/guides/size-fit/womens/",
    capturedAt: "2026-09-08",
    capturedBy: "manual",
    note: "Patagonia states: “Find your exact size using the body measurements below.” Each alpha size covers two numeric sizes, so these ranges are the chart's own, not derived.",
    // Here the chart DOES state a range per alpha size, because it lists two
    // numeric sizes under each letter (XS = 0 and 2). XXS covers only 00, so its
    // range is a single value — that is what the chart says, not a gap in it.
    rows: [
      { label: "XXS", chestMin: 31.5, chestMax: 31.5, waistMin: 24.5, waistMax: 24.5 },
      { label: "XS", chestMin: 32.5, chestMax: 33.5, waistMin: 25.5, waistMax: 26.5 },
      { label: "S", chestMin: 34.5, chestMax: 35.5, waistMin: 27.5, waistMax: 28.5 },
      { label: "M", chestMin: 36.5, chestMax: 37.5, waistMin: 29.5, waistMax: 30.5 },
      { label: "L", chestMin: 39, chestMax: 41, waistMin: 32, waistMax: 34 },
      { label: "XL", chestMin: 43, chestMax: 45, waistMin: 36, waistMax: 38 },
      { label: "XXL", chestMin: 47, chestMax: 49, waistMin: 40, waistMax: 42 },
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

  for (const [i, row] of chart.rows.entries()) {
    if (normalizeToAlpha(row.label) == null) continue;

    const size: ChartSize = { label: row.label };

    // A point-valued row becomes a range at the midpoints to its neighbours.
    const chestPoint = row.chest != null ? pointRange(chart.rows, i, "chest") : null;
    if (chestPoint && chart.kind === "body") {
      size.bodyChestMinCm = toCm(chestPoint[0]);
      size.bodyChestMaxCm = toCm(chestPoint[1]);
    } else if (chestPoint) {
      size.chestCm = toCm(row.chest!);
    }

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

/**
 * The body range a point-valued row covers: the midpoints to its neighbours.
 *
 * WHY THIS IS A READING AND NOT AN INVENTION. A chart printing "S 37in · M 40in ·
 * L 44in" is telling a shopper to pick the nearest size, so the boundary between
 * S and M sits at 38.5in by the chart's own numbers — every input is the brand's
 * and the rule is the one the chart is written to be used with. It is still a
 * derivation, which is exactly why it lives in one named function with tests
 * rather than being open-coded, and why a brand that publishes real ranges
 * (Nike) never goes through it.
 *
 * The end rows have only one neighbour, so they extend outward by that same
 * half-step — the alternative, a degenerate zero-width range, would tell the
 * engine we know the extremes far more precisely than the middle, which is
 * backwards.
 */
export function pointRange(
  rows: BrandChartRow[],
  i: number,
  key: "chest" | "waist",
): [number, number] | null {
  const at = (j: number) => rows[j]?.[key];
  const v = at(i);
  if (v == null) return null;

  const prev = at(i - 1);
  const next = at(i + 1);
  if (prev == null && next == null) return [v, v]; // a one-row chart says only this

  const halfDown = prev != null ? (v - prev) / 2 : (next! - v) / 2;
  const halfUp = next != null ? (next - v) / 2 : (v - prev!) / 2;
  return [v - halfDown, v + halfUp];
}

/** How stale a chart is, for the UI that has to disclose it. */
export function chartAgeDays(chart: BrandChart, now: Date = new Date()): number {
  const captured = new Date(`${chart.capturedAt}T00:00:00Z`).getTime();
  return Math.floor((now.getTime() - captured) / 86_400_000);
}
