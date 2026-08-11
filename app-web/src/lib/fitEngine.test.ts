// Unit tests for the transparent fit engine.
// These tests are also the executable spec of engine behavior — they encode
// what "sensible" looks like so we can iterate on weights without regressions.
//
// NOTE ON CHART SEMANTICS:
// SizeOption.chestCm is the *garment* chest (flat measurement), not body chest.
// The engine adds ease from the user's preferredFit to their body chest to
// compute a target garment chest. So a size labelled M with garment chest 100cm
// is a tight T-shirt for a body-chest-100cm shopper wanting "regular" fit,
// which needs ~10cm ease → target garment chest ~110cm → XL.

import { describe, expect, it } from "vitest";
import { recommend, type EngineInput } from "./fitEngine";

// Approximated Uniqlo AIRism T-shirt garment measurements.
const UNIQLO_TEE_SIZES = [
  { label: "XS", chestCm: 92 },
  { label: "S", chestCm: 96 },
  { label: "M", chestCm: 100 },
  { label: "L", chestCm: 104 },
  { label: "XL", chestCm: 110 },
];

const COS_SHIRT_SIZES = [
  { label: "EU 44", chestCm: 102 },
  { label: "EU 46", chestCm: 106 },
  { label: "EU 48", chestCm: 110 },
  { label: "EU 50", chestCm: 114 },
  { label: "EU 52", chestCm: 118 },
];

function baseInput(overrides: Partial<EngineInput> = {}): EngineInput {
  return {
    profile: {
      chestCm: null,
      waistCm: null,
      shoulderCm: null,
      preferredFit: "regular",
      ...(overrides.profile ?? {}),
    },
    product: { brand: "Uniqlo", category: "tshirt", ...(overrides.product ?? {}) },
    sizes: overrides.sizes ?? UNIQLO_TEE_SIZES,
    knownGood: overrides.knownGood ?? [],
    outcomes: overrides.outcomes ?? [],
  };
}

describe("cold-start behavior", () => {
  it("returns SOMETHING even with no data (never crashes)", () => {
    const out = recommend(baseInput());
    expect(out.ranked.length).toBe(UNIQLO_TEE_SIZES.length);
    expect(out.best).toBeDefined();
    // Confidence should be low when we know nothing.
    expect(out.best.confidence).toBeLessThan(0.5);
  });

  it("uses a known-good Uniqlo M to anchor even with no body measurements", () => {
    const out = recommend(
      baseInput({
        knownGood: [
          { brand: "Uniqlo", category: "tshirt", size: "M", fitRating: 5 },
        ],
      }),
    );
    expect(out.best.label).toBe("M");
  });
});

describe("anchor dominance [F1]", () => {
  // Regression for the walkthrough finding on 2026-08-10: a chest-95 user with a
  // known-good COS EU 48 (fit 4/5) was recommended EU 44 because COS's chart runs
  // loose and the chest signal outweighed the anchor. With a REGULAR (neutral)
  // preference, a strong same-brand + same-category anchor must win at its size.
  it("recommends the owned size at a regular preference", () => {
    const out = recommend(
      baseInput({
        profile: { chestCm: 95, preferredFit: "regular" } as EngineInput["profile"],
        product: { brand: "COS", category: "shirt" },
        sizes: COS_SHIRT_SIZES,
        knownGood: [
          { brand: "COS", category: "shirt", size: "EU 48", fitRating: 4 },
        ],
      }),
    );
    expect(out.best.label).toBe("EU 48");
    expect(out.best.reasons.some((r) => r.signal === "known-good")).toBe(true);
  });

  it("does NOT over-trust a low-rated anchor (fit 2/5 stays measurement-led)", () => {
    const out = recommend(
      baseInput({
        profile: { chestCm: 95, preferredFit: "slim" } as EngineInput["profile"],
        product: { brand: "COS", category: "shirt" },
        sizes: COS_SHIRT_SIZES,
        knownGood: [
          // A poorly-fitting EU 48 should not dominate — it isn't a good anchor.
          { brand: "COS", category: "shirt", size: "EU 48", fitRating: 2 },
        ],
      }),
    );
    // slim target garment chest = 95 + 6 = 101 → EU 44 (102) is the closest.
    expect(out.best.label).toBe("EU 44");
  });

  it("a cross-brand-only anchor does NOT trigger anchor dominance", () => {
    const out = recommend(
      baseInput({
        profile: { chestCm: 95, preferredFit: "slim" } as EngineInput["profile"],
        product: { brand: "COS", category: "shirt" },
        sizes: COS_SHIRT_SIZES,
        knownGood: [
          { brand: "Uniqlo", category: "shirt", size: "M", fitRating: 5 },
        ],
      }),
    );
    // Falls back to chest-led: target 101 → EU 44.
    expect(out.best.label).toBe("EU 44");
  });
});

