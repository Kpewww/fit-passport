import { describe, expect, it } from "vitest";
import {
  normalizeToAlpha,
  alphaIndex,
  alphaDistance,
  easeChestCm,
  easeAdjustForCategory,
  preferenceShift,
  type FitPreference,
} from "./sizing";

const PREFS: FitPreference[] = ["slim", "regular", "relaxed", "oversized"];

describe("sizing — alpha normalization", () => {
  it("normalizes common label spellings", () => {
    expect(normalizeToAlpha("m")).toBe("M");
    expect(normalizeToAlpha("XL")).toBe("XL");
    expect(normalizeToAlpha("EU 48")).toBeTruthy(); // maps to an alpha rung
    expect(normalizeToAlpha("banana")).toBeNull();
  });
  it("alphaIndex / alphaDistance are consistent on the ladder", () => {
    const s = alphaIndex("S")!;
    const l = alphaIndex("L")!;
    expect(l - s).toBe(2);
    expect(alphaDistance("S", "L")).toBe(2);
    expect(alphaDistance("M", "M")).toBe(0);
    expect(alphaDistance("M", null)).toBeNull();
  });
});

describe("sizing — ease", () => {
  it("ease grows monotonically with looseness", () => {
    const vals = PREFS.map(easeChestCm);
    for (let i = 1; i < vals.length; i++) expect(vals[i]).toBeGreaterThan(vals[i - 1]);
    expect(easeChestCm("regular")).toBe(10); // the tuned baseline the tests rely on
  });

  it("preferenceShift steps the anchor down for slim, up for looser", () => {
    expect(preferenceShift("slim")).toBe(-1);
    expect(preferenceShift("regular")).toBe(0);
    expect(preferenceShift("oversized")).toBeGreaterThan(preferenceShift("relaxed"));
  });
});

describe("sizing — garment-aware ease adjustment", () => {
  it("mid-weight tops stay at the tuned baseline (0)", () => {
    for (const c of ["tshirt", "shirt", "polo", "sweater"]) {
      expect(easeAdjustForCategory(c)).toBe(0);
    }
    expect(easeAdjustForCategory(undefined)).toBe(0);
    expect(easeAdjustForCategory("banana")).toBe(0); // unknown → treat as a plain top
  });

  it("outerwear adds room, ordered coat > jacket > hoodie > blazer", () => {
    expect(easeAdjustForCategory("coat")).toBeGreaterThan(easeAdjustForCategory("jacket"));
    expect(easeAdjustForCategory("jacket")).toBeGreaterThan(easeAdjustForCategory("hoodie"));
    expect(easeAdjustForCategory("hoodie")).toBeGreaterThan(easeAdjustForCategory("blazer"));
    expect(easeAdjustForCategory("blazer")).toBeGreaterThan(0);
  });

  it("base layers subtract room", () => {
    expect(easeAdjustForCategory("tank")).toBeLessThan(0);
  });

  it("is case-insensitive", () => {
    expect(easeAdjustForCategory("JACKET")).toBe(easeAdjustForCategory("jacket"));
  });
});
