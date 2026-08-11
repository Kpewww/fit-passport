// POST /api/closet/extract  { url }
// Reads a product URL and returns best-guess fields to PRE-FILL the closet add
// form (brand, category, suggested name, size options, image if the LLM found
// one). The user reviews/edits before saving — nothing is stored here. Reuses
// the same extractor the /check flow uses (deterministic fallback + optional LLM).

import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/session";
import { extractSmart } from "@/lib/extractorLLM";
import { domainForCategory } from "@/lib/sizeSystems";

const Body = z.object({ url: z.string().url() });

export async function POST(req: Request) {
  await getCurrentUser();
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid url" }, { status: 400 });
  }
  const ex = await extractSmart(parsed.data.url);
  // Map the extractor category to one our garment taxonomy knows; default tshirt.
  const category = ex.category && domainForCategory(ex.category) ? ex.category : "tshirt";
  return NextResponse.json({
    brand: ex.brand,
    suggestedName: ex.productName,
    category,
    sizes: ex.sizes.map((s) => s.label),
    // Any image the LLM extractor surfaced (may be null). It's a remote URL from
    // the product page; we only prefill it as a suggestion the user can keep.
    imageUrl: (ex as { imageUrl?: string }).imageUrl ?? null,
    source: ex.source,
  });
}
