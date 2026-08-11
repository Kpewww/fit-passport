// POST /api/auth/recover
//   body: { identifier, email, newPassword }
//     identifier = account code OR username (either works)
// Resets the password for the account that has BOTH the given identifier and
// the given email on record. On success, logs the user in.
//
// Course-MVP caveat: we don't actually send a magic link — we verify the email
// on record matches what the user typed. This is acceptable for a private
// student-run beta; before production this MUST become a real
// send-email-with-token flow.

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { setSession } from "@/lib/session";
import { hashSecret, normalizeAccountCode } from "@/lib/auth";
import { clientKey, rateLimit, tooMany } from "@/lib/rateLimit";

const Body = z.object({
  identifier: z.string().min(2).max(80),
  email: z.string().email().max(200),
  newPassword: z.string().min(6).max(200),
});

export async function POST(req: Request) {
  const rl = rateLimit(clientKey(req, "recover"), 5, 15 * 60_000);
  if (!rl.ok) return tooMany(rl.retryAfterSec);

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { identifier, newPassword } = parsed.data;
  const email = parsed.data.email.toLowerCase();

  // Identifier could be an account code, an email, or a username.
  const id = identifier.trim();
  const looksLikeCode = /^FP-|^[A-Z0-9]{4}-/i.test(id);
  const looksLikeEmail = id.includes("@");
  const user = looksLikeCode
    ? await prisma.user.findUnique({ where: { accountCode: normalizeAccountCode(id) } })
    : looksLikeEmail
      ? await prisma.user.findUnique({ where: { email: id.toLowerCase() } })
      : await prisma.user.findUnique({ where: { username: id } });

  // Uniform error so we don't reveal whether the identifier or the email matched.
  const fail = () =>
    NextResponse.json(
      { error: "we couldn't verify that account and email combination" },
      { status: 401 },
    );

  if (!user || !user.claimed) return fail();
  if (!user.email || user.email.toLowerCase() !== email) return fail();

  const passwordHash = await hashSecret(newPassword);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  setSession({ userId: user.id, canEdit: true });
  return NextResponse.json({ ok: true, username: user.username });
}
