// The to-buy list ("待购", Session 80): what a save or an edit may contain, and how
// two saves of the same product are recognised.
//
// A saved product is NOT a garment the user owns. It lives in its own table
// (SavedItem) and nothing that learns or counts reads it — see the schema comment.

import { z } from "zod";
import { normalizeUrl } from "./normalizeUrl";
import { garmentFor } from "./garments";

/**
 * Query parameters that name a product rather than a visit — the same allowlist
 * the extension keeps when it sends a page (capture.js KEEP_PARAMS). Tracking
 * parameters (utm_*, spm, ref, …) differ on every visit and must not make one
 * product look like two.
 */
const KEEP_PARAMS = /^(id|productid|product_id|pid|sku|variant|variant_id|variantid|color|colour|style|item|itemid|dwvar_.+)$/i;

/** What duplicates are found by: host without www, path, product-naming params in order. */
export function savedUrlKey(raw: string): string | null {
  const url = normalizeUrl(raw);
  if (!url) return null;
  const u = new URL(url);
  const keep = [...u.searchParams.entries()]
    .filter(([k]) => KEEP_PARAMS.test(k))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k.toLowerCase()}=${v}`)
    .join("&");
  const path = u.pathname.replace(/\/+$/, "");
  return `${u.hostname.replace(/^www\./i, "").toLowerCase()}${path}${keep ? `?${keep}` : ""}`;
}

const text = (max: number) =>
  z
    .string()
    .max(max)
    .transform((v) => v.trim())
    .optional()
    .nullable();

/** A closet category key, or nothing — never a free string the closet cannot file. */
const category = z
  .string()
  .max(40)
  .optional()
  .nullable()
  // Absent stays absent: an edit that does not mention the category must not clear it.
  .transform((v) => (v === undefined ? undefined : v && garmentFor(v) ? v : null));

export const SaveBody = z.object({
  url: z.string().min(3).max(2048),
  /** The page as the extension captured it — read for name, brand and sizes only. */
  html: z.string().max(1_000_000).optional(),
  /** A check that already ran for this page; its product carries the chart. */
  productId: z.string().max(40).optional().nullable(),
  size: text(24),
  brand: text(80),
  productName: text(200),
  category,
  note: text(500),
});

export const PatchBody = z.object({
  id: z.string().min(1).max(40),
  size: text(24),
  brand: text(80),
  productName: text(200),
  category,
  note: text(500),
});

/** Labels offered on the page, kept for the edit picker: real labels only, de-duplicated. */
export function offeredLabels(
  sizes: Array<{ label: string }>,
  source: { sizesSynthesized?: boolean; sizesFrom?: string } | undefined,
): string[] {
  if (!source || source.sizesSynthesized || source.sizesFrom === "brand-chart") return [];
  return [...new Set(sizes.map((s) => s.label.trim()).filter((l) => l && l.length <= 24))].slice(0, 30);
}
