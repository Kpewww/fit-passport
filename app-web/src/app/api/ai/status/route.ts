// GET /api/ai/status — which AI photo features are on, what the person agreed to,
// and how many jobs they have left today (Session 104).

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { aiEnabled, userDailyLimit } from "@/lib/aiMedia/config";
import { CONSENT_VERSION } from "@/lib/aiMedia/consent";
import { jobsToday } from "@/lib/aiMedia/budget";

export async function GET() {
  const user = await getCurrentUser();
  const consents = await prisma.aiConsent.findMany({ where: { userId: user.id }, select: { kind: true, version: true } });
  const agreed = (k: string) => consents.some((c) => c.kind === k && c.version === CONSENT_VERSION);
  return NextResponse.json({
    claimed: user.claimed,
    cutout: { enabled: aiEnabled("cutout"), consent: agreed("cutout") },
    tryon: { enabled: aiEnabled("tryon"), consent: agreed("tryon") },
    leftToday: Math.max(0, userDailyLimit() - (await jobsToday(user.id))),
  });
}
