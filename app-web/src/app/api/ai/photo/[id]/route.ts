// GET /api/ai/photo/<id> — a person's own try-on body photo, to them only (Session 104).

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { readSession } from "@/lib/session";
import { resolveAccount } from "@/lib/accountMerge";
import { pictureResponse } from "@/lib/aiMedia/http";
import { storedToDataUrl } from "@/lib/aiMedia/images";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await readSession();
  if (!session) return new NextResponse(null, { status: 404 });
  const p = await prisma.aiPhoto.findFirst({ where: { id, userId: await resolveAccount(session.userId) }, select: { photo: true } });
  const dataUrl = await storedToDataUrl(p?.photo);
  if (!dataUrl) return new NextResponse(null, { status: 404 });
  const type = dataUrl.slice(5, dataUrl.indexOf(";"));
  return pictureResponse({ bytes: new Uint8Array(Buffer.from(dataUrl.slice(dataUrl.indexOf(",") + 1), "base64")).buffer as ArrayBuffer, type });
}
