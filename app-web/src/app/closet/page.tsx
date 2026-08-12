"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button, Card, EmptyState, Field, LinkButton, inputClass } from "@/components/ui";
import { BrandInput } from "@/components/BrandInput";
import { SizeInput } from "@/components/SizeInput";
import { CategoryPicker } from "@/components/CategoryPicker";
import { isValidSize } from "@/lib/sizeSystems";
import { garmentLabel, garmentGlyph } from "@/lib/garments";
import { resizeImageToDataUrl } from "@/lib/imageResize";

type Item = {
  id: string;
  brand: string;
  displayName: string | null;
  category: string;
  gender: string | null;
  size: string;
  region: string | null;
  fitRating: number;
  areaNotesJson: string | null;
  color: string | null;
  imageDataUrl: string | null;
  collectionId: string | null;
  sortIndex: number;
  groupId: string | null;
  groupName: string | null;
};

type Collection = { id: string; name: string; sortIndex: number; itemCount: number };

// Small preset palette for color tags (plus free text).
// Two rows of common/on-trend apparel colors. Names are stored as-is; a hex is
// used for the swatch + dot. Free text and the color wheel still allow anything.
const COLOR_PRESETS: Array<{ name: string; hex: string }> = [
  // row 1 — neutrals & core
  { name: "black", hex: "#1a1a1a" },
  { name: "white", hex: "#f5f5f5" },
  { name: "grey", hex: "#9ca3af" },
  { name: "charcoal", hex: "#374151" },
  { name: "navy", hex: "#1f2a44" },
  { name: "blue", hex: "#3b82f6" },
  { name: "denim", hex: "#4a6fa5" },
  { name: "beige", hex: "#d8c3a5" },
  { name: "cream", hex: "#f0e9d6" },
  { name: "brown", hex: "#6b4f3a" },
  // row 2 — accents / trend
  { name: "olive", hex: "#6b7443" },
  { name: "green", hex: "#4b7a53" },
  { name: "sage", hex: "#9caf88" },
  { name: "teal", hex: "#2f8f83" },
  { name: "burgundy", hex: "#6d2036" },
  { name: "red", hex: "#b03a3a" },
  { name: "rust", hex: "#b5622f" },
  { name: "mustard", hex: "#d0a028" },
  { name: "pink", hex: "#dba0b0" },
  { name: "purple", hex: "#7c5aa8" },
];

