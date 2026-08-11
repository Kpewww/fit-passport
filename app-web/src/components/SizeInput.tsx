"use client";

// SizeInput — a size field that adapts to the garment category.
//
// Instead of a raw text box (which let junk like "<" through), it offers the
// common sizes for that category as one-tap chips, plus a free-text box for
// regional variants (EU 48, 32×32, EU 42…). Invalid input is flagged inline and
// the parent can block save. The valid shapes come from sizeSystems.ts, which
// the server also enforces — so UI and API can't drift.

import { inputClass } from "@/components/ui";
import { isValidSize, presetSizesFor, sizeHintFor } from "@/lib/sizeSystems";

export function SizeInput({
  category,
  value,
  onChange,
}: {
  category: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const presets = presetSizesFor(category);
  const hint = sizeHintFor(category);
  const trimmed = value.trim();
  const invalid = trimmed.length > 0 && !isValidSize(category, trimmed);

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-1">
        {presets.map((s) => {
          const active = trimmed.toUpperCase() === s.toUpperCase();
          return (
            <button
              key={s}
              type="button"
              onClick={() => onChange(active ? "" : s)}
              className={`rounded-md border px-2 py-1 text-xs font-medium transition-colors ${
                active
                  ? "border-brand bg-brand-tint text-brand"
                  : "border-neutral-300 text-ink-soft hover:border-neutral-400"
              }`}
            >
              {s}
            </button>
          );
        })}
      </div>
      <input
        className={`${inputClass} ${invalid ? "border-red-400 focus:border-red-400 focus:ring-red-200" : ""}`}
        placeholder={hint}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {invalid ? (
        <p className="text-xs text-red-600">Not a recognized size — try {hint}.</p>
      ) : (
        <p className="text-[11px] text-ink-faint">{hint}</p>
      )}
    </div>
  );
}
