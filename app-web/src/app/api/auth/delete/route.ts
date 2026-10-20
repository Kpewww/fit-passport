// POST /api/auth/delete  { password?, confirm: "delete" }
// Erase the account and everything in it, now (Session 100). Before this, leaving
// meant deactivating, which keeps every row, and erasure was by email.
//
// A claimed account needs its password; an unclaimed one is this browser's own, and
// its session is enough. Gone with it: the passport, closet and photos, folders,
// to-buy list, checks, outcomes, outfits, posts and answers (all cascade from User),
// its events and feedback, and any empty account once folded into it. Reports,
// likes and votes it gave stay, without its name (onDelete: SetNull), so moderation
// counts and others' scores do not change. A size chart read from a picture is shared
// by everyone who sent that picture and holds no one's data, so it stays.

import { NextResponse } from "next/server";
import { z } from "zod";
import { say } from "@/lib/apiText";
import { prisma } from "@/lib/db";
import { canEdit, clearSession, readSession } from "@/lib/session";
import { verifySecret } from "@/lib/auth";
import { eraseAccount } from "@/lib/accountDelete";
import { resolveAccount } from "@/lib/accountMerge";

const Body = z.object({ password: z.string().max(200).optional(), confirm: z.literal("delete") });

export async function POST(req: Request) {
  const session = readSession();
  if (!session) return NextResponse.json({ error: say(req, "not allowed") }, { status: 403 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: say(req, "invalid request") }, { status: 400 });
  const user = await prisma.user.findUnique({ where: { id: await resolveAccount(session.userId) } });
  if (!user) { clearSession(); return NextResponse.json({ ok: true }); }
  if (user.claimed) {
    if (!canEdit()) return NextResponse.json({ error: say(req, "not allowed") }, { status: 403 });
    if (!parsed.data.password) return NextResponse.json({ error: say(req, "password required") }, { status: 400 });
    if (!(await verifySecret(parsed.data.password, user.passwordHash))) {
      return NextResponse.json({ error: say(req, "password is incorrect") }, { status: 401 });
    }
  }
  await eraseAccount(user.id);
  clearSession();
  return NextResponse.json({ ok: true });
}
