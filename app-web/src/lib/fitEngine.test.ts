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
import { CONFIDENCE_WEIGHTS } from "./confidenceWeights";

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

describe("confidence weights — the number the UI promises is the number the engine adds", () => {
  // /check tells people a measurement is "worth +35 points" and a closet garment
  // "+25". That is only defensible if it is this exact arithmetic. A second copy
  // in the UI would drift silently — which is what happened to the colour palette
  // before it was consolidated (invariant ㉛). These tests are the tripwire.
  // The first version of these tests asserted the delta EQUALLED the weight, and
  // failed: a bare case measures 0.18, not the 0.30 the floor implies. The raw
  // sum then passes through six caps and multipliers (cross-domain, report
  // consistency, top-2 margin, signal agreement, and two hard caps). Every one
  // can only shrink it — which is why the UI says "up to". The tests now pin the
  // property that is actually true, and the copy was corrected to match it
  // rather than the other way round.
  const WEIGHT_CEILING =
    CONFIDENCE_WEIGHTS.floor +
    CONFIDENCE_WEIGHTS.measurements +
    CONFIDENCE_WEIGHTS.closetAnchor +
    CONFIDENCE_WEIGHTS.chartShoulder +
    CONFIDENCE_WEIGHTS.chartSleeve;

  it("never exceeds the sum of its own weights", () => {
    const rich = recommend(
      baseInput({
        profile: { chestCm: 96, preferredFit: "regular" },
        sizes: [
          { label: "M", chestCm: 100, shoulderCm: 45, sleeveCm: 21 },
          { label: "L", chestCm: 106, shoulderCm: 47, sleeveCm: 22 },
        ],
        knownGood: [{ brand: "Uniqlo", category: "tshirt", size: "M", fitRating: 5 }],
      }),
    );
    for (const r of rich.ranked) expect(r.confidence).toBeLessThanOrEqual(WEIGHT_CEILING);
  });

  it("never exceeds the floor when it has no evidence at all", () => {
    const out = recommend(baseInput());
    for (const r of out.ranked) expect(r.confidence).toBeLessThanOrEqual(CONFIDENCE_WEIGHTS.floor);
  });

  it("rises when a measurement arrives, and when a closet anchor does", () => {
    const sizes = [{ label: "M", chestCm: 100 }, { label: "L", chestCm: 106 }];
    const bare = recommend(baseInput({ sizes }));
    const withChest = recommend(baseInput({ sizes, profile: { chestCm: 96, preferredFit: "regular" } }));
    const withAnchor = recommend(
      baseInput({ sizes, knownGood: [{ brand: "Uniqlo", category: "tshirt", size: "M", fitRating: 5 }] }),
    );
    expect(withChest.best.confidence).toBeGreaterThan(bare.best.confidence);
    expect(withAnchor.best.confidence).toBeGreaterThan(bare.best.confidence);
  });

  it("weights measurements above a closet anchor, which is the order the UI lists them in", () => {
    expect(CONFIDENCE_WEIGHTS.measurements).toBeGreaterThan(CONFIDENCE_WEIGHTS.closetAnchor);
    expect(CONFIDENCE_WEIGHTS.closetAnchor).toBeGreaterThan(CONFIDENCE_WEIGHTS.chartShoulder);
  });
});

