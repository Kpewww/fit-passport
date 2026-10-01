// A size chart the shopper points at — Session 83.
//
// Some listings print their size chart only as a picture: an eBay listing's fifth
// photo, a Taobao description's tenth. Nothing on the page says which picture it is,
// and sending every picture to a vision model costs money and sends pictures that
// are not the chart (todo/engineering/10). So the shopper picks it in the popup, and
// only that one address is sent.
//
// Each picture is read once for everyone: the numbers are cached by the picture's
// address, and so is "this was not a chart". A failed read (no key, the picture
// would not load) is not cached — trying again later may work.
//
// The picture itself is never stored or shown by us (principle: no scraped brand
// imagery) — only the numbers printed on it.

import { createHash } from "node:crypto";
import type { ExtractedSize } from "./extractor";

export const MAX_IMAGE_URL = 2048;

export type ChartImageStatus = "read" | "cached" | "not-a-chart" | "unavailable" | "failed" | "bad-address";

export type ChartImageResult = {
  status: ChartImageStatus;
  sizes: ExtractedSize[];
  /** The chart's own heading and notes, as printed — read by the page-wording rules. */
  header: string | null;
};

export type CachedRead = { sizesJson: string; header: string | null };

export interface ChartImageStore {
  get(key: string): Promise<CachedRead | null>;
  put(key: string, imageUrl: string, read: CachedRead, model: string): Promise<void>;
}

export type VisionReader = (
  imageUrl: string,
) => Promise<{ sizes: ExtractedSize[]; header: string | null } | "not-a-chart" | null>;

/**
 * The address as cached: https only, no fragment. Null for anything else — a
 * picture on a page is served over https, and a data: or internal address is not
 * something we fetch.
 */
export function normalImageUrl(raw: string): string | null {
  if (typeof raw !== "string" || raw.length > MAX_IMAGE_URL) return null;
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    return null;
  }
  if (u.protocol !== "https:") return null;
  u.hash = "";
  return u.toString();
}

export function chartImageKey(url: string): string {
  return createHash("sha256").update(url).digest("hex");
}

/** Read the picked picture, from the cache when anyone has read it before. */
export async function readChartImage(
  raw: string,
  deps: { store: ChartImageStore; vision: VisionReader; model: string; hasKey: boolean },
): Promise<ChartImageResult> {
  const url = normalImageUrl(raw);
  if (!url) return { status: "bad-address", sizes: [], header: null };
  const key = chartImageKey(url);

  const hit = await deps.store.get(key).catch(() => null);
  if (hit) {
    const sizes = parseSizes(hit.sizesJson);
    return { status: sizes.length >= 2 ? "cached" : "not-a-chart", sizes, header: hit.header };
  }
  if (!deps.hasKey) return { status: "unavailable", sizes: [], header: null };

  const read = await deps.vision(url);
  if (read == null) return { status: "failed", sizes: [], header: null };
  if (read === "not-a-chart") {
    await deps.store.put(key, url, { sizesJson: "[]", header: null }, deps.model).catch(() => undefined);
    return { status: "not-a-chart", sizes: [], header: null };
  }
  await deps.store
    .put(key, url, { sizesJson: JSON.stringify(read.sizes), header: read.header }, deps.model)
    .catch(() => undefined);
  return { status: "read", sizes: read.sizes, header: read.header };
}

function parseSizes(json: string): ExtractedSize[] {
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? (v as ExtractedSize[]) : [];
  } catch {
    return [];
  }
}
