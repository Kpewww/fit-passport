// POST /api/recommend
//   body: { productId: string, preferredFit?: "slim"|"regular"|"relaxed"|"oversized" }
// Recomputes a recommendation for an already-stored product, optionally with a
// fit-preference override. Used by the result page's fit toggle so the user can
// preview slim/relaxed/oversized WITHOUT creating a duplicate product row or
// mutating their saved profile — and by `/check?product=<id>`, which reopens a
// stored check (the browser extension links there for the full explanation).
//
// It applies the SAME provenance ceiling as /api/check. Until Session 75 it did
// not: the cap lived inline in the check route, so toggling the fit preference on
// an "estimated" result lifted its confidence straight past the 0.5 the page had
// just shown beside the "sizes estimated" warning.

import { NextResponse } from "next/server";
import { localeFromRequest } from "@/i18n/request";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { computeRecommendation } from "@/lib/recommendService";
import { applyProvenanceCap, sourceFromRawJson } from "@/lib/checkPolicy";

const Body = z.object({
  productId: z.string().min(1),
  preferredFit: z.enum(["slim", "regular", "relaxed", "oversized"]).optional(),
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { productId, preferredFit } = parsed.data;

  const product = await prisma.product.findFirst({
    where: { id: productId, userId: user.id },
    include: { sizeOptions: true },
  });
  if (!product) {
    return NextResponse.json({ error: "product not found" }, { status: 404 });
  }

  const computed = await computeRecommendation(user.id, product, preferredFit, localeFromRequest(req));
  // Where this product's sizes came from, as recorded when it was checked.
  const source = sourceFromRawJson(product.rawJson);
  const result = applyProvenanceCap(computed.result, source?.sizesFrom);

  // `source` travels separately, so the stored payload does not need to.
  const { rawJson: _raw, ...productOut } = product;
  void _raw;

  return NextResponse.json({
    result,
    effectiveFit: computed.effectiveFit,
    body: computed.body,
    product: productOut,
    source,
  });
}
