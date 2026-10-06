// Telling similar closet pieces apart — Session 88b.
//
// The founder owns several Maje sweaters; a reason that says "Matches your Maje M"
// does not say which, and a cardigan should not be judged by a crew-neck.

import { describe, expect, it } from "vitest";
import { recommend, type EngineInput, type KnownGoodInput } from "./fitEngine";
import { styleKeys } from "./styleWords";

const base = (knownGood: KnownGoodInput[], name: string | null = null, locale: "en" | "zh" = "en") =>
  recommend(
    {
      profile: { chestCm: null, waistCm: null, shoulderCm: null, preferredFit: "regular" },
      product: { brand: "Maje", category: "sweater", name },
      sizes: [{ label: "XS" }, { label: "S" }, { label: "M" }, { label: "L" }],
      knownGood,
      outcomes: [],
    } as EngineInput,
    { locale },
  );

describe("which closet piece a reason used", () => {
  it("names the piece and carries its id", () => {
    const out = base([{ id: "kg1", brand: "Maje", category: "sweater", size: "S", fitRating: 5, name: "Ribbed cardigan" }]);
    const r = out.best.reasons.find((x) => x.signal === "known-good");
    expect(r?.message).toContain("Ribbed cardigan");
    expect(r?.itemId).toBe("kg1");
    const zh = base([{ id: "kg1", brand: "Maje", category: "sweater", size: "S", fitRating: 5, name: "罗纹开衫" }], null, "zh");
    expect(zh.best.reasons.find((x) => x.signal === "known-good")?.message).toContain("「罗纹开衫」");
  });

  it("says what it said before when the piece has no name", () => {
    const out = base([{ id: "kg1", brand: "Maje", category: "sweater", size: "S", fitRating: 5 }]);
    expect(out.best.reasons.find((x) => x.signal === "known-good")?.message).toBe("Matches your Maje S (sweater)");
  });
});

describe("the same style first", () => {
  const closet: KnownGoodInput[] = [
    { id: "crew", brand: "Maje", category: "sweater", size: "S", fitRating: 5, name: "Crew neck jumper" },
    { id: "cardi", brand: "Maje", category: "sweater", size: "M", fitRating: 5, name: "Cropped cardigan" },
  ];

  it("reads style words in both languages", () => {
    expect([...styleKeys("Maje cable-knit cardigan")].sort()).toEqual(["cable", "cardigan"]);
    expect(styleKeys("罗纹开衫").has("cardigan")).toBe(true);
    expect(styleKeys("Maje sweater").size).toBe(0);
  });

  it("lets a cardigan lead when buying a cardigan", () => {
    const out = base(closet, "Maje cable-knit cardigan");
    expect(out.best.label).toBe("M");
    expect(out.best.reasons.find((x) => x.signal === "known-good")?.itemId).toBe("cardi");
  });

  it("puts a same-style piece ahead of unnamed ones too", () => {
    const out = base(
      [
        { id: "u1", brand: "Maje", category: "sweater", size: "S", fitRating: 5 },
        { id: "u2", brand: "Maje", category: "sweater", size: "S", fitRating: 4 },
        { id: "cardi", brand: "Maje", category: "sweater", size: "M", fitRating: 5, name: "Cropped cardigan" },
      ],
      "Cable-knit cardigan",
    );
    expect(out.best.label).toBe("M");
    expect(out.best.reasons.find((x) => x.signal === "known-good")?.itemId).toBe("cardi");
  });

  it("changes nothing when the product names no style", () => {
    const named = base(closet, "Maje sweater");
    const unnamed = base(closet, null);
    expect(named.best.label).toBe(unnamed.best.label);
  });
});
