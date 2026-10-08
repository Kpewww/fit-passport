"use client";

// Outfits — compose looks and see how they preview on a body-typed mannequin,
// then post them to the community. Posting drives the top prestige badges.

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Close, Refresh, Sparkle } from "@/components/Icon";
import Link from "next/link";
import { Button, Card, EmptyState, Field, PageHeader, inputClass } from "@/components/ui";
import { CategoryPicker } from "@/components/CategoryPicker";
import { OutfitMannequin, type OutfitLayer } from "@/components/OutfitMannequin";
import { OutfitCard, type OutfitView } from "@/components/OutfitCard";
import { deriveBodyType } from "@/lib/bodyType";
import { garmentLabel } from "@/lib/garments";
import { GarmentIcon } from "@/components/GarmentIcon";
import { useT } from "@/i18n/client";
import { useGarmentText } from "@/i18n/garment";

type Item = { brand: string; category: string; color: string; size: string; onlineAvailable: boolean };
type Outfit = OutfitView;

type ClosetItem = {
  id: string; brand: string; displayName: string | null; category: string;
  color: string | null; size: string; imageDataUrl: string | null; onlineAvailable: boolean;
};

const BLANK_ITEM: Item = { brand: "", category: "tshirt", color: "", size: "", onlineAvailable: true };

