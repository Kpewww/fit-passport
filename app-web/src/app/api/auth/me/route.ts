// GET /api/auth/me
// Returns the current account's public-ish identity + whether this session can
// edit. Never returns password/recovery hashes.

import { NextResponse } from "next/server";
import { getCurrentUser, canEdit } from "@/lib/session";

export async function GET() {
  const user = await getCurrentUser();
  return NextResponse.json({
    claimed: user.claimed,
    accountCode: user.accountCode,
    username: user.username,
    email: user.email, // fine to show the user their own email
    bodyType: user.bodyType,
    showBodyType: user.showBodyType,
    exportPolicy: user.exportPolicy,
    memberNo: user.memberNo,
    // The nav uses this to show the review queue. It's not a secret — knowing
    // you're an admin doesn't grant anything; lib/admin.ts re-checks server-side.
    role: user.role,
    canEdit: canEdit(),
  });
}