describe("fit preference moves a strong anchor [Hermes bug 2026-08-10]", () => {
  // Reported: closet has Hermes shirt L (5/5); every fit preference returned L
  // on a Hermes shirt because the anchor dominated so hard the preference toggle
  // did nothing. Fixed: a strong anchor sets the baseline, preference shifts it.
  const HERMES_SIZES = [
    { label: "XS", chestCm: 96 },
    { label: "S", chestCm: 100 },
    { label: "M", chestCm: 104 },
    { label: "L", chestCm: 108 },
    { label: "XL", chestCm: 112 },
  ];
  const anchoredInput = (fit: EngineInput["profile"]["preferredFit"]) =>
    baseInput({
      profile: { chestCm: 100, preferredFit: fit } as EngineInput["profile"],
      product: { brand: "Hermes", category: "shirt" },
      sizes: HERMES_SIZES,
      knownGood: [{ brand: "Hermes", category: "shirt", size: "L", fitRating: 5 }],
    });

  it("regular preference lands on the anchor size L", () => {
    expect(recommend(anchoredInput("regular")).best.label).toBe("L");
  });

  it("slim preference sizes down from the anchor", () => {
    expect(recommend(anchoredInput("slim")).best.label).toBe("M");
  });

  it("oversized preference sizes up from the anchor", () => {
    // L is index 3; oversized shift +2 → XL (index 4) is as far up as the chart goes.
    expect(recommend(anchoredInput("oversized")).best.label).toBe("XL");
  });

  it("the four preferences do not all collapse to the same size", () => {
    const labels = (["slim", "regular", "relaxed", "oversized"] as const).map(
      (f) => recommend(anchoredInput(f)).best.label,
    );
    expect(new Set(labels).size).toBeGreaterThan(1);
  });
});

