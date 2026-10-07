// GET /api/session/receive?pass=…&next=/closet — Session 92. Step 3 of carrying a
// session (lib/sessionCarry.ts): at the new address, check the pass against this
// browser's `state`, and land on `next` with ONE account for this browser.
//
// No account here: the carried one is taken. A different one here: the two become one
// (lib/accountMerge.ts, Session 92b) — the claimed one stays, else the one here unless
// it is empty, and an unclaimed other is folded into it, so the old address (and an
// older extension using it) follows to the same account from its next request.

import { NextResponse, type NextRequest } from "next/server";
import { foldAccount, mergePlan, resolveAccount } from "@/lib/accountMerge";
import { SESSION_COOKIE, decodeCarryPass, encodeSession } from "@/lib/auth";
import { COOKIE_OPTS, readSession } from "@/lib/session";
import { CARRIED_COOKIE, CARRY_STATE_COOKIE, accountSide, isCarryState, safeNext } from "@/lib/sessionCarry";
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
    const there = await resolveAccount(carried.userId);
    const current = readSession();
    let keep = there;
    let canEdit = carried.canEdit;
    if (current) {
      const mine = await resolveAccount(current.userId);
      const plan = mergePlan(await accountSide(mine), await accountSide(there));
      if (plan.kind === "fold") await foldAccount(plan.fold, plan.keep);
      keep = plan.keep;
      if (keep === mine) canEdit = current.canEdit;
    }
    if (keep !== current?.userId) res.cookies.set(SESSION_COOKIE, encodeSession({ userId: keep, canEdit }), COOKIE_OPTS);
  }
  res.cookies.set(CARRIED_COOKIE, "1", { ...COOKIE_OPTS, secure: siteOrigin().startsWith("https:") });
  return res;
}
