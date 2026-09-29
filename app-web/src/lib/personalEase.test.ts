import { recommend } from "./fitEngine";
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

// Each report is an interval of preferred ease, so reports that cannot all be true
// of one person are caught instead of averaged. Body chest 100 cm throughout;
// "observed" = garment chest − 100 for a tee.
describe("fit reports as intervals — contradictions are caught, not averaged", () => {
  const tee = (garmentChestCm: number, fitDirection: number) => ({
    category: "tshirt", garmentChestCm, garmentMeasuredFrom: "page", fitDirection,
  });

  it("refuses to learn from two reports that cannot both be true", () => {
    // "Too tight" with 14 cm of room means they want at least ~20; "just right"
    // with 16 cm means they want ~16. Averaged, that was a confident ~19.
    const learned = personalEaseTarget([tee(114, -10), tee(116, 0)], 100);
    expect(learned.contradiction).toBe(true);
    expect(learned.targetCm).toBeNull();
    const r = resolveEase("regular", learned);
    expect(r.easeCm).toBe(10); // the stated preference, unchanged
    expect(r.contradiction).toMatch(/contradict each other/);
  });

  it("leaves out the one report that contradicts a consistent majority, and says so", () => {
    const learned = personalEaseTarget(
      [tee(112, 0), tee(113, 0), tee(111, 0), tee(102, 10)], // the last: "too loose" on 2 cm of room
      100,
    );
    expect(learned.contradiction).toBe(false);
    expect(learned.excluded).toBe(1);
    expect(learned.evidence).toBe(3);
    expect(learned.targetCm!).toBeGreaterThan(10.5); // ~12, the three agreeing tees
    expect(resolveEase("regular", learned).reason).toMatch(/1 garment left out/);
  });

  it("treats the extremes as open-ended, so 'too tight' agrees with a milder report above it", () => {
    // "Too tight" at +8 says "at least a step more"; "a bit snug" at +12 says
    // "a little more than 12". Both hold for ~16: no contradiction.
    const learned = personalEaseTarget([tee(108, -10), tee(112, -5)], 100);
    expect(learned.contradiction).toBe(false);
    expect(learned.excluded).toBe(0);
  });

  it("chooses the same consistent set whatever order the closet lists them in", () => {
    const a = [tee(112, 0), tee(113, 0), tee(111, 0), tee(102, 10)];
    const b = [a[3], a[1], a[0], a[2]];
    expect(personalEaseTarget(b, 100)).toEqual(personalEaseTarget(a, 100));
  });

  it("puts the contradiction in the recommendation's explanation", () => {
    const out = recommend({
      profile: { chestCm: 100, preferredFit: "regular" },
      product: { brand: "Nike", category: "tshirt" },
      sizes: [{ label: "M", chestCm: 110 }, { label: "L", chestCm: 118 }],
      knownGood: [
        { brand: "Uniqlo", category: "tshirt", size: "M", fitRating: 2, fitDirection: -10, garmentChestCm: 114, garmentMeasuredFrom: "page" },
        { brand: "Gap", category: "tshirt", size: "M", fitRating: 5, fitDirection: 0, garmentChestCm: 116, garmentMeasuredFrom: "page" },
      ],
      outcomes: [],
    } as any);
    expect(out.conflictNote).toMatch(/contradict each other/);
  });

  // Found by the eval's adversarial persona (Session 78f): the explanation said
  // "we could not learn from these", while the closet still added its full
  // confidence weight — 46% → 75% for one persona. Reports that cannot all be true
  // do not tell us who the wearer is, so they earn no confidence.
  it("earns no confidence for a closet whose reports contradict each other", () => {
    const input = (knownGood: unknown[]) => ({
      profile: { chestCm: 100, preferredFit: "regular" },
      product: { brand: "Nike", category: "tshirt" },
      sizes: [{ label: "M", chestCm: 110 }, { label: "L", chestCm: 118 }],
      knownGood,
      outcomes: [],
    }) as any;
    const empty = recommend(input([]));
    const contradictory = recommend(input([
      { brand: "Uniqlo", category: "tshirt", size: "M", fitRating: 2, fitDirection: -10, garmentChestCm: 114, garmentMeasuredFrom: "page" },
      { brand: "Gap", category: "tshirt", size: "M", fitRating: 5, fitDirection: 0, garmentChestCm: 116, garmentMeasuredFrom: "page" },
    ]));
    expect(contradictory.best.confidence).toBeLessThanOrEqual(empty.best.confidence);
    // Not learned from means not learned from anywhere: no anchor, no brand vote.
    // Every item here is measured, so the ranking is exactly the empty closet's.
    const scores = (o: typeof empty) => o.ranked.map((r) => [r.label, r.score, r.confidence]);
    expect(scores(contradictory)).toEqual(scores(empty));

    // Control, so the rule cannot pass by switching the closet off: reports that
    // agree still earn it.
    const agreeing = recommend(input([
      { brand: "Uniqlo", category: "tshirt", size: "M", fitRating: 5, fitDirection: 0, garmentChestCm: 110, garmentMeasuredFrom: "page" },
      { brand: "Gap", category: "tshirt", size: "M", fitRating: 5, fitDirection: 0, garmentChestCm: 111, garmentMeasuredFrom: "page" },
    ]));
    expect(agreeing.best.confidence).toBeGreaterThan(empty.best.confidence);
  });
});

describe("a report no real preference could produce", () => {
  it("is left out and counted, instead of dragging the target", () => {
    // Garment chest 250 on a 100 cm body: 150 cm of "room". A wrong number, or a
    // deliberate one — either way not a preference to learn from.
    const tee = (g: number, d: number) => ({ category: "tshirt", garmentChestCm: g, garmentMeasuredFrom: "page", fitDirection: d });
    const learned = personalEaseTarget([tee(111, 0), tee(112, 0), tee(113, 0), tee(250, 0)], 100);
    expect(learned.excluded).toBe(1);
    expect(learned.targetCm!).toBeLessThan(14);
  });

  it("learns nothing when the absurd reports are the majority", () => {
    // Two garments entered at 250 cm agree with EACH OTHER, so without a
    // plausibility bound they would form the consistent majority and the learned
    // target would be ~150 cm of room — the deliberate-nonsense case.
    const tee = (g: number, d: number) => ({ category: "tshirt", garmentChestCm: g, garmentMeasuredFrom: "page", fitDirection: d });
    const learned = personalEaseTarget([tee(250, 0), tee(252, 0), tee(112, 0)], 100);
    expect(learned.targetCm).toBeNull();
    expect(learned.excluded).toBe(2);
    expect(resolveEase("regular", learned).easeCm).toBe(10);
  });
});
