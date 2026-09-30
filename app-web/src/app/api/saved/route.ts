// /api/saved — the to-buy list ("待购", Session 80).
//
//   GET                  → { items }            the user's saved products, newest first
//   GET ?id=…            → { item }             one, with the stored check's sizes (for the closet)
//   POST   SaveBody      → { item } | 409 already-saved (with the existing item)
//   PATCH  PatchBody     → { item }
//   DELETE ?id=…         → { ok }
//
// A saved product is not an owned garment: nothing that learns or counts reads this
// table (schema comment on SavedItem). The browser extension saves here with the
// user's cookie; like /api/check, an extension request with no session is refused
// before anything could mint an account (invariant (60)).

import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getCurrentUser, readSession } from "@/lib/session";
import { localeFromRequest } from "@/i18n/request";
import { engineText } from "@/lib/engineText";
import { isExtensionRequest, sessionGate } from "@/lib/checkPolicy";
import { clientKey, rateLimit, tooMany } from "@/lib/rateLimit";
import { say } from "@/lib/apiText";
import { normalizeUrl } from "@/lib/normalizeUrl";
import { extractSmart } from "@/lib/extractorLLM";
import { garmentFor } from "@/lib/garments";
import { PatchBody, SaveBody, offeredLabels, savedUrlKey } from "@/lib/savedInput";
import { isUndetermined } from "@/lib/fitEngine";

const LIST_SELECT = {
  id: true,
  url: true,
  retailer: true,
  brand: true,
  productName: true,
  category: true,
  size: true,
  sizesJson: true,
  note: true,
  productId: true,
  createdAt: true,
  updatedAt: true,
  // The latest recommendation from the check this save came with, if any.
  product: { select: { id: true, recs: { orderBy: { createdAt: "desc" as const }, take: 1, select: { recommendedSizeLabel: true, confidence: true, breakdownJson: true } } } },
} satisfies Prisma.SavedItemSelect;

type Row = Prisma.SavedItemGetPayload<{ select: typeof LIST_SELECT }>;

