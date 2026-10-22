// POST /api/event  { name: "client-error", detail?, path? }
// What a browser reports about itself (Session 100): today only its own errors, from
// app/error.tsx and app/global-error.tsx. Rate limited; everything else is recorded
// by the server where it happens (lib/events.ts).

import { NextResponse } from "next/server";
import { z } from "zod";
import { readSession } from "@/lib/session";
import { clientKey, rateLimit } from "@/lib/rateLimit";
import { CLIENT_EVENTS, EVENT_NAMES, track, type EventName } from "@/lib/events";

const Body = z.object({
  name: z.enum(EVENT_NAMES),
  detail: z.string().max(500).optional(),
  path: z.string().max(500).optional(),
});

export async function POST(req: Request) {
  const rl = await rateLimit(clientKey(req, "event"), 30, 10 * 60_000);
  if (!rl.ok) return NextResponse.json({ ok: false }, { status: 429 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success || !CLIENT_EVENTS.has(parsed.data.name as EventName)) return NextResponse.json({ ok: false }, { status: 400 });
  // Never minted here: an error report must not create an account (readSession only).
  await track(parsed.data.name, { userId: (await readSession())?.userId ?? null, detail: parsed.data.detail, path: parsed.data.path });
  return NextResponse.json({ ok: true });
}
