// POST /api/auth/claim
//   body: { username, password, bodyType?, exportPolicy? }
// Upgrades the current anonymous account into a claimed, shareable one:
// assigns a high-entropy account code, sets username + hashed password, and
// returns the code + a one-time recovery code (shown once).

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser, setSession } from "@/lib/session";
import {
  generateAccountCode,
  generateRecoveryCode,
  hashSecret,
} from "@/lib/auth";

const Body = z.object({
  username: z.string().min(2).max(30).regex(/^[a-zA-Z0-9_.-]+$/,
    "letters, numbers, and . _ - only"),
  password: z.string().min(6).max(200),
  bodyType: z.enum(["slim", "average", "athletic", "broad"]).optional(),
  exportPolicy: z.enum(["owner", "anyone"]).optional(),
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (user.claimed) {
    return NextResponse.json({ error: "account already claimed" }, { status: 409 });
  }
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { username, password, bodyType, exportPolicy } = parsed.data;

  // Username uniqueness.
  const taken = await prisma.user.findUnique({ where: { username } });
  if (taken) {
    return NextResponse.json({ error: "username taken" }, { status: 409 });
  }

  // Generate a unique account code (retry on the astronomically unlikely clash).
  let accountCode = generateAccountCode();
  for (let i = 0; i < 5; i++) {
    const clash = await prisma.user.findUnique({ where: { accountCode } });
    if (!clash) break;
    accountCode = generateAccountCode();
  }

  const recoveryCode = generateRecoveryCode();
  const [passwordHash, recoveryHash] = await Promise.all([
    hashSecret(password),
    hashSecret(recoveryCode),
  ]);

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      claimed: true,
      accountCode,
      username,
      passwordHash,
      recoveryHash,
      bodyType: bodyType ?? null,
      exportPolicy: exportPolicy ?? "owner",
    },
  });

  // Refresh the session with edit rights on the now-claimed account.
  setSession({ userId: updated.id, canEdit: true });

  return NextResponse.json({
    accountCode: updated.accountCode,
    username: updated.username,
    // Shown ONCE. We store only its hash.
    recoveryCode,
  });
}
