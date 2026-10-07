// A rough guess from one or two closet pieces (Session 92c). The founder: with a
// small closet and no measurements, give a low-confidence guess instead of "can't
// tell these sizes apart". These pin when it runs, what it picks, how sure it may
// say it is, and that it never moves a size a real signal chose.

import { describe, expect, it } from "vitest";
import { recommend, type EngineInput, type KnownGoodInput } from "./fitEngine";
import { labelKey, roughGuess } from "./roughGuess";
import { CONFIDENCE_CAPS } from "./scoringConstants";

const LETTERS = ["XS", "S", "M", "L", "XL"].map((label) => ({ label }));
const MAJE = ["1", "2", "3", "4"].map((label) => ({ label }));

function input(over: Partial<EngineInput> & { closet?: KnownGoodInput[] } = {}): EngineInput {
  return {
    profile: { chestCm: null, waistCm: null, shoulderCm: null, preferredFit: "regular", ...(over.profile ?? {}) },
    product: { brand: "Levi's", category: "jeans", ...(over.product ?? {}) },
    sizes: over.sizes ?? LETTERS,
    knownGood: over.closet ?? [],
    outcomes: [],
  };
}
const piece = (brand: string, category: string, size: string, extra: Partial<KnownGoodInput> = {}): KnownGoodInput => ({ brand, category, size, fitRating: 4, ...extra });

describe("a rough guess from a small closet", () => {
  it("guesses from one piece of another garment type, low and labelled", () => {
    const out = recommend(input({ closet: [piece("Uniqlo", "tshirt", "M")] }));
    expect(out.undetermined).toBe(false);
    expect(out.best.label).toBe("M");
    expect(out.best.confidence).toBeLessThanOrEqual(CONFIDENCE_CAPS.roughGuess);
    expect(out.explanation).toMatch(/rough guess/i);
    expect(out.explanation).toMatch(/chest/i); // and says how to make it real
  });

  it("guesses from a same-brand piece whose label the page offers, even off the S–XL ladder", () => {
    const out = recommend(input({ product: { brand: "Maje", category: "dress" }, sizes: MAJE, closet: [piece("MAJE", "sweater", "T2")] }));
    expect(out.best.label).toBe("2");
    expect(out.best.confidence).toBeLessThanOrEqual(CONFIDENCE_CAPS.roughSameLabel);
    expect(out.explanation).toMatch(/same brand/i);
  });

  it("takes the middle piece of several, and a reported direction", () => {
    expect(roughGuess({}, LETTERS, [piece("A", "tshirt", "S"), piece("B", "shirt", "M"), piece("C", "hoodie", "XL")])).toMatchObject({ kind: "ladder", label: "M" });
    // An M that runs tight: the wearer's real size is a step up.
    expect(roughGuess({}, LETTERS, [piece("A", "tshirt", "M", { fitDirection: -8 })])).toMatchObject({ kind: "ladder", label: "L" });
  });

  it("says which piece could not be placed, rather than a bare tie", () => {
    const out = recommend(input({ closet: [piece("Maje", "sweater", "2")] }));
    expect(out.undetermined).toBe(true);
    expect(out.explanation).toMatch(/Maje 2.*can't be placed/);
  });

  it("never guesses a clothing size from shoes", () => {
    expect(roughGuess({}, LETTERS, [piece("Nike", "sneakers", "M")])).toBeNull();
    expect(recommend(input({ closet: [piece("Nike", "sneakers", "M")] })).undetermined).toBe(true);
  });

  it("never moves a size a real signal chose", () => {
    const sizes = [{ label: "S", chestCm: 96 }, { label: "M", chestCm: 104 }, { label: "L", chestCm: 112 }];
    const withChest = { profile: { chestCm: 86, waistCm: null, shoulderCm: null, preferredFit: "regular" as const }, product: { brand: "Uniqlo", category: "tshirt" }, sizes };
    const alone = recommend(input(withChest));
    const withPiece = recommend(input({ ...withChest, product: { brand: "Uniqlo", category: "tshirt" }, closet: [piece("Levi's", "jeans", "XL")] }));
    expect(withPiece.best.label).toBe(alone.best.label);
    expect(withPiece.explanation).not.toMatch(/rough guess/i);
  });

  it("does nothing with an empty closet: there is nothing to guess from", () => {
    expect(recommend(input()).undetermined).toBe(true);
  });
});

describe("size labels as printed", () => {
  it("reads the common spellings of one label as one", () => {
    for (const raw of ["2", "T2", "t 2", "Size 2", "FR 2", " 2 "]) expect(labelKey(raw)).toBe("2");
    expect(labelKey("M")).toBe("M");
    expect(labelKey("Tall")).not.toBe(labelKey("all"));
  });
});
