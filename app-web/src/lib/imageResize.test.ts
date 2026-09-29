import { describe, expect, it } from "vitest";
import { coverCrop, dataUrlBytes, qualitySteps, GARMENT_PHOTO } from "./imageResize";

describe("coverCrop", () => {
  it("crops the sides of a landscape photo to fill a 4:5 box", () => {
    const c = coverCrop(4000, 3000, 600, 750);
    expect(c.sh).toBe(3000);
    expect(c.sw).toBeCloseTo(2400);
    expect(c.sx).toBeCloseTo(800);
    expect(c.sy).toBe(0);
  });

  it("crops top and bottom of a tall phone photo", () => {
    const c = coverCrop(3000, 4000, 600, 750);
    expect(c.sw).toBe(3000);
    expect(c.sh).toBeCloseTo(3750);
    expect(c.sy).toBeCloseTo(125);
    expect(c.sx).toBe(0);
  });

  it("keeps the aspect of the box, so nothing is stretched", () => {
    for (const [w, h] of [[1200, 1200], [800, 2400], [5000, 1000]]) {
      const c = coverCrop(w, h, GARMENT_PHOTO.width, GARMENT_PHOTO.height);
      expect(c.sw / c.sh).toBeCloseTo(600 / 750);
      expect(c.sx).toBeGreaterThanOrEqual(0);
      expect(c.sy).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("photo budget", () => {
  it("counts the bytes a data URL holds, not its characters", () => {
    expect(dataUrlBytes("data:image/jpeg;base64,QUJD")).toBe(3);
    expect(dataUrlBytes("data:image/jpeg;base64,QUI=")).toBe(2);
    expect(dataUrlBytes("data:image/jpeg;base64,QQ==")).toBe(1);
  });

  it("steps quality down from the start, never below 0.5", () => {
    expect(qualitySteps(0.82)).toEqual([0.82, 0.72, 0.62, 0.52]);
  });

  it("fits inside the API's 400 KB cap even as base64", () => {
    // base64 inflates by 4/3; the budget must leave the backstop untouched.
    expect((GARMENT_PHOTO.budgetBytes * 4) / 3).toBeLessThan(400_000);
  });
});
