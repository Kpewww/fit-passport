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
import { convert, scalesForDomain, type SizeLine } from "@/lib/sizeConvert";
import { isValidSize } from "@/lib/sizeSystems";
import { Segmented } from "@/components/ui";
import { ArrowRight, Close } from "@/components/Icon";
import { useT } from "@/i18n/client";

export function SizeConverter({
  category,
  onAdopt,
  line: itemLine,
}: {
  category: string;
  onAdopt: (v: string) => void;
  /** The piece's line; women's opens on the women's tables (womensSizes.ts). */
  line?: string | null;
}) {
  const domain = domainForCategory(category);
  const t = useT("sizeInput");
  const [line, setLine] = useState<SizeLine>(itemLine === "womens" ? "womens" : "mens");
  const scales = scalesForDomain(domain, line);
  const [open, setOpen] = useState(false);
  const [scaleId, setScaleId] = useState(scales[0]?.id ?? "");
  const [raw, setRaw] = useState("");
  // EU's countries (FR, IT) open underneath on request.
  const [euOpen, setEuOpen] = useState(false);

  // Keep the chosen scale valid if the domain or line changes under us.
  const activeScaleId = scales.some((s) => s.id === scaleId) ? scaleId : scales[0]?.id ?? "";
  const activeScale = scales.find((s) => s.id === activeScaleId);
  const hasCountries = scales.some((s) => s.parent === "EU");

  const results = useMemo(
    () => (raw.trim() ? convert(domain, raw, activeScaleId, line) : []),
    [domain, raw, activeScaleId, line],
  ).filter((r) => euOpen || !scales.find((s) => s.id === r.scaleId)?.parent || r.scaleId === activeScaleId);

  if (scales.length === 0) return null; // socks / accessories: no converter

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-medium text-brand hover:underline"
      >
        {t("convertOpen")} <ArrowRight size={14} className="-mt-px inline" />
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-line bg-paper-soft p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold text-ink">{t("converter")}</p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-ink-faint hover:text-ink"
        >
          <Close size={14} className="-mt-px mr-1 inline" />{t("close")}
        </button>
      </div>

      {domain !== "bottom" && (
        <div className="mb-2">
          <Segmented
            label={t("lineLabel")}
            options={[{ value: "mens" as SizeLine, label: t("lineMens") }, { value: "womens" as SizeLine, label: t("lineWomens") }]}
            value={line}
            onChange={(v) => { setLine(v); setScaleId(""); }}
          />
        </div>
      )}
      <p className="mb-1.5 text-[11px] text-ink-soft">
        {t("steps")}
      </p>
      <div className="flex gap-1.5">
        <select
          className={`${inputClass} w-auto flex-shrink-0 py-1.5 text-xs`}
          value={activeScaleId}
          onChange={(e) => { setScaleId(e.target.value); }}
        >
          {scales.map((s) => (
            <option key={s.id} value={s.id}>{s.parent ? `${s.parent} › ${s.label}` : s.label}</option>
          ))}
        </select>
        <input
          className={`${inputClass} flex-1 py-1.5 text-xs`}
          placeholder={activeScale ? t("example", { example: activeScale.example }) : ""}
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          inputMode="text"
        />
      </div>

      {raw.trim() && results.length === 0 && (
        <p className="mt-2 text-[11px] text-warn">
          {t("unreadable", { raw: raw.trim(), scale: activeScale?.label ?? "", example: activeScale?.example ?? "" })}
        </p>
      )}

      {results.length > 0 && (
        <div className="mt-2.5">
          <p className="mb-1 text-[10px] uppercase tracking-widest text-ink-faint">
            {t("thatsAbout")}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {results.map((r) => {
              // A letter's range ("FR 32–34") is information, not a size to store.
              const adoptable = isValidSize(category, r.value);
              return (
              <button
                key={r.scaleId}
                type="button"
                disabled={!adoptable}
                onClick={() => { onAdopt(r.value); setOpen(false); }}
                className={`rounded-md border px-2.5 py-1.5 text-xs transition-colors ${
                  r.scaleId === activeScaleId
                    ? "border-brand bg-brand-tint font-semibold text-brand"
                    : "border-line bg-white text-ink-soft hover:border-brand hover:text-brand"
                }`}
                title={t("use", { value: r.value })}
              >
                <span className="text-ink-faint">{r.scaleLabel}</span>{" "}
                <span className="font-semibold">{r.value.replace(/^(EU|US|UK|FR|IT)\s*/, "")}</span>
              </button>
              );
            })}
          </div>
          {domain === "top" && (
            hasCountries ? (
              <button type="button" onClick={() => setEuOpen((v) => !v)} aria-expanded={euOpen}
                className="mt-1.5 text-[11px] font-medium text-brand hover:underline">
                {euOpen ? t("euLess") : t("euMore")}
              </button>
            ) : (
              <p className="mt-1.5 text-[10px] text-ink-faint">{t("mensCountries")}</p>
            )
          )}
          <p className="mt-1.5 text-[10px] text-ink-faint">
            {t("approx")}
          </p>
        </div>
      )}
    </div>
  );
}
