// FASHN virtual try-on v1.6 (Session 104). Submit with POST /v1/run, then poll
// GET /v1/status/:id until completed or failed. Failed predictions cost nothing.
// Images go in as base64 data URLs and come back as base64 (return_base64), so no
// picture of the person waits on FASHN's CDN; FASHN still keeps request metadata.
// Docs: https://docs.fashn.ai/api-reference/tryon-v1-6, https://docs.fashn.ai/api-overview/api-fundamentals

import { ProviderError } from "./bria";

const BASE = "https://api.fashn.ai/v1";

export type TryonCategory = "tops" | "bottoms" | "one-pieces" | "auto";

function key(): string {
  const k = process.env.FASHN_API_KEY;
  if (!k) throw new ProviderError("FASHN_API_KEY not set");
  return k;
}

export async function startTryon(
  input: { personDataUrl: string; garmentDataUrl: string; category: TryonCategory },
  fetcher: typeof fetch = fetch,
): Promise<string> {
  const r = await fetcher(`${BASE}/run`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${key()}` },
    body: JSON.stringify({
      model_name: "tryon-v1.6",
      inputs: {
        model_image: input.personDataUrl,
        garment_image: input.garmentDataUrl,
        category: input.category,
        mode: "balanced",
        return_base64: true,
      },
    }),
  });
  if (!r.ok) throw new ProviderError(`FASHN ${r.status}`, r.status >= 500 || r.status === 429);
  const body = (await r.json()) as { id?: string };
  if (!body.id) throw new ProviderError("FASHN returned no prediction id");
  return body.id;
}

export type TryonState =
  | { status: "running" }
  | { status: "done"; output: string }
  | { status: "failed"; error: string };

export async function pollTryon(id: string, fetcher: typeof fetch = fetch): Promise<TryonState> {
  const r = await fetcher(`${BASE}/status/${encodeURIComponent(id)}`, { headers: { authorization: `Bearer ${key()}` } });
  if (!r.ok) throw new ProviderError(`FASHN status ${r.status}`, true);
  const body = (await r.json()) as { status?: string; output?: string[]; error?: { name?: string; message?: string } | null };
  if (body.status === "completed" && body.output?.[0]) return { status: "done", output: body.output[0] };
  if (body.status === "failed" || body.status === "canceled" || body.status === "time_out") {
    return { status: "failed", error: body.error?.name ?? body.status };
  }
  return { status: "running" };
}

/** The try-on category for a closet garment type, by its size domain. */
export function tryonCategory(domain: string): TryonCategory {
  return domain === "top" ? "tops" : domain === "bottom" ? "bottoms" : domain === "onepiece" ? "one-pieces" : "auto";
}
