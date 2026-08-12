"use client";

// Outfits — compose looks and see how they preview on a body-typed mannequin,
// then post them to the community. Posting drives the top prestige badges.

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button, Card, EmptyState, Field, inputClass } from "@/components/ui";
import { CategoryPicker } from "@/components/CategoryPicker";
import { OutfitMannequin, type OutfitLayer } from "@/components/OutfitMannequin";
import { OutfitCard, type OutfitView } from "@/components/OutfitCard";
import { deriveBodyType } from "@/lib/bodyType";
import { garmentGlyph, garmentLabel } from "@/lib/garments";

type Item = { brand: string; category: string; color: string; size: string; onlineAvailable: boolean };
type Outfit = OutfitView;

type ClosetItem = {
  id: string; brand: string; displayName: string | null; category: string;
  color: string | null; size: string; imageDataUrl: string | null; onlineAvailable: boolean;
};

const BLANK_ITEM: Item = { brand: "", category: "tshirt", color: "", size: "", onlineAvailable: true };

export default function OutfitsPage() {
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
        setPhotoNote("Photoreal preview isn't set up yet — using the stylized view. (Add an image-gen API key to enable.)");
      } else if (r.image) {
        setPhoto(r.image);
      } else {
        setPhotoNote("Couldn't generate a photo this time — showing the stylized view.");
      }
    } catch {
      setPhotoNote("Generation failed — showing the stylized view.");
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
    if (!confirm("Delete this outfit?")) return;
    await fetch(`/api/outfits?id=${id}`, { method: "DELETE" });
    load();
  }

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-4xl text-ink">Outfits</h1>
            <p className="mt-1 text-ink-soft">
              Compose a look, preview it on your body type, and post it to the
              community. Posting earns the top badges.
            </p>
          </div>
          <Link href="/community" className="text-sm text-ink-faint hover:text-brand">Community feed →</Link>
        </div>

        {/* Composer */}
        <Card className="mt-6 grid gap-6 sm:grid-cols-[1fr,auto]">
          <div className="space-y-3">
            <Field label="Title"><input className={inputClass} value={title} placeholder="e.g. Autumn layers" onChange={(e) => setTitle(e.target.value)} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Occasion" hint="optional"><input className={inputClass} value={occasion} placeholder="Fall, Wedding…" onChange={(e) => setOccasion(e.target.value)} /></Field>
              <Field label="Note" hint="optional"><input className={inputClass} value={description} placeholder="short caption" onChange={(e) => setDescription(e.target.value)} /></Field>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink-faint">Pieces</p>
              {items.map((it, i) => (
                <div key={i} className="grid grid-cols-[1fr,1fr,auto] items-center gap-2 rounded-lg border border-neutral-200 p-2">
                  <div className="w-full"><CategoryPicker value={it.category} onChange={(v) => setItems(items.map((x, j) => j === i ? { ...x, category: v } : x))} /></div>
                  <input className={inputClass} placeholder="color (e.g. navy)" value={it.color}
                    onChange={(e) => setItems(items.map((x, j) => j === i ? { ...x, color: e.target.value } : x))} />
                  <button onClick={() => setItems(items.filter((_, j) => j !== i))}
                    className="px-1 text-ink-faint hover:text-red-600" title="Remove" disabled={items.length === 1}>✕</button>
                  <label className="col-span-3 flex items-center gap-1.5 text-[11px] text-ink-soft">
                    <input type="checkbox" checked={!it.onlineAvailable} className="accent-brand"
                      onChange={(e) => setItems(items.map((x, j) => j === i ? { ...x, onlineAvailable: !e.target.checked } : x))} />
                    In-store only (not available online)
                  </label>
                </div>
              ))}
              <div className="flex gap-3">
                <button onClick={() => setItems([...items, { ...BLANK_ITEM }])} className="text-sm text-brand hover:underline">+ Add blank piece</button>
                <button onClick={() => setPickerOpen((v) => !v)} className="text-sm text-brand hover:underline">
                  {pickerOpen ? "Close closet" : "+ Add from my closet"}
                </button>
              </div>

              {pickerOpen && (
                <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-2">
                  <input className={inputClass + " mb-2"} placeholder="Search your closet…"
                    value={search} onChange={(e) => setSearch(e.target.value)} />
                  <div className="grid max-h-52 grid-cols-1 gap-1 overflow-y-auto sm:grid-cols-2">
                    {closet
                      .filter((c) => {
                        const q = search.toLowerCase();
                        return !q || [c.brand, c.displayName, c.category, c.color].some((v) => v?.toLowerCase().includes(q));
                      })
                      .map((c) => (
                        <button key={c.id} type="button"
                          onClick={() => setItems((prev) => {
                            const piece: Item = { brand: c.brand, category: c.category, color: c.color ?? "", size: c.size, onlineAvailable: c.onlineAvailable };
                            // Replace a single untouched blank piece; else append.
                            const onlyBlank = prev.length === 1 && !prev[0].brand && !prev[0].color && prev[0].category === "tshirt" && !prev[0].size;
                            return onlyBlank ? [piece] : [...prev, piece];
                          })}
                          className="flex items-center gap-2 rounded-md border border-neutral-200 bg-white px-2 py-1.5 text-left text-xs hover:border-brand">
                          {c.imageDataUrl
                            ? // eslint-disable-next-line @next/next/no-img-element
                              <img src={c.imageDataUrl} alt="" className="h-7 w-7 flex-shrink-0 rounded object-cover" />
                            : <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded bg-neutral-100">{garmentGlyph(c.category)}</span>}
                          <span className="min-w-0">
                            <span className="block truncate font-medium text-ink">{c.displayName || c.brand}</span>
                            <span className="block truncate text-ink-faint">{garmentLabel(c.category)} · {c.size}</span>
                          </span>
                        </button>
                      ))}
                    {closet.length === 0 && <p className="col-span-2 px-1 py-2 text-xs text-ink-faint">Your closet is empty. <Link href="/closet" className="text-brand hover:underline">Add items →</Link></p>}
                  </div>
                </div>
              )}
            </div>

            <Button onClick={post} disabled={saving || !title.trim()}>{saving ? "Posting…" : "Post outfit →"}</Button>
          </div>

          {/* Live preview */}
          <div className="flex flex-col items-center justify-start rounded-xl bg-neutral-50 p-3">
            <p className="mb-1 text-[10px] uppercase tracking-widest text-ink-faint">Preview on your body</p>
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt="photoreal preview" className="w-[150px] rounded-lg" />
            ) : (
              <OutfitMannequin layers={layers} volume={figure.volume as never} shape={figure.shape as never} size={150} />
            )}
            <div className="mt-2 flex flex-wrap justify-center gap-1.5">
              <button
                onClick={genPhoto}
                disabled={genning || layers.length === 0}
                className="rounded-lg border border-neutral-300 px-2.5 py-1 text-[11px] font-medium text-ink-soft hover:border-brand hover:text-brand disabled:opacity-50"
              >
                {genning ? "Generating…" : photo ? "↻ Regenerate" : "✨ Photoreal preview"}
              </button>
              {photo && (
                <button
                  onClick={() => { setPhoto(null); setPhotoNote(null); }}
                  className="rounded-lg border border-neutral-300 px-2.5 py-1 text-[11px] font-medium text-ink-soft hover:border-brand hover:text-brand"
                >
                  ← Stylized view
                </button>
              )}
            </div>
            {photoNote && <p className="mt-1 text-center text-[10px] text-ink-faint">{photoNote}</p>}
            {!photoNote && <p className="mt-1 text-[10px] text-ink-faint">{photo ? "photoreal" : "stylized preview"}</p>}
          </div>
        </Card>

        {/* My outfits */}
        <h2 className="mt-10 text-sm font-semibold uppercase tracking-widest text-ink-soft">My outfits</h2>
        {mine.length === 0 ? (
          <div className="mt-3"><EmptyState title="No outfits yet" body="Compose your first look above and post it." /></div>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {mine.map((o) => <OutfitCard key={o.id} outfit={o} figure={figure} onDelete={() => del(o.id)} onChange={load} />)}
          </div>
        )}
      </div>
    </main>
  );
}
