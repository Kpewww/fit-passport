// Garment taxonomy — the single source of truth for what garment TYPES exist,
// how they group into sections (for the picker), and which size domain they use
// (from sizeSystems). Their icons live in components/GarmentIcon.tsx — never emoji. Everything that lists categories —
// the closet add/edit form, the refresh cards, default collections — reads from
// here so adding a new garment type is a one-line change.
//
// `category` values are the engine's KnownGoodItem.category. They must stay
// stable (the engine matches on them); the `label` is what the user sees.

import type { SizeDomain } from "./sizeSystems";
import { domainForCategory } from "./sizeSystems";

export type GarmentSection = "Tops" | "Bottoms" | "One-piece" | "Footwear" | "Accessories";

export type Garment = {
  category: string; // engine key (stable)
  label: string; // shown to the user
  section: GarmentSection;
  domain: SizeDomain; // derived from sizeSystems (kept here for convenience)
};

// Order within each section is the display order in the picker.
export const GARMENTS: Garment[] = [
  // Tops
  { category: "tshirt", label: "T-shirt", section: "Tops", domain: "top" },
  { category: "top", label: "Top", section: "Tops", domain: "top" },
  { category: "shirt", label: "Shirt", section: "Tops", domain: "top" },
  { category: "polo", label: "Polo", section: "Tops", domain: "top" },
  { category: "sweater", label: "Sweater", section: "Tops", domain: "top" },
  { category: "hoodie", label: "Hoodie", section: "Tops", domain: "top" },
  { category: "jacket", label: "Jacket / Coat", section: "Tops", domain: "top" },
  // Bottoms
  { category: "pants", label: "Pants", section: "Bottoms", domain: "bottom" },
  { category: "jeans", label: "Jeans", section: "Bottoms", domain: "bottom" },
  { category: "shorts", label: "Shorts", section: "Bottoms", domain: "bottom" },
  { category: "skirt", label: "Skirt", section: "Bottoms", domain: "bottom" },
  // One-piece (Session 84): scored on chest, waist and hip.
  { category: "dress", label: "Dress", section: "One-piece", domain: "onepiece" },
  { category: "jumpsuit", label: "Jumpsuit", section: "One-piece", domain: "onepiece" },
  { category: "swimsuit", label: "Swimsuit", section: "One-piece", domain: "onepiece" },
  // Footwear
  { category: "shoes", label: "Shoes", section: "Footwear", domain: "shoe" },
  { category: "sneakers", label: "Sneakers", section: "Footwear", domain: "shoe" },
  { category: "boots", label: "Boots", section: "Footwear", domain: "shoe" },
  { category: "socks", label: "Socks", section: "Footwear", domain: "sock" },
  // Accessories
  { category: "hat", label: "Hat", section: "Accessories", domain: "accessory" },
  { category: "belt", label: "Belt", section: "Accessories", domain: "accessory" },
  { category: "scarf", label: "Scarf", section: "Accessories", domain: "accessory" },
  { category: "accessory", label: "Other accessory", section: "Accessories", domain: "accessory" },
  // Catch-all
  { category: "other", label: "Other", section: "Accessories", domain: "top" },
];

export const SECTION_ORDER: GarmentSection[] = ["Tops", "Bottoms", "One-piece", "Footwear", "Accessories"];

const BY_CATEGORY: Record<string, Garment> = Object.fromEntries(
  GARMENTS.map((g) => [g.category, g]),
);

export function garmentFor(category: string): Garment | undefined {
  return BY_CATEGORY[category.toLowerCase()];
}

export function garmentLabel(category: string): string {
  return garmentFor(category)?.label ?? category;
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
