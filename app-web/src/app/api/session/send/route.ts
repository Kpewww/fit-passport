// GET /api/session/send?state=…&next=/closet — Session 92. Step 2 of carrying a
// session (lib/sessionCarry.ts): at the OLD address, sign a one-minute pass for the
// session this browser holds here, bound to the `state` the new address gave it,
// and go back. No session here: go back with nothing to carry.
//
// An account here that was folded into another (lib/accountMerge.ts) is carried as
// the one it became, and this address's cookie is moved to it too (Session 92b).
//
// Only the old address answers; anywhere else this route does not exist.

import { NextResponse, type NextRequest } from "next/server";
import { resolveAccount } from "@/lib/accountMerge";
import { SESSION_COOKIE, encodeCarryPass, encodeSession } from "@/lib/auth";
import { COOKIE_OPTS, readSession } from "@/lib/session";
import { isCarryState, safeNext } from "@/lib/sessionCarry";
import { isLegacyHost, siteOrigin } from "@/lib/site";

export async function GET(req: NextRequest) {
  if (!isLegacyHost(req.headers.get("host"))) return new NextResponse(null, { status: 404 });

  const state = req.nextUrl.searchParams.get("state");
  const receive = new URL("/api/session/receive", siteOrigin());
  receive.searchParams.set("next", safeNext(req.nextUrl.searchParams.get("next")));
  const session = readSession();
  const userId = session && isCarryState(state) ? await resolveAccount(session.userId) : null;
  if (session && userId && isCarryState(state)) {
    receive.searchParams.set("pass", encodeCarryPass({ userId, canEdit: session.canEdit }, state));
  }

  const res = NextResponse.redirect(receive, 303);
  res.headers.set("cache-control", "no-store");
  res.headers.set("referrer-policy", "no-referrer");
  if (session && userId && userId !== session.userId) {
    res.cookies.set(SESSION_COOKIE, encodeSession({ userId, canEdit: session.canEdit }), COOKIE_OPTS);
  }
  return res;
}
