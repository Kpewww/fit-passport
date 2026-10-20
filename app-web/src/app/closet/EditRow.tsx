"use client";

import { useState } from "react";
import { Button, Card, Field, inputClass } from "@/components/ui";
import { BrandInput } from "@/components/BrandInput";
import { SizeInput } from "@/components/SizeInput";
import { CategoryPicker } from "@/components/CategoryPicker";
import { isValidSize } from "@/lib/sizeSystems";
import { GarmentIcon } from "@/components/GarmentIcon";
import { ColorPicker } from "@/components/ColorPicker";
import { ProductLinkCheck, type GarmentFields } from "@/components/ProductLinkCheck";
import { PhotoSource } from "@/components/PhotoSource";
import { resizeGarmentPhoto } from "@/lib/imageResize";
import { FitDirectionInput } from "@/components/FitDirectionInput";
import { DIRECTION_DEFAULT, ratingFromDirection } from "@/lib/fitDirection";
import { useT } from "@/i18n/client";
import { useGarmentText } from "@/i18n/garment";
import { Item, Collection, GENDERS, safeNotes, validUrl } from "./shared";

export function EditRow({
  item,
  collections,
  onCancel,
  onSaved,
}: {
  item: Item;
  collections: Collection[];
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [f, setF] = useState({
    brand: item.brand, displayName: item.displayName ?? "",
    category: item.category, gender: item.gender ?? "", size: item.size,
    fitRating: item.fitRating, fitDirection: item.fitDirection ?? DIRECTION_DEFAULT, color: item.color ?? "",
    collectionId: item.collectionId ?? "",
    areaNotes: safeNotes(item.areaNotesJson) ?? "",
    imageDataUrl: item.imageDataUrl ?? "",
    productUrl: item.productUrl ?? "",
  });
  // Garment measurements taken from the product page's chart (ProductLinkCheck).
  const [garment, setGarment] = useState<GarmentFields | null>(null);
  const t = useT("closet");
  const g = useGarmentText();
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!f.brand || !f.size || !isValidSize(f.category, f.size)) return;
    setSaving(true);
    await fetch("/api/closet", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: item.id, brand: f.brand, displayName: f.displayName || null,
        category: f.category, gender: f.gender || null, size: f.size,
        fitRating: f.fitRating, fitDirection: f.fitDirection, color: f.color || null,
        collectionId: f.collectionId || null,
        imageDataUrl: f.imageDataUrl || null,
        areaNotesJson: f.areaNotes ? JSON.stringify({ notes: f.areaNotes }) : null,
        productUrl: validUrl(f.productUrl),
        ...(garment ?? {}),
      }),
    });
    setSaving(false);
    onSaved();
  }

  async function pickImage(file: Blob | undefined) {
    if (!file) return;
    try { setF((x) => ({ ...x, imageDataUrl: "" })); const d = await resizeGarmentPhoto(file); setF((x) => ({ ...x, imageDataUrl: d })); } catch { /* ignore */ }
  }

  return (
    <Card className="relative !p-4 animate-fade-in-up">
      {/* small corner save — inside the card, top-right; the Photo row below
          reserves right padding (pr-20) so its helper text never sits under it */}
      <button onClick={save} disabled={saving || !f.brand || !f.size || !isValidSize(f.category, f.size)}
        className="absolute right-3 top-3 z-10 h-8 rounded-full bg-ink px-3.5 text-xs font-medium text-paper hover:bg-black disabled:opacity-45">
        {saving ? "…" : t("save")}
      </button>
      <div className="grid gap-3 sm:grid-cols-6">
        <div className="sm:col-span-6 pr-20">
          <Field as="div" label={t("photo")} hint={t("optional")}>
            <div className="flex items-center gap-3">
              <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-line bg-white text-lg text-ink-faint">
                {f.imageDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={f.imageDataUrl} alt="" className="h-full w-full object-cover" />
                ) : <GarmentIcon category={f.category} size={24} />}
              </span>
              <div className="min-w-0">
                <PhotoSource onPick={(b) => pickImage(b[0])} />
                {f.imageDataUrl && <button type="button" onClick={() => setF({ ...f, imageDataUrl: "" })} className="mt-1 text-xs text-ink-faint hover:text-bad">{t("removeLower")}</button>}
              </div>
            </div>
          </Field>
        </div>
        <div className="sm:col-span-3">
          <Field label={t("brand")}><BrandInput value={f.brand} onChange={(v) => setF({ ...f, brand: v })} /></Field>
        </div>
        <div className="sm:col-span-3">
          <Field label={t("name")} hint={t("optional")}><input className={inputClass} value={f.displayName} placeholder={t("namePlaceholder")} onChange={(e) => setF({ ...f, displayName: e.target.value })} /></Field>
        </div>
        <div className="sm:col-span-6">
          <Field as="div" label={t("typeLabel")}>
            <CategoryPicker value={f.category} onChange={(v) => setF({ ...f, category: v })} />
          </Field>
          <p className="mt-1 text-[11px] text-ink-faint">{t("typeHint")}</p>
        </div>
        <div className="sm:col-span-3">
          <Field label={t("lineLabel")}>
            <select className={inputClass} value={f.gender} onChange={(e) => setF({ ...f, gender: e.target.value })}>
              {GENDERS.map((v) => <option key={v} value={v}>{g.line(v)}</option>)}
            </select>
          </Field>
        </div>
        <div className="sm:col-span-6">
          <Field as="div" label={t("howSits")}>
            <FitDirectionInput
              value={f.fitDirection}
              onChange={(n) => setF({ ...f, fitDirection: n, fitRating: ratingFromDirection(n) })}
            />
          </Field>
        </div>
        <div className="sm:col-span-6">
          <Field label={t("size")}>
            <SizeInput category={f.category} value={f.size} onChange={(v) => setF({ ...f, size: v })} line={f.gender} />
          </Field>
        </div>
        <div className="sm:col-span-6">
          <Field as="div" label={t("color")}><ColorPicker value={f.color} onChange={(v) => setF({ ...f, color: v })} /></Field>
        </div>
        <div className="sm:col-span-6">
          <Field as="div" label={t("productUrl")} hint={t("optional")}>
            <ProductLinkCheck url={f.productUrl} onUrl={(u) => setF({ ...f, productUrl: u })} size={f.size} onGarment={setGarment} />
          </Field>
        </div>
        <div className="sm:col-span-6">
          <Field label={t("fitNotes")}><input className={inputClass} value={f.areaNotes} onChange={(e) => setF({ ...f, areaNotes: e.target.value })} /></Field>
        </div>
        {/* Where it is filed: the wearer's own folders, apart from the garment
            type above — the two looked like one setting twice (Session 98). */}
        <div className="rounded-xl border border-dashed border-line px-3 py-3 sm:col-span-6">
          <Field label={t("collectionLabel")}>
            <select className={inputClass} value={f.collectionId} onChange={(e) => setF({ ...f, collectionId: e.target.value })}>
              <option value="">{g.folder("Uncategorized")}</option>
              {collections.map((c) => <option key={c.id} value={c.id}>{g.folder(c.name)}</option>)}
            </select>
          </Field>
          <p className="mt-1 text-[11px] text-ink-faint">{t("collectionHint")}</p>
        </div>
        <div className="flex gap-2 sm:col-span-6">
          <Button onClick={save} disabled={saving || !f.brand || !f.size || !isValidSize(f.category, f.size)}>{saving ? t("saving") : t("saveChanges")}</Button>
          <Button variant="ghost" onClick={onCancel}>{t("cancel")}</Button>
        </div>
      </div>
    </Card>
  );
}

