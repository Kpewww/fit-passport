"use client";

// The size converter on /check's empty state (split out of page.tsx in Session 100,
// so the conversion tables load only where the converter is shown).

import { useState } from "react";
import { Segmented, inputClass } from "@/components/ui";
import { convert, detectScale, scalesForDomain, type SizeLine } from "@/lib/sizeConvert";
import type { SizeDomain } from "@/lib/sizeSystems";
import { useT } from "@/i18n/client";

const CONV_KINDS: Array<{ label: "tops" | "bottoms" | "shoes"; domain: SizeDomain }> = [
  { label: "tops", domain: "top" },
  { label: "bottoms", domain: "bottom" },
  { label: "shoes", domain: "shoe" },
];

export function LiveConverter({ department }: { department: "mens" | "womens" | null }) {
  const t = useT("check");
  const [domain, setDomain] = useState<SizeDomain>("top");
  const [raw, setRaw] = useState("M");
  const [scaleId, setScaleId] = useState<string | null>(null);
  // Men's and women's numbers differ (a women's XS is FR 34, not EU 44). The
  // default is the one department the wearer says they shop, else men's.
  const [line, setLine] = useState<SizeLine>(department ?? "mens");
  // EU is the main European scale; its countries open underneath on request.
  const [euOpen, setEuOpen] = useState(false);

  const scales = scalesForDomain(domain, line);
  // Use the explicit scale when the user picked one, else auto-detect what they typed.
  const from = scaleId && scales.some((s) => s.id === scaleId) ? scaleId : detectScale(domain, raw, line);
  const rows = from ? convert(domain, raw, from, line) : [];
  const topLevel = scales.filter((s) => !s.parent);
  const countries = scales.filter((s) => s.parent === "EU");

  function pickDomain(d: SizeDomain) {
    setDomain(d);
    setScaleId(null);
    setRaw(d === "top" ? "M" : d === "bottom" ? "32" : "US 9");
  }

  return (
    <div className="mt-12 rounded-2xl bg-white p-6 ring-1 ring-line sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow text-ink-faint">{t("converter.eyebrow")}</p>
          <h2 className="mt-1.5 font-serif text-2xl text-ink">{t("converter.title")}</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <Segmented
            label={t("converter.lineLabel")}
            options={[{ value: "mens" as SizeLine, label: t("converter.mens") }, { value: "womens" as SizeLine, label: t("converter.womens") }]}
            value={line}
            onChange={(v) => { setLine(v); setScaleId(null); }}
          />
          <Segmented
            label={t("converter.kindLabel")}
            options={CONV_KINDS.map((k) => ({ value: k.domain, label: t(`converter.${k.label}`) }))}
            value={domain}
            onChange={pickDomain}
          />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="mb-1.5 block font-medium text-ink">{t("converter.youWear")}</span>
          <input
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder={domain === "shoe" ? "US 9" : domain === "bottom" ? "32" : "M"}
            className={inputClass + " w-32"}
          />
        </label>
        <label className="text-sm">
          <span className="mb-1.5 block font-medium text-ink">{t("converter.inSystem")}</span>
          <select
            value={from ?? ""}
            onChange={(e) => setScaleId(e.target.value || null)}
            className={inputClass + " w-44"}
          >
            <option value="">{t("converter.auto")}</option>
            {scales.map((s) => (
              <option key={s.id} value={s.id}>{s.parent ? `${s.parent} › ${s.label}` : s.label}</option>
            ))}
          </select>
        </label>
      </div>

      {/* live outputs — zeros/dashes until the input parses */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {topLevel.map((s) => {
          const hit = rows.find((r) => r.scaleId === s.id);
          const isSource = s.id === from;
          return (
            <div
              key={s.id}
              className={`min-w-0 rounded-xl border px-3 py-3 ${isSource ? "border-ink bg-paper-dim" : "border-line"}`}
            >
              <p className="text-meta uppercase text-ink-faint">{s.label}</p>
              <p className="mt-1 text-xl tabular-nums text-ink">{hit?.value ?? "—"}</p>
              {s.id === "EU" && domain === "top" && (
                <button type="button" onClick={() => setEuOpen((v) => !v)} aria-expanded={euOpen}
                  className="mt-1.5 text-xs font-medium text-brand hover:underline">
                  {euOpen ? t("converter.euLess") : t("converter.euMore")}
                </button>
              )}
            </div>
          );
        })}
      </div>
      {euOpen && domain === "top" && (
        countries.length > 0 ? (
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {countries.map((s) => {
              const hit = rows.find((r) => r.scaleId === s.id);
              return (
                <div key={s.id} className={`min-w-0 rounded-xl border border-dashed px-3 py-2.5 ${s.id === from ? "border-ink bg-paper-dim" : "border-line"}`}>
                  <p className="text-meta uppercase text-ink-faint">EU › {s.label}</p>
                  <p className="mt-0.5 text-lg tabular-nums text-ink">{hit?.value ?? "—"}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="mt-3 text-xs text-ink-soft">{t("converter.mensCountries")}</p>
        )
      )}
      {euOpen && domain === "top" && countries.length > 0 && (
        <p className="mt-2 text-xs text-ink-soft">{t("converter.womensEu")}</p>
      )}

      <p className="mt-4 text-[11px] text-ink-faint">{t("converter.note")}</p>
    </div>
  );
}

