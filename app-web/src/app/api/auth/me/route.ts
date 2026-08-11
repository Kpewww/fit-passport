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
    exportPolicy: user.exportPolicy,
    canEdit: canEdit(),
  });
}
