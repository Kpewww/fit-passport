"use client";

// OutfitMannequin — a stylized, deterministic outfit preview.
//
// Founder wanted a "try the outfit on a model" view. Photoreal generation needs
// an external image-gen / virtual-try-on API (Claude can't render images), so
// THIS is the real, free, on-brand version: a layered SVG figure that
//   • morphs by the wearer's body type (reuses the BodyFigure sizing idea), and
//   • paints each garment layer in the outfit's actual colors by category
//     (tops → torso, bottoms → legs, shoes → feet, hat → head, etc).
// Missing layers fall back to a neutral "default" so a single-item outfit still
// looks complete.
//
// A photoreal upgrade can slot in later behind `renderMode="photo"` (see
// generatePhotoPreview scaffold at the bottom) without changing callers.

import type { VolumeBand, TorsoShape } from "@/lib/bodyType";
import { colorHexOr } from "@/lib/colors";

export type OutfitLayer = { category: string; color?: string | null };

const BAND: Record<VolumeBand | "unknown", { shoulder: number; waist: number }> = {
  petite: { shoulder: 15, waist: 11 },
  lean: { shoulder: 17, waist: 12 },
  average: { shoulder: 20, waist: 15 },
  solid: { shoulder: 23, waist: 19 },
  broad: { shoulder: 26, waist: 23 },
  extended: { shoulder: 29, waist: 28 },
  unknown: { shoulder: 20, waist: 15 },
};

const hex = (c: string | null | undefined, fallback: string) => colorHexOr(c, fallback);

// Which body zone a garment category paints.
type Zone = "top" | "bottom" | "shoe" | "head" | "neck" | "none";
function zoneFor(category: string): Zone {
  const c = category.toLowerCase();
  if (["tshirt", "shirt", "polo", "sweater", "hoodie", "jacket"].includes(c)) return "top";
  if (["pants", "jeans", "shorts", "skirt"].includes(c)) return "bottom";
  if (["shoes", "sneakers", "boots"].includes(c)) return "shoe";
  if (["hat"].includes(c)) return "head";
  if (["scarf"].includes(c)) return "neck";
  return "none";
}

const DEFAULTS = {
  top: "#d8d8d8",
  bottom: "#5b6472",
  shoe: "#2a2a2a",
  skin: "#e8c9a8",
};

export function OutfitMannequin({
  layers,
  volume = "average",
  shape = "straight",
  size = 200,
}: {
  layers: OutfitLayer[];
  volume?: VolumeBand | "unknown";
  shape?: TorsoShape;
  size?: number;
}) {
  const b = BAND[volume];
  let waist = b.waist;
  if (shape === "tapered") waist = Math.max(9, b.waist - 3);
  else if (shape === "full-waist") waist = b.waist + 3;

  // Resolve a color per zone from the outfit (last one wins for a zone).
  const byZone: Partial<Record<Zone, string>> = {};
  for (const l of layers) {
    const z = zoneFor(l.category);
    if (z === "none") continue;
    byZone[z] = hex(l.color, zoneDefault(z));
  }
  const topColor = byZone.top ?? DEFAULTS.top;
  const bottomColor = byZone.bottom ?? DEFAULTS.bottom;
  const shoeColor = byZone.shoe ?? DEFAULTS.shoe;
  const hatColor = byZone.head;
  const scarfColor = byZone.neck;

  const cx = 50;
  const sh = b.shoulder;
  const shoulderY = 34, waistY = 62, hipY = 74, hemY = 98;
  const hip = shape === "full-waist" ? waist + 1 : waist - 1;

  // Torso path (shoulders → waist).
  const torso = [
    `M ${cx - sh} ${shoulderY}`,
    `C ${cx - sh} ${shoulderY + 6}, ${cx - waist} ${waistY - 6}, ${cx - waist} ${waistY}`,
    `L ${cx + waist} ${waistY}`,
    `C ${cx + waist} ${waistY - 6}, ${cx + sh} ${shoulderY + 6}, ${cx + sh} ${shoulderY}`,
    "Z",
  ].join(" ");

  return (
    <svg viewBox="0 0 100 120" width={size} height={size * 1.2} aria-hidden>
      {/* head + neck (skin) */}
      <circle cx={cx} cy={18} r={9} fill={DEFAULTS.skin} stroke="#00000018" />
      <rect x={cx - 3.5} y={26} width={7} height={7} fill={DEFAULTS.skin} />
      {/* hat */}
      {hatColor && <path d={`M ${cx - 11} 15 Q ${cx} 2 ${cx + 11} 15 Z`} fill={hatColor} stroke="#00000022" />}
      {/* arms (skin) */}
      <rect x={cx - sh - 3} y={shoulderY} width={5} height={30} rx={2.5} fill={DEFAULTS.skin} />
      <rect x={cx + sh - 2} y={shoulderY} width={5} height={30} rx={2.5} fill={DEFAULTS.skin} />
      {/* legs base (skin) then bottom garment over them */}
      <rect x={cx - hip} y={hipY} width={hip - 1} height={hemY - hipY} rx={3} fill={DEFAULTS.skin} />
      <rect x={cx + 1} y={hipY} width={hip - 1} height={hemY - hipY} rx={3} fill={DEFAULTS.skin} />
      {/* bottom garment (covers hips→hem, sleeves left bare) */}
      <path
        d={`M ${cx - waist} ${waistY} L ${cx + waist} ${waistY} L ${cx + hip} ${hemY - 6} L ${cx + 1.5} ${hemY - 4} L ${cx} ${waistY + 8} L ${cx - 1.5} ${hemY - 4} L ${cx - hip} ${hemY - 6} Z`}
        fill={bottomColor}
        stroke="#00000018"
      />
      {/* shoes */}
      <rect x={cx - hip} y={hemY - 4} width={hip} height={6} rx={2} fill={shoeColor} />
      <rect x={cx} y={hemY - 4} width={hip} height={6} rx={2} fill={shoeColor} />
      {/* top garment (torso) — drawn last so it sits on top */}
      <path d={torso} fill={topColor} stroke="#00000022" strokeLinejoin="round" />
      {/* sleeves over arms (top color) */}
      <rect x={cx - sh - 3} y={shoulderY} width={5} height={16} rx={2.5} fill={topColor} />
      <rect x={cx + sh - 2} y={shoulderY} width={5} height={16} rx={2.5} fill={topColor} />
      {/* scarf */}
      {scarfColor && <rect x={cx - 5} y={31} width={10} height={6} rx={2} fill={scarfColor} />}
    </svg>
  );
}

function zoneDefault(z: Zone): string {
  if (z === "top") return DEFAULTS.top;
  if (z === "bottom") return DEFAULTS.bottom;
  if (z === "shoe") return DEFAULTS.shoe;
  return "#cccccc";
}

// ---- Photoreal scaffold (not wired) ----
// A future upgrade: call an external virtual-try-on / image-gen API with the
// outfit + body params (+ optional user photo) to get a photoreal render. Kept
// as a documented seam so callers don't change when it lands. Intentionally
// throws until an API + key are configured.
export async function generatePhotoPreview(): Promise<string> {
  throw new Error(
    "Photoreal preview needs an image-generation/VTO API (not configured). " +
      "The stylized mannequin is the current preview.",
  );
}
