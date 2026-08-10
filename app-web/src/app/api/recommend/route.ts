// POST /api/recommend
//   body: { productId: string, preferredFit?: "slim"|"regular"|"relaxed"|"oversized" }
// Recomputes a recommendation for an already-stored product, optionally with a
// fit-preference override. Used by the result page's fit toggle so the user can
// preview slim/relaxed/oversized WITHOUT creating a duplicate product row or
// mutating their saved profile.

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { computeRecommendation } from "@/lib/recommendService";

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

  const { result, effectiveFit } = await computeRecommendation(
    user.id,
    product,
    preferredFit,
  );

  return NextResponse.json({ result, effectiveFit });
}
