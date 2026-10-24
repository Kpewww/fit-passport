// The wear calendar (Session 104): what a person wore on a day, or plans to.
//
//   GET    /api/wear?from=YYYY-MM-DD&to=YYYY-MM-DD   → the days in range (at most 62)
//   POST   /api/wear   { day, status?, itemIds, outfitId?, note?, fits? }
//   PATCH  /api/wear   { id, status?: "worn", note?, fits? }   confirm a plan, answer fit later
//   DELETE /api/wear?id=…                            remove a day (undo)
//
// "Does it still fit?" answers go through lib/comfort.ts with reason "worn": the same
// writer Fit Refresh uses, so the engine reads one kind of fit evidence. A wear event
// itself is not fit evidence and the engine does not read it.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { clientKey, rateLimit, tooMany } from "@/lib/rateLimit";
import { track } from "@/lib/events";
import { photoForClient } from "@/lib/photoStore";
import { recordComfort } from "@/lib/comfort";
import { DayInput, LogInput, PatchInput, daysBetween } from "@/lib/wear";

const ITEM_SELECT = { id: true, brand: true, displayName: true, category: true, color: true, size: true, imageDataUrl: true } as const;

type LogRow = {
  id: string; day: string; status: string; note: string | null; outfitId: string | null;
  outfit: { title: string } | null;
  items: Array<{ item: { id: string; brand: string; displayName: string | null; category: string; color: string | null; size: string; imageDataUrl: string | null } }>;
};

function forClient(l: LogRow) {
  return {
    id: l.id, day: l.day, status: l.status, note: l.note, outfitId: l.outfitId, outfitTitle: l.outfit?.title ?? null,
    items: l.items.map(({ item }) => ({ ...item, imageDataUrl: photoForClient(item.id, item.imageDataUrl) })),
  };
}

const LOG_INCLUDE = { outfit: { select: { title: true } }, items: { select: { item: { select: ITEM_SELECT } } } } as const;

export async function GET(req: Request) {
  const user = await getCurrentUser();
  const q = new URL(req.url).searchParams;
  const from = DayInput.safeParse(q.get("from"));
  const to = DayInput.safeParse(q.get("to"));
  if (!from.success || !to.success) return NextResponse.json({ error: "from and to are YYYY-MM-DD" }, { status: 400 });
  const span = daysBetween(from.data, to.data);
  if (span < 0 || span > 62) return NextResponse.json({ error: "range is 0–62 days" }, { status: 400 });
  const logs = await prisma.wearLog.findMany({
    where: { userId: user.id, day: { gte: from.data, lte: to.data } },
    orderBy: [{ day: "asc" }, { createdAt: "asc" }],
    include: LOG_INCLUDE,
  });
  return NextResponse.json({ logs: logs.map(forClient) });
}

/** Answer "does it still fit?" for pieces of a worn day. Returns how many were answered. */
async function answerFits(userId: string, fits: Array<{ itemId: string; direction: number }> | undefined) {
  let n = 0;
  for (const f of fits ?? []) if (await recordComfort(userId, f.itemId, f.direction, "worn")) n++;
  return n;
}

export async function POST(req: Request) {
  const rl = await rateLimit(clientKey(req, "wear-write"), 120, 10 * 60_000);
  if (!rl.ok) return tooMany(rl.retryAfterSec, req);
  const user = await getCurrentUser();
  const parsed = LogInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { day, status, itemIds, outfitId, note, fits } = parsed.data;

  // Every piece, and the outfit if named, must be the user's own.
  const ids = [...new Set(itemIds)];
  const owned = await prisma.knownGoodItem.count({ where: { id: { in: ids }, userId: user.id } });
  if (owned !== ids.length) return NextResponse.json({ error: "item not found" }, { status: 404 });
  if (outfitId && !(await prisma.outfit.findFirst({ where: { id: outfitId, userId: user.id }, select: { id: true } }))) {
    return NextResponse.json({ error: "outfit not found" }, { status: 404 });
  }

  const log = await prisma.wearLog.create({
    data: { userId: user.id, day, status, outfitId: outfitId ?? null, note: note ?? null, items: { create: ids.map((itemId) => ({ itemId })) } },
    include: LOG_INCLUDE,
  });
  const answered = await answerFits(user.id, fits);
  void track("wear-logged", { userId: user.id, detail: status, path: "/calendar" });
  if (status === "worn") void track("wear-fit", { userId: user.id, detail: `${answered}/${ids.length}`, path: "/calendar" });
  return NextResponse.json({ log: forClient(log), answered });
}

export async function PATCH(req: Request) {
  const rl = await rateLimit(clientKey(req, "wear-write"), 120, 10 * 60_000);
  if (!rl.ok) return tooMany(rl.retryAfterSec, req);
  const user = await getCurrentUser();
  const parsed = PatchInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { id, status, note, fits } = parsed.data;
  const existing = await prisma.wearLog.findFirst({ where: { id, userId: user.id }, include: { items: { select: { itemId: true } } } });
  if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });
  const confirming = status === "worn" && existing.status === "planned";
  const wornNow = existing.status === "worn" || confirming;
  if (fits?.length && !wornNow) return NextResponse.json({ error: "fit answers belong to a worn day" }, { status: 400 });
  const inDay = new Set(existing.items.map((i) => i.itemId));
  if ((fits ?? []).some((f) => !inDay.has(f.itemId))) return NextResponse.json({ error: "a fit answer must be for a piece worn that day" }, { status: 400 });

  const log = await prisma.wearLog.update({
    where: { id },
    data: { ...(confirming ? { status: "worn" } : {}), ...(note !== undefined ? { note } : {}) },
    include: LOG_INCLUDE,
  });
  const answered = await answerFits(user.id, fits);
  if (confirming) void track("wear-logged", { userId: user.id, detail: "confirmed", path: "/calendar" });
  if (fits !== undefined) void track("wear-fit", { userId: user.id, detail: `${answered}/${inDay.size}`, path: "/calendar" });
  return NextResponse.json({ log: forClient(log), answered });
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  const id = new URL(req.url).searchParams.get("id") ?? "";
  // Fit answers already given stay: they were true when said, like any Fit Refresh answer.
  const gone = await prisma.wearLog.deleteMany({ where: { id, userId: user.id } });
  if (!gone.count) return NextResponse.json({ error: "not found" }, { status: 404 });
  void track("wear-undo", { userId: user.id, path: "/calendar" });
  return NextResponse.json({ ok: true });
}
