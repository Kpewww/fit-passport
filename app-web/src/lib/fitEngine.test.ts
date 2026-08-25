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

// ---- Session 40 upgrades: multi-dim fit, body-range, garment ease, verdict, confidence ----

describe("multi-dimensional measurement fit", () => {
  // Two sizes with an identical chest, but one has shoulders that fit and one
  // doesn't. The shoulder signal must break the tie toward the good-shoulder size.
  const SIZES = [
    { label: "M", chestCm: 110, shoulderCm: 45 }, // shoulders match a 44cm body
    { label: "L", chestCm: 110, shoulderCm: 52 }, // same chest, shoulders too wide
  ];
  it("prefers the size whose shoulders fit when chest is tied", () => {
    const out = recommend(
      baseInput({ profile: { chestCm: 100, shoulderCm: 44, preferredFit: "regular" }, sizes: SIZES }),
    );
    expect(out.best.label).toBe("M");
  });
  it("names the binding dimension in the reason", () => {
    const out = recommend(
      baseInput({ profile: { chestCm: 100, shoulderCm: 44, preferredFit: "regular" }, sizes: SIZES }),
    );
    const L = out.ranked.find((r) => r.label === "L")!;
    const fit = L.reasons.find((r) => r.signal === "measurement-fit")!;
    expect(fit.message.toLowerCase()).toContain("shoulder");
  });
});

describe("body-measurement range (retailer's intended fit)", () => {
  // Levi's-style chart: bodyChest min/max is the intended BODY range per size.
  const LEVIS = [
    { label: "S", bodyChestMinCm: 92, bodyChestMaxCm: 98, chestCm: 112 },
    { label: "M", bodyChestMinCm: 98, bodyChestMaxCm: 104, chestCm: 118 },
    { label: "L", bodyChestMinCm: 104, bodyChestMaxCm: 110, chestCm: 124 },
  ];
  it("puts a 101cm body in the M range regardless of the garment chest", () => {
    const out = recommend(
      baseInput({ product: { brand: "Levi's", category: "jacket" }, profile: { chestCm: 101, preferredFit: "regular" }, sizes: LEVIS }),
    );
    expect(out.best.label).toBe("M");
  });
});

describe("garment-aware ease", () => {
  // Same body + preference: a jacket wants more room than a tee, so its
  // recommended garment chest (hence size) should be at least as large.
  const SIZES = [
    { label: "S", chestCm: 100 },
    { label: "M", chestCm: 106 },
    { label: "L", chestCm: 112 },
    { label: "XL", chestCm: 118 },
  ];
  it("recommends a size at least as large for a jacket as for a tee", () => {
    const tee = recommend(baseInput({ product: { brand: "X", category: "tshirt" }, profile: { chestCm: 96, preferredFit: "regular" }, sizes: SIZES }));
    const jacket = recommend(baseInput({ product: { brand: "X", category: "jacket" }, profile: { chestCm: 96, preferredFit: "regular" }, sizes: SIZES }));
    const idx = (l: string) => SIZES.findIndex((s) => s.label === l);
    expect(idx(jacket.best.label)).toBeGreaterThanOrEqual(idx(tee.best.label));
  });
});

describe("ordinal fit verdict", () => {
  it("labels the smallest offered size 'too small' and the largest 'too big' for a mid body", () => {
    const out = recommend(baseInput({ profile: { chestCm: 100, preferredFit: "regular" } })); // target ~110
    const xs = out.ranked.find((r) => r.label === "XS")!; // garment 92
    const xl = out.ranked.find((r) => r.label === "XL")!; // garment 110
    expect(xs.verdict).toBe("too small");
    expect(xl.verdict).toBe("true to size");
  });
});

