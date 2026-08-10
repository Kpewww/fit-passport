// POST /api/closet/group
//   body: { itemIds: string[], groupName?: string }   → merge into one variant group
//   body: { ungroupId: string }                        → dissolve a group
// Grouping is display-only; the fit engine still reads each item individually.

import { NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

const MergeBody = z.object({
  itemIds: z.array(z.string().min(1)).min(2).max(50),
  groupName: z.string().max(80).optional(),
});
const UngroupBody = z.object({ ungroupId: z.string().min(1) });

export async function POST(req: Request) {
  const user = await getCurrentUser();
  const body = await req.json();

  // Ungroup path.
  const un = UngroupBody.safeParse(body);
  if (un.success) {
    await prisma.knownGoodItem.updateMany({
      where: { userId: user.id, groupId: un.data.ungroupId },
      data: { groupId: null, groupName: null },
    });
    return NextResponse.json({ ok: true });
  }

  // Merge path.
  const parsed = MergeBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const groupId = randomUUID();
  await prisma.knownGoodItem.updateMany({
    where: { id: { in: parsed.data.itemIds }, userId: user.id },
    data: { groupId, groupName: parsed.data.groupName ?? null },
  });
  return NextResponse.json({ ok: true, groupId });
}
