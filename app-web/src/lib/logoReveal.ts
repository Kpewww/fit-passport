// Timing and path helpers for the mark's reveal (components/AnimatedFitPassportLogo.tsx)
// — Session 89. Kept free of React so they can be tested on their own.

type Timing = {
  /** Exploring threads, before the mark begins. */
  explore: number;
  /** One duration per centerline stroke, in drawing order. */
  draw: [number, number, number, number];
  crossfade: number;
  settle: number;
};

/** Seconds. Hero: 1.05 explore + 1.25 draw + 0.15 crossfade + 0.15 settle = 2.6 s. */
export const REVEAL_TIMING: Record<"hero" | "quick", Timing> = {
  hero: { explore: 1.05, draw: [0.5, 0.2, 0.15, 0.4], crossfade: 0.15, settle: 0.15 },
  quick: { explore: 0, draw: [0.28, 0.1, 0.08, 0.22], crossfade: 0.12, settle: 0.1 },
};

export function revealDuration(variant: "hero" | "quick"): number {
  const t = REVEAL_TIMING[variant];
  return t.explore + t.draw.reduce((a, b) => a + b, 0) + t.crossfade + t.settle;
}

/**
 * A path of "M x y C … C …" segments, run backwards. The lower loop is stored from
 * its tip; drawn from the end nearest the stem instead, the descent carries straight
 * on into the loop rather than jumping to the far tip.
 */
export function reverseCubic(d: string): string {
  const n = (d.match(/-?\d*\.?\d+(?:e-?\d+)?/gi) ?? []).map(Number);
  const pts: Array<[number, number]> = [];
  for (let i = 0; i < n.length; i += 2) pts.push([n[i], n[i + 1]]);
  // pts: start, then (c1, c2, end) per segment.
  const segs = (pts.length - 1) / 3;
  let out = `M${pts[pts.length - 1][0]} ${pts[pts.length - 1][1]}`;
  for (let s = segs - 1; s >= 0; s--) {
    const [c1, c2, start] = [pts[1 + s * 3], pts[2 + s * 3], pts[s * 3]];
    out += `C${c2[0]} ${c2[1]} ${c1[0]} ${c1[1]} ${start[0]} ${start[1]}`;
  }
  return out;
}
