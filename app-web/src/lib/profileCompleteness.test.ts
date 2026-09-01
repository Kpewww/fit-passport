import { describe, it, expect } from "vitest";
import {
  hasBodyMeasurement,
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

describe("hasBodyMeasurement", () => {
  it("asks only about the dimensions the measurement scorer uses", () => {
    expect(hasBodyMeasurement(seeded())).toBe(false);
    expect(hasBodyMeasurement({ ...seeded(), chestCm: 96 })).toBe(true);
    expect(hasBodyMeasurement({ ...seeded(), heightCm: 178 })).toBe(true);
    expect(hasBodyMeasurement({ ...seeded(), waistCm: 82 })).toBe(true);
  });

  it("is narrower than hasStatedProfile, on purpose", () => {
    // Saving a preference is not the same as giving the engine a measurement;
    // the accuracy tier must not claim otherwise.
    const edited = { ...seeded(), updatedAt: new Date(T0.getTime() + 1) };
    expect(hasStatedProfile(edited)).toBe(true);
    expect(hasBodyMeasurement(edited)).toBe(false);
  });

  it("is false with no profile", () => {
    expect(hasBodyMeasurement(null)).toBe(false);
  });
});
