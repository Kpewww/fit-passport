// POST /api/check
//   body: { url: string }
// Extracts a product from the URL (fixtures or URL-derived), saves it + sizes,
// runs the fit engine, and persists the recommendation.
// Returns the ranked breakdown + the extracted product (incl. provenance) so the
// UI can prove it read THIS page.

import { NextResponse } from "next/server";
import { z } from "zod";
import { normalizeUrl } from "@/lib/normalizeUrl";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { extractSmart } from "@/lib/extractorLLM";
import { computeRecommendation } from "@/lib/recommendService";
import { SCOREABLE_DOMAINS, domainForCategory, domainLabel } from "@/lib/sizeSystems";

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
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { url } = parsed.data;

  const extracted = await extractSmart(url);

  // REFUSE what isn't clothing.
  //
  // Nothing in the URL or the page identified a garment, AND we never found a real
  // size chart — so we are looking at something that is not an apparel product: a
  // game top-up page, an article, a login wall, a random file. The extractor used
  // to quietly default such pages to "tshirt" and hand back a confident size,
  // which is the worst possible failure for a tool whose entire proposition is
  // that you can trust its answer. Say we don't recognise it instead, and don't
  // write a bogus Product row.
  if (extracted.source.categoryGuessed && extracted.source.sizesFrom === "estimated") {
    return NextResponse.json(
      {
        error: "not-apparel",
        message:
          "We couldn't find a clothing item on that page. Paste a link to a specific garment — a product page for a shirt, jacket, trousers and so on.",
        source: extracted.source,
      },
      { status: 422 },
    );
  }

  // REFUSE a category we can recognise but cannot honestly score.
  //
  // The engine compares body measurements to garment measurements. `FitProfile`
  // holds chest, waist, hip, shoulder, sleeve and inseam — so tops and bottoms
  // can be scored, and footwear, socks and accessories cannot: there is no foot
  // length, head or neck field to compare against, and no plan to add one here.
  //
  // Without this guard the fallback ladder in `extractor.ts` hands a shoe page
  // the SAME letter sizes and chest measurements it would give a t-shirt, and the
  // engine dutifully scores them. Measured on production before the fix: a men's
  // sneaker URL returned **"XS" at 24% confidence**. A low number does not make a
  // fabricated answer honest — the category is simply outside what we do, and
  // saying so is the only truthful response.
  //
  // This is invariant ⑪ ("never return a confident size for a page we can't read")
  // extended to the case the original wording missed: a page we CAN read, for a
  // garment we cannot measure anyone against.
  const domain = domainForCategory(extracted.category);
  if (!SCOREABLE_DOMAINS.includes(domain)) {
    return NextResponse.json(
      {
        error: "unsupported-category",
        message:
          `We don't size ${domainLabel(domain)} yet. The engine works by comparing your ` +
          `measurements to the garment's, and we don't hold the measurement that would ` +
          `need — so anything we told you here would be a guess dressed up as an answer. ` +
          `Tops and bottoms work today.`,
        category: extracted.category,
        source: extracted.source,
      },
      { status: 422 },
    );
  }

  // Persist product + sizes.
  const product = await prisma.product.create({
    data: {
      userId: user.id,
      url,
      retailer: extracted.retailer,
      brand: extracted.brand,
      productName: extracted.productName,
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
        })),
      },
    },
    include: { sizeOptions: true },
  });

  const { result, effectiveFit, body } = await computeRecommendation(user.id, product);

  // Honesty gate: if the size chart was ESTIMATED from the brand (no real chart
  // on the page), we cannot be highly confident — cap it so the number matches
  // the "⚠ sizes estimated" banner the UI shows. The engine stays pure; the
  // provenance discount is applied here, at the boundary that knows provenance.
  if (extracted.source.sizesFrom === "estimated") {
    const CAP = 0.5;
    result.best.confidence = Math.min(result.best.confidence, CAP);
    result.ranked = result.ranked.map((r) => ({ ...r, confidence: Math.min(r.confidence, CAP) }));
  }

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
