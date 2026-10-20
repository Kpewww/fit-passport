// POST /api/auth/login
//   body: { identifier, password }    // identifier = account code OR username
// Verifies the password for the matching account and, on success, issues a
// session with edit rights. Backward-compatible: still accepts { accountCode }.

import { NextResponse } from "next/server";
import { say } from "@/lib/apiText";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { COOKIE_OPTS, readSession, setSession } from "@/lib/session";
import { encodeFoldOffer, FOLD_OFFER_TTL_MS, normalizeAccountCode, verifySecret } from "@/lib/auth";
import { cookies } from "next/headers";
import { FOLD_COOKIE, holdings, holdsAnything, type Holdings } from "@/lib/loginFold";
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
  const rl = await rateLimit(clientKey(req, "login"), 10, 5 * 60_000);
  if (!rl.ok) return tooMany(rl.retryAfterSec, req);

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
    NextResponse.json({ error: say(req, "invalid username/code or password") }, { status: 401 });

  if (!user || !user.claimed || user.deactivated) return fail();
  const ok = await verifySecret(parsed.data.password, user.passwordHash);
  if (!ok) return fail();

  // What this browser added before logging in, if it was an unclaimed account of its
  // own: offered, not moved (Session 100). See lib/auth.ts encodeFoldOffer.
  let offer: Holdings | null = null;
  const before = readSession();
  if (before && before.userId !== user.id) {
    const prev = await prisma.user.findUnique({ where: { id: before.userId }, select: { id: true, claimed: true } });
    if (prev && !prev.claimed) {
      const h = await holdings(prev.id);
      if (holdsAnything(h)) {
        offer = h;
        cookies().set(FOLD_COOKIE, encodeFoldOffer(prev.id, user.id), { ...COOKIE_OPTS, maxAge: FOLD_OFFER_TTL_MS / 1000 });
      }
    }
  }

  setSession({ userId: user.id, canEdit: true });
  return NextResponse.json({
    ok: true,
    username: user.username,
    accountCode: user.accountCode,
    ...(offer ? { offer } : {}),
  });
}
