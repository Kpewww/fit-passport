// What a pasted product link may pre-fill in the closet's add flow (Session 80).
//
// The route used to return 200 with whatever the extractor produced, and the page
// said "Read … from {host}" either way. Measured on real links before the change:
// H&M and Arc'teryx were blocked and still came back with a brand guessed from the
// domain and five invented chest measurements; a J.Crew link came back as a COS
// demo shirt; Patagonia's bot page became the product name. This decides, from the
// extractor's own provenance, what may be offered as read:
//
//   - nothing from a page we never read (blocked, unreachable, a login or bot
//     wall — `categoryGuessed` with estimated sizes means no garment was found);
//   - a size label only when the page listed it (never the synthesized ladder,
//     never a brand guide's labels),
//     and only if it is a valid size for the category;
//   - a garment measurement only from a real chart (page, brand chart, or a demo
//     fixture that says it is one) — the stored number must carry its provenance
//     (invariant ㊷), and an invented number has none worth carrying;
//   - the category question is skipped only when the category came from the page.

import type { ExtractedProduct } from "./extractor";
import { garmentFor } from "./garments";
import { isValidSize } from "./sizeSystems";

export type ClosetSizeRow = {
  label: string;
  chestCm: number | null;
  shoulderCm: number | null;
  sleeveCm: number | null;
  lengthCm: number | null;
};

export type ClosetExtract =
  | {
      result: "read";
      /** A curated demo sample answered this link, not a page. */
      demo: boolean;
      brand: string | null;
      suggestedName: string | null;
      /** One of the closet's own category keys, or null when it has to be asked. */
      category: string | null;
      /** True when the page itself named the garment — the question can be skipped. */
      categoryFromPage: boolean;
      gender: string | null;
      /** Labels the page offered, valid for the category. Never an invented ladder. */
      sizeLabels: string[];
      /** Garment measurements per size, from a real chart only. */
      sizeRows: ClosetSizeRow[];
      /** Provenance for sizeRows, stored as `garmentMeasuredFrom`. Null when there are none. */
      measuredFrom: "page" | "brand-chart" | "fixture" | null;
      host: string | null;
    }
  | { result: "unreadable"; host: string | null };

const MEASURED = new Set(["page", "brand-chart", "fixture"]);

export function closetExtract(ex: ExtractedProduct): ClosetExtract {
  const s = ex.source ?? ({} as ExtractedProduct["source"]);
  const host = s.host ?? null;
  const demo = s.sizesFrom === "fixture";
  const pageUnread = s.fetch === "blocked" || s.fetch === "unreachable" || s.fetch === "skipped";
  const noGarment = s.categoryGuessed === true && s.sizesFrom === "estimated";
  if (!demo && (pageUnread || noGarment)) return { result: "unreadable", host };

  const category = ex.category && garmentFor(ex.category) ? ex.category : null;
  // A model's category is not the page's word: the closet still asks (Session 84c).
  const categoryFromPage = category != null && (demo || (!s.categoryGuessed && s.categoryFrom !== "url" && s.categoryFrom !== "model" && s.categoryFrom != null));

  const realSizes = !s.sizesSynthesized && s.sizesFrom !== "estimated" ? ex.sizes : [];
  // Labels the PAGE listed. A brand chart's labels are the brand's guide, not what
  // this item is offered in, so they are not shown as "sizes on the page".
  const labelsOffered = !s.sizesSynthesized && s.sizesFrom !== "brand-chart" ? ex.sizes.map((z) => z.label.trim()).filter(Boolean) : [];
  const sizeLabels = [...new Set(category ? labelsOffered.filter((l) => isValidSize(category, l)) : [])];

  const sizeRows = MEASURED.has(s.sizesFrom ?? "")
    ? realSizes
        .map((z) => ({
          label: z.label,
          chestCm: z.chestCm ?? null,
          shoulderCm: z.shoulderCm ?? null,
          sleeveCm: z.sleeveCm ?? null,
          lengthCm: (z as { lengthCm?: number | null }).lengthCm ?? null,
        }))
        .filter((r) => r.chestCm != null || r.shoulderCm != null || r.sleeveCm != null || r.lengthCm != null)
    : [];

  return {
    result: "read",
    demo,
    brand: ex.brand?.trim() || null,
    suggestedName: ex.productName?.trim() || null,
    category,
    categoryFromPage,
    gender: ex.gender ?? null,
    sizeLabels,
    sizeRows,
    measuredFrom: sizeRows.length ? (s.sizesFrom as "page" | "brand-chart" | "fixture") : null,
    host,
  };
}
