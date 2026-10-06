// Size systems — the single source of truth for what a valid size LOOKS like,
// per garment category. Consumed by the closet SizeInput (UI presets + inline
// validation) and by the /api/closet Zod schema (server-side guard), so junk
// like "<" can never be stored.
//
// Today every category is a "top" (alpha ladder + EU numeric). This file is
// deliberately structured as category → domain → system so that pants (waist ×
// inseam), shoes (US/EU/cm numeric), socks (shoe-linked), and accessories (often
// one-size / cm) can slot in later WITHOUT touching the closet UI or the engine.
// See the roadmap note in DEVLOG.

// "onepiece" (dresses, jumpsuits, swimsuits) and "intimate" (bras, underwear) are
// recognised so a page is told the truth about them (Session 84); whether the
// engine can score them is SCOREABLE_DOMAINS's question, below.
export type SizeDomain = "top" | "bottom" | "onepiece" | "intimate" | "shoe" | "sock" | "accessory";

// Map each garment category (the engine's `category` field) to a size domain.
// Unknown categories fall back to "top" (alpha) so nothing breaks.
const CATEGORY_DOMAIN: Record<string, SizeDomain> = {
  tshirt: "top",
  top: "top",
  dress: "onepiece",
  jumpsuit: "onepiece",
  swimsuit: "onepiece",
  underwear: "intimate",
  shirt: "top",
  sweater: "top",
  jacket: "top",
  hoodie: "top",
  polo: "top",
  other: "top",
  // --- forward-compatible (not yet surfaced in the closet category list) ---
  pants: "bottom",
  jeans: "bottom",
  shorts: "bottom",
  skirt: "bottom",
  shoes: "shoe",
  sneakers: "shoe",
  boots: "shoe",
  socks: "sock",
  hat: "accessory",
  belt: "accessory",
  scarf: "accessory",
  accessory: "accessory",
};

export function domainForCategory(category: string): SizeDomain {
  return CATEGORY_DOMAIN[category.toLowerCase()] ?? "top";
}

/**
 * The domains the fit engine can honestly score, and the ONLY place that list
 * lives.
 *
 * The engine works by comparing a body measurement to a garment measurement.
 * `FitProfile` holds chest, waist, hip, shoulder, sleeve and inseam — which
 * covers tops and bottoms. It holds nothing for a foot, a head or a neck, so a
 * shoe, a sock and a hat have no measurement to be scored against.
 *
 * Adding a domain here is therefore not a UI decision: it requires a real body
 * field to compare with, or the engine will fabricate an answer. `/api/check`
 * refuses anything outside this list — see the guard there for what that looked
 * like in production before it existed.
 */
// "onepiece" since Session 84: dresses, jumpsuits and swimsuits are scored on
// chest, waist and hip — all three are FitProfile fields.
export const SCOREABLE_DOMAINS: readonly SizeDomain[] = ["top", "bottom", "onepiece"];

const DOMAIN_LABEL: Record<SizeDomain, string> = {
  top: "tops",
  bottom: "bottoms",
  onepiece: "dresses and jumpsuits",
  intimate: "underwear",
  shoe: "footwear",
  sock: "socks",
  accessory: "accessories",
};

/** Plain-English plural for a domain, for user-facing copy. */
export function domainLabel(domain: SizeDomain): string {
  return DOMAIN_LABEL[domain];
}

export const ALPHA_SIZES = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL"] as const;

// Preset chips offered in the picker, per domain. These are the "click once"
// common sizes; free text still covers regional variants (EU 48, UK 10, 30×32…).
const DOMAIN_PRESETS: Record<SizeDomain, string[]> = {
  top: [...ALPHA_SIZES],
  bottom: ["28", "30", "32", "34", "36", "38", ...ALPHA_SIZES],
  onepiece: [...ALPHA_SIZES, "0", "2", "4", "6", "8", "10", "12", "14"],
  intimate: ["XS", "S", "M", "L", "XL"],
  shoe: ["6", "7", "8", "9", "10", "11", "12", "13"],
  sock: ["S", "M", "L", "XL", "One size"],
  accessory: ["XS", "S", "M", "L", "XL", "One size"],
};

export function presetSizesFor(category: string): string[] {
  return DOMAIN_PRESETS[domainForCategory(category)];
}

// A short human label for the size unit, shown as a hint next to the field.
const DOMAIN_HINT: Record<SizeDomain, string> = {
  top: "alpha or EU (e.g. M, EU 48)",
  bottom: "waist or W×L (e.g. 32, 32×32)",
  onepiece: "alpha or US numeric (e.g. M, 6)",
  intimate: "S–XL",
  shoe: "US / EU / cm (e.g. 9, EU 42)",
  sock: "S–XL or shoe size",
  accessory: "S–XL or One size",
};

export function sizeHintFor(category: string): string {
  return DOMAIN_HINT[domainForCategory(category)];
}

// Validation patterns per domain. A size is valid if it matches ANY pattern for
// its domain. Kept permissive (regional systems vary) but strict enough to
// reject junk like "<", "?", empty, or stray punctuation.
const DOMAIN_PATTERNS: Record<SizeDomain, RegExp[]> = {
  top: [
    /^(XXS|XS|S|M|L|XL|XXL|XXXL)$/i,
    /^(XS|S|M|L|XL)\/(XS|S|M|L|XL)$/i, // "M/L"
    /^EU ?\d{2}$/i,
    /^UK ?\d{1,2}$/i,
    /^US ?(XXS|XS|S|M|L|XL|XXL|XXXL|\d{1,2})$/i,
    /^\d{2}$/, // bare EU numeric like "48"
    /^(FR|IT|DE) ?\d{2}$/i, // a women's size by country (womensSizes.ts), Session 88
  ],
  bottom: [
    /^(XXS|XS|S|M|L|XL|XXL|XXXL)$/i,
    /^\d{2}$/, // waist "32"
    /^\d{2} ?[x×] ?\d{2}$/i, // "32x32"
    /^W ?\d{2} ?L ?\d{2}$/i, // "W32 L32"
    /^EU ?\d{2}$/i,
  ],
  onepiece: [
    /^(XXS|XS|S|M|L|XL|XXL|XXXL)$/i,
    /^\d{1,2}$/, // US 0–16, EU 32–48
    /^(EU|UK|US) ?\d{1,2}$/i,
    /^(FR|IT|DE) ?\d{2}$/i,
  ],
  intimate: [
    /^(XXS|XS|S|M|L|XL|XXL|XXXL)$/i,
    /^\d{2} ?[A-H]{1,2}$/i, // band + cup, kept so a stored value is not junk
  ],
  shoe: [
    /^\d{1,2}(\.5)?$/, // US/EU numeric, half sizes
    /^EU ?\d{2}$/i,
    /^UK ?\d{1,2}(\.5)?$/i,
    /^US ?\d{1,2}(\.5)?$/i,
    /^\d{2}(\.5)? ?cm$/i,
  ],
  sock: [
    /^(XS|S|M|L|XL)$/i,
    /^\d{1,2}(\.5)?$/, // shoe-linked
    /^ONE ?SIZE$/i,
  ],
  accessory: [
    /^(XXS|XS|S|M|L|XL|XXL)$/i,
    /^ONE ?SIZE$/i,
    /^\d{2}(cm)?$/i, // belt/hat cm
  ],
};

/** True if `raw` is a plausible size for the given category's domain. */
export function isValidSize(category: string, raw: string): boolean {
  const s = raw.trim();
  if (!s || s.length > 12) return false;
  const domain = domainForCategory(category);
  return DOMAIN_PATTERNS[domain].some((re) => re.test(s));
}
