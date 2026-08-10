import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

const OutcomeSchema = z.object({
  productId: z.string().min(1),
  purchasedSize: z.string().min(1),
  decision: z.enum(["keep", "return", "exchange"]),
  exchangedForSize: z.string().optional().nullable(),
  overallFit: z.coerce.number().int().min(1).max(5).optional().nullable(),
  areaIssuesJson: z.string().max(2000).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export async function GET() {
  const user = await getCurrentUser();
  const outcomes = await prisma.fitOutcome.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { product: true },
  });
  return NextResponse.json({ outcomes });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  const parsed = OutcomeSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  // Verify user owns the product before recording an outcome.
  const owned = await prisma.product.findFirst({
    where: { id: parsed.data.productId, userId: user.id },
    select: { id: true },
  });
  if (!owned) return NextResponse.json({ error: "product not found" }, { status: 404 });
  const outcome = await prisma.fitOutcome.create({
    data: { userId: user.id, ...parsed.data },
  });
  return NextResponse.json({ outcome });
}
