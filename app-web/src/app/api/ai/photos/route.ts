// The person's own full-body photos for try-on (Session 104).
//   GET    /api/ai/photos           → [{ id, url, createdAt }]
//   POST   /api/ai/photos { dataUrl } (needs the try-on consent first)
//   DELETE /api/ai/photos?id=…

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { dropPhotos, storePhoto } from "@/lib/photoStore";
import { clientKey, rateLimit, tooMany } from "@/lib/rateLimit";
import { hasConsent } from "@/lib/aiMedia/consent";
import { aiUser, refusal } from "@/lib/aiMedia/http";

const MAX_PHOTOS = 3;
const url = (id: string) => `/api/ai/photo/${id}`;

export async function GET() {
  const user = await aiUser();
  if (user instanceof NextResponse) return user;
  const photos = await prisma.aiPhoto.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, select: { id: true, createdAt: true } });
  return NextResponse.json({ photos: photos.map((p) => ({ ...p, url: url(p.id) })) });
}

const Body = z.object({ dataUrl: z.string().max(4_000_000).regex(/^data:image\/(png|jpeg|webp);base64,/, "must be an image") });

export async function POST(req: Request) {
  const rl = await rateLimit(clientKey(req, "ai-photo"), 20, 10 * 60_000);
  if (!rl.ok) return tooMany(rl.retryAfterSec, req);
  const user = await aiUser();
  if (user instanceof NextResponse) return user;
  if (!(await hasConsent(user.id, "tryon"))) return refusal("consent");
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  // Keep the newest few: older body photos are deleted, not hoarded.
  const old = await prisma.aiPhoto.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, skip: MAX_PHOTOS - 1, select: { id: true, photo: true } });
  if (old.length) {
    await prisma.aiPhoto.deleteMany({ where: { id: { in: old.map((o) => o.id) } } });
    await dropPhotos(old.map((o) => o.photo));
  }
  const photo = await prisma.aiPhoto.create({ data: { userId: user.id, photo: await storePhoto(user.id, parsed.data.dataUrl) }, select: { id: true, createdAt: true } });
  return NextResponse.json({ photo: { ...photo, url: url(photo.id) } });
}

export async function DELETE(req: Request) {
  const user = await aiUser();
  if (user instanceof NextResponse) return user;
  const id = new URL(req.url).searchParams.get("id") ?? "";
  const p = await prisma.aiPhoto.findFirst({ where: { id, userId: user.id }, select: { photo: true } });
  if (!p) return refusal("not-found");
  await prisma.aiPhoto.delete({ where: { id } });
  await dropPhotos([p.photo]);
  return NextResponse.json({ ok: true });
}
