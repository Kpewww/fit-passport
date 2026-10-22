"use client";

// Which country's sizes a closet piece's label uses (Session 101). Stored in the
// item's `region`; empty means "automatic": the brand's country from the registry.
// The engine reads a label by its regime (sizeRegimes.ts), so a Japanese XL is no
// longer taken for an American one.

import { useEffect, useState } from "react";
import { useT } from "@/i18n/client";
import type { Regime } from "@/lib/sizeRegimes";

export const REGIMES: readonly Regime[] = ["CN", "JP", "KR", "US", "UK", "AU", "IT", "FR", "EU"];

export function RegimePicker({ brand, value, onChange }: { brand: string; value: string; onChange: (v: string) => void }) {
  const t = useT("closet");
  const [auto, setAuto] = useState<Regime | null>(null);
  useEffect(() => {
    setAuto(null);
    const b = brand.trim();
    if (b.length < 2) return;
    const ctl = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/brands?name=${encodeURIComponent(b)}`, { signal: ctl.signal })
        .then((r) => (r.ok ? r.json() : null))
        .then((j: { regime?: Regime | null } | null) => setAuto(j?.regime ?? null))
        .catch(() => {});
    }, 250);
    return () => { clearTimeout(timer); ctl.abort(); };
  }, [brand]);
  return (
    <div>
      <p className="mb-1 text-xs font-medium text-ink-soft">{t("regime.label")}</p>
      <select
        className="h-9 w-full rounded-lg border border-line bg-white px-2 text-sm text-ink"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{auto ? t("regime.autoFrom", { country: t(`regime.${auto}`) }) : t("regime.auto")}</option>
        {REGIMES.map((r) => <option key={r} value={r}>{t(`regime.${r}`)}</option>)}
      </select>
      <p className="mt-1 text-[11px] text-ink-faint">{t("regime.hint")}</p>
    </div>
  );
}
