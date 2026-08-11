// POST /api/profile/prefs
//   { pinnedBadges?: string[], listedInCommunity?: boolean }
// Updates the prestige/display preferences: which earned badges are pinned to
// the passport (max 3, must actually be earned) and whether the closet is listed
// in the public community directory. Write-guarded like other edits.

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser, canEdit } from "@/lib/session";
import { computeBadgeStats } from "@/lib/badgeStats";
import { earnedBadgeIds } from "@/lib/badges";

const Body = z.object({
  pinnedBadges: z.array(z.string()).max(3).optional(),
  listedInCommunity: z.boolean().optional(),
  showBodyType: z.boolean().optional(),
  bodyType: z.string().max(20).nullable().optional(),
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!canEdit()) {
    return NextResponse.json({ error: "read-only — password required to edit" }, { status: 403 });
  }
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data: {
    pinnedBadges?: string;
    listedInCommunity?: boolean;
    showBodyType?: boolean;
    bodyType?: string | null;
  } = {};

  if (parsed.data.listedInCommunity !== undefined) {
    data.listedInCommunity = parsed.data.listedInCommunity;
  }
  if (parsed.data.showBodyType !== undefined) {
    data.showBodyType = parsed.data.showBodyType;
  }
  if (parsed.data.bodyType !== undefined) {
    data.bodyType = parsed.data.bodyType || null;
  }

  if (parsed.data.pinnedBadges !== undefined) {
    // Only allow pinning badges the user has ACTUALLY earned.
    const listed = parsed.data.listedInCommunity ?? user.listedInCommunity;
    const stats = await computeBadgeStats(user.id, listed);
    const earned = new Set(earnedBadgeIds(stats));
    const valid = parsed.data.pinnedBadges.filter((id) => earned.has(id)).slice(0, 3);
    data.pinnedBadges = valid.join(",");
  }

  await prisma.user.update({ where: { id: user.id }, data });
  return NextResponse.json({ ok: true, ...data });
}
