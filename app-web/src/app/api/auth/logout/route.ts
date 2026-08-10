// POST /api/auth/logout
// Clears the session cookie. Next request will mint a fresh anonymous account.

import { NextResponse } from "next/server";
import { clearSession } from "@/lib/session";

export async function POST() {
  clearSession();
  return NextResponse.json({ ok: true });
}
