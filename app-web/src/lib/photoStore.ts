// Closet photos out of the database (Session 100, todo/engineering/07).
//
// A photo was a ~90 KB base64 data URL in its KnownGoodItem row; Neon's free 0.5 GB
// fills at about 340 people with ten photos each, and then every write fails. With
// BLOB_READ_WRITE_TOKEN set (a Vercel Blob store), a new photo goes to object storage
// and the row keeps a reference, "blob:<url>". Without it, nothing changes.
//
// The store is PRIVATE (the founder created it so, 2026-10-20; @vercel/blob 2.8):
// a file needs the store's token to be read, so even a leaked address shows nothing.
// The browser gets /api/closet/photo/<item id>, which checks the item is the viewer's
// own and reads the file with the token. A closet photo stays its owner's only
// (invariant 92).

import { createHash } from "node:crypto";
import { del, get, put } from "@vercel/blob";

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
  const blob = await put(`closet/${owner}/photo.${ext}`, bytes, { access: "private", contentType: m[1], addRandomSuffix: true });
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

/** A closet piece's AI cut-out as the browser may see it (Session 104): same rule, its own address. */
export function cutoutForClient(itemId: string, stored: string | null): string | null {
  if (!isRef(stored)) return stored;
  const v = createHash("sha256").update(stored).digest("hex").slice(0, 8);
  return `${PHOTO_ROUTE}${itemId}?cut=1&v=${v}`;
}

/** The stored photo's bytes, for the route that serves it. */
export async function readPhoto(stored: string | null): Promise<{ bytes: ArrayBuffer; type: string } | null> {
  if (!isRef(stored) || !photoStoreOn()) return null;
  try {
    const r = await get(stored.slice(BLOB_REF.length), { access: "private", useCache: false });
    if (!r || r.statusCode !== 200) return null;
    return { bytes: await new Response(r.stream).arrayBuffer(), type: r.blob.contentType || "image/jpeg" };
  } catch {
    return null;
  }
}

export const isStoredRef = isRef;

/**
 * Move photos still kept in the database to the store, a batch at a time (Session 100g:
 * run from /admin, on the server, so neither the database address nor the token ever
 * leaves Vercel). Each photo is uploaded, then its row updated; a failure leaves that
 * row as it was. Returns what moved and what is left.
 */
export async function movePhotosBatch(limit = 25): Promise<{ moved: number; failed: number; left: number }> {
  const { prisma } = await import("./db");
  if (!photoStoreOn()) return { moved: 0, failed: 0, left: await prisma.knownGoodItem.count({ where: { imageDataUrl: { startsWith: "data:" } } }) };
  const rows = await prisma.knownGoodItem.findMany({
    where: { imageDataUrl: { startsWith: "data:" } },
    select: { id: true, userId: true, imageDataUrl: true },
    take: limit,
  });
  let moved = 0, failed = 0;
  for (const r of rows) {
    try {
      const ref = await storePhoto(r.userId, r.imageDataUrl!);
      if (!isRef(ref)) { failed++; continue; }
      await prisma.knownGoodItem.update({ where: { id: r.id }, data: { imageDataUrl: ref } });
      moved++;
    } catch {
      failed++;
    }
  }
  const left = await prisma.knownGoodItem.count({ where: { imageDataUrl: { startsWith: "data:" } } });
  return { moved, failed, left };
}
