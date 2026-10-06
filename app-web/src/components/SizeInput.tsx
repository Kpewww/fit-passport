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
import { domainForCategory, isValidSize, presetSizesFor } from "@/lib/sizeSystems";
import { SizeConverter } from "@/components/SizeConverter";
import { useT } from "@/i18n/client";

// Domains whose numbers need a plain-language explanation (sizeInput.explainBottom).
const HAS_EXPLAINER = new Set(["bottom"]);

export function SizeInput({
  category,
  value,
  onChange,
  line,
}: {
  category: string;
  value: string;
  onChange: (v: string) => void;
  /** The garment's line ("mens" | "womens" | "unisex"), for the converter's default. */
  line?: string | null;
}) {
  const t = useT("sizeInput");
  const presets = presetSizesFor(category);
  const domain = domainForCategory(category);
  // The same hint lib/sizeSystems.ts gives the server, in the reader's language.
  const hint = t(`hint.${domain}`);
  const explainer = HAS_EXPLAINER.has(domain) ? t("explainBottom") : null;
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
                  : "border-line text-ink-soft hover:border-ink/30"
              }`}
            >
              {s}
            </button>
          );
        })}
      </div>

      {/* 2. The input */}
      <input
        className={`${inputClass} ${invalid ? "border-bad focus:border-bad focus:ring-bad/30" : ""}`}
        placeholder={hint}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />

      {/* 3. One help line */}
      <div className="flex items-center gap-1.5 text-[11px]">
        {invalid ? (
          <span className="text-bad">{t("invalid", { hint })}</span>
        ) : (
          <span className="text-ink-faint">{hint}</span>
        )}
        {explainer && (
          <button
            type="button"
            onClick={() => setShowExplainer((v) => !v)}
            className="text-brand hover:underline"
          >
            {showExplainer ? t("hide") : t("whatMean")}
          </button>
        )}
      </div>
      {explainer && showExplainer && (
        <p className="rounded-md bg-paper-dim px-2.5 py-2 text-[11px] leading-relaxed text-ink-soft">
          {explainer}
        </p>
      )}

      {/* 4. Collapsed converter */}
      <SizeConverter category={category} onAdopt={onChange} line={line} />
    </div>
  );
}
