import { NextResponse } from "next/server";
import { PHOTO_ROUTE, dropPhotos, photoForClient, storePhoto } from "@/lib/photoStore";
import { track } from "@/lib/events";
import { clientKey, rateLimit, tooMany } from "@/lib/rateLimit";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser, readSession } from "@/lib/session";
import { isExtensionRequest, sessionGate } from "@/lib/checkPolicy";
import { engineText } from "@/lib/engineText";
import { localeFromRequest } from "@/i18n/request";
import { collectionForGarment } from "@/lib/collections";
import { isValidSize } from "@/lib/sizeSystems";
import { DIRECTION_MIN, DIRECTION_MAX, clampDirection, ratingFromDirection } from "@/lib/fitDirection";
import { ItemSchema } from "@/lib/closetItemInput";
import { SeasonsInput, wearStats } from "@/lib/wear";

export async function GET() {
  const user = await getCurrentUser();
  const [items, worn] = await Promise.all([
    prisma.knownGoodItem.findMany({
      where: { userId: user.id },
      orderBy: [{ sortIndex: "asc" }, { createdAt: "desc" }],
    }),
    wearStats(user.id), // the wear calendar's counts (Session 104)
  ]);
  return NextResponse.json({
    items: items.map((it) => ({ ...forClient(it), wornCount: worn.get(it.id)?.count ?? 0, lastWorn: worn.get(it.id)?.lastDay ?? null })),
  });
}

export async function POST(req: Request) {
  // The extension adds to the closet too (Session 88d): like /api/saved, a request
  // from it with no session is refused, never answered by minting an empty account.
  if (sessionGate(isExtensionRequest(req.headers), (await readSession()) != null) === "not-connected") {
    const M = engineText(localeFromRequest(req));
    return NextResponse.json({ error: "not-connected", message: M.notConnected }, { status: 401 });
  }
  // Closet reports feed the wearer's own ease and brand bias. Bounds a script
  // flooding them; a person adding clothes by hand never gets near it.
  const rl = await rateLimit(clientKey(req, "closet-write"), 120, 10 * 60_000);
  if (!rl.ok) return tooMany(rl.retryAfterSec, req);
  const user = await getCurrentUser();
  const parsed = ItemSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { fromSavedId, ...data } = parsed.data;
  let savedProductId: string | null = null;
  if (fromSavedId) {
    const saved = await prisma.savedItem.findFirst({
      where: { id: fromSavedId, userId: user.id },
      select: { id: true, product: { select: { id: true, userId: true } } },
    });
    if (!saved) return NextResponse.json({ error: "not found" }, { status: 404 });
    if (saved.product?.userId === user.id) savedProductId = saved.product.id;
  }

  // A photo goes to object storage when it is set up (photoStore.ts).
  if (data.imageDataUrl) data.imageDataUrl = await storePhoto(user.id, data.imageDataUrl);

  // Auto-file into a default collection by garment type unless one was given.
  const collectionId =
    data.collectionId ?? (await collectionForGarment(user.id, data.category));

  // Place new item at the end of its collection.
  const maxSort = await prisma.knownGoodItem.aggregate({
    where: { userId: user.id, collectionId },
    _max: { sortIndex: true },
  });

  const create = prisma.knownGoodItem.create({
    data: {
      userId: user.id,
      ...data,
      collectionId,
      sortIndex: (maxSort._max.sortIndex ?? -1) + 1,
    },
  });
  if (fromSavedId) {
    // "Bought it" is a purchase that was kept (Session 103): when the saved product was
    // checked, record it as an outcome too, with the fit just reported, so it counts in
    // outcome learning and in /admin's accuracy. Never twice for the same product.
    const already = savedProductId
      ? await prisma.fitOutcome.count({ where: { userId: user.id, productId: savedProductId } })
      : 1;
    const outcome = !already && savedProductId
      ? [prisma.fitOutcome.create({
          data: {
            userId: user.id, productId: savedProductId, purchasedSize: data.size, decision: "keep",
            fitDirection: data.fitDirection ?? null, overallFit: ratingFromDirection(data.fitDirection),
            notes: "from the to-buy list",
          },
        })]
      : [];
    const [item] = await prisma.$transaction([create, prisma.savedItem.deleteMany({ where: { id: fromSavedId, userId: user.id } }), ...outcome]);
    if (outcome.length) await track("outcome", { userId: user.id, detail: "keep:from-saved" });
    await track("piece-added", { userId: user.id, detail: "from-saved" });
    return NextResponse.json({ item: forClient(item) });
  }
  const item = await create;
  await track("piece-added", { userId: user.id, detail: data.productUrl ? "with-link" : null });
  return NextResponse.json({ item: forClient(item) });
}

