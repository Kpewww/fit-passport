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

import { NextResponse, type NextRequest } from "next/server";
import {
  SESSION_COOKIE,
  decodeSessionEdge,
  encodeSessionEdge,
} from "@/lib/authEdge";

export async function middleware(req: NextRequest) {
  const existing = req.cookies.get(SESSION_COOKIE)?.value;
  const valid = await decodeSessionEdge(existing);
  if (valid) return NextResponse.next();

  // Mint a fresh anonymous session id (Edge-safe UUID).
  const userId = crypto.randomUUID();
  const cookie = await encodeSessionEdge({ userId, canEdit: true });

  const res = NextResponse.next();
  res.cookies.set(SESSION_COOKIE, cookie, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return res;
}

// Only run on page navigations — not on API routes, static assets, or images.
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
