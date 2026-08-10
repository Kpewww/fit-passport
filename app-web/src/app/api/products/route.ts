// GET /api/products
// Lists products the user has checked, most recent first. Powers the product
// picker on the history page so a user can record an outcome for any product
// they've checked — not only ones they've already logged an outcome for.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export async function GET() {
  const user = await getCurrentUser();
  const products = await prisma.product.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, brand: true, productName: true, category: true, createdAt: true },
  });
  return NextResponse.json({ products });
}
