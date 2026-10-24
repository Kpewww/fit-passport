// Brand size guides collected into the repo (Session 103).
//
// An agent (or a person) copies a brand's own size guide from the brand's own site
// into data/brand-guides/<file>.json, with a screenshot. A person checks it against
// the screenshot and adds their name to `verifiedBy`. Only then does it count:
// `npm run guides` compiles the verified files into brandGuides.generated.json, which
// brandOffsets.ts reads as the brand's official guide, exactly like one typed on /admin.
// The task and its rules: todo/people/09-brand-size-guides.md.

import { z } from "zod";

const num = z.number().positive().max(400).optional();

export const GuideRow = z
  .object({
    // Up to 24: some brands print long labels (L.L.Bean women's, reported Session 103).
    label: z.string().trim().min(1).max(24),
    chestMin: num, chestMax: num, waistMin: num, waistMax: num,
    /** When the page prints ONE number per size, not a range. Kept as printed; never widened into a range. */
    chest: num, waist: num,
  })
  .refine((r) => (r.chestMin == null) === (r.chestMax == null), "chestMin and chestMax come together")
  .refine((r) => (r.waistMin == null) === (r.waistMax == null), "waistMin and waistMax come together")
  .refine((r) => r.chestMin == null || r.chestMax! > r.chestMin, "chestMax must be above chestMin")
  .refine((r) => r.waistMin == null || r.waistMax! > r.waistMin, "waistMax must be above waistMin")
  .refine((r) => r.chest == null || r.chestMin == null, "chest OR chestMin/chestMax, not both")
  .refine((r) => r.waist == null || r.waistMin == null, "waist OR waistMin/waistMax, not both")
  .refine((r) => r.chestMin != null || r.waistMin != null || r.chest != null || r.waist != null, "a row needs chest or waist");

export const GuideFile = z.object({
  brand: z.string().trim().min(1).max(80),
  line: z.enum(["mens", "womens"]),
  /** body = "fits a chest of 96–104"; garment = the clothing measured flat. Only body counts. */
  kind: z.enum(["body", "garment"]),
  units: z.enum(["in", "cm"]),
  sourceUrl: z.string().url().max(500).refine((u) => u.startsWith("https://"), "https only"),
  /** The page's own words that say body or garment, copied exactly. */
  kindEvidence: z.string().min(3).max(300),
  capturedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  capturedBy: z.string().min(1).max(80),
  screenshot: z.string().regex(/^screenshots\/[\w.-]+\.(png|jpe?g)$/),
  note: z.string().max(300).optional().nullable(),
  /**
   * The garments this chart was printed for, as engine categories ("jacket", "sweater",
   * "shirt", "tshirt", "polo", "hoodie", "top"). Absent = every top (Session 103):
   * a brand's outerwear chart must not size its T-shirts.
   */
  appliesTo: z.array(z.enum(["tshirt", "top", "shirt", "sweater", "jacket", "hoodie", "polo"])).min(1).optional(),
  /** The brand's general size guide, or the chart a product page shows (preferred when both exist). */
  variant: z.enum(["general", "product"]).default("general"),
  /** A person reviewed every number against the page and approved it. False = not counted. */
  reviewed: z.boolean().default(false),
  /** Who reviewed: "founder", or "claude" when the founder delegated the review (Session 103). */
  reviewedBy: z.string().max(40).optional(),
  /** Older files named the reviewer instead (Session 103, before the founder chose a plain flag). */
  verifiedBy: z.array(z.string().min(1)).default([]),
  rows: z.array(GuideRow).min(2).max(20),
});

export type GuideFileT = z.infer<typeof GuideFile>;

/** What the engine reads: verified body guides, their printed ranges, or bands derived from single numbers. */
export type CompiledGuide = Pick<GuideFileT, "brand" | "line" | "units" | "sourceUrl" | "capturedAt"> & {
  appliesTo?: GuideFileT["appliesTo"];
  variant?: GuideFileT["variant"];
  /**
   * The chart prints one number per size, and these ranges are ours: each size
   * reaches halfway to its neighbours (decision 07). An estimate, never credited
   * as the brand's chart, and never used to calibrate other brands.
   */
  derived?: true;
  rows: Array<{ label: string; chestMin?: number; chestMax?: number; waistMin?: number; waistMax?: number }>;
};

const r2 = (x: number) => Math.round(x * 100) / 100;

