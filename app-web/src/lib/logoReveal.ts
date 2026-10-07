// Timing, routes and path helpers for the mark's reveal
// (components/AnimatedFitPassportLogo.tsx) — Sessions 89 and 90. Kept free of React
// so they can be tested on their own.
//
// Session 90: the mark is drawn by TWO threads at its own weight (logoCenterline.ts):
// A, the small p, enters from the top-left; B, the big P, from the bottom-right. Each
// thread is one route — a lead-in from off the mark, then its pieces and connectors —
// driven by ONE progress value (distance along the route), so it never jumps between
// pieces: the founder's "no break near the end".

import { CENTERLINE, CONNECTORS } from "./logoCenterline";

export type Variant = "hero" | "quick" | "intro";

type Timing = {
  /** Thin exploring lines (0 = none). */
  explore: number;
  /** Each thread's [delay, duration] along its whole route, lead-in included. */
  threadA: [number, number];
  threadB: [number, number];
  /** The connectors fade, so the mark's real gaps appear. */
  gaps: number;
  crossfade: number;
  settle: number;
};

/** Seconds. Hero and intro: threads done at 2.15 s, then 0.15 + 0.15 + 0.15 = 2.6 s. */
export const REVEAL_TIMING: Record<Variant, Timing> = {
  hero: { explore: 0.95, threadA: [0.1, 1.45], threadB: [0.3, 1.85], gaps: 0.15, crossfade: 0.15, settle: 0.15 },
  intro: { explore: 1.2, threadA: [0.1, 1.45], threadB: [0.3, 1.85], gaps: 0.15, crossfade: 0.15, settle: 0.15 },
  quick: { explore: 0, threadA: [0, 0.55], threadB: [0, 0.6], gaps: 0.1, crossfade: 0.1, settle: 0.1 },
};

/** When both threads have finished drawing. */
export function threadsEnd(variant: Variant): number {
  const t = REVEAL_TIMING[variant];
  return Math.max(t.threadA[0] + t.threadA[1], t.threadB[0] + t.threadB[1]);
}

export function revealDuration(variant: Variant): number {
  const t = REVEAL_TIMING[variant];
  return threadsEnd(variant) + t.gaps + t.crossfade + t.settle;
}

// ---- path helpers ----

type Pt = [number, number];

/** The points of an "M x y C … C …" path: start, then (c1, c2, end) per segment. */
function cubicPoints(d: string): Pt[] {
  const n = (d.match(/-?\d*\.?\d+(?:e-?\d+)?/gi) ?? []).map(Number);
  const pts: Pt[] = [];
  for (let i = 0; i < n.length; i += 2) pts.push([n[i], n[i + 1]]);
  return pts;
}

/**
 * A path of "M x y C … C …" segments, run backwards.
 */
export function reverseCubic(d: string): string {
  const pts = cubicPoints(d);
  const segs = (pts.length - 1) / 3;
  let out = `M${pts[pts.length - 1][0]} ${pts[pts.length - 1][1]}`;
  for (let s = segs - 1; s >= 0; s--) {
    const [c1, c2, start] = [pts[1 + s * 3], pts[2 + s * 3], pts[s * 3]];
    out += `C${c2[0]} ${c2[1]} ${c1[0]} ${c1[1]} ${start[0]} ${start[1]}`;
  }
  return out;
}

/** Length of an "M … C …" path, by sampling each cubic (24 steps — well under 0.1%). */
export function cubicLength(d: string): number {
  const pts = cubicPoints(d);
  let len = 0;
  for (let s = 0; s + 3 < pts.length; s += 3) {
    const [p0, p1, p2, p3] = [pts[s], pts[s + 1], pts[s + 2], pts[s + 3]];
    let prev = p0;
    for (let i = 1; i <= 24; i++) {
      const t = i / 24, u = 1 - t;
      const q: Pt = [
        u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
        u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
      ];
      len += Math.hypot(q[0] - prev[0], q[1] - prev[1]);
      prev = q;
    }
  }
  return len;
}

