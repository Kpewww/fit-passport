"use client";

// Shared badge + avatar visuals, used on the passport, home, community, and
// public views. Kept dumb (presentational) — earning logic lives in badges.ts.

import { useRef, useState, type ReactNode } from "react";
import { badgeById, METAL_STYLE, type EarnedBadge, type Metal } from "@/lib/badges";
import { BadgeMedallion } from "@/components/BadgeMedallion";

// Interactive 3D tilt — the medallion follows the cursor in 3D with a moving
// gloss, so a badge can be "turned" and viewed like a real struck coin. Pure
// CSS 3D transforms (no libraries); reverts smoothly on leave.
export function Badge3D({ children, size }: { children: ReactNode; size: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [t, setT] = useState({ rx: 0, ry: 0, active: false });

  function onMove(e: React.PointerEvent) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    setT({ rx: -py * 24, ry: px * 24, active: true });
  }
  function reset() {
    setT({ rx: 0, ry: 0, active: false });
  }

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={reset}
      style={{ perspective: 520, width: size, height: size }}
      className="flex-shrink-0"
    >
      <div
        style={{
          transform: `rotateX(${t.rx}deg) rotateY(${t.ry}deg)`,
          transformStyle: "preserve-3d",
          transition: t.active ? "transform 60ms linear" : "transform 450ms cubic-bezier(0.16,1,0.3,1)",
        }}
        className="relative h-full w-full"
      >
        {children}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle at ${50 + t.ry * 2}% ${50 - t.rx * 2}%, rgba(255,255,255,0.55), transparent 55%)`,
            opacity: t.active ? 0.55 : 0,
            transition: "opacity 300ms ease",
            mixBlendMode: "overlay",
          }}
        />
      </div>
    </div>
  );
}

// Round avatar that shows an uploaded portrait or falls back to initials.
export function Avatar({
  src,
  initials,
  size = 40,
  ring = true,
}: {
  src?: string | null;
  initials: string;
  size?: number;
  ring?: boolean;
}) {
  return (
    <div
      className={`flex flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-tint font-semibold text-brand ${
        ring ? "ring-2 ring-white shadow-card" : ""
      }`}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}

// A circular badge "seal" — now a premium SVG medallion. `id` selects the
// engraved icon; `glyph` is accepted for backward-compat but no longer used.
export function BadgeSeal({
  id,
  metal,
  size = 44,
  locked = false,
  title,
}: {
  id?: string;
  metal: Metal;
  glyph?: string;
  size?: number;
  locked?: boolean;
  title?: string;
}) {
  return (
    <div className="flex flex-shrink-0 items-center justify-center" title={title}>
      <BadgeMedallion id={id ?? "starter"} metal={metal} size={size} locked={locked} title={title} />
    </div>
  );
}

// A horizontal badge chip (seal + title + tier).
export function BadgeChip({ badge }: { badge: EarnedBadge }) {
  const st = METAL_STYLE[badge.metal];
  return (
    <div
      className={`flex items-center gap-2 rounded-xl border px-2.5 py-1.5 ${
        badge.earnedNow ? "border-neutral-200 bg-white" : "border-dashed border-neutral-200 bg-neutral-50 opacity-70"
      }`}
    >
      <BadgeSeal id={badge.id} metal={badge.metal} size={34} locked={badge.locked} />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-ink">{badge.title}</p>
        <p className="text-[10px] uppercase tracking-wide text-ink-faint">{st.label}</p>
      </div>
    </div>
  );
}

// Render a row of pinned badge seals from their IDs (for compact display).
export function PinnedSeals({ ids, size = 34 }: { ids: string[]; size?: number }) {
  const badges = ids.map(badgeById).filter(Boolean) as NonNullable<ReturnType<typeof badgeById>>[];
  if (badges.length === 0) return null;
  return (
    <div className="flex gap-1.5">
      {badges.map((b) => (
        <BadgeSeal key={b.id} id={b.id} metal={b.metal} size={size} title={`${b.title} · ${METAL_STYLE[b.metal].label}`} />
      ))}
    </div>
  );
}

// Metal → a small chip style for the tooltip's tier label.
const METAL_CHIP: Record<Metal, string> = {
  bronze: "bg-amber-100 text-amber-800",
  silver: "bg-slate-100 text-slate-700",
  gold: "bg-yellow-100 text-yellow-800",
  obsidian: "bg-neutral-800 text-neutral-100",
  diamond: "bg-sky-100 text-sky-800",
  jade: "bg-emerald-100 text-emerald-800",
};

// A seal that reveals a styled tooltip (title · metal · what it means · lore) on
// hover — used on the passport so a holder can read what each medallion means.
// Tooltip is anchored below-left so it stays inside `overflow-hidden` cards.
export function BadgeHoverSeal({ id, size = 48 }: { id: string; size?: number }) {
  const b = badgeById(id);
  if (!b) return null;
  const st = METAL_STYLE[b.metal];
  return (
    <div className="group/badge relative">
      <div className="transition-transform duration-200 group-hover/badge:-translate-y-0.5">
        <BadgeSeal id={b.id} metal={b.metal} size={size} />
      </div>
      <div className="pointer-events-none absolute left-0 top-full z-30 mt-2 hidden w-60 rounded-xl border border-neutral-200 bg-white p-3 text-left shadow-lift group-hover/badge:block">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-ink">{b.title}</span>
          <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${METAL_CHIP[b.metal]}`}>
            {st.label}
          </span>
        </div>
        <p className="mt-1 text-xs leading-snug text-ink-soft">{b.blurb}</p>
        <p className="mt-1.5 border-t border-neutral-100 pt-1.5 text-[11px] italic leading-snug text-ink-faint">{b.lore}</p>
      </div>
    </div>
  );
}

// A row of earned badges with hover tooltips. Pinned IDs are shown first.
export function EarnedSealRow({
  earnedIds,
  pinnedIds = [],
  size = 48,
}: {
  earnedIds: string[];
  pinnedIds?: string[];
  size?: number;
}) {
  const ordered = [
    ...pinnedIds.filter((id) => earnedIds.includes(id)),
    ...earnedIds.filter((id) => !pinnedIds.includes(id)),
  ];
  if (ordered.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {ordered.map((id) => (
        <BadgeHoverSeal key={id} id={id} size={size} />
      ))}
    </div>
  );
}
