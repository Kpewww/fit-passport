// POST   /api/ai/cutout { itemId }   remove a closet photo's background (BRIA)
// DELETE /api/ai/cutout?itemId=…     back to the original; the cut-out is deleted
// (Session 104). The original photo is never changed.

import { NextResponse } from "next/server";
import { z } from "zod";
import { clientKey, rateLimit, tooMany } from "@/lib/rateLimit";
import { aiUser, refusal } from "@/lib/aiMedia/http";
import { removeCutout, runCutout } from "@/lib/aiMedia/service";

export const maxDuration = 60;

export async function POST(req: Request) {
  const rl = await rateLimit(clientKey(req, "ai-job"), 30, 10 * 60_000);
  if (!rl.ok) return tooMany(rl.retryAfterSec, req);
  const user = await aiUser();
  if (user instanceof NextResponse) return user;
  const parsed = z.object({ itemId: z.string().min(1).max(40) }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "itemId required" }, { status: 400 });
  const r = await runCutout(user.id, parsed.data.itemId);
  if (!r.ok) return refusal(r.reason);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const user = await aiUser();
  if (user instanceof NextResponse) return user;
  const itemId = new URL(req.url).searchParams.get("itemId") ?? "";
  if (!(await removeCutout(user.id, itemId))) return refusal("not-found");
  return NextResponse.json({ ok: true });
}
