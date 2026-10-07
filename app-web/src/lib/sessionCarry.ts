// Carrying a session from the old address to the new one — Session 92.
//
// An unclaimed account lives in one cookie, and a cookie belongs to one host: opened
// at www.fitpassport.fit, a closet built at fit-passport.vercel.app would look empty,
// and with no password there is no way back to it. So the session is carried:
//
//   new  /api/session/carry?next=/closet     a random `state` goes in this browser's
//                                            fp_carry cookie (new address only)
//   old  /api/session/send?state=…&next=…    the old address reads ITS session and
//                                            signs a one-minute pass bound to `state`
//   new  /api/session/receive?pass=…&next=…  the pass is checked against fp_carry and
//                                            its session kept as this address's own
//   new  /closet
//
// The `state` is what makes it safe: a pass works only in the browser that started
// the hand-over, so nobody can send a link that signs someone into THEIR account
// (and then watch what that person adds). A pass in a log or a history entry is
// useless without that browser's cookie, and is dead within a minute anyway.
//
// Which account a browser ends with when the two addresses hold different ones:
// lib/accountMerge.ts (Session 92b). They become one, and nothing either held is lost.
//
// Every page of the old address comes through here for a person (middleware.ts), and
// so does every page extension 0.9.0 opens. Once both addresses hold the same
// account it is one redirect: the old address says which account it holds (a hint),
// and from 0.9.0, fp_carried says the hand-over has run.

import { prisma } from "./db";

export const CARRY_STATE_COOKIE = "fp_carry";
export const CARRIED_COOKIE = "fp_carried";

/** A path on this site to land on — never another site. */
export function safeNext(raw: string | null | undefined): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return "/";
  try {
    const base = "https://next.invalid";
    const u = new URL(raw, base);
    if (u.origin !== base) return "/";
    return u.pathname + u.search;
  } catch {
    return "/";
  }
}

/** A `state` as /api/session/carry makes it: 32 random bytes, base64url. */
export function isCarryState(s: string | null | undefined): s is string {
  return typeof s === "string" && /^[A-Za-z0-9_-]{43}$/.test(s);
}

/** True if the account holds anything a person would miss. The profile row every
 *  account is created with, still at its defaults, is not "anything". */
export async function accountHasData(userId: string): Promise<boolean> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      claimed: true,
      fitProfile: { select: { heightCm: true, weightKg: true, chestCm: true, waistCm: true, hipCm: true, shoulderCm: true, sleeveCm: true, inseamCm: true, sex: true, shopsFor: true } },
      _count: { select: { knownGood: true, saved: true, outfits: true, outcomes: true, collections: true, products: true, posts: true, petProfiles: true } },
    },
  });
  if (!u) return false;
  if (u.claimed) return true;
  if (Object.values(u._count).some((n) => n > 0)) return true;
  return Object.values(u.fitProfile ?? {}).some((v) => v != null);
}

/** What lib/accountMerge.ts mergePlan() weighs about an account. */
export async function accountSide(userId: string): Promise<{ id: string; claimed: boolean; hasData: boolean }> {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { claimed: true } });
  return { id: userId, claimed: !!u?.claimed, hasData: await accountHasData(userId) };
}
