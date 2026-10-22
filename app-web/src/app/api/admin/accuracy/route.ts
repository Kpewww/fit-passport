// GET /api/admin/accuracy — was the recommended size right, from reported purchases
// (Session 103). Admin only. The rule is lib/pilotAccuracy.ts.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { currentAdmin, notAdmin } from "@/lib/admin";
import { accuracy } from "@/lib/pilotAccuracy";

export async function GET() {
  if (!(await currentAdmin())) return notAdmin();
  const outcomes = await prisma.fitOutcome.findMany({
    select: {
      userId: true, productId: true, purchasedSize: true, decision: true, exchangedForSize: true,
      fitDirection: true, createdAt: true,
      // Chart order: rows are written in the chart's order, and cuids grow with time.
      product: { select: { sizeOptions: { select: { label: true }, orderBy: { id: "asc" } } } },
    },
    take: 20000,
  });
  const recs = await prisma.fitRecommendation.findMany({
    where: { productId: { in: [...new Set(outcomes.map((o) => o.productId))] } },
    select: { userId: true, productId: true, recommendedSizeLabel: true, confidence: true, createdAt: true },
  });
  return NextResponse.json(accuracy(
    outcomes.map(({ product, ...o }) => ({ ...o, sizeLabels: product.sizeOptions.map((s) => s.label) })),
    recs,
  ));
}
