// The brand registry (Session 101): a brand's name → its Wikidata item and country.
// Built by scripts/brands/build-registry.mjs; every row is checkable by its QID
// (evidence grade C, sizeRegimes.ts). Server only: the file is ~450 kB.

import registry from "./data/brandRegistry.json";

export type RegistryBrand = { q: string; name: string; country: string; zh?: string; aka?: string[]; w: number };

const key = (s: string) =>
  s.toLowerCase().normalize("NFKC")
    .replace(/[’'`]/g, "")
    .replace(/\b(co|company|inc|ltd|limited|corp|corporation|group|gmbh|s\.?p\.?a|s\.?a|ag|plc|llc|holdings?)\b\.?/g, "")
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
