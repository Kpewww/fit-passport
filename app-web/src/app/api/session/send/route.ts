// GET /api/session/send?state=…&next=/closet — Session 92. Step 2 of carrying a
// session (lib/sessionCarry.ts): at the OLD address, sign a one-minute pass for the
// session this browser holds here, bound to the `state` the new address gave it,
// and go back. No session here: go back with nothing to carry.
//
// Only the old address answers; anywhere else this route does not exist.

import { NextResponse, type NextRequest } from "next/server";
import { encodeCarryPass } from "@/lib/auth";
import { readSession } from "@/lib/session";
import { isCarryState, safeNext } from "@/lib/sessionCarry";
import { isLegacyHost, siteOrigin } from "@/lib/site";

export async function GET(req: NextRequest) {
  if (!isLegacyHost(req.headers.get("host"))) return new NextResponse(null, { status: 404 });

  const state = req.nextUrl.searchParams.get("state");
  const receive = new URL("/api/session/receive", siteOrigin());
  receive.searchParams.set("next", safeNext(req.nextUrl.searchParams.get("next")));
  const session = readSession();
  if (session && isCarryState(state)) receive.searchParams.set("pass", encodeCarryPass(session, state));

  const res = NextResponse.redirect(receive, 303);
  res.headers.set("cache-control", "no-store");
  res.headers.set("referrer-policy", "no-referrer");
  return res;
}