function colorHex(name: string | null): string | null {
  if (!name) return null;
  if (/^#[0-9a-f]{3,8}$/i.test(name)) return name;
  return COLOR_PRESETS.find((c) => c.name === name.toLowerCase())?.hex ?? null;
}

const GENDERS = [
  { v: "", label: "—" },
  { v: "mens", label: "Men's" },
  { v: "womens", label: "Women's" },
  { v: "unisex", label: "Unisex" },
];

const BLANK = { brand: "", displayName: "", category: "tshirt", gender: "", size: "", fitRating: 5, areaNotes: "", color: "", onlineAvailable: true, imageDataUrl: "" };

export default function ClosetPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [form, setForm] = useState({ ...BLANK });
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newCollectionName, setNewCollectionName] = useState("");
  // Merge-select mode
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  // Add-by-URL
  const [pasteUrl, setPasteUrl] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [extractNote, setExtractNote] = useState<string | null>(null);
  // Closet view mode
  const [view, setView] = useState<"list" | "grid">("list");
  // Folder view: the file "pulled fully out" onto the desk (detail sheet), and
  // the comparison "bucket" — items set aside to view side-by-side, mirroring
  // how you pull a few garments out of a real closet when planning an outfit.
  const [detailGroup, setDetailGroup] = useState<Group | null>(null);
  const [compareItems, setCompareItems] = useState<Item[]>([]);

  function toggleBucket(it: Item) {
    setCompareItems((prev) =>
      prev.some((x) => x.id === it.id) ? prev.filter((x) => x.id !== it.id) : [...prev, it],
    );
  }
  const inBucket = (id: string) => compareItems.some((x) => x.id === id);

  // Keep the bucket + open sheet in sync with the latest item data after reloads
  // (edits/removals): drop anything that no longer exists, refresh the rest.
  useEffect(() => {
    const byId = new Map(items.map((i) => [i.id, i]));
    setCompareItems((prev) => prev.map((c) => byId.get(c.id)).filter(Boolean) as Item[]);
    setDetailGroup((prev) => {
      if (!prev) return prev;
      const live = prev.items.map((c) => byId.get(c.id)).filter(Boolean) as Item[];
      return live.length ? { ...prev, items: live } : null;
    });
  }, [items]);

  async function extractFromUrl() {
    if (!pasteUrl.trim()) return;
    setExtracting(true);
    setExtractNote(null);
    try {
      const r = await fetch("/api/closet/extract", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: pasteUrl.trim() }),
      }).then((r) => r.json());
      if (r.error) { setExtractNote("Couldn't read that URL — fill the fields in manually."); return; }
      setForm((f) => ({
        ...f,
        brand: r.brand || f.brand,
        displayName: r.suggestedName || f.displayName,
        category: r.category || f.category,
        gender: r.gender || f.gender,
        size: Array.isArray(r.sizes) && r.sizes.length ? "" : f.size, // let user pick a size
      }));
      const bits = [r.brand, r.category && garmentLabel(r.category)].filter(Boolean).join(" · ");
      setExtractNote(`Read ${bits || "details"} from ${r.source?.host ?? "the page"} — review and pick your size below.`);
    } catch {
      setExtractNote("Couldn't read that URL — fill the fields in manually.");
    } finally {
      setExtracting(false);
    }
  }

  async function onPickImage(file: File | undefined) {
    if (!file) return;
    try {
      const dataUrl = await resizeImageToDataUrl(file, 320);
      setForm((f) => ({ ...f, imageDataUrl: dataUrl }));
    } catch { /* ignore */ }
  }

  const load = useCallback(async () => {
    const [c, i] = await Promise.all([
      fetch("/api/collections").then((r) => r.json()),
      fetch("/api/closet").then((r) => r.json()),
    ]);
    setCollections(c.collections);
    setItems(i.items);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!form.brand || !form.size || !isValidSize(form.category, form.size)) return;
    setSaving(true);
    await fetch("/api/closet", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        brand: form.brand, displayName: form.displayName || null,
        category: form.category, gender: form.gender || null, size: form.size,
        fitRating: form.fitRating, color: form.color || null, onlineAvailable: form.onlineAvailable,
        imageDataUrl: form.imageDataUrl || null,
        areaNotesJson: form.areaNotes ? JSON.stringify({ notes: form.areaNotes }) : null,
      }),
    });
    setForm({ ...BLANK });
    setPasteUrl(""); setExtractNote(null);
    setSaving(false);
    load();
  }

  async function patch(id: string, data: Record<string, unknown>) {
    await fetch("/api/closet", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, ...data }),
    });
    load();
  }

  async function remove(id: string) {
    await fetch(`/api/closet?id=${id}`, { method: "DELETE" });
    load();
  }

  // Move an item up/down within its collection's ordering.
  async function move(collectionId: string | null, itemId: string, dir: -1 | 1) {
    const inBucket = items
      .filter((it) => it.collectionId === collectionId && !it.groupId)
      .sort((a, b) => a.sortIndex - b.sortIndex);
    const idx = inBucket.findIndex((it) => it.id === itemId);
    const swap = idx + dir;
    if (idx < 0 || swap < 0 || swap >= inBucket.length) return;
    const reordered = [...inBucket];
    [reordered[idx], reordered[swap]] = [reordered[swap], reordered[idx]];
    // Optimistic: update local order immediately.
    await fetch("/api/closet/reorder", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ orderedIds: reordered.map((it) => it.id) }),
    });
    load();
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function doMerge() {
    if (selected.size < 2) return;
    await fetch("/api/closet/group", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ itemIds: Array.from(selected) }),
    });
    setSelected(new Set());
    setSelectMode(false);
    load();
  }

  async function addCollection(e: React.FormEvent) {
    e.preventDefault();
    if (!newCollectionName.trim()) return;
    await fetch("/api/collections", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: newCollectionName.trim() }),
    });
    setNewCollectionName("");
    load();
  }

  const count = items.length;
  const goalMet = count >= 3;

  // Bucket items by collection (plus an Uncategorized bucket).
  const buckets = collections
    .slice()
    .sort((a, b) => a.sortIndex - b.sortIndex)
    .map((c) => ({ collection: c, items: itemsIn(items, c.id) }));
  const uncategorized = items.filter((it) => !it.collectionId);

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-ink">Your closet</h1>
            <p className="mt-2 max-w-lg text-ink-soft">
              Add clothes that fit you well, organized into collections. New items
              auto-file by type — rename, reorder, recolor, and move anything.
            </p>
          </div>
          <div className="flex flex-shrink-0 flex-col items-end gap-2">
            <div className="text-right">
              <div className={`text-2xl font-bold ${goalMet ? "text-green-600" : "text-brand"}`}>
                {Math.min(count, 3)}/3
              </div>
              <div className="text-xs text-ink-faint">{goalMet ? "goal met ✓" : "recommended"}</div>
            </div>
            {count > 0 && (
              <LinkButton href="/refresh?collections=all" variant="secondary" size="md">
                ↻ Refresh fit
              </LinkButton>
            )}
            {count > 0 && (
              <div className="inline-flex overflow-hidden rounded-lg border border-neutral-300">
                <button onClick={() => setView("list")} title="List view" aria-label="List view"
                  className={`flex h-7 w-8 items-center justify-center ${view === "list" ? "bg-brand text-white" : "text-ink-soft hover:bg-neutral-100"}`}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
                </button>
                <button onClick={() => setView("grid")} title="Folder view" aria-label="Folder view"
                  className={`flex h-7 w-8 items-center justify-center ${view === "grid" ? "bg-brand text-white" : "text-ink-soft hover:bg-neutral-100"}`}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7a1 1 0 0 1 1-1h5l2 2h8a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" /></svg>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Add form */}
        <Card className="mt-6">
          {/* Paste a product URL → auto-fill */}
          <div className="mb-4 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-3">
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-ink-faint">Add from a link</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input className={inputClass + " flex-1"} placeholder="Paste a product URL to auto-fill…"
                value={pasteUrl} onChange={(e) => setPasteUrl(e.target.value)} />
              <Button type="button" variant="secondary" size="md" onClick={extractFromUrl} disabled={extracting || !pasteUrl.trim()}>
                {extracting ? "Reading…" : "Auto-fill"}
              </Button>
            </div>
            {extractNote && <p className="mt-1.5 text-[11px] text-ink-soft">{extractNote}</p>}
          </div>

          <form onSubmit={add} className="grid gap-3 sm:grid-cols-6">
            {/* Item photo (user-uploaded — your own photo, not a scraped logo) */}
            <div className="sm:col-span-6">
              <Field label="Photo" hint="optional · your own photo">
                <div className="flex items-center gap-3">
                  <label className="flex h-16 w-16 flex-shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-neutral-300 bg-white text-xl text-ink-faint hover:border-brand">
                    {form.imageDataUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={form.imageDataUrl} alt="" className="h-full w-full object-cover" />
                    ) : (garmentGlyph(form.category))}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => onPickImage(e.target.files?.[0])} />
                  </label>
                  {form.imageDataUrl
                    ? <button type="button" onClick={() => setForm({ ...form, imageDataUrl: "" })} className="text-xs text-ink-faint hover:text-red-600">remove photo</button>
                    : <span className="text-xs text-ink-faint">Click to upload a picture of this item.</span>}
                </div>
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Brand">
                <BrandInput value={form.brand} onChange={(v) => setForm({ ...form, brand: v })} />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Name" hint="optional">
                <input className={inputClass} placeholder="e.g. Blue Oxford"
                  value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Type" hint="engine">
                <CategoryPicker value={form.category}
                  onChange={(v) => setForm({ ...form, category: v, size: "" })} />
              </Field>
            </div>
            <div className="sm:col-span-1">
              <Field label="Line" hint="optional">
                <select className={inputClass} value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                  {GENDERS.map((g) => <option key={g.v} value={g.v}>{g.label}</option>)}
                </select>
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Fit">
                <select className={inputClass} value={form.fitRating}
                  onChange={(e) => setForm({ ...form, fitRating: Number(e.target.value) })}>
                  {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}/5</option>)}
                </select>
              </Field>
            </div>
            <div className="sm:col-span-6">
              <Field label="Size">
                <SizeInput category={form.category} value={form.size}
                  onChange={(v) => setForm({ ...form, size: v })} />
              </Field>
            </div>
            <div className="sm:col-span-3">
              <Field label="Color" hint="optional">
                <ColorPicker value={form.color} onChange={(v) => setForm({ ...form, color: v })} />
              </Field>
            </div>
            <div className="sm:col-span-3">
              <Field label="Fit notes" hint="optional">
                <input className={inputClass} placeholder="e.g. shoulders perfect, sleeves long"
                  value={form.areaNotes} onChange={(e) => setForm({ ...form, areaNotes: e.target.value })} />
              </Field>
            </div>
            <div className="flex items-center sm:col-span-6">
              <label className="flex items-center gap-1.5 text-xs text-ink-soft">
                <input type="checkbox" checked={!form.onlineAvailable} className="accent-brand"
                  onChange={(e) => setForm({ ...form, onlineAvailable: !e.target.checked })} />
                In-store only (not available online)
              </label>
            </div>
            <div className="sm:col-span-6">
              <Button type="submit" disabled={saving || !form.brand || !form.size || !isValidSize(form.category, form.size)}>
                {saving ? "Adding…" : "Add to closet"}
              </Button>
            </div>
          </form>
        </Card>

        {/* Merge toolbar */}
        {count >= 2 && (
          <div className="mt-6 flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-2.5">
            {selectMode ? (
              <>
                <span className="text-sm text-ink-soft">
                  Select items that are the <strong>same garment</strong> (different size/color), then merge.
                  <span className="ml-2 text-ink-faint">{selected.size} selected</span>
                </span>
                <div className="flex gap-2">
                  <Button size="md" disabled={selected.size < 2} onClick={doMerge}>Merge {selected.size > 0 ? `(${selected.size})` : ""}</Button>
                  <Button size="md" variant="ghost" onClick={() => { setSelectMode(false); setSelected(new Set()); }}>Cancel</Button>
                </div>
              </>
            ) : (
              <>
                <span className="text-sm text-ink-soft">Have the same item in multiple sizes or colors?</span>
                <Button size="md" variant="secondary" onClick={() => setSelectMode(true)}>Merge duplicates</Button>
              </>
            )}
          </div>
        )}

        {/* Collection sections */}
        {count === 0 ? (
          <div className="mt-6">
            <EmptyState
              title="Your closet is empty"
              body="Add 3 things you own that fit well. Tip: pick different brands so we learn how sizes differ for your body."
            />
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {buckets.map(({ collection, items: bucketItems }, i) => (
              <CollectionSection
                key={collection.id}
                collection={collection}
                items={bucketItems}
                allCollections={collections}
                editingId={editingId}
                onEdit={setEditingId}
                onPatch={patch}
                onRemove={remove}
                onReload={load}
                onMove={move}
                selectMode={selectMode}
                selected={selected}
                onToggleSelect={toggleSelect}
                view={view}
                colorSeed={i}
                onOpenDetail={setDetailGroup}
                onBucket={toggleBucket}
                inBucket={inBucket}
              />
            ))}
            {uncategorized.length > 0 && (
              <CollectionSection
                collection={{ id: "__uncat__", name: "Uncategorized", sortIndex: 999, itemCount: uncategorized.length }}
                items={uncategorized}
                allCollections={collections}
                editingId={editingId}
                onEdit={setEditingId}
                onPatch={patch}
                onRemove={remove}
                onReload={load}
                onMove={move}
                selectMode={selectMode}
                selected={selected}
                onToggleSelect={toggleSelect}
                view={view}
                colorSeed={-1}
                onOpenDetail={setDetailGroup}
                onBucket={toggleBucket}
                inBucket={inBucket}
                undeletable
              />
            )}
          </div>
        )}

        {/* Add collection */}
        <Card className="mt-6">
          <form onSubmit={addCollection} className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Field label="New collection">
                <input className={inputClass} placeholder="e.g. Formal, Gym, Winter"
                  value={newCollectionName} onChange={(e) => setNewCollectionName(e.target.value)} />
              </Field>
            </div>
            <Button variant="secondary" type="submit" disabled={!newCollectionName.trim()}>
              Add collection
            </Button>
          </form>
        </Card>

        {goalMet && !editingId && (
          <Card className="mt-6 flex items-center justify-between bg-green-50 ring-green-200">
            <p className="text-sm text-green-900">
              Nice — your closet is strong enough for accurate sizing.
            </p>
            <LinkButton href="/check">Check a product →</LinkButton>
          </Card>
        )}
      </div>

      {/* The file pulled fully out onto the desk */}
      {detailGroup && (
        <DetailSheet
          group={detailGroup}
          collections={collections}
          inBucket={inBucket}
          onBucket={toggleBucket}
          onClose={() => setDetailGroup(null)}
          onEdit={(id) => { setDetailGroup(null); setEditingId(id); }}
          onPatch={patch}
          onRemove={(id) => { remove(id); }}
        />
      )}

      {/* The comparison bucket — items set aside to look at together */}
      <BucketPanel items={compareItems} onRemove={toggleBucket} onClear={() => setCompareItems([])} onOpen={(it) => setDetailGroup({ key: it.id, label: it.displayName || it.brand, items: [it], isVariant: false })} />
    </main>
  );
}

