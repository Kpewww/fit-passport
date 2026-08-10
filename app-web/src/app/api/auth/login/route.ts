// POST /api/auth/login
//   body: { accountCode, password }
// Verifies the password for the account behind a code and, on success, issues a
// session with edit rights. This is the "login = enter password" path.

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { setSession } from "@/lib/session";
import { normalizeAccountCode, verifySecret } from "@/lib/auth";

const Body = z.object({
  accountCode: z.string().min(3).max(40),
  password: z.string().min(1).max(200),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const code = normalizeAccountCode(parsed.data.accountCode);
  const user = await prisma.user.findUnique({ where: { accountCode: code } });

  // Uniform error to avoid leaking whether a code exists.
  const fail = () =>
    NextResponse.json({ error: "invalid code or password" }, { status: 401 });

  if (!user || !user.claimed) return fail();
  const ok = await verifySecret(parsed.data.password, user.passwordHash);
  if (!ok) return fail();

  setSession({ userId: user.id, canEdit: true });
  return NextResponse.json({
    ok: true,
    username: user.username,
    accountCode: user.accountCode,
  });
}
