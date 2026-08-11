"use client";

// SizeInput — the core size field, category-aware and deliberately uncluttered.
//
// Layout (top → bottom):
//   1. Quick-pick chips — the common sizes for this garment type, one tap.
//   2. The input itself — validated; junk like "<" is flagged inline.
//   3. One small help line — the scale hint, with a "?" that expands a plain-
//      language explanation for domains whose numbers aren't obvious (pants).
//   4. A collapsed converter toggle — for when you only know your size in
//      another scale (EU/US/UK/cm). Hidden until asked for.
//
// Valid shapes come from sizeSystems.ts (the server enforces the same), so UI
// and API can't drift.

import { useState } from "react";
import { inputClass } from "@/components/ui";
import { domainForCategory, isValidSize, presetSizesFor, sizeHintFor } from "@/lib/sizeSystems";
import { SizeConverter } from "@/components/SizeConverter";

// Longer, plain-language explanation for domains whose numbers aren't obvious.
const DOMAIN_EXPLAINER: Record<string, string> = {
  bottom:
    "Pants sizes are in inches. A single number is your waist — e.g. 32 means a 32-inch waist (≈ 81 cm). " +
    "A pair like 32 × 34 means waist 32 in × inseam 34 in, where the inseam is the inner-leg length from crotch to hem.",
};

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
  const domain = domainForCategory(category);
  const explainer = DOMAIN_EXPLAINER[domain];
  const trimmed = value.trim();
  const invalid = trimmed.length > 0 && !isValidSize(category, trimmed);
  const [showExplainer, setShowExplainer] = useState(false);

  return (
    <div className="space-y-2">
      {/* 1. Quick-pick chips */}
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

      {/* 2. The input */}
      <input
        className={`${inputClass} ${invalid ? "border-red-400 focus:border-red-400 focus:ring-red-200" : ""}`}
        placeholder={hint}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />

      {/* 3. One help line */}
      <div className="flex items-center gap-1.5 text-[11px]">
        {invalid ? (
          <span className="text-red-600">Not a recognized size — try {hint}.</span>
        ) : (
          <span className="text-ink-faint">{hint}</span>
        )}
        {explainer && (
          <button
            type="button"
            onClick={() => setShowExplainer((v) => !v)}
            className="text-brand hover:underline"
          >
            {showExplainer ? "hide" : "what do these mean?"}
          </button>
        )}
      </div>
      {explainer && showExplainer && (
        <p className="rounded-md bg-neutral-100 px-2.5 py-2 text-[11px] leading-relaxed text-ink-soft">
          {explainer}
        </p>
      )}

      {/* 4. Collapsed converter */}
      <SizeConverter category={category} onAdopt={onChange} />
    </div>
  );
}
