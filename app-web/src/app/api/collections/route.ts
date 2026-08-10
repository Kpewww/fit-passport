// Collections API — user-owned closet folders.
//   GET               list collections (seeds defaults on first call)
//   POST   {name}     create a collection
//   PATCH  {id,name?,sortIndex?}   rename / reorder
//   DELETE ?id=       delete a collection (items fall back to Uncategorized)

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { ensureDefaultCollections } from "@/lib/collections";

export async function GET() {
  const user = await getCurrentUser();
  const collections = await ensureDefaultCollections(user.id);
  // Return with item counts for the UI.
  const withCounts = await Promise.all(
    collections
      .sort((a, b) => a.sortIndex - b.sortIndex)
      .map(async (c) => ({
        ...c,
        itemCount: await prisma.knownGoodItem.count({
          where: { userId: user.id, collectionId: c.id },
        }),
      })),
  );
  return NextResponse.json({ collections: withCounts });
}

const CreateSchema = z.object({ name: z.string().min(1).max(40) });

export async function POST(req: Request) {
  const user = await getCurrentUser();
  const parsed = CreateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const count = await prisma.collection.count({ where: { userId: user.id } });
  const collection = await prisma.collection.create({
    data: { userId: user.id, name: parsed.data.name, sortIndex: count },
  });
  return NextResponse.json({ collection });
}

const UpdateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(40).optional(),
  sortIndex: z.coerce.number().int().min(0).optional(),
});

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  const parsed = UpdateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { id, ...data } = parsed.data;
  const result = await prisma.collection.updateMany({
    where: { id, userId: user.id },
    data,
  });
  if (result.count === 0) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  // Items in this collection fall back to Uncategorized (onDelete: SetNull),
  // but we set it explicitly so it works regardless of DB cascade support.
  await prisma.knownGoodItem.updateMany({
    where: { collectionId: id, userId: user.id },
    data: { collectionId: null },
  });
  await prisma.collection.deleteMany({ where: { id, userId: user.id } });
  return NextResponse.json({ ok: true });
}