/** Group items in a collection by groupId (variants collapse into one card). */
function itemsIn(items: Item[], collectionId: string): Item[] {
  return items
    .filter((it) => it.collectionId === collectionId)
    .sort((a, b) => a.sortIndex - b.sortIndex);
}

function CollectionSection({
  collection,
  items,
  allCollections,
  editingId,
  onEdit,
  onPatch,
  onRemove,
  onReload,
  onMove,
  selectMode,
  selected,
  onToggleSelect,
  view,
  colorSeed,
  onOpenDetail,
  onBucket,
  inBucket,
  undeletable,
}: {
  collection: Collection;
  items: Item[];
  allCollections: Collection[];
  editingId: string | null;
  onEdit: (id: string | null) => void;
  onPatch: (id: string, data: Record<string, unknown>) => void;
  onRemove: (id: string) => void;
  onReload: () => void;
  onMove: (collectionId: string | null, itemId: string, dir: -1 | 1) => void;
  selectMode: boolean;
  selected: Set<string>;
  onToggleSelect: (id: string) => void;
  colorSeed: number;
  onOpenDetail: (g: Group) => void;
  onBucket: (it: Item) => void;
  inBucket: (id: string) => boolean;
  view: "list" | "grid";
  undeletable?: boolean;
}) {
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(collection.name);

  // Build display groups: variants (shared groupId) collapse into one entry.
  const groups = buildGroups(items);

  async function saveName() {
    if (name.trim() && name !== collection.name) {
      await fetch("/api/collections", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: collection.id, name: name.trim() }),
      });
      onReload();
    }
    setRenaming(false);
  }

  async function deleteCollection() {
    if (!confirm(`Delete "${collection.name}"? Items move to Uncategorized.`)) return;
    await fetch(`/api/collections?id=${collection.id}`, { method: "DELETE" });
    onReload();
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        {renaming ? (
          <div className="flex items-center gap-2">
            <input autoFocus className="rounded-lg border border-neutral-300 px-2 py-1 text-sm font-semibold"
              value={name} onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveName()} />
            <button onClick={saveName} className="text-xs text-brand hover:underline">Save</button>
            <button onClick={() => { setName(collection.name); setRenaming(false); }}
              className="text-xs text-ink-faint hover:underline">Cancel</button>
          </div>
        ) : (
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-ink-soft">
            {collection.name}
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-normal normal-case text-ink-faint">
              {items.length}
            </span>
          </h2>
        )}
        {!renaming && (
          <div className="flex items-center gap-3 text-xs">
            {items.length > 0 && collection.id !== "__uncat__" && (
              <Link href={`/refresh?collections=${collection.id}`} className="text-ink-faint hover:text-brand">
                ↻ Refresh
              </Link>
            )}
            {!undeletable && (
              <>
                <button onClick={() => setRenaming(true)} className="text-ink-faint hover:text-brand">Rename</button>
                <button onClick={deleteCollection} className="text-ink-faint hover:text-red-600">Delete</button>
              </>
            )}
          </div>
        )}
      </div>

      {view === "grid" && !selectMode ? (
        <Folder
          groups={groups}
          colorSeed={colorSeed}
          onOpen={onOpenDetail}
          onBucket={onBucket}
          inBucket={inBucket}
        />
      ) : items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-neutral-200 px-4 py-3 text-xs text-ink-faint">
          Empty — items of this type will file here automatically.
        </p>
      ) : (
        <div className="space-y-2">
          {groups.map((g) =>
            editingId && g.items.some((it) => it.id === editingId) ? (
              <EditRow
                key={g.key}
                item={g.items.find((it) => it.id === editingId)!}
                collections={allCollections}
                onCancel={() => onEdit(null)}
                onSaved={() => { onEdit(null); onReload(); }}
              />
            ) : (
              <ItemCard
                key={g.key}
                group={g}
                collections={allCollections}
                onEdit={onEdit}
                onPatch={onPatch}
                onRemove={onRemove}
                onMove={(itemId, dir) => onMove(collection.id === "__uncat__" ? null : collection.id, itemId, dir)}
                canMoveUp={standaloneIndex(groups, g) > 0}
                canMoveDown={standaloneIndex(groups, g) < standaloneCount(groups) - 1 && standaloneIndex(groups, g) >= 0}
                selectMode={selectMode}
                selected={selected}
                onToggleSelect={onToggleSelect}
              />
            ),
          )}
        </div>
      )}
    </div>
  );
}

