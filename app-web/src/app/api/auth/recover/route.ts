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

const Body = z.object({
  identifier: z.string().min(2).max(80),
  email: z.string().email().max(200),
  newPassword: z.string().min(6).max(200),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { identifier, newPassword } = parsed.data;
  const email = parsed.data.email.toLowerCase();

  // Identifier could be an account code or a username.
  const looksLikeCode = /^FP-|^[A-Z0-9]{4}-/i.test(identifier.trim());
  const user = looksLikeCode
    ? await prisma.user.findUnique({ where: { accountCode: normalizeAccountCode(identifier) } })
    : await prisma.user.findUnique({ where: { username: identifier.trim() } });

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
