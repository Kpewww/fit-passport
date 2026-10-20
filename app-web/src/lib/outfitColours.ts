// An outfit painted onto a 3D body (Session 100: the /outfits preview on the 3D body).
//
// Each vertex takes the colour of the garment that covers it, decided by its region
// (torso, arm, leg; lib/fitMapColours.ts REGION) and its height. Heights come from the
// body's own landmarks (shoulder, chest, waist, hip) and its lowest point. The knee,
// the ankle and a short's hem are fixed fractions of the hip's height above the floor
// (adult proportions, roughly: knee about 0.55 of it, ankle 0.08). That is a DRAWING
// convention, like the SVG mannequin's, not a measurement: nothing here is scored, and
// the preview never claims a garment's length or fit — only which colour goes where.
//
// The dress form has no arms or legs (regions absent: every vertex is torso), so on it
// only what covers the torso shows.

import { engineCategoryOf } from "./garmentTaxonomy";
import { REGION, linearRgb, type BodyGeometryData } from "./fitMapColours";

export type OutfitLayer = { category: string; colour: string };

/** Where a garment of this kind goes, by the key it is sized as (invariant 97). */
export type Cover = "top-short" | "top-long" | "bottom-long" | "bottom-short" | "skirt" | "dress" | "onepiece" | "shoe" | "neck" | "none";

export function coverFor(category: string): Cover {
  const c = engineCategoryOf(category);
  if (["tshirt", "top", "polo"].includes(c)) return "top-short";
  if (["shirt", "sweater", "hoodie", "jacket"].includes(c)) return "top-long";
  if (["pants", "jeans"].includes(c)) return "bottom-long";
  if (c === "shorts") return "bottom-short";
  if (c === "skirt") return "skirt";
  if (c === "dress") return "dress";
  if (c === "jumpsuit") return "onepiece";
  if (["shoes", "sneakers", "boots"].includes(c)) return "shoe";
  if (c === "scarf") return "neck";
  return "none";
}

/** Drawing proportions, as fractions of the hip's height above the floor. */
export const LEG = { knee: 0.55, ankle: 0.08, shortsHem: 0.8 } as const;
/** Of an arm's vertical span: a short sleeve covers the top part, a hand is the bottom. */
export const ARM = { shortSleeve: 0.3, hand: 0.14 } as const;

/** Paint order: what is put on first is covered by what comes after. */
const ORDER: Cover[] = ["onepiece", "dress", "bottom-long", "bottom-short", "skirt", "top-short", "top-long", "neck", "shoe"];

/**
 * One colour per vertex (linear RGB, 3 floats each), in the layout fitMapColours uses,
 * so FitMap3D can draw it the same way. Uncovered skin keeps `bareHex`.
 */
export function outfitColours(body: BodyGeometryData, layers: OutfitLayer[], bareHex: string): Float32Array {
  const n = body.positions.length / 3;
  const out = new Float32Array(n * 3);
  const bare = linearRgb(bareHex);
  for (let v = 0; v < n; v++) out.set(bare, v * 3);

  let floor = Infinity, armTop = -Infinity, armBottom = Infinity, top = -Infinity;
  for (let v = 0; v < n; v++) {
    const y = body.positions[v * 3 + 1];
    floor = Math.min(floor, y);
    top = Math.max(top, y);
    if (body.regions?.[v] === REGION.arm) { armTop = Math.max(armTop, y); armBottom = Math.min(armBottom, y); }
  }
  const L = body.landmarks;
  const hip = L.hip ?? floor + (top - floor) * 0.5;
  const waist = L.waist ?? hip + (top - hip) * 0.3;
  const shoulder = L.shoulder ?? top;
  const legSpan = hip - floor;
  const knee = floor + legSpan * LEG.knee;
  const ankle = floor + legSpan * LEG.ankle;
  const shortsHem = floor + legSpan * LEG.shortsHem;
  const armSpan = armTop - armBottom;
  const shortSleeveEnd = armTop - armSpan * ARM.shortSleeve;
  const wrist = armBottom + armSpan * ARM.hand;

  // The last layer of each kind wins, as on the flat mannequin.
  const byCover = new Map<Cover, [number, number, number]>();
  for (const l of layers) {
    const c = coverFor(l.category);
    if (c !== "none") byCover.set(c, linearRgb(l.colour));
  }

  const covers = (c: Cover, region: number, y: number): boolean => {
    const torso = region === REGION.torso, arm = region === REGION.arm, leg = region === REGION.leg;
    switch (c) {
      case "top-short": return (torso && y >= hip) || (arm && y >= shortSleeveEnd);
      case "top-long": return (torso && y >= hip) || (arm && y >= wrist);
      case "bottom-long": return (torso && y <= waist) || (leg && y >= ankle);
      case "bottom-short": return (torso && y <= waist) || (leg && y >= shortsHem);
      case "skirt": return (torso && y <= waist) || (leg && y >= knee);
      case "dress": return torso || (leg && y >= knee);
      case "onepiece": return torso || (leg && y >= ankle);
      case "shoe": return leg && y <= ankle;
      case "neck": return torso && y >= shoulder - 6;
      default: return false;
    }
  };

  for (const c of ORDER) {
    const rgb = byCover.get(c);
    if (!rgb) continue;
    for (let v = 0; v < n; v++) {
      const region = body.regions ? body.regions[v] : REGION.torso;
      if (region === REGION.head) continue;
      if (covers(c, region, body.positions[v * 3 + 1])) out.set(rgb, v * 3);
    }
  }
  return out;
}
