"use client";

// SizeConverter — a small panel under SizeInput for domains that support
// cross-scale conversion (shoes, tops, bottoms). Pick the scale you think in
// (e.g. EU for shoes), type your size, and see the equivalents. Tap any
// equivalent to adopt it as the stored size.

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
  const [scaleId, setScaleId] = useState(scales[0]?.id ?? "");
  const [raw, setRaw] = useState("");

  // Keep the chosen scale valid if the domain changes under us.
  const activeScaleId = scales.some((s) => s.id === scaleId) ? scaleId : scales[0]?.id ?? "";

  const results = useMemo(
    () => (raw.trim() ? convert(domain, raw, activeScaleId) : []),
    [domain, raw, activeScaleId],
  );

  if (scales.length === 0) return null; // socks / accessories: no converter

  return (
    <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-2.5">
      <p className="mb-1.5 text-[11px] font-medium text-ink-soft">
        Know your size in another scale? Convert it:
      </p>
      <div className="flex gap-1.5">
        <select
          className={`${inputClass} w-auto flex-shrink-0 py-1 text-xs`}
          value={activeScaleId}
          onChange={(e) => setScaleId(e.target.value)}
        >
          {scales.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
        <input
          className={`${inputClass} flex-1 py-1 text-xs`}
          placeholder="e.g. 43"
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
        />
      </div>

      {raw.trim() && results.length === 0 && (
        <p className="mt-1.5 text-[11px] text-ink-faint">
          Couldn&apos;t read that as a {scales.find((s) => s.id === activeScaleId)?.label} size.
        </p>
      )}

      {results.length > 0 && (
        <div className="mt-2">
          <p className="mb-1 text-[10px] uppercase tracking-widest text-ink-faint">
            ≈ equivalents · tap to use
          </p>
          <div className="flex flex-wrap gap-1">
            {results.map((r) => (
              <button
                key={r.scaleId}
                type="button"
                onClick={() => onAdopt(r.value)}
                className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs text-ink-soft transition-colors hover:border-brand hover:text-brand"
                title={`Use ${r.value}`}
              >
                <span className="text-ink-faint">{r.scaleLabel}:</span> {r.value}
              </button>
            ))}
          </div>
          <p className="mt-1 text-[10px] text-ink-faint">
            Approximate — brands vary. Pick the one that matches how the product is labeled.
          </p>
        </div>
      )}
    </div>
  );
}
