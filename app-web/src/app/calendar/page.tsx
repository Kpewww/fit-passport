"use client";

// The wear calendar (Session 104, docs/plans/product-upgrade-2026-10-24.md, phase 1).
//
// What was worn, day by day, from the wearer's own closet. Logging a worn day then
// asks one thing per piece, "does it still fit?" — snug / just right / roomy / skip —
// which goes to the closet through the same writer as Fit Refresh (lib/comfort.ts).
// A planned day counts for nothing until it is confirmed as worn.

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Close, Plus, Trash } from "@/components/Icon";
import { Button, Card, Chip, Page, PageHeader, inputClass } from "@/components/ui";
import { GarmentIcon } from "@/components/GarmentIcon";
import { useLocale, useT } from "@/i18n/client";
import { pluralKey } from "@/i18n/format";
import { useGarmentText } from "@/i18n/garment";
import { dayDiff, localDay, monthGrid, shiftMonth } from "@/lib/localDay";

type Piece = { id: string; brand: string; displayName: string | null; category: string; color: string | null; size: string; imageDataUrl: string | null };
type Log = { id: string; day: string; status: "worn" | "planned"; note: string | null; outfitId: string | null; outfitTitle: string | null; items: Piece[] };
type Outfit = { id: string; title: string; items: Array<{ brand: string | null; category: string; size: string | null }> };

/** The signed fit scale's one-tap answers (lib/fitDirection.ts: snug −5, just right 0, roomy +5). */
const FIT_TAPS = [
  { key: "tight", direction: -5 },
  { key: "right", direction: 0 },
  { key: "loose", direction: 5 },
] as const;

function Thumb({ p, size = 28 }: { p: Piece; size?: number }) {
  return p.imageDataUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={p.imageDataUrl} alt="" width={size} height={size} className="flex-shrink-0 rounded object-cover" style={{ width: size, height: size }} />
  ) : (
    <span className="flex flex-shrink-0 items-center justify-center rounded bg-paper-dim" style={{ width: size, height: size }}>
      <GarmentIcon category={p.category} size={Math.round(size * 0.65)} className="text-ink-soft" />
    </span>
  );
}