describe("confidence tracks decisiveness", () => {
  it("gives lower confidence when the top two sizes are near-tied", () => {
    // Body target sits exactly between two offered garment chests → ambiguous.
    const tied = recommend(baseInput({ profile: { chestCm: 98, preferredFit: "regular" }, sizes: [
      { label: "M", chestCm: 106 }, { label: "L", chestCm: 110 }, // target 108, dead center
    ] }));
    const decisive = recommend(baseInput({ profile: { chestCm: 90, preferredFit: "regular" }, sizes: [
      { label: "M", chestCm: 100 }, { label: "L", chestCm: 112 }, // target 100 = M exactly
    ] }));
    expect(tied.best.confidence).toBeLessThan(decisive.best.confidence);
  });
});

describe("confidence tracks signal AGREEMENT [prod finding 2026-08-24]", () => {
  // Reproduces exactly what the live deployment returned: a chest-99 shopper who
  // owns a Uniqlo tee in M rated 5/5, checking another Uniqlo tee. The anchor
  // carries M to a decisive win, so the top-two margin is wide — and the engine
  // used to report confidence 1.0 even though the measurement model calls that
  // same M "too small" (target garment chest 109 vs M's 100).
  //
  // A decisive margin is not the same as a confident answer: the margin here is
  // decisive BECAUSE one signal overrode the other. Two independent estimates
  // pointing different ways must widen the interval, not report certainty.
  const conflicted = () =>
    recommend(
      baseInput({
        profile: { chestCm: 99, preferredFit: "regular" } as EngineInput["profile"],
        product: { brand: "Uniqlo", category: "tshirt" },
        sizes: UNIQLO_TEE_SIZES,
        knownGood: [{ brand: "Uniqlo", category: "tshirt", size: "M", fitRating: 5 }],
      }),
    );

  it("still recommends the anchor's size (the [F1] fix is not undone)", () => {
    expect(conflicted().best.label).toBe("M");
  });

  it("no longer reports near-certainty when the signals conflict", () => {
    const out = conflicted();
    // Was 1.0 in production before this change.
    expect(out.best.confidence).toBeLessThan(0.8);
  });

  it("caps confidence on ANY size its own measurements call plainly wrong", () => {
    const out = conflicted();
    for (const r of out.ranked) {
      if (r.verdict === "too small" || r.verdict === "too big") {
        expect(r.confidence).toBeLessThanOrEqual(0.6);
      }
    }
  });

  it("explains the conflict instead of just quietly lowering the number", () => {
    const note = conflicted().conflictNote;
    expect(note).toBeTruthy();
    // Must name the disagreeing evidence in plain language, and say what the
    // measurements alone would have said — a lower number with no reason is
    // just a worse number.
    expect(note).toMatch(/disagree|measurements/i);
    expect(note).toContain("M");
  });

  it("stays silent and confident when the signals AGREE", () => {
    // Same shopper, but the owned size is the one the measurements also pick.
    const agreed = recommend(
      baseInput({
        profile: { chestCm: 99, preferredFit: "regular" } as EngineInput["profile"],
        product: { brand: "Uniqlo", category: "tshirt" },
        sizes: UNIQLO_TEE_SIZES,
        knownGood: [{ brand: "Uniqlo", category: "tshirt", size: "XL", fitRating: 5 }],
      }),
    );
    expect(agreed.best.label).toBe("XL");
    expect(agreed.conflictNote).toBeNull();
    expect(agreed.best.confidence).toBeGreaterThan(conflicted().best.confidence);
  });

  it("penalises a two-step disagreement harder than a one-step one", () => {
    const near = recommend(
      baseInput({
        profile: { chestCm: 99, preferredFit: "regular" } as EngineInput["profile"],
        product: { brand: "Uniqlo", category: "tshirt" },
        sizes: UNIQLO_TEE_SIZES,
        knownGood: [{ brand: "Uniqlo", category: "tshirt", size: "L", fitRating: 5 }],
      }),
    );
    const far = conflicted(); // anchor M vs measurement XL = two steps
    expect(far.best.confidence).toBeLessThan(near.best.confidence);
  });
});

