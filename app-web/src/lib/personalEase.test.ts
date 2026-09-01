import { describe, it, expect } from "vitest";
import {
  FULL_EVIDENCE,
  LADDER_STEP_CHEST_CM,
  MIN_EVIDENCE,
  personalEaseTarget,
  resolveEase,
  type EaseObservation,
} from "./personalEase";
import { easeChestCm } from "./sizing";

/** A tee whose own chest we read off the retailer's chart. */
const tee = (garmentChestCm: number, fitDirection: number | null = 0): EaseObservation => ({
  category: "tshirt",
  garmentChestCm,
  garmentMeasuredFrom: "page",
  fitDirection,
});

const BODY = 100;

describe("personalEaseTarget — evidence and trust", () => {
  it("does nothing without a body chest to subtract from", () => {
    expect(personalEaseTarget([tee(110), tee(112)], null).targetCm).toBeNull();
  });

  it("does nothing below the minimum evidence", () => {
    expect(MIN_EVIDENCE).toBe(2);
    expect(personalEaseTarget([tee(110)], BODY).targetCm).toBeNull();
    expect(personalEaseTarget([tee(110)], BODY).evidence).toBe(1);
    expect(personalEaseTarget([tee(110), tee(110)], BODY).targetCm).not.toBeNull();
  });

  it("ignores garments whose measurements were ESTIMATED, not read", () => {
    // An estimated garment chest is the extractor's fallback ladder guessing. A
    // personal target built on a guess is worse than the stated preference it
    // would replace, so provenance is checked rather than assumed.
    const guessed: EaseObservation[] = [
      { category: "tshirt", garmentChestCm: 110, garmentMeasuredFrom: "estimated", fitDirection: 0 },
      { category: "tshirt", garmentChestCm: 112, garmentMeasuredFrom: "estimated", fitDirection: 0 },
    ];
    expect(personalEaseTarget(guessed, BODY).targetCm).toBeNull();
    expect(personalEaseTarget([...guessed, tee(110), tee(110)], BODY).evidence).toBe(2);
  });

  it("ignores garments with no captured measurement at all", () => {
    const bare: EaseObservation[] = [
      { category: "tshirt", garmentChestCm: null, garmentMeasuredFrom: "page", fitDirection: 0 },
      { category: "tshirt", fitDirection: 0 },
    ];
    expect(personalEaseTarget(bare, BODY).targetCm).toBeNull();
  });
});

describe("personalEaseTarget — what it learns", () => {
  it("reads the ease straight off garments the user called just right", () => {
    // Three tees at 110 on a 100 chest, all reported centred: they wear +10.
    const p = personalEaseTarget([tee(110), tee(110), tee(110)], BODY);
    expect(p.targetCm).toBeCloseTo(10, 6);
    expect(p.spreadCm).toBeCloseTo(0, 6);
  });

  it("corrects UPWARD when the user says a garment ran tight", () => {
    // They wear +8 but call it too tight, so their real target is above 8. This
    // correction is the entire reason a signed direction is worth collecting.
    const snug = personalEaseTarget([tee(108, -10), tee(108, -10)], BODY);
    expect(snug.targetCm!).toBeGreaterThan(8);
    expect(snug.targetCm!).toBeCloseTo(8 + LADDER_STEP_CHEST_CM, 6);
  });

  it("corrects DOWNWARD when the user says a garment ran loose", () => {
    const loose = personalEaseTarget([tee(116, 10), tee(116, 10)], BODY);
    expect(loose.targetCm!).toBeLessThan(16);
    expect(loose.targetCm!).toBeCloseTo(16 - LADDER_STEP_CHEST_CM, 6);
  });

  it("normalises the garment TYPE out, so a coat and a tee are comparable", () => {
    // A coat at +16 and a tee at +10 describe the SAME preference once the
    // category's own allowance (coat +8) is removed.
    const mixed = personalEaseTarget(
      [
        { category: "coat", garmentChestCm: 118, garmentMeasuredFrom: "page", fitDirection: 0 },
        tee(110),
      ],
      BODY,
    );
    expect(mixed.spreadCm).toBeCloseTo(0, 6);
    expect(mixed.targetCm).toBeCloseTo(10, 6);
  });

  it("uses the median, so one mis-entered garment cannot drag the target", () => {
    const withTypo = personalEaseTarget([tee(110), tee(110), tee(110), tee(400)], BODY);
    expect(withTypo.targetCm!).toBeLessThan(15);
  });
});

