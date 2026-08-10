"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Card, EmptyState, Field, LinkButton, inputClass } from "@/components/ui";
import { BrandInput } from "@/components/BrandInput";

type Item = {
  id: string;
  brand: string;
  category: string;
  size: string;
  region: string | null;
  fitRating: number;
  areaNotesJson: string | null;
  color: string | null;
  collectionId: string | null;
  sortIndex: number;
  groupId: string | null;
  groupName: string | null;
};

type Collection = { id: string; name: string; sortIndex: number; itemCount: number };

const CATEGORIES = ["tshirt", "shirt", "sweater", "jacket", "hoodie", "polo", "other"];

// Small preset palette for color tags (plus free text).
const COLOR_PRESETS: Array<{ name: string; hex: string }> = [
  { name: "black", hex: "#1a1a1a" },
  { name: "white", hex: "#f5f5f5" },
  { name: "navy", hex: "#1f2a44" },
  { name: "blue", hex: "#3b82f6" },
  { name: "grey", hex: "#9ca3af" },
  { name: "beige", hex: "#d8c3a5" },
  { name: "green", hex: "#4b7a53" },
  { name: "red", hex: "#b03a3a" },
  { name: "brown", hex: "#6b4f3a" },
];

function colorHex(name: string | null): string | null {
  if (!name) return null;
  if (/^#[0-9a-f]{3,8}$/i.test(name)) return name;
  return COLOR_PRESETS.find((c) => c.name === name.toLowerCase())?.hex ?? null;
}

const BLANK = { brand: "", category: "tshirt", size: "", fitRating: 5, areaNotes: "", color: "" };

export default function ClosetPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [form, setForm] = useState({ ...BLANK });
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newCollectionName, setNewCollectionName] = useState("");

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
    if (!form.brand || !form.size) return;
    setSaving(true);
    await fetch("/api/closet", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        brand: form.brand, category: form.category, size: form.size,
        fitRating: form.fitRating, color: form.color || null,
        areaNotesJson: form.areaNotes ? JSON.stringify({ notes: form.areaNotes }) : null,
      }),
    });
    setForm({ ...BLANK });
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
          <div className="flex-shrink-0 text-right">
            <div className={`text-2xl font-bold ${goalMet ? "text-green-600" : "text-brand"}`}>
              {Math.min(count, 3)}/3
            </div>
            <div className="text-xs text-ink-faint">{goalMet ? "goal met ✓" : "recommended"}</div>
          </div>
        </div>

        {/* Add form */}
        <Card className="mt-6">
          <form onSubmit={add} className="grid gap-3 sm:grid-cols-6">
            <div className="sm:col-span-2">
              <Field label="Brand">
                <BrandInput value={form.brand} onChange={(v) => setForm({ ...form, brand: v })} />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Type" hint="used by the engine">
                <select className={inputClass} value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
            </div>
            <div className="sm:col-span-1">
              <Field label="Size"><input className={inputClass} placeholder="M"
                value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} /></Field>
            </div>
            <div className="sm:col-span-1">
              <Field label="Fit">
                <select className={inputClass} value={form.fitRating}
                  onChange={(e) => setForm({ ...form, fitRating: Number(e.target.value) })}>
                  {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}/5</option>)}
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
            <div className="sm:col-span-6">
              <Button type="submit" disabled={saving || !form.brand || !form.size}>
                {saving ? "Adding…" : "Add to closet"}
              </Button>
            </div>
          </form>
        </Card>

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
            {buckets.map(({ collection, items: bucketItems }) => (
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
        {!undeletable && !renaming && (
          <div className="flex items-center gap-3 text-xs">
            <button onClick={() => setRenaming(true)} className="text-ink-faint hover:text-brand">Rename</button>
            <button onClick={deleteCollection} className="text-ink-faint hover:text-red-600">Delete</button>
          </div>
        )}
      </div>

      {items.length === 0 ? (
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

function ItemCard({
  group,
  collections,
  onEdit,
  onPatch,
  onRemove,
}: {
  group: Group;
  collections: Collection[];
  onEdit: (id: string) => void;
  onPatch: (id: string, data: Record<string, unknown>) => void;
  onRemove: (id: string) => void;
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
          <div className="mt-3 space-y-2 border-t border-neutral-100 pt-3">
            {group.items.map((it) => (
              <div key={it.id} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-ink-soft">
                  <ColorDot color={it.color} />
                  size {it.size}{it.color ? ` · ${it.color}` : ""} ·{" "}
                  <span className="text-amber-500">{"★".repeat(it.fitRating)}</span>
                </span>
                <span className="flex gap-3 text-xs">
                  <button onClick={() => onEdit(it.id)} className="text-ink-faint hover:text-brand">Edit</button>
                  <button onClick={() => onPatch(it.id, { groupId: null, groupName: null })}
                    className="text-ink-faint hover:text-brand">Unmerge</button>
                  <button onClick={() => onRemove(it.id)} className="text-ink-faint hover:text-red-600">Remove</button>
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    );
  }

  const it = head;
  return (
    <Card className="flex items-center justify-between !p-4 animate-fade-in-up">
      <div className="min-w-0">
        <div className="flex items-center gap-2 font-medium text-ink">
          <ColorDot color={it.color} />
          <span className="truncate">
            {it.brand} · <span className="text-ink-soft">{it.category}</span> · size {it.size}
          </span>
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-ink-faint">
          <span className="text-amber-500">{"★".repeat(it.fitRating)}<span className="text-neutral-300">{"★".repeat(5 - it.fitRating)}</span></span>
          {it.color && <span>· {it.color}</span>}
          {it.areaNotesJson && <span>· {safeNotes(it.areaNotesJson)}</span>}
        </div>
      </div>
      <div className="flex flex-shrink-0 items-center gap-2 text-xs">
        <MoveMenu
          collections={collections}
          currentId={it.collectionId}
          onMove={(cid) => onPatch(it.id, { collectionId: cid })}
        />
        <button onClick={() => onEdit(it.id)} className="text-ink-soft hover:text-brand">Edit</button>
        <button onClick={() => onRemove(it.id)} className="text-ink-faint hover:text-red-600">Remove</button>
      </div>
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
    brand: item.brand, category: item.category, size: item.size,
    fitRating: item.fitRating, color: item.color ?? "",
    collectionId: item.collectionId ?? "",
    areaNotes: safeNotes(item.areaNotesJson) ?? "",
  });
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!f.brand || !f.size) return;
    setSaving(true);
    await fetch("/api/closet", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: item.id, brand: f.brand, category: f.category, size: f.size,
        fitRating: f.fitRating, color: f.color || null,
        collectionId: f.collectionId || null,
        areaNotesJson: f.areaNotes ? JSON.stringify({ notes: f.areaNotes }) : null,
      }),
    });
    setSaving(false);
    onSaved();
  }

  return (
    <Card className="!p-4 ring-brand/30 animate-fade-in-up">
      <div className="grid gap-3 sm:grid-cols-6">
        <div className="sm:col-span-2">
          <Field label="Brand"><BrandInput value={f.brand} onChange={(v) => setF({ ...f, brand: v })} /></Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Type">
            <select className={inputClass} value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
        </div>
        <div className="sm:col-span-1">
          <Field label="Size"><input className={inputClass} value={f.size} onChange={(e) => setF({ ...f, size: e.target.value })} /></Field>
        </div>
        <div className="sm:col-span-1">
          <Field label="Fit">
            <select className={inputClass} value={f.fitRating} onChange={(e) => setF({ ...f, fitRating: Number(e.target.value) })}>
              {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}/5</option>)}
            </select>
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
          <Button onClick={save} disabled={saving || !f.brand || !f.size}>{saving ? "Saving…" : "Save changes"}</Button>
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        </div>
      </div>
    </Card>
  );
}

function ColorPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        {COLOR_PRESETS.map((c) => (
          <button
            key={c.name}
            type="button"
            title={c.name}
            onClick={() => onChange(value === c.name ? "" : c.name)}
            className={`h-6 w-6 rounded-full border transition-transform ${
              value === c.name ? "scale-110 border-brand ring-2 ring-brand/30" : "border-neutral-300"
            }`}
            style={{ backgroundColor: c.hex }}
          />
        ))}
      </div>
      <input
        className={inputClass + " flex-1"}
        placeholder="or type…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
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
