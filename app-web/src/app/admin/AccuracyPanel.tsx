"use client";

// Was the recommended size right (Session 103): data from /api/admin/accuracy,
// the rule in lib/pilotAccuracy.ts.

import { useEffect, useState } from "react";
import { Card } from "@/components/ui";
import { useT } from "@/i18n/client";
import type { Accuracy } from "@/lib/pilotAccuracy";

const pct = (a: number, b: number) => Math.round((a / b) * 100);

export function AccuracyPanel() {
  const t = useT("admin");
  const [d, setD] = useState<Accuracy | null>(null);
  useEffect(() => {
    fetch("/api/admin/accuracy").then((r) => (r.ok ? r.json() : null)).then(setD).catch(() => {});
  }, []);
  if (!d) return null;
  const v = d.verdicts;
  const exactN = v.hit + v.miss;
  return (
    <section className="mt-8 space-y-4">
      <h2 className="text-h3 text-ink">{t("pilot.accuracy.title")}</h2>
      <Card className="!p-4 space-y-2 text-sm">
        <p className="text-xs text-ink-soft">{t("pilot.accuracy.intro")}</p>
        {d.judged === 0 ? (
          <p className="text-ink-faint">{t("pilot.accuracy.none")}</p>
        ) : (
          <>
            <p className="font-medium text-ink">
              {exactN ? t("pilot.accuracy.exact", { hits: v.hit, n: exactN, pct: pct(v.hit, exactN) }) : t("pilot.accuracy.exactNone")}
            </p>
            <p className="text-ink-soft">{t("pilot.accuracy.judged", { judged: d.judged, outcomes: d.outcomes, followed: d.followed })}</p>
            {v["right-side"] + v["wrong-side"] > 0 && (
              <p className="text-ink-soft">{t("pilot.accuracy.side", { right: v["right-side"], wrong: v["wrong-side"] })}</p>
            )}
            {v["no-signal"] > 0 && <p className="text-ink-faint">{t("pilot.accuracy.noSignal", { n: v["no-signal"] })}</p>}
            {exactN > 0 && (
              <>
                <table className="mt-2 w-full text-left text-xs">
                  <thead className="text-ink-faint">
                    <tr><th className="py-1 font-medium">{t("pilot.accuracy.band")}</th><th className="font-medium">{t("pilot.accuracy.bandN")}</th><th className="font-medium">{t("pilot.accuracy.bandHit")}</th></tr>
                  </thead>
                  <tbody>
                    {d.bands.map((b) => (
                      <tr key={b.from} className="border-t border-line">
                        <td className="py-1.5 font-mono">{Math.round(b.from * 100)}–{Math.round(b.to * 100)}%</td>
                        <td>{b.n}</td>
                        <td>{b.n ? `${b.hits} (${pct(b.hits, b.n)}%)` : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-[11px] text-ink-faint">{t("pilot.accuracy.bandNote")}</p>
              </>
            )}
          </>
        )}
      </Card>
    </section>
  );
}
