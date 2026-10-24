// POST /api/ai/consent { kind: "cutout" | "tryon", accept: boolean } (Session 104).
// Saying no (or withdrawing) stops anything further being sent; it does not delete
// pictures already made, which /api/ai/all does.

import { NextResponse } from "next/server";
import { z } from "zod";
import { grantConsent, revokeConsent } from "@/lib/aiMedia/consent";
import { aiUser } from "@/lib/aiMedia/http";

const Body = z.object({ kind: z.enum(["cutout", "tryon"]), accept: z.boolean() });

export async function POST(req: Request) {
  const user = await aiUser();
  if (user instanceof NextResponse) return user;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  if (parsed.data.accept) await grantConsent(user.id, parsed.data.kind);
  else await revokeConsent(user.id, parsed.data.kind);
  return NextResponse.json({ ok: true });
}
