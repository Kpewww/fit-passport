// GET /api/session/carry?next=/closet — Session 92. Step 1 of carrying a session
// from the old address to the new one (lib/sessionCarry.ts has the whole flow).
//
// At the new address: if this browser already has an account here that is in use,
// or was carried before, go straight to `next`. Otherwise give this browser a random
// `state` and ask the old address for its session. Anywhere else (a preview
// deployment, localhost) it is only a redirect to `next`.

import { randomBytes } from "crypto";
import { NextResponse, type NextRequest } from "next/server";
import { readSession } from "@/lib/session";
import { CARRIED_COOKIE, CARRY_STATE_COOKIE, accountHasData, safeNext } from "@/lib/sessionCarry";
import { isSiteHost, legacyOrigin, siteOrigin } from "@/lib/site";

export async function GET(req: NextRequest) {
  const next = safeNext(req.nextUrl.searchParams.get("next"));
  if (!isSiteHost(req.headers.get("host"))) return go(new URL(next, req.url));

  const session = readSession();
  // Built from the address, not req.url: a self-hosted Next builds req.url from its
  // own hostname, whatever the request's Host was.
  if (session && (req.cookies.get(CARRIED_COOKIE)?.value === "1" || (await accountHasData(session.userId)))) {
    return go(new URL(next, siteOrigin()));
  }

  const state = randomBytes(32).toString("base64url");
  const send = new URL("/api/session/send", legacyOrigin());
  send.searchParams.set("state", state);
  send.searchParams.set("next", next);
  const res = go(send);
  res.cookies.set(CARRY_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: siteOrigin().startsWith("https:"),
    path: "/api/session",
    maxAge: 300,
  });
  return res;
}

function go(url: URL) {
  const res = NextResponse.redirect(url, 303);
  res.headers.set("cache-control", "no-store");
  return res;
}
