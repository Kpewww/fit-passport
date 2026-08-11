// POST /api/auth/change-password  { currentPassword, newPassword }
// Logged-in password change (account compromised but you still have access).
// Verifies the current password, sets the new one. Account code is unchanged.

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser, canEdit } from "@/lib/session";
import { hashSecret, verifySecret } from "@/lib/auth";

const Body = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: z.string().min(6).max(200),
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user.claimed || !canEdit()) {
    return NextResponse.json({ error: "not allowed" }, { status: 403 });
  }
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const ok = await verifySecret(parsed.data.currentPassword, user.passwordHash);
  if (!ok) return NextResponse.json({ error: "current password is incorrect" }, { status: 401 });

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashSecret(parsed.data.newPassword) },
  });
  return NextResponse.json({ ok: true });
}
