// Garment taxonomy — the single source of truth for what garment TYPES exist,
// how they group into sections (for the picker), their emoji glyph, and which
// size domain they use (from sizeSystems). Everything that lists categories —
// the closet add/edit form, the refresh cards, default collections — reads from
// here so adding a new garment type is a one-line change.
//
// `category` values are the engine's KnownGoodItem.category. They must stay
// stable (the engine matches on them); the `label` is what the user sees.

import type { SizeDomain } from "./sizeSystems";
import { domainForCategory } from "./sizeSystems";

export type GarmentSection = "Tops" | "Bottoms" | "Footwear" | "Accessories";

export type Garment = {
  category: string; // engine key (stable)
  label: string; // shown to the user
  section: GarmentSection;
  glyph: string; // emoji for thumbnails / picker
  domain: SizeDomain; // derived from sizeSystems (kept here for convenience)
};

// Order within each section is the display order in the picker.
export const GARMENTS: Garment[] = [
  // Tops
  { category: "tshirt", label: "T-shirt", section: "Tops", glyph: "👕", domain: "top" },
  { category: "shirt", label: "Shirt", section: "Tops", glyph: "👔", domain: "top" },
  { category: "polo", label: "Polo", section: "Tops", glyph: "👕", domain: "top" },
  { category: "sweater", label: "Sweater", section: "Tops", glyph: "🧶", domain: "top" },
  { category: "hoodie", label: "Hoodie", section: "Tops", glyph: "🧥", domain: "top" },
  { category: "jacket", label: "Jacket / Coat", section: "Tops", glyph: "🧥", domain: "top" },
  // Bottoms
  { category: "pants", label: "Pants", section: "Bottoms", glyph: "👖", domain: "bottom" },
  { category: "jeans", label: "Jeans", section: "Bottoms", glyph: "👖", domain: "bottom" },
  { category: "shorts", label: "Shorts", section: "Bottoms", glyph: "🩳", domain: "bottom" },
  { category: "skirt", label: "Skirt", section: "Bottoms", glyph: "👗", domain: "bottom" },
  // Footwear
  { category: "shoes", label: "Shoes", section: "Footwear", glyph: "👞", domain: "shoe" },
  { category: "sneakers", label: "Sneakers", section: "Footwear", glyph: "👟", domain: "shoe" },
  { category: "boots", label: "Boots", section: "Footwear", glyph: "🥾", domain: "shoe" },
  { category: "socks", label: "Socks", section: "Footwear", glyph: "🧦", domain: "sock" },
  // Accessories
  { category: "hat", label: "Hat", section: "Accessories", glyph: "🧢", domain: "accessory" },
  { category: "belt", label: "Belt", section: "Accessories", glyph: "🎗️", domain: "accessory" },
  { category: "scarf", label: "Scarf", section: "Accessories", glyph: "🧣", domain: "accessory" },
  { category: "accessory", label: "Other accessory", section: "Accessories", glyph: "👜", domain: "accessory" },
  // Catch-all
  { category: "other", label: "Other", section: "Accessories", glyph: "👚", domain: "top" },
];

export const SECTION_ORDER: GarmentSection[] = ["Tops", "Bottoms", "Footwear", "Accessories"];

const BY_CATEGORY: Record<string, Garment> = Object.fromEntries(
  GARMENTS.map((g) => [g.category, g]),
);

export function garmentFor(category: string): Garment | undefined {
  return BY_CATEGORY[category.toLowerCase()];
}

export function garmentLabel(category: string): string {
  return garmentFor(category)?.label ?? category;
}

export function garmentGlyph(category: string): string {
  return garmentFor(category)?.glyph ?? "👕";
}

/** Sections → their garments, in display order. For the picker UI. */
export function garmentSections(): Array<{ section: GarmentSection; items: Garment[] }> {
  return SECTION_ORDER.map((section) => ({
    section,
    items: GARMENTS.filter((g) => g.section === section),
  }));
}

/** All category keys (engine values). */
export function allCategories(): string[] {
  return GARMENTS.map((g) => g.category);
}

// Re-export for callers that only import from here.
export { domainForCategory };
