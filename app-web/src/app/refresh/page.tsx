"use client";

// Fit Refresh — a card stack for re-rating how clothes feel as your body changes.
// One card per garment. A comfort slider (1–5) starts at the item's current
// rating. Swipe/drag the card RIGHT (or the Save button) to record the new
// rating; LEFT (or Skip) to leave it unchanged. Keyboard: ←/→ = skip/save.

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button, Card, EmptyState, LinkButton } from "@/components/ui";

type Item = {
  id: string;
  brand: string;
  category: string;
  gender: string | null;
  size: string;
  color: string | null;
  currentRating: number;
  collectionName: string;
};

const COMFORT_LABELS: Record<number, string> = {
  1: "Doesn't fit",
  2: "Poor",
  3: "Okay",
  4: "Good",
  5: "Perfect",
};

function RefreshInner() {
  const params = useSearchParams();
  const collections = params.get("collections") ?? "all";

  const [items, setItems] = useState<Item[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [rating, setRating] = useState(4);
  const [saved, setSaved] = useState(0);
  const [skipped, setSkipped] = useState(0);

  // drag state
  const [dragX, setDragX] = useState(0);
  const [leaving, setLeaving] = useState<null | "save" | "skip">(null);
  const startX = useRef<number | null>(null);

  useEffect(() => {
    fetch(`/api/closet/refresh?collections=${encodeURIComponent(collections)}`)
      .then((r) => r.json())
      .then((d) => setItems(d.items));
  }, [collections]);

  const current = items?.[idx];
  useEffect(() => {
    if (current) setRating(current.currentRating);
  }, [current]);

  const advance = useCallback(() => {
    setDragX(0);
    setLeaving(null);
    setIdx((i) => i + 1);
  }, []);

  const commit = useCallback(
    async (mode: "save" | "skip") => {
      if (!current) return;
      setLeaving(mode);
      const body =
        mode === "save"
          ? { itemId: current.id, rating, reason: "refresh" }
          : { itemId: current.id, skip: true };
      // Fire-and-forget; UI advances on the exit animation.
      fetch("/api/closet/refresh", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      }).catch(() => {});
      if (mode === "save") setSaved((n) => n + 1);
      else setSkipped((n) => n + 1);
      setTimeout(advance, 240);
    },
    [current, rating, advance],
  );

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!current || leaving) return;
      if (e.key === "ArrowRight") commit("save");
      else if (e.key === "ArrowLeft") commit("skip");
      else if (e.key >= "1" && e.key <= "5") setRating(Number(e.key));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, leaving, commit]);

  // Pointer drag
  function onPointerDown(e: React.PointerEvent) {
    startX.current = e.clientX;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (startX.current == null) return;
    setDragX(e.clientX - startX.current);
  }
  function onPointerUp() {
    if (startX.current == null) return;
    const dx = dragX;
    startX.current = null;
    if (dx > 110) commit("save");
    else if (dx < -110) commit("skip");
    else setDragX(0); // snap back
  }

  if (!items) {
    return <main className="flex-1"><div className="mx-auto max-w-md px-6 py-14 text-ink-faint">Loading…</div></main>;
  }

  if (items.length === 0) {
    return (
      <main className="flex-1">
        <div className="mx-auto max-w-md px-6 py-14">
          <EmptyState
            title="Nothing to refresh"
            body="Add some clothes to your closet first, then come back to update how they feel."
            action={<LinkButton href="/closet">Go to closet →</LinkButton>}
          />
        </div>
      </main>
    );
  }

  const done = idx >= items.length;

  return (
    <main className="flex-1 bg-neutral-100">
      <div className="mx-auto max-w-md px-6 py-8">
        {/* Progress */}
        <div className="mb-4 flex items-center justify-between text-sm">
          <Link href="/closet" className="text-ink-faint hover:text-brand">← Closet</Link>
          <span className="text-ink-soft">
            {Math.min(idx + (done ? 0 : 1), items.length)} / {items.length}
          </span>
        </div>
        <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-neutral-200">
          <div className="h-full rounded-full bg-brand transition-all"
            style={{ width: `${(idx / items.length) * 100}%` }} />
        </div>

        {done ? (
          <Card className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-2xl">✓</div>
            <h2 className="text-xl font-semibold text-ink">Fit refresh complete</h2>
            <p className="mt-1 text-sm text-ink-soft">
              Updated {saved} · skipped {skipped}. Your closet reflects how things
              feel today.
            </p>
            <div className="mt-5 flex justify-center gap-3">
              <LinkButton href="/closet">Back to closet</LinkButton>
              <LinkButton href="/check" variant="secondary">Check a product</LinkButton>
            </div>
          </Card>
        ) : (
          <>
            {/* Card */}
            <div className="relative h-[360px] select-none">
              {/* peek of next card */}
              {items[idx + 1] && (
                <div className="absolute inset-x-3 top-3 h-full rounded-2xl bg-white opacity-60 shadow-card ring-1 ring-neutral-200" />
              )}
              <div
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                className="absolute inset-0 cursor-grab touch-none rounded-2xl bg-white p-6 shadow-lift ring-1 ring-neutral-200 active:cursor-grabbing"
                style={{
                  transform: leaving
                    ? `translateX(${leaving === "save" ? 600 : -600}px) rotate(${leaving === "save" ? 18 : -18}deg)`
                    : `translateX(${dragX}px) rotate(${dragX / 30}deg)`,
                  transition: leaving || startXIsNull(startX) ? "transform 0.24s ease-out" : "none",
                }}
              >
                {/* swipe hint overlays */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-6">
                  <span className={`rounded-lg border-2 border-neutral-400 px-2 py-1 text-sm font-bold uppercase text-neutral-400 transition-opacity ${dragX < -40 ? "opacity-100" : "opacity-0"}`}>Skip</span>
                  <span className={`rounded-lg border-2 border-green-500 px-2 py-1 text-sm font-bold uppercase text-green-600 transition-opacity ${dragX > 40 ? "opacity-100" : "opacity-0"}`}>Save</span>
                </div>

                <p className="text-xs uppercase tracking-widest text-ink-faint">{current!.collectionName}</p>
                <div className="mt-4 flex items-center gap-3">
                  <GarmentThumb item={current!} />
                  <div className="min-w-0">
                    <h2 className="truncate text-xl font-semibold text-ink">{current!.brand}</h2>
                    <p className="text-sm text-ink-soft">
                      {current!.category} · size {current!.size}
                      {current!.color ? ` · ${current!.color}` : ""}
                    </p>
                  </div>
                </div>

                <div className="mt-8">
                  <div className="flex items-baseline justify-between">
                    <p className="text-sm font-medium text-ink">How does it feel now?</p>
                    <span className="text-sm font-semibold text-brand">{COMFORT_LABELS[rating]}</span>
                  </div>
                  <input
                    type="range" min={1} max={5} step={1} value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                    onPointerDown={(e) => e.stopPropagation()}
                    className="mt-3 w-full accent-brand"
                  />
                  <div className="mt-1 flex justify-between text-[10px] text-ink-faint">
                    {[1, 2, 3, 4, 5].map((n) => <span key={n}>{n}</span>)}
                  </div>
                  {rating !== current!.currentRating && (
                    <p className="mt-2 text-xs text-brand">
                      Changed from {current!.currentRating} → {rating}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="mt-6 flex items-center justify-center gap-3">
              <Button variant="secondary" onClick={() => commit("skip")}>← Skip</Button>
              <Button onClick={() => commit("save")}>Save →</Button>
            </div>
            <p className="mt-3 text-center text-xs text-ink-faint">
              Swipe the card, use the buttons, or press ← / → · number keys set comfort
            </p>
          </>
        )}
      </div>
    </main>
  );
}

function startXIsNull(ref: React.MutableRefObject<number | null>) {
  return ref.current == null;
}

// Placeholder garment thumbnail (color swatch + type glyph). A real product
// image / web lookup can slot in here later without changing the card layout.
function GarmentThumb({ item }: { item: Item }) {
  const hex = colorHex(item.color);
  const glyph = GARMENT_GLYPH[item.category] ?? "👕";
  return (
    <div
      className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl border border-neutral-200 text-2xl"
      style={{ backgroundColor: hex ?? "#f5f5f5" }}
      title={item.color ?? undefined}
    >
      {glyph}
    </div>
  );
}

const GARMENT_GLYPH: Record<string, string> = {
  tshirt: "👕", shirt: "👔", polo: "👕", sweater: "🧶",
  hoodie: "🧥", jacket: "🧥", other: "👚",
};

const COLOR_PRESETS: Record<string, string> = {
  black: "#1a1a1a", white: "#f5f5f5", grey: "#9ca3af", charcoal: "#374151",
  navy: "#1f2a44", blue: "#3b82f6", denim: "#4a6fa5", beige: "#d8c3a5",
  cream: "#f0e9d6", brown: "#6b4f3a", olive: "#6b7443", green: "#4b7a53",
  sage: "#9caf88", teal: "#2f8f83", burgundy: "#6d2036", red: "#b03a3a",
  rust: "#b5622f", mustard: "#d0a028", pink: "#dba0b0", purple: "#7c5aa8",
};
function colorHex(c: string | null): string | null {
  if (!c) return null;
  if (/^#[0-9a-f]{3,8}$/i.test(c)) return c;
  return COLOR_PRESETS[c.toLowerCase()] ?? null;
}

export default function RefreshPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-md px-6 py-14">Loading…</div>}>
      <RefreshInner />
    </Suspense>
  );
}
