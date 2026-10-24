// What happened, for a pilot (Session 100). A pilot that cannot see where people fail
// learns nothing; before this the site had page views only.
//
// An event is a name, a short code and the page — never a measurement, never words a
// person typed, never a product's address. Recording one can never break the request
// that records it: it is not awaited by callers that do not need it, and a failed
// write is dropped.

import { prisma } from "./db";

export const EVENT_NAMES = [
  "check",            // a size was recommended; detail = how the chart was read
  "check-refused",    // detail = the refusal code
  "chart-upload",     // detail = the read's status or the refusal
  "piece-added",
  "account-claimed",
  "extension-check",  // a check that came from the extension
  "feedback",
  "client-error",     // detail = the error's message, cut short
  "outcome",          // a purchase reported; detail = decision, and ":from-saved" from the to-buy list
  "wear-logged",      // a day logged on the wear calendar; detail = "worn" | "planned" | "confirmed"
  "wear-fit",         // "does it still fit?" answered; detail = answered/asked, e.g. "2/3"
  "wear-undo",        // a logged day removed
] as const;
export type EventName = (typeof EVENT_NAMES)[number];

/** Events a browser may send itself; the rest only the server records. */
export const CLIENT_EVENTS: ReadonlySet<EventName> = new Set(["client-error"]);

export async function track(name: EventName, opts: { userId?: string | null; detail?: string | null; path?: string | null } = {}): Promise<void> {
  try {
    await prisma.event.create({
      data: {
        name,
        userId: opts.userId ?? null,
        detail: opts.detail ? String(opts.detail).slice(0, 200) : null,
        path: opts.path ? String(opts.path).slice(0, 200) : null,
      },
    });
  } catch {
    // A lost event is not worth a failed request.
  }
}
