"use client";

// Enter a brand's own size guide, typed from its page (Session 101h, admin only).
// For brands whose site refuses a program (fetch-strategy.md §2): a person opens the
// page and types the numbers exactly as printed. Feeds brand calibration.

import { useCallback, useEffect, useState } from "react";
import { Button, Card, inputClass } from "@/components/ui";
import { BrandInput } from "@/components/BrandInput";
import { useT } from "@/i18n/client";

type Row = { label: string; chestMin: string; chestMax: string; waistMin: string; waistMax: string };
type Entry = { id: string; brand: string; line: string; kind: string; units: string; sourceUrl: string; capturedAt: string; rows: Array<Record<string, number | string>> };
const LABELS = ["XS", "S", "M", "L", "XL", "XXL"];
const blank = (): Row[] => LABELS.map((label) => ({ label, chestMin: "", chestMax: "", waistMin: "", waistMax: "" }));
const n = (v: string) => (v.trim() === "" ? undefined : Number(v));

export function BrandChartForm() {
  const t = useT("admin");
  const [brand, setBrand] = useState("");
  const [line, setLine] = useState("mens");
  const [kind, setKind] = useState("body");
  const [units, setUnits] = useState("in");
  const [url, setUrl] = useState("");
  const [rows, setRows] = useState<Row[]>(blank);
  const [note, setNote] = useState<string | null>(null);
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [busy, setBusy] = useState(false);
  const load = useCallback(() => {
    fetch("/api/admin/brand-charts").then((r) => (r.ok ? r.json() : null)).then((j) => setEntries(j?.entries ?? null)).catch(() => {});
  }, []);
  useEffect(load, [load]);
  if (!entries) return null;

  const set = (i: number, k: keyof Row, v: string) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, [k]: v } : r)));
  async function save() {
    setBusy(true); setNote(null);
    const filled = rows.filter((r) => r.label.trim() && (r.chestMin || r.chestMax || r.waistMin || r.waistMax))
      .map((r) => ({ label: r.label.trim(), chestMin: n(r.chestMin), chestMax: n(r.chestMax), waistMin: n(r.waistMin), waistMax: n(r.waistMax) }));
    const r = await fetch("/api/admin/brand-charts", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ brand, line, kind, units, sourceUrl: url.trim(), rows: filled }),
    }).catch(() => null);
    setBusy(false);
    if (r?.ok) { setNote(t("chart.saved")); setRows(blank()); setUrl(""); load(); }
    else setNote(t("chart.invalid"));
  }
  async function remove(id: string) {
    await fetch("/api/admin/brand-charts", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, delete: true }) }).catch(() => null);
    load();
  }
  const sel = "h-9 rounded-lg border border-line bg-white px-2 text-sm text-ink";
  return (
    <section className="mt-8">
      <h2 className="text-h3 text-ink">{t("chart.title")}</h2>
      <Card className="mt-3 !p-4">
        <p className="text-xs text-ink-soft">{t("chart.intro")}</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="min-w-0"><BrandInput value={brand} onChange={setBrand} /></div>
          <input className={inputClass} placeholder={t("chart.url")} value={url} onChange={(e) => setUrl(e.target.value)} />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <select className={sel} value={line} onChange={(e) => setLine(e.target.value)}>
            <option value="mens">{t("chart.mens")}</option><option value="womens">{t("chart.womens")}</option>
          </select>
          <select className={sel} value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="body">{t("chart.body")}</option><option value="garment">{t("chart.garment")}</option>
          </select>
          <select className={sel} value={units} onChange={(e) => setUnits(e.target.value)}>
            <option value="in">{t("chart.inches")}</option><option value="cm">cm</option>
          </select>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[480px] text-xs">
            <thead className="text-left text-ink-faint">
              <tr><th className="pr-2">{t("chart.size")}</th><th className="pr-2">{t("chart.chestMin")}</th><th className="pr-2">{t("chart.chestMax")}</th><th className="pr-2">{t("chart.waistMin")}</th><th>{t("chart.waistMax")}</th></tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  {(["label", "chestMin", "chestMax", "waistMin", "waistMax"] as const).map((k) => (
                    <td key={k} className="py-0.5 pr-2">
                      <input className="h-8 w-full min-w-0 rounded-md border border-line px-2" inputMode={k === "label" ? "text" : "decimal"} value={r[k]} onChange={(e) => set(i, k, e.target.value)} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button size="sm" disabled={busy || !brand.trim() || !url.trim()} onClick={save}>{t("chart.save")}</Button>
          <button type="button" className="text-xs text-ink-soft underline" onClick={() => setRows((rs) => [...rs, { label: "", chestMin: "", chestMax: "", waistMin: "", waistMax: "" }])}>{t("chart.addRow")}</button>
          {note && <span className="text-xs text-ink">{note}</span>}
        </div>
        {entries.length > 0 && (
          <ul className="mt-4 space-y-1 border-t border-line pt-3 text-xs">
            {entries.map((e) => (
              <li key={e.id} className="flex min-w-0 items-center gap-2">
                <span className="min-w-0 truncate text-ink">{e.brand} · {e.line} · {e.kind} · {e.units} · {e.rows.map((r) => r.label).join("/")}</span>
                <a className="shrink-0 text-ink-faint underline" href={e.sourceUrl} target="_blank" rel="noreferrer">{t("chart.source")}</a>
                <button type="button" className="shrink-0 text-ink-faint hover:text-bad" onClick={() => remove(e.id)}>{t("chart.remove")}</button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </section>
  );
}