type Group = { key: string; label: string; items: Item[]; isVariant: boolean };

function buildGroups(items: Item[]): Group[] {
  const byGroup = new Map<string, Item[]>();
  const singles: Group[] = [];
  for (const it of items) {
    if (it.groupId) {
      const arr = byGroup.get(it.groupId) ?? [];
      arr.push(it);
      byGroup.set(it.groupId, arr);
    } else {
      singles.push({ key: it.id, label: `${it.brand} ${it.category}`, items: [it], isVariant: false });
    }
  }
  const grouped: Group[] = [];
  for (const [gid, arr] of byGroup) {
    grouped.push({
      key: `g:${gid}`,
      label: arr[0].groupName || `${arr[0].brand} ${arr[0].category}`,
      items: arr,
      isVariant: true,
    });
  }
  return [...grouped, ...singles];
}

// Index/count among only the standalone (non-variant) groups — reorder applies
// to those, since variant groups are collapsed.
function standaloneIndex(groups: Group[], g: Group): number {
  return groups.filter((x) => !x.isVariant).findIndex((x) => x.key === g.key);
}
function standaloneCount(groups: Group[]): number {
  return groups.filter((x) => !x.isVariant).length;
}

function ItemCard({
  group,
  collections,
  onEdit,
  onPatch,
  onRemove,
  onMove,
  canMoveUp,
  canMoveDown,
  selectMode,
  selected,
  onToggleSelect,
}: {
  group: Group;
  collections: Collection[];
  onEdit: (id: string) => void;
  onPatch: (id: string, data: Record<string, unknown>) => void;
  onRemove: (id: string) => void;
  onMove: (itemId: string, dir: -1 | 1) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  selectMode: boolean;
  selected: Set<string>;
  onToggleSelect: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const head = group.items[0];

  if (group.isVariant) {
    return (
      <Card className="!p-4 animate-fade-in-up">
        <button onClick={() => setExpanded((x) => !x)} className="flex w-full items-center justify-between text-left">
          <div className="flex items-center gap-2 font-medium text-ink">
            <ColorDot color={head.color} />
            {group.label}
            <span className="rounded-full bg-brand-tint px-2 py-0.5 text-[10px] font-semibold text-brand">
              {group.items.length} variants
            </span>
          </div>
          <span className={`text-ink-faint transition-transform ${expanded ? "rotate-180" : ""}`}>⌄</span>
        </button>
        {expanded && (
          <div className="mt-3 grid grid-cols-3 gap-2 border-t border-neutral-100 pt-3 sm:grid-cols-4">
            {group.items.map((it) => (
              <div key={it.id} className="group/var relative flex flex-col items-center gap-1 rounded-lg border border-neutral-200 bg-white p-2">
                <ItemThumb item={it} size={40} />
                <span className="text-[11px] font-medium text-ink">{it.size}</span>
                {/* hover popover with the description + actions */}
                <div className="pointer-events-none absolute -top-1 left-1/2 z-20 w-36 -translate-x-1/2 -translate-y-full rounded-lg border border-neutral-200 bg-white p-2 text-center opacity-0 shadow-lift transition-opacity group-hover/var:pointer-events-auto group-hover/var:opacity-100">
                  <p className="text-xs font-medium text-ink">size {it.size}{it.color ? ` · ${it.color}` : ""}</p>
                  <p className="text-[11px] text-amber-500">{"★".repeat(it.fitRating)}<span className="text-neutral-300">{"★".repeat(5 - it.fitRating)}</span></p>
                  <div className="mt-1 flex justify-center gap-2 text-[11px]">
                    <button onClick={() => onEdit(it.id)} className="text-ink-faint hover:text-brand">Edit</button>
                    <button onClick={() => onPatch(it.id, { groupId: null, groupName: null })} className="text-ink-faint hover:text-brand">Unmerge</button>
                    <button onClick={() => onRemove(it.id)} className="text-ink-faint hover:text-red-600">Remove</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    );
  }

  const it = head;
  const isSel = selected.has(it.id);
  return (
    <Card
      className={`flex items-center justify-between !p-4 animate-fade-in-up ${
        selectMode ? "cursor-pointer" : ""
      } ${isSel ? "ring-2 ring-brand" : ""}`}
    >
      <div
        className="flex min-w-0 items-center gap-3"
        onClick={selectMode ? () => onToggleSelect(it.id) : undefined}
      >
        {selectMode && (
          <input
            type="checkbox"
            checked={isSel}
            onChange={() => onToggleSelect(it.id)}
            className="h-4 w-4 flex-shrink-0 accent-brand"
          />
        )}
        {/* Reorder arrows (hidden in select mode) */}
        {!selectMode && (
          <div className="flex flex-col leading-none">
            <button
              onClick={() => onMove(it.id, -1)}
              disabled={!canMoveUp}
              className="text-ink-faint hover:text-brand disabled:opacity-30"
              title="Move up"
            >▲</button>
            <button
              onClick={() => onMove(it.id, 1)}
              disabled={!canMoveDown}
              className="text-ink-faint hover:text-brand disabled:opacity-30"
              title="Move down"
            >▼</button>
          </div>
        )}
        <ItemThumb item={it} size={36} />
        <div className="min-w-0">
          <div className="flex items-center gap-2 font-medium text-ink">
            <ColorDot color={it.color} />
            <span className="truncate">
              {it.displayName ? it.displayName : it.brand} · <span className="text-ink-soft">{garmentLabel(it.category)}</span> · size {it.size}
            </span>
            {it.gender && <GenderBadge gender={it.gender} />}
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-ink-faint">
            <span className="text-amber-500">{"★".repeat(it.fitRating)}<span className="text-neutral-300">{"★".repeat(5 - it.fitRating)}</span></span>
            {it.color && <span>· {it.color}</span>}
            {it.areaNotesJson && <span>· {safeNotes(it.areaNotesJson)}</span>}
          </div>
        </div>
      </div>
      {!selectMode && (
        <div className="flex flex-shrink-0 items-center gap-2 text-xs">
          <MoveMenu
            collections={collections}
            currentId={it.collectionId}
            onMove={(cid) => onPatch(it.id, { collectionId: cid })}
          />
          <button onClick={() => onEdit(it.id)} className="text-ink-soft hover:text-brand">Edit</button>
          <button onClick={() => onRemove(it.id)} className="text-ink-faint hover:text-red-600">Remove</button>
        </div>
      )}
    </Card>
  );
}

function MoveMenu({
  collections,
  currentId,
  onMove,
}: {
  collections: Collection[];
  currentId: string | null;
  onMove: (collectionId: string) => void;
}) {
  return (
    <select
      value={currentId ?? ""}
      onChange={(e) => onMove(e.target.value)}
      className="rounded-lg border border-neutral-300 px-2 py-1 text-xs text-ink-soft"
      title="Move to collection"
    >
      {collections.map((c) => (
        <option key={c.id} value={c.id}>{c.name}</option>
      ))}
    </select>
  );
}

function EditRow({
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
    fitRating: item.fitRating, color: item.color ?? "",
    collectionId: item.collectionId ?? "",
    areaNotes: safeNotes(item.areaNotesJson) ?? "",
    imageDataUrl: item.imageDataUrl ?? "",
  });
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
        fitRating: f.fitRating, color: f.color || null,
        collectionId: f.collectionId || null,
        imageDataUrl: f.imageDataUrl || null,
        areaNotesJson: f.areaNotes ? JSON.stringify({ notes: f.areaNotes }) : null,
      }),
    });
    setSaving(false);
    onSaved();
  }

  async function pickImage(file: File | undefined) {
    if (!file) return;
    try { setF((x) => ({ ...x, imageDataUrl: "" })); const d = await resizeImageToDataUrl(file, 320); setF((x) => ({ ...x, imageDataUrl: d })); } catch { /* ignore */ }
  }

  return (
    <Card className="relative !p-4 ring-brand/30 animate-fade-in-up">
      {/* small corner save — inside the card, top-right; the Photo row below
          reserves right padding (pr-20) so its helper text never sits under it */}
      <button onClick={save} disabled={saving || !f.brand || !f.size || !isValidSize(f.category, f.size)}
        className="absolute right-3 top-3 z-10 rounded-lg bg-brand px-3 py-1 text-xs font-semibold text-white shadow-card hover:bg-brand-dark disabled:opacity-50">
        {saving ? "…" : "Save"}
      </button>
      <div className="grid gap-3 sm:grid-cols-6">
        <div className="sm:col-span-6 pr-20">
          <Field label="Photo" hint="optional">
            <div className="flex items-center gap-3">
              <label className="flex h-14 w-14 flex-shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-neutral-300 bg-white text-lg text-ink-faint hover:border-brand">
                {f.imageDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={f.imageDataUrl} alt="" className="h-full w-full object-cover" />
                ) : garmentGlyph(f.category)}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => pickImage(e.target.files?.[0])} />
              </label>
              {f.imageDataUrl && <button type="button" onClick={() => setF({ ...f, imageDataUrl: "" })} className="text-xs text-ink-faint hover:text-red-600">remove</button>}
            </div>
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Brand"><BrandInput value={f.brand} onChange={(v) => setF({ ...f, brand: v })} /></Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Name" hint="optional"><input className={inputClass} value={f.displayName} placeholder="e.g. Blue Oxford" onChange={(e) => setF({ ...f, displayName: e.target.value })} /></Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Type">
            <CategoryPicker value={f.category} onChange={(v) => setF({ ...f, category: v })} />
          </Field>
        </div>
        <div className="sm:col-span-1">
          <Field label="Line">
            <select className={inputClass} value={f.gender} onChange={(e) => setF({ ...f, gender: e.target.value })}>
              {GENDERS.map((g) => <option key={g.v} value={g.v}>{g.label}</option>)}
            </select>
          </Field>
        </div>
        <div className="sm:col-span-1">
          <Field label="Fit">
            <select className={inputClass} value={f.fitRating} onChange={(e) => setF({ ...f, fitRating: Number(e.target.value) })}>
              {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}/5</option>)}
            </select>
          </Field>
        </div>
        <div className="sm:col-span-6">
          <Field label="Size">
            <SizeInput category={f.category} value={f.size} onChange={(v) => setF({ ...f, size: v })} />
          </Field>
        </div>
        <div className="sm:col-span-3">
          <Field label="Color"><ColorPicker value={f.color} onChange={(v) => setF({ ...f, color: v })} /></Field>
        </div>
        <div className="sm:col-span-3">
          <Field label="Collection">
            <select className={inputClass} value={f.collectionId} onChange={(e) => setF({ ...f, collectionId: e.target.value })}>
              <option value="">Uncategorized</option>
              {collections.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
        </div>
        <div className="sm:col-span-6">
          <Field label="Fit notes"><input className={inputClass} value={f.areaNotes} onChange={(e) => setF({ ...f, areaNotes: e.target.value })} /></Field>
        </div>
        <div className="flex gap-2 sm:col-span-6">
          <Button onClick={save} disabled={saving || !f.brand || !f.size || !isValidSize(f.category, f.size)}>{saving ? "Saving…" : "Save changes"}</Button>
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        </div>
      </div>
    </Card>
  );
}

function ColorPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  // Current swatch color to feed the native wheel (falls back to grey).
  const wheelValue = colorHex(value) ?? "#9ca3af";
  return (
    <div className="space-y-2">
      {/* Two rows of preset swatches */}
      <div className="grid grid-cols-10 gap-1.5">
        {COLOR_PRESETS.map((c) => (
          <button
            key={c.name}
            type="button"
            title={c.name}
            onClick={() => onChange(value === c.name ? "" : c.name)}
            className={`h-6 w-6 rounded-full border transition-transform hover:scale-110 ${
              value === c.name ? "scale-110 border-brand ring-2 ring-brand/40" : "border-neutral-300"
            }`}
            style={{ backgroundColor: c.hex }}
          />
        ))}
      </div>
      {/* Free text + color wheel */}
      <div className="flex items-center gap-2">
        <input
          className={inputClass + " flex-1"}
          placeholder="or type a color…"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <label
          className="relative flex h-9 w-9 flex-shrink-0 cursor-pointer items-center justify-center rounded-lg border border-neutral-300"
          title="Pick any color"
          style={{ backgroundColor: wheelValue }}
        >
          <input
            type="color"
            value={wheelValue}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
          <span className="pointer-events-none text-xs mix-blend-difference text-white">🎨</span>
        </label>
      </div>
    </div>
  );
}

