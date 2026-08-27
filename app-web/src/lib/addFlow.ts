// The closet add flow's question set, kept out of the component so the decision
// behind it can be tested rather than just documented.
//
// The flow asks four questions. That number is not a taste call: the FIC budget
// in docs/design/closet-signal-and-interaction-cost.md §3.2 prices every field
// against what the fit engine gains from it, and only four fields in the old
// eleven-field add form are read by fitEngine.ts at all.
//
// Everything else the form collected — name, line/gender, colour, fit notes,
// photo, the in-store flag — is stored and displayed but never scored. In FIC
// terms that is value 0, which fails the `value >= cost / 2` rule at any cost
// above zero. Those fields still exist; they moved behind a disclosure, and are
// editable on the item afterwards.
//
// The point of pinning this in a test is that a field is cheap to add and its
// cost is paid by every user, every time. If a fifth question is ever put on
// this path, the test below should be what forces the argument for it.

import { isValidSize } from "./sizeSystems";

export const ADD_STEPS = ["brand", "category", "size", "fit"] as const;
export type AddStep = (typeof ADD_STEPS)[number];

/**
 * What each question buys the engine. Used by the test as the justification a
 * step has to carry to be on this path — a step whose answer no scoring code
 * reads does not belong here.
 */
export const STEP_ENGINE_USE: Record<AddStep, string> = {
  brand: "brandBias.ts + the same-brand anchor in scoreKnownGood",
  category: "easeAdjustForCategory, and anchor matching is per category",
  size: "the anchor's own size — without it there is nothing to shift from",
  fit: "directionToLadderShift moves the anchor up or down a size",
};

/**
 * FIC cost per question, scored with the §3.2 table:
 *   brand    — free text with suggestions (6), required (×2)  = 12
 *   category — pick from >5 options (5), defaulted so not required
 *   size     — pick from offered options (5), required (×2)   = 10
 *   fit      — pick from 5 visible options (3), defaulted
 * These weights are the design doc's own, and that doc is explicit that they are
 * an invented forced-ranking device, not measured constants.
 */
export const STEP_FIC: Record<AddStep, number> = {
  brand: 12,
  category: 5,
  size: 10,
  fit: 3,
};

/** §3.2: "First-run budget: FIC <= 30 total before a user gets their first real size answer." */
export const FIRST_RUN_FIC_BUDGET = 30;

export function addFlowFicTotal(): number {
  return ADD_STEPS.reduce((sum, s) => sum + STEP_FIC[s], 0);
}

export type AddFlowAnswers = { brand: string; category: string; size: string };

/**
 * Whether a step has been answered well enough to move on.
 *
 * Only brand and size can block. Category and fit both carry a sensible default,
 * and a required field costs double in the FIC table, so requiring one needs a
 * reason beyond tidiness.
 */
export function stepReady(step: AddStep, form: AddFlowAnswers): boolean {
  switch (step) {
    case "brand":
      return form.brand.trim().length > 0;
    case "size":
      return Boolean(form.size) && isValidSize(form.category, form.size);
    case "category":
    case "fit":
      return true;
  }
}

/** The steps that block submission — everything else is advisory. */
export const BLOCKING_STEPS: readonly AddStep[] = ["brand", "size"];

export function canSubmit(form: AddFlowAnswers): boolean {
  return BLOCKING_STEPS.every((s) => stepReady(s, form));
}
