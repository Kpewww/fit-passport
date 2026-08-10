// A curated list of well-known apparel brands used ONLY for autocomplete
// suggestions. This is intentionally not exhaustive and NOT a whitelist — the
// closet form always accepts free text, so a user can add any brand (a local
// label, a vintage find, a brand we've never heard of). Suggestions just save
// typing and reduce spelling drift ("Hermes" vs "hermès" vs "Hermés").

export const KNOWN_BRANDS: string[] = [
  // Mass / high-street
  "Uniqlo", "Zara", "H&M", "COS", "Gap", "Old Navy", "Mango", "Muji",
  "Massimo Dutti", "Everlane", "J.Crew", "Banana Republic", "Abercrombie & Fitch",
  "American Eagle", "Topman", "ASOS", "Pull&Bear", "Bershka",
  // Sport / outdoor
  "Nike", "Adidas", "Lululemon", "Under Armour", "The North Face", "Patagonia",
  "Arc'teryx", "Columbia", "Puma", "New Balance", "On", "Salomon",
  // Denim / Americana
  "Levi's", "Wrangler", "Lee", "Carhartt", "Dickies",
  // Contemporary / premium
  "Ralph Lauren", "Polo Ralph Lauren", "Tommy Hilfiger", "Calvin Klein",
  "Lacoste", "Ted Baker", "Reiss", "Theory", "AllSaints", "Acne Studios",
  "A.P.C.", "Sandro", "Maje",
  // Luxury
  "Hermès", "Gucci", "Prada", "Louis Vuitton", "Burberry", "Saint Laurent",
  "Balenciaga", "Bottega Veneta", "Loewe", "Dior", "Chanel", "Valentino",
  "Moncler", "Brunello Cucinelli", "Loro Piana", "Zegna", "Versace", "Fendi",
  // Japanese / other
  "Comme des Garçons", "Issey Miyake", "Kapital", "Beams", "Snow Peak",
];

/**
 * Rank brand suggestions for a query. Prefix matches first, then substring
 * matches, capped. Case- and accent-insensitive so "her" → "Hermès".
 */
export function suggestBrands(query: string, limit = 6): string[] {
  const q = normalize(query);
  if (!q) return [];
  const prefix: string[] = [];
  const contains: string[] = [];
  for (const b of KNOWN_BRANDS) {
    const nb = normalize(b);
    if (nb.startsWith(q)) prefix.push(b);
    else if (nb.includes(q)) contains.push(b);
  }
  return [...prefix, ...contains].slice(0, limit);
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip combining accent marks
    .trim();
}
