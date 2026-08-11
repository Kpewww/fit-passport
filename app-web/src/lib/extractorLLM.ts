// LLM-assisted product extraction — OPTIONAL upgrade path on top of extractor.ts.
//
// Design:
//   • Off by default. If `ANTHROPIC_API_KEY` is not set, this file falls back to
//     the deterministic URL-derived extractor and nothing about the app changes.
//   • When enabled, we (1) fetch the product page server-side with a polite UA,
//     (2) ask Claude for a strictly-JSON extraction against a Zod schema,
//     (3) validate + merge — if the schema doesn't match, we fall back rather
//     than surface half-parsed junk.
//   • temperature=0 for reproducibility.
//   • Never sends the user's body measurements to the LLM. Only page text.
//   • Timeout + max body size cap on the fetch. Anything that goes wrong just
//     falls back to the deterministic extractor.
//
// The public interface `extractSmart(url)` is a drop-in async replacement for
// `extractFromUrl(url)`.

import { z } from "zod";
import { extractFromUrl, type ExtractedProduct } from "./extractor";

const LLM_MODEL = "claude-haiku-4-5-20251001"; // cheapest capable model
const LLM_ENDPOINT = "https://api.anthropic.com/v1/messages";
const PAGE_FETCH_TIMEOUT_MS = 8000;
const MAX_PAGE_BYTES = 600_000; // ~600KB cap after stripping tags
const UA =
  "Mozilla/5.0 (compatible; FitPassportBot/1.0; +https://github.com/Kpewww/fit-passport)";

// Zod schema the LLM output must conform to. Kept narrow: we only accept fields
// we know how to use downstream. Anything else the model returns is discarded.
const LLMExtractSchema = z.object({
  brand: z.string().min(1),
  productName: z.string().min(1),
  category: z.string().min(1),
  material: z.string().optional().nullable(),
  fitNotes: z.string().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  sizes: z
    .array(
      z.object({
        label: z.string().min(1),
        region: z.string().optional().nullable(),
        chestCm: z.number().positive().optional().nullable(),
        shoulderCm: z.number().positive().optional().nullable(),
        sleeveCm: z.number().positive().optional().nullable(),
        lengthCm: z.number().positive().optional().nullable(),
        bodyChestMinCm: z.number().positive().optional().nullable(),
        bodyChestMaxCm: z.number().positive().optional().nullable(),
      }),
    )
    .min(1),
});

type LLMExtract = z.infer<typeof LLMExtractSchema>;

/** Ask Claude to extract structured product data from the page's rendered text. */
async function callLLM(url: string, pageText: string): Promise<LLMExtract | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;

  const system =
    "You extract apparel product data for a fit-recommendation engine. " +
    "Respond with a SINGLE JSON object matching the given schema and nothing else. " +
    "If a value is not present on the page, use null. Do NOT invent size charts — " +
    "return only sizes actually shown on the page. Do NOT include commentary.";

  const user = [
    `URL: ${url}`,
    "",
    "Extract these fields:",
    "- brand (string)",
    "- productName (string)",
    "- category (string, one of: tshirt, shirt, polo, sweater, hoodie, jacket, pants, jeans, shorts, skirt, shoes, sneakers, boots, socks, hat, belt, scarf, accessory, other)",
    "- material (string or null)",
    "- fitNotes (string or null — the page's own qualitative fit description)",
    "- imageUrl (absolute URL of the main product image, or null)",
    "- sizes: array of {label, region?, chestCm?, shoulderCm?, sleeveCm?, lengthCm?, bodyChestMinCm?, bodyChestMaxCm?}",
    "",
    "PAGE TEXT (may be truncated):",
    pageText,
  ].join("\n");

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), PAGE_FETCH_TIMEOUT_MS);
  try {
    const r = await fetch(LLM_ENDPOINT, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: LLM_MODEL,
        max_tokens: 1200,
        temperature: 0,
        system,
        messages: [{ role: "user", content: user }],
      }),
    });
    if (!r.ok) return null;
    const j = (await r.json()) as { content?: Array<{ type: string; text?: string }> };
    const text = (j.content ?? []).find((c) => c.type === "text")?.text ?? "";
    // Grab the first JSON object in the response.
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    const parsed = LLMExtractSchema.safeParse(JSON.parse(match[0]));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

/** Server-side fetch the product page, strip to visible text, cap size. */
async function fetchPageText(url: string): Promise<string | null> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), PAGE_FETCH_TIMEOUT_MS);
  try {
    const r = await fetch(url, {
      signal: controller.signal,
      headers: { "user-agent": UA, accept: "text/html,application/xhtml+xml" },
    });
    if (!r.ok) return null;
    let html = await r.text();
    if (html.length > MAX_PAGE_BYTES * 3) html = html.slice(0, MAX_PAGE_BYTES * 3);
    // Strip <script> / <style> blocks, then all tags.
    const stripped = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return stripped.slice(0, MAX_PAGE_BYTES);
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

/**
 * Drop-in async replacement for `extractFromUrl`. Uses the LLM when a key is
 * present AND the page fetch succeeds AND the response validates; otherwise
 * falls back to the deterministic extractor.
 */
export async function extractSmart(url: string): Promise<ExtractedProduct> {
  const deterministic = extractFromUrl(url);

  // Cheap short-circuits: no key, or a curated fixture already matched.
  if (!process.env.ANTHROPIC_API_KEY) return deterministic;
  if (!deterministic.source.derived) return deterministic; // fixture hit → trust it

  const pageText = await fetchPageText(url);
  if (!pageText || pageText.length < 400) return deterministic;

  const llm = await callLLM(url, pageText);
  if (!llm) return deterministic;

  // Merge: LLM data replaces derived fields; provenance stays truthful.
  return {
    retailer: deterministic.retailer,
    brand: llm.brand || deterministic.brand,
    productName: llm.productName || deterministic.productName,
    category: llm.category || deterministic.category,
    material: llm.material ?? deterministic.material,
    fitNotes: llm.fitNotes ?? deterministic.fitNotes,
    modelInfo: deterministic.modelInfo,
    sizes: llm.sizes.length > 0
      ? llm.sizes.map((s) => ({
          label: s.label,
          region: s.region ?? undefined,
          chestCm: s.chestCm ?? undefined,
          shoulderCm: s.shoulderCm ?? undefined,
          sleeveCm: s.sleeveCm ?? undefined,
          lengthCm: s.lengthCm ?? undefined,
          bodyChestMinCm: s.bodyChestMinCm ?? undefined,
          bodyChestMaxCm: s.bodyChestMaxCm ?? undefined,
        }))
      : deterministic.sizes,
    source: { ...deterministic.source, derived: false }, // LLM-verified
  };
}
