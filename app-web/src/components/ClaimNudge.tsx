"use client";

// A small, dismissible floating card that nudges an unclaimed user to claim
// their account once they've actually put some data in (chest or ≥1 closet
// item). Nothing appears for freshly-arrived visitors, or for claimed users.
// Dismiss is per-tab (sessionStorage) — comes back on a new session.

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const DISMISS_KEY = "fp_claim_nudge_dismissed";

export function ClaimNudge() {
  const pathname = usePathname();
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Hide on pages where it would be redundant/distracting.
    if (pathname === "/account" || pathname === "/login" || pathname === "/recover") {
      setShow(false);
      return;
    }
    if (typeof window !== "undefined" && sessionStorage.getItem(DISMISS_KEY) === "1") {
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
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-30 flex justify-center px-4">
      <div className="pointer-events-auto flex max-w-md items-center gap-3 rounded-2xl bg-ink px-4 py-3 text-white shadow-lift">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold">
          !
        </div>
        <div className="flex-1 min-w-0 text-sm">
          <p className="font-semibold">Save your passport</p>
          <p className="text-xs text-white/70">
            Set a username + password so this doesn&apos;t disappear when you
            close the browser.
          </p>
        </div>
        <Link
          href="/account"
          className="whitespace-nowrap rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold hover:bg-brand-dark"
        >
          Claim →
        </Link>
        <button
          aria-label="Dismiss"
          onClick={() => {
            sessionStorage.setItem(DISMISS_KEY, "1");
            setShow(false);
          }}
          className="text-white/50 hover:text-white/90"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
