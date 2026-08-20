// Sizing utilities — pure functions, no DB, easy to unit-test.
//
// These are the ONLY place we normalize regional size labels. Every consumer
// of size strings goes through here so the fit engine stays domain-agnostic.

export type Category =
  | "tshirt"
  | "shirt"
  | "sweater"
  | "jacket"
  | "hoodie"
  | "polo"
  | "other";

export type FitPreference = "slim" | "regular" | "relaxed" | "oversized";

// Approximate US alpha sizing ladder for men's tops. Used as a common anchor
// when translating between EU numeric and US alpha.
// This is intentionally coarse for the MVP — the engine is explainable, not
// pretending to be a full retail sizing database.
export const ALPHA_LADDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL"] as const;
export type AlphaSize = (typeof ALPHA_LADDER)[number];

/** Approximate mapping from EU numeric men's jacket sizing to US alpha. */
const EU_TO_ALPHA: Record<number, AlphaSize> = {
  42: "XS",
  44: "S",
  46: "S",
  48: "M",
  50: "M",
  52: "L",
  54: "L",
  56: "XL",
  58: "XL",
  60: "XXL",
};

/** Parse a size label into a normalized alpha slot (best-effort). */
export function normalizeToAlpha(raw: string | null | undefined): AlphaSize | null {
  if (!raw) return null;
  const s = raw.trim().toUpperCase();

  // Pure alpha match
  if ((ALPHA_LADDER as readonly string[]).includes(s)) return s as AlphaSize;

  // "EU 48", "EU48", "48"
  const eu = s.match(/^(?:EU\s*)?(\d{2})$/);
  if (eu) {
    const n = Number(eu[1]);
    if (EU_TO_ALPHA[n]) return EU_TO_ALPHA[n];
  }

  // "US M", "US 10" — strip the region prefix and retry
  const us = s.match(/^US\s*(.+)$/);
  if (us) return normalizeToAlpha(us[1]);

  // "M/L" ambiguous → take first
  const slash = s.split("/")[0];
  if (slash !== s) return normalizeToAlpha(slash);

  return null;
}

/** Index of a size in the alpha ladder (for adjacency scoring). */
export function alphaIndex(a: AlphaSize | null): number | null {
  if (!a) return null;
  const i = (ALPHA_LADDER as readonly string[]).indexOf(a);
  return i === -1 ? null : i;
}

/** Distance in ladder slots between two normalized alpha sizes. */
export function alphaDistance(a: AlphaSize | null, b: AlphaSize | null): number | null {
  const ia = alphaIndex(a);
  const ib = alphaIndex(b);
  if (ia === null || ib === null) return null;
  return Math.abs(ia - ib);
}

/** Directional shift: positive = need to go UP the ladder from a to b. */
export function alphaShift(a: AlphaSize | null, b: AlphaSize | null): number | null {
  const ia = alphaIndex(a);
  const ib = alphaIndex(b);
  if (ia === null || ib === null) return null;
  return ib - ia;
}

/** Preferred amount of ease (extra room) in cm around the chest by pref. */
export function easeChestCm(pref: FitPreference): number {
  switch (pref) {
    case "slim":
      return 6;
    case "regular":
      return 10;
    case "relaxed":
      return 16;
    case "oversized":
      return 22;
  }
}

/**
 * Garment-type adjustment (cm) added to the preference ease. The same "regular"
 * fit implies more room in a coat you layer under than in a base-layer tee, so
 * the target garment chest shifts by category. Additive on top of easeChestCm.
 *
 * Calibrated so mid-weight tops (tshirt / shirt / polo / sweater) stay at 0 — the
 * value the engine and its tests were tuned against — and only outerwear and
 * base layers diverge. Unknown categories default to 0 (a plain top).
 */
export function easeAdjustForCategory(category?: string | null): number {
  if (!category) return 0;
  switch (category.toLowerCase()) {
    // Outerwear: worn over other layers, so more room is "regular".
    case "coat":
      return 8;
    case "jacket":
    case "parka":
      return 6;
    case "hoodie":
    case "sweatshirt":
      return 4;
    case "blazer":
      return 3;
    // Base / close layers: less room is "regular".
    case "tank":
    case "tanktop":
    case "base-layer":
      return -3;
    // Mid-weight tops — the tuned baseline.
    default:
      return 0;
  }
}

/**
 * How many ladder steps to shift a known-good "true fit" anchor by, given the
 * user's preferred fit. `regular` is the neutral baseline (the anchor size),
 * `slim` sizes down one, `relaxed`/`oversized` size up. This lets the anchor
 * set the baseline while the fit preference still moves the recommendation —
 * so a Hermes L anchor + oversized preference can land on XL, not stay stuck at L.
 */
export function preferenceShift(pref: FitPreference): number {
  switch (pref) {
    case "slim":
      return -1;
    case "regular":
      return 0;
    case "relaxed":
      return 1;
    case "oversized":
      return 2;
  }
}
