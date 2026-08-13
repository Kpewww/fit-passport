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

export type BadgeShape = "circle" | "shield" | "hexagon" | "rosette" | "quatrefoil";

type Pt = [number, number];
/** One outline step: a straight line, or a quadratic curve with a control point. */
type Seg = { to: Pt; ctrl?: Pt };
type Outline = { start: Pt; segs: Seg[] };

/**
 * THE single definition of every badge silhouette, as a start point plus line /
 * quadratic segments.
 *
 * Two consumers read this: `shapePath()` renders it as an SVG path for the 2D
 * art, and `shapePolygon()` flattens it to points so the WebGL view can extrude
 * the SAME outline. Defining it once is the point — a badge that's a shield in
 * SVG and a plain disc in 3D would look like two different awards.
 */
function outline(shape: BadgeShape, c: number, r: number): Outline | null {
  const at = (ang: number, rad: number): Pt => [c + Math.cos(ang) * rad, c + Math.sin(ang) * rad];

  if (shape === "circle") return null; // drawn as a real <circle> / cylinder

  if (shape === "hexagon") {
    // Flat-top hexagon — reads as engineered/crafted.
    const pts = Array.from({ length: 6 }, (_, i) => at((i / 6) * Math.PI * 2 - Math.PI / 2, r));
    return { start: pts[0], segs: pts.slice(1).map((to) => ({ to })) };
  }

  if (shape === "shield") {
    // Heraldic shield: straight shoulders, curved flanks, a point at the base.
    const top = c - r * 0.92;
    const side = r * 0.86;
    const bottom = c + r * 0.98;
    return {
      start: [c - side, top],
      segs: [
        { to: [c + side, top] },
        { to: [c + side, c + r * 0.18] },
        { ctrl: [c + side, c + r * 0.72], to: [c, bottom] },
        { ctrl: [c - side, c + r * 0.72], to: [c - side, c + r * 0.18] },
      ],
    };
  }

  if (shape === "quatrefoil") {
    // Four-lobed guild mark for the counsel track: lobes on the diagonals so it
    // still reads as a seal at 26px, with deep valleys on the axes to keep it
    // clearly distinct from the 12-lobe rosette.
    const valley = r * 0.6;
    const ctrl = r * 1.14;
    const step = (Math.PI * 2) / 4;
    const segs: Seg[] = [];
    for (let i = 0; i < 4; i++) {
      const v0 = -Math.PI / 2 + i * step;
      const tip = v0 + step / 2;
      const v1 = v0 + step;
      segs.push({ ctrl: at(tip - 0.38, ctrl), to: at(tip, r) });
      segs.push({ ctrl: at(tip + 0.38, ctrl), to: at(v1, valley) });
    }
    return { start: at(-Math.PI / 2, valley), segs };
  }

  // rosette — a scalloped medal edge for the rare honors
  const lobes = 12;
  const inner = r * 0.86;
  const pts = Array.from({ length: lobes * 2 }, (_, i) =>
    at((i / (lobes * 2)) * Math.PI * 2 - Math.PI / 2, i % 2 === 0 ? r : inner),
  );
  return { start: pts[0], segs: pts.slice(1).map((to) => ({ to })) };
}

/**
 * SVG path for a silhouette. Null for "circle" (kept perfectly round at 26px).
 * Exported because BadgeCoin clips its edge stack and back face to the SAME
 * outline — a circular edge behind a shield is exactly what made these look like
 * stickers sitting on a disc.
 */
export function shapePath(shape: BadgeShape, c: number, r: number): string | null {
  const o = outline(shape, c, r);
  if (!o) return null;
  const n = (v: number) => v.toFixed(2);
  let d = `M ${n(o.start[0])} ${n(o.start[1])}`;
  for (const s of o.segs) {
    d += s.ctrl
      ? ` Q ${n(s.ctrl[0])} ${n(s.ctrl[1])} ${n(s.to[0])} ${n(s.to[1])}`
      : ` L ${n(s.to[0])} ${n(s.to[1])}`;
  }
  return `${d} Z`;
}

/**
 * The same silhouette flattened to a polygon, for extruding in 3D. Curves are
 * sampled; `steps` per curve is plenty at inspect size. Returns null for
 * "circle" so the caller can use a true cylinder instead of a many-sided prism.
 */
export function shapePolygon(
  shape: BadgeShape,
  c: number,
  r: number,
  steps = 14,
): Pt[] | null {
  const o = outline(shape, c, r);
  if (!o) return null;
  const pts: Pt[] = [o.start];
  let from = o.start;
  for (const s of o.segs) {
    if (!s.ctrl) {
      pts.push(s.to);
    } else {
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const u = 1 - t;
        pts.push([
          u * u * from[0] + 2 * u * t * s.ctrl[0] + t * t * s.to[0],
          u * u * from[1] + 2 * u * t * s.ctrl[1] + t * t * s.to[1],
        ]);
      }
    }
    from = s.to;
  }
  return pts;
}

