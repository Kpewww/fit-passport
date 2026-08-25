"use client";

// Fit Refresh — a card stack for re-rating how clothes feel as your body changes.
//
// Flow:
//   1. PICK  — choose which collection(s) / All to refresh (pre-selected from the
//              ?collections= link, but always adjustable).
//   2. CARDS — one card per garment; the five-way fit DIRECTION control starts at
//              the item's last report. Swipe/fling RIGHT (or Save) records it;
//              LEFT (or Skip) leaves it unchanged. Keyboard: ←/→, digits 1–5.
//   3. DONE  — summary.
//
// The card motion is velocity-aware: a quick flick commits even if short, and
// release animates out on a spring-like curve while the next card rises to meet
// you.

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button, Card, EmptyState, LinkButton } from "@/components/ui";
import { garmentGlyph, garmentLabel } from "@/lib/garments";
import { FitDirectionInput, FitScaleProvider } from "@/components/FitDirectionInput";
import { DIRECTION_DEFAULT, DIRECTION_OPTIONS, nearestOption } from "@/lib/fitDirection";

type Item = {
  id: string;
  brand: string;
  category: string;
  gender: string | null;
  size: string;
  color: string | null;
  currentRating: number;
  currentDirection: number | null;
  collectionName: string;
};

type Collection = { id: string; name: string; itemCount: number };

// Spring-like ease for snap-back and card exits (easeOutQuint-ish).
const SPRING = "cubic-bezier(0.22, 1, 0.36, 1)";
const COMMIT_DIST = 105; // px past which a release commits
const COMMIT_VELOCITY = 0.6; // px/ms flick that commits regardless of distance

