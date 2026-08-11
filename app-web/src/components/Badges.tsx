"use client";

// Shared badge + avatar visuals, used on the passport, home, community, and
// public views. Kept dumb (presentational) — earning logic lives in badges.ts.

import { badgeById, METAL_STYLE, type EarnedBadge, type Metal } from "@/lib/badges";

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

// A circular badge "seal" — the metal-tiered medallion.
export function BadgeSeal({
  metal,
  glyph,
  size = 44,
  locked = false,
  title,
}: {
  metal: Metal;
  glyph: string;
  size?: number;
  locked?: boolean;
  title?: string;
}) {
  const st = METAL_STYLE[metal];
  return (
    <div
      title={title}
      className={`relative flex flex-shrink-0 items-center justify-center rounded-full ring-2 ${st.ring} ${
        locked ? "bg-neutral-200 grayscale" : st.bg
      }`}
      style={{ width: size, height: size, fontSize: size * 0.45 }}
    >
      <span className={locked ? "opacity-40" : ""}>{glyph}</span>
      {locked && (
        <span className="absolute -bottom-0.5 -right-0.5 rounded-full bg-white px-1 text-[8px]">🔒</span>
      )}
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
      <BadgeSeal metal={badge.metal} glyph={badge.glyph} size={30} locked={badge.locked} />
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
        <BadgeSeal key={b.id} metal={b.metal} glyph={b.glyph} size={size} title={`${b.title} · ${METAL_STYLE[b.metal].label}`} />
      ))}
    </div>
  );
}
