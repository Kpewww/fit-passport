"use client";

// Shared badge + avatar visuals, used on the passport, home, community, help and
// public views. Kept dumb (presentational) — earning logic lives in badges.ts.
//
// Every badge on every screen is the same object: a dimensional struck coin that
// TURNS when you hover it and lifts into the inspect stage when you click it.
// There is deliberately no flat variant — see BadgeCoin.

import { lazy, Suspense, useState } from "react";
import { badgeById, METAL_STYLE, type EarnedBadge, type Metal } from "@/lib/badges";
import { BadgeCoin } from "@/components/BadgeCoin";
import { SafeBoundary } from "@/components/SafeBoundary";

// The inspect stage is only downloaded once someone actually opens one.
const BadgeInspect = lazy(() =>
  import("@/components/BadgeInspect").then((m) => ({ default: m.BadgeInspect })),
);

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

/**
 * A badge seal: a 3D coin you can turn with the cursor and open by clicking.
 *
 * `detail` carries earned/progress state when the caller has it (the badge
 * library, the passport) so the inspect stage can show progress; without it the
 * stage just describes the badge.
 */
export function BadgeSeal({
  id,
  metal,
  size = 44,
  locked = false,
  title,
  detail,
  inspect = true,
}: {
  id?: string;
  metal: Metal;
  glyph?: string;
  size?: number;
  locked?: boolean;
  title?: string;
  detail?: { earnedNow?: boolean; progressText?: string | null };
  /** Set false only where a modal would be wrong (inside another modal). */
  inspect?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const badgeId = id ?? "starter";
  const def = badgeById(badgeId);

  const coin = (
    <BadgeCoin id={badgeId} metal={metal} size={size} locked={locked} title={title} />
  );

  if (!inspect || !def) {
    return (
      <div className="flex flex-shrink-0 items-center justify-center" title={title}>
        {coin}
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        title={title ? `${title} — click to inspect` : "Click to inspect"}
        onClick={(e) => {
          // Seals live inside <Link> cards (community, passport). Without this,
          // inspecting a badge navigates away instead.
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        className="flex flex-shrink-0 items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
      >
        {coin}
      </button>
      {open && (
        <SafeBoundary fallback={<></>}>
          <Suspense fallback={<></>}>
            <BadgeInspect
              badge={{ ...def, earnedNow: detail?.earnedNow ?? !locked, progressText: detail?.progressText ?? null }}
              onClose={() => setOpen(false)}
            />
          </Suspense>
        </SafeBoundary>
      )}
    </>
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
      <BadgeSeal
        id={badge.id}
        metal={badge.metal}
        size={34}
        locked={badge.locked}
        title={badge.title}
        detail={badge}
      />
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
  titanium: "bg-[#efeaf3] text-[#4a4354]",
  diamond: "bg-sky-100 text-sky-800",
  obsidian: "bg-neutral-800 text-neutral-100",
  amethyst: "bg-violet-100 text-violet-800",
  jade: "bg-emerald-100 text-emerald-800",
  amber: "bg-orange-100 text-orange-800",
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
        <BadgeSeal id={b.id} metal={b.metal} size={size} title={b.title} />
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
        <p className="mt-1.5 text-[10px] uppercase tracking-[0.16em] text-ink-faint">Hover to turn · click to inspect</p>
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
