// Collection helpers — default folders + auto-filing by garment type.
//
// A user's closet is organized into renamable Collections (folders). New items
// are auto-filed into a default collection based on their garment type, so the
// closet is never a flat undifferentiated list. Users can rename/reorder/delete
// collections and move items freely afterward.

import { prisma } from "./db";
import { engineCategoryOf, garmentType, type GarmentParent } from "./garmentTaxonomy";

// Garment type (KnownGoodItem.category) → default collection name.
const TYPE_TO_COLLECTION: Record<string, string> = {
  // Tops
  tshirt: "T-Shirts",
  top: "T-Shirts",
  polo: "T-Shirts",
  shirt: "Shirts",
  sweater: "Sweaters",
  hoodie: "Sweaters",
  jacket: "Jackets",
  // Bottoms
  pants: "Bottoms",
  jeans: "Bottoms",
  shorts: "Bottoms",
  skirt: "Bottoms",
  // Footwear
  shoes: "Footwear",
  sneakers: "Footwear",
  boots: "Footwear",
  socks: "Footwear",
  // Accessories
  hat: "Accessories",
  belt: "Accessories",
  scarf: "Accessories",
  accessory: "Accessories",
  other: "Other",
};

// Since Session 98: a finer type goes where its home parent's pieces go. A top
// keeps the folder of the key it is sized as (a long-sleeve tee among T-Shirts);
// the folders below the line are made the first time something is filed there.
const PARENT_TO_COLLECTION: Record<GarmentParent, string> = {
  tops: "T-Shirts",
  knitwear: "Sweaters",
  outerwear: "Jackets",
  onepiece: "Dresses",
  skirts: "Bottoms",
  bottoms: "Bottoms",
  sets: "Sets",
  intimates: "Intimates",
  swimwear: "Swimwear",
  footwear: "Footwear",
  accessories: "Accessories",
};

// The default collections we seed, in display order.
export const DEFAULT_COLLECTIONS = [
  "T-Shirts",
  "Shirts",
  "Sweaters",
  "Jackets",
  "Bottoms",
  "Footwear",
  "Accessories",
  "Other",
];

export function defaultCollectionNameFor(type: string): string {
  const key = type.toLowerCase();
  const t = garmentType(key);
  if (!t) return TYPE_TO_COLLECTION[key] ?? "Other";
  const home = t.parents[0];
  if (home === "tops") return TYPE_TO_COLLECTION[key] ?? TYPE_TO_COLLECTION[engineCategoryOf(key)] ?? "T-Shirts";
  if (home === "accessories" && key === "other") return "Other";
  return PARENT_TO_COLLECTION[home];
}

/** Ensure the user has the default set of collections; returns them all. */
export async function ensureDefaultCollections(userId: string) {
  const existing = await prisma.collection.findMany({ where: { userId } });
  if (existing.length > 0) return existing;
  await prisma.collection.createMany({
    data: DEFAULT_COLLECTIONS.map((name, i) => ({ userId, name, sortIndex: i })),
  });
  return prisma.collection.findMany({
    where: { userId },
    orderBy: { sortIndex: "asc" },
  });
}

/**
 * Find (or create) the collection an item of `garmentType` should be filed into.
 * Matches an existing collection by the default name first (so a renamed folder
 * isn't duplicated only when its name still matches); otherwise creates it.
 */
export async function collectionForGarment(
  userId: string,
  garmentType: string,
): Promise<string> {
  const target = defaultCollectionNameFor(garmentType);
  const found = await prisma.collection.findFirst({
    where: { userId, name: target },
  });
  if (found) return found.id;
  const count = await prisma.collection.count({ where: { userId } });
  const created = await prisma.collection.create({
    data: { userId, name: target, sortIndex: count },
  });
  return created.id;
}