/** Where a path starts, and the direction it sets off in. */
export function startOf(d: string): { at: Pt; dir: Pt } {
  const [p0, c1] = cubicPoints(d);
  const l = Math.hypot(c1[0] - p0[0], c1[1] - p0[1]) || 1;
  return { at: p0, dir: [(c1[0] - p0[0]) / l, (c1[1] - p0[1]) / l] };
}

/** A smooth curve through the points (Catmull-Rom, as cubic Béziers). */
export function spline(points: Pt[]): string {
  const r = (v: number) => Math.round(v * 10) / 10;
  let d = `M${r(points[0][0])} ${r(points[0][1])}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)], p1 = points[i], p2 = points[i + 1], p3 = points[Math.min(points.length - 1, i + 2)];
    d += `C${r(p1[0] + (p2[0] - p0[0]) / 6)} ${r(p1[1] + (p2[1] - p0[1]) / 6)} ${r(p2[0] - (p3[0] - p1[0]) / 6)} ${r(p2[1] - (p3[1] - p1[1]) / 6)} ${r(p2[0])} ${r(p2[1])}`;
  }
  return d;
}

/**
 * A lead-in through `waypoints` that arrives at `to` heading the way the thread then
 * sets off — the last waypoint before it is placed back along that direction, so the
 * thread runs on into the mark without a kink.
 */
export function leadIn(waypoints: Pt[], to: { at: Pt; dir: Pt }, approach = 110): string {
  const before: Pt = [to.at[0] - to.dir[0] * approach, to.at[1] - to.dir[1] * approach];
  return spline([...waypoints, before, to.at]);
}

// ---- the two threads ----

export type Piece = { d: string; length: number; connector: boolean };
export type Thread = { leadIn: Piece; pieces: Piece[]; length: number; window: number };

const piece = (d: string, connector = false): Piece => ({ d, length: cubicLength(d), connector });

/**
 * The lead-ins' waypoints, in the mark's units. A arrives from off the top-left and B
 * from off the bottom-right (the founder's route). The intro's start further out, so
 * at full-screen size they come in from the edges of the screen.
 */
const LEAD_A: Record<Variant, Pt[]> = {
  hero: [[-470, -300], [-340, -240], [-210, -160]],
  intro: [[-1100, -700], [-780, -460], [-500, -360], [-260, -210]],
  quick: [[-120, -70]],
};
const LEAD_B: Record<Variant, Pt[]> = {
  // Up the right side and over, then down into the tip along the way the loop sets
  // off — arriving from below would fold back on itself at the tip.
  hero: [[950, 820], [900, 520], [800, 270], [680, 130], [570, 140]],
  intro: [[1700, 1250], [1350, 900], [1100, 520], [880, 220], [700, 110], [570, 140]],
  quick: [[600, 120]],
};
/** How much of a lead-in shows at once: the thread slides in, tail following. */
const WINDOW: Record<Variant, number> = { hero: 340, intro: 620, quick: 160 };

export function threads(variant: Variant): { a: Thread; b: Thread } {
  const make = (lead: string, pieces: Piece[]): Thread => {
    const leadPiece = piece(lead);
    return { leadIn: leadPiece, pieces, length: leadPiece.length + pieces.reduce((s, p) => s + p.length, 0), window: WINDOW[variant] };
  };
  return {
    a: make(leadIn(LEAD_A[variant], startOf(CENTERLINE.entryBar)), [
      piece(CENTERLINE.entryBar),
      piece(CONNECTORS.notch, true),
      piece(CENTERLINE.innerCurl),
    ]),
    b: make(leadIn(LEAD_B[variant], startOf(CENTERLINE.lowerLoop)), [
      piece(CENTERLINE.lowerLoop),
      piece(CONNECTORS.crossing, true),
      piece(CENTERLINE.spineUp),
    ]),
  };
}
