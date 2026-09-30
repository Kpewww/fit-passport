"use client";

// /saved — the to-buy list (Session 80).
//
// Products saved from a store page with the browser extension. They are NOT in
// the closet: nothing that learns or counts reads them (SavedItem schema comment).
// The one way out is "Bought it — add to closet", which runs the closet's own add
// flow so the user confirms the size they bought and says how it fits.

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useT } from "@/i18n/client";
import { useGarmentText } from "@/i18n/garment";
import { Button, Card, EmptyState, LinkButton, Page, PageHeader, inputClass } from "@/components/ui";
import { ArrowUpRight, Plus } from "@/components/Icon";

type Saved = {
  id: string;
  url: string;
  retailer: string | null;
  brand: string | null;
  productName: string | null;
  category: string | null;
  size: string | null;
  sizes: string[];
  note: string | null;
  productId: string | null;
  recommendation: { size: string; confidence: number } | null;
  createdAt: string;
};

export default function SavedPage() {
  const t = useT("saved");
  const [items, setItems] = useState<Saved[] | null>(null);

  const load = useCallback(() => {
    fetch("/api/saved")
      .then((r) => r.json())
      .then((j) => setItems(Array.isArray(j.items) ? j.items : []))
      .catch(() => setItems([]));
  }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <Page>
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        lede={t("lede")}
        action={<LinkButton href="/closet" variant="secondary">{t("closet")}</LinkButton>}
      />
      <div className="mt-10">
        {items == null ? (
          <p className="text-sm text-ink-faint">{t("loading")}</p>
        ) : items.length === 0 ? (
          <EmptyState
            title={t("emptyTitle")}
            body={t("emptyBody")}
            action={<LinkButton href="/extension" arrow>{t("emptyCta")}</LinkButton>}
          />
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {items.map((it) => (
              <li key={it.id} className="min-w-0">
                <SavedCard item={it} onChange={load} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </Page>
  );
}

function SavedCard({ item, onChange }: { item: Saved; onChange: () => void }) {
  const t = useT("saved");
  const g = useGarmentText();
  const locale = useLocale();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ productName: item.productName ?? "", brand: item.brand ?? "", size: item.size ?? "", note: item.note ?? "" });
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const name = item.productName || t("untitled");
  const meta = [item.brand, item.category && g.label(item.category), item.retailer && item.retailer !== item.brand ? item.retailer : null]
    .filter(Boolean)
    .join(" · ");
  const date = new Date(item.createdAt).toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", { year: "numeric", month: "short", day: "numeric" });

  async function save() {
    setBusy(true);
    setFailed(false);
    const r = await fetch("/api/saved", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: item.id, ...draft }),
    }).catch(() => null);
    setBusy(false);
    if (!r || !r.ok) { setFailed(true); return; }
    setEditing(false);
    onChange();
  }

  async function remove() {
    if (!confirm(t("removeConfirm"))) return;
    const r = await fetch(`/api/saved?id=${encodeURIComponent(item.id)}`, { method: "DELETE" }).catch(() => null);
    if (r?.ok) onChange();
  }

  return (
    <Card className="flex h-full flex-col">
      {editing ? (
        <div className="grid gap-3">
          <label className="grid gap-1 text-xs text-ink-soft">
            {t("nameLabel")}
            <input className={inputClass} value={draft.productName} maxLength={200} onChange={(e) => setDraft({ ...draft, productName: e.target.value })} />
          </label>
          <label className="grid gap-1 text-xs text-ink-soft">
            {t("brandLabel")}
            <input className={inputClass} value={draft.brand} maxLength={80} onChange={(e) => setDraft({ ...draft, brand: e.target.value })} />
          </label>
          <label className="grid gap-1 text-xs text-ink-soft">
            {t("sizeLabel")}
            {item.sizes.length > 0 ? (
              <select className={inputClass} value={draft.size} onChange={(e) => setDraft({ ...draft, size: e.target.value })}>
                <option value="">{t("noSize")}</option>
                {item.sizes.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            ) : (
              <input className={inputClass} value={draft.size} maxLength={24} onChange={(e) => setDraft({ ...draft, size: e.target.value })} />
            )}
          </label>
          <label className="grid gap-1 text-xs text-ink-soft">
            {t("noteLabel")}
            <input className={inputClass} value={draft.note} maxLength={500} placeholder={t("notePlaceholder")} onChange={(e) => setDraft({ ...draft, note: e.target.value })} />
          </label>
          {failed && <p role="alert" className="text-sm text-bad">{t("saveFailed")}</p>}
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={save} disabled={busy}>{busy ? t("saving") : t("save")}</Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>{t("cancel")}</Button>
          </div>
        </div>
      ) : (
        <>
          <div className="min-w-0">
            <p className="break-words text-base font-medium text-ink">{name}</p>
            {meta && <p className="mt-0.5 truncate text-xs text-ink-soft">{meta}</p>}
          </div>
          <dl className="mt-4 grid gap-1.5 text-sm">
            <div className="flex flex-wrap gap-x-2">
              <dt className="text-ink-faint">{t("sizeLabel")}</dt>
              <dd className="font-medium text-ink">{item.size || t("noSize")}</dd>
            </div>
            {item.recommendation && (
              <div className="text-ink-soft">
                {t.rich("lastCheck", { b: (c) => <b className="font-medium text-ink">{c}</b> }, { size: item.recommendation.size, pct: Math.round(item.recommendation.confidence * 100) })}
              </div>
            )}
            {item.note && <div className="break-words text-ink-soft">{item.note}</div>}
          </dl>
          <p className="mt-3 text-[11px] text-ink-faint">{t("savedOn", { date })}</p>
          <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 pt-5 text-sm">
            <LinkButton href={`/closet?fromSaved=${encodeURIComponent(item.id)}`} size="sm" icon={<Plus size={16} />}>{t("bought")}</LinkButton>
            {item.productId && (
              <Link href={`/check?product=${encodeURIComponent(item.productId)}`} className="text-brand hover:underline">{t("viewCheck")}</Link>
            )}
            <a href={item.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-ink-soft hover:text-ink">
              {t("openStore")} <ArrowUpRight size={14} />
            </a>
            <span className="ml-auto flex gap-3">
              <button type="button" onClick={() => setEditing(true)} className="text-ink-soft hover:text-ink">{t("edit")}</button>
              <button type="button" onClick={remove} className="text-ink-soft hover:text-bad">{t("remove")}</button>
            </span>
          </div>
        </>
      )}
    </Card>
  );
}
