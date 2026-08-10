// POST /api/closet/reorder
//   body: { orderedIds: string[] }   // item ids in their new order (any subset)
// Assigns sortIndex by array position. Used by the up/down reorder controls.

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

const Body = z.object({ orderedIds: z.array(z.string().min(1)).min(1).max(500) });

export async function POST(req: Request) {
  const user = await getCurrentUser();
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  // Update all in a transaction, scoped to the user's own items.
  await prisma.$transaction(
    parsed.data.orderedIds.map((id, i) =>
      prisma.knownGoodItem.updateMany({
        where: { id, userId: user.id },
        data: { sortIndex: i },
      }),
    ),
  );
  return NextResponse.json({ ok: true });
}