/**
 * Metals with a brushed (anisotropic) grain. Titanium gets it because that grain
 * is what titanium actually looks like, and because it puts more daylight between
 * it and the smooth bright silver two rungs down the ladder.
 */
export const BRUSHED_METALS: Metal[] = ["titanium"];

export const PALETTE: Record<Metal, { light: string; mid: string; dark: string; rim: string; ink: string; glow: string }> = {
  bronze:   { light: "#e7b98a", mid: "#b57838", dark: "#6f421c", rim: "#502f13", ink: "#3d2410", glow: "#f4d3a8" },
  silver:   { light: "#ffffff", mid: "#c2cad3", dark: "#828d99", rim: "#5f6872", ink: "#333a42", glow: "#eef2f6" },
  gold:     { light: "#fff1a8", mid: "#e6b23d", dark: "#a9770a", rim: "#7c5c08", ink: "#5c4406", glow: "#fff6c8" },
  // Titanium: mid-dark and violet-warm on purpose, so it can never be mistaken
  // for the bright cool silver two rungs below it. Brushed grain adds identity.
  titanium: { light: "#c6bcd1", mid: "#6f6675", dark: "#3b3542", rim: "#241f29", ink: "#f2edf7", glow: "#c9c0d2" },
  diamond:  { light: "#ffffff", mid: "#c4ecf6", dark: "#79bcd6", rim: "#3f93b7", ink: "#0e5b73", glow: "#e9fbff" },
  obsidian: { light: "#7b828c", mid: "#2a2e35", dark: "#0a0b0e", rim: "#000000", ink: "#e9ebef", glow: "#9aa2ad" },
  amethyst: { light: "#e8d6fb", mid: "#8b5cd6", dark: "#4d2a8e", rim: "#361c66", ink: "#f2e9ff", glow: "#dcc7f8" },
  jade:     { light: "#d3f6de", mid: "#43b972", dark: "#187041", rim: "#0e5230", ink: "#0b3d23", glow: "#c9f3d7" },
  amber:    { light: "#ffe1a8", mid: "#e8912f", dark: "#a55611", rim: "#7a3d0b", ink: "#4d2607", glow: "#ffdca0" },
};

