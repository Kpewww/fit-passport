"use client";

// Add several pieces at once — Session 88c.
//
// Pick or paste several photos; each becomes a row with the four answers the
// single-piece flow asks (brand, type, size, how it sits — addFlow.ts ADD_STEPS),
// and "same as above" copies the row before it, because a batch is usually several
// pieces from one brand or one drawer. Rows are saved one by one, so a bad row is
// marked and kept while the good ones go in.

import { useState } from "react";
import { Button, inputClass } from "@/components/ui";
import { BrandInput } from "@/components/BrandInput";
import { CategoryPicker } from "@/components/CategoryPicker";
import { PhotoSource } from "@/components/PhotoSource";
import { Close } from "@/components/Icon";
import { resizeGarmentPhoto } from "@/lib/imageResize";
import { isValidSize } from "@/lib/sizeSystems";
import { DIRECTION_DEFAULT, DIRECTION_OPTIONS, ratingFromDirection } from "@/lib/fitDirection";
import { useT } from "@/i18n/client";
import type { DirectionKey } from "@/lib/engineText";

/** At most this many photos per batch — the closet's write limit is 120 per 10 minutes. */
export const MAX_BATCH = 20;

type Row = {
  key: string;
  photo: string;
  brand: string;
  category: string;
  size: string;
  fitDirection: number;
  error?: string;
};

export function BatchAdd({ onClose, onAdded }: { onClose: () => void; onAdded: (n: number) => void }) {
  const t = useT("closet");
  const tf = useT("fit");
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  async function addPhotos(blobs: Blob[]) {
    const room = MAX_BATCH - rows.length;
    if (room <= 0) { setNote(t("batchFull", { n: MAX_BATCH })); return; }
    const take = blobs.slice(0, room);
    if (blobs.length > room) setNote(t("batchFull", { n: MAX_BATCH }));
    const photos = await Promise.all(take.map((b) => resizeGarmentPhoto(b).catch(() => null)));
    setRows((prev) => {
      const last = prev[prev.length - 1];
      return [
        ...prev,
        ...photos.filter((p): p is string => !!p).map((photo, i) => ({
          key: `${Date.now()}-${i}`,
          photo,
          // A new row starts from the one before it: one brand, one drawer.
          brand: last?.brand ?? "",
          category: last?.category ?? "tshirt",
          size: "",
          fitDirection: DIRECTION_DEFAULT,
        })),
      ];
    });
  }

  const set = (key: string, patch: Partial<Row>) =>
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch, error: undefined } : r)));

  function sameAsAbove(i: number) {
    const above = rows[i - 1];
    if (above) set(rows[i].key, { brand: above.brand, category: above.category, size: above.size, fitDirection: above.fitDirection });
  }

  const problem = (r: Row) =>
    !r.brand.trim() ? t("batchNeedBrand") : !isValidSize(r.category, r.size.trim()) ? t("batchNeedSize") : null;

  async function saveAll() {
    setBusy(true);
    let saved = 0;
    const left: Row[] = [];
    for (const r of rows) {
      const why = problem(r);
      if (why) { left.push({ ...r, error: why }); continue; }
      const res = await fetch("/api/closet", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          brand: r.brand.trim(),
          category: r.category,
          size: r.size.trim(),
          fitDirection: r.fitDirection,
          fitRating: ratingFromDirection(r.fitDirection),
          imageDataUrl: r.photo,
          photoFrom: "own",
        }),
      }).catch(() => null);
      if (res?.ok) saved++;
      else left.push({ ...r, error: t("batchSaveFailed") });
    }
    setBusy(false);
    setRows(left);
    if (saved) onAdded(saved);
    setNote(left.length ? t("batchSomeLeft", { saved, left: left.length }) : null);
    if (!left.length) onClose();
  }

  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-line sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-ink">{t("batchTitle")}</p>
          <p className="mt-0.5 text-sm text-ink-soft">{t("batchIntro", { n: MAX_BATCH })}</p>
        </div>
        <button type="button" onClick={onClose} aria-label={t("cancel")} className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-ink-faint hover:text-ink">
          <Close size={18} />
        </button>
      </div>

      <PhotoSource multiple onPick={addPhotos} className="mt-4" />

      {rows.length > 0 && (
        <ul className="mt-5 space-y-3">
          {rows.map((r, i) => (
            <li key={r.key} className={`grid min-w-0 gap-3 rounded-xl p-3 ring-1 sm:grid-cols-[64px_minmax(0,1.3fr)_minmax(0,1.2fr)_minmax(0,0.8fr)_minmax(0,1fr)_auto] sm:items-start ${r.error ? "ring-bad/50" : "ring-line"}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={r.photo} alt="" className="h-20 w-16 rounded-lg object-cover" />
              <label className="min-w-0 text-xs text-ink-soft">
                {t("brand")}
                <BrandInput value={r.brand} onChange={(v) => set(r.key, { brand: v })} />
              </label>
              <label className="min-w-0 text-xs text-ink-soft">
                {t("type")}
                <CategoryPicker value={r.category} onChange={(v) => set(r.key, { category: v })} />
              </label>
              <label className="min-w-0 text-xs text-ink-soft">
                {t("size")}
                <input className={inputClass} value={r.size} onChange={(e) => set(r.key, { size: e.target.value })} />
              </label>
              <label className="min-w-0 text-xs text-ink-soft">
                {t("howSits")}
                <select className={inputClass} value={r.fitDirection} onChange={(e) => set(r.key, { fitDirection: Number(e.target.value) })}>
                  {DIRECTION_OPTIONS.map((o) => (
                    <option key={o.key} value={o.value}>{tf(`direction.${o.key as DirectionKey}.label`)}</option>
                  ))}
                </select>
              </label>
              <div className="flex gap-3 text-xs sm:flex-col sm:pt-5">
                {i > 0 && <button type="button" onClick={() => sameAsAbove(i)} className="font-medium text-brand hover:underline">{t("batchSameAbove")}</button>}
                <button type="button" onClick={() => setRows((prev) => prev.filter((x) => x.key !== r.key))} className="text-ink-faint hover:text-bad">{t("remove")}</button>
              </div>
              {r.error && <p className="text-xs text-bad sm:col-span-6">{r.error}</p>}
            </li>
          ))}
        </ul>
      )}

      {note && <p className="mt-3 text-xs text-ink-soft">{note}</p>}
      {rows.length > 0 && (
        <div className="mt-4 flex gap-2">
          <Button onClick={saveAll} disabled={busy}>{busy ? t("saving") : t("batchSaveN", { n: rows.length })}</Button>
          <Button variant="ghost" onClick={onClose}>{t("cancel")}</Button>
        </div>
      )}
    </div>
  );
}
