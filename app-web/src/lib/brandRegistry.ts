// The brand registry (Session 101): a brand's name to its Wikidata item and country.
// Built by scripts/brands/build-registry.mjs; every row is checkable by its QID
// (evidence grade C, sizeRegimes.ts). Server only: the file is ~450 kB.

import registry from "./data/brandRegistry.json";

export type RegistryBrand = { q: string; name: string; country: string; zh?: string; aka?: string[]; w: number };

const key = (s: string) =>
  s.toLowerCase().normalize("NFKC")
    .replace(/[’'`]/g, "")
    .replace(/\b(co|company|inc|ltd|limited|corp|corporation|group|gmbh|s\.?p\.?a|s\.?a|ag|plc|llc|holdings?)\b\.?/g, "")
    // The same for company words in Chinese, Japanese and Korean ("李宁公司" is 李宁).
    .replace(/(股份有限公司|有限公司|公司|集团|集團|株式会社|주식회사|\(株\))/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

let index: Map<string, RegistryBrand> | null = null;
function build() {
  index = new Map();
  // Rows come sorted best-known first, so a shared name keeps the better-known brand.
  for (const b of (registry as { brands: RegistryBrand[] }).brands) {
    for (const n of [b.name, b.zh, ...(b.aka ?? [])]) {
      if (!n) continue;
      const k = key(n);
      if (k.length >= 2 && !index.has(k)) index.set(k, b);
    }
  }
  return index;
}

export function lookupBrand(name: string | null | undefined): RegistryBrand | null {
  if (!name) return null;
  const k = key(name);
  if (!k) return null;
  return (index ?? build()).get(k) ?? null;
}

export const registrySize = () => (registry as { count: number }).count;

/**
 * Brands whose name, Chinese name or alias starts with the query (then contains it),
 * best-known first. `label` is the name the query matched, so typing "MUJI" offers
 * MUJI, not "Ryohin Keikaku".
 */
export function searchBrands(query: string, limit = 8): Array<{ label: string; name: string; country: string }> {
  const q = key(query);
  if (q.length < 1) return [];
  const idx = index ?? build();
  const starts: Array<[string, RegistryBrand]> = [];
  const contains: Array<[string, RegistryBrand]> = [];
  for (const [k, b] of idx) {
    if (k.startsWith(q)) starts.push([k, b]);
    else if (q.length >= 3 && k.includes(q)) contains.push([k, b]);
  }
  const seen = new Set<string>();
  const out: Array<{ label: string; name: string; country: string }> = [];
  for (const [k, b] of [...starts.sort((x, y) => y[1].w - x[1].w), ...contains.sort((x, y) => y[1].w - x[1].w)]) {
    if (seen.has(b.q)) continue;
    seen.add(b.q);
    const label = [b.name, b.zh, ...(b.aka ?? [])].find((n) => n && key(n) === k) ?? b.name;
    out.push({ label, name: b.name, country: b.country });
    if (out.length >= limit) break;
  }
  return out;
}
