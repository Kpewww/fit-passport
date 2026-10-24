// BRIA background removal (Session 104). API v2, `api_token` header, image as base64,
// synchronous call; the cut-out is returned at `result.image_url`.
// Docs: https://docs.bria.ai/image-editing/v2-endpoints/background-remove
// BRIA_API_BASE defaults to BRIA's production engine host; set it if BRIA's account
// page names another.

export class ProviderError extends Error {
  constructor(message: string, readonly retryable = false) { super(message); }
}

export async function removeBackground(image: string, fetcher: typeof fetch = fetch): Promise<string> {
  const token = process.env.BRIA_API_TOKEN;
  if (!token) throw new ProviderError("BRIA_API_TOKEN not set");
  const base = (process.env.BRIA_API_BASE ?? "https://engine.prod.bria-api.com").replace(/\/$/, "");
  const r = await fetcher(`${base}/v2/image/edit/remove_background`, {
    method: "POST",
    headers: { "content-type": "application/json", api_token: token },
    // Raw base64, no data: prefix; keep soft edges (lace, hair) as partial alpha.
    body: JSON.stringify({ image: image.slice(image.indexOf(",") + 1), sync: true, preserve_alpha: true }),
  });
  if (!r.ok) throw new ProviderError(`BRIA ${r.status}`, r.status >= 500 || r.status === 429);
  const body = (await r.json()) as { result?: { image_url?: string } };
  const url = body.result?.image_url;
  if (!url) throw new ProviderError("BRIA returned no image");
  return url;
}
