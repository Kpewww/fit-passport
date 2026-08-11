// Lightweight in-memory rate limiter — fixed-window per key.
//
// Scope/limits: good enough for a single-instance student beta to blunt scraping
// and password brute-force. It is PER-PROCESS (resets on restart, not shared
// across serverless instances) — before multi-instance production, swap the
// store for Redis/Upstash. Kept dependency-free on purpose.

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

/**
 * Check + consume one hit for `key` within a `windowMs` window allowing `limit`
 * hits. Returns ok=false once the limit is exceeded.
 */
export function rateLimit(key: string, limit: number, windowMs: number, now = Date.now()): RateResult {
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
