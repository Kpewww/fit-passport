// GET  /api/admin/photos → whether the photo store is on, and how many photos are
//                          still in the database
// POST /api/admin/photos → move a batch of them to the store (Session 100g)
// Admin only, run on the server: the database address and the store's token stay in
// Vercel. Old photos keep working where they are until moved.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { canEdit } from "@/lib/session";
import { currentAdmin, notAdmin } from "@/lib/admin";
import { BLOB_REF, movePhotosBatch, photoStoreOn } from "@/lib/photoStore";

export async function GET() {
  if (!(await currentAdmin())) return notAdmin();
  const [inDatabase, inStore] = await Promise.all([
    prisma.knownGoodItem.count({ where: { imageDataUrl: { startsWith: "data:" } } }),
    prisma.knownGoodItem.count({ where: { imageDataUrl: { startsWith: BLOB_REF } } }),
  ]);
  return NextResponse.json({ storeOn: photoStoreOn(), inDatabase, inStore });
}

export async function POST() {
  if (!(await currentAdmin()) || !(await canEdit())) return notAdmin();
  if (!photoStoreOn()) return NextResponse.json({ error: "store-off" }, { status: 409 });
  return NextResponse.json(await movePhotosBatch(25));
}
