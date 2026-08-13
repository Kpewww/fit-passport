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

/** SVG path for a silhouette. Null for "circle" (kept perfectly round at 26px). */
function shapePath(shape: BadgeShape, c: number, r: number): string | null {
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
          <feDropShadow dx="0" dy={size * 0.03} stdDeviation={size * (0.028 + finish * 0.006)} floodOpacity={0.45} />
        </filter>
        {/* Bevelled rim: lit from the top-left, so the edge itself has a lip. */}
        <linearGradient id={`bevel-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={p.light} />
          <stop offset="45%" stopColor={p.mid} />
          <stop offset="100%" stopColor={p.rim} />
        </linearGradient>
        {/* Inner shading: the wall of the medal casts into the field, bottom-right. */}
        <linearGradient id={`inner-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={p.rim} stopOpacity="0" />
          <stop offset="55%" stopColor={p.rim} stopOpacity="0.1" />
          <stop offset="100%" stopColor={p.rim} stopOpacity="0.55" />
        </linearGradient>
        {/* The raised collar around the recessed field — a terrace, not a line. */}
        <linearGradient id={`collar-${uid}`} x1="0.15" y1="0" x2="0.85" y2="1">
          <stop offset="0%" stopColor={p.light} />
          <stop offset="50%" stopColor={p.mid} />
          <stop offset="100%" stopColor={p.dark} />
        </linearGradient>
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
        {/* fluted edge only reads on a round seal */}
        {shape === "circle" && notchEls}
        {/* medal body — silhouette depends on the badge's shape */}
        {bodyPath ? (
          <path d={bodyPath} fill={`url(#body-${uid})`} stroke={`url(#bevel-${uid})`} strokeWidth={size * 0.035} strokeLinejoin="round" />
        ) : (
          <circle cx={c} cy={c} r={rOuter} fill={`url(#body-${uid})`} stroke={`url(#bevel-${uid})`} strokeWidth={size * 0.035} />
        )}
      </g>

      {/* Inner wall shading — the field sits BELOW the rim, so the rim shades it. */}
      {shape === "circle" ? (
        <circle cx={c} cy={c} r={rOuter - size * 0.03} fill="none" stroke={`url(#inner-${uid})`} strokeWidth={size * 0.07} />
      ) : (
        <path d={shapePath(shape, c, rOuter - size * 0.03) ?? ""} fill="none" stroke={`url(#inner-${uid})`} strokeWidth={size * 0.07} strokeLinejoin="round" />
      )}

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

      {/* engraved rings (more with finish) — inset copy of the silhouette */}
      {shape === "circle" ? (
        <circle cx={c} cy={c} r={rOuter - size * 0.055} fill="none" stroke={p.light} strokeOpacity={0.45} strokeWidth={size * 0.01} />
      ) : (
        <path d={shapePath(shape, c, rOuter - size * 0.055) ?? ""} fill="none" stroke={p.light} strokeOpacity={0.45} strokeWidth={size * 0.01} strokeLinejoin="round" />
      )}
      {finish >= 2 && <circle cx={c} cy={c} r={rOuter - size * 0.085} fill="none" stroke={p.rim} strokeOpacity={0.35} strokeWidth={size * 0.008} />}
      {guilloche}

      {/* Raised collar → recessed field → engraved motif: three stepped levels,
          which is what makes the medal read as struck rather than printed. */}
      <circle cx={c} cy={c} r={rDisc + size * 0.075} fill={`url(#collar-${uid})`} />
      <circle cx={c} cy={c} r={rDisc + size * 0.075} fill="none" stroke={p.light} strokeOpacity={0.35} strokeWidth={size * 0.008} />
      {/* the shadow the collar throws down into the field */}
      <circle cx={c} cy={c} r={rDisc + size * 0.028} fill={p.rim} opacity={0.55} />
      <circle cx={c} cy={c} r={rDisc} fill={`url(#disc-${uid})`} />
      <circle cx={c} cy={c} r={rDisc} fill="none" stroke={`url(#inner-${uid})`} strokeWidth={size * 0.045} />
      {finish >= 3 && <circle cx={c} cy={c} r={rDisc - size * 0.02} fill="none" stroke={p.light} strokeOpacity={0.25} strokeWidth={size * 0.006} />}

      {/* Embossed motif: a light lip up-left, a cast shadow down-right, then the
          face on top. Three passes for the price of one path — it's what turns a
          flat icon into raised metal. */}
      <g transform={`translate(${-size * 0.012} ${-size * 0.012})`} opacity={0.55}>
        <Motif motif={motif} color={p.light} size={size} />
      </g>
      <g transform={`translate(${size * 0.014} ${size * 0.014})`} opacity={0.45}>
        <Motif motif={motif} color={p.rim} size={size} />
      </g>
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
