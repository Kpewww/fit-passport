// Where Fit Passport lives — Session 92.
//
// Since 2026-10-06 the address is https://www.fitpassport.fit (bought on Cloudflare,
// served by the same Vercel project; the bare fitpassport.fit redirects to www at
// Vercel's edge). The first address, https://fit-passport.vercel.app, still reaches
// the same deployment and the same database, and is kept for two reasons:
//
//  - links and bookmarks to it must keep working, so its PAGES move to the new
//    address (middleware.ts), a person's session moving with them (lib/sessionCarry.ts);
//  - extensions before 0.9.0 call ITS /api/* with ITS session cookie, so the API is
//    never moved — those calls are served there, as before.
//
// Edge-safe: middleware.ts imports this, so nothing here may use Node's modules.
//
// FP_SITE_ORIGIN / FP_LEGACY_ORIGIN override the two addresses for a local run only
// (e.g. http://localhost:3000 and http://127.0.0.1:3000 — two hosts, two cookie
// jars), which is how the move was tested before it shipped. Production sets neither.

export const SITE_ORIGIN = "https://www.fitpassport.fit";
export const LEGACY_ORIGIN = "https://fit-passport.vercel.app";

export function siteOrigin(): string {
  return process.env.FP_SITE_ORIGIN?.trim() || SITE_ORIGIN;
}

export function legacyOrigin(): string {
  return process.env.FP_LEGACY_ORIGIN?.trim() || LEGACY_ORIGIN;
}

const hostOf = (origin: string) => new URL(origin).host;

export function isSiteHost(host: string | null): boolean {
  return host != null && host.toLowerCase() === hostOf(siteOrigin());
}

export function isLegacyHost(host: string | null): boolean {
  return host != null && host.toLowerCase() === hostOf(legacyOrigin());
}

/** Crawlers and link previews: they get a plain permanent redirect, never the
 *  session hand-over (which passes through /api/, closed to them by robots.txt). */
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|whatsapp|telegram|discord|slack|lighthouse/i;

export type LegacyMove =
  /** The same path at the new address, permanently: crawlers, assets, anyone without a page view. */
  | { kind: "permanent"; location: string }
  /** A person opening a page: through /api/session/carry, so their session comes too. */
  | { kind: "carry"; location: string };

/**
 * What the old address does with a request, or null to serve it there as before.
 * Only GET and HEAD move; /api/* never reaches this (the middleware's matcher).
 */
export function legacyMove(req: {
  host: string | null;
  method: string;
  /** Path and query, e.g. "/closet?tab=saved". */
  path: string;
  userAgent: string | null;
  /** Sec-Fetch-Mode — "navigate" for a page the browser is opening. */
  fetchMode: string | null;
  accept: string | null;
}): LegacyMove | null {
  if (!isLegacyHost(req.host)) return null;
  if (req.method !== "GET" && req.method !== "HEAD") return null;
  const same = siteOrigin() + req.path;
  const page = req.fetchMode ? req.fetchMode === "navigate" : (req.accept ?? "").includes("text/html");
  if (!page || BOT.test(req.userAgent ?? "")) return { kind: "permanent", location: same };
  return { kind: "carry", location: `${siteOrigin()}/api/session/carry?next=${encodeURIComponent(req.path)}` };
}
