// Admin gate.
//
// There is exactly one way to become an admin: scripts/seed-admin.mjs. No API
// grants the role, because an endpoint that can mint admins is an endpoint that
// can be abused into minting admins — and this app has no second factor to fall
// back on.
//
// Admins get one power: the moderation review queue. They cannot read anyone's
// measurements; the privacy invariant is not a permission, it's a property of the
// data model, and /api/view/[code] still doesn't select the cm fields for anybody.

import { prisma } from "./db";
import { readSession } from "./session";

export const ADMIN_ROLE = "ADMIN";

/** The current session's user if they're an admin, else null. */
export async function currentAdmin() {
  const session = readSession();
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, username: true, role: true, deactivated: true },
  });
  if (!user || user.deactivated || user.role !== ADMIN_ROLE) return null;
  return user;
}

/** 404 rather than 403: an admin surface shouldn't confirm that it exists. */
export function notAdmin() {
  return new Response(JSON.stringify({ error: "not found" }), {
    status: 404,
    headers: { "content-type": "application/json" },
  });
}
