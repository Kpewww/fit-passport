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
import { FitDirectionInput, FitScaleProvider } from "@/components/FitDirectionInput";
import { DIRECTION_DEFAULT, ratingFromDirection } from "@/lib/fitDirection";
import { ADD_STEPS, type AddStep, canSubmit, stepReady } from "@/lib/addFlow";
import { COLOR_PRESETS, colorHex } from "@/lib/colors";

type Item = {
  id: string;
  brand: string;
  displayName: string | null;
  category: string;
  gender: string | null;
  size: string;
  region: string | null;
  fitRating: number;
  fitDirection?: number | null;
  areaNotesJson: string | null;
  color: string | null;
  imageDataUrl: string | null;
  collectionId: string | null;
  sortIndex: number;
  groupId: string | null;
  groupName: string | null;
  createdAt?: string;
  editHistory?: string | null;
};

type Collection = { id: string; name: string; sortIndex: number; itemCount: number; color?: string | null };

const GENDERS = [
  { v: "", label: "—" },
  { v: "mens", label: "Men's" },
  { v: "womens", label: "Women's" },
  { v: "unisex", label: "Unisex" },
];

const BLANK = { brand: "", displayName: "", category: "tshirt", gender: "", size: "", fitRating: 5, fitDirection: DIRECTION_DEFAULT, areaNotes: "", color: "", onlineAvailable: true, imageDataUrl: "" };

