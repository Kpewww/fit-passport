// Pictures in and out of AI services (Session 104).
//
// In: a stored photo (a data URL, or a reference into the private store) becomes a
// base64 data URL, so no public address of a person's photo ever exists. Out: a
// provider's result (a data URL, or a short-lived address on the provider's CDN) is
// copied into our private store and only that copy is kept.

import { readPhoto, isStoredRef } from "../photoStore";

const MAX_BYTES = 15 * 1024 * 1024;
const IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

/** A stored photo as a base64 data URL, or null when there is none. */
export async function storedToDataUrl(stored: string | null | undefined): Promise<string | null> {
  if (!stored) return null;
  if (stored.startsWith("data:image/")) return stored;
  if (!isStoredRef(stored)) return null;
  const p = await readPhoto(stored);
  if (!p) return null;
  return `data:${p.type};base64,${Buffer.from(p.bytes).toString("base64")}`;
}

/**
 * A provider's result as a data URL our store accepts (png/jpeg/webp). A data URL is
 * taken as is; an https address is fetched once, capped in size, without Brotli
 * (we never run Node's Brotli decoder, see lib/safeFetch.ts).
 */
export async function resultToDataUrl(result: string, fetcher: typeof fetch = fetch): Promise<string> {
  if (result.startsWith("data:image/")) {
    const type = result.slice(5, result.indexOf(";"));
    if (!IMAGE_TYPES.has(type)) throw new Error("unsupported result image type");
    return result;
  }
  if (!result.startsWith("https://")) throw new Error("result is not an https address");
  const r = await fetcher(result, { headers: { "accept-encoding": "identity" } });
  if (!r.ok) throw new Error(`result download failed: ${r.status}`);
  const type = (r.headers.get("content-type") ?? "").split(";")[0].trim();
  if (!IMAGE_TYPES.has(type)) throw new Error("unsupported result image type");
  const bytes = Buffer.from(await r.arrayBuffer());
  if (bytes.length > MAX_BYTES) throw new Error("result image too large");
  return `data:${type};base64,${bytes.toString("base64")}`;
}
