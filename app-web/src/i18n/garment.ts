"use client";

// Names of garment types, sections, the closet's default folders and product
// lines, in the reader's language. The stored values stay the stable English
// keys the engine and the closet's auto-filing match on; only what is SHOWN
// changes. A value we have no name for (a folder the user renamed, a category
// from an older row) is shown exactly as stored.

import { useMemo } from "react";
import { useT } from "./client";
import { GARMENTS } from "@/lib/garments";

const CATEGORIES = new Set(GARMENTS.map((g) => g.category));
const SECTIONS = new Set(["Tops", "Bottoms", "Footwear", "Accessories"]);
// lib/collections.ts DEFAULT_COLLECTIONS, plus the closet's own bucket name. Not
// imported: that module reaches the database.
const FOLDERS = new Set(["T-Shirts", "Shirts", "Sweaters", "Jackets", "Bottoms", "Footwear", "Accessories", "Other", "Uncategorized"]);
const LINES = new Set(["mens", "womens", "unisex"]);
// Item colour presets (lib/colors.ts) and folder colours (closet page).
const COLORS = new Set([
  "black", "white", "grey", "charcoal", "navy", "blue", "denim", "beige", "cream", "brown", "olive", "green",
  "sage", "teal", "burgundy", "red", "rust", "mustard", "pink", "purple",
  "amber", "sky", "emerald", "rose", "violet", "orange", "slate",
]);

type Cat = keyof typeof import("./messages/en").en.garment.cat;
type Section = keyof typeof import("./messages/en").en.garment.section;
type Folder = keyof typeof import("./messages/en").en.garment.folder;
type Line = "mens" | "womens" | "unisex";
type Color = keyof typeof import("./messages/en").en.garment.color;

export function useGarmentText() {
  const t = useT("garment");
  return useMemo(
    () => ({
      label: (category: string) => (CATEGORIES.has(category) ? t(`cat.${category as Cat}`) : category),
      section: (s: string) => (SECTIONS.has(s) ? t(`section.${s as Section}`) : s),
      folder: (name: string) => (FOLDERS.has(name) ? t(`folder.${name as Folder}`) : name),
      line: (g: string | null | undefined) => (g && LINES.has(g) ? t(`line.${g as Line}`) : t("line.none")),
      lineShort: (g: string) => (LINES.has(g) ? t(`lineShort.${g as Line}`) : g),
      // A preset colour's name; a colour the user typed (or a hex) as typed.
      color: (c: string | null | undefined) => (c && COLORS.has(c.toLowerCase()) ? t(`color.${c.toLowerCase() as Color}`) : c ?? ""),
    }),
    [t],
  );
}
