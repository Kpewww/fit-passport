// Closet photos out of the database (Session 100, todo/engineering/07).
//
// A photo was a ~90 KB base64 data URL in its KnownGoodItem row; Neon's free 0.5 GB
// fills at about 340 people with ten photos each, and then every write fails. With
// BLOB_READ_WRITE_TOKEN set (a Vercel Blob store), a new photo goes to object storage
// and the row keeps a reference, "blob:<url>". Without it, nothing changes.
//
// Vercel Blob's files are public to whoever has their address (the address has a
// random part), so the address never leaves the server: the browser gets
// /api/closet/photo/<item id>, which checks the item is the viewer's own and passes
// the bytes on. A closet photo stays its owner's only (invariant 92).

import { createHash } from "node:crypto";
import { del, put } from "@vercel/blob";

export const BLOB_REF = "blob:";
/** What the browser is given for a stored photo, and may send back unchanged. */
export const PHOTO_ROUTE = "/api/closet/photo/";

export const photoStoreOn = () => !!process.env.BLOB_READ_WRITE_TOKEN;

const isRef = (v: string | null | undefined): v is string => typeof v === "string" && v.startsWith(BLOB_REF);

/** The value to store for a photo the browser sent: a reference when the store is on. */
export async function storePhoto(userId: string, dataUrl: string): Promise<string> {
  if (!photoStoreOn() || !dataUrl.startsWith("data:")) return dataUrl;
  const m = dataUrl.match(/^data:(image\/(?:png|jpeg|webp));base64,(.*)$/);
  if (!m) return dataUrl;
  const bytes = Buffer.from(m[2], "base64");
  const ext = m[1].split("/")[1].replace("jpeg", "jpg");
  // The account id is hashed: the address need not say whose photo it is.
  const owner = createHash("sha256").update(userId).digest("hex").slice(0, 16);
  const blob = await put(`closet/${owner}/photo.${ext}`, bytes, { access: "public", contentType: m[1], addRandomSuffix: true });
  return BLOB_REF + blob.url;
}

/** Remove stored photos that are no longer used. Best effort: a leftover file is harmless. */
export async function dropPhotos(values: Array<string | null | undefined>): Promise<void> {
  const urls = values.filter(isRef).map((v) => v.slice(BLOB_REF.length));
  if (!urls.length || !photoStoreOn()) return;
  try { await del(urls); } catch { /* left behind; never fail the request for it */ }
}

/** The photo as the browser may see it: a data URL as it was, a reference as our route. */
export function photoForClient(itemId: string, stored: string | null): string | null {
  if (!isRef(stored)) return stored;
  const v = createHash("sha256").update(stored).digest("hex").slice(0, 8); // a new photo, a new address
  return `${PHOTO_ROUTE}${itemId}?v=${v}`;
}

/** The stored photo's bytes, for the route that serves it. */
export async function readPhoto(stored: string | null): Promise<{ bytes: ArrayBuffer; type: string } | null> {
  if (!isRef(stored)) return null;
  const r = await fetch(stored.slice(BLOB_REF.length), { cache: "no-store" });
  if (!r.ok) return null;
  return { bytes: await r.arrayBuffer(), type: r.headers.get("content-type") ?? "image/jpeg" };
}

export const isStoredRef = isRef;