/**
 * One printed number per size, as bands reaching halfway to the neighbouring sizes
 * (decision 07, approved Session 103): S 37.0, M 38.6, L 40.2 gives M 37.8–39.4.
 * The smallest and largest sizes mirror their one neighbour. The same rule the
 * evaluation grades single-number truth by (eval/lib.ts acceptableSizes). Null
 * unless the numbers rise size by size, since a band needs an order to sit in.
 */
export function halfwayBands(values: number[]): Array<[number, number]> | null {
  if (values.length < 2) return null;
  for (let i = 1; i < values.length; i++) if (!(values[i] > values[i - 1])) return null;
  return values.map((v, i) => {
    const below = i > 0 ? (values[i - 1] + v) / 2 : v - (values[1] - v) / 2;
    const above = i < values.length - 1 ? (v + values[i + 1]) / 2 : v + (v - values[i - 1]) / 2;
    return [r2(below), r2(above)];
  });
}

function compileRows(f: GuideFileT): Pick<CompiledGuide, "rows" | "derived"> {
  const printed = f.rows
    .filter((r) => r.chestMin != null || r.waistMin != null)
    .map(({ label, chestMin, chestMax, waistMin, waistMax }) => ({ label, chestMin, chestMax, waistMin, waistMax }));
  if (printed.length > 0) return { rows: printed };
  // Only when EVERY size prints a single chest number: a chart that mixes ranges
  // and single numbers keeps its printed ranges alone (above).
  if (!f.rows.every((r) => r.chest != null)) return { rows: [] };
  // A label printed twice (Madewell's "0 / XS", Tommy's two 0s) leaves no way to say
  // which band is which size.
  if (new Set(f.rows.map((r) => r.label.trim().toLowerCase())).size !== f.rows.length) return { rows: [] };
  const chest = halfwayBands(f.rows.map((r) => r.chest!));
  if (!chest) return { rows: [] };
  const waist = f.rows.every((r) => r.waist != null) ? halfwayBands(f.rows.map((r) => r.waist!)) : null;
  return {
    derived: true,
    rows: f.rows.map((r, i) => ({
      label: r.label, chestMin: chest[i][0], chestMax: chest[i][1],
      ...(waist ? { waistMin: waist[i][0], waistMax: waist[i][1] } : {}),
    })),
  };
}

export function compile(files: GuideFileT[]): CompiledGuide[] {
  return files
    .filter((f) => f.kind === "body" && (f.reviewed || f.verifiedBy.length > 0))
    .map((f) => ({
      brand: f.brand, line: f.line, units: f.units, sourceUrl: f.sourceUrl, capturedAt: f.capturedAt,
      ...(f.appliesTo ? { appliesTo: f.appliesTo } : {}),
      variant: f.variant,
      ...compileRows(f),
    }))
    .filter((g) => g.rows.length > 0)
    .sort((a, b) => `${a.brand}|${a.line}`.localeCompare(`${b.brand}|${b.line}`));
}

/** Garments every chart of a brand is for: a chart limited to none of these (outerwear only) is not a tops chart. */
export const CORE_TOPS = ["tshirt", "top", "shirt", "sweater", "hoodie", "polo"] as const;

/** Whether a chart counts for the brand's calibration: tops charts, not outerwear-only ones. */
export function isTopsChart(g: Pick<CompiledGuide, "appliesTo">): boolean {
  return !g.appliesTo || g.appliesTo.some((c) => (CORE_TOPS as readonly string[]).includes(c));
}

/**
 * The best chart for a product of this brand and line: printed ranges before derived
 * bands, one printed for its garment before one for every top, a product-page chart
 * before the general guide. Null when
 * the brand's only charts are for other garments.
 */
export function pickGuide<G extends Pick<CompiledGuide, "appliesTo" | "variant" | "derived">>(candidates: G[], engineCategory: string | null): G | null {
  const fits = candidates.filter((g) => !g.appliesTo || (engineCategory != null && g.appliesTo.includes(engineCategory as never)));
  // Any printed range before any derived band (decision 07); then the garment's own chart, then a product chart.
  const rank = (g: G) => (g.derived ? 4 : 0) + (g.appliesTo ? 0 : 2) + (g.variant === "product" ? 0 : 1);
  return fits.sort((a, b) => rank(a) - rank(b))[0] ?? null;
}
