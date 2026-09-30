"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button, Card, Chip, EmptyState, Field, FitStars, LinkButton, Page, PageHeader, Segmented, inputClass } from "@/components/ui";
import {
  ArrowLeft, ArrowRight, Basket, Camera, CaretDown, CaretUp, Check, Close, Hanger, Note, PaletteIcon,
  Pencil, Plus, Refresh, Reorder, Stack, Trash,
} from "@/components/Icon";
import { BrandInput } from "@/components/BrandInput";
import { SizeInput } from "@/components/SizeInput";
import { CategoryPicker } from "@/components/CategoryPicker";
import { isValidSize } from "@/lib/sizeSystems";
import { garmentLabel } from "@/lib/garments";
import { GarmentIcon } from "@/components/GarmentIcon";
import { GarmentCover } from "@/components/GarmentCover";
import { resizeGarmentPhoto } from "@/lib/imageResize";
import { FitDirectionInput, FitScaleProvider } from "@/components/FitDirectionInput";
import { DIRECTION_DEFAULT, ratingFromDirection } from "@/lib/fitDirection";
import { ADD_STEPS, type AddStep, canSubmit, stepReady } from "@/lib/addFlow";
import { COLOR_PRESETS, colorHex, iconToneOn } from "@/lib/colors";
import { useT } from "@/i18n/client";
import { useGarmentText } from "@/i18n/garment";

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
  // The garment's OWN measurements, captured from the retailer's chart when the
  // item was added by URL. Null for anything typed in by hand.
  garmentChestCm?: number | null;
  garmentShoulderCm?: number | null;
  garmentSleeveCm?: number | null;
  garmentLengthCm?: number | null;
  garmentMeasuredFrom?: string | null;
};

type Collection = { id: string; name: string; sortIndex: number; itemCount: number; color?: string | null };

/** One row of the size chart the extractor read, as returned by /api/closet/extract. */
type SizeRow = {
  label: string;
  chestCm: number | null;
  shoulderCm: number | null;
  sleeveCm: number | null;
  lengthCm: number | null;
};

// Product line values; their names come from garment.line (messages).
const GENDERS = ["", "mens", "womens", "unisex"] as const;

const BLANK = { brand: "", displayName: "", category: "tshirt", gender: "", size: "", fitRating: 5, fitDirection: DIRECTION_DEFAULT, areaNotes: "", color: "", onlineAvailable: true, imageDataUrl: "" };

type View = "gallery" | "list" | "folder";
const VIEW_KEY = "fp.closet.view";
const VIEWS: View[] = ["gallery", "list", "folder"];

