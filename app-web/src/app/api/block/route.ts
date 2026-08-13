// Blocks.
//
//   GET  /api/block                          → { claimed, blocked: [codes] }
//   POST /api/block { accountCode, block }    → toggle
//
// Reporting is for content that breaks the rules; blocking is for someone you
// simply don't want to see. Keeping them separate keeps the review queue about
// actual abuse instead of personal friction.
//
// Enforced BOTH ways (see lib/blocks.ts): blocking someone also removes you from
// their feeds, so it's an exit from their attention, not just from your own view.
// The blocked person is never told.

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { normalizeAccountCode } from "@/lib/auth";
import { clientKey, rateLimit, tooMany } from "@/lib/rateLimit";

const Body = z.object({
  accountCode: z.string().min(4).max(64),
  block: z.boolean(),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user.claimed) {
    return NextResponse.json({ claimed: false, blocked: [] });
  }
  const rows = await prisma.block.findMany({
    where: { blockerId: user.id },
    select: { blocked: { select: { accountCode: true } } },
  });
  return NextResponse.json({
    claimed: true,
    blocked: rows.map((r) => r.blocked.accountCode).filter((c): c is string => !!c),
  });
}

export async function POST(req: Request) {
  const rl = await rateLimit(clientKey(req, "block"), 60, 60_000);
  if (!rl.ok) return tooMany(rl.retryAfterSec);

  const user = await getCurrentUser();
  if (!user.claimed) {
    return NextResponse.json(
      { error: "claim-required", message: "Claim an account to block people." },
      { status: 403 },
    );
  }

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad request" }, { status: 400 });

  const target = await prisma.user.findUnique({
    where: { accountCode: normalizeAccountCode(parsed.data.accountCode) },
    select: { id: true, claimed: true },
  });
  if (!target || !target.claimed) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (target.id === user.id) {
    return NextResponse.json({ error: "you can't block yourself" }, { status: 400 });
  }

  if (parsed.data.block) {
    await prisma.block.upsert({
      where: { blockerId_blockedId: { blockerId: user.id, blockedId: target.id } },
      update: {},
      create: { blockerId: user.id, blockedId: target.id },
    });
    // Blocking implies not following, in both directions — leaving a follow in
    // place would keep pushing them into a feed the user just opted out of.
    await prisma.follow.deleteMany({
      where: {
        OR: [
          { followerId: user.id, followeeId: target.id },
          { followerId: target.id, followeeId: user.id },
        ],
      },
    });
  } else {
    await prisma.block.deleteMany({ where: { blockerId: user.id, blockedId: target.id } });
  }

  return NextResponse.json({ blocked: parsed.data.block });
}
