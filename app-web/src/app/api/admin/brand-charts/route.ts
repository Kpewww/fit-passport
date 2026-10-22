// GET  /api/admin/brand-charts        the guides entered so far
// POST /api/admin/brand-charts        enter one brand's own size guide, typed from its page
// POST { id, delete: true }           remove one
// Admin only (Session 101h). The numbers are typed as the page prints them; units are
// recorded, and the conversion to cm happens in one place (brandOffsets.ts).

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { canEdit } from "@/lib/session";
import { currentAdmin, notAdmin } from "@/lib/admin";
import { invalidateBrandReports } from "@/lib/brandOffsets";

const num = z.number().positive().max(400).optional();
const Row = z.object({ label: z.string().trim().min(1).max(12), chestMin: num, chestMax: num, waistMin: num, waistMax: num })
  .refine((r) => (r.chestMin == null || r.chestMax == null || r.chestMax > r.chestMin) && (r.waistMin == null || r.waistMax == null || r.waistMax > r.waistMin));
const Entry = z.object({
  brand: z.string().trim().min(1).max(80),
  line: z.enum(["mens", "womens"]),
  kind: z.enum(["body", "garment"]),
  units: z.enum(["in", "cm"]),
  sourceUrl: z.string().url().max(500).refine((u) => /^https:\/\//.test(u)),
  note: z.string().max(300).optional().nullable(),
  rows: z.array(Row).min(2).max(20),
});

export async function GET() {
  if (!(await currentAdmin())) return notAdmin();
  const entries = await prisma.brandChartEntry.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  return NextResponse.json({ entries: entries.map((e) => ({ ...e, rows: JSON.parse(e.rowsJson), rowsJson: undefined })) });
}

export async function POST(req: Request) {
  const admin = await currentAdmin();
  if (!admin || !(await canEdit())) return notAdmin();
  const body = await req.json().catch(() => null);
  if (body?.delete && typeof body.id === "string") {
    await prisma.brandChartEntry.delete({ where: { id: body.id } }).catch(() => null);
    invalidateBrandReports();
    return NextResponse.json({ ok: true });
  }
  const p = Entry.safeParse(body);
  if (!p.success) return NextResponse.json({ error: "invalid", issues: p.error.issues.map((i) => i.path.join(".")) }, { status: 400 });
  const { rows, ...rest } = p.data;
  const e = await prisma.brandChartEntry.create({
    data: { ...rest, note: rest.note ?? null, capturedAt: new Date(), enteredBy: admin.id, rowsJson: JSON.stringify(rows) },
  });
  invalidateBrandReports();
  return NextResponse.json({ id: e.id });
}
