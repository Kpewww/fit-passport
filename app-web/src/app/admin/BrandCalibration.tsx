"use client";

// Brands' own size charts against their country's standard (Session 101e, admin only).
// Grade B evidence, built from charts ordinary checks already read.

import { useEffect, useState } from "react";
import { Card } from "@/components/ui";
import { useT } from "@/i18n/client";

type Row = { label: string; pages: number; medianMidCm: number; offsetCm: number | null; offsetSteps: number | null; standard: { source: string } | null };
type Report = { brand: string; country: string | null; regime: string | null; line: string; pages: number; urls: string[]; sizes: Row[]; runs: number | null };
type Data = { observations: number; brands: Report[]; usLetters: { mens: Record<string, { midCm: number; brands: number }>; womens: Record<string, { midCm: number; brands: number }> } };

export function BrandCalibration() {
  const t = useT("admin");
  const [d, setD] = useState<Data | null>(null);
  useEffect(() => { fetch("/api/admin/calibration").then((r) => (r.ok ? r.json() : null)).then(setD).catch(() => {}); }, []);
  if (!d) return null;
  const us = Object.entries(d.usLetters.mens);
  return (
    <section className="mt-8">
      <h2 className="text-h3 text-ink">{t("cal.title")}</h2>
      <Card className="mt-3 !p-4">
        <p className="text-xs text-ink-soft">{t("cal.intro", { obs: d.observations, brands: d.brands.length })}</p>
        <p className="mt-2 text-xs text-ink-soft">
          {us.length ? t("cal.usOn", { list: us.map(([l, v]) => `${l} ${v.midCm} cm (${v.brands})`).join(", ") }) : t("cal.usOff")}
        </p>
        {d.brands.length > 0 && (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-xs">
              <thead className="text-ink-faint">
                <tr><th className="py-1 pr-3">{t("cal.brand")}</th><th className="pr-3">{t("cal.pages")}</th><th className="pr-3">{t("cal.runs")}</th><th>{t("cal.sizes")}</th></tr>
              </thead>
              <tbody>
                {d.brands.map((b) => (
                  <tr key={`${b.brand}|${b.line}`} className="border-t border-line align-top">
                    <td className="py-1.5 pr-3 text-ink">{b.brand} <span className="text-ink-faint">{b.country ?? "?"} · {b.line}</span></td>
                    <td className="pr-3">{b.pages}</td>
                    <td className="pr-3">{b.runs == null ? t("cal.noStandard") : t("cal.steps", { n: b.runs > 0 ? `+${b.runs}` : String(b.runs) })}</td>
                    <td className="text-ink-soft">{b.sizes.map((s) => `${s.label} ${s.medianMidCm}${s.offsetCm != null ? ` (${s.offsetCm > 0 ? "+" : ""}${s.offsetCm})` : ""}`).join(" · ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </section>
  );
}
