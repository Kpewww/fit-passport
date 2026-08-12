"use client";

// BadgeMedallion — a premium, escalating medal rendered entirely in SVG.
//
// The FINISH ladder (0..5) is the point: low tiers look like a plain struck coin
// with a faint sheen; higher tiers gain deeper relief, an engraved guilloché
// field, a double bevel, richer specular light, and — at the very top — a laurel
// wreath that overflows the rim. Restraint is deliberate: refined, not gaudy.
//
// Each badge also has a `motif` — a small culturally-grounded line engraving
// (Roman fibula, wax tablet, tailor's shears, imperial crown…), passed from the
// badge definition so the art carries meaning, not just decoration.

import { badgeById, VEINED_METALS, type Metal } from "@/lib/badges";

// Irregular agate/marble veins, authored in a 0..1 unit box and scaled to the
// medal. Only the top metals get them (see VEINED_METALS) — like the white
// striations in real agate or a diamond's inclusions.
const VEINS = [
  "M0.06,0.34 C0.26,0.22 0.38,0.46 0.56,0.36 C0.72,0.27 0.84,0.42 0.97,0.31",
  "M0.02,0.62 C0.22,0.54 0.31,0.72 0.5,0.66 C0.68,0.60 0.8,0.74 0.98,0.64",
  "M0.18,0.05 C0.28,0.28 0.16,0.44 0.3,0.66 C0.4,0.83 0.34,0.92 0.42,0.99",
  "M0.72,0.03 C0.66,0.24 0.8,0.4 0.7,0.6 C0.62,0.77 0.72,0.9 0.66,0.99",
];

/** Scale a unit-box vein path (0..1) to the medal's pixel size. */
function scaleVein(d: string, size: number): string {
  return d.replace(/-?\d*\.?\d+/g, (n) => (parseFloat(n) * size).toFixed(2));
}

export const PALETTE: Record<Metal, { light: string; mid: string; dark: string; rim: string; ink: string; glow: string }> = {
  bronze:   { light: "#e7b98a", mid: "#b57838", dark: "#6f421c", rim: "#502f13", ink: "#3d2410", glow: "#f4d3a8" },
  silver:   { light: "#ffffff", mid: "#c2cad3", dark: "#828d99", rim: "#5f6872", ink: "#333a42", glow: "#eef2f6" },
  gold:     { light: "#fff1a8", mid: "#e6b23d", dark: "#a9770a", rim: "#7c5c08", ink: "#5c4406", glow: "#fff6c8" },
  platinum: { light: "#ffffff", mid: "#dfe3e8", dark: "#a4adb8", rim: "#7c848f", ink: "#3a4149", glow: "#f6f8fb" },
  diamond:  { light: "#ffffff", mid: "#c4ecf6", dark: "#79bcd6", rim: "#3f93b7", ink: "#0e5b73", glow: "#e9fbff" },
  obsidian: { light: "#7b828c", mid: "#2a2e35", dark: "#0a0b0e", rim: "#000000", ink: "#e9ebef", glow: "#9aa2ad" },
  amethyst: { light: "#e8d6fb", mid: "#8b5cd6", dark: "#4d2a8e", rim: "#361c66", ink: "#f2e9ff", glow: "#dcc7f8" },
  jade:     { light: "#d3f6de", mid: "#43b972", dark: "#187041", rim: "#0e5230", ink: "#0b3d23", glow: "#c9f3d7" },
  amber:    { light: "#ffe1a8", mid: "#e8912f", dark: "#a55611", rim: "#7a3d0b", ink: "#4d2607", glow: "#ffdca0" },
};

