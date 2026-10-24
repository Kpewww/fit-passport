"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Button, Card, Chip, Field, FitStars, LinkButton, Page, PageHeader, Segmented, inputClass } from "@/components/ui";
import { ArrowLeft, ArrowRight, Basket, Camera, CaretDown, CaretUp, Check, Close, Hanger, Plus, Refresh, Reorder, Stack, Trash } from "@/components/Icon";
import { GarmentIcon } from "@/components/GarmentIcon";
import { GarmentCover } from "@/components/GarmentCover";
import { resizeGarmentPhoto } from "@/lib/imageResize";
import { FitScaleProvider } from "@/components/FitDirectionInput";
import { useT } from "@/i18n/client";
import { useGarmentText } from "@/i18n/garment";
import dynamic from "next/dynamic";
import { pluralKey } from "@/i18n/format";
import { SEASONS, inSeason, type Season } from "@/lib/seasons";
import { dayDiff, localDay } from "@/lib/localDay";
import { Item, Collection, Group, shownPhoto, GenderBadge, ColorDot, safeNotes, ItemThumb, itemName, GarmentMeasurements, ConfirmDelete, MoveMenu } from "./shared";

// Parts that appear only once opened load on demand (Session 100: /closet was over its
// JavaScript budget). Each brings its own inputs: brand and size boxes, the type
// picker, the colour picker, the link check and the photo sources.
const AddItemFlow = dynamic(() => import("./AddItemFlow").then((m) => m.AddItemFlow), { loading: () => <div className="h-44 animate-pulse rounded-2xl bg-white/60 ring-1 ring-line" /> });
const EditRow = dynamic(() => import("./EditRow").then((m) => m.EditRow));
const DetailSheet = dynamic(() => import("./DetailSheet").then((m) => m.DetailSheet));
const BatchAdd = dynamic(() => import("@/components/BatchAdd").then((m) => m.BatchAdd), { loading: () => <div className="h-32 animate-pulse rounded-2xl bg-white/60 ring-1 ring-line" /> });