function CalendarInner() {
  const t = useT("calendar");
  const g = useGarmentText();
  const locale = useLocale();
  const params = useSearchParams();
  const today = localDay();
  const initial = /^\d{4}-\d{2}-\d{2}$/.test(params.get("day") ?? "") ? params.get("day")! : today;
  const [ym, setYm] = useState({ year: Number(initial.slice(0, 4)), month: Number(initial.slice(5, 7)) });
  const [selected, setSelected] = useState<string>(initial);
  const [logs, setLogs] = useState<Log[]>([]);
  const [closet, setCloset] = useState<Piece[] | null>(null);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  // The log form
  const [composing, setComposing] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  // After saving a worn day: one fit question per piece
  const [asking, setAsking] = useState<{ log: Log; done: Record<string, "answered" | "skipped"> } | null>(null);
  const [lastRemoved, setLastRemoved] = useState<Log | null>(null);

  const grid = useMemo(() => monthGrid(ym.year, ym.month), [ym]);
  const from = grid.flat().find(Boolean)!;
  const to = [...grid.flat()].reverse().find(Boolean)!;

  const load = useCallback(() => {
    fetch(`/api/wear?from=${from}&to=${to}`).then((r) => (r.ok ? r.json() : { logs: [] })).then((d) => setLogs(d.logs ?? [])).catch(() => {});
  }, [from, to]);
  useEffect(load, [load]);
  useEffect(() => {
    fetch("/api/closet").then((r) => r.json()).then((d) => setCloset(d.items ?? [])).catch(() => setCloset([]));
    fetch("/api/outfits?mine=1").then((r) => r.json()).then((d) => setOutfits(d.outfits ?? [])).catch(() => {});
  }, []);

  const byDay = useMemo(() => {
    const m = new Map<string, Log[]>();
    for (const l of logs) m.set(l.day, [...(m.get(l.day) ?? []), l]);
    return m;
  }, [logs]);

  const future = dayDiff(today, selected) > 0;
  const monthName = new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", { month: locale === "zh" ? "short" : "long" }).format(new Date(ym.year, ym.month - 1, 1));
  const weekdays = t("weekdays").split(",");

  function openDay(day: string) {
    setSelected(day);
    setComposing(false);
    setAsking(null);
    setError(false);
  }
  function startLog() {
    setComposing(true);
    setPicked([]);
    setNote("");
    setSearch("");
    setError(false);
  }
  function fromOutfit(id: string) {
    const o = outfits.find((x) => x.id === id);
    if (!o || !closet) return;
    // A saved outfit's pieces, matched to the closet by brand, garment and size.
    const ids = o.items
      .map((it) => closet.find((c) => c.brand === it.brand && c.category === it.category && (!it.size || c.size === it.size))?.id)
      .filter((x): x is string => !!x);
    setPicked([...new Set(ids)]);
  }

  async function save() {
    if (!picked.length) return;
    setBusy(true);
    setError(false);
    try {
      const r = await fetch("/api/wear", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ day: selected, status: future ? "planned" : "worn", itemIds: picked, note: note.trim() || null }),
      });
      if (!r.ok) throw new Error();
      const { log } = (await r.json()) as { log: Log };
      setLogs((prev) => [...prev, log]);
      setComposing(false);
      if (log.status === "worn") setAsking({ log, done: {} });
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  async function answer(log: Log, itemId: string, direction: number | null) {
    setAsking((a) => (a ? { ...a, done: { ...a.done, [itemId]: direction == null ? "skipped" : "answered" } } : a));
    if (direction == null) return;
    const r = await fetch("/api/wear", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: log.id, fits: [{ itemId, direction }] }),
    }).catch(() => null);
    if (!r?.ok) setError(true);
  }

  async function confirm(log: Log) {
    const r = await fetch("/api/wear", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: log.id, status: "worn" }) }).catch(() => null);
    if (!r?.ok) return setError(true);
    const { log: next } = (await r.json()) as { log: Log };
    setLogs((prev) => prev.map((l) => (l.id === next.id ? next : l)));
    setAsking({ log: next, done: {} });
  }

  async function remove(log: Log) {
    const r = await fetch(`/api/wear?id=${encodeURIComponent(log.id)}`, { method: "DELETE" }).catch(() => null);
    if (!r?.ok) return setError(true);
    setLogs((prev) => prev.filter((l) => l.id !== log.id));
    setLastRemoved(log);
    if (asking?.log.id === log.id) setAsking(null);
  }

  async function undoRemove() {
    const l = lastRemoved;
    if (!l) return;
    setLastRemoved(null);
    const r = await fetch("/api/wear", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ day: l.day, status: l.status, itemIds: l.items.map((i) => i.id), outfitId: l.outfitId, note: l.note }),
    }).catch(() => null);
    if (!r?.ok) setError(true);
    load();
  }

  const dayLogs = byDay.get(selected) ?? [];
  const filtered = (closet ?? []).filter((c) => {
    const q = search.trim().toLowerCase();
    return !q || [c.brand, c.displayName, c.category, g.label(c.category), c.color, c.size].some((v) => v?.toLowerCase().includes(q));
  });
  const allAnswered = asking && asking.log.items.every((p) => asking.done[p.id]);

  return (
    <Page>
      <PageHeader eyebrow={t("eyebrow")} title={t("title")} lede={t("lede")} />

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        {/* The month */}
        <Card className="!p-3 sm:!p-5">
          <div className="flex items-center justify-between">
            <button type="button" aria-label={t("prev")} onClick={() => setYm(shiftMonth(ym.year, ym.month, -1))} className="flex h-11 w-11 items-center justify-center rounded-full text-ink-soft hover:bg-paper-soft hover:text-ink">
              <ArrowLeft size={20} />
            </button>
            <div className="text-center">
              <p className="font-serif text-h3 text-ink">{t("monthTitle", { month: monthName, year: ym.year })}</p>
              {(ym.year !== Number(today.slice(0, 4)) || ym.month !== Number(today.slice(5, 7))) && (
                <button type="button" onClick={() => { setYm({ year: Number(today.slice(0, 4)), month: Number(today.slice(5, 7)) }); openDay(today); }} className="text-xs text-brand hover:underline">
                  {t("today")}
                </button>
              )}
            </div>
            <button type="button" aria-label={t("next")} onClick={() => setYm(shiftMonth(ym.year, ym.month, 1))} className="flex h-11 w-11 items-center justify-center rounded-full text-ink-soft hover:bg-paper-soft hover:text-ink">
              <ArrowRight size={20} />
            </button>
          </div>

          <div role="grid" className="mt-3">
            <div role="row" className="grid grid-cols-7 text-center text-[11px] text-ink-faint">
              {weekdays.map((w) => <div key={w} role="columnheader" className="py-1">{w}</div>)}
            </div>
            {grid.map((row, i) => (
              <div key={i} role="row" className="grid grid-cols-7 gap-1">
                {row.map((day, j) => {
                  if (!day) return <div key={j} role="gridcell" />;
                  const ls = byDay.get(day) ?? [];
                  const pieces = ls.flatMap((l) => l.items);
                  const planned = ls.length > 0 && ls.every((l) => l.status === "planned");
                  const isSel = day === selected;
                  return (
                    <button
                      key={day}
                      role="gridcell"
                      type="button"
                      aria-selected={isSel}
                      aria-label={`${day}${ls.length ? ` · ${planned ? t("planned") : t("worn")} ${pieces.length}` : ""}`}
                      onClick={() => openDay(day)}
                      className={`flex min-h-[64px] flex-col items-center gap-1 rounded-xl border p-1 text-xs transition-colors sm:min-h-[80px] ${
                        isSel ? "border-ink bg-paper-soft" : "border-transparent hover:border-line"
                      } ${planned ? "border-dashed !border-line" : ""}`}
                    >
                      <span className={`leading-none ${day === today ? "rounded-full bg-ink px-1.5 py-0.5 text-paper" : "text-ink-soft"}`}>{Number(day.slice(8))}</span>
                      {pieces.length > 0 && (
                        <span className={`flex flex-wrap justify-center gap-0.5 ${planned ? "opacity-60" : ""}`}>
                          {pieces.slice(0, 2).map((p) => <Thumb key={p.id + day} p={p} size={20} />)}
                          {pieces.length > 2 && <span className="text-[10px] text-ink-faint">+{pieces.length - 2}</span>}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </Card>

        {/* The day */}
        <Card className="!p-5">
          <p className="font-serif text-h3 text-ink">{new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", { weekday: "long", month: "long", day: "numeric" }).format(new Date(`${selected}T12:00:00`))}</p>

          {lastRemoved && (
            <p className="mt-3 text-xs text-ink-soft">
              {t("removed")} <button type="button" onClick={undoRemove} className="font-medium text-brand hover:underline">{t("undo")}</button>
            </p>
          )}

          {/* What this day holds */}
          {dayLogs.length === 0 && !composing && <p className="mt-3 text-sm text-ink-faint">{t("nothing")}</p>}
          <ul className="mt-3 space-y-3">
            {dayLogs.map((l) => (
              <li key={l.id} className={`rounded-xl border p-3 ${l.status === "planned" ? "border-dashed border-line" : "border-line"}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">{l.status === "planned" ? t("planned") : t("worn")}</span>
                  <span className="flex gap-1">
                    {l.status === "planned" && dayDiff(today, l.day) <= 0 && (
                      <Button size="sm" variant="secondary" onClick={() => confirm(l)}><Check size={16} />{t("confirm")}</Button>
                    )}
                    <button type="button" aria-label={t("remove")} onClick={() => remove(l)} className="flex h-9 w-9 items-center justify-center rounded-full text-ink-faint hover:bg-paper-soft hover:text-ink">
                      <Trash size={16} />
                    </button>
                  </span>
                </div>
                {l.outfitTitle && <p className="mt-1 text-xs text-ink-soft">{t("outfitFrom", { title: l.outfitTitle })}</p>}
                <ul className="mt-2 space-y-1.5">
                  {l.items.map((p) => (
                    <li key={p.id} className="flex items-center gap-2 text-xs">
                      <Thumb p={p} />
                      <span className="min-w-0 truncate"><span className="font-medium text-ink">{p.displayName || p.brand}</span> <span className="text-ink-faint">· {g.label(p.category)} · {p.size}</span></span>
                    </li>
                  ))}
                </ul>
                {l.note && <p className="mt-2 text-xs text-ink-soft">{l.note}</p>}
              </li>
            ))}
          </ul>

          {/* Does it still fit? — one tap per piece, after a worn day is saved or confirmed */}
          {asking && (
            <div className="mt-4 rounded-xl bg-paper-soft p-3">
              <p className="text-sm font-medium text-ink">{t("fitTitle")}</p>
              <p className="mt-0.5 text-xs text-ink-soft">{t("fitHint")}</p>
              <ul className="mt-3 space-y-3">
                {asking.log.items.map((p) => (
                  <li key={p.id}>
                    <div className="flex items-center gap-2 text-xs"><Thumb p={p} size={24} /><span className="truncate font-medium text-ink">{p.displayName || p.brand}</span></div>
                    {asking.done[p.id] ? (
                      <p className="mt-1 text-[11px] text-ink-faint">{asking.done[p.id] === "answered" ? <Check size={14} label={t("fitSaved")} /> : t("skip")}</p>
                    ) : (
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {FIT_TAPS.map((f) => <Chip key={f.key} onClick={() => answer(asking.log, p.id, f.direction)}>{t(f.key)}</Chip>)}
                        <Chip onClick={() => answer(asking.log, p.id, null)}>{t("skip")}</Chip>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
              {allAnswered && (
                <p className="mt-3 text-xs text-ink-soft">{t("fitSaved")} <button type="button" onClick={() => setAsking(null)} className="text-brand hover:underline"><Close size={14} className="-mt-px inline" /></button></p>
              )}
            </div>
          )}

          {/* Log a day */}
          {!composing ? (
            <Button className="mt-4 w-full" onClick={startLog}><Plus size={18} />{future ? t("planDay") : t("logDay")}</Button>
          ) : (
            <div className="mt-4 space-y-3">
              <p className="text-sm font-medium text-ink">{future ? t("pickPlan") : t("pickPieces")}</p>
              {closet && closet.length === 0 ? (
                <p className="text-xs text-ink-soft">{t("closetEmpty")} <Link href="/closet" className="text-brand hover:underline">{t("toCloset")}</Link></p>
              ) : (
                <>
                  {outfits.length > 0 && (
                    <label className="block text-xs text-ink-soft">
                      {t("fromOutfit")}
                      <select className={inputClass + " mt-1"} defaultValue="" onChange={(e) => e.target.value && fromOutfit(e.target.value)}>
                        <option value="">{t("noOutfit")}</option>
                        {outfits.map((o) => <option key={o.id} value={o.id}>{o.title}</option>)}
                      </select>
                    </label>
                  )}
                  <input className={inputClass} placeholder={t("search")} value={search} onChange={(e) => setSearch(e.target.value)} />
                  <div className="grid max-h-72 grid-cols-1 gap-1.5 overflow-y-auto">
                    {filtered.map((c) => {
                      const on = picked.includes(c.id);
                      return (
                        <button key={c.id} type="button" aria-pressed={on}
                          onClick={() => setPicked((prev) => (on ? prev.filter((x) => x !== c.id) : [...prev, c.id]))}
                          className={`flex min-h-[44px] items-center gap-2 rounded-xl border px-2 py-1.5 text-left text-xs ${on ? "border-ink bg-paper-soft" : "border-line bg-white hover:border-ink/40"}`}>
                          <Thumb p={c} />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium text-ink">{c.displayName || c.brand}</span>
                            <span className="block truncate text-ink-faint">{g.label(c.category)} · {c.size}</span>
                          </span>
                          {on && <Check size={16} className="flex-shrink-0 text-ink" />}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-ink-faint">{t(pluralKey("picked", picked.length), { n: picked.length })}</p>
                  <input className={inputClass} placeholder={t("note")} maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} />
                  <div className="flex gap-2">
                    <Button className="flex-1" disabled={!picked.length || busy} onClick={save}>{busy ? t("saving") : t("save")}</Button>
                    <Button variant="secondary" onClick={() => setComposing(false)}>{t("cancel")}</Button>
                  </div>
                </>
              )}
            </div>
          )}
          {error && <p role="alert" className="mt-3 text-xs text-bad">{t("error")}</p>}
        </Card>
      </div>
    </Page>
  );
}

export default function CalendarPage() {
  return (
    <Suspense>
      <CalendarInner />
    </Suspense>
  );
}
