"use client";

// Outfits — compose looks and see how they preview on a body-typed mannequin,
// then post them to the community. Posting drives the top prestige badges.

import { useCallback, useEffect, useState } from "react";
import { ArrowRight, Close, Refresh, Sparkle } from "@/components/Icon";
import Link from "next/link";
import { Button, Card, EmptyState, PageHeader, inputClass } from "@/components/ui";
import { colorHex } from "@/lib/colors";
import { CategoryPicker } from "@/components/CategoryPicker";
import { OutfitMannequin, type OutfitLayer } from "@/components/OutfitMannequin";
import { OutfitCard, type OutfitView } from "@/components/OutfitCard";
import { deriveBodyType } from "@/lib/bodyType";
import { garmentLabel } from "@/lib/garments";
import { GarmentIcon } from "@/components/GarmentIcon";
import { useT } from "@/i18n/client";
import { pluralKey } from "@/i18n/format";
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
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
        {/* The house header (ui.tsx), as on the closet: the lede kept to a readable
            measure and spaced off the title, the feed link on the lede's last line.
            A hand-made header here had the lede 4 px under the title and a full row
            wide, and the founder found it cramped in both languages (Session 95). */}
        <PageHeader
          title={t("title")}
          lede={t("lede")}
          action={<Link href="/community" className="whitespace-nowrap text-sm text-ink-faint hover:text-ink">{t("feed")} <ArrowRight size={14} className="-mt-px inline" /></Link>}
        />

        {/* Composer — a studio, Session 96 (the founder: the form read as scattered).
            The look itself leads: a stage on the left with the mannequin large and the
            view switch above it; on the right, two numbered steps — the pieces, then a
            name — and a footer bar that says what posting does, beside the button.
            Pieces are one list with hairlines, not a box per piece. */}
        <Card className="mt-10 overflow-hidden !p-0">
          <div className="grid md:grid-cols-[minmax(0,5fr),minmax(0,7fr)]">
            {/* Stage */}
            <div className="flex flex-col items-center border-b border-line bg-paper-soft px-6 py-7 md:border-b-0 md:border-r">
              <div role="tablist" aria-label={t("previewOnBody")} className="inline-flex rounded-full border border-line bg-white p-1 text-xs font-medium">
                <button
                  role="tab"
                  aria-selected={!photo}
                  onClick={() => { setPhoto(null); setPhotoNote(null); }}
                  className={`rounded-full px-3.5 py-1.5 transition-colors ${!photo ? "bg-ink text-paper" : "text-ink-soft hover:text-ink"}`}
                >
                  {t("stylized")}
                </button>
                <button
                  role="tab"
                  aria-selected={!!photo}
                  onClick={genPhoto}
                  disabled={genning || layers.length === 0}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 transition-colors disabled:opacity-50 ${photo ? "bg-ink text-paper" : "text-ink-soft hover:text-ink"}`}
                >
                  {genning ? t("generating") : photo ? <><Refresh size={14} /> {t("regenerate")}</> : <><Sparkle size={14} /> {t("photorealShort")}</>}
                </button>
              </div>
              <div className="flex flex-1 items-center justify-center py-6">
                {photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photo} alt={t("photoAlt")} className="w-[220px] rounded-xl" />
                ) : (
                  <OutfitMannequin layers={layers} volume={figure.volume as never} shape={figure.shape as never} size={220} />
                )}
              </div>
              <p className="text-center text-xs text-ink-faint">{photoNote ?? t("previewOnBody")}</p>
            </div>

            {/* Steps */}
            <div className="flex min-w-0 flex-col">
              <div className="space-y-8 px-6 py-7 sm:px-8">
                <section>
                  <StepTitle n={1} title={t("pieces")} meta={t(pluralKey("pieceCount", items.length), { n: items.length })} />
                  <ul className="mt-4 divide-y divide-line rounded-2xl border border-line">
                    {items.map((it, i) => {
                      const hex = colorHex(it.color);
                      return (
                        <li key={i} className="px-3 py-3 sm:px-4">
                          <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-paper-soft">
                              <GarmentIcon category={it.category} size={22} className="text-ink-soft" />
                            </span>
                            <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2">
                              <CategoryPicker value={it.category} onChange={(v) => setItems(items.map((x, j) => j === i ? { ...x, category: v } : x))} />
                              <div className="relative min-w-0">
                                <span aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full border border-line"
                                  style={{ background: hex ?? "transparent" }} />
                                <input className={inputClass + " min-w-0 pl-9"} placeholder={t("colorPlaceholder")} value={it.color}
                                  onChange={(e) => setItems(items.map((x, j) => j === i ? { ...x, color: e.target.value } : x))} />
                              </div>
                            </div>
                            <button onClick={() => setItems(items.filter((_, j) => j !== i))}
                              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-paper-soft hover:text-bad disabled:opacity-30"
                              aria-label={t("removePiece")} disabled={items.length === 1}><Close size={16} /></button>
                          </div>
                          <label className="ml-[3.25rem] mt-2 flex w-fit items-center gap-2 text-xs text-ink-faint">
                            <input type="checkbox" checked={!it.onlineAvailable} className="accent-brand"
                              onChange={(e) => setItems(items.map((x, j) => j === i ? { ...x, onlineAvailable: !e.target.checked } : x))} />
                            {t("inStoreOnly")}
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" variant="secondary" onClick={() => setItems([...items, { ...BLANK_ITEM }])}>{t("addBlank")}</Button>
                    <Button size="sm" variant="secondary" onClick={() => setPickerOpen((v) => !v)}>
                      {pickerOpen ? t("closeCloset") : t("addFromCloset")}
                    </Button>
                  </div>

                  {pickerOpen && (
                    <div className="mt-3 rounded-2xl border border-line bg-paper-soft p-3">
                      <input className={inputClass + " mb-2"} placeholder={t("searchCloset")}
                        value={search} onChange={(e) => setSearch(e.target.value)} />
                      <div className="grid max-h-52 grid-cols-1 gap-1.5 overflow-y-auto sm:grid-cols-2">
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
                              className="flex items-center gap-2 rounded-xl border border-line bg-white px-2 py-1.5 text-left text-xs hover:border-brand">
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
                </section>

                <section>
                  <StepTitle n={2} title={t("detailsTitle")} />
                  <div className="mt-4 space-y-4">
                    <LabeledInput label={t("titleLabel")} value={title} placeholder={t("titlePlaceholder")} onChange={setTitle} />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <LabeledInput label={t("occasion")} optional={t("optional")} value={occasion} placeholder={t("occasionPlaceholder")} onChange={setOccasion} />
                      <LabeledInput label={t("note")} optional={t("optional")} value={description} placeholder={t("notePlaceholder")} onChange={setDescription} />
                    </div>
                  </div>
                </section>
              </div>

              <div className="mt-auto flex flex-col gap-3 border-t border-line bg-paper-soft/60 px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
                <p className="text-xs text-ink-faint">{t("postHint")}</p>
                <Button onClick={post} disabled={saving || !title.trim()}>{saving ? t("posting") : t("postOutfit")}</Button>
              </div>
            </div>
          </div>
        </Card>

        {/* My outfits */}
        <h2 className="mt-10 text-h3 font-semibold text-ink">{t("myOutfits")}</h2>
        {mine.length === 0 ? (
          <div className="mt-3"><EmptyState title={t("noOutfits")} body={t("noOutfitsBody")} /></div>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {mine.map((o) => <OutfitCard key={o.id} outfit={o} figure={figure} onDelete={() => del(o.id)} onChange={load} />)}
          </div>
        )}
      </div>
    </main>
  );
}

/** A numbered step: the number in a small ring, the title, and a quiet count. */
function StepTitle({ n, title, meta }: { n: number; title: string; meta?: string }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="flex h-6 w-6 flex-shrink-0 translate-y-[-1px] items-center justify-center self-center rounded-full border border-ink/15 text-[11px] font-semibold tabular-nums text-ink-soft">{n}</span>
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      {meta && <span className="ml-auto text-xs text-ink-faint">{meta}</span>}
    </div>
  );
}

/** A label with its "optional" beside it, not across the row. */
function LabeledInput({ label, optional, value, placeholder, onChange }: { label: string; optional?: string; value: string; placeholder: string; onChange: (v: string) => void }) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 flex items-baseline gap-1.5">
        <span className="font-medium text-ink">{label}</span>
        {optional && <span className="text-xs text-ink-faint">· {optional}</span>}
      </span>
      <input className={inputClass} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
