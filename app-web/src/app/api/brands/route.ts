// GET /api/brands?q=…    brands for the closet's brand box, from the registry
// GET /api/brands?name=… the country and size regime a brand's labels are read by
// (Session 101). Public facts from Wikidata; nothing about the asker is read or kept.

import { NextResponse } from "next/server";
import { lookupBrand, searchBrands } from "@/lib/brandRegistry";
import { regimeForCountry } from "@/lib/sizeRegimes";

export async function GET(req: Request) {
  const u = new URL(req.url);
  const name = u.searchParams.get("name");
  if (name != null) {
    const b = lookupBrand(name.slice(0, 80));
    return NextResponse.json(b ? { name: b.name, country: b.country, regime: regimeForCountry(b.country), q: b.q } : { name: null });
  }
  const q = (u.searchParams.get("q") ?? "").slice(0, 60);
  return NextResponse.json(
    { brands: searchBrands(q).map((b) => ({ ...b, regime: regimeForCountry(b.country) })) },
    { headers: { "cache-control": "public, max-age=3600" } },
  );
}
