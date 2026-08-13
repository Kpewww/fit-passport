// POST /api/auth/reset  { userId, token, newPassword }
// Completes the reset: verifies the one-time token against the stored hash +
// expiry, sets the new password, clears the token, and logs the user in. The
// account code is untouched.

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { setSession } from "@/lib/session";
import { hashSecret, verifySecret } from "@/lib/auth";
import { clientKey, rateLimit, tooMany } from "@/lib/rateLimit";

const Body = z.object({
  userId: z.string().min(1),
  token: z.string().min(10).max(200),
  newPassword: z.string().min(6).max(200),
});

export async function POST(req: Request) {
  const rl = await rateLimit(clientKey(req, "reset"), 10, 15 * 60_000);
  if (!rl.ok) return tooMany(rl.retryAfterSec);

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { userId, token, newPassword } = parsed.data;
  const fail = () => NextResponse.json({ error: "invalid or expired reset link" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.claimed || user.deactivated) return fail();
  if (!user.resetTokenHash || !user.resetExpiresAt) return fail();
  if (user.resetExpiresAt.getTime() < Date.now()) return fail();

  const ok = await verifySecret(token, user.resetTokenHash);
  if (!ok) return fail();

  const passwordHash = await hashSecret(newPassword);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, resetTokenHash: null, resetExpiresAt: null },
  });

  setSession({ userId: user.id, canEdit: true });
  return NextResponse.json({ ok: true, username: user.username });
}
