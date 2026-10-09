// Finding a garment type by any of its names — Session 98. Search for the picker
// (loaded when someone first types) and the closet's narrowing of a captured
// piece's type. The types are garmentTaxonomy.ts; their words, garmentAliases.ts.

import { GARMENT_TYPES, engineCategoryOf, type GarmentType } from "./garmentTaxonomy";
import { GARMENT_ALIASES } from "./garmentAliases";


/** Lower case, no spaces, hyphens, slashes or brackets: "T-Shirt" and "t shirt" meet. */
export function normaliseTerm(s: string): string {
  return s.toLowerCase().normalize("NFKC").replace(/[\s\-_/()（）·・,，.、'’]+/g, "");
}

/**
 * Types matching a query, best first. A term equal to the query ranks first, then
 * one starting with it, then one containing it; last, a longer phrase that
 * contains a whole term ("女士针织开衫" contains "针织开衫"), the longest term
 * winning. `names` adds the shown names (both languages) to each type's terms.
 */
export function searchGarmentTypes(query: string, names?: (key: string) => string[]): GarmentType[] {
  const q = normaliseTerm(query);
  if (!q) return [];
  // A plural is the same word: "Skirts" is "skirt", before it is the start of "skirt suit".
  const singular = [q.replace(/ies$/, "y"), q.replace(/es$/, ""), q.replace(/s$/, "")].filter((x) => x !== q && x.length >= 2);
  const scored: Array<{ g: GarmentType; score: number }> = [];
  for (const g of GARMENT_TYPES) {
    const terms = [g.key, g.label, ...(GARMENT_ALIASES[g.key] ?? []), ...(names?.(g.key) ?? [])].map(normaliseTerm).filter((t) => t.length >= 2 || /[^\x00-\x7f]/.test(t));
    let best = 0;
    for (const t of terms) {
      if (!t) continue;
      if (t === q) best = Math.max(best, 1000);
      else if (singular.includes(t)) best = Math.max(best, 950);
      else if (t.startsWith(q)) best = Math.max(best, 800 - t.length);
      else if (t.includes(q)) best = Math.max(best, 600 - t.length);
      else if (q.includes(t)) best = Math.max(best, 200 + t.length * 10);
    }
    if (best > 0) scored.push({ g, score: best });
  }
  return scored.sort((a, b) => b.score - a.score).map((s) => s.g);
}

/**
 * A closet piece's type, made more specific from its name: a "sweater" called
 * "Ribbed Cardigan" is a cardigan. Only a type the engine sizes the same way is
 * chosen, so this never changes a recommendation, only what the closet shows.
 */
export function refineType(category: string, name: string | null | undefined): string {
  if (!name) return category;
  const engine = engineCategoryOf(category);
  const cjkName = normaliseTerm(name);
  const latinName = ` ${name.toLowerCase().replace(/[^a-z0-9]+/g, " ")} `;
  let best: { key: string; len: number } | null = null;
  for (const g of GARMENT_TYPES) {
    if (g.engine !== engine || g.key === category || g.key === engine) continue;
    for (const a of [g.label, ...(GARMENT_ALIASES[g.key] ?? [])]) {
      // Chinese has no spaces, so a term is found inside the name; a Latin term
      // must be whole words ("vest" is not in "Harvest").
      const cjk = /[^\x00-\x7f]/.test(a);
      const t = cjk ? normaliseTerm(a) : ` ${a.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()} `;
      if (t.trim().length < (cjk ? 2 : 3)) continue;
      if ((cjk ? cjkName : latinName).includes(t) && (!best || t.length > best.len)) best = { key: g.key, len: t.length };
    }
  }
  return best?.key ?? category;
}
