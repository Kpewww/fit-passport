// POST /api/auth/fold-browser  { accept: boolean }
// The answer to login's offer (Session 100): yes brings what this browser added
// before logging in into the account (accountMerge.ts foldAccount, which overwrites
// nothing); no forgets the offer. Only for the account the offer was made to, in the
// browser that holds it, within FOLD_OFFER_TTL_MS.

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { say } from "@/lib/apiText";
import { canEdit, readSession } from "@/lib/session";
import { decodeFoldOffer } from "@/lib/auth";
import { foldAccount } from "@/lib/accountMerge";
import { FOLD_COOKIE, holdings } from "@/lib/loginFold";

const Body = z.object({ accept: z.boolean() });

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: say(req, "invalid request") }, { status: 400 });
  const offer = decodeFoldOffer((await cookies()).get(FOLD_COOKIE)?.value);
  (await cookies()).set(FOLD_COOKIE, "", { path: "/", maxAge: 0 });
  const session = (await readSession());
  if (!offer || !session || session.userId !== offer.keep || !(await canEdit())) {
    return NextResponse.json({ error: say(req, "not allowed") }, { status: 403 });
  }
  if (!parsed.data.accept) return NextResponse.json({ ok: true, moved: null });
  const moved = await holdings(offer.fold);
  await foldAccount(offer.fold, offer.keep);
  return NextResponse.json({ ok: true, moved });
}
