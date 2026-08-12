"use client";

// Closet-item "evidence" — the thing that makes our Q&A different from a forum.
//
// An answer that says "size up" is an opinion. An answer that says "size up, here
// is the same brand in my closet, size L, rated 4/5, on an athletic build" is
// evidence. These two components render and pick that attachment.
//
// Only ever coarse data: brand · garment · size · fit rating · colour · the
// owner's coarse body type. Precise measurements are never part of this payload.

import { useMemo, useState } from "react";
import Link from "next/link";
import { garmentLabel } from "@/lib/garments";
import { inputClass } from "@/components/ui";

export type EvidenceView = {
  id: string;
  brand: string;
  displayName: string | null;
  category: string;
  gender: string | null;
  size: string;
  region: string | null;
  fitRating: number;
  color: string | null;
  ownerBodyType: string | null;
};

export type ClosetPick = {
  id: string;
  brand: string;
  displayName: string | null;
  category: string;
  size: string;
  color: string | null;
};

export function EvidenceCard({ ev, label = "Receipt" }: { ev: EvidenceView; label?: string }) {
  return (
    <div className="rounded-xl border border-line bg-paper-soft px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-faint">{label}</p>
      <p className="mt-1 text-sm font-medium text-ink">
        {ev.brand}
        <span className="text-ink-soft"> · {garmentLabel(ev.category)}</span>
        <span className="text-ink-soft"> · size {ev.size}</span>
        {ev.region ? <span className="text-ink-faint"> ({ev.region})</span> : null}
      </p>
      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-ink-faint">
        <span>
          <span className="text-amber-500">{"★".repeat(ev.fitRating)}</span>
          <span className="text-neutral-300">{"★".repeat(5 - ev.fitRating)}</span>
          <span className="ml-1">fit</span>
        </span>
        {ev.color && <span>· {ev.color}</span>}
        {/* The line that does the actual work: whose body this fits. */}
        {ev.ownerBodyType && <span className="text-brand">· on a {ev.ownerBodyType} build</span>}
      </p>
    </div>
  );
}

/** Placeholder for an attachment whose item or owner has since gone away. */
export function EvidenceMissing() {
  return (
    <p className="rounded-xl border border-dashed border-line px-3 py-2 text-xs text-ink-faint">
      The attached closet item is no longer available.
    </p>
  );
}

/**
 * Attach one of YOUR OWN closet items. Server-side validated too — you can't
 * attach a garment you don't own, or the evidence would be hearsay.
 */
export function ClosetAttachPicker({
  closet,
  value,
  onChange,
}: {
  closet: ClosetPick[];
  value: string | null;
  onChange: (id: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const picked = useMemo(() => closet.find((c) => c.id === value) ?? null, [closet, value]);
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = needle
      ? closet.filter((c) =>
          `${c.brand} ${c.displayName ?? ""} ${garmentLabel(c.category)} ${c.size}`
            .toLowerCase()
            .includes(needle),
        )
      : closet;
    return list.slice(0, 40);
  }, [closet, q]);

  if (picked) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-line bg-white px-3 py-2">
        <span className="min-w-0 flex-1 truncate text-sm text-ink">
          <span className="font-medium">{picked.brand}</span>
          <span className="text-ink-soft"> · {garmentLabel(picked.category)} · {picked.size}</span>
        </span>
        <button
          onClick={() => { onChange(null); setOpen(false); }}
          className="text-xs font-medium text-ink-faint hover:text-red-600"
        >
          Remove
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink-soft hover:border-ink/40 hover:text-ink"
      >
        {open ? "Cancel" : "+ Attach an item from my closet"}
      </button>
      {open && (
        <div className="mt-2 rounded-xl border border-line bg-white p-2">
          <input
            className={inputClass + " mb-2"}
            placeholder="Search your closet…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <div className="max-h-48 overflow-y-auto">
            {closet.length === 0 ? (
              <p className="px-1 py-2 text-xs text-ink-faint">
                Your closet is empty.{" "}
                <Link href="/closet" className="text-brand hover:underline">Add items →</Link>
              </p>
            ) : shown.length === 0 ? (
              <p className="px-1 py-2 text-xs text-ink-faint">Nothing matches “{q}”.</p>
            ) : (
              shown.map((c) => (
                <button
                  key={c.id}
                  onClick={() => { onChange(c.id); setOpen(false); setQ(""); }}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-paper-soft"
                >
                  <span className="min-w-0 flex-1 truncate text-ink">
                    <span className="font-medium">{c.brand}</span>
                    <span className="text-ink-soft"> · {garmentLabel(c.category)}</span>
                  </span>
                  <span className="flex-shrink-0 text-xs text-ink-faint">{c.size}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
