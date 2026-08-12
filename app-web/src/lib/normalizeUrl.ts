// Be forgiving about pasted product links.
//
// People paste `patagonia.com/product/...`, `www.zara.com/...`, or a link with a
// stray trailing character — none of which pass strict URL validation even though
// the intent is obvious. This normalizes the common cases to a real absolute URL
// (or returns null when there's genuinely nothing usable), and is used on BOTH
// the client and the API so the two never disagree.

export function normalizeUrl(raw: string): string | null {
  let s = raw.trim();
  if (!s) return null;

  // Strip wrapping quotes/angle brackets people copy along with a link.
  s = s.replace(/^[<"'\s]+|[>"'\s]+$/g, "");
  if (!s) return null;

  // Add a scheme when it's missing (the usual "patagonia.com/..." case).
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(s)) {
    // Reject things that clearly aren't hosts (no dot before the first slash).
    const host = s.split(/[/?#]/)[0];
    if (!host.includes(".")) return null;
    s = `https://${s}`;
  }

  try {
    const u = new URL(s);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    if (!u.hostname.includes(".")) return null;
    return u.toString();
  } catch {
    return null;
  }
}
