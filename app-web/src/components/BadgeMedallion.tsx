"use client";

// BadgeMedallion — a premium, glossy medal rendered entirely in SVG.
//
// Replaces the old "emoji in a flat circle." Each medallion has:
//   • a fluted/notched coin edge (like a struck medal),
//   • a metallic radial sheen per tier (bronze…jade),
//   • a recessed inner disc with a rim bevel,
//   • a specular gloss arc across the top,
//   • a clean custom line-icon per badge (geometric, not emoji).
// Deterministic + dependency-free; scales cleanly at any size.

import type { Metal } from "@/lib/badges";

// Metal palettes: [light, mid, dark, rim] used to build the radial gradients.
const PALETTE: Record<Metal, { light: string; mid: string; dark: string; rim: string; ink: string }> = {
  bronze:   { light: "#f0c088", mid: "#c17e3f", dark: "#7c4a1e", rim: "#5c3414", ink: "#3d2410" },
  silver:   { light: "#ffffff", mid: "#c7ced6", dark: "#8b95a1", rim: "#6b747f", ink: "#3a4048" },
  gold:     { light: "#fff3b0", mid: "#f2c33d", dark: "#b8860b", rim: "#8a6508", ink: "#5c4406" },
  obsidian: { light: "#6b7280", mid: "#2b2f36", dark: "#0c0d10", rim: "#000000", ink: "#e5e7eb" },
  diamond:  { light: "#ffffff", mid: "#bfe9f5", dark: "#7cc3dc", rim: "#4a9cbf", ink: "#0e5b73" },
  jade:     { light: "#c8f5d8", mid: "#4bbf78", dark: "#1f7d4a", rim: "#145c36", ink: "#0b3d23" },
};

