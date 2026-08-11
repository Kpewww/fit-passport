// POST /api/outfits/like  { outfitId, like: boolean }
// Anonymous-friendly likes: keyed by the session's user id (voterKey), deduped
// via the unique (outfitId, voterKey) constraint. Any visitor with a session —
// claimed or not — can like once per outfit. Toggling `like:false` removes it.

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

const Body = z.object({
  outfitId: z.string().min(1),
  like: z.boolean(),
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { outfitId, like } = parsed.data;

  const outfit = await prisma.outfit.findUnique({ where: { id: outfitId }, select: { id: true } });
  if (!outfit) return NextResponse.json({ error: "not found" }, { status: 404 });

  if (like) {
    // Idempotent create — unique(outfitId, voterKey) prevents doubles.
    await prisma.outfitLike
      .create({
        data: {
          outfitId,
          voterKey: user.id,
          userId: user.claimed ? user.id : null,
        },
      })
      .catch(() => {}); // already liked → ignore
  } else {
    await prisma.outfitLike.deleteMany({ where: { outfitId, voterKey: user.id } });
  }

  const likeCount = await prisma.outfitLike.count({ where: { outfitId } });
  return NextResponse.json({ ok: true, likeCount, likedByMe: like });
}