function shape(r: Row) {
  // A tie is not a recommendation: the stored label would just be the first rung.
  let rec = r.product?.recs[0];
  try { if (rec && isUndetermined(JSON.parse(rec.breakdownJson ?? "[]"))) rec = undefined; } catch { rec = undefined; }
  let sizes: string[] = [];
  try { sizes = r.sizesJson ? (JSON.parse(r.sizesJson) as string[]) : []; } catch { /* stored by us; tolerate */ }
  return {
    id: r.id,
    url: r.url,
    retailer: r.retailer,
    brand: r.brand,
    productName: r.productName,
    category: r.category,
    size: r.size,
    sizes,
    note: r.note,
    productId: r.productId,
    recommendation: rec ? { size: rec.recommendedSizeLabel, confidence: rec.confidence } : null,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

/** The user, or a refusal: an extension request never mints an account. */
async function userFor(req: Request) {
  const session = readSession();
  if (sessionGate(isExtensionRequest(req.headers), session != null) === "not-connected") {
    const M = engineText(localeFromRequest(req));
    return { error: NextResponse.json({ error: "not-connected", message: M.notConnected }, { status: 401 }) };
  }
  return { user: await getCurrentUser() };
}

async function writeLimit(req: Request, userId: string) {
  const rl = await rateLimit(`saved-write:${userId}`, 60, 10 * 60_000);
  if (!rl.ok) return tooMany(rl.retryAfterSec, req);
  const ip = await rateLimit(clientKey(req, "saved-write"), 300, 10 * 60_000);
  if (!ip.ok) return tooMany(ip.retryAfterSec, req);
  return null;
}

export async function GET(req: Request) {
  const u = await userFor(req);
  if ("error" in u) return u.error;
  const id = new URL(req.url).searchParams.get("id");
  if (id) {
    const r = await prisma.savedItem.findFirst({ where: { id, userId: u.user.id }, select: LIST_SELECT });
    if (!r) return NextResponse.json({ error: "not-found", message: say(req, "not found") }, { status: 404 });
    // The stored check's chart, so the closet can keep the garment's own
    // measurements for the size bought — with the provenance it was read with.
    const product = r.productId
      ? await prisma.product.findFirst({ where: { id: r.productId, userId: u.user.id }, select: { rawJson: true, sizeOptions: true } })
      : null;
    let sizesFrom: string | null = null;
    try { sizesFrom = product?.rawJson ? JSON.parse(product.rawJson)?.source?.sizesFrom ?? null : null; } catch { /* ignore */ }
    const sizeRows = (product?.sizeOptions ?? []).map((s) => ({
      label: s.label, chestCm: s.chestCm, shoulderCm: s.shoulderCm, sleeveCm: s.sleeveCm, lengthCm: s.lengthCm,
    }));
    return NextResponse.json({ item: shape(r), sizeRows, measuredFrom: sizesFrom });
  }
  const rows = await prisma.savedItem.findMany({ where: { userId: u.user.id }, orderBy: { createdAt: "desc" }, select: LIST_SELECT });
  return NextResponse.json({ items: rows.map(shape) });
}

export async function POST(req: Request) {
  const u = await userFor(req);
  if ("error" in u) return u.error;
  const limited = await writeLimit(req, u.user.id);
  if (limited) return limited;

  const parsed = SaveBody.safeParse(await req.json().catch(() => null));
  const url = parsed.success ? normalizeUrl(parsed.data.url) : null;
  const urlKey = parsed.success ? savedUrlKey(parsed.data.url) : null;
  if (!parsed.success || !url || !urlKey) {
    return NextResponse.json({ error: "invalid", message: say(req, "invalid request") }, { status: 400 });
  }
  const body = parsed.data;

  // What the page says about itself: from the check that already ran, or from the
  // page the extension sent — parsed, no model call, no fetch of ours.
  let found: { retailer?: string | null; brand?: string | null; productName?: string | null; category?: string | null; sizes: string[] } = { sizes: [] };
  let productId: string | null = null;
  if (body.productId) {
    const p = await prisma.product.findFirst({ where: { id: body.productId, userId: u.user.id }, include: { sizeOptions: true } });
    if (p) {
      productId = p.id;
      let source;
      try { source = p.rawJson ? JSON.parse(p.rawJson)?.source : undefined; } catch { source = undefined; }
      found = { retailer: p.retailer, brand: p.brand, productName: p.productName, category: p.category, sizes: offeredLabels(p.sizeOptions, source) };
    }
  } else if (body.html && body.html.length >= 200) {
    const ex = await extractSmart(url, { html: body.html, noModel: true });
    found = { retailer: ex.retailer, brand: ex.brand, productName: ex.productName, category: ex.category, sizes: offeredLabels(ex.sizes, ex.source) };
  }
  const cat = body.category ?? (found.category && garmentFor(found.category) ? found.category : null);

  try {
    const r = await prisma.savedItem.create({
      data: {
        userId: u.user.id,
        url,
        urlKey,
        retailer: found.retailer?.trim() || null,
        brand: body.brand || found.brand?.trim() || null,
        productName: body.productName || found.productName?.trim() || null,
        category: cat,
        size: body.size || null,
        sizesJson: found.sizes.length ? JSON.stringify(found.sizes) : null,
        note: body.note || null,
        productId,
      },
      select: LIST_SELECT,
    });
    return NextResponse.json({ item: shape(r) });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      const existing = await prisma.savedItem.findFirst({ where: { userId: u.user.id, urlKey }, select: LIST_SELECT });
      return NextResponse.json(
        { error: "already-saved", message: say(req, "That product is already on your to-buy list."), item: existing ? shape(existing) : null },
        { status: 409 },
      );
    }
    throw e;
  }
}

export async function PATCH(req: Request) {
  const u = await userFor(req);
  if ("error" in u) return u.error;
  const limited = await writeLimit(req, u.user.id);
  if (limited) return limited;
  const parsed = PatchBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid", message: say(req, "invalid request") }, { status: 400 });
  const { id, ...fields } = parsed.data;
  // Only the fields that were sent; an explicit empty string clears one.
  const data: Record<string, string | null> = {};
  for (const [k, v] of Object.entries(fields)) if (v !== undefined) data[k] = v === "" ? null : v;
  const res = await prisma.savedItem.updateMany({ where: { id, userId: u.user.id }, data });
  if (res.count === 0) return NextResponse.json({ error: "not-found", message: say(req, "not found") }, { status: 404 });
  const r = await prisma.savedItem.findFirst({ where: { id, userId: u.user.id }, select: LIST_SELECT });
  return NextResponse.json({ item: r ? shape(r) : null });
}

export async function DELETE(req: Request) {
  const u = await userFor(req);
  if ("error" in u) return u.error;
  const limited = await writeLimit(req, u.user.id);
  if (limited) return limited;
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "invalid", message: say(req, "id required") }, { status: 400 });
  await prisma.savedItem.deleteMany({ where: { id, userId: u.user.id } });
  return NextResponse.json({ ok: true });
}