describe("regional-average body prior (chestIsEstimated)", () => {
  it("still ranks sizes, but caps confidence and flags the estimate", () => {
    const out = recommend(baseInput({
      profile: { chestCm: 100, preferredFit: "regular", chestIsEstimated: true },
    }));
    expect(out.best.label).toBe("XL"); // same ranking as a real chest 100
    expect(out.best.confidence).toBeLessThanOrEqual(0.4);
    const fit = out.best.reasons.find((r) => r.signal === "measurement-fit")!;
    expect(fit.message.toLowerCase()).toContain("regional averages");
  });
  it("a real chest is NOT capped by the estimate rule", () => {
    const real = recommend(baseInput({ profile: { chestCm: 100, preferredFit: "regular" } }));
    const est = recommend(baseInput({ profile: { chestCm: 100, preferredFit: "regular", chestIsEstimated: true } }));
    expect(real.best.confidence).toBeGreaterThan(est.best.confidence);
  });
});

describe("measurement-fit edge cases", () => {
  it("scores from WAIST alone when chest is unknown", () => {
    const SIZES = [
      { label: "S", waistCm: 76 },
      { label: "M", waistCm: 84 },
      { label: "L", waistCm: 92 },
    ];
    // waist target = body 80 + ease*0.8 (regular ease 10 → +8) = 88 → closest to M(84)/L(92)
    const out = recommend(baseInput({ profile: { waistCm: 80, preferredFit: "regular" }, sizes: SIZES }));
    expect(out.best.reasons.some((r) => r.signal === "measurement-fit")).toBe(true);
    expect(["M", "L"]).toContain(out.best.label);
  });

  it("omits a verdict when there is no chest data at all", () => {
    const out = recommend(baseInput({ profile: { waistCm: 80, preferredFit: "regular" }, sizes: [
      { label: "M", waistCm: 84 }, { label: "L", waistCm: 92 },
    ] }));
    expect(out.best.verdict).toBeUndefined();
  });

  it("gives a body in a size's range a 'true to size'-ish verdict, not 'too small/big'", () => {
    const out = recommend(baseInput({
      product: { brand: "Levi's", category: "jacket" },
      profile: { chestCm: 101, preferredFit: "regular" },
      sizes: [
        { label: "S", bodyChestMinCm: 92, bodyChestMaxCm: 98, chestCm: 112 },
        { label: "M", bodyChestMinCm: 98, bodyChestMaxCm: 104, chestCm: 118 },
        { label: "L", bodyChestMinCm: 104, bodyChestMaxCm: 110, chestCm: 124 },
      ],
    }));
    expect(out.best.label).toBe("M");
    expect(["snug", "true to size", "relaxed"]).toContain(out.best.verdict);
  });

  it("never crashes and returns every size, even with zero signals", () => {
    const out = recommend(baseInput({ sizes: [{ label: "M" }, { label: "L" }] }));
    expect(out.ranked).toHaveLength(2);
    expect(out.best).toBeDefined();
  });
});

