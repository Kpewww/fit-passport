import { describe, expect, it } from "vitest";
import { BODY_TONES, bodyReadiness, fitLink, labToHex, readFitLink, skinHex, toneHex } from "./bodyView";

describe("what unlocks the 3D body", () => {
  it("stays locked without height and weight, and says which are missing", () => {
    const r = bodyReadiness({ heightCm: 170 });
    expect(r.level).toBe("locked");
    expect(r.toUnlock).toEqual(["weightKg"]);
  });
  it("is a rough body with height and weight alone", () => {
    const r = bodyReadiness({ heightCm: 170, weightKg: 65 });
    expect(r.level).toBe("rough");
    expect(r.girthsMissing).toEqual(["chestCm", "waistCm", "hipCm", "shoulderCm"]);
  });
  it("becomes the wearer's own with girths, and full with all four", () => {
    expect(bodyReadiness({ heightCm: 170, weightKg: 65, chestCm: 92 }).level).toBe("own");
    expect(bodyReadiness({ heightCm: 170, weightKg: 65, chestCm: 92, waistCm: 76, hipCm: 96, shoulderCm: 42, sex: "female" })).toMatchObject({ level: "full", missing: [] });
  });
  it("counts sex only when one was given", () => {
    expect(bodyReadiness({ sex: "unspecified" }).missing).toContain("sex");
  });
});

describe("body tones (measured skin, Session 98g)", () => {
  it("converts CIELAB correctly: white, mid grey, and a measured mean", () => {
    expect(labToHex(100, 0, 0)).toBe("#ffffff");
    expect(labToHex(53.585, 0, 0)).toBe("#808080");
    // Xiao et al. 2017, Chinese, all sites: L* 58.5, a* 9.8, b* 15.4.
    expect(labToHex(58.5, 9.8, 15.4)).toBe("#a78672"); // checked with an independent Python conversion
  });
  it("are the mannequin's colour, then six lightness steps, lightest first", () => {
    expect(BODY_TONES.map((t) => t.id)).toEqual(["form", "skin1", "skin2", "skin3", "skin4", "skin5", "skin6"]);
    const lum = (h: string) => parseInt(h.slice(1, 3), 16) + parseInt(h.slice(3, 5), 16) + parseInt(h.slice(5, 7), 16);
    for (let i = 2; i < BODY_TONES.length; i++) expect(lum(BODY_TONES[i].hex)).toBeLessThan(lum(BODY_TONES[i - 1].hex));
  });
  it("makes a yellow undertone yellower than a pink one at the same lightness", () => {
    const rb = (h: string) => parseInt(h.slice(1, 3), 16) - parseInt(h.slice(5, 7), 16); // red minus blue: warmth
    expect(rb(skinHex(2, "yellow"))).toBeGreaterThan(rb(skinHex(2, "pink")));
    expect(toneHex("form", "yellow")).toBe(BODY_TONES[0].hex);
  });
});

describe("the link from /check", () => {
  const view = {
    size: "M",
    item: "COS Oxford shirt",
    zones: [
      { key: "chest" as const, verdict: "snug" as const, deltaCm: -2.14 },
      { key: "waist" as const, verdict: "true to size" as const, deltaCm: 0.3 },
      { key: "hip" as const, verdict: "too big" as const, deltaCm: 12 },
    ],
  };
  it("carries one size's fit there and back", () => {
    const url = fitLink(view);
    expect(url.startsWith("/body?")).toBe(true);
    const back = readFitLink(new URL(url, "https://x.test").searchParams)!;
    expect(back.size).toBe("M");
    expect(back.item).toBe("COS Oxford shirt");
    expect(back.zones).toEqual([
      { key: "chest", verdict: "snug", deltaCm: -2.1 },
      { key: "waist", verdict: "true to size", deltaCm: 0.3 },
      { key: "hip", verdict: "too big", deltaCm: 12 },
    ]);
  });
  it("drops what it does not recognise", () => {
    const p = new URLSearchParams("size=L&z=chest.s.-2,neck.s.1,waist.zz.1,hip.r.abc,hip.r.500,shoulder.r.1.5");
    expect(readFitLink(p)!.zones).toEqual([
      { key: "chest", verdict: "snug", deltaCm: -2 },
      { key: "shoulder", verdict: "relaxed", deltaCm: 1.5 },
    ]);
    expect(readFitLink(new URLSearchParams("z=chest.s.1"))).toBeNull();
  });
});
