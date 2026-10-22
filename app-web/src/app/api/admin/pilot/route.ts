// GET /api/admin/pilot — what a pilot is doing (Session 100), admin only: counts of
// each event over 7 and 30 days, the commonest refusal codes, and the latest feedback.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { currentAdmin, notAdmin } from "@/lib/admin";
import { brotliPatched } from "@/lib/runtimePatch";

const DAY = 24 * 60 * 60 * 1000;

export async function GET() {
  const admin = await currentAdmin();
  if (!admin) return notAdmin();
  const since7 = new Date(Date.now() - 7 * DAY);
  const since30 = new Date(Date.now() - 30 * DAY);
  const [week, month, refusals, people, feedback] = await Promise.all([
    prisma.event.groupBy({ by: ["name"], where: { createdAt: { gte: since7 } }, _count: { _all: true } }),
    prisma.event.groupBy({ by: ["name"], where: { createdAt: { gte: since30 } }, _count: { _all: true } }),
    prisma.event.groupBy({
      by: ["detail"], where: { createdAt: { gte: since30 }, name: { in: ["check-refused", "chart-upload", "client-error"] } },
      _count: { _all: true }, orderBy: { _count: { detail: "desc" } }, take: 15,
    }),
    prisma.event.groupBy({ by: ["userId"], where: { createdAt: { gte: since7 }, userId: { not: null } } }),
    prisma.feedback.findMany({ orderBy: { createdAt: "desc" }, take: 30 }),
  ]);
  const counts = (rows: Array<{ name: string; _count: { _all: number } }>) => Object.fromEntries(rows.map((r) => [r.name, r._count._all]));
  return NextResponse.json({
    week: counts(week),
    month: counts(month),
    peopleThisWeek: people.length,
    node: { version: process.versions.node, patched: brotliPatched() },
    refusals: refusals.map((r) => ({ detail: r.detail, n: r._count._all })),
    feedback: feedback.map((f) => ({ id: f.id, message: f.message, contact: f.contact, path: f.path, locale: f.locale, at: f.createdAt })),
  });
}
