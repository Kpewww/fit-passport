import { describe, it, expect } from "vitest";
import {
  BLOCKING_STEPS,
  FIRST_RUN_FIC_BUDGET,
  ONBOARDING_STEPS,
  SCORED_MEASUREMENTS,
  STEP_ENGINE_USE,
  STEP_FIC,
  UNSCORED_PROFILE_FIELDS,
  canSkipAll,
  onboardingFicTotal,
} from "./onboardingFlow";

describe("onboarding flow — the question set", () => {
  it("stays inside the same first-run FIC budget the closet is held to", () => {
    expect(onboardingFicTotal()).toBeLessThanOrEqual(FIRST_RUN_FIC_BUDGET);
  });

  it("asks only for things the fit engine actually reads", () => {
    for (const step of ONBOARDING_STEPS) {
      expect(STEP_ENGINE_USE[step], `step "${step}" has no stated engine use`).toBeTruthy();
      expect(STEP_FIC[step], `step "${step}" has no FIC cost`).toBeGreaterThan(0);
    }
    expect(Object.keys(STEP_ENGINE_USE).sort()).toEqual([...ONBOARDING_STEPS].sort());
  });

  // The load-bearing one. Move 2 is "let the first size check run on nothing":
  // the engine already falls back to a regional prior and caps its confidence,
  // so a gate here would be throwing away an honest answer to collect data the
  // person may not even have. If anything ever starts blocking, that decision
  // should have to be argued for, not slipped in.
  it("blocks on nothing at all — the whole profile is skippable", () => {
    expect(BLOCKING_STEPS).toHaveLength(0);
    expect(canSkipAll()).toBe(true);
  });

  it("puts chest first, because the engine weights it far above the rest", () => {
    // chestCm 32 references vs waistCm 15 / shoulderCm 19 across the scoring
    // modules — see the header of onboardingFlow.ts for the count.
    expect(SCORED_MEASUREMENTS[0]).toBe("chestCm");
    expect([...SCORED_MEASUREMENTS].sort()).toEqual(["chestCm", "shoulderCm", "waistCm"]);
  });

  it("keeps the never-scored fields off the main path", () => {
    // Every one of these greps to zero references in the scoring modules. They
    // are still collected and still editable — they are just not allowed to sit
    // in front of someone's first answer pretending to sharpen it.
    for (const f of ["heightCm", "weightKg", "hipCm", "inseamCm", "notes", "shopsFor"]) {
      expect(UNSCORED_PROFILE_FIELDS).toContain(f);
      expect(SCORED_MEASUREMENTS).not.toContain(f as never);
    }
  });

  it("treats the wearer's own sleeve as unscored", () => {
    // fitEngine's `sleeveCm` hits are on SizeOptionInput — the GARMENT's sleeve
    // from a size chart. The wearer's sleeve is never compared to anything.
    // This looks like a hit in a grep, which is exactly why it is pinned here.
    expect(UNSCORED_PROFILE_FIELDS).toContain("sleeveCm");
    expect(SCORED_MEASUREMENTS).not.toContain("sleeveCm" as never);
  });
});
