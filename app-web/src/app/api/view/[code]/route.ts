// GET /api/view/[code]
// PUBLIC read-by-code endpoint. Anyone with a valid account code can read the
// owner's CLOSET and their COARSE body type. It NEVER returns precise body
// measurements (chest/waist/height/weight) — those live in FitProfile and are
// deliberately excluded here. See docs/design/identity-and-sharing.md §A.
//
// No session required; this is the shareable public view.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normalizeAccountCode } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: { code: string } },
) {
  const code = normalizeAccountCode(decodeURIComponent(params.code));
  const user = await prisma.user.findUnique({
    where: { accountCode: code },
    select: {
      claimed: true,
      username: true,
      accountCode: true,
      bodyType: true,
      exportPolicy: true,
      // Only COARSE profile fields are exposed. Precise measurements
      // (chest/waist/height/…) are intentionally NOT selected and must never
      // leave the server through this public endpoint.
      fitProfile: {
        select: { sex: true, shopsFor: true },
      },
      knownGood: {
        orderBy: [{ sortIndex: "asc" }, { createdAt: "desc" }],
        select: {
          id: true,
          brand: true,
          category: true,
          size: true,
          region: true,
          fitRating: true,
          areaNotesJson: true,
          color: true,
          collectionId: true,
          // productUrl intentionally omitted from public view for now.
        },
      },
      collections: {
        orderBy: { sortIndex: "asc" },
        select: { id: true, name: true, sortIndex: true },
      },
    },
  });

  if (!user || !user.claimed) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json({
    username: user.username,
    accountCode: user.accountCode,
    bodyType: user.bodyType, // coarse only, may be null
    sex: user.fitProfile?.sex ?? null,
    shopsFor: user.fitProfile?.shopsFor ?? null,
    canExport: user.exportPolicy === "anyone",
    collections: user.collections,
    closet: user.knownGood,
  });
}
