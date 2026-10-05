// Stability: does the recommended size survive the noise already in its inputs?
//
// THE PROBLEM. The founder asked that "small changes should not swing the whole
// result". A scorer built from smooth curves never jumps in SCORE, but the PICK is
// an argmax, and an argmax flips the instant two scores cross. A wearer whose
// chest sits on the M/L boundary gets M at 100.0 cm and L at 100.5 cm — and a
// self-taken tape measurement is not accurate to half a centimetre, nor is a
// retailer's chart. Refusing to flip is not the answer: at a real boundary,
// flipping is correct. The honest answer is to KNOW when a pick is fragile and say
// so, instead of presenting a coin-flip with a confident number.
//
// THE METHOD, deterministic and explainable (no random sampling — the same input
// always gives the same stability, so it can be tested and explained):
//   • re-run the engine on a grid of plausible alternative inputs — the wearer's
//     chest and waist each moved by ±½ and ±1 × the self-measurement noise, and
//     the whole chart moved by ± the chart tolerance;
//   • `agreement` = the share of those runs that still pick the same size;
//   • `holdsForChestCm` = how far the wearer's chest can move, alone, before the
//     pick changes — a sentence a person can check against their own tape.
//
// It REPLACES the old top-two score margin as the decisiveness factor in
// confidence. Both measured the same idea; this one measures it in the units the
// wearer lives in (centimetres of their own body) rather than in score units only
// the engine understands, and it can be explained on screen.
//
// Pure: takes the engine as a callback, so fitEngine.ts can use it without an
// import cycle. Every number it uses is in scoringConstants.STABILITY.

import { STABILITY } from "./scoringConstants";

type Sized = {
  label: string;
  chestCm?: number | null;
  waistCm?: number | null;
  shoulderCm?: number | null;
  sleeveCm?: number | null;
  bodyChestMinCm?: number | null;
  bodyChestMaxCm?: number | null;
  bodyWaistMinCm?: number | null;
  bodyWaistMaxCm?: number | null;
  hipCm?: number | null;
  bodyHipMinCm?: number | null;
  bodyHipMaxCm?: number | null;
};

export type StabilityInput<S extends Sized> = {
  profile: { chestCm?: number | null; waistCm?: number | null };
  sizes: S[];
};

export type Stability = {
  /** Share of the perturbation grid that still picks the same size, 0–1. */
  agreement: number;
  /** How many perturbed runs that share is over. */
  runs: number;
  /** The wearer's chest range (cm) over which the pick does not change, or null. */
  holdsForChestCm: [number, number] | null;
  /** The noise assumed, so the explanation can state it. */
  bodyNoiseCm: number;
  chartNoiseCm: number;
};

const CHART_FIELDS = [
  "chestCm", "waistCm", "shoulderCm", "sleeveCm",
  "bodyChestMinCm", "bodyChestMaxCm", "bodyWaistMinCm", "bodyWaistMaxCm",
  "hipCm", "bodyHipMinCm", "bodyHipMaxCm",
] as const;

function shiftChart<S extends Sized>(sizes: S[], by: number): S[] {
  if (by === 0) return sizes;
  return sizes.map((s) => {
    const out = { ...s };
    for (const f of CHART_FIELDS) {
      const v = s[f];
      if (typeof v === "number") (out as Record<string, unknown>)[f] = v + by;
    }
    return out;
  });
}

/** Offsets as multiples of the noise: −1, −½, 0, +½, +1 for STABILITY.bodySteps = 2. */
function offsets(noise: number, steps: number): number[] {
  const out: number[] = [];
  for (let k = -steps; k <= steps; k++) out.push((noise * k) / steps);
  return out;
}

export function measureStability<I extends StabilityInput<S>, S extends Sized>(
  input: I,
  basePick: string,
  pick: (input: I) => string,
): Stability {
  const bodyNoise = STABILITY.bodyNoiseCm;
  const chartNoise = STABILITY.chartNoiseCm;
  const chest = input.profile.chestCm ?? null;
  const waist = input.profile.waistCm ?? null;

  const chestOffsets = chest != null ? offsets(bodyNoise, STABILITY.bodySteps) : [0];
  const waistOffsets = waist != null ? offsets(bodyNoise, STABILITY.bodySteps) : [0];
  const chartOffsets = offsets(chartNoise, STABILITY.chartSteps);

  let runs = 0;
  let same = 0;
  for (const dc of chestOffsets) {
    for (const dw of waistOffsets) {
      for (const dx of chartOffsets) {
        const variant = {
          ...input,
          profile: {
            ...input.profile,
            chestCm: chest != null ? chest + dc : chest,
            waistCm: waist != null ? waist + dw : waist,
          },
          sizes: shiftChart(input.sizes, dx),
        };
        runs++;
        if (pick(variant) === basePick) same++;
      }
    }
  }

  // How far can the chest alone move before the answer changes?
  let holdsForChestCm: [number, number] | null = null;
  if (chest != null) {
    const at = (d: number) =>
      pick({ ...input, profile: { ...input.profile, chestCm: chest + d } }) === basePick;
    const step = STABILITY.holdScanStepCm;
    let lo = 0;
    while (lo - step >= -STABILITY.holdScanCm && at(lo - step)) lo -= step;
    let hi = 0;
    while (hi + step <= STABILITY.holdScanCm && at(hi + step)) hi += step;
    holdsForChestCm = [round1(chest + lo), round1(chest + hi)];
  }

  return {
    agreement: runs ? same / runs : 1,
    runs,
    holdsForChestCm,
    bodyNoiseCm: bodyNoise,
    chartNoiseCm: chartNoise,
  };
}

/**
 * The confidence multiplier for a given agreement. A dead heat (agreement ½ —
 * half the plausible inputs pick another size) keeps STABILITY.floor of its
 * confidence, full agreement keeps all of it, linearly between. The same range the
 * old top-two margin factor used, so replacing it does not move the scale.
 */
export function stabilityFactor(agreement: number): number {
  const f = STABILITY.floor + 2 * (1 - STABILITY.floor) * (agreement - 0.5);
  return Math.max(STABILITY.floor, Math.min(1, f));
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