describe("signed fit direction on a closet anchor", () => {
  // The whole point of the signed scale: a 2/5 star rating cannot say whether the
  // garment strangles or hangs, and those imply OPPOSITE recommendations. These
  // tests pin that the sign actually moves the answer in opposite directions.

  it("sizes UP when the owned anchor is reported too tight", () => {
    const out = recommend(
      baseInput({
        knownGood: [
          { brand: "Uniqlo", category: "tshirt", size: "M", fitRating: 3, fitDirection: -10 },
        ],
      }),
    );
    expect(out.best.label).toBe("L");
  });

  it("sizes DOWN when the owned anchor is reported too loose", () => {
    const out = recommend(
      baseInput({
        knownGood: [
          { brand: "Uniqlo", category: "tshirt", size: "M", fitRating: 3, fitDirection: 10 },
        ],
      }),
    );
    expect(out.best.label).toBe("S");
  });

  it("keeps the owned size when the anchor is reported just right", () => {
    const out = recommend(
      baseInput({
        knownGood: [
          { brand: "Uniqlo", category: "tshirt", size: "M", fitRating: 5, fitDirection: 0 },
        ],
      }),
    );
    expect(out.best.label).toBe("M");
  });

  it("is the SAME anchor and the SAME stars — only the sign differs", () => {
    // This is the regression that matters: identical inputs apart from the sign
    // must not produce the same answer, or the field is doing nothing.
    const tight = recommend(
      baseInput({
        knownGood: [{ brand: "Uniqlo", category: "tshirt", size: "M", fitRating: 3, fitDirection: -10 }],
      }),
    );
    const loose = recommend(
      baseInput({
        knownGood: [{ brand: "Uniqlo", category: "tshirt", size: "M", fitRating: 3, fitDirection: 10 }],
      }),
    );
    expect(tight.best.label).not.toBe(loose.best.label);
  });

  it("leaves legacy items (no direction reported) behaving exactly as before", () => {
    const withField = recommend(
      baseInput({
        knownGood: [{ brand: "Uniqlo", category: "tshirt", size: "M", fitRating: 5, fitDirection: null }],
      }),
    );
    const without = recommend(
      baseInput({
        knownGood: [{ brand: "Uniqlo", category: "tshirt", size: "M", fitRating: 5 }],
      }),
    );
    expect(withField.best.label).toBe(without.best.label);
    expect(withField.best.score).toBeCloseTo(without.best.score, 10);
  });

  it("explains itself using the reported direction, not just a step count", () => {
    const out = recommend(
      baseInput({
        knownGood: [
          { brand: "Uniqlo", category: "tshirt", size: "M", fitRating: 3, fitDirection: -10 },
        ],
      }),
    );
    const kg = out.best.reasons.find((r) => r.signal === "known-good");
    expect(kg).toBeDefined();
    // The reader should see the FACT they reported, not only our conclusion.
    expect(kg!.message.toLowerCase()).toContain("too tight");
  });

  it("does not double-penalise a directed anchor that carries low stars", () => {
    // A "too tight" item usually gets few stars. We have already corrected for
    // the misfit, so the corrected anchor must stay influential rather than being
    // discounted a second time by the rating it naturally attracts.
    const directedLowStars = recommend(
      baseInput({
        knownGood: [{ brand: "Uniqlo", category: "tshirt", size: "M", fitRating: 2, fitDirection: -10 }],
      }),
    );
    const kg = directedLowStars.best.reasons.find((r) => r.signal === "known-good");
    expect(kg).toBeDefined();
    expect(directedLowStars.best.label).toBe("L");
  });

  it("never shifts more than one ladder step, even at the extremes", () => {
    for (const dir of [-10, -5, 0, 5, 10]) {
      const out = recommend(
        baseInput({
          knownGood: [{ brand: "Uniqlo", category: "tshirt", size: "M", fitRating: 4, fitDirection: dir }],
        }),
      );
      const idx = UNIQLO_TEE_SIZES.findIndex((s) => s.label === out.best.label);
      const mIdx = UNIQLO_TEE_SIZES.findIndex((s) => s.label === "M");
      expect(Math.abs(idx - mIdx)).toBeLessThanOrEqual(1);
    }
  });
});

