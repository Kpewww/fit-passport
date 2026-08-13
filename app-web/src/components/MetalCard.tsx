"use client";

// The metal card — one solid slab in the spirit of a metal charge card.
//
// Shared by the passport (full card) and the community directory (banner strip),
// so a member's colour reads the same everywhere. Its colour comes from the metal
// the holder CHOSE (validated server-side to be one they earned), else their
// highest earned metal, else the default lapis.
//
// Surface: deep two-stop metal gradient · brushed micro-grain · broad diagonal
// sheen · a quick, infrequent glint sweep · agate striations on the top metals.
// On pointer it tilts slightly in 3D (limited, so text stays readable).

import { useRef, useState, type ReactNode } from "react";

export type CardTheme = {
  key: string;
  label: string;
  from: string;
  via: string;
  to: string;
  sheen: string;
  text: string;
  veined?: boolean;
};

export const CARD_THEMES: Record<string, CardTheme> = {
  lapis: { key: "lapis", label: "Lapis Edition", from: "#0f1a52", via: "#2438d6", to: "#0a0f2e", sheen: "rgba(190,205,255,0.9)", text: "#eef1ff" },
  bronze: { key: "bronze", label: "Bronze Edition", from: "#3a220e", via: "#b57838", to: "#2a1809", sheen: "rgba(255,224,186,0.9)", text: "#fdf1e2" },
  silver: { key: "silver", label: "Silver Edition", from: "#5f6872", via: "#c2cad3", to: "#454c55", sheen: "rgba(255,255,255,0.95)", text: "#12161b" },
  gold: { key: "gold", label: "Gold Edition", from: "#5c4406", via: "#e6b23d", to: "#3d2c04", sheen: "rgba(255,246,200,0.95)", text: "#221903" },
  titanium: { key: "titanium", label: "Titanium Edition", from: "#332e3a", via: "#8b8194", to: "#25212b", sheen: "rgba(233,225,242,0.85)", text: "#f4f1f8" },
  diamond: { key: "diamond", label: "Diamond Edition", from: "#0e5b73", via: "#c4ecf6", to: "#0b465a", sheen: "rgba(255,255,255,0.98)", text: "#06303d", veined: true },
  obsidian: { key: "obsidian", label: "Obsidian Edition", from: "#101216", via: "#2a2e35", to: "#000000", sheen: "rgba(200,210,225,0.75)", text: "#eef0f4", veined: true },
  amethyst: { key: "amethyst", label: "Amethyst Edition", from: "#2c1553", via: "#8b5cd6", to: "#1d0e38", sheen: "rgba(232,214,251,0.92)", text: "#f6efff", veined: true },
  jade: { key: "jade", label: "Jade Edition", from: "#0b3d23", via: "#43b972", to: "#072b18", sheen: "rgba(211,246,222,0.92)", text: "#f0fff6", veined: true },
  amber: { key: "amber", label: "Amber Edition", from: "#4d2607", via: "#e8912f", to: "#331803", sheen: "rgba(255,225,168,0.95)", text: "#2b1504" },
};

/** Resolve which theme to render: explicit choice → highest earned → lapis. */
export function resolveTheme(chosen?: string | null, highest?: string | null): CardTheme {
  return (
    (chosen && CARD_THEMES[chosen]) ||
    (highest && CARD_THEMES[highest]) ||
    CARD_THEMES.lapis
  );
}

/** The metal surface layers, reused by the full card and the banner strip. */
export function MetalSurface({ theme, radius = 22 }: { theme: CardTheme; radius?: number }) {
  return (
    <>
      {/* brushed-metal micro-grain */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.14] mix-blend-overlay"
        style={{
          backgroundImage:
            "repeating-linear-gradient(115deg, rgba(255,255,255,0.55) 0px, rgba(255,255,255,0) 2px, rgba(0,0,0,0.35) 3px, rgba(0,0,0,0) 5px)",
        }}
      />
      {/* agate-style striations for the top metals */}
      {theme.veined && (
        <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-40" preserveAspectRatio="none" viewBox="0 0 100 60">
          <path d="M-2,14 C18,7 30,22 52,15 C72,9 86,20 102,12" fill="none" stroke="#fff" strokeOpacity="0.7" strokeWidth="0.7" />
          <path d="M-2,34 C20,27 28,42 50,36 C70,30 84,43 102,34" fill="none" stroke="#fff" strokeOpacity="0.45" strokeWidth="0.4" />
          <path d="M-2,48 C22,44 34,55 56,49 C74,44 88,53 102,47" fill="none" stroke="#fff" strokeOpacity="0.3" strokeWidth="0.35" />
        </svg>
      )}
      {/* broad diagonal sheen (static) */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: `linear-gradient(125deg, transparent 22%, ${theme.sheen} 47%, transparent 68%)`, opacity: 0.12 }}
      />
      {/* glint: a measured sweep, then a long pause (see `glint` keyframes).
          The band is deliberately wide (~24%) with soft shoulders so it reads as
          a broad reflection travelling across metal, not a thin laser line. */}
      <div className="pointer-events-none absolute inset-0 animate-glint bg-[linear-gradient(110deg,transparent_38%,rgba(255,255,255,0.10)_44%,rgba(255,255,255,0.17)_50%,rgba(255,255,255,0.10)_56%,transparent_62%)]" />
      {/* inner hairline bevel */}
      <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/20" style={{ borderRadius: radius }} />
    </>
  );
}

/**
 * The full card. `tiltable` adds a limited 3D turn that follows the pointer —
 * enough to feel like a physical object, small enough to keep text legible.
 */
export function MetalCard({
  theme,
  children,
  tiltable = true,
  className = "",
}: {
  theme: CardTheme;
  children: ReactNode;
  tiltable?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [t, setT] = useState({ rx: 0, ry: 0, active: false });

  function onMove(e: React.PointerEvent) {
    if (!tiltable) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    // Limited range — a card, not a spinning coin.
    setT({ rx: -py * 7, ry: px * 9, active: true });
  }

  return (
    <div style={{ perspective: 1200 }} className={className}>
      <div
        ref={ref}
        onPointerMove={onMove}
        onPointerLeave={() => setT({ rx: 0, ry: 0, active: false })}
        className="relative overflow-hidden rounded-[22px] p-7 shadow-lift sm:p-9"
        style={{
          background: `linear-gradient(140deg, ${theme.from} 0%, ${theme.via} 52%, ${theme.to} 100%)`,
          color: theme.text,
          transform: `rotateX(${t.rx}deg) rotateY(${t.ry}deg)`,
          transformStyle: "preserve-3d",
          transition: t.active ? "transform 200ms ease-out" : "transform 700ms cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        <MetalSurface theme={theme} />
        {/* pointer-tracked soft highlight, so the tilt reads as light on metal */}
        {tiltable && (
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: `radial-gradient(60% 60% at ${50 + t.ry * 3}% ${50 - t.rx * 3}%, rgba(255,255,255,0.30), transparent 70%)`,
              opacity: t.active ? 1 : 0,
              transition: "opacity 500ms ease",
              mixBlendMode: "soft-light",
            }}
          />
        )}
        <div className="relative">{children}</div>
      </div>
    </div>
  );
}

/** A quiet label/value pair rendered on the metal slab. */
export function CardField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-[8px] uppercase tracking-[0.24em] opacity-55">{label}</p>
      <p className={`mt-1 truncate text-sm ${mono ? "font-mono tracking-tight" : "font-medium"}`}>{value}</p>
    </div>
  );
}