// ---- Motif engravings (drawn in a 24×24 box, centered) ----
function Motif({ motif, color, size }: { motif: string; color: string; size: number }) {
  const s = { fill: "none", stroke: color, strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const M: Record<string, React.ReactNode> = {
    hanger: <><path d="M12 5.2a1.5 1.5 0 1 1 1.1 2.5c-.8.1-1.1.6-1.1 1.3" {...s} /><path d="M4.5 15.5 12 10l7.5 5.5" {...s} /><path d="M4.5 15.5h15" {...s} /></>,
    shelves: <><rect x="5" y="6" width="14" height="4" rx="1" {...s} /><rect x="5" y="12" width="14" height="4" rx="1" {...s} /><path d="M8 6v-.5M16 12v-.5" {...s} /></>,
    archive: <><rect x="4.5" y="5" width="15" height="14" rx="1.5" {...s} /><path d="M4.5 12h15" {...s} /><path d="M10 8.4h4M10 15.4h4" {...s} /></>,
    tablet: <><rect x="6" y="4.5" width="12" height="15" rx="1.2" {...s} /><path d="M9 9h6M9 12h6M9 15h3" {...s} /></>,
    gnomon: <><path d="M5 18h14" {...s} /><path d="M7 18 15 7" {...s} /><path d="M7 18l8 0" {...s} opacity={0} /><path d="M9.5 18a5.5 5.5 0 0 1 3-4.8" {...s} /></>,
    "compass-rose": <><circle cx="12" cy="12" r="7" {...s} /><path d="M12 5v14M5 12h14" {...s} /><path d="M12 5l1.6 5.4L19 12l-5.4 1.6L12 19l-1.6-5.4L5 12l5.4-1.6z" {...s} /></>,
    needle: <><path d="M5 19 17 7" {...s} /><path d="M15.5 5.5a2 2 0 0 1 3 3L17 10l-3-3z" {...s} /><circle cx="16.2" cy="7.8" r="0.7" fill={color} stroke="none" /></>,
    shears: <><circle cx="7" cy="7" r="2.1" {...s} /><circle cx="7" cy="17" r="2.1" {...s} /><path d="M8.8 8.5 19 17M8.8 15.5 19 7" {...s} /></>,
    loom: <><rect x="5" y="5" width="14" height="14" rx="1" {...s} /><path d="M8 5v14M12 5v14M16 5v14" {...s} opacity={0.9} /><path d="M5 10h14M5 14h14" {...s} /></>,
    gem: <><path d="M6 9.5h12l-6 9.5z" {...s} /><path d="M6 9.5 8.5 6h7L18 9.5" {...s} /><path d="M9 9.5 12 19l3-9.5" {...s} /></>,
    obelisk: <><path d="M10.5 19h3l-.6-13h-1.8z" {...s} /><path d="M11.4 6 12 3l.6 3" {...s} /><path d="M9 19h6" {...s} /></>,
    crown: <><path d="M4.5 17 6 7l3.5 3.5L12 5l2.5 5.5L18 7l1.5 10z" {...s} /><path d="M4.5 17h15" {...s} /><circle cx="6" cy="7" r="0.8" fill={color} stroke="none" /><circle cx="12" cy="5" r="0.9" fill={color} stroke="none" /><circle cx="18" cy="7" r="0.8" fill={color} stroke="none" /></>,
  };
  const box = size * 0.46;
  const off = (size - box) / 2;
  return (
    <svg x={off} y={off} width={box} height={box} viewBox="0 0 24 24">
      {M[motif] ?? <circle cx="12" cy="12" r="6" {...s} />}
    </svg>
  );
}

export function BadgeMedallion({
  id,
  metal,
  size = 48,
  locked = false,
  title,
  finish: finishProp,
  motif: motifProp,
}: {
  id: string;
  metal: Metal;
  size?: number;
  locked?: boolean;
  title?: string;
  finish?: number;
  motif?: string;
}) {
  const def = badgeById(id);
  const finish = finishProp ?? def?.finish ?? 0;
  const motif = motifProp ?? def?.motif ?? "gem";
  const p = PALETTE[metal];
  const veined = VEINED_METALS.includes(metal);
  const uid = `${id}-${metal}`;
  const c = size / 2;
  const rOuter = size * 0.44;
  const rDisc = size * 0.31;
  const iconColor = p.ink;

  // Fluted edge — denser + longer notches at higher finishes.
  const notches = 24 + finish * 6;
  const notchLen = size * (0.012 + finish * 0.003);
  const notchEls = Array.from({ length: notches }, (_, i) => {
    const a = (i / notches) * Math.PI * 2;
    const r1 = rOuter - size * 0.015;
    const r2 = rOuter + notchLen;
    return (
      <line key={i}
        x1={c + Math.cos(a) * r1} y1={c + Math.sin(a) * r1}
        x2={c + Math.cos(a) * r2} y2={c + Math.sin(a) * r2}
        stroke={p.rim} strokeWidth={size * 0.018} strokeLinecap="round" opacity={0.5} />
    );
  });

  // Guilloché engraving ring — appears from finish ≥ 3 (subtle radial ticks).
  const guilloche = finish >= 3 ? Array.from({ length: 48 }, (_, i) => {
    const a = (i / 48) * Math.PI * 2;
    const r1 = rDisc + size * 0.03;
    const r2 = rOuter - size * 0.07;
    return (
      <line key={`g${i}`}
        x1={c + Math.cos(a) * r1} y1={c + Math.sin(a) * r1}
        x2={c + Math.cos(a) * r2} y2={c + Math.sin(a) * r2}
        stroke={p.light} strokeOpacity={0.18} strokeWidth={size * 0.006} />
    );
  }) : null;

  // Laurel wreath overflowing the rim — only the top finishes (5), tasteful.
  const laurel = finish >= 5 ? <Laurel c={c} r={rOuter} size={size} color={p.mid} light={p.light} /> : null;
  // Small radial star points around the rim for finish 4 (restrained).
  const points = finish === 4 ? Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
    const rr = rOuter + size * 0.03;
    return <circle key={`p${i}`} cx={c + Math.cos(a) * rr} cy={c + Math.sin(a) * rr} r={size * 0.012} fill={p.mid} opacity={0.7} />;
  }) : null;

  return (
    <svg width={size} height={size * (finish >= 5 ? 1.12 : 1)} viewBox={`0 0 ${size} ${size * (finish >= 5 ? 1.12 : 1)}`}
      className={locked ? "grayscale" : ""} style={{ opacity: locked ? 0.5 : 1, overflow: "visible" }}
      role="img" aria-label={title}>
      <defs>
        <radialGradient id={`body-${uid}`} cx="38%" cy="30%" r="75%">
          <stop offset="0%" stopColor={p.light} />
          <stop offset="42%" stopColor={p.mid} />
          <stop offset="100%" stopColor={p.dark} />
        </radialGradient>
        <radialGradient id={`disc-${uid}`} cx="50%" cy="66%" r="72%">
          <stop offset="0%" stopColor={p.mid} />
          <stop offset="100%" stopColor={p.dark} />
        </radialGradient>
        <linearGradient id={`gloss-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity={0.5 + finish * 0.06} />
          <stop offset="55%" stopColor="#fff" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <filter id={`sh-${uid}`} x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy={size * 0.02} stdDeviation={size * (0.02 + finish * 0.006)} floodOpacity={0.35} />
        </filter>
        {finish >= 4 && (
          <radialGradient id={`halo-${uid}`} cx="50%" cy="50%" r="50%">
            <stop offset="60%" stopColor={p.glow} stopOpacity="0" />
            <stop offset="100%" stopColor={p.glow} stopOpacity="0.5" />
          </radialGradient>
        )}
        {veined && (
          <clipPath id={`veinclip-${uid}`}>
            <circle cx={c} cy={c} r={rOuter - size * 0.02} />
          </clipPath>
        )}
      </defs>

      {/* soft halo for high tiers */}
      {finish >= 4 && <circle cx={c} cy={c} r={rOuter + size * 0.06} fill={`url(#halo-${uid})`} />}

      {laurel}
      {points}

      <g filter={`url(#sh-${uid})`}>
        {notchEls}
        {/* medal body */}
        <circle cx={c} cy={c} r={rOuter} fill={`url(#body-${uid})`} stroke={p.rim} strokeWidth={size * 0.02} />
      </g>

      {/* agate/marble white veining — the top metals (diamond and above) */}
      {veined && (
        <g clipPath={`url(#veinclip-${uid})`} opacity={0.55}>
          {VEINS.map((d, i) => (
            <path
              key={`v${i}`}
              d={scaleVein(d, size)}
              fill="none"
              stroke="#ffffff"
              strokeOpacity={i % 2 ? 0.5 : 0.85}
              strokeWidth={size * (i % 2 ? 0.012 : 0.022)}
              strokeLinecap="round"
            />
          ))}
        </g>
      )}

      {/* engraved rings (more with finish) */}
      <circle cx={c} cy={c} r={rOuter - size * 0.055} fill="none" stroke={p.light} strokeOpacity={0.45} strokeWidth={size * 0.01} />
      {finish >= 2 && <circle cx={c} cy={c} r={rOuter - size * 0.085} fill="none" stroke={p.rim} strokeOpacity={0.35} strokeWidth={size * 0.008} />}
      {guilloche}

      {/* recessed inner disc + bevel */}
      <circle cx={c} cy={c} r={rDisc + size * 0.03} fill={p.rim} opacity={0.5} />
      <circle cx={c} cy={c} r={rDisc} fill={`url(#disc-${uid})`} stroke={p.light} strokeOpacity={0.4} strokeWidth={size * 0.01} />
      {finish >= 3 && <circle cx={c} cy={c} r={rDisc - size * 0.02} fill="none" stroke={p.light} strokeOpacity={0.25} strokeWidth={size * 0.006} />}

      <Motif motif={motif} color={iconColor} size={size} />

      {/* specular gloss */}
      <path d={`M ${c - rOuter * 0.82} ${c} A ${rOuter * 0.82} ${rOuter * 0.82} 0 0 1 ${c + rOuter * 0.82} ${c} Z`}
        fill={`url(#gloss-${uid})`} />

      {locked && (
        <g>
          <circle cx={size * 0.8} cy={size * 0.8} r={size * 0.15} fill="#fff" stroke={p.rim} strokeWidth="1" />
          <text x={size * 0.8} y={size * 0.84} textAnchor="middle" fontSize={size * 0.16}>🔒</text>
        </g>
      )}
    </svg>
  );
}

// A restrained laurel wreath hugging the lower rim, overflowing slightly.
function Laurel({ c, r, size, color, light }: { c: number; r: number; size: number; color: string; light: string }) {
  const leaves = (side: 1 | -1) =>
    Array.from({ length: 6 }, (_, i) => {
      const t = 0.12 + i * 0.11; // fraction along the arc from bottom upward
      const a = Math.PI / 2 + side * t * Math.PI; // start at bottom, sweep up
      const rr = r + size * 0.02;
      const x = c + Math.cos(a) * rr;
      const y = c + Math.sin(a) * rr;
      const rot = (a * 180) / Math.PI + (side === 1 ? -90 : 90);
      const w = size * 0.05 * (1 - i * 0.09);
      const h = size * 0.11 * (1 - i * 0.06);
      return (
        <g key={`${side}-${i}`} transform={`translate(${x} ${y}) rotate(${rot})`}>
          <ellipse cx={0} cy={0} rx={w} ry={h} fill={color} stroke={light} strokeOpacity={0.4} strokeWidth={size * 0.006} />
        </g>
      );
    });
  return <g opacity={0.92}>{leaves(1)}{leaves(-1)}</g>;
}
