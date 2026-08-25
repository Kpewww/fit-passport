"use client";

// Report control for user-generated content.
//
// Deliberately quiet — a small text link, not a button competing with Like. It
// should be findable when you need it and invisible the rest of the time. Picking
// a reason is one click; there's no dialog to dismiss, because a reporting flow
// people abandon halfway is the same as having none.

import { useState } from "react";
import { REPORT_REASONS, type ReportKind } from "@/lib/reports";

export function ReportButton({
  kind,
  targetId,
  className = "",
}: {
  kind: ReportKind;
  targetId: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function send(reason: string) {
    setBusy(true);
    const res = await fetch("/api/report", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kind, targetId, reason }),
    })
      .then((r) => r.json())
      .catch(() => null);
    setBusy(false);
    setOpen(false);
    if (!res || res.error) {
      setDone(res?.error ?? "Couldn't send that report.");
      return;
    }
    setDone(
      res.hidden
        ? "Reported — this is now hidden pending review."
        : "Reported. Thank you — we look at these.",
    );
  }

  if (done) {
    return <span className={`text-[11px] text-ink-faint ${className}`}>{done}</span>;
  }

  return (
    <span className={`relative ${className}`}>
      <button
        type="button"
        onClick={(e) => {
          // These sit inside linked cards; a report must not navigate.
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        /* A 17px-tall tap target next to other controls is a mis-tap waiting to
           happen. Grow the box VERTICALLY only — horizontal padding here widened
           a row that was already fighting for space on a phone. */
        className="-my-2 py-2 text-[11px] text-ink-faint underline-offset-2 hover:text-red-600 hover:underline"
      >
        {open ? "Cancel" : "Report"}
      </button>
      {open && (
        <span
          className="absolute right-0 top-full z-30 mt-1 w-56 rounded-xl border border-line bg-white p-1 shadow-lift"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <span className="block px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-ink-faint">
            What&apos;s wrong with it?
          </span>
          {REPORT_REASONS.map((r) => (
            <button
              key={r.key}
              type="button"
              disabled={busy}
              onClick={() => send(r.key)}
              className="block w-full rounded-lg px-2 py-1.5 text-left text-xs text-ink hover:bg-paper-soft disabled:opacity-50"
            >
              {r.label}
            </button>
          ))}
        </span>
      )}
    </span>
  );
}
