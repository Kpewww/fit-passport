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
import { extractFromUrl, type ExtractedProduct, type ExtractedSize } from "./extractor";
import { parsePage, parseSizeLabels, looksBlocked } from "./pageParse";

const LLM_MODEL = "claude-haiku-4-5-20251001"; // cheapest capable model
const LLM_ENDPOINT = "https://api.anthropic.com/v1/messages";
const PAGE_FETCH_TIMEOUT_MS = 8000;
const MAX_PAGE_BYTES = 600_000; // ~600KB cap after stripping tags
const MAX_HTML_BYTES = 2_000_000; // raw HTML cap before any parsing
// A real browser UA. The old self-identifying "FitPassportBot" UA invited 403s;
// we still fetch politely (one request, cached, timed out, size-capped) but many
// retail CDNs simply refuse a non-browser agent outright.
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

// Fetching real pages can be turned OFF entirely (e.g. CI, offline demos) with
// FIT_DISABLE_PAGE_FETCH=1 — then we behave exactly like the old URL-derived path.
const PAGE_FETCH_DISABLED = process.env.FIT_DISABLE_PAGE_FETCH === "1";

// Small in-memory cache of fetched HTML, keyed by URL. Repeated /check on the same
// product (very common — a user re-checks, tweaks their profile, re-checks) then
// costs one fetch, not N: faster for the user and far politer to the retailer.
// Bounded + TTL'd so it can't grow without limit in a long-lived server process.
const HTML_CACHE_TTL_MS = 10 * 60 * 1000;
const HTML_CACHE_MAX = 200;
type CacheEntry = { html: string | null; at: number };
const htmlCache = new Map<string, CacheEntry>();

function cacheGet(url: string): CacheEntry | undefined {
  const e = htmlCache.get(url);
  if (!e) return undefined;
  if (Date.now() - e.at > HTML_CACHE_TTL_MS) {
    htmlCache.delete(url);
    return undefined;
  }
  return e;
}

function cacheSet(url: string, html: string | null): void {
  if (htmlCache.size >= HTML_CACHE_MAX) {
    // Drop the oldest inserted key (Map preserves insertion order).
    const oldest = htmlCache.keys().next().value;
    if (oldest !== undefined) htmlCache.delete(oldest);
  }
  htmlCache.set(url, { html, at: Date.now() });
}

/** Exposed for tests only — clears the module-level HTML cache. */
export function __clearPageCache(): void {
  htmlCache.clear();
}

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
    "You extract apparel product data for a fit-recommendation engine. You ONLY " +
    "extract facts printed on the page; you NEVER recommend a size — a separate " +
    "transparent engine does that. Respond with a SINGLE JSON object matching the " +
    "given schema and nothing else. If a value is not on the page, use null. Do " +
    "NOT invent or complete a size chart — return only rows actually shown. The " +
    "page text has a 'SIZE TABLES' section with rows as 'cell | cell | cell'; the " +
    "real chart is usually there. Convert all measurements to CENTIMETRES (values " +
    "near 30–50 for a chest are inches → ×2.54). If a cell is a body-measurement " +
    "range like '96-100', put its two ends in bodyChestMinCm/bodyChestMaxCm. Do " +
    "NOT include commentary.";

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

/** One fetch attempt. Returns {html} on success, or null on any failure/block. */
async function fetchOnce(url: string): Promise<string | null> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), PAGE_FETCH_TIMEOUT_MS);
  try {
    const r = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        // Browser-like headers — many retail CDNs 403 anything that isn't.
        "user-agent": UA,
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "accept-language": "en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7",
      },
    });
    const ct = r.headers.get("content-type") ?? "";
    if (ct && !ct.includes("html") && !ct.includes("xml")) return null;
    const raw = await r.text();
    const html = raw.length > MAX_HTML_BYTES ? raw.slice(0, MAX_HTML_BYTES) : raw;
    // A bot-block / CAPTCHA page isn't the product — treat it as unreachable so we
    // fall back to an honest estimate rather than parsing a challenge page.
    if (!r.ok || looksBlocked(r.status, html)) return null;
    return html;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

/**
 * Fetch the raw product-page HTML: cached (per URL, TTL'd), one retry on a
 * transient miss, block-aware. null on any failure (caller falls back honestly).
 */
async function fetchPageHtml(url: string): Promise<string | null> {
  const cached = cacheGet(url);
  if (cached) return cached.html;

  let html = await fetchOnce(url);
  // One retry — transient network/CDN hiccups are common; a second try is cheap
  // and we cache the result either way so we never hammer.
  if (html === null) html = await fetchOnce(url);

  cacheSet(url, html);
  return html;
}

