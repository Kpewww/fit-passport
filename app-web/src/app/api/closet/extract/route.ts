// POST /api/closet/extract  { url }
// Reads a product URL and returns best-guess fields to PRE-FILL the closet add
// form (brand, category, suggested name, size options, image if the LLM found
// one). The user reviews/edits before saving — nothing is stored here. Reuses
// the same extractor the /check flow uses (deterministic fallback + optional LLM).

import { NextResponse } from "next/server";
import { z } from "zod";
import { normalizeUrl } from "@/lib/normalizeUrl";
import { getCurrentUser } from "@/lib/session";
import { extractSmart } from "@/lib/extractorLLM";
import { domainForCategory } from "@/lib/sizeSystems";

const Body = z.object({
  url: z.string().min(3).transform((v, ctx) => {
    const u = normalizeUrl(v);
    if (!u) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "that doesn't look like a product link" });
      return z.NEVER;
    }
    return u;
  }),
});

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
    gender: ex.gender ?? null,
    // The FULL chart row per size, not just the label. The extractor already had
    // these numbers and this endpoint used to drop them on the floor — keeping
    // them is what lets a closet item record what the garment itself measures,
    // and so what `ease = garment − body` needs. See docs/design/3d-body-and-tryon.md §8.
    sizes: ex.sizes.map((s) => s.label),
    sizeRows: ex.sizes.map((s) => ({
      label: s.label,
      chestCm: s.chestCm ?? null,
      shoulderCm: s.shoulderCm ?? null,
      sleeveCm: s.sleeveCm ?? null,
      lengthCm: (s as { lengthCm?: number | null }).lengthCm ?? null,
    })),
    // "page" when read off the retailer's own chart, "estimated" when the
    // fallback ladder produced them. Stored alongside, because an unlabelled
    // number is indistinguishable from a measured one.
    measuredFrom: ex.source?.sizesFrom ?? null,
    // Any image the LLM extractor surfaced (may be null). It's a remote URL from
    // the product page; we only prefill it as a suggestion the user can keep.
    imageUrl: (ex as { imageUrl?: string }).imageUrl ?? null,
    source: ex.source,
  });
}