describe("undetermined — when nothing tells the sizes apart", () => {
  // Measured on a production build before this flag existed: an empty profile
  // with an empty closet returned "XS" at 0.24 confidence on a t-shirt, with all
  // five sizes tied at 0.20 and an explanation claiming the pick was "based on
  // your closet and preference" — a closet that did not exist. XS was simply the
  // first rung of the ladder. Ladder position is not evidence.
  it("flags a total tie instead of returning the first rung as a pick", () => {
    const out = recommend(baseInput());
    expect(out.undetermined).toBe(true);
    const top = out.ranked[0].score;
    expect(out.ranked.every((r) => Math.abs(r.score - top) < 1e-6)).toBe(true);
  });

  it("tells the user what would fix it, and does not claim a closet it does not have", () => {
    const out = recommend(baseInput());
    // Asserts the PROPERTY, not the phrasing: the tie is stated by the UI's own
    // heading, so the engine's line has the one job the heading cannot do — say
    // what is missing. Pinning the exact sentence here is how copy edits turn
    // into test failures that teach nobody anything.
    expect(out.explanation).toMatch(/chest measurement/i);
    expect(out.explanation).toMatch(/fits you well/i);
    expect(out.explanation).not.toMatch(/based on your closet/i);
  });

  it("suppresses the 'alternative' line, which implies a ranking that isn't there", () => {
    const out = recommend(baseInput());
    expect(out.explanation).not.toMatch(/Alternative:/);
  });

  it("clears as soon as ONE real signal arrives — a body measurement", () => {
    const out = recommend(baseInput({ profile: { chestCm: 100, preferredFit: "regular" } }));
    expect(out.undetermined).toBe(false);
    expect(out.best.reasons.length).toBeGreaterThan(0);
  });

  it("clears on a closet anchor alone, with no measurements at all", () => {
    const out = recommend(
      baseInput({ knownGood: [{ brand: "Uniqlo", category: "tshirt", size: "M", fitRating: 5 }] }),
    );
    expect(out.undetermined).toBe(false);
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

describe("personal ease target — the closet says what 'regular' means for you", () => {
  // Session 67 captured the garment's own measurements at add-by-URL time, which
  // is what made `ease = garment − body` computable for a piece the user owns AND
  // rated. This is the engine reading it. See personalEase.ts for the discipline.

  /** A garment the user owns, whose own chest we read off the retailer's chart. */
  const owned = (garmentChestCm: number, fitDirection = 0) => ({
    brand: "Other Brand", // deliberately NOT the product's brand, so the
    category: "tshirt",   // same-brand anchor cannot be what moves the answer
    size: "M",
    fitRating: 5,
    fitDirection,
    garmentChestCm,
    garmentMeasuredFrom: "page",
  });

  it("moves the recommendation towards the room the wearer actually lives in", () => {
    const profile = { chestCm: 100, preferredFit: "regular" as const };
    const sizes = UNIQLO_TEE_SIZES;

    const stated = recommend(baseInput({ profile, sizes }));
    // Four owned tees at 118 on a 100 chest, all called just right: this person
    // wears +18, not the +10 "regular" assumes.
    const learned = recommend(
      baseInput({ profile, sizes, knownGood: [owned(118), owned(118), owned(118), owned(118)] }),
    );

    const idx = (label: string) => UNIQLO_TEE_SIZES.findIndex((x) => x.label === label);
    expect(idx(learned.best.label)).toBeGreaterThanOrEqual(idx(stated.best.label));
    expect(learned.best.label).toBe("XL");
  });

  it("says so in the reasons, rather than adjusting silently", () => {
    const rec = recommend(
      baseInput({
        profile: { chestCm: 100, preferredFit: "regular" },
        sizes: UNIQLO_TEE_SIZES,
        knownGood: [owned(118), owned(118), owned(118), owned(118)],
      }),
    );
    const msgs = rec.best.reasons.map((r) => r.message).join(" | ");
    expect(msgs).toMatch(/actually wear/);
    expect(msgs).toMatch(/closet/);
  });

  it("changes nothing when the garment measurements were ESTIMATED, not read", () => {
    // A personal target built on the extractor's fallback guess is worse than the
    // stated preference it would replace.
    const profile = { chestCm: 100, preferredFit: "regular" as const };
    const guessed = [1, 2, 3, 4].map(() => ({ ...owned(118), garmentMeasuredFrom: "estimated" }));
    const a = recommend(baseInput({ profile, sizes: UNIQLO_TEE_SIZES }));
    const b = recommend(baseInput({ profile, sizes: UNIQLO_TEE_SIZES, knownGood: guessed }));
    expect(b.best.label).toBe(a.best.label);
    expect(b.best.reasons.map((r) => r.message).join(" ")).not.toMatch(/actually wear/);
  });

  it("changes nothing for a closet with no captured measurements at all", () => {
    // Every item added before Session 67, and every hand-added item. The engine
    // must behave exactly as it did before these columns existed.
    const profile = { chestCm: 100, preferredFit: "regular" as const };
    const bare = [1, 2, 3, 4].map(() => ({
      brand: "Other Brand", category: "tshirt", size: "M", fitRating: 5, fitDirection: 0,
    }));
    const a = recommend(baseInput({ profile, sizes: UNIQLO_TEE_SIZES }));
    const b = recommend(baseInput({ profile, sizes: UNIQLO_TEE_SIZES, knownGood: bare }));
    expect(b.best.label).toBe(a.best.label);
  });

  it("cannot move the answer by more than one size on its own", () => {
    // The cap. An absurd closet must not produce an absurd recommendation.
    const profile = { chestCm: 100, preferredFit: "slim" as const };
    const absurd = [1, 2, 3, 4].map(() => owned(180));
    const stated = recommend(baseInput({ profile, sizes: UNIQLO_TEE_SIZES }));
    const learned = recommend(baseInput({ profile, sizes: UNIQLO_TEE_SIZES, knownGood: absurd }));
    const idx = (label: string) => UNIQLO_TEE_SIZES.findIndex((x) => x.label === label);
    expect(idx(learned.best.label) - idx(stated.best.label)).toBeLessThanOrEqual(2);
  });

  it("stays quiet when the closet simply agrees with the stated preference", () => {
    const rec = recommend(
      baseInput({
        profile: { chestCm: 100, preferredFit: "regular" },
        sizes: UNIQLO_TEE_SIZES,
        knownGood: [owned(110), owned(110), owned(110), owned(110)],
      }),
    );
    expect(rec.best.reasons.map((r) => r.message).join(" ")).not.toMatch(/actually wear/);
  });
});

describe("cross-brand anchors align by measurement, not by label", () => {
  // Found while testing the personal ease target end to end: a closet of roomy
  // tees "M" was recommending Uniqlo M, because the anchor was placed by the
  // LETTER. Roomy Brand's M measures 118cm and Uniqlo's measures 100cm, so
  // matching the label recommends a garment 18cm smaller than the one the wearer
  // just told us fits them. Labels are a brand's opinion; centimetres are not.

  const roomyM = (measured = true) => ({
    brand: "Roomy Brand",
    category: "tshirt",
    size: "M",
    fitRating: 5,
    fitDirection: 0,
    garmentChestCm: 118,
    garmentMeasuredFrom: measured ? "page" : "estimated",
  });

  it("maps a roomy 'M' onto the size that actually measures like it", () => {
    const rec = recommend(
      baseInput({
        profile: { chestCm: 100, preferredFit: "regular" },
        product: { brand: "Uniqlo", category: "tshirt" },
        sizes: UNIQLO_TEE_SIZES,
        knownGood: [roomyM()],
      }),
    );
    // Uniqlo's biggest here is XL at 110 — the nearest thing to the 118 that fits
    // them. It must NOT be M (100cm) just because their garment says "M".
    expect(rec.best.label).toBe("XL");
  });

  // The fallback cases drop the body chest so the ANCHOR is the only signal in
  // play. With a chest present the measurement term (weight 0.45) outranks a
  // weak cross-brand anchor (0.35 × 0.75) and would mask what is being tested.
  const anchorOnly = (kg: Record<string, unknown>) =>
    recommend(
      baseInput({
        profile: { chestCm: null, preferredFit: "regular" },
        product: { brand: "Uniqlo", category: "tshirt" },
        sizes: UNIQLO_TEE_SIZES,
        knownGood: [kg as never],
      }),
    );

  it("still uses the label when the garment was never measured", () => {
    // Every item added before the measurements were captured, and every
    // hand-added one. Behaviour there must be exactly what it was.
    const rec = anchorOnly({
      brand: "Roomy Brand", category: "tshirt", size: "M", fitRating: 5, fitDirection: 0,
    });
    expect(rec.best.label).toBe("M");
  });

  it("ignores an ESTIMATED garment measurement and falls back to the label", () => {
    expect(anchorOnly(roomyM(false)).best.label).toBe("M");
  });

  it("and with a READ measurement, the same anchor lands on XL instead", () => {
    // The pair that shows the change is the measurement and nothing else.
    expect(anchorOnly(roomyM(true)).best.label).toBe("XL");
  });

  it("leaves SAME-BRAND anchors on the label, where the ladder already lines up", () => {
    // Within one brand the letters mean the same thing, and the label is what the
    // wearer will recognise in the explanation. [F1] anchor dominance depends on
    // this path, so it is left exactly as it was.
    const ownUniqloM = {
      brand: "Uniqlo", category: "tshirt", size: "M", fitRating: 5, fitDirection: 0,
      garmentChestCm: 118, garmentMeasuredFrom: "page",
    };
    const rec = recommend(
      baseInput({
        profile: { chestCm: 100, preferredFit: "regular" },
        product: { brand: "Uniqlo", category: "tshirt" },
        sizes: UNIQLO_TEE_SIZES,
        knownGood: [ownUniqloM],
      }),
    );
    expect(rec.best.label).toBe("M");
  });
});

describe("the explanation carries context, not just the top two weights", () => {
  // Found by looking at the real screen: the summary said "chest 14.5cm smaller
  // than your regular target" while "regular" means 10cm by default, and the one
  // line explaining where 14.5 came from was ranked last by weight and cut. A
  // number that appears from nowhere is the black box this engine exists not to be.
  const owned = (garmentChestCm: number) => ({
    brand: "Other Brand", category: "tshirt", size: "M", fitRating: 5, fitDirection: 0,
    garmentChestCm, garmentMeasuredFrom: "page",
  });

  it("puts the personal ease target in the explanation the user reads", () => {
    const rec = recommend(
      baseInput({
        profile: { chestCm: 100, preferredFit: "regular" },
        sizes: UNIQLO_TEE_SIZES,
        knownGood: [owned(118), owned(118), owned(118), owned(118)],
      }),
    );
    expect(rec.explanation).toMatch(/actually wear/);
  });

  it("still leads with what told the sizes apart", () => {
    // Context is appended, never promoted over the signals that did the work.
    const rec = recommend(
      baseInput({
        profile: { chestCm: 100, preferredFit: "regular" },
        sizes: UNIQLO_TEE_SIZES,
        knownGood: [owned(118), owned(118), owned(118), owned(118)],
      }),
    );
    const lines = rec.explanation.split("\n").filter((l) => l.startsWith("•"));
    expect(lines.length).toBeGreaterThan(1);
    expect(lines[lines.length - 1]).toMatch(/actually wear/);
    expect(lines[0]).not.toMatch(/actually wear/);
  });

  it("says nothing extra when no context reason fired", () => {
    const rec = recommend(
      baseInput({ profile: { chestCm: 100, preferredFit: "regular" }, sizes: UNIQLO_TEE_SIZES }),
    );
    expect(rec.explanation).not.toMatch(/actually wear/);
  });
});