export default function ClosetPage() {
  const t = useT("closet");
  const g = useGarmentText();
  const [items, setItems] = useState<Item[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionColor, setNewCollectionColor] = useState<string | null>(null);
  // Merge-select mode
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  // Closet view. The gallery is the default (Session 76, R3): a closet is a set
  // of garments, and a garment is recognised by how it looks before any label.
  // The choice is remembered per browser — a convenience, so storage failing
  // (private window, blocked site data) just means the default.
  const [view, setViewState] = useState<View>("gallery");
  useEffect(() => {
    try {
      const v = localStorage.getItem(VIEW_KEY);
      if (v === "gallery" || v === "list" || v === "folder") setViewState(v);
    } catch { /* default view */ }
  }, []);
  function setView(v: View) {
    setViewState(v);
    try { localStorage.setItem(VIEW_KEY, v); } catch { /* not remembered */ }
  }
  // Which collection the chips narrow to ("all", a collection id, or "__uncat__").
  const [filter, setFilter] = useState("all");
  // The piece just added — its card asks for a photo until it gets one. The
  // photo is never a step in the add flow (build-state ㉙); this is the nudge.
  const [nudgeId, setNudgeId] = useState<string | null>(null);
  // Once the closet has its three pieces, the add flow folds into one row so the
  // clothes, not the form, lead the page.
  const [addOpen, setAddOpen] = useState(false);
  const [newCollOpen, setNewCollOpen] = useState(false);
  // The to-buy list (/saved): its size for the header link, and a product being
  // moved in from it (?fromSaved=id), which opens the add flow pre-filled.
  const [savedCount, setSavedCount] = useState(0);
  const [fromSaved, setFromSaved] = useState<string | null>(null);
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("fromSaved");
    if (id) { setFromSaved(id); setAddOpen(true); }
  }, []);
  function doneFromSaved() {
    setFromSaved(null);
    window.history.replaceState(null, "", "/closet");
  }
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
    const [c, i, sv] = await Promise.all([
      fetch("/api/collections").then((r) => r.json()),
      fetch("/api/closet").then((r) => r.json()),
      fetch("/api/saved").then((r) => r.json()).catch(() => ({ items: [] })),
    ]);
    setCollections(c.collections);
    setItems(i.items);
    setSavedCount(Array.isArray(sv.items) ? sv.items.length : 0);
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

  /** Set, replace (a File) or remove (null) an item's cover photo. */
  async function setPhoto(id: string, file: File | null) {
    const imageDataUrl = file ? await resizeGarmentPhoto(file) : null;
    if (id === nudgeId) setNudgeId(null);
    await patch(id, { imageDataUrl });
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
  const uncategorized = items.filter((it) => !it.collectionId);
  const buckets = [
    ...collections
      .slice()
      .sort((a, b) => a.sortIndex - b.sortIndex)
      .map((c, i) => ({ collection: c, items: itemsIn(items, c.id), seed: i })),
    ...(uncategorized.length > 0
      // "Uncategorized" is a key the folder names translate (useGarmentText).
      ? [{ collection: { id: "__uncat__", name: "Uncategorized", sortIndex: 999, itemCount: uncategorized.length }, items: uncategorized, seed: -1 }]
      : []),
  ];
  const filled = buckets.filter((b) => b.items.length > 0);
  // A filter pointing at a collection that has since emptied falls back to all.
  const activeFilter = filter === "all" || filled.some((b) => b.collection.id === filter) ? filter : "all";
  const inFilter = buckets.filter((b) => activeFilter === "all" || b.collection.id === activeFilter);
  // The gallery shows only collections with something in them; the empty ones
  // (four of eight in a new closet) are one line at the end instead of four
  // "Empty" boxes. List and folder views keep them, since that is where they
  // are renamed and deleted.
  const shown = view === "gallery" ? inFilter.filter((b) => b.items.length > 0) : inFilter;
  const emptyNames = buckets.filter((b) => b.items.length === 0).map((b) => g.folder(b.collection.name));
  const realCollections = buckets.filter((b) => b.collection.id !== "__uncat__");

  return (
    <FitScaleProvider>
    <Page>
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        lede={t("lede")}
        action={
          goalMet || savedCount > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              {savedCount > 0 && <LinkButton href="/saved" variant="secondary">{t("savedLink", { n: savedCount })}</LinkButton>}
              {goalMet && <LinkButton href="/check" arrow>{t("checkProduct")}</LinkButton>}
            </div>
          ) : undefined
        }
      />

      {/* Add an item — one question per screen (see AddItemFlow). Until the
          closet has its three pieces, the flow shares the row with what it is
          for: progress, and why three. The page used to set a 48rem form at the
          left of a 72rem page with the progress stranded at the far right —
          left-heavy on any wide screen (founder's report, 2026-09-28). */}
      {!goalMet ? (
        <div className="mt-10 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <AddItemFlow fromSaved={fromSaved} onFromSavedDone={doneFromSaved} onAdded={(id) => { setNudgeId(id); load(); }} />
          <SetupAside count={count} />
        </div>
      ) : (
      <div className="mt-10">
        {!addOpen ? (
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-line bg-white/60 px-4 py-3.5 text-left text-sm text-ink-soft transition-colors duration-200 hover:border-ink/30 hover:text-ink"
          >
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white ring-1 ring-line">
              <Plus size={18} />
            </span>
            <span>{t.rich("addPiece", { b: (c) => <span className="font-medium text-ink">{c}</span> })}</span>
          </button>
        ) : (
          <AddItemFlow
            fromSaved={fromSaved}
            onFromSavedDone={doneFromSaved}
            onAdded={(id) => { setNudgeId(id); load(); }}
            onClose={() => { setAddOpen(false); if (fromSaved) doneFromSaved(); }}
          />
        )}
      </div>
      )}

      {count > 0 && (
        <>
          {/* Toolbar: how to look at the closet, and what to do with it. */}
          <div className="mt-12 flex flex-wrap items-center justify-between gap-3">
            <Segmented label={t("viewLabel")} options={VIEWS.map((v) => ({ value: v, label: t(`views.${v}`) }))} value={view} onChange={setView} />
            <div className="flex flex-wrap items-center gap-1">
              <Button size="sm" variant={reorderMode ? "primary" : "ghost"} icon={<Reorder size={16} />} onClick={() => setReorderMode((v) => !v)}>
                {reorderMode ? t("done") : t("reorder")}
              </Button>
              {count >= 2 && !selectMode && (
                <Button size="sm" variant="ghost" icon={<Stack size={16} />} onClick={() => setSelectMode(true)}>{t("merge")}</Button>
              )}
              <LinkButton href="/refresh?collections=all" size="sm" variant="ghost" icon={<Refresh size={16} />}>{t("refreshFit")}</LinkButton>
              <Button size="sm" variant={newCollOpen ? "secondary" : "ghost"} icon={<Plus size={16} />} onClick={() => setNewCollOpen((v) => !v)}>{t("newCollection")}</Button>
            </div>
          </div>

          {/* A new collection is occasional, so it is a toolbar action that opens
              a row here, not a card at the foot of every visit. */}
          {newCollOpen && (
            <form onSubmit={(e) => { addCollection(e); setNewCollOpen(false); }} className="mt-4 flex flex-col gap-4 rounded-2xl bg-white p-4 ring-1 ring-line sm:flex-row sm:items-end">
              <div className="min-w-0 flex-1">
                <Field label={t("collectionName")}>
                  <input autoFocus className={inputClass} placeholder={t("collectionPlaceholder")}
                    value={newCollectionName} onChange={(e) => setNewCollectionName(e.target.value)} />
                </Field>
              </div>
              <Field label={t("folderColor")} hint={t("optional")}>
                <FolderColorPicker value={newCollectionColor} onPick={setNewCollectionColor} />
              </Field>
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={!newCollectionName.trim()}>{t("addCollection")}</Button>
                <Button size="sm" variant="ghost" onClick={() => setNewCollOpen(false)}>{t("cancel")}</Button>
              </div>
            </form>
          )}

          {/* Collection chips. Sticky under the nav so a long closet can be
              narrowed from anywhere. A solid ground, not a blur: one more
              backdrop filter on a scrolling layer is a cost we keep off. */}
          {filled.length >= 2 && (
            <div className="sticky top-14 z-30 -mx-4 mt-4 bg-paper px-4 py-2.5 sm:top-16 sm:-mx-6 sm:px-6">
              <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
                <Chip selected={activeFilter === "all"} onClick={() => setFilter("all")} className="flex-shrink-0">
                  {t("all")} <span className="tabular-nums opacity-60">{count}</span>
                </Chip>
                {filled.map((b) => (
                  <Chip key={b.collection.id} selected={activeFilter === b.collection.id} onClick={() => setFilter(b.collection.id)} className="flex-shrink-0">
                    {g.folder(b.collection.name)} <span className="tabular-nums opacity-60">{b.items.length}</span>
                  </Chip>
                ))}
              </div>
            </div>
          )}

          {selectMode && (
            <div className="mt-4 flex flex-col gap-3 rounded-2xl bg-white px-4 py-3 ring-1 ring-line sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-ink-soft">
                {t.rich("mergeHelp", { b: (c) => <strong className="font-medium text-ink">{c}</strong> })}
                <span className="ml-2 tabular-nums text-ink-faint">{t("selected", { n: selected.size })}</span>
              </p>
              <div className="flex gap-2">
                <Button size="sm" disabled={selected.size < 2} onClick={doMerge}>{selected.size > 0 ? t("mergeButtonN", { n: selected.size }) : t("mergeButton")}</Button>
                <Button size="sm" variant="ghost" onClick={() => { setSelectMode(false); setSelected(new Set()); }}>{t("cancel")}</Button>
              </div>
            </div>
          )}

          {reorderMode && (
            <p className="mt-4 flex items-center gap-2 rounded-xl bg-brand-tint px-3 py-2 text-xs text-ink-soft">
              <Reorder size={16} className="flex-shrink-0 text-brand" />
              {t.rich("reorderHelp", { b: (c) => <strong className="font-medium text-ink">{c}</strong> })}
            </p>
          )}

          {/* "All" in the gallery is one continuous grid, in collection order.
              Sectioned, a closet of one piece per type spent a full row on each
              — mostly empty space. The caption already names the type. A
              chosen collection, or reorder mode (which moves pieces within a
              collection), brings the sections back with their actions. */}
          {view === "gallery" && activeFilter === "all" && !reorderMode ? (
            <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4">
              {filled.flatMap((b) => buildGroups(b.items)).map((g) => (
                <GalleryCard
                  key={g.key}
                  group={g}
                  onOpen={setDetailGroup}
                  onPhoto={setPhoto}
                  nudge={g.items.some((it) => it.id === nudgeId)}
                  selectMode={selectMode}
                  selected={selected.has(g.items[0].id)}
                  onToggleSelect={toggleSelect}
                  reorderMode={false}
                  canMoveUp={false}
                  canMoveDown={false}
                  onMove={() => {}}
                />
              ))}
            </div>
          ) : (
          <div className={`mt-8 ${view === "folder" ? "grid items-start gap-12 lg:grid-cols-2 lg:gap-x-10" : "space-y-12"}`}>
            {shown.map(({ collection, items: bucketItems, seed }) => {
              const pos = realCollections.findIndex((b) => b.collection.id === collection.id);
              const uncat = collection.id === "__uncat__";
              return (
                <CollectionSection
                  key={collection.id}
                  collection={collection}
                  items={bucketItems}
                  allCollections={collections}
                  editingId={editingId}
                  onEdit={setEditingId}
                  onPatch={patch}
                  onPhoto={setPhoto}
                  nudgeId={nudgeId}
                  onRemove={remove}
                  onReload={load}
                  onMove={move}
                  selectMode={selectMode}
                  selected={selected}
                  onToggleSelect={toggleSelect}
                  view={view}
                  colorSeed={seed}
                  onOpenDetail={setDetailGroup}
                  onBucket={toggleBucket}
                  inBucket={inBucket}
                  reorderMode={reorderMode}
                  canFolderUp={!uncat && pos > 0}
                  canFolderDown={!uncat && pos < realCollections.length - 1}
                  onMoveFolder={(dir) => moveCollection(collection.id, dir)}
                  undeletable={uncat}
                />
              );
            })}
          </div>
          )}

          {view === "gallery" && activeFilter === "all" && emptyNames.length > 0 && (
            <p className="mt-12 text-xs text-ink-faint">
              {t("emptyForNow", { names: emptyNames.join(t("listSeparator")) })}
            </p>
          )}
        </>
      )}

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
          onPhoto={setPhoto}
          onRemove={(id) => { remove(id); }}
        />
      )}

      {/* The comparison bucket — items set aside to look at together */}
      <BucketPanel items={compareItems} onRemove={toggleBucket} onClear={() => setCompareItems([])} onOpen={(it) => setDetailGroup({ key: it.id, label: it.displayName || it.brand, items: [it], isVariant: false })} />
    </Page>
    </FitScaleProvider>
  );
}

/**
 * Beside the add flow until the closet has its three pieces: how far along,
 * why three, and — for someone with nothing in yet — a demo closet to look
 * around with. It replaced a green "3/3 goal met" figure in the header and a
 * green card at the foot of the page that said the same thing twice.
 */
