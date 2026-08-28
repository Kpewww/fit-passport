// The passport onboarding question set, kept out of the component so the
// decision behind it can be tested rather than just documented. Mirrors
// lib/addFlow.ts, deliberately — the closet went through this exact treatment in
// Session 58 and the argument is the same one.
//
// The old page put ten inputs on one screen, nine of them body measurements. It
// measured worse than the closet form it followed, and it sits EARLIER in the
// journey: the closet is somewhere a person chooses to go, onboarding is what
// they hit first.
//
// Which questions survive is settled by grepping the engine, not by taste.
// Reference counts across fitEngine / populationPrior / brandBias /
// closetConsistency / recommendService, 2026-08-28:
//
//     chestCm 32 · shoulderCm 19 · waistCm 15 · region 15
//     preferredFit 12 · sex 9
//     ---- never read ----
//     hipCm 0 · heightCm 0 · weightKg 0 · inseamCm 0 · shopsFor 0 · notes 0
//
// (The engine's five `sleeveCm` hits are the GARMENT's sleeve from a size chart,
// on `SizeOptionInput` — the wearer's own sleeve is never scored. Worth stating,
// because the grep looks like a hit until you read it.)
//
// So five of the eight measurement inputs, plus shopsFor and notes, are engine
// value 0. They are not deleted — they move behind a disclosure that says
// plainly the fit engine does not read them, and they stay editable afterwards.

import { FIRST_RUN_FIC_BUDGET } from "./addFlow";

export const ONBOARDING_STEPS = ["fit", "reference", "measurements"] as const;
export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

/**
 * What each question buys the engine — the justification a step must carry to
 * be on this path. A step whose answer no scoring code reads does not belong.
 */
export const STEP_ENGINE_USE: Record<OnboardingStep, string> = {
  fit: "preferredFit shifts the target ease in scoreMeasurementFit",
  reference: "sex + region select the populationPrior cold-start body",
  measurements: "chest, waist and shoulder are what scoreMeasurementFit compares",
};

/**
 * FIC cost per step, scored with the §3.2 table in
 * docs/design/closet-signal-and-interaction-cost.md. Nothing here is required,
 * so nothing pays the ×2 required multiplier — which is the point.
 *
 *   fit          — pick from 4 visible options, defaulted   = 3
 *   reference    — two pick-from-few, both defaulted        = 5
 *   measurements — three numbers, all optional, and a person
 *                  who does not know them may skip outright  = 12
 */
export const STEP_FIC: Record<OnboardingStep, number> = {
  fit: 3,
  reference: 5,
  measurements: 12,
};

export function onboardingFicTotal(): number {
  return ONBOARDING_STEPS.reduce((sum, s) => sum + STEP_FIC[s], 0);
}

/**
 * The measurements offered on the main path, in the order the engine values
 * them. Chest first because it carries the most weight by a wide margin.
 */
export const SCORED_MEASUREMENTS = ["chestCm", "waistCm", "shoulderCm"] as const;
export type ScoredMeasurement = (typeof SCORED_MEASUREMENTS)[number];

/**
 * Collected, displayed, editable — and never scored. Behind the disclosure, and
 * labelled as such so nobody fills them in believing they sharpen the answer.
 */
export const UNSCORED_PROFILE_FIELDS = [
  "heightCm", "weightKg", "hipCm", "inseamCm", "sleeveCm", "shopsFor", "notes",
] as const;

/**
 * NOTHING here blocks. The whole point of this pass is that a first size check
 * must be able to run on an empty profile — the engine already falls back to a
 * regional prior and caps its own confidence, and saying "answer these ten
 * questions first" throws that away.
 */
export const BLOCKING_STEPS: readonly OnboardingStep[] = [];

export function canSkipAll(): boolean {
  return BLOCKING_STEPS.length === 0;
}

/** The budget this flow is held to — the same first-run budget the closet uses. */
export { FIRST_RUN_FIC_BUDGET };
