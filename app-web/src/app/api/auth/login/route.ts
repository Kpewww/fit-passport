// POST /api/auth/login
//   body: { identifier, password }    // identifier = account code OR username
// Verifies the password for the matching account and, on success, issues a
// session with edit rights. Backward-compatible: still accepts { accountCode }.

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { setSession } from "@/lib/session";
import { normalizeAccountCode, verifySecret } from "@/lib/auth";
import { clientKey, rateLimit, tooMany } from "@/lib/rateLimit";

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
  // Brute-force guard: 10 attempts / 5 min per IP.
  const rl = rateLimit(clientKey(req, "login"), 10, 5 * 60_000);
  if (!rl.ok) return tooMany(rl.retryAfterSec);

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const raw = (parsed.data.identifier ?? parsed.data.accountCode ?? "").trim();

  // Identifier can be: an account code (FP-… / 4 base32 chars + dash), an email
  // (contains @), or a username. Pick the lookup accordingly.
  const looksLikeCode = /^FP-/i.test(raw) || /^[A-Z0-9]{4}-/i.test(raw);
  const looksLikeEmail = raw.includes("@");
  const user = looksLikeCode
    ? await prisma.user.findUnique({ where: { accountCode: normalizeAccountCode(raw) } })
    : looksLikeEmail
      ? await prisma.user.findUnique({ where: { email: raw.toLowerCase() } })
      : await prisma.user.findUnique({ where: { username: raw } });

  // Uniform error so we don't leak whether an identifier exists.
  const fail = () =>
    NextResponse.json({ error: "invalid username/code or password" }, { status: 401 });

  if (!user || !user.claimed || user.deactivated) return fail();
  const ok = await verifySecret(parsed.data.password, user.passwordHash);
  if (!ok) return fail();

  setSession({ userId: user.id, canEdit: true });
  return NextResponse.json({
    ok: true,
    username: user.username,
    accountCode: user.accountCode,
  });
}
