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
  /**
   * The chart cell by cell, as the model transcribed it (Session 100). When present,
   * the caller reads it with the page-table rules (pageParse.ts parseSizeGrid) and
   * `sizes` is only the model's own reading, kept as a fallback.
   */
  grid?: string[][] | null;
  /** Why a read failed ("http-401", "no-json", …), when it did. */
  detail?: string;
};

export type CachedRead = { sizesJson: string; header: string | null };

export interface ChartImageStore {
  get(key: string): Promise<CachedRead | null>;
  put(key: string, imageUrl: string, read: CachedRead, model: string): Promise<void>;
}

/** A picture by its address (picked on a page) or its bytes (uploaded, Session 100). */
export type ImageSource = string | { data: string; mediaType: string };

export type VisionRead = { sizes: ExtractedSize[]; header: string | null; grid?: string[][] | null };

/** A failed read says why, in a word or a status (Session 100), for the log and the
 *  shopper's own request: never the key, never the picture. */
export type VisionFailure = { failed: string };

export type VisionReader = (src: ImageSource) => Promise<VisionRead | "not-a-chart" | VisionFailure | null>;

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

  return readVia(key, url, url, deps);
}

/** The largest uploaded picture accepted, after the browser has scaled it down. */
export const MAX_UPLOAD_BYTES = 3 * 1024 * 1024;

/** What an uploaded picture is, by its first bytes — never by what the request says. */
export function uploadMediaType(bytes: Uint8Array): "image/jpeg" | "image/png" | "image/webp" | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  if (String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP") return "image/webp";
  return null;
}

/**
 * A size chart the shopper uploaded or pasted (Session 100): a school's swag chart on
 * Google Drive, a screenshot. Read once per picture for everyone, cached by the
 * picture's own bytes; the picture itself is not kept, only what was read from it.
 */
export async function readUploadedChart(
  bytes: Uint8Array,
  deps: { store: ChartImageStore; vision: VisionReader; model: string; hasKey: boolean },
): Promise<ChartImageResult & { sha: string }> {
  const sha = createHash("sha256").update(bytes).digest("hex");
  const mediaType = uploadMediaType(bytes);
  if (!mediaType || bytes.length > MAX_UPLOAD_BYTES) return { status: "bad-address", sizes: [], header: null, sha };
  const r = await readVia(`upload:${sha}`, `upload:${sha}`, { data: Buffer.from(bytes).toString("base64"), mediaType }, deps);
  return { ...r, sha };
}

async function readVia(
  key: string,
  label: string,
  src: ImageSource,
  deps: { store: ChartImageStore; vision: VisionReader; model: string; hasKey: boolean },
): Promise<ChartImageResult> {
  const hit = await deps.store.get(key).catch(() => null);
  if (hit) {
    const { sizes, grid } = parseCached(hit.sizesJson);
    const any = sizes.length >= 2 || (grid?.length ?? 0) >= 2;
    return { status: any ? "cached" : "not-a-chart", sizes, header: hit.header, grid };
  }
  if (!deps.hasKey) return { status: "unavailable", sizes: [], header: null };

  const read = await deps.vision(src);
  if (read == null || (typeof read === "object" && "failed" in read)) {
    return { status: "failed", sizes: [], header: null, detail: read?.failed ?? "unknown" };
  }
  if (read === "not-a-chart") {
    await deps.store.put(key, label, { sizesJson: "[]", header: null }, deps.model).catch(() => undefined);
    return { status: "not-a-chart", sizes: [], header: null };
  }
  // The transcription is what is kept when there is one: read again by today's rules
  // each time, so a better parser improves every cached chart too.
  const json = read.grid ? JSON.stringify({ grid: read.grid, sizes: read.sizes }) : JSON.stringify(read.sizes);
  await deps.store.put(key, label, { sizesJson: json, header: read.header }, deps.model).catch(() => undefined);
  return { status: "read", sizes: read.sizes, header: read.header, grid: read.grid ?? null };
}

/** A cached read: the sizes alone (before Session 100), or the transcription with them. */
function parseCached(json: string): { sizes: ExtractedSize[]; grid: string[][] | null } {
  try {
    const v = JSON.parse(json);
    if (Array.isArray(v)) return { sizes: v as ExtractedSize[], grid: null };
    if (v && typeof v === "object") {
      const grid = Array.isArray(v.grid) && v.grid.every((r: unknown) => Array.isArray(r)) ? (v.grid as string[][]) : null;
      return { sizes: Array.isArray(v.sizes) ? (v.sizes as ExtractedSize[]) : [], grid };
    }
  } catch { /* unreadable: nothing */ }
  return { sizes: [], grid: null };
}