function SetupAside({ count }: { count: number }) {
  const t = useT("closet");
  const [hasBody, setHasBody] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    fetch("/api/status").then((r) => r.json()).then((s) => setHasBody(!!s.hasBody)).catch(() => setHasBody(null));
  }, []);
  async function demo() {
    setLoading(true);
    await fetch("/api/demo", { method: "POST" });
    window.location.reload();
  }
  return (
    <aside className="rounded-2xl bg-white p-6 ring-1 ring-line lg:sticky lg:top-24">
      <p className="eyebrow text-ink-faint">{t("gettingStarted")}</p>
      <p className="mt-3 font-serif text-h2 tabular-nums text-ink">{t("piecesOf3", { n: count })}</p>
      <div className="mt-3 flex gap-1.5" role="img" aria-label={t("piecesAdded", { n: count })}>
        {[0, 1, 2].map((i) => (
          <span key={i} className={`h-1 flex-1 rounded-full ${i < count ? "bg-ink" : "bg-line"}`} />
        ))}
      </div>
      <p className="mt-4 text-sm leading-relaxed text-ink-soft">{t("whyThree")}</p>
      {/* The demo replaces the closet AND the body profile (api/demo), so it is
          offered only to someone with neither — never over real data. */}
      {count === 0 && hasBody === false && (
        <div className="mt-5 border-t border-line pt-4">
          <p className="text-xs text-ink-faint">{t("justLooking")}</p>
          <Button size="sm" variant="secondary" loading={loading} icon={<Hanger size={16} />} onClick={demo} className="mt-2">
            {t("tryDemo")}
          </Button>
        </div>
      )}
    </aside>
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
  onPhoto,
  nudgeId,
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
  onPhoto: (id: string, file: File | null) => Promise<void>;
  nudgeId: string | null;
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
  view: View;
  reorderMode: boolean;
  canFolderUp: boolean;
  canFolderDown: boolean;
  onMoveFolder: (dir: -1 | 1) => void;
  undeletable?: boolean;
}) {
  const t = useT("closet");
  const g = useGarmentText();
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
  const bucketId = collection.id === "__uncat__" ? null : collection.id;

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
    if (!confirm(t("deleteConfirm", { name: g.folder(collection.name) }))) return;
    await fetch(`/api/collections?id=${collection.id}`, { method: "DELETE" });
    onReload();
  }

  return (
    <section>
      <div className="mb-5 flex items-end justify-between gap-4 border-b border-line pb-3">
        {renaming ? (
          <div className="flex items-center gap-2">
            <input autoFocus className={`${inputClass} !py-1.5 font-medium`}
              value={name} onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveName()} />
            <Button size="sm" onClick={saveName}>{t("save")}</Button>
            <Button size="sm" variant="ghost" onClick={() => { setName(collection.name); setRenaming(false); }}>{t("cancel")}</Button>
          </div>
        ) : (
          <h2 className="flex min-w-0 items-center gap-2 text-h3 font-semibold text-ink">
            {/* Reorder handle for the whole folder — only in reorder mode */}
            {reorderMode && !undeletable && (
              <span className="-ml-1 flex items-center">
                <button onClick={() => onMoveFolder(-1)} disabled={!canFolderUp} aria-label={t("moveCollectionUp")}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-ink-soft hover:bg-ink/5 disabled:opacity-30"><CaretUp size={16} /></button>
                <button onClick={() => onMoveFolder(1)} disabled={!canFolderDown} aria-label={t("moveCollectionDown")}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-ink-soft hover:bg-ink/5 disabled:opacity-30"><CaretDown size={16} /></button>
              </span>
            )}
            <span className="truncate">{g.folder(collection.name)}</span>
            <span className="text-xs font-normal tabular-nums text-ink-faint">{items.length}</span>
          </h2>
        )}
        {!renaming && (
          <div className="relative flex flex-shrink-0 items-center gap-3 text-xs">
            {/* Folder color — editable in folder view (not for Uncategorized) */}
            {view === "folder" && !undeletable && (
              <button onClick={() => setPickingColor((v) => !v)} aria-label={t("folderColor")}
                className={`h-4 w-4 rounded-full ring-1 ring-black/10 ${folderColorFor(collection.color, colorSeed).swatch}`} />
            )}
            {pickingColor && (
              <div className="absolute right-0 top-6 z-30 rounded-xl bg-white p-2 ring-1 ring-line shadow-lift">
                <FolderColorPicker value={collection.color} onPick={setColor} />
              </div>
            )}
            {items.length > 0 && collection.id !== "__uncat__" && (
              <Link href={`/refresh?collections=${collection.id}`} className="inline-flex items-center gap-1 text-ink-faint transition-colors hover:text-ink"
                title={t("refreshTitle")}>
                <Refresh size={14} /> {t("refresh")}
              </Link>
            )}
            {!undeletable && (
              <>
                <button onClick={() => setRenaming(true)} className="text-ink-faint transition-colors hover:text-ink">{t("rename")}</button>
                <button onClick={deleteCollection} className="text-ink-faint transition-colors hover:text-bad">{t("delete")}</button>
              </>
            )}
          </div>
        )}
      </div>

      {view === "folder" && !selectMode ? (
        <Folder
          groups={groups}
          colorSeed={colorSeed}
          color={collection.color}
          onOpen={onOpenDetail}
          onBucket={onBucket}
          inBucket={inBucket}
        />
      ) : items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line px-4 py-3 text-xs text-ink-faint">
          {t("emptySection")}
        </p>
      ) : view === "gallery" ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4">
          {groups.map((g) => (
            <GalleryCard
              key={g.key}
              group={g}
              onOpen={onOpenDetail}
              onPhoto={onPhoto}
              nudge={g.items.some((it) => it.id === nudgeId)}
              selectMode={selectMode}
              selected={selected.has(g.items[0].id)}
              onToggleSelect={onToggleSelect}
              reorderMode={reorderMode}
              canMoveUp={standaloneIndex(groups, g) > 0}
              canMoveDown={standaloneIndex(groups, g) >= 0 && standaloneIndex(groups, g) < standaloneCount(groups) - 1}
              onMove={(itemId, dir) => onMove(bucketId, itemId, dir)}
            />
          ))}
        </div>
      ) : (
        // Two columns of rows on a wide screen: one row of text and actions
        // stretched across 72rem is mostly gap. An open editor takes the row.
        <div className="grid gap-2 lg:grid-cols-2">
          {groups.map((g) =>
            editingId && g.items.some((it) => it.id === editingId) ? (
              <div key={g.key} className="lg:col-span-2">
                <EditRow
                  item={g.items.find((it) => it.id === editingId)!}
                  collections={allCollections}
                  onCancel={() => onEdit(null)}
                  onSaved={() => { onEdit(null); onReload(); }}
                />
              </div>
            ) : (
              <ItemCard
                key={g.key}
                group={g}
                collections={allCollections}
                onEdit={onEdit}
                onPatch={onPatch}
                onRemove={onRemove}
                onMove={(itemId, dir) => onMove(bucketId, itemId, dir)}
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
    </section>
  );
}

/**
 * One garment in the gallery: the wearer's own photo as the cover, or — until
 * there is one — the garment's colour with its line icon. Under it, the caption
 * row the reference sites use: the brand left, the size right, and beneath them
 * a small label and the fit rating. No card chrome; the image is the card.
 *
 * The photo control is always there on a piece without a photo (that is the
 * invitation), and on hover for one that has a photo. On a touch screen, which
 * cannot hover, it stays visible.
 */
function GalleryCard({
  group,
  onOpen,
  onPhoto,
  nudge,
  selectMode,
  selected,
  onToggleSelect,
  reorderMode,
  canMoveUp,
  canMoveDown,
  onMove,
}: {
  group: Group;
  onOpen: (g: Group) => void;
  onPhoto: (id: string, file: File | null) => Promise<void>;
  nudge: boolean;
  selectMode: boolean;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  reorderMode: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMove: (itemId: string, dir: -1 | 1) => void;
}) {
  const t = useT("closet");
  const g = useGarmentText();
  const head = group.items[0];
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const photo = head.imageDataUrl;
  const selectable = selectMode && !group.isVariant;
  const isSel = selectable && selected;
  const sub = head.displayName || g.label(head.category);
  const sizeLabel = group.isVariant ? t("nSizes", { n: group.items.length }) : head.size;

  async function pick(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setFailed(false);
    try { await onPhoto(head.id, file); } catch { setFailed(true); } finally { setBusy(false); }
  }

  const activate = () => (selectMode ? selectable && onToggleSelect(head.id) : onOpen(group));
  const label = t(selectMode ? (isSel ? "deselect" : "select") : "open", { brand: head.brand, name: sub, size: sizeLabel });

  return (
    <figure className="group/card min-w-0 animate-fade-in-up">
      <div
        className={`relative aspect-[4/5] overflow-hidden rounded-xl transition-shadow duration-200 ${isSel ? "ring-2 ring-brand" : "ring-1 ring-line/70"}`}
      >
        <button
          type="button"
          onClick={activate}
          aria-label={label}
          aria-pressed={selectable ? isSel : undefined}
          className="absolute inset-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand"
        >
          <GarmentCover
            category={head.category}
            color={head.color}
            photo={photo}
            imgClassName="transition-transform duration-500 ease-out group-hover/card:scale-[1.02]"
          />
        </button>

        {group.isVariant && (
          <span className="pointer-events-none absolute left-2.5 top-2.5 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-medium text-ink">
            {t("nVariants", { n: group.items.length })}
          </span>
        )}

        {selectable && (
          <span className={`pointer-events-none absolute left-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-full ${isSel ? "bg-brand text-white" : "bg-white/90 ring-1 ring-line"}`}>
            {isSel && <Check size={14} />}
          </span>
        )}

        {!selectMode && !group.isVariant && (
          <label
            className={`absolute bottom-2.5 right-2.5 flex h-9 cursor-pointer items-center gap-1.5 rounded-full px-2.5 text-xs font-medium ring-1 ring-black/5 transition-[opacity,background-color] duration-200 ${
              nudge && !photo ? "bg-ink text-paper" : "bg-white/90 text-ink hover:bg-white"
            } ${photo ? "[@media(hover:hover)]:opacity-0 group-hover/card:opacity-100 focus-within:opacity-100" : ""}`}
          >
            {busy ? (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-[1.5px] border-current border-r-transparent" aria-hidden />
            ) : (
              <Camera size={16} />
            )}
            {nudge && !photo ? <span>{t("addPhoto")}</span> : <span className="sr-only">{photo ? t("replacePhoto") : t("addPhoto")}</span>}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }}
            />
          </label>
        )}

        {reorderMode && !selectMode && !group.isVariant && (
          <div className="absolute bottom-2.5 left-2.5 flex gap-1">
            <button type="button" onClick={() => onMove(head.id, -1)} disabled={!canMoveUp} aria-label={t("moveEarlier")}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-ink ring-1 ring-black/5 disabled:opacity-30"><ArrowLeft size={16} /></button>
            <button type="button" onClick={() => onMove(head.id, 1)} disabled={!canMoveDown} aria-label={t("moveLater")}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-ink ring-1 ring-black/5 disabled:opacity-30"><ArrowRight size={16} /></button>
          </div>
        )}
      </div>

      <figcaption className="mt-3 px-0.5">
        <div className="flex items-baseline justify-between gap-3">
          <span className="truncate text-sm font-medium text-ink">{head.brand}</span>
          <span className="flex-shrink-0 text-sm tabular-nums text-ink">{sizeLabel}</span>
        </div>
        <div className="mt-1 flex items-center justify-between gap-3">
          <span className="flex min-w-0 items-center gap-1.5 text-xs text-ink-faint">
            <ColorDot color={head.color} />
            <span className="truncate">{sub}</span>
          </span>
          {!group.isVariant && <FitStars rating={head.fitRating} size={11} className="flex-shrink-0" />}
        </div>
        {failed && <p className="mt-1 text-xs text-bad">{t("photoFailed")}</p>}
      </figcaption>
    </figure>
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
  const t = useT("closet");
  const g = useGarmentText();
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
              {t("nVariants", { n: group.items.length })}
            </span>
          </div>
          <CaretDown size={16} className={`text-ink-faint transition-transform ${expanded ? "rotate-180" : ""}`} />
        </button>
        {expanded && (
          <div className="mt-3 grid grid-cols-3 gap-2 border-t border-line pt-3 sm:grid-cols-4">
            {group.items.map((it) => (
              <div key={it.id} className="group/var relative flex flex-col items-center gap-1 rounded-lg border border-line bg-white p-2">
                <ItemThumb item={it} size={40} />
                <span className="text-[11px] font-medium text-ink">{it.size}</span>
                {/* hover popover with the description + actions */}
                <div className="pointer-events-none absolute -top-1 left-1/2 z-20 w-36 -translate-x-1/2 -translate-y-full rounded-lg border border-line bg-white p-2 text-center opacity-0 shadow-lift transition-opacity group-hover/var:pointer-events-auto group-hover/var:opacity-100">
                  <p className="text-xs font-medium text-ink">{t("sizeN", { size: it.size })}{it.color ? ` · ${g.color(it.color)}` : ""}</p>
                  <FitStars rating={it.fitRating} size={11} />
                  <div className="mt-1 flex justify-center gap-2 text-[11px]">
                    <button onClick={() => onEdit(it.id)} className="text-ink-faint hover:text-brand">{t("edit")}</button>
                    <button onClick={() => onPatch(it.id, { groupId: null, groupName: null })} className="text-ink-faint hover:text-brand">{t("unmerge")}</button>
                    <button onClick={() => onRemove(it.id)} className="text-ink-faint hover:text-bad">{t("remove")}</button>
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
              aria-label={t("moveUp")}
            ><CaretUp size={16} /></button>
            <button
              onClick={() => onMove(it.id, 1)}
              disabled={!canMoveDown}
              className="text-ink-faint hover:text-brand disabled:opacity-30"
              aria-label={t("moveDown")}
            ><CaretDown size={16} /></button>
          </div>
        )}
        <ItemThumb item={it} size={36} />
        <div className="min-w-0">
          <div className="flex items-center gap-2 font-medium text-ink">
            <ColorDot color={it.color} />
            <span className="truncate">
              {it.displayName ? it.displayName : it.brand} · <span className="text-ink-soft">{g.label(it.category)}</span> · {t("sizeN", { size: it.size })}
            </span>
            {it.gender && <GenderBadge gender={it.gender} />}
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-ink-faint">
            <FitStars rating={it.fitRating} />
            {it.color && <span>· {g.color(it.color)}</span>}
            {it.areaNotesJson && <span>· {safeNotes(it.areaNotesJson)}</span>}
          </div>
          <GarmentMeasurements item={it} />
        </div>
      </div>
      {!selectMode && (
        <div className="flex flex-shrink-0 items-center gap-2 text-xs">
          <MoveMenu
            collections={collections}
            currentId={it.collectionId}
            onMove={(cid) => onPatch(it.id, { collectionId: cid })}
          />
          <button onClick={() => onEdit(it.id)} className="text-ink-soft hover:text-brand">{t("edit")}</button>
          <button onClick={() => onRemove(it.id)} className="text-ink-faint hover:text-bad">{t("remove")}</button>
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
  const t = useT("closet");
  const g = useGarmentText();
  return (
    <select
      value={currentId ?? ""}
      onChange={(e) => onMove(e.target.value)}
      className="rounded-lg border border-line px-2 py-1 text-xs text-ink-soft"
      title={t("moveTo")}
      aria-label={t("moveTo")}
    >
      {collections.map((c) => (
        <option key={c.id} value={c.id}>{g.folder(c.name)}</option>
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
      }),
    });
    setSaving(false);
    onSaved();
  }

  async function pickImage(file: File | undefined) {
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
          <Field label={t("photo")} hint={t("optional")}>
            <div className="flex items-center gap-3">
              <label className="flex h-14 w-14 flex-shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-line bg-white text-lg text-ink-faint hover:border-brand">
                {f.imageDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={f.imageDataUrl} alt="" className="h-full w-full object-cover" />
                ) : <GarmentIcon category={f.category} size={24} />}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => pickImage(e.target.files?.[0])} />
              </label>
              {f.imageDataUrl && <button type="button" onClick={() => setF({ ...f, imageDataUrl: "" })} className="text-xs text-ink-faint hover:text-bad">{t("removeLower")}</button>}
            </div>
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label={t("brand")}><BrandInput value={f.brand} onChange={(v) => setF({ ...f, brand: v })} /></Field>
        </div>
        <div className="sm:col-span-2">
          <Field label={t("name")} hint={t("optional")}><input className={inputClass} value={f.displayName} placeholder={t("namePlaceholder")} onChange={(e) => setF({ ...f, displayName: e.target.value })} /></Field>
        </div>
        <div className="sm:col-span-2">
          <Field label={t("type")}>
            <CategoryPicker value={f.category} onChange={(v) => setF({ ...f, category: v })} />
          </Field>
        </div>
        <div className="sm:col-span-1">
          <Field label={t("lineLabel")}>
            <select className={inputClass} value={f.gender} onChange={(e) => setF({ ...f, gender: e.target.value })}>
              {GENDERS.map((v) => <option key={v} value={v}>{g.line(v)}</option>)}
            </select>
          </Field>
        </div>
        <div className="sm:col-span-6">
          <Field label={t("howSits")}>
            <FitDirectionInput
              value={f.fitDirection}
              onChange={(n) => setF({ ...f, fitDirection: n, fitRating: ratingFromDirection(n) })}
            />
          </Field>
        </div>
        <div className="sm:col-span-6">
          <Field label={t("size")}>
            <SizeInput category={f.category} value={f.size} onChange={(v) => setF({ ...f, size: v })} />
          </Field>
        </div>
        <div className="sm:col-span-3">
          <Field label={t("color")}><ColorPicker value={f.color} onChange={(v) => setF({ ...f, color: v })} /></Field>
        </div>
        <div className="sm:col-span-3">
          <Field label={t("collection")}>
            <select className={inputClass} value={f.collectionId} onChange={(e) => setF({ ...f, collectionId: e.target.value })}>
              <option value="">{g.folder("Uncategorized")}</option>
              {collections.map((c) => <option key={c.id} value={c.id}>{g.folder(c.name)}</option>)}
            </select>
          </Field>
        </div>
        <div className="sm:col-span-6">
          <Field label={t("fitNotes")}><input className={inputClass} value={f.areaNotes} onChange={(e) => setF({ ...f, areaNotes: e.target.value })} /></Field>
        </div>
        <div className="flex gap-2 sm:col-span-6">
          <Button onClick={save} disabled={saving || !f.brand || !f.size || !isValidSize(f.category, f.size)}>{saving ? t("saving") : t("saveChanges")}</Button>
          <Button variant="ghost" onClick={onCancel}>{t("cancel")}</Button>
        </div>
      </div>
    </Card>
  );
}

function ColorPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  // Current swatch color to feed the native wheel (falls back to grey).
  const t = useT("closet");
  const g = useGarmentText();
  const wheelValue = colorHex(value) ?? "#9ca3af";
  return (
    <div className="space-y-2">
      {/* Two rows of preset swatches */}
      <div className="grid grid-cols-10 gap-1.5">
        {COLOR_PRESETS.map((c) => (
          <button
            key={c.name}
            type="button"
            title={g.color(c.name)}
            onClick={() => onChange(value === c.name ? "" : c.name)}
            className={`h-6 w-6 rounded-full border transition-transform hover:scale-110 ${
              value === c.name ? "scale-110 border-brand ring-2 ring-brand/40" : "border-line"
            }`}
            style={{ backgroundColor: c.hex }}
          />
        ))}
      </div>
      {/* Free text + color wheel */}
      <div className="flex items-center gap-2">
        <input
          className={inputClass + " flex-1"}
          placeholder={t("colorPlaceholder")}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <label
          className="relative flex h-9 w-9 flex-shrink-0 cursor-pointer items-center justify-center rounded-lg border border-line"
          title={t("pickColor")}
          style={{ backgroundColor: wheelValue }}
        >
          <input
            type="color"
            value={wheelValue}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
          <PaletteIcon size={14} className="pointer-events-none mix-blend-difference text-white" />
        </label>
      </div>
    </div>
  );
}

function GenderBadge({ gender }: { gender: string }) {
  const g = useGarmentText();
  // One neutral treatment: the line is information, not a colour code.
  if (!["mens", "womens", "unisex"].includes(gender)) return null;
  return (
    <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-ink-soft ring-1 ring-line" title={g.line(gender)}>
      {g.lineShort(gender)}
    </span>
  );
}

function ColorDot({ color }: { color: string | null }) {
  const g = useGarmentText();
  const hex = colorHex(color);
  if (!hex) return null;
  return (
    <span
      className="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full ring-1 ring-black/10"
      style={{ backgroundColor: hex }}
      title={color ? g.color(color) : undefined}
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
    <div className={`flex flex-shrink-0 items-center justify-center rounded-lg border border-line ${iconToneOn(hex) === "light" ? "text-white/90" : "text-ink-soft"}`}
      style={{ width: size, height: size, backgroundColor: hex ?? "#f5f5f5" }}>
      <GarmentIcon category={item.category} size={Math.round(size * 0.55)} />
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

function itemName(it: Item, label: (category: string) => string = garmentLabel): string {
  return it.displayName || `${it.brand} ${label(it.category)}`;
}

// Folder sleeve colors — each collection reads as its own folder, distinct from
// the white file cards inside. Keyed by name so a user's pick can be stored.
type FolderColor = { tab: string; body: string; edge: string; swatch: string };
const FOLDER_COLORS: Record<string, FolderColor> = {
  amber: { tab: "bg-warn", body: "from-amber-100 to-amber-200/80", edge: "border-warn/60", swatch: "bg-warn" },
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
  const t = useT("closet");
  const g = useGarmentText();
  return (
    // Each swatch sits in a 44px-tall button: the dots were 20px targets,
    // the smallest tap targets left on the closet (mobile-audit).
    <div className="flex flex-wrap items-center">
      <button
        type="button"
        onClick={() => onPick(null)}
        aria-label={t("autoColor")}
        aria-pressed={!value}
        className="flex h-11 w-8 items-center justify-center"
      >
        <span className={`flex h-6 w-6 items-center justify-center rounded-full bg-white text-[10px] text-ink-faint ${
          !value ? "ring-2 ring-ink ring-offset-2 ring-offset-white" : "ring-1 ring-line"
        }`}>A</span>
      </button>
      {FOLDER_COLOR_ORDER.map((name) => (
        <button
          key={name}
          type="button"
          onClick={() => onPick(name)}
          aria-label={t("folderNamed", { color: g.color(name) })}
          aria-pressed={value === name}
          className="flex h-11 w-8 items-center justify-center"
        >
          <span className={`h-6 w-6 rounded-full ${FOLDER_COLORS[name].swatch} ${
            value === name ? "ring-2 ring-ink ring-offset-2 ring-offset-white" : ""
          }`} />
        </button>
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
  const t = useT("closet");
  const c = folderColorFor(color, colorSeed);
  return (
    <div className="relative pt-3">
      {/* folder tab */}
      <span className={`absolute left-5 top-0 h-4 w-24 rounded-t-lg ${c.tab} shadow-sm`} />
      {/* folder sleeve */}
      <div className={`relative rounded-xl rounded-tl-none border ${c.edge} bg-gradient-to-b ${c.body} p-3 shadow-card`}>
        {groups.length === 0 ? (
          <div className="flex h-20 items-center justify-center rounded-lg border-2 border-dashed border-white/70 text-xs italic text-black/40">
            {t("emptyFolder")}
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
  const t = useT("closet");
  const g = useGarmentText();
  const head = group.items[0];
  const name = itemName(head, g.label);
  const sizeLabel = group.isVariant ? t("nSizes", { n: group.items.length }) : t("sizeN", { size: head.size });
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
        className="cursor-pointer rounded-lg border border-line bg-white px-3 py-2 shadow-sm transition-all duration-200 hover:z-30 hover:border-line hover:shadow-lift"
      >
        {/* key-info row — always visible */}
        <div className="flex items-center gap-2">
          <GarmentIcon category={head.category} size={18} className="flex-shrink-0 text-ink-soft" />
          <ColorDot color={head.color} />
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{name}</span>
          {group.isVariant && (
            <span className="flex-shrink-0 rounded-full bg-brand-tint px-1.5 py-0.5 text-[9px] font-semibold text-brand">
              {group.items.length}
            </span>
          )}
          <span className="flex-shrink-0 text-xs text-ink-faint">{g.label(head.category)} · {sizeLabel}</span>
        </div>

        {/* overview — open on the front file, and on hover for the rest */}
        <div
          className={`overflow-hidden transition-all duration-200 ${
            front ? "mt-2 max-h-40 opacity-100" : "max-h-0 opacity-0 group-hover/file:mt-2 group-hover/file:max-h-40 group-hover/file:opacity-100"
          }`}
        >
          <div className="flex items-center gap-3 border-t border-line pt-2">
            <ItemThumb item={head} size={40} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-ink-soft">
                {head.brand}
                {head.gender ? <span className="ml-1"><GenderBadge gender={head.gender} /></span> : null}
              </p>
              <FitStars rating={head.fitRating} size={11} />
              {head.color && <p className="text-[11px] text-ink-faint">{g.color(head.color)}</p>}
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onBucket(head); }}
              className={`flex-shrink-0 rounded-md border px-2 py-1 text-[11px] font-medium transition-colors ${
                bucketed
                  ? "border-brand bg-brand-tint text-brand"
                  : "border-line text-ink-soft hover:border-brand hover:text-brand"
              }`}
              title={t("setAside")}
            >
              {bucketed ? <><Check size={12} className="-mt-px mr-0.5 inline" />{t("bucket")}</> : <><Plus size={12} className="-mt-px mr-0.5 inline" />{t("bucket")}</>}
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
  onPhoto,
  onRemove,
}: {
  group: Group;
  collections: Collection[];
  inBucket: (id: string) => boolean;
  onBucket: (it: Item) => void;
  onClose: () => void;
  onReload: () => void;
  onPatch: (id: string, data: Record<string, unknown>) => void;
  onPhoto: (id: string, file: File | null) => Promise<void>;
  onRemove: (id: string) => void;
}) {
  const t = useT("closet");
  const g = useGarmentText();
  const head = group.items[0];
  const name = itemName(head, g.label);
  // Which item (if any) is being edited inline, right here in the sheet.
  const [editId, setEditId] = useState<string | null>(null);
  const editItem = editId ? group.items.find((it) => it.id === editId) ?? null : null;
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const hex = colorHex(head.color);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function photo(file: File | null | undefined) {
    if (file === undefined) return;
    if (file && !file.type.startsWith("image/")) { setFailed(true); return; }
    setBusy(true);
    setFailed(false);
    try { await onPhoto(head.id, file); } catch { setFailed(true); } finally { setBusy(false); }
  }

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
      <div className="absolute inset-0 bg-ink/30" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={name}
        onClick={(e) => e.stopPropagation()}
        className="animate-fade-in-up relative z-10 flex h-full w-full max-w-md flex-col overflow-y-auto bg-white"
      >
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <p className="eyebrow text-ink-faint">{g.label(head.category)}</p>
            <h3 className="mt-1 truncate text-h3 font-semibold text-ink">{name}</h3>
          </div>
          <button onClick={onClose} className="-mr-2 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-ink-soft hover:bg-ink/5 hover:text-ink" aria-label={t("close")}>
            <Close size={20} />
          </button>
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
            {/* The cover. Drop a photo on it, or use the button. Only the
                wearer's own photos — never a retailer's image (principle ③). */}
            <div className="px-5 pt-5">
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => { e.preventDefault(); setDragging(false); photo(e.dataTransfer.files?.[0]); }}
                className={`relative flex aspect-[4/5] items-center justify-center overflow-hidden rounded-xl transition-shadow ${dragging ? "ring-2 ring-brand" : "ring-1 ring-line"}`}
                style={{ backgroundColor: head.imageDataUrl ? "#E6E7E9" : hex ?? "#E6E7E9" }}
              >
                {head.imageDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={head.imageDataUrl} alt={t("yourPhotoAlt", { name })} className="h-full w-full object-cover" />
                ) : (
                  <GarmentIcon category={head.category} size={80} className={iconToneOn(hex) === "light" ? "text-white/80" : "text-ink/45"} />
                )}
                {busy && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                    <span className="h-6 w-6 animate-spin rounded-full border-2 border-ink border-r-transparent" aria-label={t("savingPhoto")} />
                  </div>
                )}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border border-line bg-white px-3.5 text-xs font-medium text-ink transition-colors hover:border-ink/40 focus-within:ring-2 focus-within:ring-brand/40">
                  <Camera size={16} />
                  {head.imageDataUrl ? t("replacePhoto") : t("addPhoto")}
                  <input type="file" accept="image/*" className="sr-only" onChange={(e) => { photo(e.target.files?.[0]); e.target.value = ""; }} />
                </label>
                {head.imageDataUrl && (
                  <Button size="sm" variant="ghost" icon={<Trash size={16} />} onClick={() => photo(null)}>{t("remove")}</Button>
                )}
              </div>
              <p className="mt-2 text-xs text-ink-faint">
                {failed ? <span className="text-bad">{t("photoFileFailed")}</span> : t("photoNote")}
              </p>
            </div>

            <div className="flex items-start gap-4 px-5 py-5">
              <div className="min-w-0 space-y-1 text-sm">
                <p className="font-medium text-ink">{head.brand}</p>
                <p className="text-ink-soft">{g.label(head.category)}{head.gender ? ` · ${g.line(head.gender)}` : ""}</p>
                <FitStars rating={head.fitRating} size={14} />
              </div>
              {!group.isVariant && (
                <Button size="sm" variant="secondary" icon={<Pencil size={16} />} className="ml-auto" onClick={() => setEditId(head.id)}>{t("edit")}</Button>
              )}
            </div>

            {/* variants OR single size */}
            <div className="border-t border-line px-5 py-4">
              <p className="eyebrow mb-2 text-ink-faint">
                {group.isVariant ? t("nVariants", { n: group.items.length }) : t("details")}
              </p>
              <div className="space-y-1.5">
                {group.items.map((v) => (
                  <div key={v.id} className="flex items-center justify-between rounded-lg px-3 py-2 text-sm ring-1 ring-line">
                    <span className="flex items-center gap-2">
                      <ColorDot color={v.color} />
                      <span className="font-medium text-ink">{t("sizeN", { size: v.size })}</span>
                      {v.color && <span className="text-ink-faint">· {g.color(v.color)}</span>}
                    </span>
                    <span className="flex items-center gap-3 text-xs">
                      <button onClick={() => setEditId(v.id)} className="text-ink-soft hover:text-ink">{t("edit")}</button>
                      <button onClick={() => onRemove(v.id)} className="text-ink-faint hover:text-bad">{t("remove")}</button>
                    </span>
                  </div>
                ))}
              </div>
              <GarmentMeasurements item={head} />
              {head.areaNotesJson && safeNotes(head.areaNotesJson) && (
                <p className="mt-3 flex items-start gap-1.5 rounded-lg bg-paper-soft px-3 py-2 text-xs text-ink-soft"><Note size={14} className="mt-px flex-shrink-0" />{safeNotes(head.areaNotesJson)}</p>
              )}
            </div>

            {/* timestamps: created · last modified · edit history */}
            <div className="border-t border-line px-5 py-4 text-xs">
              <p className="eyebrow mb-2 text-ink-faint">{t("history")}</p>
              <dl className="space-y-1 text-ink-soft">
                <div className="flex justify-between"><dt className="text-ink-faint">{t("created")}</dt><dd>{fmtWhen(head.createdAt)}</dd></div>
                <div className="flex justify-between"><dt className="text-ink-faint">{t("lastModified")}</dt><dd>{lastEdited ? fmtWhen(lastEdited) : t("never")}</dd></div>
              </dl>
              {history.length > 1 && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-ink-faint hover:text-ink">{t("nEdits", { n: history.length })}</summary>
                  <ul className="mt-1 space-y-0.5 border-l border-line pl-3 text-ink-faint">
                    {history.slice().reverse().map((when, i) => (
                      <li key={i}>{fmtWhen(when)}</li>
                    ))}
                  </ul>
                </details>
              )}
            </div>

            {/* actions */}
            <div className="mt-auto space-y-3 border-t border-line px-5 py-4">
              <div className="flex flex-wrap items-center gap-2">
                <MoveMenu collections={collections} currentId={head.collectionId} onMove={(cid) => onPatch(head.id, { collectionId: cid })} />
                <Button
                  size="sm"
                  variant="secondary"
                  icon={inBucket(head.id) ? <Check size={16} /> : <Basket size={16} />}
                  className={inBucket(head.id) ? "!border-brand !text-brand" : ""}
                  onClick={() => onBucket(head)}
                >
                  {inBucket(head.id) ? t("inBucket") : t("addToBucket")}
                </Button>
              </div>
              <p className="text-[11px] text-ink-faint">{t("privateNote")}</p>
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
  const t = useT("closet");
  const g = useGarmentText();
  const [open, setOpen] = useState(true);
  if (items.length === 0) return null;
  return (
    <div className="fixed bottom-4 right-4 z-40">
      {open ? (
        <div className="w-72 rounded-2xl bg-white p-3 ring-1 ring-line shadow-lift">
          <div className="mb-2 flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-ink"><Basket size={16} /> {t("comparisonBucket")} <span className="text-ink-faint">({items.length})</span></p>
            <div className="flex items-center gap-2 text-xs">
              <button onClick={onClear} className="text-ink-faint hover:text-bad">{t("clear")}</button>
              <button onClick={() => setOpen(false)} className="flex h-6 w-6 items-center justify-center rounded-full text-ink-faint hover:bg-ink/5 hover:text-ink" aria-label={t("collapse")}><CaretDown size={14} /></button>
            </div>
          </div>
          <div className="grid max-h-72 grid-cols-2 gap-2 overflow-y-auto">
            {items.map((it) => (
              <div key={it.id} className="relative rounded-lg border border-line p-2">
                <button
                  onClick={() => onRemove(it)}
                  className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-paper-dim text-[10px] leading-none text-ink-soft hover:bg-bad-tint hover:text-bad"
                  aria-label={t("removeFromBucket")}
                ><Close size={10} /></button>
                <button onClick={() => onOpen(it)} className="flex w-full flex-col items-center gap-1 text-center">
                  <ItemThumb item={it} size={44} />
                  <span className="w-full truncate text-[11px] font-medium text-ink">{itemName(it, g.label)}</span>
                  <span className="text-[10px] text-ink-faint">{g.label(it.category)} · {it.size}</span>
                </button>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[10px] text-ink-faint">{t("bucketNote")}</p>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex h-11 items-center gap-2 rounded-full bg-ink px-4 text-sm font-medium text-paper shadow-lift"
        >
          <Basket size={16} /> {t("bucket")} <span className="rounded-full bg-white/25 px-1.5">{items.length}</span>
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

// Each step's question and one line on what the answer buys (closet.step.*).
// Asking for something without saying why is most of what makes a form feel
// like homework.

function AddItemFlow({
  onAdded,
  onClose,
  fromSaved = null,
  onFromSavedDone,
}: {
  onAdded: (id: string | null) => void;
  onClose?: () => void;
  /** A to-buy product being moved into the closet once bought (Session 80). */
  fromSaved?: string | null;
  onFromSavedDone?: () => void;
}) {
  const t = useT("closet");
  const g = useGarmentText();
  const [form, setForm] = useState({ ...BLANK });
  const [stepIndex, setStepIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [justAdded, setJustAdded] = useState<string | null>(null);
  // Add-by-URL — offered on the first step as a shortcut, never as a gate.
  const [pasteUrl, setPasteUrl] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [extractNote, setExtractNote] = useState<string | null>(null);
  // The chart the extractor read, kept so the size the user picks can be stored
  // WITH the garment's own measurements. Before this the numbers were fetched,
  // shown once and thrown away — which is why a personal ease target in
  // centimetres was not computable. See docs/design/3d-body-and-tryon.md §8.
  const [sizeRows, setSizeRows] = useState<SizeRow[]>([]);
  const [measuredFrom, setMeasuredFrom] = useState<string | null>(null);
  // Labels the page itself listed, offered as one-tap answers to the size question
  // (never chosen for the user), and the link, kept on the item it came from.
  const [sizeLabels, setSizeLabels] = useState<string[]>([]);
  const [productUrl, setProductUrl] = useState<string | null>(null);
  const [fromDemo, setFromDemo] = useState(false);

  // Moving a bought product in from the to-buy list: start from what was saved —
  // and from the stored check's chart, so the garment keeps its own measurements
  // for the size bought — then ask the size actually bought and how it fits.
  useEffect(() => {
    if (!fromSaved) return;
    let live = true;
    fetch(`/api/saved?id=${encodeURIComponent(fromSaved)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!live || !j?.item) return;
        const it = j.item;
        const measured = typeof j.measuredFrom === "string" && ["page", "brand-chart", "fixture", "seller"].includes(j.measuredFrom);
        setSizeRows(measured && Array.isArray(j.sizeRows) ? j.sizeRows : []);
        setMeasuredFrom(measured ? j.measuredFrom : null);
        setSizeLabels(Array.isArray(it.sizes) ? it.sizes : []);
        setProductUrl(it.url ?? null);
        setForm((f) => ({
          ...f,
          brand: it.brand || f.brand,
          displayName: it.productName || f.displayName,
          category: it.category || f.category,
          size: it.size || "",
        }));
        setExtractNote(t("fromSavedNote", { name: it.productName || it.brand || "" }));
        setStepIndex(it.brand && it.category ? ADD_STEPS.indexOf("size") : it.brand ? ADD_STEPS.indexOf("category") : 0);
      })
      .catch(() => {});
    return () => { live = false; };
  }, [fromSaved, t]);
  const [saveFailed, setSaveFailed] = useState(false);

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
    stepIndex > 1 && g.label(form.category),
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
      // lib/closetExtract.ts decides what counts as read. A page we never saw
      // pre-fills nothing: the questions below are the whole flow, not a fallback.
      if (r.error || r.result !== "read") { setExtractNote(t("extractFailed")); return; }
      setSizeRows(Array.isArray(r.sizeRows) ? r.sizeRows : []);
      setMeasuredFrom(typeof r.measuredFrom === "string" ? r.measuredFrom : null);
      setSizeLabels(Array.isArray(r.sizeLabels) ? r.sizeLabels : []);
      setProductUrl(pasteUrl.trim());
      setFromDemo(r.demo === true);
      setForm((f) => ({
        ...f,
        brand: r.brand || f.brand,
        displayName: r.suggestedName || f.displayName,
        category: r.category || f.category,
        gender: r.gender || f.gender,
        size: "", // sizes are offered, never chosen for the user
      }));
      const bits = [r.brand, r.category && g.label(r.category)].filter(Boolean).join(" · ") || t("extractDetails");
      setExtractNote(r.demo ? t("extractDemo", { bits }) : t("extractRead", { bits, host: r.host ?? t("thePage") }));
      // The payoff for pasting a link is skipping the questions it answered — but
      // only the ones the PAGE answered. A category guessed from words in the URL
      // is pre-selected and still asked.
      if (r.brand && r.category && r.categoryFromPage) setStepIndex(ADD_STEPS.indexOf("size"));
      else if (r.brand) setStepIndex(ADD_STEPS.indexOf("category"));
    } catch {
      setExtractNote(t("extractFailed"));
    } finally {
      setExtracting(false);
    }
  }

  async function onPickImage(file: File | undefined) {
    if (!file) return;
    try {
      const dataUrl = await resizeGarmentPhoto(file);
      setForm((f) => ({ ...f, imageDataUrl: dataUrl }));
    } catch { /* ignore */ }
  }

  /**
   * The garment's own measurements for the size the user picked, if the chart we
   * read has a row for it. Sends nothing at all when it does not — a partial or
   * unattributed measurement is worse than none, and the API rejects a number
   * with no stated provenance.
   */
  function garmentMeasurementsFor(size: string): Record<string, unknown> {
    const row = sizeRows.find((r) => r.label === size);
    if (!row || !measuredFrom) return {};
    const has = row.chestCm != null || row.shoulderCm != null || row.sleeveCm != null || row.lengthCm != null;
    if (!has) return {};
    return {
      garmentChestCm: row.chestCm,
      garmentShoulderCm: row.shoulderCm,
      garmentSleeveCm: row.sleeveCm,
      garmentLengthCm: row.lengthCm,
      garmentMeasuredFrom: measuredFrom,
    };
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isLast) {
      if (ready) { setJustAdded(null); setStepIndex(stepIndex + 1); }
      return;
    }
    if (!canAdd || saving) return;
    setSaving(true);
    setSaveFailed(false);
    const res = await fetch("/api/closet", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        brand: form.brand, displayName: form.displayName || null,
        category: form.category, gender: form.gender || null, size: form.size,
        fitRating: form.fitRating, fitDirection: form.fitDirection, color: form.color || null,
        onlineAvailable: form.onlineAvailable,
        ...garmentMeasurementsFor(form.size),
        productUrl: productUrl || undefined,
        fromSavedId: fromSaved || undefined,
        imageDataUrl: form.imageDataUrl || null,
        areaNotesJson: form.areaNotes ? JSON.stringify({ notes: form.areaNotes }) : null,
      }),
    }).catch(() => null);
    // Say "added" only when it was. The form stays filled on a failure, so
    // nothing the user typed is lost.
    if (!res || !res.ok) { setSaving(false); setSaveFailed(true); return; }
    setJustAdded(`${form.brand} ${g.label(form.category)} · ${form.size}`);
    setForm({ ...BLANK });
    setStepIndex(0);
    setShowDetails(false);
    setPasteUrl(""); setExtractNote(null);
    setSizeRows([]); setMeasuredFrom(null); setSizeLabels([]); setProductUrl(null); setFromDemo(false);
    setSaving(false);
    const created = await res.json().catch(() => null);
    if (fromSaved) onFromSavedDone?.();
    onAdded(typeof created?.item?.id === "string" ? created.item.id : null);
  }

  return (
    <Card>
      {justAdded && (
        <p className="mb-4 flex items-center gap-2 rounded-lg bg-ok-tint px-3 py-2 text-sm text-ok">
          <Check size={16} className="flex-shrink-0" />
          <span>{t.rich("added", { b: (c) => <span className="font-medium">{c}</span> }, { item: justAdded })}</span>
        </p>
      )}

      {/* Where you are in the four questions. */}
      <div className="mb-4">
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <p className="flex-shrink-0 text-[10px] font-bold uppercase tracking-[0.2em] text-ink-faint">
            {t("stepOf", { n: stepIndex + 1, total: ADD_STEPS.length })}
          </p>
          {trail && <p className="min-w-0 truncate text-[11px] text-ink-soft">{trail}</p>}
          {onClose && !trail && (
            <button type="button" onClick={onClose} className="-my-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-ink-faint hover:bg-ink/5 hover:text-ink" aria-label={t("close")}>
              <Close size={16} />
            </button>
          )}
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-line">
          <div
            className="h-full rounded-full bg-brand transition-[width] duration-300"
            style={{ width: `${((stepIndex + 1) / ADD_STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* What the link gave us stays in view once the flow has moved past step 1 —
          a demo sample in particular must say so where its answers are used. */}
      {step !== "brand" && extractNote && (
        <p className="mb-4 text-[11px] text-ink-soft">{extractNote}</p>
      )}

      {/* The shortcut sits on the first step only — it answers the first
          questions, so offering it later would be offering to redo them. */}
      {step === "brand" && (
        <div className="mb-4 rounded-xl border border-dashed border-line bg-paper-soft p-3">
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-ink-faint">
            {t("haveLink")}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              className={inputClass + " min-w-0 flex-1"}
              placeholder={t("pastePlaceholder")}
              aria-label={t("pastePlaceholder")}
              value={pasteUrl}
              onChange={(e) => setPasteUrl(e.target.value)}
            />
            <Button type="button" variant="secondary" size="md" onClick={extractFromUrl} disabled={extracting || !pasteUrl.trim()}>
              {extracting ? t("reading") : t("autofill")}
            </Button>
          </div>
          {extractNote && <p className="mt-1.5 text-[11px] text-ink-soft">{extractNote}</p>}
        </div>
      )}

      <form onSubmit={onSubmit}>
        <h3 className="text-base font-semibold text-ink">{t(`step.${step}.q`)}</h3>
        <p className="mt-0.5 text-xs text-ink-soft">{t(`step.${step}.why`)}</p>

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
            <>
              {sizeLabels.length > 0 && (
                <div className="mb-3">
                  <p className="mb-1.5 text-[11px] text-ink-faint">{fromDemo ? t("sizesInDemo") : t("sizesOnPage")}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {sizeLabels.map((l) => (
                      <Chip key={l} selected={form.size === l} onClick={() => setForm({ ...form, size: l })}>{l}</Chip>
                    ))}
                  </div>
                </div>
              )}
              <SizeInput category={form.category} value={form.size} onChange={(v) => setForm({ ...form, size: v })} />
            </>
          )}
          {step === "fit" && (
            <FitDirectionInput
              value={form.fitDirection}
              onChange={(n) => setForm({ ...form, fitDirection: n, fitRating: ratingFromDirection(n) })}
            />
          )}
        </div>

        {saveFailed && <p role="alert" className="mt-4 text-sm text-bad">{t("addFailed")}</p>}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          {stepIndex > 0 && (
            <Button type="button" variant="ghost" onClick={() => setStepIndex(stepIndex - 1)}>{t("back")}</Button>
          )}
          <Button type="submit" disabled={!ready || (isLast && (saving || !canAdd))}>
            {isLast ? (saving ? t("adding") : t("addToCloset")) : t("continue")}
          </Button>
        </div>

        {/* Everything the engine does not read. Reachable, not in the way. */}
        {isLast && (
          <div className="mt-5 border-t border-line pt-3">
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="inline-flex items-center gap-1 text-xs font-medium text-ink-soft hover:text-ink"
            >
              <CaretDown size={14} className={`transition-transform ${showDetails ? "rotate-180" : ""}`} />
              {showDetails ? t("hideDetails") : t("addDetails")}
            </button>
            <p className="mt-1 text-[11px] text-ink-faint">{t("detailsNote")}</p>

            {showDetails && (
              <div className="mt-3 grid gap-3 sm:grid-cols-6">
                <div className="sm:col-span-6">
                  <Field label={t("photo")} hint={t("photoHint")}>
                    <div className="flex items-center gap-3">
                      <label className="flex h-16 w-16 flex-shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-line bg-white text-xl text-ink-faint hover:border-brand">
                        {form.imageDataUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={form.imageDataUrl} alt="" className="h-full w-full object-cover" />
                        ) : <GarmentIcon category={form.category} size={28} />}
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => onPickImage(e.target.files?.[0])} />
                      </label>
                      {form.imageDataUrl
                        ? <button type="button" onClick={() => setForm({ ...form, imageDataUrl: "" })} className="text-xs text-ink-faint hover:text-bad">{t("removePhoto")}</button>
                        : <span className="min-w-0 text-xs text-ink-faint">{t("uploadHint")}</span>}
                    </div>
                  </Field>
                </div>
                <div className="sm:col-span-3">
                  <Field label={t("name")} hint={t("optional")}>
                    <input className={inputClass} placeholder={t("namePlaceholder")}
                      value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} />
                  </Field>
                </div>
                <div className="sm:col-span-3">
                  <Field label={t("lineLabel")} hint={t("optional")}>
                    <select className={inputClass} value={form.gender}
                      onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                      {GENDERS.map((v) => <option key={v} value={v}>{g.line(v)}</option>)}
                    </select>
                  </Field>
                </div>
                <div className="sm:col-span-3">
                  <Field label={t("color")} hint={t("optional")}>
                    <ColorPicker value={form.color} onChange={(v) => setForm({ ...form, color: v })} />
                  </Field>
                </div>
                <div className="sm:col-span-3">
                  <Field label={t("fitNotes")} hint={t("optional")}>
                    <input className={inputClass} placeholder={t("notesPlaceholder")}
                      value={form.areaNotes} onChange={(e) => setForm({ ...form, areaNotes: e.target.value })} />
                  </Field>
                </div>
                <div className="flex items-center sm:col-span-6">
                  <label className="flex items-center gap-1.5 text-xs text-ink-soft">
                    <input type="checkbox" checked={!form.onlineAvailable} className="accent-brand"
                      onChange={(e) => setForm({ ...form, onlineAvailable: !e.target.checked })} />
                    {t("inStoreOnly")}
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

/**
 * The garment's own measurements, when we captured them.
 *
 * Shown rather than kept silently because this is what makes `ease = garment −
 * body` computable for a piece the wearer OWNS AND LIKES — the strongest ease
 * signal available, and until now the extractor read these numbers at add time
 * and threw them away. Displaying them is also the only way the user can tell
 * that we have them, and check them.
 *
 * `garmentMeasuredFrom` is always shown alongside. A measurement read off the
 * retailer's own chart and one produced by the extractor's fallback ladder look
 * identical on screen, and the difference is exactly what `source.sizesFrom`
 * exists to preserve.
 */
function GarmentMeasurements({ item }: { item: Item }) {
  const t = useT("closet");
  const tm = useT("check");
  const parts = [
    item.garmentChestCm != null && tm("measure.chest", { n: item.garmentChestCm }),
    item.garmentShoulderCm != null && tm("measure.shoulder", { n: item.garmentShoulderCm }),
    item.garmentSleeveCm != null && tm("measure.sleeve", { n: item.garmentSleeveCm }),
    item.garmentLengthCm != null && tm("measure.length", { n: item.garmentLengthCm }),
  ].filter(Boolean) as string[];
  if (parts.length === 0) return null;

  const fromPage = item.garmentMeasuredFrom === "page" || item.garmentMeasuredFrom === "fixture";
  return (
    <div className="mt-1 flex min-w-0 flex-wrap items-center gap-1">
      <span
        className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
          fromPage ? "bg-brand/10 text-brand-dark" : "bg-paper-dim text-ink-faint"
        }`}
        title={fromPage ? t("measuredTitle") : t("estimatedTitle")}
      >
        {fromPage ? t("garmentMeasured") : t("garmentEstimated")}
      </span>
      {parts.map((t) => (
        <span key={t} className="min-w-0 truncate rounded bg-paper-soft px-1.5 py-0.5 text-[10px] tabular-nums text-ink-soft">
          {t}
        </span>
      ))}
    </div>
  );
}
