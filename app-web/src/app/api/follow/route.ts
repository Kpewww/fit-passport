// Follows — the primitive behind the personal feed.
//
//   GET  /api/follow          → { claimed, following: [accountCode…], followingCount, followerCount }
//   POST /api/follow          → { accountCode, follow: boolean } → toggle
//
// Rules (see docs/design/community-ecosystem.md):
//   • Both sides must be CLAIMED. A follow needs a durable identity, and an
//     anonymous session is free to mint — allowing it would let anyone inflate
//     follower counts, which are supposed to be earned like every other signal.
//   • Deactivated accounts can't be followed (they're invisible to all external
//     access, per the privacy invariant).
//   • No self-follows.
//   • This endpoint exposes NOTHING about a body. Following is social metadata
//     only; measurements never enter it.

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { normalizeAccountCode } from "@/lib/auth";
import { clientKey, rateLimit, tooMany } from "@/lib/rateLimit";

const ToggleSchema = z.object({
  accountCode: z.string().min(4).max(64),
  follow: z.boolean(),
});

/** Follow summary for the current session — drives every Follow button's state. */
export async function GET() {
  const user = await getCurrentUser();

  if (!user.claimed) {
    return NextResponse.json({
      claimed: false,
      accountCode: null,
      following: [],
      followingCount: 0,
      followerCount: 0,
    });
  }

  const [following, followerCount] = await Promise.all([
    prisma.follow.findMany({
      where: { followerId: user.id },
      select: { followee: { select: { accountCode: true, deactivated: true } } },
    }),
    prisma.follow.count({ where: { followeeId: user.id } }),
  ]);

  // Drop deactivated followees so the UI never shows a follow on a hidden account.
  const codes = following
    .filter((f) => !f.followee.deactivated && f.followee.accountCode)
    .map((f) => f.followee.accountCode as string);

  return NextResponse.json({
    claimed: true,
    // So a profile page can tell "this is me" and hide its own follow button.
    accountCode: user.accountCode,
    following: codes,
    followingCount: codes.length,
    followerCount,
  });
}

export async function POST(req: Request) {
  // Cheap abuse guard: follow-spam is the classic growth-hack vector.
  const rl = rateLimit(clientKey(req, "follow"), 60, 60_000);
  if (!rl.ok) return tooMany(rl.retryAfterSec);

  const user = await getCurrentUser();
  if (!user.claimed) {
    return NextResponse.json(
      { error: "claim-required", message: "Claim an account to follow people." },
      { status: 403 },
    );
  }

  const parsed = ToggleSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  const code = normalizeAccountCode(parsed.data.accountCode);
  const target = await prisma.user.findUnique({
    where: { accountCode: code },
    select: { id: true, claimed: true, deactivated: true },
  });
  if (!target || !target.claimed || target.deactivated) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  if (target.id === user.id) {
    return NextResponse.json({ error: "cannot follow yourself" }, { status: 400 });
  }

  if (parsed.data.follow) {
    // Idempotent: re-following is a no-op rather than a duplicate row or an error.
    await prisma.follow.upsert({
      where: { followerId_followeeId: { followerId: user.id, followeeId: target.id } },
      update: {},
      create: { followerId: user.id, followeeId: target.id },
    });
  } else {
    await prisma.follow.deleteMany({ where: { followerId: user.id, followeeId: target.id } });
  }

  const followerCount = await prisma.follow.count({ where: { followeeId: target.id } });
  return NextResponse.json({ following: parsed.data.follow, followerCount });
}
