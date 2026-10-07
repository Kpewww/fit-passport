// Session bootstrap middleware.
//
// Fixes the first-visit race where several concurrent requests each minted a
// new anonymous user (and each set a cookie, of which the browser kept only
// one) — which made a just-saved passport appear to "disappear" because the
// surviving cookie pointed at a different user row.
//
// Now: on a page (document) request that has no valid session cookie, we mint
// ONE userId here and set the signed cookie on the response BEFORE any client
// `/api/*` calls fire. Those calls then all carry the same cookie, so
// getCurrentUser() upserts a single stable user. API requests are skipped so
// they never race to create their own.
//
// Session 92: at the OLD address (fit-passport.vercel.app) every page moves to
// www.fitpassport.fit (lib/site.ts). A person's page view goes through
// /api/session/carry, so the account in this browser comes along; a person with no
// session yet gets one minted here first, so the extensions before 0.9.0 — which
// still call this address's API with this address's cookie — share it with the site.
// Crawlers and assets get a plain permanent redirect.

import { NextResponse, type NextRequest } from "next/server";
import {
  SESSION_COOKIE,
  decodeSessionEdge,
  encodeSessionEdge,
} from "@/lib/authEdge";
import { accountHint, legacyMove } from "@/lib/site";

export async function middleware(req: NextRequest) {
  const existing = req.cookies.get(SESSION_COOKIE)?.value;
  const valid = await decodeSessionEdge(existing);

  const request = {
    host: req.headers.get("host"),
    method: req.method,
    path: req.nextUrl.pathname + req.nextUrl.search,
    userAgent: req.headers.get("user-agent"),
    fetchMode: req.headers.get("sec-fetch-mode"),
    accept: req.headers.get("accept"),
  };
  const move = legacyMove(request);
  if (move?.kind === "permanent") return NextResponse.redirect(move.location, 308);
  if (move?.kind === "carry") {
    // The account this browser holds here goes along as a hint (Session 92b), so the
    // new address knows when it holds a different one and the two must become one.
    const userId = valid?.userId ?? crypto.randomUUID();
    const res = NextResponse.redirect(legacyMove({ ...request, hint: await accountHint(userId) })!.location, 307);
    res.headers.set("cache-control", "no-store");
    if (!valid) await mint(res, userId);
    return res;
  }

  if (valid) return NextResponse.next();
  const res = NextResponse.next();
  await mint(res, crypto.randomUUID());
  return res;
}

/** Set a fresh anonymous session on the response (Edge-safe UUID). */
async function mint(res: NextResponse, userId: string) {
  const cookie = await encodeSessionEdge({ userId, canEdit: true });
  res.cookies.set(SESSION_COOKIE, cookie, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

// Only run on page navigations — not on API routes, static assets, or images.
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
