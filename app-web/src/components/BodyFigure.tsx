"use client";

// BodyFigure — a simple, neutral silhouette that widens/narrows by volume band.
// Purely illustrative (not a body scan). One abstract figure, parameterized so
// the torso width tracks the derived VolumeBand; shape tweaks the waist taper.
// Kept genderless and faceless on purpose.

import type { TorsoShape, VolumeBand } from "@/lib/bodyType";

// Torso half-widths (px) per band, at shoulder and waist. Larger = wider.
const BAND: Record<VolumeBand | "unknown", { shoulder: number; waist: number }> = {
  petite: { shoulder: 14, waist: 10 },
  lean: { shoulder: 16, waist: 11 },
  average: { shoulder: 19, waist: 14 },
  solid: { shoulder: 22, waist: 18 },
  broad: { shoulder: 25, waist: 22 },
  extended: { shoulder: 28, waist: 27 },
  unknown: { shoulder: 18, waist: 14 },
};

export function BodyFigure({
  volume,
  shape,
  size = 120,
}: {
  volume: VolumeBand | "unknown";
  shape?: TorsoShape;
  size?: number;
}) {
  const base = BAND[volume];
  // Shape nudges the waist relative to the shoulder.
  let waist = base.waist;
  if (shape === "tapered") waist = Math.max(8, base.waist - 3);
  else if (shape === "full-waist") waist = base.waist + 3;

  const cx = 50;
  const shoulderY = 34;
  const waistY = 70;
  const hipY = 82;
  const sh = base.shoulder;
  const hip = shape === "full-waist" ? waist + 1 : waist - 1;

  // Torso as a smooth path from shoulders → waist → hips.
  const torso = [
    `M ${cx - sh} ${shoulderY}`,
    `C ${cx - sh} ${shoulderY + 8}, ${cx - waist} ${waistY - 8}, ${cx - waist} ${waistY}`,
    `C ${cx - waist} ${waistY + 4}, ${cx - hip} ${hipY - 2}, ${cx - hip} ${hipY}`,
    `L ${cx + hip} ${hipY}`,
    `C ${cx + hip} ${hipY - 2}, ${cx + waist} ${waistY + 4}, ${cx + waist} ${waistY}`,
    `C ${cx + waist} ${waistY - 8}, ${cx + sh} ${shoulderY + 8}, ${cx + sh} ${shoulderY}`,
    "Z",
  ].join(" ");

  return (
    <svg viewBox="0 0 100 110" width={size} height={size * 1.1} aria-hidden>
      {/* head */}
      <circle cx={cx} cy={20} r={10} className="fill-brand/15 stroke-brand/40" strokeWidth={1.5} />
      {/* neck */}
      <rect x={cx - 4} y={28} width={8} height={7} className="fill-brand/15 stroke-brand/40" strokeWidth={1.5} />
      {/* torso */}
      <path d={torso} className="fill-brand/20 stroke-brand/50" strokeWidth={1.8} strokeLinejoin="round" />
      {/* legs */}
      <rect x={cx - hip} y={hipY} width={hip - 1} height={22} rx={4} className="fill-brand/15 stroke-brand/40" strokeWidth={1.5} />
      <rect x={cx + 1} y={hipY} width={hip - 1} height={22} rx={4} className="fill-brand/15 stroke-brand/40" strokeWidth={1.5} />
    </svg>
  );
}
