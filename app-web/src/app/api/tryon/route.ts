// POST /api/tryon  { garments:[{category,color?}], bodyDescriptor?, occasion? }
// Returns { configured, image? }. When no image-gen API is set up, `configured`
// is false and the client keeps showing the stylized mannequin. Never receives
// or forwards precise measurements — only a coarse body descriptor.

import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/session";
import { generateTryonImage, tryonConfigured } from "@/lib/tryonImage";

const Body = z.object({
  garments: z.array(z.object({
    category: z.string().min(1).max(40),
    color: z.string().max(40).optional().nullable(),
  })).min(1).max(12),
  bodyDescriptor: z.string().max(60).optional().nullable(),
  occasion: z.string().max(40).optional().nullable(),
});

export async function POST(req: Request) {
  await getCurrentUser(); // ensure a session (rate-limit hook point later)
  if (!tryonConfigured()) {
    return NextResponse.json({ configured: false });
  }
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const image = await generateTryonImage(parsed.data);
  return NextResponse.json({ configured: true, image });
}
