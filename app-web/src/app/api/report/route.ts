// POST /api/report  { kind, targetId, reason, note? }
//
// Anonymous-friendly reporting: keyed by session so a first-time visitor who
// lands on something abusive can flag it. Unique per (target, reporter), so
// clicking repeatedly does nothing. Once enough DISTINCT people report the same
// thing it auto-hides — see lib/reports.ts for that rule and its known weakness.
//
// Hidden content stays visible to its author (so they know why it vanished) and
// to nobody else. scripts/moderate.mjs is the authoritative restore path.

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import {
  parseReportKind,
  parseReportReason,
  REPORT_REASONS,
  reportsUntilHidden,
  shouldAutoHide,
} from "@/lib/reports";
import { clientKey, rateLimit, tooMany } from "@/lib/rateLimit";

const Body = z.object({
  kind: z.string(),
  targetId: z.string().min(1),
  reason: z.string(),
  note: z.string().max(500).optional().nullable(),
});

export async function GET() {
  // The composer needs the reason list; keeping it server-sourced means the UI
  // can't offer a reason the validator would reject.
  return NextResponse.json({ reasons: REPORT_REASONS });
}

export async function POST(req: Request) {
  const rl = await rateLimit(clientKey(req, "report"), 20, 10 * 60_000);
  if (!rl.ok) return tooMany(rl.retryAfterSec);

  const user = await getCurrentUser();
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad request" }, { status: 400 });

  const kind = parseReportKind(parsed.data.kind);
  const reason = parseReportReason(parsed.data.reason);
  if (!kind || !reason) {
    return NextResponse.json({ error: "unknown kind or reason" }, { status: 400 });
  }
  const { targetId } = parsed.data;

  // Confirm the target exists AND find its author, so we can refuse self-reports
  // (pointless) and know whose content we might hide.
  const authorId = await targetAuthor(kind, targetId);
  if (!authorId) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (authorId === user.id) {
    return NextResponse.json(
      { error: "that's your own content — delete it instead" },
      { status: 400 },
    );
  }

  await prisma.report
    .create({
      data: {
        kind,
        targetId,
        reporterKey: user.id,
        userId: user.claimed ? user.id : null,
        reason,
        note: parsed.data.note?.trim() || null,
      },
    })
    .catch(() => {}); // already reported by this session → idempotent

  const distinct = await prisma.report.count({ where: { kind, targetId } });
  const hide = shouldAutoHide(distinct);
  if (hide) await setHidden(kind, targetId, true);

  return NextResponse.json({
    ok: true,
    reports: distinct,
    hidden: hide,
    reportsUntilHidden: reportsUntilHidden(distinct),
  });
}

/** The user id behind a reportable item, or null if it doesn't exist. */
async function targetAuthor(kind: string, id: string): Promise<string | null> {
  if (kind === "POST") {
    const row = await prisma.post.findUnique({ where: { id }, select: { userId: true } });
    return row?.userId ?? null;
  }
  if (kind === "ANSWER") {
    const row = await prisma.answer.findUnique({ where: { id }, select: { userId: true } });
    return row?.userId ?? null;
  }
  const row = await prisma.outfit.findUnique({ where: { id }, select: { userId: true } });
  return row?.userId ?? null;
}

async function setHidden(kind: string, id: string, hidden: boolean) {
  if (kind === "POST") await prisma.post.update({ where: { id }, data: { hidden } });
  else if (kind === "ANSWER") await prisma.answer.update({ where: { id }, data: { hidden } });
  else await prisma.outfit.update({ where: { id }, data: { hidden } });
}
