// GET  /api/admin/users?q=<account code or username>  → who it is (admin only)
// POST /api/admin/users { id, confirm: "delete" }      → erase that account
// Session 100f: an account deactivated by its owner cannot log in, so it cannot delete
// itself; this is how it is removed. Never another admin, never yourself. The lookup
// shows only what an admin needs to be sure: the name, the code, and whether the
// account is claimed or deactivated — no measurements.

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { canEdit } from "@/lib/session";
import { currentAdmin, notAdmin, ADMIN_ROLE } from "@/lib/admin";
import { normalizeAccountCode } from "@/lib/auth";
import { eraseAccount } from "@/lib/accountDelete";

const pick = { id: true, username: true, accountCode: true, claimed: true, deactivated: true, role: true, createdAt: true } as const;

export async function GET(req: Request) {
  const admin = await currentAdmin();
  if (!admin) return notAdmin();
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim().slice(0, 80);
  if (q.length < 2) return NextResponse.json({ user: null });
  const looksLikeCode = /^FP-/i.test(q) || /^[A-Z0-9]{4}-/i.test(q);
  const user = looksLikeCode
    ? await prisma.user.findUnique({ where: { accountCode: normalizeAccountCode(q) }, select: pick })
    : await prisma.user.findUnique({ where: { username: q }, select: pick });
  if (!user) return NextResponse.json({ user: null });
  const [pieces, checks] = await Promise.all([
    prisma.knownGoodItem.count({ where: { userId: user.id } }),
    prisma.product.count({ where: { userId: user.id } }),
  ]);
  return NextResponse.json({ user: { ...user, isAdmin: user.role === ADMIN_ROLE, pieces, checks } });
}

const Body = z.object({ id: z.string().min(1).max(40), confirm: z.literal("delete") });

export async function POST(req: Request) {
  const admin = await currentAdmin();
  if (!admin || !canEdit()) return notAdmin();
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const target = await prisma.user.findUnique({ where: { id: parsed.data.id }, select: { id: true, role: true } });
  if (!target) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (target.id === admin.id || target.role === ADMIN_ROLE) return NextResponse.json({ error: "not allowed" }, { status: 403 });
  await eraseAccount(target.id);
  return NextResponse.json({ ok: true });
}
