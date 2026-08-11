"use client";

// SizeConverter — a COLLAPSIBLE helper under the size field. Hidden by default
// (a single "Don't know the size in this store's scale? Convert →" toggle) so
// the size field stays clean. When open: pick the scale you think in, type your
// size, and see the equivalents. The input's example placeholder follows the
// selected scale (EU→"43", US→"10", cm→"27"), so it's never confusingly generic.
// Tap any equivalent to adopt it into the actual size field.

import { useMemo, useState } from "react";
import { inputClass } from "@/components/ui";
import { domainForCategory } from "@/lib/sizeSystems";
import { convert, scalesForDomain } from "@/lib/sizeConvert";

export function SizeConverter({
  category,
  onAdopt,
}: {
  category: string;
  onAdopt: (v: string) => void;
}) {
  const domain = domainForCategory(category);
  const scales = scalesForDomain(domain);
  const [open, setOpen] = useState(false);
  const [scaleId, setScaleId] = useState(scales[0]?.id ?? "");
  const [raw, setRaw] = useState("");

  // Keep the chosen scale valid if the domain changes under us.
  const activeScaleId = scales.some((s) => s.id === scaleId) ? scaleId : scales[0]?.id ?? "";
  const activeScale = scales.find((s) => s.id === activeScaleId);

  const results = useMemo(
    () => (raw.trim() ? convert(domain, raw, activeScaleId) : []),
    [domain, raw, activeScaleId],
  );

  if (scales.length === 0) return null; // socks / accessories: no converter

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-medium text-brand hover:underline"
      >
        Know it in another scale (EU / US / UK / cm)? Convert →
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold text-ink">Size converter</p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-ink-faint hover:text-ink"
        >
          Close ✕
        </button>
      </div>

      <p className="mb-1.5 text-[11px] text-ink-soft">
        1. Choose the scale you know your size in · 2. Type it
      </p>
      <div className="flex gap-1.5">
        <select
          className={`${inputClass} w-auto flex-shrink-0 py-1.5 text-xs`}
          value={activeScaleId}
          onChange={(e) => { setScaleId(e.target.value); }}
        >
          {scales.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
        <input
          className={`${inputClass} flex-1 py-1.5 text-xs`}
          placeholder={activeScale ? `e.g. ${activeScale.example}` : ""}
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          inputMode="text"
        />
      </div>

      {raw.trim() && results.length === 0 && (
        <p className="mt-2 text-[11px] text-amber-700">
          Couldn&apos;t read &quot;{raw.trim()}&quot; as a {activeScale?.label} size.
          Example: {activeScale?.example}.
        </p>
      )}

      {results.length > 0 && (
        <div className="mt-2.5">
          <p className="mb-1 text-[10px] uppercase tracking-widest text-ink-faint">
            That&apos;s about · tap to use
          </p>
          <div className="flex flex-wrap gap-1.5">
            {results.map((r) => (
              <button
                key={r.scaleId}
                type="button"
                onClick={() => { onAdopt(r.value); setOpen(false); }}
                className={`rounded-md border px-2.5 py-1.5 text-xs transition-colors ${
                  r.scaleId === activeScaleId
                    ? "border-brand bg-brand-tint font-semibold text-brand"
                    : "border-neutral-300 bg-white text-ink-soft hover:border-brand hover:text-brand"
                }`}
                title={`Use ${r.value}`}
              >
                <span className="text-ink-faint">{r.scaleLabel}</span>{" "}
                <span className="font-semibold">{r.value.replace(/^(EU|US|UK)\s*/, "")}</span>
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-[10px] text-ink-faint">
            ≈ approximate — brands vary. Pick the one matching how this product is labeled.
          </p>
        </div>
      )}
    </div>
  );
}
