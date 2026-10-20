"use client";

// The pilot at a glance (Session 100): each event over 7 and 30 days, the commonest
// refusals and errors, and what people wrote in. Data from /api/admin/pilot.

import { useEffect, useState } from "react";
import { Card } from "@/components/ui";
import { useT } from "@/i18n/client";

type Pilot = {
  week: Record<string, number>;
  month: Record<string, number>;
  peopleThisWeek: number;
  refusals: Array<{ detail: string | null; n: number }>;
  feedback: Array<{ id: string; message: string; contact: string | null; path: string | null; locale: string | null; at: string }>;
};

export function PilotPanel() {
  const t = useT("admin");
  const [data, setData] = useState<Pilot | null>(null);
  useEffect(() => {
    fetch("/api/admin/pilot").then((r) => (r.ok ? r.json() : null)).then(setData).catch(() => {});
  }, []);
  if (!data) return null;
  const names = [...new Set([...Object.keys(data.month), ...Object.keys(data.week)])].sort();
  return (
    <section className="mt-8 space-y-4">
      <h2 className="text-h3 text-ink">{t("pilot.title")}</h2>
      <Card className="!p-4">
        <p className="text-xs text-ink-soft">{t("pilot.people", { n: data.peopleThisWeek })}</p>
        <table className="mt-3 w-full text-left text-xs">
          <thead className="text-ink-faint"><tr><th className="py-1 font-medium">{t("pilot.event")}</th><th className="font-medium">{t("pilot.week")}</th><th className="font-medium">{t("pilot.month")}</th></tr></thead>
          <tbody>
            {names.map((n) => (
              <tr key={n} className="border-t border-line"><td className="py-1.5 font-mono">{n}</td><td>{data.week[n] ?? 0}</td><td>{data.month[n] ?? 0}</td></tr>
            ))}
          </tbody>
        </table>
      </Card>
      {data.refusals.length > 0 && (
        <Card className="!p-4">
          <p className="text-xs font-medium text-ink">{t("pilot.refusals")}</p>
          <ul className="mt-2 space-y-1 text-xs text-ink-soft">
            {data.refusals.map((r) => <li key={r.detail ?? "-"}><span className="font-mono">{r.detail ?? "—"}</span> · {r.n}</li>)}
          </ul>
        </Card>
      )}
      <Card className="!p-4">
        <p className="text-xs font-medium text-ink">{t("pilot.feedback")}</p>
        {data.feedback.length === 0 ? (
          <p className="mt-2 text-xs text-ink-faint">{t("pilot.noFeedback")}</p>
        ) : (
          <ul className="mt-2 divide-y divide-line">
            {data.feedback.map((f) => (
              <li key={f.id} className="py-2.5 text-sm">
                <p className="whitespace-pre-wrap break-words text-ink">{f.message}</p>
                <p className="mt-1 text-[11px] text-ink-faint">{new Date(f.at).toLocaleString()} · {f.path ?? "—"} · {f.locale ?? "—"}{f.contact ? ` · ${f.contact}` : ""}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </section>
  );
}
