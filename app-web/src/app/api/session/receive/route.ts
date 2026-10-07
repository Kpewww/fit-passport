// GET /api/session/receive?pass=…&next=/closet — Session 92. Step 3 of carrying a
// session (lib/sessionCarry.ts): at the new address, check the pass against this
// browser's `state`, keep the carried session as this address's own unless an
// account already in use is here, and land on `next`.

import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, decodeCarryPass, encodeSession } from "@/lib/auth";
import { COOKIE_OPTS, readSession } from "@/lib/session";
import { CARRIED_COOKIE, CARRY_STATE_COOKIE, accountHasData, isCarryState, receiveDecision, safeNext } from "@/lib/sessionCarry";
import { isSiteHost, siteOrigin } from "@/lib/site";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const here = isSiteHost(req.headers.get("host"));
  // Built from the address, not req.url (carry/route.ts says why).
  const res = NextResponse.redirect(new URL(safeNext(params.get("next")), here ? siteOrigin() : req.url), 303);
  res.headers.set("cache-control", "no-store");
  // The pass is in this request's address; nothing after it should see it.
  res.headers.set("referrer-policy", "no-referrer");
  if (!here) return res;

  const state = req.cookies.get(CARRY_STATE_COOKIE)?.value;
  res.cookies.set(CARRY_STATE_COOKIE, "", { path: "/api/session", maxAge: 0 });
  // Not started in this browser: there is nothing to take.
  if (!isCarryState(state)) return res;

  const pass = params.get("pass");
  const carried = decodeCarryPass(pass, state);
  // A pass that does not check out: take nothing, and let the next visit try again.
  if (pass && !carried) return res;

  if (carried) {
    const current = readSession();
    const inUse = current != null && current.userId !== carried.userId && (await accountHasData(current.userId));
    if (receiveDecision(carried, current, inUse) === "adopt") {
      res.cookies.set(SESSION_COOKIE, encodeSession(carried), COOKIE_OPTS);
    }
  }
  res.cookies.set(CARRIED_COOKIE, "1", { ...COOKIE_OPTS, secure: siteOrigin().startsWith("https:") });
  return res;
}
