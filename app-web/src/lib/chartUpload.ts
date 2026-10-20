// A size chart the shopper uploads or pastes, with no product page (Session 100).
//
// The case behind it: a school's holiday swag form links two size charts as PNGs on
// Google Drive (Independent Trading Co. IND4000Z, Comfort Colors 1566). No page to
// read, no brand or name on the chart itself, only the numbers. If the chart is
// complete enough to size someone, it should: the shopper names the item afterwards.
//
// The picture is read by the same reader as a picture picked on a page
// (chartImage.ts readUploadedChart → extractorLLM.ts visionReadPicked), and its
// transcription by the same rules as a page's table (pageParse.ts parseSizeGrid).
// Nothing is fetched: a link the shopper gives (the Drive address) is kept as the
// product's reference only.

import type { ExtractedProduct, ExtractedSize } from "./extractor";
import type { ChartImageResult } from "./chartImage";
import { settlePicked } from "./extractorLLM";

/**
 * What a chart lacks before it can size anyone, or null when it is complete enough:
 * at least three sizes, and at least three of them stating a girth the engine can
 * measure a wearer against (chest, waist or hip, as a garment measurement or a body
 * range). Lengths and sleeves alone cannot say whether a size goes round you.
 */
export function chartGaps(sizes: ExtractedSize[]): null | "few-sizes" | "no-girth" {
  if (sizes.length < 3) return "few-sizes";
  const girth = (s: ExtractedSize) =>
    s.chestCm != null || s.waistCm != null || s.hipCm != null ||
    (s.bodyChestMinCm != null && s.bodyChestMaxCm != null) ||
    (s.bodyWaistMinCm != null && s.bodyWaistMaxCm != null) ||
    (s.bodyHipMinCm != null && s.bodyHipMaxCm != null);
  return sizes.filter(girth).length >= 3 ? null : "no-girth";
}

/**
 * The product an uploaded chart stands for: no brand, no name (the shopper adds them
 * after the answer) and no garment type until they choose one. Null when the picture held
 * no chart. `link` is what the shopper said the chart belongs to, if anything.
 */
export function productFromUpload(
  read: ChartImageResult,
  opts: { sha: string; link?: string | null },
): ExtractedProduct | null {
  let host = "upload";
  if (opts.link) {
    try { host = new URL(opts.link).hostname.replace(/^www\./, ""); } catch { /* kept as "upload" */ }
  }
  const out: ExtractedProduct = {
    retailer: "",
    brand: "",
    productName: "",
    // A placeholder until the shopper names the garment (withUserCategory): while
    // categoryGuessed stands, /api/check asks ("pick-category") instead of scoring it.
    category: "tshirt",
    sizes: [],
    source: {
      url: opts.link ?? `upload:${opts.sha}`,
      host,
      derived: false,
      fetch: "skipped",
      categoryGuessed: true,
      chartImage: read.status === "bad-address" ? undefined : read.status,
    },
  };
  return settlePicked(out, read, "", undefined, "uploaded-picture") ? out : null;
}