function GenderBadge({ gender }: { gender: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    mens: { label: "M", cls: "bg-blue-100 text-blue-700" },
    womens: { label: "W", cls: "bg-pink-100 text-pink-700" },
    unisex: { label: "U", cls: "bg-neutral-100 text-neutral-600" },
  };
  const m = map[gender];
  if (!m) return null;
  return (
    <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${m.cls}`} title={gender}>
      {m.label}
    </span>
  );
}

function ColorDot({ color }: { color: string | null }) {
  const hex = colorHex(color);
  if (!hex) return null;
  return (
    <span
      className="inline-block h-3 w-3 flex-shrink-0 rounded-full border border-neutral-300"
      style={{ backgroundColor: hex }}
      title={color ?? undefined}
    />
  );
}

function safeNotes(json: string | null): string | undefined {
  if (!json) return undefined;
  try { return JSON.parse(json)?.notes ?? undefined; } catch { return undefined; }
}

// A small square thumbnail: the user's photo if present, else a color-tinted
// glyph. Used in list rows and (larger) in grid tiles.
function ItemThumb({ item, size }: { item: Item; size: number }) {
  const hex = colorHex(item.color);
  if (item.imageDataUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={item.imageDataUrl} alt="" className="flex-shrink-0 rounded-lg object-cover"
        style={{ width: size, height: size }} />
    );
  }
  return (
    <div className="flex flex-shrink-0 items-center justify-center rounded-lg border border-neutral-200"
      style={{ width: size, height: size, backgroundColor: hex ?? "#f5f5f5", fontSize: size * 0.5 }}>
      {garmentGlyph(item.category)}
    </div>
  );
}

// ---------------- Folder view (physical filing metaphor) ----------------
//
// Each COLLECTION is drawn as a real folder — a tabbed, colored sleeve that is
// clearly a different color from the white "file" cards tucked inside it. The
// items stack, each showing just one key-info row, with the front-most file
// fully open. Hover a file to peek at its overview; click to pull it fully out
// onto the "desk" (the detail sheet). A comparison bucket lets you set a few
// files aside to look at together — the way you pull a few things out of a real
// closet when planning an outfit.

function itemName(it: Item): string {
  return it.displayName || `${it.brand} ${garmentLabel(it.category)}`;
}

// Folder sleeve colors — each collection reads as its own folder, distinct from
// the white file cards inside.
const FOLDER_PALETTE = [
  { tab: "bg-amber-300", body: "from-amber-100 to-amber-200/80", edge: "border-amber-400/60" },
  { tab: "bg-sky-300", body: "from-sky-100 to-sky-200/80", edge: "border-sky-400/60" },
  { tab: "bg-emerald-300", body: "from-emerald-100 to-emerald-200/80", edge: "border-emerald-400/60" },
  { tab: "bg-rose-300", body: "from-rose-100 to-rose-200/80", edge: "border-rose-400/60" },
  { tab: "bg-violet-300", body: "from-violet-100 to-violet-200/80", edge: "border-violet-400/60" },
  { tab: "bg-orange-300", body: "from-orange-100 to-orange-200/80", edge: "border-orange-400/60" },
];
const UNCAT_FOLDER = { tab: "bg-neutral-300", body: "from-neutral-100 to-neutral-200/80", edge: "border-neutral-300" };
function folderColor(seed: number) {
  return seed < 0 ? UNCAT_FOLDER : FOLDER_PALETTE[seed % FOLDER_PALETTE.length];
}

function Folder({
  groups,
  colorSeed,
  onOpen,
  onBucket,
  inBucket,
}: {
  groups: Group[];
  colorSeed: number;
  onOpen: (g: Group) => void;
  onBucket: (it: Item) => void;
  inBucket: (id: string) => boolean;
}) {
  const c = folderColor(colorSeed);
  return (
    <div className="relative pt-3">
      {/* folder tab */}
      <span className={`absolute left-5 top-0 h-4 w-24 rounded-t-lg ${c.tab} shadow-sm`} />
      {/* folder sleeve */}
      <div className={`relative rounded-xl rounded-tl-none border ${c.edge} bg-gradient-to-b ${c.body} p-3 shadow-card`}>
        {groups.length === 0 ? (
          <div className="flex h-20 items-center justify-center rounded-lg border-2 border-dashed border-white/70 text-xs italic text-black/40">
            Empty folder — items of this type file here automatically.
          </div>
        ) : (
          <div className="relative">
            {groups.map((g, i) => (
              <FileCard
                key={g.key}
                group={g}
                index={i}
                front={i === groups.length - 1}
                onOpen={onOpen}
                onBucket={onBucket}
                inBucket={inBucket}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// A single "file" in the folder. Collapsed cards show only their top key-info
// row and tuck slightly under the next file; the front file is open. Hover to
// expand a file's overview in place ("peek"); click opens the full detail sheet.
function FileCard({
  group,
  index,
  front,
  onOpen,
  onBucket,
  inBucket,
}: {
  group: Group;
  index: number;
  front: boolean;
  onOpen: (g: Group) => void;
  onBucket: (it: Item) => void;
  inBucket: (id: string) => boolean;
}) {
  const head = group.items[0];
  const name = itemName(head);
  const sizeLabel = group.isVariant ? `${group.items.length} sizes` : `size ${head.size}`;
  const bucketed = inBucket(head.id);
  return (
    <div
      className="group/file relative"
      style={{ marginTop: index === 0 ? 0 : "-0.4rem", zIndex: index + 1 }}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => onOpen(group)}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onOpen(group))}
        className="cursor-pointer rounded-lg border border-neutral-200 bg-white px-3 py-2 shadow-sm transition-all duration-200 hover:z-30 hover:border-neutral-300 hover:shadow-lift"
      >
        {/* key-info row — always visible */}
        <div className="flex items-center gap-2">
          <span className="text-base leading-none">{garmentGlyph(head.category)}</span>
          <ColorDot color={head.color} />
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{name}</span>
          {group.isVariant && (
            <span className="flex-shrink-0 rounded-full bg-brand-tint px-1.5 py-0.5 text-[9px] font-semibold text-brand">
              {group.items.length}
            </span>
          )}
          <span className="flex-shrink-0 text-xs text-ink-faint">{garmentLabel(head.category)} · {sizeLabel}</span>
        </div>

        {/* overview — open on the front file, and on hover for the rest */}
        <div
          className={`overflow-hidden transition-all duration-200 ${
            front ? "mt-2 max-h-40 opacity-100" : "max-h-0 opacity-0 group-hover/file:mt-2 group-hover/file:max-h-40 group-hover/file:opacity-100"
          }`}
        >
          <div className="flex items-center gap-3 border-t border-neutral-100 pt-2">
            <ItemThumb item={head} size={40} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-ink-soft">
                {head.brand}
                {head.gender ? <span className="ml-1"><GenderBadge gender={head.gender} /></span> : null}
              </p>
              <p className="text-[11px] text-amber-500">
                {"★".repeat(head.fitRating)}<span className="text-neutral-300">{"★".repeat(5 - head.fitRating)}</span>
              </p>
              {head.color && <p className="text-[11px] text-ink-faint">{head.color}</p>}
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onBucket(head); }}
              className={`flex-shrink-0 rounded-md border px-2 py-1 text-[11px] font-medium transition-colors ${
                bucketed
                  ? "border-brand bg-brand-tint text-brand"
                  : "border-neutral-200 text-ink-soft hover:border-brand hover:text-brand"
              }`}
              title="Set aside to compare"
            >
              {bucketed ? "✓ Bucket" : "＋ Bucket"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// The file pulled fully out onto the desk — a right-side sheet with everything.
function DetailSheet({
  group,
  collections,
  inBucket,
  onBucket,
  onClose,
  onEdit,
  onPatch,
  onRemove,
}: {
  group: Group;
  collections: Collection[];
  inBucket: (id: string) => boolean;
  onBucket: (it: Item) => void;
  onClose: () => void;
  onEdit: (id: string) => void;
  onPatch: (id: string, data: Record<string, unknown>) => void;
  onRemove: (id: string) => void;
}) {
  const head = group.items[0];
  const name = itemName(head);
  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" />
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-fade-in-up relative z-10 flex h-full w-full max-w-sm flex-col overflow-y-auto bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between border-b border-neutral-200 px-5 py-4">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink-faint">On the desk</p>
            <h3 className="truncate text-lg font-semibold text-ink">{name}</h3>
          </div>
          <button onClick={onClose} className="ml-3 flex-shrink-0 text-2xl leading-none text-ink-faint hover:text-ink" aria-label="Close">×</button>
        </div>

        <div className="flex items-center gap-4 px-5 py-5">
          <ItemThumb item={head} size={72} />
          <div className="min-w-0 space-y-1 text-sm">
            <p className="font-medium text-ink">{head.brand}</p>
            <p className="text-ink-soft">{garmentLabel(head.category)}{head.gender ? ` · ${head.gender}` : ""}</p>
            <p className="text-amber-500">{"★".repeat(head.fitRating)}<span className="text-neutral-300">{"★".repeat(5 - head.fitRating)}</span></p>
          </div>
        </div>

        {/* variants OR single size */}
        <div className="border-t border-neutral-100 px-5 py-4">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-ink-faint">
            {group.isVariant ? `${group.items.length} variants` : "Details"}
          </p>
          <div className="space-y-1.5">
            {group.items.map((v) => (
              <div key={v.id} className="flex items-center justify-between rounded-lg border border-neutral-100 px-3 py-2 text-sm">
                <span className="flex items-center gap-2">
                  <ColorDot color={v.color} />
                  <span className="font-medium text-ink">size {v.size}</span>
                  {v.color && <span className="text-ink-faint">· {v.color}</span>}
                </span>
                <span className="flex items-center gap-3 text-xs">
                  <button onClick={() => onEdit(v.id)} className="text-ink-soft hover:text-brand">Edit</button>
                  <button onClick={() => onRemove(v.id)} className="text-ink-faint hover:text-red-600">Remove</button>
                </span>
              </div>
            ))}
          </div>
          {head.areaNotesJson && safeNotes(head.areaNotesJson) && (
            <p className="mt-3 rounded-lg bg-neutral-50 px-3 py-2 text-xs text-ink-soft">📝 {safeNotes(head.areaNotesJson)}</p>
          )}
        </div>

        {/* actions */}
        <div className="mt-auto space-y-3 border-t border-neutral-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <MoveMenu collections={collections} currentId={head.collectionId} onMove={(cid) => onPatch(head.id, { collectionId: cid })} />
            <button
              onClick={() => onBucket(head)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                inBucket(head.id) ? "border-brand bg-brand-tint text-brand" : "border-neutral-200 text-ink-soft hover:border-brand hover:text-brand"
              }`}
            >
              {inBucket(head.id) ? "✓ In bucket" : "＋ Add to bucket"}
            </button>
          </div>
          <p className="text-[11px] text-ink-faint">Precise measurements stay private — never shared by code.</p>
        </div>
      </div>
    </div>
  );
}

