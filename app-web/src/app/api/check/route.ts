// POST /api/check
//   body: { url: string, html?: string }
//   header (extension only): x-fp-client: extension/<version>
// Extracts a product from the URL (fixtures or URL-derived), saves it + sizes,
// runs the fit engine, and persists the recommendation.
// Returns the ranked breakdown + the extracted product (incl. provenance) so the
// UI can prove it read THIS page.
//
// `html` is the browser-extension path: the caller already has the page open and
// hands us its markup, so we read what our servers cannot (invariant (53) — the
// scraping configuration that works and the one we can deploy are disjoint).
// It is a NEW TRUST BOUNDARY: this markup did not come from our own fetch, so it
// is capped, and it is recorded as `fetch: "extension"` rather than "ok". Someone
// could of course send us invented markup — the only recommendation they would
// corrupt is their own, and every number still arrives labelled with where it
// came from.
//
// The decisions around the engine — when to refuse, how far to trust each
// source, whether an extension request may run without a session — live in
// `lib/checkPolicy.ts`, so /api/recommend applies the same ones.

import { NextResponse } from "next/server";
import { z } from "zod";
import { normalizeUrl } from "@/lib/normalizeUrl";
import { prisma } from "@/lib/db";
import { getCurrentUser, readSession } from "@/lib/session";
import { extractSmart } from "@/lib/extractorLLM";
import { computeRecommendation } from "@/lib/recommendService";
import { clientKey, rateLimit, tooMany } from "@/lib/rateLimit";
import {
  NOT_CONNECTED_MESSAGE,
  applyProvenanceCap,
  isExtensionRequest,
  refusalFor,
  sessionGate,
} from "@/lib/checkPolicy";

// Cap on supplied markup, sized against a measurement rather than a guess.
//
// A heavy retail PDP (patagonia.com, size guide opened) is **1353 KB** of raw DOM
// and **253 KB** once a content script drops <script>, <style>, <svg>, <iframe>
// and the attributes we never read — 81% smaller, with the size table intact.
// So this cap accepts a pruned page with room to spare and refuses a raw dump,
// which is the behaviour we want: the 1.1 MB a raw dump adds is tracking and
// scripting that we would transport, parse and then ignore. The LLM step
// truncates to MAX_PAGE_BYTES (80 KB) regardless.
//
// Pruning is also the privacy control. A page the user is logged into can carry
// their cart, address and order history; the extension should send the product,
// not the session. The first cut of this cap was a round number picked without
// measuring, and the very first real page went through it.
const MAX_SUPPLIED_HTML = 1_000_000;

// Rate limits. `/api/check` is the one route that can spend money — a page with
// no parseable table goes to the LLM (up to 80 KB of text) and then to vision
// (up to two images) — and it writes a Product and a FitRecommendation row on
// every call. It had no limit at all before Session 75, and the extension makes
// arbitrary markup one POST away.
//
// These numbers are WORKING VALUES, not measurements: generous enough that no
// shopper comparing products should meet them, tight enough to bound the bill.
// Keyed by the signed session first, because a campus network or a demo room
// puts many real users behind one IP; the per-IP bucket is only a backstop for
// callers with no session.
const PER_USER = { limit: 30, windowMs: 10 * 60_000 };
const PER_IP = { limit: 300, windowMs: 10 * 60_000 };

// Accept a loose string and normalize it (people paste bare domains), so
// "patagonia.com/product/..." works the same as a full https:// link.
const Body = z.object({
  url: z.string().min(3).transform((v, ctx) => {
    const u = normalizeUrl(v);
    if (!u) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "that doesn't look like a product link" });
      return z.NEVER;
    }
    return u;
  }),
  // Optional: the page's markup, from a caller that already has it open.
  html: z
    .string()
    .max(
      MAX_SUPPLIED_HTML,
      // Keep the JSON-LD. An earlier version of this message said to strip every
      // <script>, which would have deleted the one script the parser reads for
      // the brand and product name.
      "that page is too large to send whole — send only the product's parts, or strip <style>, " +
        "<svg>, <iframe> and every <script> except type=\"application/ld+json\" (the parser reads " +
        "that one), which typically removes about 80% of a page and none of the size chart",
    )
    .optional(),
});

export async function POST(req: Request) {
  // Decide on the session BEFORE anything can create one: `getCurrentUser()`
  // mints an anonymous account for a request without a cookie, which for the
  // extension would mean a silent check against an empty profile.
  const session = readSession();
  if (sessionGate(isExtensionRequest(req.headers), session != null) === "not-connected") {
    return NextResponse.json({ error: "not-connected", message: NOT_CONNECTED_MESSAGE }, { status: 401 });
  }

  const byIp = await rateLimit(clientKey(req, "check"), PER_IP.limit, PER_IP.windowMs);
  if (!byIp.ok) return tooMany(byIp.retryAfterSec);
  if (session) {
    const byUser = await rateLimit(`check-user:${session.userId}`, PER_USER.limit, PER_USER.windowMs);
    if (!byUser.ok) return tooMany(byUser.retryAfterSec);
  }

  const user = await getCurrentUser();
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { url, html } = parsed.data;

  const extracted = await extractSmart(url, { html });

  // Not clothing, a page we never saw, a category we cannot measure anyone
  // against, or an invented ladder on a page the browser handed us: say so, and
  // write no Product row. See checkPolicy.ts for each rule and the case behind it.
  const refusal = refusalFor(extracted);
  if (refusal) {
    return NextResponse.json({ ...refusal, source: extracted.source }, { status: 422 });
  }

  // Persist product + sizes.
  const product = await prisma.product.create({
    data: {
      userId: user.id,
      url,
      retailer: extracted.retailer,
      // Empty means unknown (a marketplace page that never named it) — stored as
      // null, which every reader already treats as "no brand".
      brand: extracted.brand || null,
      productName: extracted.productName || null,
      category: extracted.category,
      material: extracted.material,
      fitNotes: extracted.fitNotes,
      modelInfoJson: extracted.modelInfo ? JSON.stringify(extracted.modelInfo) : null,
      rawJson: JSON.stringify(extracted),
      sizeOptions: {
        create: extracted.sizes.map((s) => ({
          label: s.label,
          region: s.region,
          chestCm: s.chestCm,
          waistCm: s.waistCm, // was dropped before — the parser now reads waist rows
          shoulderCm: s.shoulderCm,
          sleeveCm: s.sleeveCm,
          lengthCm: s.lengthCm,
          bodyChestMinCm: s.bodyChestMinCm,
          bodyChestMaxCm: s.bodyChestMaxCm,
          bodyWaistMinCm: s.bodyWaistMinCm,
          bodyWaistMaxCm: s.bodyWaistMaxCm,
        })),
      },
    },
    include: { sizeOptions: true },
  });

  const computed = await computeRecommendation(user.id, product);
  const { effectiveFit, body } = computed;

  // Honesty gate: the engine is pure and never learns where the chart came from,
  // so the ceiling for estimated and brand-chart sizes is applied here, at the
  // boundary that knows provenance — so the number matches the banner the UI
  // shows beside it.
  const result = applyProvenanceCap(computed.result, extracted.source.sizesFrom);

  const rec = await prisma.fitRecommendation.create({
    data: {
      productId: product.id,
      userId: user.id,
      recommendedSizeLabel: result.best.label,
      confidence: result.best.confidence,
      breakdownJson: JSON.stringify(result.ranked),
      explanation: result.explanation,
    },
  });

  return NextResponse.json({
    product,
    source: extracted.source,
    result,
    effectiveFit,
    body,
    recommendationId: rec.id,
  });
}
