// Turning the measurements someone typed into a 3D body, without inventing them.
//
// WHAT THIS IS. A body is modelled as a stack of horizontal cross-sections at
// the shoulder, chest, waist and hip. Each section is an ellipse whose
// CIRCUMFERENCE is the number the user gave us. That circumference is the truth;
// everything else here is a drawing convention, and the two are kept separate on
// purpose so the UI can say which is which.
//
// WHY NOT A LEARNED BODY MODEL. The obvious approach is SMPL — which is patented
// and needs a negotiated commercial licence (Meshcapade, acquired by Epic Games
// in February 2026), so it is off the table. Permissive alternatives exist
// (Anny, Apache 2.0; Meta's MHR) and would give a photoreal human. But a learned
// model's job is to plausibly INVENT the hundred dimensions you did not measure,
// and this project's entire proposition is that it does not invent. From four to
// seven numbers, an honest abstract figure says more than a realistic one that is
// mostly fiction. See docs/design/3d-body-and-tryon.md.
//
// This module is pure arithmetic — no three.js, no DOM — so the geometry can be
// tested without a browser.

/** Depth ÷ width of a torso cross-section. */
export const TORSO_DEPTH_RATIO = 2 / 3;
// ⚠ A DRAWING CONVENTION, not a measurement of this user. Elliptical torso
// models commonly take depth/breadth ≈ 2/3, and that is the only basis claimed
// for it. It decides how a circumference is DISTRIBUTED between front-to-back
// and side-to-side; it never changes the circumference itself, which is the part
// that came from the user. Two people with the same chest measurement and
// different depth are drawn identically here, and the figure should not be read
// as claiming otherwise.

/**
 * Landmark heights as a fraction of stature.
 * ⚠ Also conventions — widely cited artist's/anthropometric proportions, not a
 * survey table this project has verified. Where the user gives us a real length
 * (inseam), that wins over the fraction.
 */
export const LANDMARK_FRACTION = {
  crown: 1.0,
  shoulder: 0.82,
  chest: 0.72,
  waist: 0.62,
  hip: 0.52,
  crotch: 0.47,
} as const;

/** Fallback stature when the user has not given one, in cm. */
export const DEFAULT_STATURE_CM = 170;

export type BodyMeasurementsInput = {
  heightCm?: number | null;
  chestCm?: number | null;
  waistCm?: number | null;
  hipCm?: number | null;
  shoulderCm?: number | null; // ACROSS the back, not a circumference
  inseamCm?: number | null;
};

export type CrossSection = {
  /** Which landmark this is. */
  key: "shoulder" | "chest" | "waist" | "hip";
  /** Height above the ground, cm. */
  y: number;
  /** Half-width (side to side), cm. */
  halfWidth: number;
  /** Half-depth (front to back), cm. */
  halfDepth: number;
  /** The circumference this was built from, cm — null when it was inferred. */
  circumferenceCm: number | null;
  /** True when the user did not give this measurement and we filled it in. */
  estimated: boolean;
};

/**
 * Semi-axes of an ellipse with a given circumference and depth:width ratio.
 *
 * Inverts Ramanujan's perimeter approximation
 *   P ≈ π[3(a+b) − √((3a+b)(a+3b))]
 * which is accurate to better than 1 part in 10^4 for the eccentricities a torso
 * reaches — far below the millimetre this is drawn at. With b = r·a it collapses
 * to P = a·k(r), so `a` follows directly instead of needing a solver.
 */
export function ellipseSemiAxes(
  circumferenceCm: number,
  depthOverWidth: number = TORSO_DEPTH_RATIO,
): { halfWidth: number; halfDepth: number } {
  const r = depthOverWidth;
  const k = Math.PI * (3 * (1 + r) - Math.sqrt((3 + r) * (1 + 3 * r)));
  const halfWidth = circumferenceCm / k;
  return { halfWidth, halfDepth: halfWidth * r };
}

/**
 * Ratios used to fill a missing circumference from one we do have. Ordered by
 * how close the landmarks sit, so the shortest inference wins.
 *
 * ⚠ Conventions again, and deliberately weak ones: they exist so a figure can be
 * drawn at all from a partial profile, and every section they produce is marked
 * `estimated` so the UI can draw it differently and say why. They are NOT used
 * by the fit engine and must never be — `populationPrior.ts` is the only place
 * allowed to guess at a body for scoring purposes, under its own governance.
 */
const FILL_RATIO: Record<string, Array<{ from: keyof BodyMeasurementsInput; ratio: number }>> = {
  chestCm: [{ from: "waistCm", ratio: 1.15 }, { from: "hipCm", ratio: 1.0 }],
  waistCm: [{ from: "chestCm", ratio: 0.87 }, { from: "hipCm", ratio: 0.87 }],
  hipCm: [{ from: "waistCm", ratio: 1.15 }, { from: "chestCm", ratio: 1.0 }],
};

function fillCircumference(
  key: "chestCm" | "waistCm" | "hipCm",
  m: BodyMeasurementsInput,
): { value: number; estimated: boolean } | null {
  const own = m[key];
  if (own != null) return { value: own, estimated: false };
  for (const { from, ratio } of FILL_RATIO[key]) {
    const v = m[from];
    if (v != null) return { value: v * ratio, estimated: true };
  }
  return null;
}

/** Stature to draw at: the user's, or the fallback. */
export function statureCm(m: BodyMeasurementsInput): number {
  return m.heightCm ?? DEFAULT_STATURE_CM;
}

