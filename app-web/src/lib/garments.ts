// Garment taxonomy — what garment TYPES exist, how they group into parents (for
// the picker; the list itself is garmentTaxonomy.ts), and which size domain they use
// (from sizeSystems). Their icons live in components/GarmentIcon.tsx — never emoji. Everything that lists categories —
// the closet add/edit form, the refresh cards, default collections — reads from
// here so adding a new garment type is a one-line change.
//
// `category` values are stored in KnownGoodItem.category and must stay stable.
// The engine reads them through garmentTaxonomy.engineCategoryOf, so a finer type
// is sized as the key it maps to. People see the i18n names, not `label`.

import type { SizeDomain } from "./sizeSystems";
import { domainForCategory } from "./sizeSystems";
import { GARMENT_TYPES, PARENT_ORDER, typesUnder, type GarmentParent } from "./garmentTaxonomy";

export type Garment = {
  category: string; // the stored key (stable)
  label: string; // English name, for the server; pages use i18n/garment
  parent: GarmentParent; // its home parent (garmentTaxonomy.ts)
  domain: SizeDomain; // derived from sizeSystems (kept here for convenience)
};

// Since Session 98 every type comes from garmentTaxonomy.ts: the 23 keys from
// before, and the finer types that the engine sizes as one of them.
export const GARMENTS: Garment[] = GARMENT_TYPES.map((t) => ({
  category: t.key,
  label: t.label,
  parent: t.parents[0],
  domain: domainForCategory(t.key),
}));

/** What the shopper may choose when no one could name the garment (Session 84d):
 *  the categories the engine can score. Order is the popup's. */
export const PICKABLE_CATEGORIES = [
  "top", "tshirt", "shirt", "sweater", "hoodie", "jacket",
  "pants", "jeans", "shorts", "skirt", "dress", "jumpsuit",
] as const;

const BY_CATEGORY: Record<string, Garment> = Object.fromEntries(
  GARMENTS.map((g) => [g.category, g]),
);

export function garmentFor(category: string): Garment | undefined {
  return BY_CATEGORY[category.toLowerCase()];
}

export function garmentLabel(category: string): string {
  return garmentFor(category)?.label ?? category;
}

/** Parents → their types (a type may appear under several), in display order. */
export function garmentParents(): Array<{ parent: GarmentParent; items: Garment[] }> {
  return PARENT_ORDER.map((parent) => ({
    parent,
    items: typesUnder(parent).map((t) => BY_CATEGORY[t.key]),
  }));
}

/** All category keys (engine values). */
export function allCategories(): string[] {
  return GARMENTS.map((g) => g.category);
}

// Re-export for callers that only import from here.
export { domainForCategory };
