// GET /api/account-name?code=FP-XXXX-XXXX-XXXXX — whose account a code is (Session 100e).
// Shown, faintly, beside a code typed into login, recovery or "view a closet by code",
// so a person knows they have the right one. Says no more than the public closet page
// already does for the same code (/api/view/[code]): the username of a claimed,
// active account, and nothing for any other.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normalizeAccountCode } from "@/lib/auth";
import { clientKey, rateLimit } from "@/lib/rateLimit";

const CODE_SHAPE = /^FP-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{5}$/;

export async function GET(req: Request) {
  const rl = await rateLimit(clientKey(req, "account-name"), 60, 10 * 60_000);
  if (!rl.ok) return NextResponse.json({ username: null }, { status: 429 });
  const raw = new URL(req.url).searchParams.get("code") ?? "";
  const code = normalizeAccountCode(raw.slice(0, 40));
  if (!CODE_SHAPE.test(code)) return NextResponse.json({ username: null }, { status: 400 });
  const user = await prisma.user.findUnique({ where: { accountCode: code }, select: { username: true, claimed: true, deactivated: true } });
  const username = user && user.claimed && !user.deactivated ? user.username : null;
  return NextResponse.json({ username }, { status: username ? 200 : 404, headers: { "cache-control": "private, max-age=60" } });
}