// PATCH accepts partial updates (edit fields, move collection, recolor, reorder,
// group/ungroup). All fields optional except id.
const UpdateSchema = z
  .object({
    id: z.string().min(1),
    brand: z.string().min(1).max(80).optional(),
    displayName: z.string().max(80).optional().nullable(),
    category: z.string().min(1).max(40).optional(),
    gender: z.enum(["mens", "womens", "unisex"]).optional().nullable(),
    size: z.string().min(1).max(20).optional(),
    region: z.string().max(10).optional().nullable(),
    fitRating: z.coerce.number().int().min(1).max(5).optional(),
    fitDirection: z.coerce.number().min(DIRECTION_MIN).max(DIRECTION_MAX).transform(clampDirection).optional().nullable(),
    areaNotesJson: z.string().max(2000).optional().nullable(),
    productUrl: z.string().url().optional().nullable(),
    // A new photo, or the address we gave for the stored one (sent back unchanged).
    imageDataUrl: z.string().max(400_000).regex(/^(data:image\/(png|jpeg|webp);base64,|\/api\/closet\/photo\/)/, "must be a small image").optional().nullable(),
    photoFrom: z.enum(["own", "shop"]).optional().nullable(),
    color: z.string().max(40).optional().nullable(),
    seasons: SeasonsInput.optional(),
    collectionId: z.string().optional().nullable(),
    // Taken from the product page's chart on the edit sheet (Session 98), with the
    // same bounds as when an item is added by URL (closetItemInput.ts).
    garmentChestCm: z.coerce.number().min(10).max(400).optional().nullable(),
    garmentShoulderCm: z.coerce.number().min(5).max(120).optional().nullable(),
    garmentSleeveCm: z.coerce.number().min(1).max(150).optional().nullable(),
    garmentLengthCm: z.coerce.number().min(5).max(250).optional().nullable(),
    garmentMeasuredFrom: z.enum(["page", "brand-chart", "fixture", "seller", "estimated"]).optional().nullable(),
    sortIndex: z.coerce.number().int().min(0).optional(),
    groupId: z.string().optional().nullable(),
    groupName: z.string().max(80).optional().nullable(),
    onlineAvailable: z.boolean().optional(),
  })
  // Only validate size when it's being changed. Use the incoming category if
  // present, else "other" (which maps to the permissive top/alpha domain).
  .refine((d) => d.size == null || isValidSize(d.category ?? "other", d.size), {
    message: "Size is not valid for this garment type",
    path: ["size"],
  });

// Content fields whose change counts as a "modification" for the edit history.
// Pure reorder (sortIndex) and folder moves (collectionId) are deliberately
// excluded — they aren't edits to the garment itself.
const HISTORY_KEYS = [
  "brand", "displayName", "category", "gender", "size", "region", "fitRating",
  "fitDirection",
  "areaNotesJson", "productUrl", "imageDataUrl", "color", "groupId", "groupName",
  "onlineAvailable",
] as const;

// Rapid successive edits within this window collapse into ONE formal edit — the
// last history entry just advances in time until the user stops for a while.
const EDIT_COALESCE_MS = 30 * 60 * 1000; // 30 minutes

function parseHistory(json: string | null): string[] {
  if (!json) return [];
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export async function PATCH(req: Request) {
  // Closet reports feed the wearer's own ease and brand bias. Bounds a script
  // flooding them; a person adding clothes by hand never gets near it.
  const rl = await rateLimit(clientKey(req, "closet-write"), 120, 10 * 60_000);
  if (!rl.ok) return tooMany(rl.retryAfterSec, req);
  const user = await getCurrentUser();
  const parsed = UpdateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { id, ...data } = parsed.data;

  const existing = await prisma.knownGoodItem.findFirst({ where: { id, userId: user.id } });
  if (!existing) {
    return NextResponse.json({ error: "item not found" }, { status: 404 });
  }
  // The stored photo's own address, sent back by an edit that did not touch it.
  if (data.imageDataUrl?.startsWith(PHOTO_ROUTE)) delete data.imageDataUrl;
  else if (data.imageDataUrl) data.imageDataUrl = await storePhoto(user.id, data.imageDataUrl);
  const replacedPhoto = data.imageDataUrl !== undefined && data.imageDataUrl !== existing.imageDataUrl ? existing.imageDataUrl : null;

  // Did any tracked content field actually change? If so, record/coalesce a
  // formal edit timestamp.
  const changed = HISTORY_KEYS.some(
    (k) => data[k] !== undefined && data[k] !== (existing as Record<string, unknown>)[k],
  );
  const patch: Record<string, unknown> = { ...data };
  if (changed) {
    const hist = parseHistory(existing.editHistory);
    const now = new Date();
    const last = hist.length ? new Date(hist[hist.length - 1]) : null;
    if (last && now.getTime() - last.getTime() < EDIT_COALESCE_MS) {
      hist[hist.length - 1] = now.toISOString(); // same session → advance it
    } else {
      hist.push(now.toISOString()); // new formal edit
    }
    patch.editHistory = JSON.stringify(hist.slice(-20)); // keep the last 20
  }

  const item = await prisma.knownGoodItem.update({ where: { id }, data: patch });
  if (replacedPhoto) await dropPhotos([replacedPhoto]);
  return NextResponse.json({ item: forClient(item) });
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  const params = new URL(req.url).searchParams;
  // One piece (?id=) or several at once (?ids=a,b — the closet's select mode,
  // Session 88c). Owner-scoped either way: someone else's id deletes nothing.
  const ids = [params.get("id"), ...(params.get("ids") ?? "").split(",")]
    .map((v) => (v ?? "").trim())
    .filter(Boolean)
    .slice(0, 200);
  if (ids.length === 0) return NextResponse.json({ error: "id required" }, { status: 400 });
  const photos = await prisma.knownGoodItem.findMany({ where: { id: { in: ids }, userId: user.id }, select: { imageDataUrl: true } });
  const res = await prisma.knownGoodItem.deleteMany({ where: { id: { in: ids }, userId: user.id } });
  await dropPhotos(photos.map((p) => p.imageDataUrl));
  return NextResponse.json({ ok: true, deleted: res.count });
}

/** An item as its owner's browser sees it: a stored photo by our own address. */
function forClient<T extends { id: string; imageDataUrl: string | null }>(item: T): T {
  return { ...item, imageDataUrl: photoForClient(item.id, item.imageDataUrl) };
}
