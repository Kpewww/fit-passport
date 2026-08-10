// POST /api/auth/recover
//   body: { accountCode, recoveryCode, newPassword }
// Resets the password using the one-time recovery code. On success, rotates the
// recovery code (returns a fresh one) and logs the user in.
//
// NOTE: email-based recovery (send a reset link to the stored email) needs mail
// infrastructure not present in the course MVP. The email is collected at claim
// time so that flow can be added later; today, the recovery CODE is the working
// reset path. See docs/design/identity-and-sharing.md.

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { setSession } from "@/lib/session";
import {
  generateRecoveryCode,
  hashSecret,
  normalizeAccountCode,
  verifySecret,
} from "@/lib/auth";

const Body = z.object({
  accountCode: z.string().min(3).max(40),
  recoveryCode: z.string().min(3).max(40),
  newPassword: z.string().min(6).max(200),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const code = normalizeAccountCode(parsed.data.accountCode);
  const user = await prisma.user.findUnique({ where: { accountCode: code } });

  const fail = () =>
    NextResponse.json({ error: "invalid code or recovery code" }, { status: 401 });

  if (!user || !user.claimed) return fail();

  // Recovery codes are compared case-insensitively (we store the hash of the
  // exact string we generated, which is uppercase base32).
  const supplied = parsed.data.recoveryCode.trim().toUpperCase().replace(/\s+/g, "");
  const ok = await verifySecret(supplied, user.recoveryHash);
  if (!ok) return fail();

  // Rotate both the password and the recovery code (single-use).
  const newRecovery = generateRecoveryCode();
  const [passwordHash, recoveryHash] = await Promise.all([
    hashSecret(parsed.data.newPassword),
    hashSecret(newRecovery),
  ]);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, recoveryHash },
  });

  setSession({ userId: user.id, canEdit: true });
  return NextResponse.json({
    ok: true,
    username: user.username,
    // A fresh recovery code — the old one is now invalid.
    recoveryCode: newRecovery,
  });
}
