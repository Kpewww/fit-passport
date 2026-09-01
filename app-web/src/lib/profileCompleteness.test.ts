import { describe, it, expect } from "vitest";
import {
  ENGINE_SCORED_DIMENSIONS,
  hasBodyMeasurement,
  hasChestMeasurement,
  hasStatedProfile,
  profileWasEdited,
  type ProfileCompletenessInput,
} from "./profileCompleteness";

const T0 = new Date("2026-09-01T12:00:00.000Z");

/** A row exactly as lib/session.ts seeds it on the user's first ever request. */
const seeded = (): ProfileCompletenessInput => ({
  createdAt: T0,
  updatedAt: T0, // measured: Prisma sets these equal on create
  sex: null, shopsFor: null, notes: null, avatarDataUrl: null,
  heightCm: null, weightKg: null, chestCm: null, waistCm: null,
  hipCm: null, shoulderCm: null, sleeveCm: null, inseamCm: null,
});

describe("hasStatedProfile — the bug this exists to prevent", () => {
  it("is FALSE for the row seeded on a brand-new visitor's first request", () => {
    // This is the whole point. `!!profile` was true here, so the checklist said
    // "Set your fit preference ✓" before the visitor had touched anything, and
    // clearing cookies only minted another already-seeded row.
    expect(hasStatedProfile(seeded())).toBe(false);
  });

  it("is FALSE when there is no profile at all", () => {
    expect(hasStatedProfile(null)).toBe(false);
    expect(hasStatedProfile(undefined)).toBe(false);
  });

  it("is TRUE once the row has been saved, even if the user kept every default", () => {
    // The case no field check can catch: their honest answer IS "regular"/"US".
    const p = { ...seeded(), updatedAt: new Date(T0.getTime() + 1) };
    expect(hasStatedProfile(p)).toBe(true);
  });

  it("is TRUE when a user-only field is set, even if the timestamps match", () => {
    // Rows written in a single create — the demo seeder does this — have equal
    // timestamps despite holding real values.
    expect(hasStatedProfile({ ...seeded(), chestCm: 96 })).toBe(true);
    expect(hasStatedProfile({ ...seeded(), sex: "female" })).toBe(true);
    expect(hasStatedProfile({ ...seeded(), shopsFor: "womens" })).toBe(true);
    expect(hasStatedProfile({ ...seeded(), notes: "long torso" })).toBe(true);
  });

  it("counts every dimension the profile can hold, not just the scored three", () => {
    // A user who entered only an inseam has still told us something, even
    // though hasBodyMeasurement stays false for them.
    for (const f of ["heightCm", "weightKg", "hipCm", "shoulderCm", "sleeveCm", "inseamCm"] as const) {
      expect(hasStatedProfile({ ...seeded(), [f]: 80 }), `${f} should count`).toBe(true);
    }
  });
});

describe("profileWasEdited", () => {
  it("is false at creation and true after any later write", () => {
    expect(profileWasEdited(seeded())).toBe(false);
    expect(profileWasEdited({ ...seeded(), updatedAt: new Date(T0.getTime() + 1) })).toBe(true);
  });

  it("does not fire on a clock that goes backwards", () => {
    expect(profileWasEdited({ ...seeded(), updatedAt: new Date(T0.getTime() - 5000) })).toBe(false);
  });
});

describe("hasBodyMeasurement — what the SIZING engine can use", () => {
  it("is false for a seeded profile and with no profile at all", () => {
    expect(hasBodyMeasurement(seeded())).toBe(false);
    expect(hasBodyMeasurement(null)).toBe(false);
  });

  it("counts every dimension scoreMeasurementFit reads", () => {
    // chest 0.6, waist 0.22, shoulder 0.18 — all three move which size wins.
    expect(hasBodyMeasurement({ ...seeded(), chestCm: 96 })).toBe(true);
    expect(hasBodyMeasurement({ ...seeded(), waistCm: 82 })).toBe(true);
    expect(hasBodyMeasurement({ ...seeded(), shoulderCm: 44 })).toBe(true);
  });

  it("counts SHOULDER, which the old chest/height/waist check missed", () => {
    // The regression: a shoulder-only user was told we had nothing about them
    // while the engine was already scoring their shoulder at weight 0.18.
    expect(hasBodyMeasurement({ ...seeded(), shoulderCm: 44 })).toBe(true);
  });

  it("does NOT count height or weight, which the sizing engine never reads", () => {
    // They are real data — deriveBodyType uses them for the passport's body
    // type — but recommendService does not pass them to the engine, so they
    // cannot make a size recommendation more accurate.
    expect(hasBodyMeasurement({ ...seeded(), heightCm: 178 })).toBe(false);
    expect(hasBodyMeasurement({ ...seeded(), weightKg: 72 })).toBe(false);
  });

  it("does not count hip, sleeve or inseam either", () => {
    for (const f of ["hipCm", "sleeveCm", "inseamCm"] as const) {
      expect(hasBodyMeasurement({ ...seeded(), [f]: 90 }), `${f} is not scored`).toBe(false);
    }
  });

  it("lists exactly the three dimensions the engine scores", () => {
    // Pinned so that adding a field to the profile does not silently widen what
    // we claim the engine can do with it.
    expect([...ENGINE_SCORED_DIMENSIONS]).toEqual(["chestCm", "waistCm", "shoulderCm"]);
  });

  it("is narrower than hasStatedProfile, on purpose", () => {
    const edited = { ...seeded(), updatedAt: new Date(T0.getTime() + 1) };
    expect(hasStatedProfile(edited)).toBe(true);
    expect(hasBodyMeasurement(edited)).toBe(false);
  });
});

describe("hasChestMeasurement — what moves the confidence NUMBER", () => {
  it("is true only for a chest the user entered themselves", () => {
    expect(hasChestMeasurement({ ...seeded(), chestCm: 96 })).toBe(true);
    expect(hasChestMeasurement(seeded())).toBe(false);
    expect(hasChestMeasurement(null)).toBe(false);
  });

  it("is false for waist or shoulder, which change the score but not confidence", () => {
    // computeConfidence adds CONFIDENCE_WEIGHTS.measurements for a chest and
    // nothing else. A UI offering "+35 for your measurements" has to gate here.
    expect(hasChestMeasurement({ ...seeded(), waistCm: 82 })).toBe(false);
    expect(hasChestMeasurement({ ...seeded(), shoulderCm: 44 })).toBe(false);
  });

  it("separates the two questions for a waist-only user", () => {
    // The case the single boolean got wrong: the engine CAN score them, and
    // they can STILL collect the confidence points by adding a chest.
    const waistOnly = { ...seeded(), waistCm: 82 };
    expect(hasBodyMeasurement(waistOnly)).toBe(true);
    expect(hasChestMeasurement(waistOnly)).toBe(false);
  });
});
