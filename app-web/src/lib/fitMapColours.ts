// The fit map's colours — Session 97.
//
// A body (the dress form today; Anny, behind the same shape, later) is coloured by
// how the chosen size sits on each measured part: the engine's own per-part numbers
// (`SizeScore.zones`), never a second opinion. A colour can only say what a zone
// says; where no zone exists the body stays its own grey.
//
// The palette diverges around "right": warm for tight, as CLO's Fit Map and
// Browzwear's tension map both use; cobalt for room, the brand's own. Red–green is
// avoided (Crameri, Shephard & Heron, Nat. Commun. 11:5444, 2020). Colour is never
// the only carrier — the page prints each part's centimetres and verdict beside it
// (WCAG 1.4.1; invariant ⑲).
//
// Pure: no three.js. Colours come out as linear-sRGB floats, the space three.js
// keeps vertex colours in.

/** A verdict, as the engine words it (fitEngine.ts FitVerdict). */
export type Verdict = "too small" | "snug" | "true to size" | "relaxed" | "too big";
/** A measured part (engineText.ts Dim). */
export type ZoneKey = "chest" | "waist" | "shoulder" | "hip";
export type Zone = { key: ZoneKey; deltaCm: number; verdict: Verdict };

/** sRGB hex per verdict. "True to size" is lighter than the form, so a part that was
 *  checked and fits reads differently from a part nobody measured. */
export const VERDICT_COLOUR: Record<Verdict, string> = {
  "too small": "#9b2c2c",
  snug: "#c2761b",
  "true to size": "#eceae4",
  relaxed: "#8fa0ec",
  "too big": "#2438d6",
};

/** The form's own grey: no data here. */
export const FORM_COLOUR = "#9aa0ad";

/** How far, in cm, an outermost part's colour fades into the form above or below it. */
export const FADE_CM = 8;

/** Region of a vertex. The torso is coloured, and the legs by the hip alone: a top's
 *  chest says nothing about an arm. */
export const REGION = { torso: 0, arm: 1, leg: 2, head: 3 } as const;

/**
 * What any body hands the renderer. The dress form makes one from its rings; Anny
 * will make one from its baked mesh.
 */
export type BodyGeometryData = {
  /** x, y, z per vertex, cm, y up. */
  positions: Float32Array;
  indices: Uint32Array | Uint16Array;
  /** REGION per vertex; absent means every vertex is torso (the dress form). */
  regions?: Uint8Array | null;
  /** Height of each measured part's landmark, cm, in the same space as `positions`. */
  landmarks: Partial<Record<ZoneKey, number>>;
};

function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** A hex colour as linear-sRGB [r, g, b]. */
export function linearRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [srgbToLinear(((n >> 16) & 255) / 255), srgbToLinear(((n >> 8) & 255) / 255), srgbToLinear((n & 255) / 255)];
}

const mix = (a: [number, number, number], b: [number, number, number], t: number): [number, number, number] =>
  [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

/**
 * The colour at a height: between two measured parts, a straight blend from one to
 * the other; beyond the outermost, its colour fading into the form over FADE_CM.
 */
export function colourAtHeight(
  y: number,
  stops: Array<{ y: number; colour: [number, number, number] }>,
  form: [number, number, number],
): [number, number, number] {
  if (stops.length === 0) return form;
  const sorted = stops.slice().sort((a, b) => a.y - b.y);
  const lo = sorted[0];
  const hi = sorted[sorted.length - 1];
  if (y <= lo.y) return mix(lo.colour, form, Math.min(1, (lo.y - y) / FADE_CM));
  if (y >= hi.y) return mix(hi.colour, form, Math.min(1, (y - hi.y) / FADE_CM));
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    if (y >= a.y && y <= b.y) return mix(a.colour, b.colour, b.y === a.y ? 0 : (y - a.y) / (b.y - a.y));
  }
  return form;
}

/**
 * One colour per vertex (linear RGB, 3 floats each). Torso vertices take the blend
 * of the parts measured; every other vertex, and the whole body when there are no
 * zones, keeps the form's grey.
 */
export function fitMapColours(body: BodyGeometryData, zones: Zone[] | null | undefined): Float32Array {
  const n = body.positions.length / 3;
  const out = new Float32Array(n * 3);
  const form = linearRgb(FORM_COLOUR);
  const stops = (zones ?? [])
    .filter((z) => body.landmarks[z.key] != null)
    .map((z) => ({ y: body.landmarks[z.key] as number, colour: linearRgb(VERDICT_COLOUR[z.verdict]) }));
  // The hips are the top of the legs as much as the base of the torso: a leg vertex
  // takes the hip's colour, and nothing else's.
  const hipStops = (zones ?? [])
    .filter((z) => z.key === "hip" && body.landmarks.hip != null)
    .map((z) => ({ y: body.landmarks.hip as number, colour: linearRgb(VERDICT_COLOUR[z.verdict]) }));
  for (let v = 0; v < n; v++) {
    const region = body.regions ? body.regions[v] : REGION.torso;
    const y = body.positions[v * 3 + 1];
    const c = region === REGION.torso ? colourAtHeight(y, stops, form) : region === REGION.leg ? colourAtHeight(y, hipStops, form) : form;
    out[v * 3] = c[0];
    out[v * 3 + 1] = c[1];
    out[v * 3 + 2] = c[2];
  }
  return out;
}
