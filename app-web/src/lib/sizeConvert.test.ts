import { describe, expect, it } from "vitest";
import { convert, detectScale, scalesForDomain } from "./sizeConvert";

describe("sizeConvert — shoes", () => {
  it("converts EU 43 to the other scales", () => {
    const out = convert("shoe", "43", "EU");
    const byId = Object.fromEntries(out.map((c) => [c.scaleId, c.value]));
    expect(byId.EU).toBe("EU 43");
    expect(byId.US).toBe("US 10"); // 43 − 33
    expect(byId.UK).toBe("UK 9"); // US − 1
    expect(byId.CM).toContain("cm");
  });

  it("converts a US shoe size back to EU", () => {
    const out = convert("shoe", "US 10", "US");
    const eu = out.find((c) => c.scaleId === "EU");
    expect(eu?.value).toBe("EU 43");
  });

  it("detects the scale of a raw shoe string", () => {
    expect(detectScale("shoe", "EU 43")).toBe("EU");
    expect(detectScale("shoe", "US 10")).toBe("US");
    expect(detectScale("shoe", "27 cm")).toBe("CM");
  });
});

describe("sizeConvert — bottoms (the pants numbers)", () => {
  it("reads a bare waist number as inches and gives cm", () => {
    const out = convert("bottom", "32", "WAIST_IN");
    const byId = Object.fromEntries(out.map((c) => [c.scaleId, c.value]));
    expect(byId.WAIST_IN).toBe("32"); // stored value is clean & valid for the size field
    expect(byId.WAIST_CM).toBe("81 cm"); // 32 * 2.54 ≈ 81.3
    expect(byId.ALPHA).toBe("M");
  });

  it("reads W×L and converts on the waist", () => {
    const out = convert("bottom", "34x32", "WAIST_IN");
    const alpha = out.find((c) => c.scaleId === "ALPHA");
    expect(alpha?.value).toBe("L");
  });

  it("reads a cm waist back to inches", () => {
    const out = convert("bottom", "81 cm", "WAIST_CM");
    const inch = out.find((c) => c.scaleId === "WAIST_IN");
    expect(inch?.value).toBe("32");
  });
});

describe("sizeConvert — tops", () => {
  it("maps EU numeric to alpha", () => {
    const out = convert("top", "48", "EU");
    const alpha = out.find((c) => c.scaleId === "ALPHA");
    expect(alpha?.value).toBe("M");
  });

  it("maps alpha to EU", () => {
    const out = convert("top", "L", "ALPHA");
    const eu = out.find((c) => c.scaleId === "EU");
    expect(eu?.value).toBe("EU 52");
  });
});

describe("sizeConvert — domains without a converter", () => {
  it("returns no scales for socks / accessories", () => {
    expect(scalesForDomain("sock")).toEqual([]);
    expect(scalesForDomain("accessory")).toEqual([]);
    expect(convert("sock", "M", "ALPHA")).toEqual([]);
  });
});
