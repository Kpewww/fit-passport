// GET /api/view/[code]/export
// Export a closet by account code as JSON — ONLY when the owner's exportPolicy
// is "anyone". Otherwise 403. Same privacy rules as the public view: closet +
// coarse info, never precise measurements. Deactivated accounts are hidden.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normalizeAccountCode } from "@/lib/auth";
import { clientKey, rateLimit, tooMany } from "@/lib/rateLimit";

export async function GET(
  req: Request,
  { params }: { params: { code: string } },
) {
  const rl = await rateLimit(clientKey(req, "export"), 20, 60_000);
  if (!rl.ok) return tooMany(rl.retryAfterSec);

  const code = normalizeAccountCode(decodeURIComponent(params.code));
  const user = await prisma.user.findUnique({
    where: { accountCode: code },
    select: {
      claimed: true,
      deactivated: true,
      username: true,
      accountCode: true,
      exportPolicy: true,
      bodyType: true,
      showBodyType: true,
      fitProfile: { select: { sex: true, shopsFor: true } },
      knownGood: {
        orderBy: [{ sortIndex: "asc" }],
        select: {
          brand: true, displayName: true, category: true, gender: true,
          size: true, region: true, fitRating: true, color: true, onlineAvailable: true,
        },
      },
      collections: { orderBy: { sortIndex: "asc" }, select: { name: true } },
    },
  });

  if (!user || !user.claimed || user.deactivated) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  if (user.exportPolicy !== "anyone") {
    return NextResponse.json({ error: "the owner hasn't enabled export by code" }, { status: 403 });
  }

  const payload = {
    exportedFrom: "Fit Passport",
    username: user.username,
    accountCode: user.accountCode,
    bodyType: user.showBodyType ? user.bodyType : null,
    sex: user.fitProfile?.sex ?? null,
    shopsFor: user.fitProfile?.shopsFor ?? null,
    collections: user.collections.map((c) => c.name),
    closet: user.knownGood,
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "content-type": "application/json",
      "content-disposition": `attachment; filename="fit-passport-${user.username ?? "closet"}.json"`,
    },
  });
}
