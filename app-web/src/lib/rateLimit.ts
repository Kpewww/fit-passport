// Rate limiting — fixed window per key.
//
// Two backends, chosen at call time:
//
//   • **Upstash Redis** when `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`
//     are set. This is the one that actually works in production: serverless
//     functions scale to many instances, and a per-process counter means the real
//     limit is (limit × instances) — i.e. effectively no limit at all.
//   • **In-memory** otherwise, so local dev and the course demo need no services.
//
// Talked to over Upstash's REST API with plain `fetch`, deliberately without the
// @upstash/ratelimit SDK: one HTTP call is the whole protocol here, and Node 18
// is pinned, so a dependency buys nothing and can break the pin.
//
// On a Redis error we fall back to the in-memory counter rather than failing
// open. A limiter outage shouldn't lock every user out, but it also shouldn't
// silently remove all protection.

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

// Occasionally sweep expired buckets so the map doesn't grow unbounded.
let lastSweep = 0;
function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
}

export type RateResult = { ok: boolean; remaining: number; retryAfterSec: number };

/** Resolved per call, never at module load, so a build never needs the env. */
function upstash(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url: url.replace(/\/$/, ""), token } : null;
}

function memoryLimit(key: string, limit: number, windowMs: number, now: number): RateResult {
  sweep(now);
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterSec: Math.ceil(windowMs / 1000) };
  }
  b.count += 1;
  const retryAfterSec = Math.max(1, Math.ceil((b.resetAt - now) / 1000));
  if (b.count > limit) return { ok: false, remaining: 0, retryAfterSec };
  return { ok: true, remaining: limit - b.count, retryAfterSec };
}

/**
 * INCR the window's counter and set its TTL in one round trip.
 *
 * The window is baked into the key (`…:<window index>`) instead of being tracked
 * as state, which makes the whole thing one atomic INCR plus an idempotent
 * EXPIRE — no read-modify-write race between concurrent instances.
 */
async function redisLimit(
  cfg: { url: string; token: string },
  key: string,
  limit: number,
  windowMs: number,
  now: number,
): Promise<RateResult> {
  const windowIndex = Math.floor(now / windowMs);
  const redisKey = `rl:${key}:${windowIndex}`;
  const ttlSec = Math.ceil(windowMs / 1000) + 1;
  const resetAt = (windowIndex + 1) * windowMs;
  const retryAfterSec = Math.max(1, Math.ceil((resetAt - now) / 1000));

  const res = await fetch(`${cfg.url}/pipeline`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${cfg.token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify([
      ["INCR", redisKey],
      // NX: only set the TTL when there isn't one, so a later hit in the same
      // window can't extend it and stretch the window.
      ["EXPIRE", redisKey, String(ttlSec), "NX"],
    ]),
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`upstash ${res.status}`);
  const body = (await res.json()) as Array<{ result?: unknown; error?: string }>;
  const count = Number(body?.[0]?.result);
  if (!Number.isFinite(count)) throw new Error("upstash: unexpected INCR reply");

  return {
    ok: count <= limit,
    remaining: Math.max(0, limit - count),
    retryAfterSec,
  };
}

/**
 * Check + consume one hit for `key`, allowing `limit` hits per `windowMs`.
 * Returns ok=false once the limit is exceeded.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now = Date.now(),
): Promise<RateResult> {
  const cfg = upstash();
  if (!cfg) return memoryLimit(key, limit, windowMs, now);
  try {
    return await redisLimit(cfg, key, limit, windowMs, now);
  } catch (err) {
    console.warn("[rateLimit] Redis unavailable, falling back to in-memory:", err);
    return memoryLimit(key, limit, windowMs, now);
  }
}

/** Best-effort client IP from proxy headers (Vercel/most hosts set these). */
export function clientKey(req: Request, prefix: string): string {
  const h = req.headers;
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown";
  return `${prefix}:${ip}`;
}

/** Standard 429 response with Retry-After. */
export function tooMany(retryAfterSec: number) {
  return new Response(
    JSON.stringify({ error: "Too many requests — slow down and try again shortly." }),
    { status: 429, headers: { "content-type": "application/json", "retry-after": String(retryAfterSec) } },
  );
}
