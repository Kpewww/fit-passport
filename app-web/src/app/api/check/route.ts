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

  const { result, effectiveFit } = await computeRecommendation(user.id, product);

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
    recommendationId: rec.id,
  });
}