// A floating "bucket" — files set aside to compare side by side.
function BucketPanel({
  items,
  onRemove,
  onClear,
  onOpen,
}: {
  items: Item[];
  onRemove: (it: Item) => void;
  onClear: () => void;
  onOpen: (it: Item) => void;
}) {
  const [open, setOpen] = useState(true);
  if (items.length === 0) return null;
  return (
    <div className="fixed bottom-4 right-4 z-40">
      {open ? (
        <div className="w-72 rounded-2xl border border-neutral-200 bg-white p-3 shadow-2xl">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-ink">🧺 Comparison bucket <span className="text-ink-faint">({items.length})</span></p>
            <div className="flex items-center gap-2 text-xs">
              <button onClick={onClear} className="text-ink-faint hover:text-red-600">Clear</button>
              <button onClick={() => setOpen(false)} className="text-ink-faint hover:text-ink" aria-label="Collapse">–</button>
            </div>
          </div>
          <div className="grid max-h-72 grid-cols-2 gap-2 overflow-y-auto">
            {items.map((it) => (
              <div key={it.id} className="relative rounded-lg border border-neutral-100 p-2">
                <button
                  onClick={() => onRemove(it)}
                  className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-neutral-200 text-[10px] leading-none text-ink-soft hover:bg-red-100 hover:text-red-600"
                  aria-label="Remove from bucket"
                >×</button>
                <button onClick={() => onOpen(it)} className="flex w-full flex-col items-center gap-1 text-center">
                  <ItemThumb item={it} size={44} />
                  <span className="w-full truncate text-[11px] font-medium text-ink">{itemName(it)}</span>
                  <span className="text-[10px] text-ink-faint">{garmentLabel(it.category)} · {it.size}</span>
                </button>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[10px] text-ink-faint">Held for side-by-side comparison — not a saved list.</p>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-full bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-lift"
        >
          🧺 Bucket <span className="rounded-full bg-white/25 px-1.5">{items.length}</span>
        </button>
      )}
    </div>
  );
}
