"use client";

// A small, dismissible card that nudges an unclaimed user to claim their
// account once they've actually put some data in (chest or ≥1 closet item).
// Nothing appears for freshly-arrived visitors, or for claimed users.
// Dismiss is per-tab (sessionStorage) — comes back on a new session.
//
// Bottom-LEFT, compact, white (Session 76). It used to be a dark bar centred at
// the foot of every page, which sat on top of exactly what people came to look
// at — in the closet gallery it covered the middle card. The corner is where a
// notice can wait without taking the page from you.

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { LinkButton } from "@/components/ui";
import { Close } from "@/components/Icon";
import { useT } from "@/i18n/client";

const DISMISS_KEY = "fp_claim_nudge_dismissed";

function dismissed(): boolean {
  try { return sessionStorage.getItem(DISMISS_KEY) === "1"; } catch { return false; }
}

export function ClaimNudge() {
  const t = useT("claimNudge");
  const tc = useT("common");
  const pathname = usePathname();
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Hide where it would be redundant: /passport has its own "Save — claim
    // account" bar. It sits above the back-to-top button, never over it.
    if (pathname === "/account" || pathname === "/login" || pathname === "/recover" || pathname === "/passport" || dismissed()) {
      setShow(false);
      return;
    }
    // Check both auth state and whether the user has actually put anything in.
    Promise.all([
      fetch("/api/auth/me").then((r) => r.json()),
      fetch("/api/status").then((r) => r.json()),
    ])
      .then(([me, status]) => {
        if (me.claimed) return setShow(false);
        // Only surface once there's something worth saving.
        if (status.hasBody || status.closetCount >= 1) setShow(true);
      })
      .catch(() => setShow(false));
  }, [pathname]);

  if (!show) return null;

  return (
    <div
      role="status"
      // Not on a phone: there the nav bar always shows the same "Claim account"
      // button, and a card this size would take half the screen to repeat it.
      className="fixed bottom-20 left-6 z-30 hidden max-w-sm items-start gap-3 rounded-2xl bg-white p-4 ring-1 ring-line shadow-lift animate-fade-in-up sm:flex"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-ink">{t("title")}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">{t("body")}</p>
        <LinkButton href="/account" size="sm" arrow className="mt-3">{t("cta")}</LinkButton>
      </div>
      <button
        aria-label={tc("dismiss")}
        onClick={() => {
          try { sessionStorage.setItem(DISMISS_KEY, "1"); } catch { /* shown again next page */ }
          setShow(false);
        }}
        className="-mr-2 -mt-2 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-ink-faint hover:bg-ink/5 hover:text-ink"
      >
        <Close size={18} />
      </button>
    </div>
  );
}
