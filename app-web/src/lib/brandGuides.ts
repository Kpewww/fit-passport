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
    label: z.string().trim().min(1).max(12),
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
  /** Names of the people who checked every number against the screenshot. Empty = not counted. */
  verifiedBy: z.array(z.string().min(1)).default([]),
  rows: z.array(GuideRow).min(2).max(20),
});

export type GuideFileT = z.infer<typeof GuideFile>;

/** What the engine reads: verified body guides only, and only their printed RANGES. */
export type CompiledGuide = Pick<GuideFileT, "brand" | "line" | "units" | "sourceUrl"> & {
  rows: Array<{ label: string; chestMin?: number; chestMax?: number; waistMin?: number; waistMax?: number }>;
};

export function compile(files: GuideFileT[]): CompiledGuide[] {
  return files
    .filter((f) => f.kind === "body" && f.verifiedBy.length > 0)
    .map((f) => ({
      brand: f.brand, line: f.line, units: f.units, sourceUrl: f.sourceUrl,
      rows: f.rows
        .filter((r) => r.chestMin != null || r.waistMin != null)
        .map(({ label, chestMin, chestMax, waistMin, waistMax }) => ({ label, chestMin, chestMax, waistMin, waistMax })),
    }))
    .filter((g) => g.rows.length > 0)
    .sort((a, b) => `${a.brand}|${a.line}`.localeCompare(`${b.brand}|${b.line}`));
}