/** How long a delete can be undone before it reaches the server. */
const UNDO_MS = 6000;

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
  // Season (Session 104): narrows every view; untagged pieces are in every season.
  const [season, setSeason] = useState<Season | "all">("all");
  // The piece just added — its card asks for a photo until it gets one. The
  // photo is never a step in the add flow (build-state ㉙); this is the nudge.
  const [nudgeId, setNudgeId] = useState<string | null>(null);
  const lookalikes = useMemo(() => lookalikeIds(items), [items]);
  // Once the closet has its three pieces, the add flow folds into one row so the
  // clothes, not the form, lead the page.
  const [addOpen, setAddOpen] = useState(false);
  const [batchOpen, setBatchOpen] = useState(false);
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

  // A delete waits a few seconds before it reaches the server, so it can be undone
  // (Session 88c). Pieces waiting to go stay hidden through any reload meanwhile.
  const pendingDelete = useRef<{ ids: string[]; timer: ReturnType<typeof setTimeout> } | null>(null);
  const [undoCount, setUndoCount] = useState(0);
  // Bumped on every delete, so a second delete restarts the toast's countdown.
  const [undoRound, setUndoRound] = useState(0);

  const load = useCallback(async () => {
    const [c, i, sv] = await Promise.all([
      fetch("/api/collections").then((r) => r.json()),
      fetch("/api/closet").then((r) => r.json()),
      fetch("/api/saved").then((r) => r.json()).catch(() => ({ items: [] })),
    ]);
    setCollections(c.collections);
    const waiting = new Set(pendingDelete.current?.ids ?? []);
    setItems((i.items as Item[]).filter((it) => !waiting.has(it.id)));
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
  async function setPhoto(id: string, file: Blob | null) {
    const imageDataUrl = file ? await resizeGarmentPhoto(file) : null;
    if (id === nudgeId) setNudgeId(null);
    // A photo chosen on the website is the wearer's own; null clears the origin too.
    await patch(id, { imageDataUrl, photoFrom: imageDataUrl ? "own" : null });
  }

  function commitDelete() {
    const p = pendingDelete.current;
    if (!p) return;
    clearTimeout(p.timer);
    pendingDelete.current = null;
    setUndoCount(0);
    // keepalive: the request survives the page being closed right after.
    fetch(`/api/closet?ids=${p.ids.map(encodeURIComponent).join(",")}`, { method: "DELETE", keepalive: true }).then(() => load());
  }

  /** Take pieces out now; they reach the server after UNDO_MS unless undone. */
  function removeMany(ids: string[]) {
    if (ids.length === 0) return;
    commitDelete(); // an earlier delete is final once another starts
    const gone = new Set(ids);
    setItems((prev) => prev.filter((it) => !gone.has(it.id)));
    setDetailGroup((g) => {
      if (!g) return g;
      const left = g.items.filter((it) => !gone.has(it.id));
      return left.length ? { ...g, items: left } : null;
    });
    pendingDelete.current = { ids, timer: setTimeout(commitDelete, UNDO_MS) };
    setUndoCount(ids.length);
    setUndoRound((r) => r + 1);
  }

  function undoDelete() {
    const p = pendingDelete.current;
    if (!p) return;
    clearTimeout(p.timer);
    pendingDelete.current = null;
    setUndoCount(0);
    load();
  }

  // Leaving the page makes a waiting delete final rather than forgetting it.
  useEffect(() => {
    const flush = () => commitDelete();
    window.addEventListener("pagehide", flush);
    return () => { window.removeEventListener("pagehide", flush); flush(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function remove(id: string) {
    removeMany([id]);
  }

  function removeSelected() {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    setSelected(new Set());
    setSelectMode(false);
    removeMany(ids);
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

  // Bucket items by collection (plus an Uncategorized bucket), in the chosen season.
  const seasonal = season === "all" ? items : items.filter((it) => inSeason(it.seasons, season));
  const uncategorized = seasonal.filter((it) => !it.collectionId);
  const buckets = [
    ...collections
      .slice()
      .sort((a, b) => a.sortIndex - b.sortIndex)
      .map((c, i) => ({ collection: c, items: itemsIn(seasonal, c.id), seed: i })),
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

      {/* Several pieces at once, a photo each (Session 88c). */}
      <div className="mt-3">
        {batchOpen ? (
          <BatchAdd onClose={() => setBatchOpen(false)} onAdded={() => load()} />
        ) : (
          <button type="button" onClick={() => setBatchOpen(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-medium text-ink-soft hover:bg-white hover:text-ink">
            <Stack size={16} /> {t("batchOpen")}
          </button>
        )}
      </div>

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
              {count >= 1 && !selectMode && (
                <Button size="sm" variant="ghost" icon={<Trash size={16} />} onClick={() => setSelectMode(true)}>{t("selectToDelete")}</Button>
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

          {count >= 3 && (
            <div role="group" aria-label={t("seasonsLabel")} className="no-scrollbar -mx-1 mt-3 flex gap-2 overflow-x-auto px-1">
              <Chip selected={season === "all"} onClick={() => setSeason("all")} className="flex-shrink-0">{t("seasonAll")}</Chip>
              {SEASONS.map((s) => (
                <Chip key={s} selected={season === s} onClick={() => setSeason(s)} className="flex-shrink-0">{t(`season.${s}`)}</Chip>
              ))}
            </div>
          )}

          {selectMode && (
            <div className="mt-4 flex flex-col gap-3 rounded-2xl bg-white px-4 py-3 ring-1 ring-line sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-ink-soft">
                {t.rich("mergeHelp", { b: (c) => <strong className="font-medium text-ink">{c}</strong> })}
                <span className="ml-2 tabular-nums text-ink-faint">{t("selected", { n: selected.size })}</span>
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" disabled={selected.size < 2} onClick={doMerge}>{selected.size > 0 ? t("mergeButtonN", { n: selected.size }) : t("mergeButton")}</Button>
                <ConfirmDelete label={t("deleteSelectedN", { n: selected.size })} confirmLabel={t("confirmDeleteN", { n: selected.size })} disabled={selected.size < 1} onConfirm={removeSelected} variant="secondary" />
                <Button size="sm" variant="ghost" onClick={() => { setSelectMode(false); setSelected(new Set()); }}>{t("exitSelect")}</Button>
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
                  lookalike={!g.isVariant && lookalikes.has(g.items[0].id)}
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
                  lookalikes={lookalikes}
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
      <UndoToast count={undoCount} round={undoRound} onUndo={undoDelete} />
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
      {/* The demo seeds an empty closet and fills blank measurements only (api/demo,
          Session 100e); it is offered only to someone with neither. */}
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
  lookalikes,
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
  onPhoto: (id: string, file: Blob | null) => Promise<void>;
  nudgeId: string | null;
  /** Pieces that look like another of the same brand and type, and have no name. */
  lookalikes: Set<string>;
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
                <ConfirmDelete label={t("delete")} confirmLabel={t("confirmDeleteFolder")} hint={t("folderPiecesMove")} onConfirm={deleteCollection} variant="link" />
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
              lookalike={!g.isVariant && lookalikes.has(g.items[0].id)}
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
  lookalike = false,
}: {
  /** Another piece of the same brand and type exists and this one has no name. */
  lookalike?: boolean;
  group: Group;
  onOpen: (g: Group) => void;
  onPhoto: (id: string, file: Blob | null) => Promise<void>;
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
  const photo = shownPhoto(head);
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
        {!group.isVariant && (head.wornCount ?? 0) > 0 && (
          <p className="mt-1 text-[11px] text-ink-faint">{wornLine(t, head.wornCount ?? 0, head.lastWorn ?? null)}</p>
        )}
        {lookalike && !selectMode && (
          <button type="button" onClick={() => onOpen(group)} className="mt-1 text-[11px] font-medium text-brand hover:underline">
            {t("nameToTell")}
          </button>
        )}
        {failed && <p className="mt-1 text-xs text-bad">{t("photoFailed")}</p>}
      </figcaption>
    </figure>
  );
}

/**
 * "Deleted 2. Undo" — rises in, drains a bar over the undo window, and fades out
 * when the window closes or the delete is undone (Session 88e). `round` restarts
 * the countdown when another delete comes in while it is showing.
 */
function UndoToast({ count, round, onUndo }: { count: number; round: number; onUndo: () => void }) {
  const t = useT("closet");
  // Kept on screen for the exit animation after the count drops to 0.
  const [shown, setShown] = useState(0);
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    if (count > 0) { setShown(count); setLeaving(false); return; }
    if (shown === 0) return;
    setLeaving(true);
    const id = setTimeout(() => { setShown(0); setLeaving(false); }, 220);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);
  if (shown === 0) return null;
  return (
    <div role="status" key={round}
      className={`fixed bottom-5 left-1/2 z-40 -translate-x-1/2 overflow-hidden whitespace-nowrap rounded-xl bg-ink text-sm text-paper shadow-lg ${leaving ? "animate-toast-out" : "animate-toast-in"}`}>
      <div className="flex items-center gap-4 px-5 pb-3.5 pt-2.5">
        <Trash size={16} className="text-paper/60" />
        <span>{t("deletedN", { n: shown })}</span>
        <button type="button" onClick={onUndo} disabled={leaving} className="font-semibold underline-offset-2 hover:underline">{t("undo")}</button>
      </div>
      {/* How long is left to undo. */}
      <span aria-hidden className={`toast-drain absolute inset-x-5 bottom-1.5 h-[2px] origin-left rounded-full bg-paper/45 ${leaving ? "scale-x-0" : "animate-drain"}`}
        style={{ animationDuration: `${UNDO_MS}ms` }} />
    </div>
  );
}

/**
 * Pieces with no name that share a brand and type with another piece — "Maje
 * sweater" twice, and nothing to tell them apart on a check (Session 88b).
 */
function lookalikeIds(items: Item[]): Set<string> {
  const byKey = new Map<string, Item[]>();
  for (const it of items) {
    if (it.groupId) continue; // sizes of one garment are one piece
    const k = `${it.brand.trim().toLowerCase()}|${it.category}`;
    byKey.set(k, [...(byKey.get(k) ?? []), it]);
  }
  const out = new Set<string>();
  for (const arr of byKey.values()) {
    if (arr.length < 2) continue;
    for (const it of arr) if (!it.displayName) out.add(it.id);
  }
  return out;
}

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
                    <ConfirmDelete label={t("remove")} onConfirm={() => onRemove(it.id)} variant="link" />
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
          <ConfirmDelete label={t("remove")} onConfirm={() => onRemove(it.id)} variant="link" />
        </div>
      )}
    </Card>
  );
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

/** "Worn 3 times · 12 days ago" (Session 104, from the wear calendar). */
function wornLine(t: ReturnType<typeof useT<"closet">>, n: number, last: string | null): string {
  const count = t(pluralKey("wornTimes", n), { n });
  if (!last) return count;
  const ago = dayDiff(last, localDay());
  const when = ago <= 0 ? t("wornToday") : ago === 1 ? t("wornYesterday") : t("wornDaysAgo", { n: ago });
  return `${count} · ${when}`;
}
