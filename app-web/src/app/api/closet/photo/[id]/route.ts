// GET /api/closet/photo/<item id> — a closet photo kept in object storage (Session 100,
// lib/photoStore.ts), to its owner only (invariant 92). The storage address never
// reaches the browser; this checks the item is the viewer's and passes the bytes on.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { readSession } from "@/lib/session";
import { readPhoto } from "@/lib/photoStore";
import { resolveAccount } from "@/lib/accountMerge";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = readSession();
  if (!session) return new NextResponse(null, { status: 404 });
  const item = await prisma.knownGoodItem.findFirst({ where: { id: params.id, userId: await resolveAccount(session.userId) }, select: { imageDataUrl: true } });
  const photo = item ? await readPhoto(item.imageDataUrl) : null;
  if (!photo) return new NextResponse(null, { status: 404 });
  // Private: the browser may keep it (the address changes with the photo), no shared cache may.
  return new NextResponse(photo.bytes, { headers: { "content-type": photo.type, "cache-control": "private, max-age=31536000, immutable" } });
}
