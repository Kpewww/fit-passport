// The garment colour palette — one copy.
//
// This lived in four files (the closet page, /refresh, /u/[code] and
// OutfitMannequin), in two different shapes: an ordered array of {name, hex}
// for the closet's swatch grid, and a name→hex map everywhere a stored colour
// has to be turned back into a dot. All four agreed when they were merged, but
// nothing made them agree — a colour added to the picker would simply have
// rendered as no dot on the three pages that never heard about it.
//
// Colours are stored on the item as the NAME the user picked ("navy"), or as a
// raw hex if they used the wheel or typed one. Both forms have to resolve, so
// every lookup here accepts either.

export type ColorPreset = { name: string; hex: string };

/**
 * Two rows of ten in the picker: neutrals and core first, then accents.
 * The order is the swatch-grid order, so it is part of the design, not
 * incidental.
 */
export const COLOR_PRESETS: ColorPreset[] = [
  // row 1 — neutrals & core
  { name: "black", hex: "#1a1a1a" },
  { name: "white", hex: "#f5f5f5" },
  { name: "grey", hex: "#9ca3af" },
  { name: "charcoal", hex: "#374151" },
  { name: "navy", hex: "#1f2a44" },
  { name: "blue", hex: "#3b82f6" },
  { name: "denim", hex: "#4a6fa5" },
  { name: "beige", hex: "#d8c3a5" },
  { name: "cream", hex: "#f0e9d6" },
  { name: "brown", hex: "#6b4f3a" },
  // row 2 — accents / trend
  { name: "olive", hex: "#6b7443" },
  { name: "green", hex: "#4b7a53" },
  { name: "sage", hex: "#9caf88" },
  { name: "teal", hex: "#2f8f83" },
  { name: "burgundy", hex: "#6d2036" },
  { name: "red", hex: "#b03a3a" },
  { name: "rust", hex: "#b5622f" },
  { name: "mustard", hex: "#d0a028" },
  { name: "pink", hex: "#dba0b0" },
  { name: "purple", hex: "#7c5aa8" },
];

const HEX = /^#[0-9a-f]{3,8}$/i;

/**
 * Resolve a stored colour to a hex, or null if it is neither a preset name nor
 * a hex. Free text the user typed ("that greenish one") legitimately lands
 * here, and a null means "draw no swatch" rather than "draw a grey one".
 */
export function colorHex(color: string | null | undefined): string | null {
  if (!color) return null;
  if (HEX.test(color)) return color;
  return COLOR_PRESETS.find((c) => c.name === color.toLowerCase())?.hex ?? null;
}

/** Same, for the places that must paint something regardless (the mannequin). */
export function colorHexOr(color: string | null | undefined, fallback: string): string {
  return colorHex(color) ?? fallback;
}

/**
 * Whether a line icon drawn on this colour should be light or dark, by WCAG
 * relative luminance. A garment swatch can be anything from white to black, and
 * an ink icon on a black jacket's swatch simply disappears. The 0.4 threshold is
 * the rounded crossover where white and near-black text have equal contrast.
 */
export function iconToneOn(hex: string | null | undefined): "light" | "dark" {
  if (!hex || !HEX.test(hex)) return "dark";
  let h = hex.slice(1);
  if (h.length === 3 || h.length === 4) h = h.slice(0, 3).split("").map((c) => c + c).join("");
  const channel = (i: number) => {
    const v = parseInt(h.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  const luminance = 0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4);
  return luminance < 0.4 ? "light" : "dark";
}
