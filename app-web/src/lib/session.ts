// Session handling for code-based identity.
//
// Flow:
//  - First visit with no valid cookie → create an ANONYMOUS unclaimed User and
//    set a signed session cookie (canEdit = true, because it's your own fresh
//    account). This keeps the "just start adding clothes" experience frictionless.
//  - The user can later CLAIM the account (username + password) → it gains an
//    accountCode and becomes shareable.
//  - Logging in elsewhere (code + password) issues a session with canEdit = true.
//  - Viewing someone's closet by code does NOT use the session at all — it's a
//    separate read-only public endpoint.

import { cookies } from "next/headers";
import { prisma } from "./db";
import {
  SESSION_COOKIE,
  decodeSession,
  encodeSession,
  type SessionPayload,
} from "./auth";

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 365, // 1 year
};

/** Read + verify the current session payload, or null. */
export function readSession(): SessionPayload | null {
  const cookie = cookies().get(SESSION_COOKIE)?.value;
  return decodeSession(cookie);
}

/** Set the session cookie for a user. */
export function setSession(payload: SessionPayload) {
  cookies().set(SESSION_COOKIE, encodeSession(payload), COOKIE_OPTS);
}

/** Clear the session cookie (logout). */
export function clearSession() {
  cookies().set(SESSION_COOKIE, "", { ...COOKIE_OPTS, maxAge: 0 });
}

/**
 * Get the current user, creating a fresh anonymous account on first visit.
 * Always returns a user; the caller can check `claimed`.
 */
export async function getCurrentUser() {
  const session = readSession();
  if (session) {
    const existing = await prisma.user.findUnique({ where: { id: session.userId } });
    if (existing) return existing;
    // Session pointed at a deleted user — fall through and create a new one.
  }

  const user = await prisma.user.create({
    data: {
      claimed: false,
      fitProfile: { create: { preferredFit: "regular", region: "US" } },
    },
  });
  setSession({ userId: user.id, canEdit: true });
  return user;
}

/**
 * True if the current session holds edit rights on the current account.
 * In the current single-session model a session only ever addresses its own
 * account, so this is effectively always true for the session holder; read-only
 * access to OTHER accounts happens through the separate /api/view/[code] path
 * that never touches write endpoints. `canEdit` is surfaced to the UI (via
 * /api/auth/me) and reserved for future viewer-sessions.
 */
export function canEdit(): boolean {
  return readSession()?.canEdit ?? false;
}
