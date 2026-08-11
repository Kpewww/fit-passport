// POST /api/auth/deactivate  { password }
// Soft-deactivate the account: data is RETAINED, but the account becomes
// invisible/inaccessible to everyone external — public view, community listing,
// export, and login all reject it. Verifies the password first, then logs out.
// (Not a hard delete; support/internal can reverse it by flipping the flag.)

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser, canEdit, clearSession } from "@/lib/session";
import { verifySecret } from "@/lib/auth";

const Body = z.object({ password: z.string().min(1).max(200) });

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user.claimed || !canEdit()) {
    return NextResponse.json({ error: "not allowed" }, { status: 403 });
  }
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "password required" }, { status: 400 });
  }
  const ok = await verifySecret(parsed.data.password, user.passwordHash);
  if (!ok) return NextResponse.json({ error: "password is incorrect" }, { status: 401 });

  await prisma.user.update({
    where: { id: user.id },
    data: { deactivated: true, listedInCommunity: false },
  });
  clearSession();
  return NextResponse.json({ ok: true });
}
