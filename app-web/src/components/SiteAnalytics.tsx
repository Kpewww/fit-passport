"use client";

// Vercel Web Analytics — page views, counted without cookies (Vercel: visitors are
// a hash of the request, discarded after 24 hours; vercel.com/docs/analytics/
// privacy-policy). It renders nothing visible.
//
// Every page view carries its URL, and two of ours hold secrets:
//   • /u/<account code> — the code IS the read capability for that closet
//     (docs/design/identity-and-sharing.md), so it must not land in a dashboard;
//   • /reset?token=… — a password-reset token.
// So the path is redacted before anything leaves the browser: query strings are
// dropped everywhere (they also carry pasted product links on /check), and an
// account code becomes "[code]".

import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";

/** The URL as it may be counted. Exported for the test. */
export function redactUrl(url: string): string {
  try {
    const u = new URL(url);
    u.search = "";
    u.hash = "";
    u.pathname = u.pathname.replace(/^\/u\/[^/]+/, "/u/[code]");
    return u.toString();
  } catch {
    return url.split(/[?#]/)[0];
  }
}

export function SiteAnalytics() {
  return <Analytics beforeSend={(event: BeforeSendEvent) => ({ ...event, url: redactUrl(event.url) })} />;
}
