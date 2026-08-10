import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { collectionForGarment } from "@/lib/collections";

const ItemSchema = z.object({
  brand: z.string().min(1).max(80),
  category: z.string().min(1).max(40),
  size: z.string().min(1).max(20),
  region: z.string().max(10).optional().nullable(),
  fitRating: z.coerce.number().int().min(1).max(5).default(4),
  areaNotesJson: z.string().max(2000).optional().nullable(),
  productUrl: z.string().url().optional().nullable(),
  color: z.string().max(40).optional().nullable(),
  collectionId: z.string().optional().nullable(),
  groupId: z.string().optional().nullable(),
  groupName: z.string().max(80).optional().nullable(),
});

export async function GET() {
  const user = await getCurrentUser();
  const items = await prisma.knownGoodItem.findMany({
    where: { userId: user.id },
    orderBy: [{ sortIndex: "asc" }, { createdAt: "desc" }],
  });
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  const parsed = ItemSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  // Auto-file into a default collection by garment type unless one was given.
  const collectionId =
    data.collectionId ?? (await collectionForGarment(user.id, data.category));

  // Place new item at the end of its collection.
  const maxSort = await prisma.knownGoodItem.aggregate({
    where: { userId: user.id, collectionId },
    _max: { sortIndex: true },
  });

  const item = await prisma.knownGoodItem.create({
    data: {
      userId: user.id,
      ...data,
      collectionId,
      sortIndex: (maxSort._max.sortIndex ?? -1) + 1,
    },
  });
  return NextResponse.json({ item });
}

// PATCH accepts partial updates (edit fields, move collection, recolor, reorder,
// group/ungroup). All fields optional except id.
const UpdateSchema = z.object({
  id: z.string().min(1),
  brand: z.string().min(1).max(80).optional(),
  category: z.string().min(1).max(40).optional(),
  size: z.string().min(1).max(20).optional(),
  region: z.string().max(10).optional().nullable(),
  fitRating: z.coerce.number().int().min(1).max(5).optional(),
  areaNotesJson: z.string().max(2000).optional().nullable(),
  productUrl: z.string().url().optional().nullable(),
  color: z.string().max(40).optional().nullable(),
  collectionId: z.string().optional().nullable(),
  sortIndex: z.coerce.number().int().min(0).optional(),
  groupId: z.string().optional().nullable(),
  groupName: z.string().max(80).optional().nullable(),
});

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  const parsed = UpdateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { id, ...data } = parsed.data;
  const result = await prisma.knownGoodItem.updateMany({
    where: { id, userId: user.id },
    data,
  });
  if (result.count === 0) {
    return NextResponse.json({ error: "item not found" }, { status: 404 });
  }
  const item = await prisma.knownGoodItem.findUnique({ where: { id } });
  return NextResponse.json({ item });
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prisma.knownGoodItem.deleteMany({ where: { id, userId: user.id } });
  return NextResponse.json({ ok: true });
}