describe("personalEaseTarget — trust falls when the garments disagree", () => {
  it("weights a consistent closet highly and a scattered one low", () => {
    const agree = personalEaseTarget([tee(110), tee(110), tee(110), tee(110)], BODY);
    const scatter = personalEaseTarget([tee(104), tee(110), tee(116), tee(122)], BODY);
    expect(agree.weight).toBeCloseTo(1, 6);
    expect(scatter.weight).toBeLessThan(agree.weight);
  });

  it("reaches full weight only at the stated evidence bar", () => {
    expect(FULL_EVIDENCE).toBe(4);
    const two = personalEaseTarget([tee(110), tee(110)], BODY);
    const four = personalEaseTarget([tee(110), tee(110), tee(110), tee(110)], BODY);
    expect(two.weight).toBeLessThan(four.weight);
    expect(four.weight).toBeCloseTo(1, 6);
  });

  it("gives no weight at all to garments that disagree by a whole size", () => {
    const wild = personalEaseTarget(
      [tee(90), tee(110), tee(130), tee(150)], BODY,
    );
    expect(wild.weight).toBe(0);
  });
});

describe("resolveEase — what the engine actually scores with", () => {
  it("falls back to the stated preference with no learned target", () => {
    const r = resolveEase("regular", personalEaseTarget([tee(110)], BODY));
    expect(r.easeCm).toBe(easeChestCm("regular"));
    expect(r.personalised).toBe(false);
    expect(r.reason).toBeNull();
  });

  it("moves the ease towards what the user actually wears", () => {
    // Stated "regular" is 10cm; this closet says they live at 16.
    const learned = personalEaseTarget([tee(116), tee(116), tee(116), tee(116)], BODY);
    const r = resolveEase("regular", learned);
    expect(r.personalised).toBe(true);
    expect(r.easeCm).toBeGreaterThan(easeChestCm("regular"));
    expect(r.reason).toContain("4 garments");
  });

  it("NEVER moves more than one ladder step from the stated preference", () => {
    // The cap that matters: no learned signal moves a recommendation by more
    // than one size on its own. Same ceiling brandBias applies.
    const extreme = personalEaseTarget([tee(160), tee(160), tee(160), tee(160)], BODY);
    const r = resolveEase("slim", extreme);
    expect(r.easeCm).toBeLessThanOrEqual(easeChestCm("slim") + LADDER_STEP_CHEST_CM);
    const tight = personalEaseTarget([tee(80), tee(80), tee(80), tee(80)], BODY);
    const r2 = resolveEase("oversized", tight);
    expect(r2.easeCm).toBeGreaterThanOrEqual(easeChestCm("oversized") - LADDER_STEP_CHEST_CM);
  });

  it("does not claim to have personalised a change nobody could wear", () => {
    // The closet agrees with the stated preference — say so by staying quiet.
    const same = personalEaseTarget([tee(110), tee(110), tee(110), tee(110)], BODY);
    const r = resolveEase("regular", same);
    expect(r.personalised).toBe(false);
    expect(r.easeCm).toBe(easeChestCm("regular"));
  });

  it("explains itself in plain language whenever it acts", () => {
    const learned = personalEaseTarget([tee(118), tee(118), tee(118), tee(118)], BODY);
    const r = resolveEase("regular", learned);
    expect(r.reason).toBeTruthy();
    expect(r.reason).toMatch(/more room/);
    expect(r.reason).toMatch(/closet/);
  });
});
