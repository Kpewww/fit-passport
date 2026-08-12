import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { collectionForGarment } from "@/lib/collections";
import { isValidSize } from "@/lib/sizeSystems";

const ItemSchema = z
  .object({
    brand: z.string().min(1).max(80),
    displayName: z.string().max(80).optional().nullable(),
    category: z.string().min(1).max(40),
    gender: z.enum(["mens", "womens", "unisex"]).optional().nullable(),
    size: z.string().min(1).max(20),
    region: z.string().max(10).optional().nullable(),
    fitRating: z.coerce.number().int().min(1).max(5).default(4),
    areaNotesJson: z.string().max(2000).optional().nullable(),
    productUrl: z.string().url().optional().nullable(),
    imageDataUrl: z.string().max(400_000).regex(/^data:image\/(png|jpeg|webp);base64,/, "must be a small image").optional().nullable(),
    color: z.string().max(40).optional().nullable(),
    collectionId: z.string().optional().nullable(),
    groupId: z.string().optional().nullable(),
    groupName: z.string().max(80).optional().nullable(),
    onlineAvailable: z.boolean().optional(),
  })
  // Guard the size against the category's size system so junk can't be stored.
  .refine((d) => isValidSize(d.category, d.size), {
    message: "Size is not valid for this garment type",
    path: ["size"],
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
const UpdateSchema = z
  .object({
    id: z.string().min(1),
    brand: z.string().min(1).max(80).optional(),
    displayName: z.string().max(80).optional().nullable(),
    category: z.string().min(1).max(40).optional(),
    gender: z.enum(["mens", "womens", "unisex"]).optional().nullable(),
    size: z.string().min(1).max(20).optional(),
    region: z.string().max(10).optional().nullable(),
    fitRating: z.coerce.number().int().min(1).max(5).optional(),
    areaNotesJson: z.string().max(2000).optional().nullable(),
    productUrl: z.string().url().optional().nullable(),
    imageDataUrl: z.string().max(400_000).regex(/^data:image\/(png|jpeg|webp);base64,/, "must be a small image").optional().nullable(),
    color: z.string().max(40).optional().nullable(),
    collectionId: z.string().optional().nullable(),
    sortIndex: z.coerce.number().int().min(0).optional(),
    groupId: z.string().optional().nullable(),
    groupName: z.string().max(80).optional().nullable(),
    onlineAvailable: z.boolean().optional(),
  })
  // Only validate size when it's being changed. Use the incoming category if
  // present, else "other" (which maps to the permissive top/alpha domain).
  .refine((d) => d.size == null || isValidSize(d.category ?? "other", d.size), {
    message: "Size is not valid for this garment type",
    path: ["size"],
  });

// Content fields whose change counts as a "modification" for the edit history.
// Pure reorder (sortIndex) and folder moves (collectionId) are deliberately
// excluded — they aren't edits to the garment itself.
const HISTORY_KEYS = [
  "brand", "displayName", "category", "gender", "size", "region", "fitRating",
  "areaNotesJson", "productUrl", "imageDataUrl", "color", "groupId", "groupName",
  "onlineAvailable",
] as const;

// Rapid successive edits within this window collapse into ONE formal edit — the
// last history entry just advances in time until the user stops for a while.
const EDIT_COALESCE_MS = 30 * 60 * 1000; // 30 minutes

function parseHistory(json: string | null): string[] {
  if (!json) return [];
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  const parsed = UpdateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { id, ...data } = parsed.data;

  const existing = await prisma.knownGoodItem.findFirst({ where: { id, userId: user.id } });
  if (!existing) {
    return NextResponse.json({ error: "item not found" }, { status: 404 });
  }

  // Did any tracked content field actually change? If so, record/coalesce a
  // formal edit timestamp.
  const changed = HISTORY_KEYS.some(
    (k) => data[k] !== undefined && data[k] !== (existing as Record<string, unknown>)[k],
  );
  const patch: Record<string, unknown> = { ...data };
  if (changed) {
    const hist = parseHistory(existing.editHistory);
    const now = new Date();
    const last = hist.length ? new Date(hist[hist.length - 1]) : null;
    if (last && now.getTime() - last.getTime() < EDIT_COALESCE_MS) {
      hist[hist.length - 1] = now.toISOString(); // same session → advance it
    } else {
      hist.push(now.toISOString()); // new formal edit
    }
    patch.editHistory = JSON.stringify(hist.slice(-20)); // keep the last 20
  }

  const item = await prisma.knownGoodItem.update({ where: { id }, data: patch });
  return NextResponse.json({ item });
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prisma.knownGoodItem.deleteMany({ where: { id, userId: user.id } });
  return NextResponse.json({ ok: true });
}
