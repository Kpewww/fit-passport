// POST /api/auth/request-reset  { identifier }
//   identifier = username | email | account code
// Starts a real password-reset flow: finds the account, generates a one-time
// token, stores its HASH + a 30-min expiry, and emails the reset link. Account
// code NEVER changes — only the password can be reset (per founder's rule).
//
// Privacy: always returns ok:true regardless of whether the account/email exist,
// so we don't leak which identifiers are registered. When email isn't configured
// (local/beta), we return the link directly so the flow is testable.

import { NextResponse } from "next/server";
import { z } from "zod";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { hashSecret, normalizeAccountCode } from "@/lib/auth";
import { emailConfigured, resetEmailHtml, sendEmail } from "@/lib/email";
import { clientKey, rateLimit, tooMany } from "@/lib/rateLimit";

const Body = z.object({ identifier: z.string().min(2).max(200) });

function baseUrl(req: Request): string {
  return process.env.APP_URL || new URL(req.url).origin;
}

export async function POST(req: Request) {
  const rl = rateLimit(clientKey(req, "reqreset"), 5, 15 * 60_000);
  if (!rl.ok) return tooMany(rl.retryAfterSec);

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }
  const id = parsed.data.identifier.trim();
  const looksLikeCode = /^FP-|^[A-Z0-9]{4}-/i.test(id);
  const looksLikeEmail = id.includes("@");
  const user = looksLikeCode
    ? await prisma.user.findUnique({ where: { accountCode: normalizeAccountCode(id) } })
    : looksLikeEmail
      ? await prisma.user.findUnique({ where: { email: id.toLowerCase() } })
      : await prisma.user.findUnique({ where: { username: id } });

  // Uniform response; only actually send if the account exists, is claimed, has
  // an email, and isn't deactivated.
  if (user && user.claimed && user.email && !user.deactivated) {
    const token = randomBytes(24).toString("base64url");
    const resetTokenHash = await hashSecret(token);
    const resetExpiresAt = new Date(Date.now() + 30 * 60_000);
    await prisma.user.update({ where: { id: user.id }, data: { resetTokenHash, resetExpiresAt } });

    const link = `${baseUrl(req)}/reset?token=${token}&u=${user.id}`;
    if (emailConfigured()) {
      await sendEmail({ to: user.email, subject: "Reset your Fit Passport password", html: resetEmailHtml(link) });
      return NextResponse.json({ ok: true });
    }
    // Dev/beta fallback: no email provider → hand back the link so it's testable.
    return NextResponse.json({ ok: true, devLink: link });
  }

  return NextResponse.json({ ok: true });
}