/** Height above ground of a landmark, in cm. */
export function landmarkHeightCm(
  key: keyof typeof LANDMARK_FRACTION,
  m: BodyMeasurementsInput,
): number {
  const h = statureCm(m);
  // A real inseam pins the crotch, and everything below the waist scales with it
  // rather than with the generic fraction.
  if (key === "crotch" && m.inseamCm != null) return m.inseamCm;
  if (key === "hip" && m.inseamCm != null) {
    const crotch = m.inseamCm;
    const waist = h * LANDMARK_FRACTION.waist;
    return crotch + (waist - crotch) * 0.45;
  }
  return h * LANDMARK_FRACTION[key];
}

/**
 * The cross-sections to loft, bottom to top. Returns an empty array when there
 * is nothing measured to draw — a figure invented from no input at all would be
 * pure decoration, and this module refuses to produce one.
 */
export function bodyCrossSections(m: BodyMeasurementsInput): CrossSection[] {
  const hasAnyGirth = m.chestCm != null || m.waistCm != null || m.hipCm != null;
  if (!hasAnyGirth) return [];

  const out: CrossSection[] = [];

  const hip = fillCircumference("hipCm", m);
  if (hip) {
    const { halfWidth, halfDepth } = ellipseSemiAxes(hip.value);
    out.push({
      key: "hip", y: landmarkHeightCm("hip", m), halfWidth, halfDepth,
      circumferenceCm: hip.estimated ? null : hip.value, estimated: hip.estimated,
    });
  }

  const waist = fillCircumference("waistCm", m);
  if (waist) {
    const { halfWidth, halfDepth } = ellipseSemiAxes(waist.value);
    out.push({
      key: "waist", y: landmarkHeightCm("waist", m), halfWidth, halfDepth,
      circumferenceCm: waist.estimated ? null : waist.value, estimated: waist.estimated,
    });
  }

  const chest = fillCircumference("chestCm", m);
  if (chest) {
    const { halfWidth, halfDepth } = ellipseSemiAxes(chest.value);
    out.push({
      key: "chest", y: landmarkHeightCm("chest", m), halfWidth, halfDepth,
      circumferenceCm: chest.estimated ? null : chest.value, estimated: chest.estimated,
    });
  }

  // Shoulder is the odd one out: the profile stores it as a BREADTH across the
  // back, not a circumference, so it sets the half-width directly and only the
  // depth is a convention. When it is missing, the chest section carries up.
  if (chest) {
    const chestAxes = ellipseSemiAxes(chest.value);
    const measured = m.shoulderCm != null;
    const halfWidth = measured ? m.shoulderCm! / 2 : chestAxes.halfWidth * 1.02;
    out.push({
      key: "shoulder", y: landmarkHeightCm("shoulder", m),
      halfWidth, halfDepth: chestAxes.halfDepth * 0.92,
      circumferenceCm: null, // never a circumference, by definition
      estimated: !measured,
    });
  }

  return out.sort((a, b) => a.y - b.y);
}

/** How much of the figure is the user's own measurement rather than inference. */
export function measuredFraction(sections: CrossSection[]): number {
  if (sections.length === 0) return 0;
  return sections.filter((s) => !s.estimated).length / sections.length;
}

/**
 * Extra rings that exist only so the form reads as a torso rather than a vase.
 *
 * Kept OUT of `bodyCrossSections` deliberately. Those sections are data — each
 * one is listed in the UI beside its centimetres, and a user can act on the ones
 * marked estimated by going and measuring them. These are not data and there is
 * nothing to act on: we do not collect a neck or a thigh, and listing them as
 * "inferred" would invite someone to look for a field that does not exist.
 *
 * They shape the ends only. The measured rings are untouched, so the volume the
 * user sees between shoulder and hip is still exactly their own numbers.
 */
export function drawingRings(sections: CrossSection[]): {
  above: Omit<CrossSection, "key">[];
  below: Omit<CrossSection, "key">[];
} {
  if (sections.length < 2) return { above: [], below: [] };
  const top = sections[sections.length - 1];
  const bottom = sections[0];
  const rise = top.y - bottom.y;

  return {
    // Shoulders slope and then run into a neck. Two rings: a slight outward
    // shoulder cap, then a sharp narrowing. Without them the top is a flat disc
    // wider than the chest, which is what made the first render look like a vase.
    above: [
      { y: top.y + rise * 0.035, halfWidth: top.halfWidth * 0.97, halfDepth: top.halfDepth * 0.97, circumferenceCm: null, estimated: true },
      { y: top.y + rise * 0.085, halfWidth: top.halfWidth * 0.72, halfDepth: top.halfDepth * 0.80, circumferenceCm: null, estimated: true },
      { y: top.y + rise * 0.135, halfWidth: top.halfWidth * 0.40, halfDepth: top.halfDepth * 0.55, circumferenceCm: null, estimated: true },
      { y: top.y + rise * 0.185, halfWidth: top.halfWidth * 0.34, halfDepth: top.halfDepth * 0.48, circumferenceCm: null, estimated: true },
    ],
    // Below the hip the body continues into the legs; a short taper gives the
    // figure a base instead of a flat cut.
    below: [
      { y: bottom.y - rise * 0.12, halfWidth: bottom.halfWidth * 0.95, halfDepth: bottom.halfDepth * 0.96, circumferenceCm: null, estimated: true },
      { y: bottom.y - rise * 0.28, halfWidth: bottom.halfWidth * 0.80, halfDepth: bottom.halfDepth * 0.86, circumferenceCm: null, estimated: true },
      { y: bottom.y - rise * 0.40, halfWidth: bottom.halfWidth * 0.66, halfDepth: bottom.halfDepth * 0.76, circumferenceCm: null, estimated: true },
    ],
  };
}
