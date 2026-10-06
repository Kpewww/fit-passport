// The garment category, asked of a model when no word rule knows the name
// (Session 84c).
//
// Why: the rules in extractor.ts are a vocabulary, and a vocabulary has gaps —
// "Track Top" and "Velvet Top" were refused as "not a garment" until Session 84a
// added the words. The model is asked only after the words have failed, so the
// common case stays deterministic, testable and free.
//
// What is sent: the product's name and the page's own category string — a few
// dozen words, never anything about the shopper.
//
// Which model: TypeSafe's Jev first (the founder's choice, 2026-10-05) — a
// classifier that answers a typed choice with a probability per option, at
// $42 per billion input tokens (typesafe.ai). Claude Haiku is the fallback, only
// when Jev fails and CATEGORY_FALLBACK=haiku is set: it costs far more per call.
// No key, no call — the page then asks the shopper (the caller's refusal).
//
// API: POST https://api.typesafe.ai/v1/systemone, Bearer key, a `choice`
// question whose `criteria` map each option to a description; the answer carries
// `choice`, `probabilities` and `confidence` (docs.typesafe.ai/api,
// /primitives/choice). Called with fetch, like extractorLLM's Anthropic calls —
// no SDK dependency.

import { CATEGORY_MODEL } from "./scoringConstants";

export type CategoryHint = { name?: string | null; breadcrumb?: string | null; structured?: string | null };
export type CategoryAnswer = { category: string; confidence: number; by: "jev" | "haiku" };

/** Our categories, each with the words a shop uses for it. "not_clothing" lets
 *  the model say so rather than force a garment onto a bag or a game top-up. */
export const CATEGORY_CHOICES: Record<string, string> = {
  tshirt: "T-shirt, tee",
  top: "women's top: blouse, tank, cami, bodysuit, tunic, knit or fitted top",
  shirt: "button shirt, overshirt, flannel, oxford",
  polo: "polo shirt",
  sweater: "sweater, jumper, cardigan, knit, fleece pullover",
  hoodie: "hoodie, sweatshirt",
  jacket: "jacket, coat, blazer, track top, vest, gilet, suit",
  pants: "trousers, chinos, joggers, leggings",
  jeans: "jeans, denim trousers",
  shorts: "shorts",
  skirt: "skirt",
  dress: "dress, gown",
  jumpsuit: "jumpsuit, romper, overalls",
  swimsuit: "swimsuit, bikini",
  underwear: "bra, lingerie, underwear",
  shoes: "shoes, sneakers, boots, sandals",
  socks: "socks",
  accessory: "bag, hat, belt, scarf, jewellery, other accessory",
  not_clothing: "not a garment at all",
};

const JEV_URL = "https://api.typesafe.ai/v1/systemone";
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const HAIKU = "claude-haiku-4-5-20251001";

const cache = new Map<string, CategoryAnswer | null>();

function stateOf(h: CategoryHint): string {
  return [h.name && `Product: ${h.name}`, h.breadcrumb && `Breadcrumb: ${h.breadcrumb}`, h.structured && `Shop category: ${h.structured}`]
    .filter(Boolean)
    .join("\n")
    .slice(0, CATEGORY_MODEL.maxStateChars);
}

async function askJev(state: string, key: string): Promise<CategoryAnswer | null> {
  const r = await fetch(JEV_URL, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
    body: JSON.stringify({
      state,
      model: "jev-latest",
      questions: { category: { type: "choice", instructions: "Which kind of product is this?", criteria: CATEGORY_CHOICES } },
    }),
    signal: AbortSignal.timeout(CATEGORY_MODEL.timeoutMs),
  });
  if (!r.ok) throw new Error(`jev ${r.status}`);
  const body = await r.json();
  const a = body?.answers?.category;
  if (!a || typeof a.choice !== "string" || typeof a.confidence !== "number") return null;
  return { category: a.choice, confidence: a.confidence, by: "jev" };
}

async function askHaiku(state: string, key: string): Promise<CategoryAnswer | null> {
  const r = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: HAIKU,
      max_tokens: 64,
      tools: [{
        name: "category",
        description: "The kind of product this is.",
        input_schema: {
          type: "object",
          properties: { category: { type: "string", enum: Object.keys(CATEGORY_CHOICES) } },
          required: ["category"],
        },
      }],
      tool_choice: { type: "tool", name: "category" },
      messages: [{ role: "user", content: state }],
    }),
    signal: AbortSignal.timeout(CATEGORY_MODEL.timeoutMs),
  });
  if (!r.ok) return null;
  const body = await r.json();
  const use = (body?.content ?? []).find((c: { type?: string }) => c.type === "tool_use");
  const cat = use?.input?.category;
  // Haiku gives no probability; a forced enum answer is taken at the threshold.
  return typeof cat === "string" ? { category: cat, confidence: CATEGORY_MODEL.minConfidence, by: "haiku" } : null;
}

/**
 * Our category for a product the word rules did not know — or "not_clothing" —
 * or null: no key, a failed call, an answer below the confidence threshold,
 * which the caller treats exactly as before. Never throws.
 */
type Env = Partial<Record<"TYPESAFE_API_KEY" | "ANTHROPIC_API_KEY" | "CATEGORY_FALLBACK", string>>;

export async function classifyCategory(hint: CategoryHint, env: Env = process.env as Env): Promise<CategoryAnswer | null> {
  const state = stateOf(hint);
  if (!state) return null;
  if (cache.has(state)) return cache.get(state)!;

  let answer: CategoryAnswer | null = null;
  let jevFailed = !env.TYPESAFE_API_KEY;
  if (env.TYPESAFE_API_KEY) {
    try { answer = await askJev(state, env.TYPESAFE_API_KEY); } catch { jevFailed = true; }
  }
  // Haiku only when Jev could not answer at all (no key, an error, a timeout) —
  // never to second-guess a Jev answer — and only when switched on.
  if (jevFailed && env.CATEGORY_FALLBACK === "haiku" && env.ANTHROPIC_API_KEY) {
    try { answer = await askHaiku(state, env.ANTHROPIC_API_KEY); } catch { answer = null; }
  }
  // "not_clothing" is returned too, when confident: the caller then keeps the
  // page's refusal as "not a garment" instead of asking the shopper.
  const usable = answer && answer.category in CATEGORY_CHOICES && answer.confidence >= CATEGORY_MODEL.minConfidence;
  const out = usable ? answer : null;
  if (cache.size > CATEGORY_MODEL.cacheEntries) cache.clear();
  cache.set(state, out);
  return out;
}

/** For tests: forget cached answers. */
export function clearCategoryCache() {
  cache.clear();
}
