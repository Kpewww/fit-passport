import { describe, expect, it } from "vitest";
import { BODY_TONES, bodyReadiness, fitLink, readFitLink } from "./bodyView";

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

describe("body tones", () => {
  it("start with the mannequin's colour and are named by colour", () => {
    expect(BODY_TONES[0].id).toBe("form");
    for (const t of BODY_TONES) expect(t.hex).toMatch(/^#[0-9a-f]{6}$/);
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
