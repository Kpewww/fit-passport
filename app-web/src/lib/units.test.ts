import { afterEach, describe, expect, it, vi } from "vitest";
import { cmFrom, cmTo, kgFrom, kgTo, preferredUnits, rangeIssues, saveUnits, PROFILE_RANGES } from "./units";

describe("units a wearer types in (Session 100)", () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it("converts both ways, to one decimal", () => {
    expect(cmFrom(40, "in")).toBe(101.6);
    expect(cmTo(101.6, "in")).toBe(40);
    expect(kgFrom(165, "lb")).toBe(74.8);
    expect(kgTo(74.8, "lb")).toBe(164.9);
    expect(cmFrom(98, "cm")).toBe(98);
  });

  it("defaults by region until the wearer chooses, then remembers", () => {
    const store = new Map<string, string>();
    vi.stubGlobal("localStorage", { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v) });
    expect(preferredUnits("US")).toEqual({ length: "in", weight: "lb" });
    expect(preferredUnits("CN")).toEqual({ length: "cm", weight: "kg" });
    saveUnits({ length: "cm", weight: "lb" });
    expect(preferredUnits("US")).toEqual({ length: "cm", weight: "lb" });
  });

  it("names the number out of range, and says when it fits as inches or pounds", () => {
    // The live walk: a US shopper's chest, 40, typed into a centimetre field.
    expect(rangeIssues({ chestCm: 40 })).toEqual([{ field: "chestCm", value: 40, min: 50, max: 200, looksLikeInches: true, looksLikePounds: false }]);
    expect(rangeIssues({ weightKg: 310 })[0]).toMatchObject({ looksLikePounds: true });
    expect(rangeIssues({ chestCm: 98, weightKg: 74, heightCm: null })).toEqual([]);
    expect(rangeIssues({ chestCm: 5 })[0].looksLikeInches).toBe(false);
  });

  it("is the range the API enforces", () => {
    expect(PROFILE_RANGES.chestCm).toEqual([50, 200]);
  });
});
