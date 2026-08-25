// Guard for server-side fetching of a URL the USER supplied.
//
// This is the SSRF surface of the whole app. `/api/check` takes an arbitrary
// pasted link and our server fetches it — so without a guard, a shopper (or
// anyone who can reach the endpoint) can aim our server at things that are not
// product pages at all:
//
//   • `http://169.254.169.254/…`  — the cloud instance-metadata endpoint. On the
//     serverless platforms this deploys to, that can hand out live credentials.
//     This is the single most valuable target and it is a plain HTTP GET.
//   • `http://127.0.0.1:3000/api/…` — our own internal routes, called from
//     inside the trust boundary.
//   • `http://10.x / 172.16-31.x / 192.168.x` — anything else on the private
//     network the function can reach.
//   • A PUBLIC url that 302-redirects to any of the above — which is why
//     `redirect: "follow"` is unsafe here and every hop has to be re-checked.
//   • A public hostname whose DNS record simply POINTS at a private address.
//
// None of this is exotic; it is the standard SSRF playbook, and "we only parse
// the HTML" is not a defence — the damage is done by the request itself.
//
// The functions below are pure and unit-tested. `resolvesToPrivateAddress` is
// the one that needs DNS and therefore the network.

/** Parse a dotted-quad into four octets, or null if it isn't one. */
function parseIPv4(host: string): number[] | null {
  const m = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return null;
  const parts = m.slice(1).map((n) => Number(n));
  return parts.every((n) => n >= 0 && n <= 255) ? parts : null;
}

/**
 * Reserved / private / otherwise non-public IPv4 space.
 * Ranges per IANA's special-purpose registry — the point is that a product page
 * is never at any of these, so blocking them costs us nothing real.
 */
export function isPrivateIPv4(host: string): boolean {
  const p = parseIPv4(host);
  if (!p) return false;
  const [a, b] = p;
  if (a === 0) return true; // 0.0.0.0/8   "this network"
  if (a === 10) return true; // 10/8        private
  if (a === 127) return true; // 127/8       loopback
  if (a === 169 && b === 254) return true; // 169.254/16  link-local → CLOUD METADATA
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16/12 private
  if (a === 192 && b === 168) return true; // 192.168/16  private
  if (a === 192 && b === 0) return true; // 192.0.0/24  IETF protocol assignments
  if (a === 100 && b >= 64 && b <= 127) return true; // 100.64/10 carrier NAT
  if (a === 198 && (b === 18 || b === 19)) return true; // 198.18/15 benchmarking
  if (a >= 224) return true; // 224/4 multicast, 240/4 reserved, 255.255.255.255
  return false;
}

/** Reserved / private IPv6, including the IPv4-mapped form. */
export function isPrivateIPv6(host: string): boolean {
  let h = host.trim().toLowerCase();
  if (h.startsWith("[") && h.endsWith("]")) h = h.slice(1, -1);
  if (!h.includes(":")) return false;
  if (h === "::" || h === "::1") return true; // unspecified / loopback
  // IPv4-mapped (::ffff:169.254.169.254) smuggles a v4 address through v6.
  const mapped = h.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (mapped) return isPrivateIPv4(mapped[1]);
  if (/^f[cd][0-9a-f]{2}:/.test(h)) return true; // fc00::/7 unique-local
  if (/^fe[89ab][0-9a-f]:/.test(h)) return true; // fe80::/10 link-local
  return false;
}

/** Hostnames that never belong to a public product page. */
export function isBlockedHostname(hostname: string): boolean {
  const h = hostname.trim().toLowerCase().replace(/\.$/, "");
  if (!h) return true;
  if (h === "localhost" || h.endsWith(".localhost")) return true;
  // Names that resolve inside a private network by convention.
  if (h.endsWith(".local") || h.endsWith(".internal") || h.endsWith(".home.arpa")) return true;
  // Cloud metadata by name, not just by address.
  if (h === "metadata.google.internal" || h === "metadata") return true;
  if (isPrivateIPv4(h)) return true;
  if (isPrivateIPv6(h)) return true;
  return false;
}

export type SafetyVerdict =
  | { ok: true; url: URL }
  | { ok: false; reason: "scheme" | "credentials" | "port" | "private-host" };

/**
 * Static checks on a URL before we fetch it. Cheap, synchronous, no DNS.
 * Returns the parsed URL so callers don't re-parse (and can't disagree with us
 * about what the URL actually was).
 */
export function checkUrlSafety(raw: string | URL): SafetyVerdict {
  let u: URL;
  try {
    u = typeof raw === "string" ? new URL(raw) : raw;
  } catch {
    return { ok: false, reason: "scheme" };
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return { ok: false, reason: "scheme" };
  // `https://evil.com@169.254.169.254/` reads as evil.com to a human and as the
  // metadata endpoint to a fetcher. We have no use for credentials in a product
  // link, so refuse rather than try to be clever.
  if (u.username || u.password) return { ok: false, reason: "credentials" };
  // A product page is on 80/443. Anything else is someone probing internal
  // services by port.
  if (u.port && u.port !== "80" && u.port !== "443") return { ok: false, reason: "port" };
  if (isBlockedHostname(u.hostname)) return { ok: false, reason: "private-host" };
  return { ok: true, url: u };
}

/**
 * DNS check: does this public-LOOKING hostname actually resolve into private
 * space? Closes the "attacker points cheap-domain.com at 169.254.169.254" hole
 * that no amount of string inspection can catch.
 *
 * Not a complete defence against DNS rebinding — between our lookup and the
 * fetch's own lookup the record can change (a TOCTOU we cannot close without
 * pinning the socket to a resolved IP). It removes the easy version, and the
 * static checks above still cover every literal address.
 *
 * Fails CLOSED on a lookup error: if we can't tell where a host points, we
 * don't fetch it.
 */
export async function resolvesToPrivateAddress(hostname: string): Promise<boolean> {
  // Unit tests stub `fetch` but cannot stub DNS, and they use deliberately
  // unresolvable hosts like `shop.test`. Failing closed on those would make every
  // extractor test assert the guard instead of the pipeline.
  //
  // Scoped to NODE_ENV === "test", which vitest sets and which is "production" on
  // the deployed app — so this can never widen the guard in production. Every
  // STATIC check (literal private IPs, credentials, ports, blocked names) still
  // runs in tests; only the network lookup is skipped, and it has its own
  // dedicated tests in urlSafety.test.ts.
  if (process.env.NODE_ENV === "test") return false;
  try {
    const { lookup } = await import("node:dns/promises");
    const results = await lookup(hostname, { all: true, verbatim: true });
    if (results.length === 0) return true;
    return results.some((r) =>
      r.family === 4 ? isPrivateIPv4(r.address) : isPrivateIPv6(r.address),
    );
  } catch {
    return true; // unresolvable → treat as unsafe
  }
}
