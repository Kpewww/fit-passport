// Shared by the /api/ai routes (Session 104).

import { NextResponse } from "next/server";
import { getCurrentUser } from "../session";
import type { JobRefusal } from "./service";

/**
 * AI photo jobs cost money per image, so they need a claimed account: an anonymous
 * session is free to mint, and a daily allowance per session would be no limit at all.
 */
export async function aiUser(): Promise<{ id: string } | NextResponse> {
  const user = await getCurrentUser();
  if (!user.claimed) return NextResponse.json({ error: "claim-first" }, { status: 403 });
  return user;
}

const STATUS: Record<JobRefusal | "failed", number> = {
  consent: 412, "not-found": 404, "no-photo": 422, off: 503, budget: 429, daily: 429, failed: 502,
};

export function refusal(reason: JobRefusal | "failed") {
  return NextResponse.json({ error: reason }, { status: STATUS[reason] });
}

/** Serve a private picture's bytes to its owner. */
export function pictureResponse(p: { bytes: ArrayBuffer; type: string }) {
  return new NextResponse(p.bytes, { headers: { "content-type": p.type, "cache-control": "private, max-age=31536000, immutable" } });
}
