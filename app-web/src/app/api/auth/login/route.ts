// POST /api/auth/login
//   body: { identifier, password }    // identifier = account code OR username
// Verifies the password for the matching account and, on success, issues a
// session with edit rights. Backward-compatible: still accepts { accountCode }.

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { setSession } from "@/lib/session";
import { normalizeAccountCode, verifySecret } from "@/lib/auth";

const Body = z.object({
  // New name; either works. Login page sends `identifier`.
  identifier: z.string().min(2).max(80).optional(),
  // Legacy name for older callers.
  accountCode: z.string().min(2).max(80).optional(),
  password: z.string().min(1).max(200),
}).refine((b) => b.identifier || b.accountCode, {
  message: "identifier required",
  path: ["identifier"],
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const raw = (parsed.data.identifier ?? parsed.data.accountCode ?? "").trim();

  // Heuristic: looks like an account code (starts with FP- or begins with
  // 4 base32 chars + dash) → look up by accountCode; otherwise → by username.
  const looksLikeCode = /^FP-/i.test(raw) || /^[A-Z0-9]{4}-/i.test(raw);
  const user = looksLikeCode
    ? await prisma.user.findUnique({ where: { accountCode: normalizeAccountCode(raw) } })
    : await prisma.user.findUnique({ where: { username: raw } });

  // Uniform error so we don't leak whether an identifier exists.
  const fail = () =>
    NextResponse.json({ error: "invalid username/code or password" }, { status: 401 });

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