describe("measurement-driven ranking", () => {
  it("chest 100 + regular targets garment ~110 → prefers XL on Uniqlo tee", () => {
    const out = recommend(
      baseInput({ profile: { chestCm: 100, preferredFit: "regular" } as EngineInput["profile"] }),
    );
    // Regular ease = 10cm → target garment chest ~110cm → XL is the exact match.
    expect(out.best.label).toBe("XL");
  });

  it("chest 90 + regular targets garment ~100 → prefers M on Uniqlo tee", () => {
    const out = recommend(
      baseInput({ profile: { chestCm: 90, preferredFit: "regular" } as EngineInput["profile"] }),
    );
    expect(out.best.label).toBe("M");
  });

  it("chest 100 + slim prefers a smaller size on a COS shirt", () => {
    const out = recommend(
      baseInput({
        profile: { chestCm: 100, preferredFit: "slim" } as EngineInput["profile"],
        product: { brand: "COS", category: "shirt" },
        sizes: COS_SHIRT_SIZES,
      }),
    );
    // slim = 6cm ease, target ~106cm garment chest → EU 46 is the exact match.
    expect(out.best.label).toBe("EU 46");
    // And EU 52 must be worse than EU 46.
    const eu46 = out.ranked.find((r) => r.label === "EU 46")!;
    const eu52 = out.ranked.find((r) => r.label === "EU 52")!;
    expect(eu46.score).toBeGreaterThan(eu52.score);
  });

  it("increasing looseness preference monotonically prefers larger sizes", () => {
    // Same body, escalating ease preference → target garment chest grows.
    // The recommended garment chest must not decrease.
    const chests: number[] = [];
    for (const pref of ["slim", "regular", "relaxed", "oversized"] as const) {
      const out = recommend(
        baseInput({
          profile: { chestCm: 90, preferredFit: pref } as EngineInput["profile"],
          sizes: UNIQLO_TEE_SIZES,
        }),
      );
      const size = UNIQLO_TEE_SIZES.find((s) => s.label === out.best.label)!;
      chests.push(size.chestCm);
    }
    for (let i = 1; i < chests.length; i++) {
      expect(chests[i]).toBeGreaterThanOrEqual(chests[i - 1]);
    }
    // And oversized must be strictly larger than slim.
    expect(chests[3]).toBeGreaterThan(chests[0]);
  });
});

describe("outcome learning", () => {
  it("a returned L with 'shoulders tight' pushes the recommendation down", () => {
    const outWithHistory = recommend(
      baseInput({
        profile: { chestCm: 100, preferredFit: "regular" } as EngineInput["profile"],
        knownGood: [
          { brand: "Uniqlo", category: "tshirt", size: "M", fitRating: 5 },
        ],
        outcomes: [
          {
            purchasedSize: "L",
            decision: "return",
            overallFit: 2,
            areaIssues: { shoulders: "tight" },
            productBrand: "Uniqlo",
            productCategory: "tshirt",
          },
        ],
      }),
    );
    // Should NOT recommend the returned L.
    expect(outWithHistory.best.label).not.toBe("L");
  });
});

describe("explanation", () => {
  it("produces a non-empty grounded explanation", () => {
    const out = recommend(
      baseInput({
        profile: { chestCm: 90, preferredFit: "regular" } as EngineInput["profile"],
        knownGood: [
          { brand: "Uniqlo", category: "tshirt", size: "M", fitRating: 5 },
        ],
      }),
    );
    expect(out.explanation.length).toBeGreaterThan(0);
    // At least one grounded reason line must appear (a bullet).
    expect(out.explanation).toContain("•");
  });
});

describe("cross-domain evidence [roadmap: only-shoes → shirt]", () => {
  it("flags cross-domain and caps confidence when the closet is a different domain", () => {
    const out = recommend(
      baseInput({
        profile: { chestCm: 95, preferredFit: "regular" } as EngineInput["profile"],
        product: { brand: "Uniqlo", category: "tshirt" },
        // Closet is entirely footwear — tells us nothing about a t-shirt.
        knownGood: [
          { brand: "Nike", category: "sneakers", size: "9", fitRating: 5 },
          { brand: "Adidas", category: "shoes", size: "10", fitRating: 5 },
        ],
      }),
    );
    expect(out.domainRelevance).toBe("cross");
    expect(out.domainNote).toBeTruthy();
    expect(out.best.confidence).toBeLessThanOrEqual(0.35);
  });

  it("does NOT flag when the closet has same-domain evidence", () => {
    const out = recommend(
      baseInput({
        product: { brand: "Uniqlo", category: "tshirt" },
        knownGood: [{ brand: "Uniqlo", category: "shirt", size: "M", fitRating: 5 }],
      }),
    );
    expect(out.domainRelevance).toBe("match");
    expect(out.domainNote).toBeNull();
  });

  it("reports empty when there is no closet at all", () => {
    const out = recommend(baseInput());
    expect(out.domainRelevance).toBe("empty");
    expect(out.domainNote).toBeNull();
  });
});