/** Turn raw HTML into LLM-friendly text that PRESERVES table structure. A size
 *  chart is almost always a <table>; flattening it to prose destroys it, so we
 *  keep rows as `cell | cell | cell` lines and drop script/style noise. */
function htmlToLlmText(html: string): string {
  const tablesAsText = (html.match(/<table[\s\S]*?<\/table>/gi) ?? [])
    .map((tbl) =>
      (tbl.match(/<tr[\s\S]*?<\/tr>/gi) ?? [])
        .map((tr) =>
          (tr.match(/<t[dh][\s\S]*?<\/t[dh]>/gi) ?? [])
            .map((c) => c.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim())
            .join(" | "),
        )
        .join("\n"),
    )
    .join("\n\n");

  const prose = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<table[\s\S]*?<\/table>/gi, " ") // tables handled above
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Tables first — they hold the sizing gold — then prose, both capped.
  return `SIZE TABLES:\n${tablesAsText}\n\nPAGE TEXT:\n${prose}`.slice(0, MAX_PAGE_BYTES);
}

function mapLlmSizes(sizes: LLMExtract["sizes"]): ExtractedSize[] {
  return sizes.map((s) => ({
    label: s.label,
    region: s.region ?? undefined,
    chestCm: s.chestCm ?? undefined,
    shoulderCm: s.shoulderCm ?? undefined,
    sleeveCm: s.sleeveCm ?? undefined,
    lengthCm: s.lengthCm ?? undefined,
    bodyChestMinCm: s.bodyChestMinCm ?? undefined,
    bodyChestMaxCm: s.bodyChestMaxCm ?? undefined,
  }));
}

/**
 * Drop-in async replacement for `extractFromUrl`.
 *
 * Layered, cheapest-first, and honest about where the SIZE CHART came from:
 *   1. Curated fixture → trust it (`sizesFrom: "fixture"`).
 *   2. Fetch the real page (no key needed) and parse it DETERMINISTICALLY —
 *      JSON-LD/OpenGraph for brand/name/gender, and an on-page <table> for the
 *      actual size chart (`sizesFrom: "page"`). This alone fixes most real pages.
 *   3. If a table wasn't found but an ANTHROPIC_API_KEY is set, ask the LLM to
 *      read the (table-preserving) page text (`sizesFrom: "page"`).
 *   4. Otherwise fall back to the URL-derived estimate (`sizesFrom: "estimated"`).
 */
export async function extractSmart(url: string): Promise<ExtractedProduct> {
  const deterministic = extractFromUrl(url);

  // 1. Fixture hit → hand-verified, don't touch the network.
  if (!deterministic.source.derived) return deterministic;
  if (PAGE_FETCH_DISABLED) return deterministic;

  const html = await fetchPageHtml(url);
  if (!html || html.length < 200) return deterministic; // page unreachable → estimate

  // 2. Deterministic parse — free, no key.
  const parsed = parsePage(html);
  let out: ExtractedProduct = {
    ...deterministic,
    brand: parsed.brand || deterministic.brand,
    productName: parsed.productName || deterministic.productName,
    category: parsed.category || deterministic.category,
    gender: parsed.gender ?? deterministic.gender,
    material: parsed.material ?? deterministic.material,
    fitNotes: parsed.fitNotes ?? deterministic.fitNotes,
    sizes: deterministic.sizes,
    source: { ...deterministic.source },
  };
  if (parsed.sizes && parsed.sizes.length >= 2) {
    out.sizes = parsed.sizes;
    out.source.derived = false;
    out.source.sizesFrom = "page";
    return out; // real chart in hand — no need to spend an LLM call
  }

  // 3. No parseable table, but we can afford the LLM → let it read the page.
  if (process.env.ANTHROPIC_API_KEY) {
    const llm = await callLLM(url, htmlToLlmText(html));
    if (llm && llm.sizes.length >= 2) {
      out = {
        ...out,
        brand: llm.brand || out.brand,
        productName: llm.productName || out.productName,
        category: llm.category || out.category,
        material: llm.material ?? out.material,
        fitNotes: llm.fitNotes ?? out.fitNotes,
        sizes: mapLlmSizes(llm.sizes),
        source: { ...out.source, derived: false, sizesFrom: "page" },
      };
      return out;
    }
  }

  // 4. No measurement chart anywhere. But if the page LISTS its offered sizes
  // (a <select>/swatch), rank those REAL labels instead of a synthesized ladder —
  // the closet-anchor, outcome, and brand-bias signals all work on labels, so
  // this is a genuine improvement even without measurements. Measurements are
  // still absent, so we remain honest: sizesFrom stays "estimated".
  const labels = parseSizeLabels(html);
  if (labels.length >= 2) {
    out.sizes = labels.map((label) => ({ label }));
  }
  out.source.sizesFrom = "estimated";
  return out;
}
