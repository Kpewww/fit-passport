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
  return !!process.env.TRYON_API_URL;
}

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
      body: JSON.stringify({ prompt: buildTryonPrompt(req) }),
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
