// POST /api/demo
// Seeds the current account with a realistic profile + closet for demos
// (e.g. a live showcase). Only for an empty closet (409 otherwise), and the profile's
// demo numbers fill blanks only (Session 100e).

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { DEFAULT_COLLECTIONS } from "@/lib/collections";

const DEMO_ITEMS = [
  { brand: "Uniqlo", category: "tshirt", gender: "mens", size: "M", fitRating: 5, color: "navy", notes: "perfect through chest" },
  { brand: "COS", category: "shirt", gender: "mens", size: "EU 48", fitRating: 4, color: "white", notes: "sleeves slightly long" },
  { brand: "Levi's", category: "jacket", gender: "unisex", size: "M", fitRating: 4, color: "denim", notes: "boxy vintage cut" },
  { brand: "Uniqlo", category: "sweater", gender: "mens", size: "L", fitRating: 5, color: "olive", notes: "" },
  { brand: "Everlane", category: "tshirt", gender: "womens", size: "M", fitRating: 4, color: "black", notes: "" },
];

export async function POST() {
  const user = await getCurrentUser();

  // Never over a person's own closet (Session 100e, P2 of the pilot walk): the demo is
  // for an empty account, and it used to wipe whatever was there.
  if (await prisma.knownGoodItem.count({ where: { userId: user.id } })) {
    return NextResponse.json({ error: "closet-not-empty" }, { status: 409 });
  }
  await prisma.collection.deleteMany({ where: { userId: user.id } });

  // Profile: a slim chest-95 shopper — only where the person left a measurement
  // blank. Their own numbers are never overwritten.
  const mine = await prisma.fitProfile.findUnique({ where: { userId: user.id } });
  await prisma.fitProfile.upsert({
    where: { userId: user.id },
    create: { userId: user.id, chestCm: 95, waistCm: 80, shoulderCm: 44, preferredFit: "regular", region: "US" },
    update: {
      chestCm: mine?.chestCm ?? 95,
      waistCm: mine?.waistCm ?? 80,
      shoulderCm: mine?.shoulderCm ?? 44,
    },
  });

  // Default collections.
  await prisma.collection.createMany({
    data: DEFAULT_COLLECTIONS.map((name, i) => ({ userId: user.id, name, sortIndex: i })),
  });
  const collections = await prisma.collection.findMany({ where: { userId: user.id } });
  const byName = new Map(collections.map((c) => [c.name, c.id]));
  const collFor = (cat: string) =>
    byName.get(
      cat === "tshirt" || cat === "polo" ? "T-Shirts"
        : cat === "shirt" ? "Shirts"
        : cat === "sweater" || cat === "hoodie" ? "Sweaters"
        : cat === "jacket" ? "Jackets"
        : "Other",
    ) ?? null;

  let sort = 0;
  for (const it of DEMO_ITEMS) {
    await prisma.knownGoodItem.create({
      data: {
        userId: user.id,
        brand: it.brand,
        category: it.category,
        gender: it.gender,
        size: it.size,
        fitRating: it.fitRating,
        color: it.color,
        collectionId: collFor(it.category),
        sortIndex: sort++,
        areaNotesJson: it.notes ? JSON.stringify({ notes: it.notes }) : null,
      },
    });
  }

  return NextResponse.json({ ok: true, items: DEMO_ITEMS.length });
}