// Custom line-icon per badge id (drawn inside the disc). Coordinates are in a
// 24×24 box centered later. Kept simple + iconic.
function BadgeIcon({ id, color, size }: { id: string; color: string; size: number }) {
  const common = {
    fill: "none",
    stroke: color,
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  const paths: Record<string, React.ReactNode> = {
    // hanger — Verified Closet
    starter: <><path d="M12 5.5a1.6 1.6 0 1 1 1.2 2.6c-.8.1-1.2.7-1.2 1.4" {...common} /><path d="M4 16l8-5.4 8 5.4" {...common} /><path d="M4 16h16" {...common} /></>,
    // stacked shelves — Curator
    curator: <><rect x="5" y="6" width="14" height="4" rx="1" {...common} /><rect x="5" y="12" width="14" height="4" rx="1" {...common} /></>,
    // archive drawers — Wardrobe Archivist
    archivist: <><rect x="4" y="5" width="16" height="14" rx="1.5" {...common} /><path d="M4 12h16" {...common} /><path d="M10 8.5h4M10 15.5h4" {...common} /></>,
    // clipboard check — Truth-Teller
    "truth-teller": <><rect x="6" y="5" width="12" height="15" rx="1.5" {...common} /><path d="M9 5V4h6v1" {...common} /><path d="M9 12l2 2 4-4" {...common} /></>,
    // target — Calibrated
    calibrated: <><circle cx="12" cy="12" r="7" {...common} /><circle cx="12" cy="12" r="3" {...common} /><circle cx="12" cy="12" r="0.6" fill={color} stroke="none" /></>,
    // globe — Open Closet
    "public-figure": <><circle cx="12" cy="12" r="7.5" {...common} /><path d="M4.5 12h15M12 4.5c3 3 3 12 0 15M12 4.5c-3 3-3 12 0 15" {...common} /></>,
    // scissors (stylist)
    stylist: <><circle cx="7" cy="7" r="2.2" {...common} /><circle cx="7" cy="17" r="2.2" {...common} /><path d="M9 8.5L19 17M9 15.5L19 7" {...common} /></>,
    // gem — Acclaimed
    acclaimed: <><path d="M6 9h12l-6 10z" {...common} /><path d="M6 9l2.5-3h7L18 9" {...common} /><path d="M9 9l3 10 3-10" {...common} /></>,
    // crown — Head Designer
    "head-designer": <><path d="M4 17l1.5-9 4 4 2.5-6 2.5 6 4-4L20 17z" {...common} /><path d="M4 17h16" {...common} /></>,
  };
  const box = size * 0.5;
  const off = (size - box) / 2;
  return (
    <svg x={off} y={off} width={box} height={box} viewBox="0 0 24 24">
      {paths[id] ?? <circle cx="12" cy="12" r="6" {...common} />}
    </svg>
  );
}

export function BadgeMedallion({
  id,
  metal,
  size = 48,
  locked = false,
  title,
}: {
  id: string;
  metal: Metal;
  size?: number;
  locked?: boolean;
  title?: string;
}) {
  const p = PALETTE[metal];
  const uid = `${id}-${metal}`;
  const c = size / 2;
  const rOuter = size * 0.47;
  const rDisc = size * 0.34;
  const iconColor = p.ink;

  // Fluted edge: a ring of short notches around the rim.
  const notches = 36;
  const notchEls = Array.from({ length: notches }, (_, i) => {
    const a = (i / notches) * Math.PI * 2;
    const r1 = rOuter - size * 0.02;
    const r2 = rOuter + size * 0.012;
    return (
      <line
        key={i}
        x1={c + Math.cos(a) * r1} y1={c + Math.sin(a) * r1}
        x2={c + Math.cos(a) * r2} y2={c + Math.sin(a) * r2}
        stroke={p.rim} strokeWidth={size * 0.02} strokeLinecap="round" opacity={0.55}
      />
    );
  });

  return (
    <svg
      width={size} height={size} viewBox={`0 0 ${size} ${size}`}
      className={locked ? "grayscale" : ""} style={{ opacity: locked ? 0.55 : 1 }}
      role="img" aria-label={title}
    >
      <defs>
        {/* metallic body sheen — off-center radial for a lit look */}
        <radialGradient id={`body-${uid}`} cx="38%" cy="32%" r="72%">
          <stop offset="0%" stopColor={p.light} />
          <stop offset="45%" stopColor={p.mid} />
          <stop offset="100%" stopColor={p.dark} />
        </radialGradient>
        {/* recessed inner disc — slightly darker, light from below for bevel */}
        <radialGradient id={`disc-${uid}`} cx="50%" cy="65%" r="70%">
          <stop offset="0%" stopColor={p.mid} />
          <stop offset="100%" stopColor={p.dark} />
        </radialGradient>
        {/* gloss highlight */}
        <linearGradient id={`gloss-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.75" />
          <stop offset="55%" stopColor="#ffffff" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <filter id={`shadow-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy={size * 0.015} stdDeviation={size * 0.03} floodOpacity="0.35" />
        </filter>
      </defs>

      {/* fluted edge */}
      <g filter={`url(#shadow-${uid})`}>{notchEls}</g>

      {/* medal body */}
      <circle cx={c} cy={c} r={rOuter} fill={`url(#body-${uid})`} stroke={p.rim} strokeWidth={size * 0.02} />
      {/* outer engraved ring */}
      <circle cx={c} cy={c} r={rOuter - size * 0.06} fill="none" stroke={p.light} strokeOpacity="0.5" strokeWidth={size * 0.012} />

      {/* recessed inner disc + rim bevel */}
      <circle cx={c} cy={c} r={rDisc + size * 0.03} fill={p.rim} opacity="0.5" />
      <circle cx={c} cy={c} r={rDisc} fill={`url(#disc-${uid})`} stroke={p.light} strokeOpacity="0.4" strokeWidth={size * 0.01} />

      {/* icon */}
      <BadgeIcon id={id} color={iconColor} size={size} />

      {/* specular gloss over the top half */}
      <path
        d={`M ${c - rOuter * 0.82} ${c} A ${rOuter * 0.82} ${rOuter * 0.82} 0 0 1 ${c + rOuter * 0.82} ${c} Z`}
        fill={`url(#gloss-${uid})`} opacity="0.9"
      />

      {locked && (
        <g>
          <circle cx={size * 0.78} cy={size * 0.78} r={size * 0.16} fill="#fff" stroke={p.rim} strokeWidth="1" />
          <text x={size * 0.78} y={size * 0.82} textAnchor="middle" fontSize={size * 0.18}>🔒</text>
        </g>
      )}
    </svg>
  );
}