// ---- Motif engravings (drawn in a 24×24 box, centered) ----
function Motif({ motif, color, size, weight = 1.8 }: { motif: string; color: string; size: number; weight?: number }) {
  const s = { fill: "none", stroke: color, strokeWidth: weight, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
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
    // ---- The Counsel track ----
    thimble: <><path d="M8.6 10.5a3.4 3.4 0 0 1 6.8 0v5.9a1.6 1.6 0 0 1-1.6 1.6h-3.6a1.6 1.6 0 0 1-1.6-1.6z" {...s} /><path d="M10.3 10.4h3.4M10.3 12.3h3.4" {...s} opacity={0.75} /></>,
    tape: <><circle cx="10.2" cy="13.4" r="4.4" {...s} /><circle cx="10.2" cy="13.4" r="1.2" {...s} /><path d="M13.9 11 19.2 7.2" {...s} /><path d="M15.4 9.6v1.7M17.2 8.3V10" {...s} /></>,
    "guild-mark": <><path d="M12 4.2v15.4" {...s} /><path d="M7.2 9.6 12 4.6l4.8 5" {...s} /><circle cx="12" cy="15.2" r="3.1" {...s} /></>,
    fibula: <><path d="M5.8 14.6a6.2 6.2 0 0 1 12.4 0" {...s} /><path d="M5.8 14.6 18 17.1" {...s} /><circle cx="5.8" cy="14.6" r="1.3" {...s} /><path d="M18.2 14.6v3.2" {...s} /></>,
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
  const brushed = BRUSHED_METALS.includes(metal);
  const uid = `${id}-${metal}`;
  const c = size / 2;
  const rOuter = size * 0.44;
  const rDisc = size * 0.31;
  const iconColor = p.ink;
  // Silhouette per track, the way dedicated badge designers frame a rank:
  // a seal for the record, a shield for guardianship, a hex for craft, a
  // rosette for the rare honors. The inner disc stays round for the motif.
  const shape = def?.shape ?? "circle";
  const bodyPath = shapePath(shape, c, rOuter);

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
        {/* ONE light direction for everything below: top-left. Every highlight,
            terminator, cast shadow and occlusion band is derived from it. Relief
            reads as relief only when the lighting agrees with itself. */}
        <clipPath id={`bodyclip-${uid}`}>
          {bodyPath ? <path d={bodyPath} /> : <circle cx={c} cy={c} r={rOuter} />}
        </clipPath>

        {/* Convex dome: the medal's face bulges toward the viewer. */}
        <radialGradient id={`dome-${uid}`} cx="33%" cy="27%" r="82%">
          <stop offset="0%" stopColor={p.light} />
          <stop offset="26%" stopColor={p.mid} />
          <stop offset="78%" stopColor={p.dark} />
          <stop offset="100%" stopColor={p.rim} />
        </radialGradient>

        {/* Bevelled rim: a torus lit at the top-left, dark at the bottom-right. */}
        <linearGradient id={`bevel-${uid}`} x1="0.1" y1="0" x2="0.9" y2="1">
          <stop offset="0%" stopColor={p.light} />
          <stop offset="38%" stopColor={p.mid} />
          <stop offset="100%" stopColor={p.rim} />
        </linearGradient>

        {/* Terminator: the shaded band hugging the away-from-light edge. */}
        <radialGradient id={`term-${uid}`} cx="68%" cy="74%" r="88%">
          <stop offset="0%" stopColor={p.rim} stopOpacity="0" />
          <stop offset="46%" stopColor={p.rim} stopOpacity="0" />
          <stop offset="100%" stopColor={p.rim} stopOpacity="0.5" />
        </radialGradient>

        {/* Rim light: a thin catch of light on the top-left edge only. */}
        <linearGradient id={`rimlight-${uid}`} x1="0.05" y1="0" x2="0.85" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="32%" stopColor="#ffffff" stopOpacity="0.16" />
          <stop offset="60%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>

        {/* Dome highlight — an offset elliptical hotspot, the single strongest cue
            that a surface is curved rather than printed. */}
        <radialGradient id={`speck-${uid}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity={0.42 + finish * 0.05} />
          <stop offset="55%" stopColor="#ffffff" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>

        {/* The RECESSED field is lit the OTHER way round — dark where the light
            comes from, because the wall in front of it casts into it. That
            inversion is what says "sunken" rather than "raised". */}
        <linearGradient id={`field-${uid}`} x1="0.15" y1="0.05" x2="0.9" y2="1">
          <stop offset="0%" stopColor={p.rim} />
          <stop offset="52%" stopColor={p.dark} />
          <stop offset="100%" stopColor={p.mid} />
        </linearGradient>

        {/* Occlusion the collar throws down into the field: strongest on the
            light side, fading away from it. */}
        <linearGradient id={`occl-${uid}`} x1="0.1" y1="0" x2="0.9" y2="1">
          <stop offset="0%" stopColor={p.rim} stopOpacity="0.85" />
          <stop offset="55%" stopColor={p.rim} stopOpacity="0.3" />
          <stop offset="100%" stopColor={p.rim} stopOpacity="0.05" />
        </linearGradient>

        {/* The raised collar around the field — a terrace, not a line. */}
        <linearGradient id={`collar-${uid}`} x1="0.15" y1="0" x2="0.85" y2="1">
          <stop offset="0%" stopColor={p.light} />
          <stop offset="46%" stopColor={p.mid} />
          <stop offset="100%" stopColor={p.dark} />
        </linearGradient>

        {/* Cast shadow onto the page. */}
        <filter id={`sh-${uid}`} x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx={size * 0.012} dy={size * 0.036} stdDeviation={size * (0.03 + finish * 0.006)} floodOpacity={0.5} />
        </filter>

        {brushed && (
          <pattern id={`brush-${uid}`} width={size * 0.07} height={size * 0.07}
            patternUnits="userSpaceOnUse" patternTransform="rotate(28)">
            <rect width={size * 0.07} height={size * 0.07} fill="none" />
            <rect width={size * 0.014} height={size * 0.07} fill="#ffffff" opacity="0.09" />
            <rect x={size * 0.032} width={size * 0.01} height={size * 0.07} fill="#000000" opacity="0.14" />
          </pattern>
        )}

        {finish >= 4 && (
          <radialGradient id={`halo-${uid}`} cx="50%" cy="50%" r="50%">
            <stop offset="60%" stopColor={p.glow} stopOpacity="0" />
            <stop offset="100%" stopColor={p.glow} stopOpacity="0.5" />
          </radialGradient>
        )}
      </defs>

      {/* soft halo for high tiers */}
      {finish >= 4 && <circle cx={c} cy={c} r={rOuter + size * 0.06} fill={`url(#halo-${uid})`} />}

      {laurel}
      {points}

      <g filter={`url(#sh-${uid})`}>
        {/* fluted edge only reads on a round seal */}
        {shape === "circle" && notchEls}
        {/* medal body — silhouette depends on the badge's shape */}
        {bodyPath ? (
          <path d={bodyPath} fill={`url(#dome-${uid})`} strokeLinejoin="round" />
        ) : (
          <circle cx={c} cy={c} r={rOuter} fill={`url(#dome-${uid})`} />
        )}
      </g>

      {/* Everything that shades the FACE is clipped to the silhouette, so a
          shield is shaded like a shield instead of like the circle it isn't. */}
      <g clipPath={`url(#bodyclip-${uid})`}>
        {brushed && <rect x="0" y="0" width={size} height={size * 1.2} fill={`url(#brush-${uid})`} />}

        {/* agate/marble white veining — the top metals (diamond and above) */}
        {veined && (
          <g opacity={0.55}>
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

        {/* shaded side, then the curved hotspot */}
        <rect x="0" y="0" width={size} height={size * 1.2} fill={`url(#term-${uid})`} />
        <ellipse
          cx={c - rOuter * 0.3}
          cy={c - rOuter * 0.38}
          rx={rOuter * 0.62}
          ry={rOuter * 0.34}
          transform={`rotate(-34 ${c - rOuter * 0.3} ${c - rOuter * 0.38})`}
          fill={`url(#speck-${uid})`}
        />
      </g>

      {/* Rim: a bevelled wall, then a catch of light along its top-left only. */}
      {bodyPath ? (
        <>
          <path d={bodyPath} fill="none" stroke={`url(#bevel-${uid})`} strokeWidth={size * 0.055} strokeLinejoin="round" />
          <path d={shapePath(shape, c, rOuter - size * 0.028) ?? ""} fill="none" stroke={`url(#rimlight-${uid})`} strokeWidth={size * 0.016} strokeLinejoin="round" />
        </>
      ) : (
        <>
          <circle cx={c} cy={c} r={rOuter} fill="none" stroke={`url(#bevel-${uid})`} strokeWidth={size * 0.055} />
          <circle cx={c} cy={c} r={rOuter - size * 0.028} fill="none" stroke={`url(#rimlight-${uid})`} strokeWidth={size * 0.016} />
        </>
      )}

      {/* engraved rings (more with finish) — inset copy of the silhouette */}
      {shape === "circle" ? (
        <circle cx={c} cy={c} r={rOuter - size * 0.075} fill="none" stroke={p.light} strokeOpacity={0.32} strokeWidth={size * 0.009} />
      ) : (
        <path d={shapePath(shape, c, rOuter - size * 0.075) ?? ""} fill="none" stroke={p.light} strokeOpacity={0.32} strokeWidth={size * 0.009} strokeLinejoin="round" />
      )}
      {finish >= 2 && <circle cx={c} cy={c} r={rOuter - size * 0.1} fill="none" stroke={p.rim} strokeOpacity={0.4} strokeWidth={size * 0.008} />}
      {guilloche}

      {/* Raised collar → occlusion → recessed field → engraved motif. Four
          stepped levels, each with its own light and shadow edge: that stack is
          what makes the medal read as STRUCK rather than drawn. */}
      <circle cx={c} cy={c} r={rDisc + size * 0.085} fill={`url(#collar-${uid})`} />
      <circle cx={c} cy={c} r={rDisc + size * 0.085} fill="none" stroke={`url(#rimlight-${uid})`} strokeWidth={size * 0.014} />
      <circle cx={c} cy={c} r={rDisc + size * 0.032} fill={`url(#field-${uid})`} />
      <circle cx={c} cy={c} r={rDisc + size * 0.016} fill="none" stroke={`url(#occl-${uid})`} strokeWidth={size * 0.048} />
      {finish >= 3 && <circle cx={c} cy={c} r={rDisc - size * 0.03} fill="none" stroke={p.light} strokeOpacity={0.2} strokeWidth={size * 0.006} />}

      {/* Embossed motif: a heavier cast shadow away from the light, a light lip
          toward it, then the face on top. Three passes off one path — that's what
          turns a flat icon into raised metal. */}
      <g transform={`translate(${size * 0.02} ${size * 0.022})`} opacity={0.6}>
        <Motif motif={motif} color={p.rim} size={size} weight={2.9} />
      </g>
      <g transform={`translate(${-size * 0.014} ${-size * 0.016})`} opacity={0.7}>
        <Motif motif={motif} color={p.light} size={size} weight={2} />
      </g>
      <Motif motif={motif} color={iconColor} size={size} />

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
