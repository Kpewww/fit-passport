// POST /api/closet/extract  { url }
// Reads a product URL and returns what may PRE-FILL the closet add flow. The user
// reviews and edits before saving — nothing is stored here. Same extractor as
// /check; what counts as "read" is decided by lib/closetExtract.ts (Session 80),
// so a page we never saw pre-fills nothing and an invented number is never offered.

import { NextResponse } from "next/server";
import { z } from "zod";
import { normalizeUrl } from "@/lib/normalizeUrl";
import { getCurrentUser } from "@/lib/session";
import { extractSmart } from "@/lib/extractorLLM";
import { closetExtract } from "@/lib/closetExtract";
import { clientKey, rateLimit, tooMany } from "@/lib/rateLimit";

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
  const user = await getCurrentUser();
  // A read can spend money (the LLM and vision steps), like /api/check. Working
  // values, not measurements: a person adding a closet pastes a handful of links.
  const rl = await rateLimit(`closet-extract:${user.id}`, 20, 10 * 60_000);
  if (!rl.ok) return tooMany(rl.retryAfterSec, req);
  const ipRl = await rateLimit(clientKey(req, "closet-extract"), 200, 10 * 60_000);
  if (!ipRl.ok) return tooMany(ipRl.retryAfterSec, req);

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid url" }, { status: 400 });
  }
  const ex = await extractSmart(parsed.data.url);
  return NextResponse.json(closetExtract(ex));
}
