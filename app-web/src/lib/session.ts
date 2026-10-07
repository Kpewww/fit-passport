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
import { resolveAccount } from "./accountMerge";
import {
  SESSION_COOKIE,
  decodeSession,
  encodeSession,
  type SessionPayload,
} from "./auth";

export const COOKIE_OPTS = {
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
 * Get the current user for this session.
 *
 * The middleware mints the session cookie (with a fresh userId) on the first
 * page load, BEFORE any /api call — so by the time we get here a cookie almost
 * always exists. We upsert by that id, which is idempotent: concurrent requests
 * carrying the same cookie converge on one row instead of racing to create
 * several (the old bug). We only fall back to creating a brand-new session if
 * there's genuinely no valid cookie (e.g. an API hit with cookies disabled).
 */
export async function getCurrentUser() {
  const session = readSession();

  if (session) {
    // Idempotent: create the row for this session id if it doesn't exist yet,
    // otherwise return the existing one. If two concurrent requests both try to
    // create the same id, one wins and the other hits a unique-constraint error
    // (P2002) — we just re-read in that case.
    try {
      return await followFold(await prisma.user.upsert({
        where: { id: session.userId },
        update: {},
        create: {
          id: session.userId,
          claimed: false,
          fitProfile: { create: { preferredFit: "regular", region: "US" } },
        },
      }), session);
    } catch {
      const existing = await prisma.user.findUnique({ where: { id: session.userId } });
      if (existing) return followFold(existing, session);
      // fall through to a fresh session below
    }
  }

  // No valid cookie at all — create one now (rare: direct API call w/o cookie).
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
 * A session naming an account that was folded into another (lib/accountMerge.ts)
 * lands on that one, and its cookie is rewritten so the next request goes straight
 * there. This is what puts an older extension — which calls the old address with
 * the old address's cookie — on the same account as the website.
 */
async function followFold<U extends { id: string; mergedIntoId: string | null }>(user: U, session: SessionPayload): Promise<U> {
  if (!user.mergedIntoId) return user;
  const target = await prisma.user.findUnique({ where: { id: await resolveAccount(user.id) } });
  if (!target) return user;
  try {
    setSession({ userId: target.id, canEdit: session.canEdit });
  } catch {
    // Outside a route handler the cookie cannot be written; the next request follows again.
  }
  return target as unknown as U;
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