function RefreshInner() {
  const params = useSearchParams();
  const initialParam = params.get("collections") ?? "all";

  // ----- phase -----
  const [phase, setPhase] = useState<"pick" | "cards">("pick");

  // ----- picker -----
  const [collections, setCollections] = useState<Collection[] | null>(null);
  const [allSelected, setAllSelected] = useState(initialParam === "all");
  const [picked, setPicked] = useState<Set<string>>(
    initialParam === "all" ? new Set() : new Set(initialParam.split(",").filter(Boolean)),
  );

  useEffect(() => {
    fetch("/api/collections")
      .then((r) => r.json())
      .then((d) => setCollections(d.collections ?? []));
  }, []);

  // ----- cards -----
  const [items, setItems] = useState<Item[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [direction, setDirection] = useState<number>(DIRECTION_DEFAULT);
  const [saved, setSaved] = useState(0);
  const [skipped, setSkipped] = useState(0);

  // drag state
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [leaving, setLeaving] = useState<null | "save" | "skip">(null);
  const startX = useRef<number | null>(null);
  const lastX = useRef(0);
  const lastT = useRef(0);
  const velocity = useRef(0);

  const startRefresh = useCallback(() => {
    const query = allSelected ? "all" : Array.from(picked).join(",");
    if (!allSelected && picked.size === 0) return;
    setItems(null);
    setPhase("cards");
    fetch(`/api/closet/refresh?collections=${encodeURIComponent(query)}`)
      .then((r) => r.json())
      .then((d) => setItems(d.items));
  }, [allSelected, picked]);

  const current = items?.[idx];
  useEffect(() => {
    if (current) setDirection(current.currentDirection ?? DIRECTION_DEFAULT);
  }, [current]);

  const advance = useCallback(() => {
    setDragX(0);
    setLeaving(null);
    setIdx((i) => i + 1);
  }, []);

  const commit = useCallback(
    async (mode: "save" | "skip") => {
      if (!current || leaving) return;
      setLeaving(mode);
      const body =
        mode === "save"
          ? { itemId: current.id, direction, reason: "refresh" }
          : { itemId: current.id, skip: true };
      fetch("/api/closet/refresh", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      }).catch(() => {});
      if (mode === "save") setSaved((n) => n + 1);
      else setSkipped((n) => n + 1);
      setTimeout(advance, 300);
    },
    [current, direction, advance, leaving],
  );

  // Keyboard shortcuts (cards phase only)
  useEffect(() => {
    if (phase !== "cards") return;
    function onKey(e: KeyboardEvent) {
      if (!current || leaving) return;
      if (e.key === "ArrowRight") commit("save");
      else if (e.key === "ArrowLeft") commit("skip");
      else if (e.key >= "1" && e.key <= "5") setDirection(DIRECTION_OPTIONS[Number(e.key) - 1].value);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, current, leaving, commit]);

  // Pointer drag with velocity tracking
  function onPointerDown(e: React.PointerEvent) {
    startX.current = e.clientX;
    lastX.current = e.clientX;
    lastT.current = performance.now();
    velocity.current = 0;
    setDragging(true);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (startX.current == null) return;
    const now = performance.now();
    const dt = now - lastT.current;
    if (dt > 0) velocity.current = (e.clientX - lastX.current) / dt;
    lastX.current = e.clientX;
    lastT.current = now;
    setDragX(e.clientX - startX.current);
  }
  function onPointerUp() {
    if (startX.current == null) return;
    const dx = dragX;
    const v = velocity.current;
    startX.current = null;
    setDragging(false);
    const flickRight = dx > 40 && v > COMMIT_VELOCITY;
    const flickLeft = dx < -40 && v < -COMMIT_VELOCITY;
    if (dx > COMMIT_DIST || flickRight) commit("save");
    else if (dx < -COMMIT_DIST || flickLeft) commit("skip");
    else setDragX(0); // snap back (spring transition kicks in since not dragging)
  }

  // ---------- PICK phase ----------
  if (phase === "pick") {
    const totalAll = (collections ?? []).reduce((n, c) => n + c.itemCount, 0);
    const pickedCount = allSelected
      ? totalAll
      : (collections ?? [])
          .filter((c) => picked.has(c.id))
          .reduce((n, c) => n + c.itemCount, 0);
    const canStart = allSelected || picked.size > 0;

    return (
      <main className="flex-1 bg-paper">
        <div className="mx-auto max-w-md px-4 sm:px-6 py-10">
          <div className="mb-4 flex items-center justify-between text-sm">
            <Link href="/closet" className="text-ink-faint hover:text-brand">← Closet</Link>
          </div>
          <h1 className="text-2xl font-bold text-ink">Fit refresh</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Pick what to re-rate. As your body changes, clothes fit differently —
            a quick refresh keeps your recommendations honest.
          </p>

          {collections === null ? (
            <p className="mt-8 text-sm text-ink-faint">Loading…</p>
          ) : (
            <>
              <div className="mt-6 space-y-2">
                {/* All */}
                <button
                  onClick={() => { setAllSelected(true); setPicked(new Set()); }}
                  className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-all ${
                    allSelected ? "border-brand bg-brand-tint ring-1 ring-brand/30" : "border-neutral-200 bg-white hover:border-neutral-300"
                  }`}
                >
                  <span className="font-medium text-ink">Everything</span>
                  <span className="text-xs text-ink-faint">{totalAll} items</span>
                </button>

                {collections.filter((c) => c.itemCount > 0).map((c) => {
                  const on = !allSelected && picked.has(c.id);
                  return (
                    <button
                      key={c.id}
                      onClick={() => {
                        setAllSelected(false);
                        setPicked((prev) => {
                          const next = new Set(prev);
                          if (next.has(c.id)) next.delete(c.id);
                          else next.add(c.id);
                          return next;
                        });
                      }}
                      className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-all ${
                        on ? "border-brand bg-brand-tint ring-1 ring-brand/30" : "border-neutral-200 bg-white hover:border-neutral-300"
                      }`}
                    >
                      <span className="flex items-center gap-2 font-medium text-ink">
                        <span className={`flex h-4 w-4 items-center justify-center rounded border text-[10px] ${on ? "border-brand bg-brand text-white" : "border-neutral-300"}`}>
                          {on ? "✓" : ""}
                        </span>
                        {c.name}
                      </span>
                      <span className="text-xs text-ink-faint">{c.itemCount} items</span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6">
                <Button onClick={startRefresh} disabled={!canStart} className="w-full">
                  {canStart ? `Start refresh · ${pickedCount} item${pickedCount === 1 ? "" : "s"}` : "Pick something to refresh"}
                </Button>
              </div>
            </>
          )}
        </div>
      </main>
    );
  }

  // ---------- CARDS phase ----------
  if (!items) {
    return <main className="flex-1"><div className="mx-auto max-w-md px-4 sm:px-6 py-14 text-ink-faint">Loading…</div></main>;
  }

  if (items.length === 0) {
    return (
      <main className="flex-1">
        <div className="mx-auto max-w-md px-4 sm:px-6 py-14">
          <EmptyState
            title="Nothing to refresh"
            body="No clothes in the selection you picked. Add some to your closet, or choose another collection."
            action={<Button variant="secondary" onClick={() => setPhase("pick")}>← Change selection</Button>}
          />
        </div>
      </main>
    );
  }

  const done = idx >= items.length;
  // Drag progress 0..1 used to animate the next card rising to meet you.
  const progress = Math.min(1, Math.abs(dragX) / COMMIT_DIST);

  return (
    <FitScaleProvider>
    <main className="flex-1 bg-paper">
      <div className="mx-auto max-w-md px-4 sm:px-6 py-8">
        {/* Progress */}
        <div className="mb-4 flex items-center justify-between text-sm">
          <button onClick={() => setPhase("pick")} className="text-ink-faint hover:text-brand">← Change selection</button>
          <span className="text-ink-soft">
            {Math.min(idx + (done ? 0 : 1), items.length)} / {items.length}
          </span>
        </div>
        <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-neutral-200">
          <div className="h-full rounded-full bg-brand" style={{ width: `${(idx / items.length) * 100}%`, transition: `width 0.4s ${SPRING}` }} />
        </div>

        {done ? (
          <Card className="text-center animate-fade-in-up">
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
            {/* Card stack */}
            <div className="relative h-[360px] select-none">
              {/* peek of next card — rises + scales toward the top as you drag */}
              {items[idx + 1] && (
                <div
                  className="absolute inset-x-0 top-0 h-full rounded-2xl bg-white shadow-card ring-1 ring-neutral-200"
                  style={{
                    transform: `translateY(${16 - progress * 16}px) scale(${0.94 + progress * 0.06})`,
                    opacity: 0.55 + progress * 0.45,
                    transition: dragging ? "none" : `transform 0.3s ${SPRING}, opacity 0.3s ${SPRING}`,
                  }}
                />
              )}
              <div
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                className="absolute inset-0 cursor-grab touch-none rounded-2xl bg-white p-6 shadow-lift ring-1 ring-neutral-200 active:cursor-grabbing"
                style={{
                  transform: leaving
                    ? `translate(${leaving === "save" ? 640 : -640}px, ${-40 - Math.abs(velocity.current) * 40}px) rotate(${leaving === "save" ? 20 : -20}deg)`
                    : `translateX(${dragX}px) rotate(${dragX / 28}deg)`,
                  opacity: leaving ? 0 : 1,
                  transition: dragging ? "none" : `transform 0.32s ${SPRING}, opacity 0.32s ease-out`,
                }}
              >
                {/* swipe hint overlays */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-6">
                  <span
                    className="rounded-lg border-2 border-neutral-400 px-2 py-1 text-sm font-bold uppercase text-neutral-400"
                    style={{ opacity: dragX < -20 ? progress : 0, transform: `scale(${0.8 + (dragX < 0 ? progress : 0) * 0.4})` }}
                  >Skip</span>
                  <span
                    className="rounded-lg border-2 border-green-500 px-2 py-1 text-sm font-bold uppercase text-green-600"
                    style={{ opacity: dragX > 20 ? progress : 0, transform: `scale(${0.8 + (dragX > 0 ? progress : 0) * 0.4})` }}
                  >Save</span>
                </div>

                <p className="text-xs uppercase tracking-widest text-ink-faint">{current!.collectionName}</p>
                <div className="mt-4 flex items-center gap-3">
                  <GarmentThumb item={current!} />
                  <div className="min-w-0">
                    <h2 className="truncate text-xl font-semibold text-ink">{current!.brand}</h2>
                    <p className="text-sm text-ink-soft">
                      {garmentLabel(current!.category)} · size {current!.size}
                      {current!.color ? ` · ${current!.color}` : ""}
                    </p>
                  </div>
                </div>

                <div className="mt-8" onPointerDown={(e) => e.stopPropagation()}>
                  <p className="text-sm font-medium text-ink">How does it sit now?</p>
                  <div className="mt-3">
                    <FitDirectionInput value={direction} onChange={setDirection} />
                  </div>
                  {current!.currentDirection != null && direction !== current!.currentDirection && (
                    <p className="mt-2 text-xs text-brand">
                      Changed from {nearestOption(current!.currentDirection).label.toLowerCase()} →{" "}
                      {nearestOption(direction).label.toLowerCase()}
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
              Swipe or flick the card, use the buttons, or press ← / → · number keys 1-5 pick tight → loose
            </p>
          </>
        )}
      </div>
    </main>
    </FitScaleProvider>
  );
}

// Placeholder garment thumbnail (color swatch + type glyph). A real product
// image / web lookup can slot in here later without changing the card layout.
function GarmentThumb({ item }: { item: Item }) {
  const hex = colorHex(item.color);
  const glyph = garmentGlyph(item.category);
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
    <Suspense fallback={<div className="mx-auto max-w-md px-4 sm:px-6 py-14">Loading…</div>}>
      <RefreshInner />
    </Suspense>
  );
}