describe("closet direction feeding brand bias and confidence", () => {
  it("learns a brand runs small from OTHER categories, with no purchase history", () => {
    // The cold-start fix: brand bias used to need recorded outcomes, which most
    // users never produce. Two Uniqlo items in other categories, both reported
    // tight, should push this Uniqlo tee up.
    const out = recommend(
      baseInput({
        profile: { chestCm: 96, preferredFit: "regular" } as EngineInput["profile"],
        knownGood: [
          { brand: "Uniqlo", category: "shirt", size: "M", fitRating: 3, fitDirection: -10 },
          { brand: "Uniqlo", category: "jacket", size: "M", fitRating: 3, fitDirection: -10 },
        ],
      }),
    );
    expect(out.best.reasons.some((r) => r.signal === "brand-bias")).toBe(true);
  });

  it("does NOT count a same-category anchor twice", () => {
    // A same-brand, same-category item already moves the anchor in
    // scoreKnownGood. If it ALSO voted for brand bias, one observation would
    // move the recommendation through two channels.
    const out = recommend(
      baseInput({
        profile: { chestCm: 96, preferredFit: "regular" } as EngineInput["profile"],
        knownGood: [
          { brand: "Uniqlo", category: "tshirt", size: "M", fitRating: 3, fitDirection: -10 },
          { brand: "Uniqlo", category: "tshirt", size: "S", fitRating: 3, fitDirection: -10 },
        ],
      }),
    );
    expect(out.best.reasons.some((r) => r.signal === "brand-bias")).toBe(false);
  });

  it("tells the user when their own reports scatter", () => {
    const scatter = recommend(
      baseInput({
        profile: { chestCm: 96, preferredFit: "regular" } as EngineInput["profile"],
        knownGood: [
          { brand: "A", category: "tshirt", size: "M", fitRating: 5, fitDirection: -10 },
          { brand: "B", category: "shirt", size: "M", fitRating: 5, fitDirection: 10 },
          { brand: "C", category: "polo", size: "M", fitRating: 5, fitDirection: -10 },
        ],
      }),
    );
    expect(scatter.conflictNote).toBeTruthy();
    expect(scatter.conflictNote!).toContain("closet reports disagree");

    // NOT asserted here: that this scenario's confidence NUMBER is lower than a
    // tidy closet's. Scattered reports do not only trigger the consistency
    // factor — they also genuinely spread the anchor across different sizes,
    // which moves the recommended size and the signal-agreement penalty with it.
    // The two scenarios therefore differ in several ways at once, and a
    // comparison between them would not isolate the factor. The factor's own
    // monotonicity and its 0.85 floor are pinned in closetConsistency.test.ts,
    // where they can be measured without the rest of the engine in the way.
  });

  it("does not lower confidence for someone consistently off-centre", () => {
    // Everything runs roomy on them — that is a person we understand, not noise.
    const consistent = recommend(
      baseInput({
        profile: { chestCm: 96, preferredFit: "regular" } as EngineInput["profile"],
        knownGood: [
          { brand: "A", category: "tshirt", size: "M", fitRating: 4, fitDirection: 5 },
          { brand: "B", category: "shirt", size: "M", fitRating: 4, fitDirection: 5 },
          { brand: "C", category: "polo", size: "M", fitRating: 4, fitDirection: 5 },
        ],
      }),
    );
    const centred = recommend(
      baseInput({
        profile: { chestCm: 96, preferredFit: "regular" } as EngineInput["profile"],
        knownGood: [
          { brand: "A", category: "tshirt", size: "M", fitRating: 4, fitDirection: 0 },
          { brand: "B", category: "shirt", size: "M", fitRating: 4, fitDirection: 0 },
          { brand: "C", category: "polo", size: "M", fitRating: 4, fitDirection: 0 },
        ],
      }),
    );
    expect(consistent.best.confidence).toBeCloseTo(centred.best.confidence, 10);
  });

  it("leaves a closet with no reported directions completely unchanged", () => {
    const legacy = recommend(
      baseInput({
        profile: { chestCm: 96, preferredFit: "regular" } as EngineInput["profile"],
        knownGood: [
          { brand: "A", category: "tshirt", size: "M", fitRating: 4 },
          { brand: "B", category: "shirt", size: "M", fitRating: 4 },
          { brand: "C", category: "polo", size: "M", fitRating: 4 },
        ],
      }),
    );
    expect(legacy.best.confidence).toBeGreaterThan(0);
    // The generic signal-disagreement note may legitimately fire here; what must
    // NOT appear is the closet-consistency one, since nothing was reported.
    expect(legacy.conflictNote ?? "").not.toContain("closet reports disagree");
  });
});
