// Photoreal try-on — OPTIONAL image generation on top of the stylized mannequin.
//
// Honest scope: our LLM (Claude) cannot render images, so a photoreal "model
// wearing your outfit" needs a dedicated image-generation / virtual-try-on API.
// This module is off by default. When `TRYON_API_URL` (+ optional `TRYON_API_KEY`)
// are set, it POSTs a text prompt built from the outfit + body params and returns
// an image URL (or data URL). Any failure — no key, timeout, bad response —
// returns null so the UI cleanly falls back to the stylized mannequin.
//
// This is deliberately provider-agnostic: point TRYON_API_URL at whatever
// text-to-image endpoint you use (it must accept { prompt } and return { url } or
// { image } / { b64 }). We NEVER send the user's precise measurements or identity
// — only a coarse body descriptor + the garment list.

export type TryonRequest = {
  garments: Array<{ category: string; color?: string | null }>;
  bodyDescriptor?: string | null; // coarse, e.g. "average build, tapered" — never cm
  occasion?: string | null;
};

const TIMEOUT_MS = 20000;

export function tryonConfigured(): boolean {
  return !!process.env.TRYON_API_URL || !!process.env.REPLICATE_API_TOKEN;
}

// FLUX schnell on Replicate — the most cost-effective text-to-image right now
// (~$0.003/image, ~1–2s). Cheapest sensible default for a student/beta project.
const REPLICATE_MODEL = "black-forest-labs/flux-schnell";

/** Build a neutral, privacy-safe prompt from the outfit. */
export function buildTryonPrompt(req: TryonRequest): string {
  const pieces = req.garments
    .map((g) => [g.color, g.category].filter(Boolean).join(" "))
    .filter(Boolean)
    .join(", ");
  const body = req.bodyDescriptor ? ` on a ${req.bodyDescriptor} figure` : "";
  const occ = req.occasion ? ` styled for ${req.occasion}` : "";
  return (
    `Full-body fashion lookbook photo of a faceless mannequin${body} wearing ${pieces}${occ}. ` +
    `Studio lighting, neutral background, realistic fabric, editorial style, no text.`
  );
}

/**
 * Generate a photoreal preview. Returns an image URL/data-URL, or null if the
 * feature isn't configured or the call fails (caller falls back to the mannequin).
 */
export async function generateTryonImage(req: TryonRequest): Promise<string | null> {
  const prompt = buildTryonPrompt(req);
  // Prefer Replicate FLUX schnell when a token is set (cheapest photoreal path).
  if (process.env.REPLICATE_API_TOKEN) {
    const img = await generateViaReplicate(prompt).catch(() => null);
    if (img) return img;
  }
  // Otherwise, a generic provider endpoint.
  const url = process.env.TRYON_API_URL;
  if (!url) return null;

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const headers: Record<string, string> = { "content-type": "application/json" };
    if (process.env.TRYON_API_KEY) headers.authorization = `Bearer ${process.env.TRYON_API_KEY}`;

    const r = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers,
      body: JSON.stringify({ prompt }),
    });
    if (!r.ok) return null;
    const j = (await r.json()) as { url?: string; image?: string; b64?: string };
    if (j.url) return j.url;
    if (j.image) return j.image.startsWith("data:") ? j.image : `data:image/png;base64,${j.image}`;
    if (j.b64) return `data:image/png;base64,${j.b64}`;
    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

// Replicate runs predictions async: create → poll until succeeded → read output.
async function generateViaReplicate(prompt: string): Promise<string | null> {
  const token = process.env.REPLICATE_API_TOKEN!;
  const headers = { "content-type": "application/json", authorization: `Bearer ${token}` };

  const create = await fetch(`https://api.replicate.com/v1/models/${REPLICATE_MODEL}/predictions`, {
    method: "POST",
    headers,
    body: JSON.stringify({ input: { prompt, aspect_ratio: "3:4", output_format: "webp", num_outputs: 1 } }),
  });
  if (!create.ok) return null;
  let pred = (await create.json()) as { id: string; status: string; output?: string[] | string };

  // Poll (FLUX schnell is fast — usually ready within a couple seconds).
  const deadline = Date.now() + TIMEOUT_MS;
  while (pred.status !== "succeeded" && pred.status !== "failed" && pred.status !== "canceled") {
    if (Date.now() > deadline) return null;
    await new Promise((r) => setTimeout(r, 800));
    const poll = await fetch(`https://api.replicate.com/v1/predictions/${pred.id}`, { headers });
    if (!poll.ok) return null;
    pred = await poll.json();
  }
  if (pred.status !== "succeeded" || !pred.output) return null;
  return Array.isArray(pred.output) ? (pred.output[0] ?? null) : pred.output;
}
