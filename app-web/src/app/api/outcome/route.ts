import { NextResponse } from "next/server";
import { clientKey, rateLimit, tooMany } from "@/lib/rateLimit";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { ratingFromDirection } from "@/lib/fitDirection";
import { OutcomeSchema } from "@/lib/outcomeInput";

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
  // Outcomes are learned from; a script posting hundreds would steer the wearer's own
  // learning and fill the table. Nobody returns thirty things in ten minutes.
  const rl = await rateLimit(clientKey(req, "outcome"), 30, 10 * 60_000);
  if (!rl.ok) return tooMany(rl.retryAfterSec);
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
  const { fitDirection, overallFit, ...rest } = parsed.data;
  const outcome = await prisma.fitOutcome.create({
    data: {
      userId: user.id,
      ...rest,
      fitDirection: fitDirection ?? null,
      overallFit: fitDirection != null ? ratingFromDirection(fitDirection) : overallFit ?? null,
    },
  });
  return NextResponse.json({ outcome });
}
