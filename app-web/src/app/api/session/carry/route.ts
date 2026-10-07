// GET /api/session/carry?next=/closet[&h=…] — Session 92. Step 1 of carrying a
// session from the old address to the new one (lib/sessionCarry.ts has the whole flow).
//
// At the new address: go straight to `next` when this browser already holds the same
// account at both addresses — told by `h`, the old address's hint of its account
// (Session 92b) — or, entering from extension 0.9.0 with no hint, when the hand-over
// has run in this browser before. Otherwise give this browser a random `state` and
// ask the old address for its session. Anywhere else (a preview, localhost) it is only
// a redirect to `next`.

import { randomBytes } from "crypto";
import { NextResponse, type NextRequest } from "next/server";
import { resolveAccount } from "@/lib/accountMerge";
import { readSession } from "@/lib/session";
import { CARRIED_COOKIE, CARRY_STATE_COOKIE, safeNext } from "@/lib/sessionCarry";
import { accountHint, isSiteHost, legacyOrigin, siteOrigin } from "@/lib/site";

export async function GET(req: NextRequest) {
  const next = safeNext(req.nextUrl.searchParams.get("next"));
  if (!isSiteHost(req.headers.get("host"))) return go(new URL(next, req.url));

  // Built from the address, not req.url: a self-hosted Next builds req.url from its
  // own hostname, whatever the request's Host was.
  const session = readSession();
  const hint = req.nextUrl.searchParams.get("h");
  if (session) {
    const same = hint
      ? hint === (await accountHint(session.userId)) || hint === (await accountHint(await resolveAccount(session.userId)))
      : req.cookies.get(CARRIED_COOKIE)?.value === "1";
    if (same) return go(new URL(next, siteOrigin()));
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