export default function OutfitsPage() {
  const t = useT("outfits");
  const g = useGarmentText();
  const [mine, setMine] = useState<Outfit[]>([]);
  const [figure, setFigure] = useState<{ volume: string; shape: string }>({ volume: "average", shape: "straight" });

  // composer state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [occasion, setOccasion] = useState("");
  const [items, setItems] = useState<Item[]>([{ ...BLANK_ITEM }]);
  const [saving, setSaving] = useState(false);
  // Closet picker
  const [closet, setCloset] = useState<ClosetItem[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState("");
  // Photoreal preview (optional; falls back to the mannequin when not configured)
  const [photo, setPhoto] = useState<string | null>(null);
  const [genning, setGenning] = useState(false);
  const [photoNote, setPhotoNote] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch("/api/outfits?mine=1").then((r) => r.json()).then((d) => setMine(d.outfits ?? []));
    fetch("/api/closet").then((r) => r.json()).then((d) => setCloset(d.items ?? []));
    fetch("/api/profile").then((r) => r.json()).then((d) => {
      const p = d.profile;
      if (p) {
        const bt = deriveBodyType({ heightCm: p.heightCm, weightKg: p.weightKg, chestCm: p.chestCm, waistCm: p.waistCm, hipCm: p.hipCm });
        setFigure({ volume: bt.figureKey, shape: bt.shape });
      }
    });
  }, []);
  useEffect(load, [load]);

  const layers: OutfitLayer[] = items
    .filter((it) => it.category)
    .map((it) => ({ category: it.category, color: it.color || null }));

  // Reset any stale photoreal render when the composed pieces change.
  useEffect(() => { setPhoto(null); setPhotoNote(null); }, [JSON.stringify(layers)]);

  async function genPhoto() {
    if (layers.length === 0) return;
    setGenning(true);
    setPhotoNote(null);
    try {
      const r = await fetch("/api/tryon", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          garments: layers,
          bodyDescriptor: `${figure.volume} build`,
          occasion: occasion || null,
        }),
      }).then((r) => r.json());
      if (!r.configured) {
        setPhotoNote(t("photoNotSetUp"));
      } else if (r.image) {
        setPhoto(r.image);
      } else {
        setPhotoNote(t("photoFailed"));
      }
    } catch {
      setPhotoNote(t("genFailed"));
    } finally {
      setGenning(false);
    }
  }

  async function post() {
    if (!title.trim() || items.length === 0) return;
    setSaving(true);
    await fetch("/api/outfits", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        description: description || null,
        occasion: occasion || null,
        onlineAvailable: items.every((it) => it.onlineAvailable),
        items: items.map((it) => ({
          brand: it.brand || null,
          category: it.category,
          color: it.color || null,
          size: it.size || null,
          onlineAvailable: it.onlineAvailable,
        })),
      }),
    }).catch(() => {});
    setSaving(false);
    setTitle(""); setDescription(""); setOccasion(""); setItems([{ ...BLANK_ITEM }]);
    load();
  }

  async function del(id: string) {
    if (!confirm(t("deleteConfirm"))) return;
    await fetch(`/api/outfits?id=${id}`, { method: "DELETE" });
    load();
  }

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
        {/* The house header (ui.tsx), as on the closet: the lede kept to a readable
            measure and spaced off the title, the feed link on the lede's last line.
            A hand-made header here had the lede 4 px under the title and a full row
            wide, and the founder found it cramped in both languages (Session 95). */}
        <PageHeader
          title={t("title")}
          lede={t("lede")}
          action={<Link href="/community" className="whitespace-nowrap text-sm text-ink-faint hover:text-ink">{t("feed")} <ArrowRight size={14} className="-mt-px inline" /></Link>}
        />

        {/* Composer */}
        <Card className="mt-10 grid gap-8 sm:grid-cols-[1fr,auto]">
          <div className="min-w-0 space-y-5">
            <Field label={t("titleLabel")}><input className={inputClass} value={title} placeholder={t("titlePlaceholder")} onChange={(e) => setTitle(e.target.value)} /></Field>
            <div className="grid gap-5 sm:grid-cols-2 sm:gap-x-6">
              <Field label={t("occasion")} hint={t("optional")}><input className={inputClass} value={occasion} placeholder={t("occasionPlaceholder")} onChange={(e) => setOccasion(e.target.value)} /></Field>
              <Field label={t("note")} hint={t("optional")}><input className={inputClass} value={description} placeholder={t("notePlaceholder")} onChange={(e) => setDescription(e.target.value)} /></Field>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-ink">{t("pieces")}</p>
              {items.map((it, i) => (
                <div key={i} className="grid grid-cols-[1fr,auto] items-center gap-x-3 gap-y-2.5 rounded-xl border border-line p-3 sm:grid-cols-[1fr,1fr,auto]">
                  <div className="col-span-2 w-full min-w-0 sm:col-span-1"><CategoryPicker value={it.category} onChange={(v) => setItems(items.map((x, j) => j === i ? { ...x, category: v } : x))} /></div>
                  <input className={inputClass + " min-w-0"} placeholder={t("colorPlaceholder")} value={it.color}
                    onChange={(e) => setItems(items.map((x, j) => j === i ? { ...x, color: e.target.value } : x))} />
                  <button onClick={() => setItems(items.filter((_, j) => j !== i))}
                    className="px-1 text-ink-faint hover:text-bad" aria-label={t("removePiece")} disabled={items.length === 1}><Close size={16} /></button>
                  <label className="col-span-2 flex items-center gap-2 text-xs text-ink-soft sm:col-span-3">
                    <input type="checkbox" checked={!it.onlineAvailable} className="accent-brand"
                      onChange={(e) => setItems(items.map((x, j) => j === i ? { ...x, onlineAvailable: !e.target.checked } : x))} />
                    {t("inStoreOnly")}
                  </label>
                </div>
              ))}
              <div className="flex flex-wrap gap-x-5 gap-y-2 pt-1">
                <button onClick={() => setItems([...items, { ...BLANK_ITEM }])} className="text-sm text-brand hover:underline">{t("addBlank")}</button>
                <button onClick={() => setPickerOpen((v) => !v)} className="text-sm text-brand hover:underline">
                  {pickerOpen ? t("closeCloset") : t("addFromCloset")}
                </button>
              </div>

              {pickerOpen && (
                <div className="rounded-lg border border-line bg-paper-soft p-2">
                  <input className={inputClass + " mb-2"} placeholder={t("searchCloset")}
                    value={search} onChange={(e) => setSearch(e.target.value)} />
                  <div className="grid max-h-52 grid-cols-1 gap-1 overflow-y-auto sm:grid-cols-2">
                    {closet
                      .filter((c) => {
                        const q = search.toLowerCase();
                        return !q || [c.brand, c.displayName, c.category, g.label(c.category), c.color].some((v) => v?.toLowerCase().includes(q));
                      })
                      .map((c) => (
                        <button key={c.id} type="button"
                          onClick={() => setItems((prev) => {
                            const piece: Item = { brand: c.brand, category: c.category, color: c.color ?? "", size: c.size, onlineAvailable: c.onlineAvailable };
                            // Replace a single untouched blank piece; else append.
                            const onlyBlank = prev.length === 1 && !prev[0].brand && !prev[0].color && prev[0].category === "tshirt" && !prev[0].size;
                            return onlyBlank ? [piece] : [...prev, piece];
                          })}
                          className="flex items-center gap-2 rounded-md border border-line bg-white px-2 py-1.5 text-left text-xs hover:border-brand">
                          {c.imageDataUrl
                            ? // eslint-disable-next-line @next/next/no-img-element
                              <img src={c.imageDataUrl} alt="" className="h-7 w-7 flex-shrink-0 rounded object-cover" />
                            : <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded bg-paper-dim"><GarmentIcon category={c.category} size={18} className="text-ink-soft" /></span>}
                          <span className="min-w-0">
                            <span className="block truncate font-medium text-ink">{c.displayName || c.brand}</span>
                            <span className="block truncate text-ink-faint">{g.label(c.category)} · {c.size}</span>
                          </span>
                        </button>
                      ))}
                    {closet.length === 0 && <p className="col-span-2 px-1 py-2 text-xs text-ink-faint">{t.rich("closetEmpty", { link: (c) => <Link href="/closet" className="text-brand hover:underline">{c} <ArrowRight size={14} className="-mt-px inline" /></Link> })}</p>}
                  </div>
                </div>
              )}
            </div>

            <Button onClick={post} disabled={saving || !title.trim()}>{saving ? t("posting") : t("postOutfit")}</Button>
          </div>

          {/* Live preview */}
          <div className="flex flex-col items-center justify-start rounded-xl bg-paper-soft p-3">
            <p className="mb-1 text-[10px] uppercase tracking-widest text-ink-faint">{t("previewOnBody")}</p>
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt={t("photoAlt")} className="w-[150px] rounded-lg" />
            ) : (
              <OutfitMannequin layers={layers} volume={figure.volume as never} shape={figure.shape as never} size={150} />
            )}
            <div className="mt-2 flex flex-wrap justify-center gap-1.5">
              <button
                onClick={genPhoto}
                disabled={genning || layers.length === 0}
                className="rounded-lg border border-line px-2.5 py-1 text-[11px] font-medium text-ink-soft hover:border-brand hover:text-brand disabled:opacity-50"
              >
                {genning ? t("generating") : photo ? <><Refresh size={16} /> {t("regenerate")}</> : <><Sparkle size={16} /> {t("photoreal")}</>}
              </button>
              {photo && (
                <button
                  onClick={() => { setPhoto(null); setPhotoNote(null); }}
                  className="rounded-lg border border-line px-2.5 py-1 text-[11px] font-medium text-ink-soft hover:border-brand hover:text-brand"
                >
                  <ArrowLeft size={14} className="-mt-px inline" /> {t("stylizedView")}
                </button>
              )}
            </div>
            {photoNote && <p className="mt-1 text-center text-[10px] text-ink-faint">{photoNote}</p>}
            {!photoNote && <p className="mt-1 text-[10px] text-ink-faint">{photo ? t("photorealTag") : t("stylizedTag")}</p>}
          </div>
        </Card>

        {/* My outfits */}
        <h2 className="mt-10 text-h3 font-semibold text-ink">{t("myOutfits")}</h2>
        {mine.length === 0 ? (
          <div className="mt-3"><EmptyState title={t("noOutfits")} body={t("noOutfitsBody")} /></div>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {mine.map((o) => <OutfitCard key={o.id} outfit={o} figure={figure} onDelete={() => del(o.id)} onChange={load} />)}
          </div>
        )}
      </div>
    </main>
  );
}