export default function ClosetPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionColor, setNewCollectionColor] = useState<string | null>(null);
  // Merge-select mode
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  // Closet view mode
  const [view, setView] = useState<"list" | "grid">("list");
  // Folder view: the file "pulled fully out" onto the desk (detail sheet), and
  // the comparison "bucket" — items set aside to view side-by-side, mirroring
  // how you pull a few garments out of a real closet when planning an outfit.
  const [detailGroup, setDetailGroup] = useState<Group | null>(null);
  const [compareItems, setCompareItems] = useState<Item[]>([]);
  // Reorder mode: only when ON do the drag/arrow controls appear (for both
  // folders and items), so the closet reads cleanly the rest of the time.
  const [reorderMode, setReorderMode] = useState(false);

  // Swap a whole collection with its neighbor in the sort order.
  async function moveCollection(id: string, dir: -1 | 1) {
    const ordered = collections.slice().sort((a, b) => a.sortIndex - b.sortIndex);
    const idx = ordered.findIndex((c) => c.id === id);
    const swap = idx + dir;
    if (idx < 0 || swap < 0 || swap >= ordered.length) return;
    const a = ordered[idx];
    const b = ordered[swap];
    await Promise.all([
      fetch("/api/collections", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: a.id, sortIndex: b.sortIndex }) }),
      fetch("/api/collections", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: b.id, sortIndex: a.sortIndex }) }),
    ]);
    load();
  }

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

  const load = useCallback(async () => {
    const [c, i] = await Promise.all([
      fetch("/api/collections").then((r) => r.json()),
      fetch("/api/closet").then((r) => r.json()),
    ]);
    setCollections(c.collections);
    setItems(i.items);
  }, []);
  useEffect(() => { load(); }, [load]);

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
      body: JSON.stringify({ name: newCollectionName.trim(), color: newCollectionColor }),
    });
    setNewCollectionName("");
    setNewCollectionColor(null);
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
    <FitScaleProvider>
    <main className="flex-1">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-serif text-4xl text-ink">Your closet</h1>
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
              <div className="flex items-center gap-2">
                {/* Reorder toggle — reveals folder + item reorder controls */}
                <button
                  onClick={() => setReorderMode((v) => !v)}
                  title={reorderMode ? "Done reordering" : "Reorder folders & items"}
                  className={`inline-flex h-7 items-center gap-1 rounded-lg border px-2 text-xs font-medium ${
                    reorderMode ? "border-brand bg-brand text-white" : "border-neutral-300 text-ink-soft hover:bg-neutral-100"
                  }`}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 6l-3 3 3 3M5 9h11M16 12l3 3-3 3M19 15H8" /></svg>
                  {reorderMode ? "Done" : "Reorder"}
                </button>
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
              </div>
            )}
          </div>
        </div>

        {/* Add an item — one question per screen (see AddItemFlow). */}
        <AddItemFlow onAdded={load} />

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
            {reorderMode && (
              <p className="rounded-lg border border-brand/30 bg-brand-tint/40 px-3 py-2 text-xs text-ink-soft">
                ⇅ Reorder mode — use the ▲▼ arrows to move folders, and the arrows on each item to reorder pieces. Tap <strong>Done</strong> when finished.
              </p>
            )}
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
                reorderMode={reorderMode}
                canFolderUp={i > 0}
                canFolderDown={i < buckets.length - 1}
                onMoveFolder={(dir) => moveCollection(collection.id, dir)}
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
                reorderMode={reorderMode}
                canFolderUp={false}
                canFolderDown={false}
                onMoveFolder={() => {}}
                undeletable
              />
            )}
          </div>
        )}

        {/* Add collection */}
        <Card className="mt-6">
          <form onSubmit={addCollection} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Field label="New collection">
                <input className={inputClass} placeholder="e.g. Formal, Gym, Winter"
                  value={newCollectionName} onChange={(e) => setNewCollectionName(e.target.value)} />
              </Field>
            </div>
            <div>
              <Field label="Folder color" hint="optional">
                <FolderColorPicker value={newCollectionColor} onPick={setNewCollectionColor} />
              </Field>
            </div>
            <Button variant="secondary" type="submit" disabled={!newCollectionName.trim()}>
              Add collection
            </Button>
          </form>
        </Card>

        {goalMet && !editingId && (
          <Card className="mt-6 flex flex-col items-start gap-3 bg-green-50 ring-green-200 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
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
          onReload={load}
          onPatch={patch}
          onRemove={(id) => { remove(id); }}
        />
      )}

      {/* The comparison bucket — items set aside to look at together */}
      <BucketPanel items={compareItems} onRemove={toggleBucket} onClear={() => setCompareItems([])} onOpen={(it) => setDetailGroup({ key: it.id, label: it.displayName || it.brand, items: [it], isVariant: false })} />
    </main>
    </FitScaleProvider>
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
  reorderMode,
  canFolderUp,
  canFolderDown,
  onMoveFolder,
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
  reorderMode: boolean;
  canFolderUp: boolean;
  canFolderDown: boolean;
  onMoveFolder: (dir: -1 | 1) => void;
  undeletable?: boolean;
}) {
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(collection.name);
  const [pickingColor, setPickingColor] = useState(false);

  async function setColor(color: string | null) {
    setPickingColor(false);
    await fetch("/api/collections", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: collection.id, color }),
    });
    onReload();
  }

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
            {/* Reorder handle for the whole folder — only in reorder mode */}
            {reorderMode && !undeletable && (
              <span className="flex items-center gap-0.5">
                <button onClick={() => onMoveFolder(-1)} disabled={!canFolderUp}
                  className="text-ink-faint hover:text-brand disabled:opacity-30" title="Move folder up">▲</button>
                <button onClick={() => onMoveFolder(1)} disabled={!canFolderDown}
                  className="text-ink-faint hover:text-brand disabled:opacity-30" title="Move folder down">▼</button>
              </span>
            )}
            {collection.name}
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-normal normal-case text-ink-faint">
              {items.length}
            </span>
          </h2>
        )}
        {!renaming && (
          <div className="relative flex items-center gap-3 text-xs">
            {/* Folder color — editable in folder view (not for Uncategorized) */}
            {view === "grid" && !undeletable && (
              <button onClick={() => setPickingColor((v) => !v)} title="Folder color"
                className={`h-4 w-4 rounded-full ring-1 ring-black/10 ${folderColorFor(collection.color, colorSeed).swatch}`} />
            )}
            {pickingColor && (
              <div className="absolute right-0 top-6 z-30 rounded-xl border border-neutral-200 bg-white p-2 shadow-lift">
                <FolderColorPicker value={collection.color} onPick={setColor} />
              </div>
            )}
            {items.length > 0 && collection.id !== "__uncat__" && (
              <Link href={`/refresh?collections=${collection.id}`} className="text-ink-faint hover:text-brand"
                title="Re-rate how these pieces fit right now — bodies change, so this keeps your fit data current.">
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
          color={collection.color}
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
                reorderMode={reorderMode}
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
  reorderMode,
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
  reorderMode: boolean;
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
        {/* Reorder arrows — only in reorder mode (and never in select mode) */}
        {!selectMode && reorderMode && (
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
    fitRating: item.fitRating, fitDirection: item.fitDirection ?? DIRECTION_DEFAULT, color: item.color ?? "",
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
        fitRating: f.fitRating, fitDirection: f.fitDirection, color: f.color || null,
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
        <div className="sm:col-span-6">
          <Field label="How does it sit on you?">
            <FitDirectionInput
              value={f.fitDirection}
              onChange={(n) => setF({ ...f, fitDirection: n, fitRating: ratingFromDirection(n) })}
            />
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
// the white file cards inside. Keyed by name so a user's pick can be stored.
type FolderColor = { tab: string; body: string; edge: string; swatch: string };
const FOLDER_COLORS: Record<string, FolderColor> = {
  amber: { tab: "bg-amber-300", body: "from-amber-100 to-amber-200/80", edge: "border-amber-400/60", swatch: "bg-amber-300" },
  sky: { tab: "bg-sky-300", body: "from-sky-100 to-sky-200/80", edge: "border-sky-400/60", swatch: "bg-sky-300" },
  emerald: { tab: "bg-emerald-300", body: "from-emerald-100 to-emerald-200/80", edge: "border-emerald-400/60", swatch: "bg-emerald-300" },
  rose: { tab: "bg-rose-300", body: "from-rose-100 to-rose-200/80", edge: "border-rose-400/60", swatch: "bg-rose-300" },
  violet: { tab: "bg-violet-300", body: "from-violet-100 to-violet-200/80", edge: "border-violet-400/60", swatch: "bg-violet-300" },
  orange: { tab: "bg-orange-300", body: "from-orange-100 to-orange-200/80", edge: "border-orange-400/60", swatch: "bg-orange-300" },
  teal: { tab: "bg-teal-300", body: "from-teal-100 to-teal-200/80", edge: "border-teal-400/60", swatch: "bg-teal-300" },
  slate: { tab: "bg-slate-300", body: "from-slate-100 to-slate-200/80", edge: "border-slate-400/60", swatch: "bg-slate-300" },
};
const FOLDER_COLOR_ORDER = ["amber", "sky", "emerald", "rose", "violet", "orange", "teal", "slate"];
const UNCAT_FOLDER: FolderColor = { tab: "bg-neutral-300", body: "from-neutral-100 to-neutral-200/80", edge: "border-neutral-300", swatch: "bg-neutral-300" };

function folderColorFor(color: string | null | undefined, seed: number): FolderColor {
  if (color && FOLDER_COLORS[color]) return FOLDER_COLORS[color];
  if (seed < 0) return UNCAT_FOLDER;
  return FOLDER_COLORS[FOLDER_COLOR_ORDER[seed % FOLDER_COLOR_ORDER.length]];
}

// A compact row of color swatches for choosing a folder color.
function FolderColorPicker({
  value,
  onPick,
}: {
  value: string | null | undefined;
  onPick: (color: string | null) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <button
        type="button"
        onClick={() => onPick(null)}
        title="Auto color"
        className={`h-5 w-5 rounded-full border bg-white text-[9px] leading-none text-ink-faint ${
          !value ? "ring-2 ring-brand ring-offset-1" : "border-neutral-300"
        }`}
      >A</button>
      {FOLDER_COLOR_ORDER.map((name) => (
        <button
          key={name}
          type="button"
          onClick={() => onPick(name)}
          title={name}
          className={`h-5 w-5 rounded-full ${FOLDER_COLORS[name].swatch} ${
            value === name ? "ring-2 ring-brand ring-offset-1" : ""
          }`}
        />
      ))}
    </div>
  );
}

function Folder({
  groups,
  colorSeed,
  color,
  onOpen,
  onBucket,
  inBucket,
}: {
  groups: Group[];
  colorSeed: number;
  color?: string | null;
  onOpen: (g: Group) => void;
  onBucket: (it: Item) => void;
  inBucket: (id: string) => boolean;
}) {
  const c = folderColorFor(color, colorSeed);
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
// Format an ISO timestamp as a short human date-time.
function fmtWhen(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function DetailSheet({
  group,
  collections,
  inBucket,
  onBucket,
  onClose,
  onReload,
  onPatch,
  onRemove,
}: {
  group: Group;
  collections: Collection[];
  inBucket: (id: string) => boolean;
  onBucket: (it: Item) => void;
  onClose: () => void;
  onReload: () => void;
  onPatch: (id: string, data: Record<string, unknown>) => void;
  onRemove: (id: string) => void;
}) {
  const head = group.items[0];
  const name = itemName(head);
  // Which item (if any) is being edited inline, right here in the sheet.
  const [editId, setEditId] = useState<string | null>(null);
  const editItem = editId ? group.items.find((it) => it.id === editId) ?? null : null;

  const history = (() => {
    try {
      const arr = JSON.parse(head.editHistory || "[]");
      return Array.isArray(arr) ? (arr as string[]) : [];
    } catch {
      return [];
    }
  })();
  const lastEdited = history.length ? history[history.length - 1] : null;

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

        {/* Inline editor lives right inside the file — no bouncing to the list */}
        {editItem ? (
          <div className="px-5 py-5">
            <EditRow
              item={editItem}
              collections={collections}
              onCancel={() => setEditId(null)}
              onSaved={() => { setEditId(null); onReload(); }}
            />
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4 px-5 py-5">
              <ItemThumb item={head} size={72} />
              <div className="min-w-0 space-y-1 text-sm">
                <p className="font-medium text-ink">{head.brand}</p>
                <p className="text-ink-soft">{garmentLabel(head.category)}{head.gender ? ` · ${head.gender}` : ""}</p>
                <p className="text-amber-500">{"★".repeat(head.fitRating)}<span className="text-neutral-300">{"★".repeat(5 - head.fitRating)}</span></p>
              </div>
              {!group.isVariant && (
                <button onClick={() => setEditId(head.id)} className="ml-auto self-start rounded-lg border border-neutral-200 px-3 py-1.5 text-sm font-medium text-ink-soft hover:border-brand hover:text-brand">
                  ✎ Edit
                </button>
              )}
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
                      <button onClick={() => setEditId(v.id)} className="text-ink-soft hover:text-brand">Edit</button>
                      <button onClick={() => onRemove(v.id)} className="text-ink-faint hover:text-red-600">Remove</button>
                    </span>
                  </div>
                ))}
              </div>
              {head.areaNotesJson && safeNotes(head.areaNotesJson) && (
                <p className="mt-3 rounded-lg bg-neutral-50 px-3 py-2 text-xs text-ink-soft">📝 {safeNotes(head.areaNotesJson)}</p>
              )}
            </div>

            {/* timestamps: created · last modified · edit history */}
            <div className="border-t border-neutral-100 px-5 py-4 text-xs">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-ink-faint">History</p>
              <dl className="space-y-1 text-ink-soft">
                <div className="flex justify-between"><dt className="text-ink-faint">Created</dt><dd>{fmtWhen(head.createdAt)}</dd></div>
                <div className="flex justify-between"><dt className="text-ink-faint">Last modified</dt><dd>{lastEdited ? fmtWhen(lastEdited) : "never"}</dd></div>
              </dl>
              {history.length > 1 && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-ink-faint hover:text-brand">{history.length} recorded edits</summary>
                  <ul className="mt-1 space-y-0.5 border-l border-neutral-200 pl-3 text-ink-faint">
                    {history.slice().reverse().map((t, i) => (
                      <li key={i}>{fmtWhen(t)}</li>
                    ))}
                  </ul>
                </details>
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
          </>
        )}
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

/* ---------------------------------------------------------------------------
 * AddItemFlow — one question per screen.
 *
 * Replaces an eleven-field grid. Measured on a 390px phone, that grid was the
 * bulk of the 23 input controls the closet showed at once, on the page whose
 * whole job is to make someone add three garments — see
 * docs/design/information-architecture.md.
 *
 * Which questions survive is not taste. The FIC budget
 * (docs/design/closet-signal-and-interaction-cost.md §3.2) prices a field
 * against what the engine actually gains, and only four fields here are read by
 * fitEngine.ts: brand (brand bias + anchor), category (garment ease + anchor
 * matching), size, and fitDirection (anchor shift). Name, line, colour, fit
 * notes, photo and the in-store flag are stored and displayed but never scored
 * — engine value 0 — so they move behind a disclosure on the last step. Nothing
 * is lost: every one of them is editable on the item straight afterwards.
 *
 * The shape is /refresh's card stack, which measured as the least dense page in
 * the app for exactly this reason: it shows one decision at a time.
 * ------------------------------------------------------------------------ */

const STEP_QUESTION: Record<AddStep, string> = {
  brand: "What brand is it?",
  category: "What kind of garment?",
  size: "What size is on the label?",
  fit: "How does it sit on you?",
};

// One line each, and each says what the answer buys. Asking for something
// without saying why is most of what makes a form feel like homework.
const STEP_WHY: Record<AddStep, string> = {
  brand: "Sizing varies more between brands than between sizes — this is the most useful thing you can tell us.",
  category: "A shirt and a coat are cut with different amounts of room.",
  size: "Whatever the label says. Region conversions are handled for you.",
  fit: "This is what moves a recommendation up or down a size for this brand.",
};

function AddItemFlow({ onAdded }: { onAdded: () => void }) {
  const [form, setForm] = useState({ ...BLANK });
  const [stepIndex, setStepIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [justAdded, setJustAdded] = useState<string | null>(null);
  // Add-by-URL — offered on the first step as a shortcut, never as a gate.
  const [pasteUrl, setPasteUrl] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [extractNote, setExtractNote] = useState<string | null>(null);

  const step = ADD_STEPS[stepIndex];
  const isLast = stepIndex === ADD_STEPS.length - 1;

  // Readiness and the blocking set live in lib/addFlow.ts so a test can hold
  // them to the FIC budget — a field is cheap to add and its cost is paid by
  // every user, every time.
  const ready = stepReady(step, form);
  const canAdd = canSubmit(form);

  // What has been answered so far, so the flow never loses the user's place.
  const trail = [
    stepIndex > 0 && form.brand.trim(),
    stepIndex > 1 && garmentLabel(form.category),
    stepIndex > 2 && form.size,
  ].filter(Boolean).join(" · ");

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
      if (r.error) { setExtractNote("Couldn't read that URL — answer the questions instead."); return; }
      setForm((f) => ({
        ...f,
        brand: r.brand || f.brand,
        displayName: r.suggestedName || f.displayName,
        category: r.category || f.category,
        gender: r.gender || f.gender,
        size: "", // sizes are offered, never chosen for the user
      }));
      const bits = [r.brand, r.category && garmentLabel(r.category)].filter(Boolean).join(" · ");
      setExtractNote(`Read ${bits || "details"} from ${r.source?.host ?? "the page"}.`);
      // The payoff for pasting a link is skipping the questions it answered.
      if (r.brand && r.category) setStepIndex(ADD_STEPS.indexOf("size"));
      else if (r.brand) setStepIndex(ADD_STEPS.indexOf("category"));
    } catch {
      setExtractNote("Couldn't read that URL — answer the questions instead.");
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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isLast) {
      if (ready) { setJustAdded(null); setStepIndex(stepIndex + 1); }
      return;
    }
    if (!canAdd || saving) return;
    setSaving(true);
    await fetch("/api/closet", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        brand: form.brand, displayName: form.displayName || null,
        category: form.category, gender: form.gender || null, size: form.size,
        fitRating: form.fitRating, fitDirection: form.fitDirection, color: form.color || null,
        onlineAvailable: form.onlineAvailable,
        imageDataUrl: form.imageDataUrl || null,
        areaNotesJson: form.areaNotes ? JSON.stringify({ notes: form.areaNotes }) : null,
      }),
    });
    setJustAdded(`${form.brand} ${garmentLabel(form.category)} · ${form.size}`);
    setForm({ ...BLANK });
    setStepIndex(0);
    setShowDetails(false);
    setPasteUrl(""); setExtractNote(null);
    setSaving(false);
    onAdded();
  }

  return (
    <Card className="mt-6">
      {justAdded && (
        <p className="mb-4 rounded-lg bg-brand/10 px-3 py-2 text-sm text-brand-dark">
          Added <span className="font-semibold">{justAdded}</span>. Add another below.
        </p>
      )}

      {/* Where you are in the four questions. */}
      <div className="mb-4">
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <p className="flex-shrink-0 text-[10px] font-bold uppercase tracking-[0.2em] text-ink-faint">
            Add an item · {stepIndex + 1} of {ADD_STEPS.length}
          </p>
          {trail && <p className="min-w-0 truncate text-[11px] text-ink-soft">{trail}</p>}
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-neutral-200">
          <div
            className="h-full rounded-full bg-brand transition-[width] duration-300"
            style={{ width: `${((stepIndex + 1) / ADD_STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* The shortcut sits on the first step only — it answers the first
          questions, so offering it later would be offering to redo them. */}
      {step === "brand" && (
        <div className="mb-4 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-3">
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-ink-faint">
            Have a link? Skip ahead
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              className={inputClass + " min-w-0 flex-1"}
              placeholder="Paste a product URL…"
              value={pasteUrl}
              onChange={(e) => setPasteUrl(e.target.value)}
            />
            <Button type="button" variant="secondary" size="md" onClick={extractFromUrl} disabled={extracting || !pasteUrl.trim()}>
              {extracting ? "Reading…" : "Auto-fill"}
            </Button>
          </div>
          {extractNote && <p className="mt-1.5 text-[11px] text-ink-soft">{extractNote}</p>}
        </div>
      )}

      <form onSubmit={onSubmit}>
        <h3 className="text-base font-semibold text-ink">{STEP_QUESTION[step]}</h3>
        <p className="mt-0.5 text-xs text-ink-soft">{STEP_WHY[step]}</p>

        <div className="mt-3">
          {step === "brand" && (
            <BrandInput value={form.brand} onChange={(v) => setForm({ ...form, brand: v })} />
          )}
          {step === "category" && (
            <CategoryPicker
              value={form.category}
              onChange={(v) => setForm({ ...form, category: v, size: "" })}
            />
          )}
          {step === "size" && (
            <SizeInput category={form.category} value={form.size} onChange={(v) => setForm({ ...form, size: v })} />
          )}
          {step === "fit" && (
            <FitDirectionInput
              value={form.fitDirection}
              onChange={(n) => setForm({ ...form, fitDirection: n, fitRating: ratingFromDirection(n) })}
            />
          )}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          {stepIndex > 0 && (
            <Button type="button" variant="ghost" onClick={() => setStepIndex(stepIndex - 1)}>Back</Button>
          )}
          <Button type="submit" disabled={!ready || (isLast && (saving || !canAdd))}>
            {isLast ? (saving ? "Adding…" : "Add to closet") : "Continue"}
          </Button>
        </div>

        {/* Everything the engine does not read. Reachable, not in the way. */}
        {isLast && (
          <div className="mt-5 border-t border-neutral-200 pt-3">
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs font-semibold text-ink-soft hover:text-brand"
            >
              {showDetails ? "− Hide details" : "+ Add details (optional)"}
            </button>
            <p className="mt-1 text-[11px] text-ink-faint">
              Photo, name, colour, notes. The fit engine doesn&apos;t read these — you can add them any time by editing the item.
            </p>

            {showDetails && (
              <div className="mt-3 grid gap-3 sm:grid-cols-6">
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
                        : <span className="min-w-0 text-xs text-ink-faint">Click to upload a picture of this item.</span>}
                    </div>
                  </Field>
                </div>
                <div className="sm:col-span-3">
                  <Field label="Name" hint="optional">
                    <input className={inputClass} placeholder="e.g. Blue Oxford"
                      value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} />
                  </Field>
                </div>
                <div className="sm:col-span-3">
                  <Field label="Line" hint="optional">
                    <select className={inputClass} value={form.gender}
                      onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                      {GENDERS.map((g) => <option key={g.v} value={g.v}>{g.label}</option>)}
                    </select>
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
              </div>
            )}
          </div>
        )}
      </form>
    </Card>
  );
}
