import { describe, it, expect } from "vitest";
import {
  DIRECTION_OPTIONS,
  DIRECTION_MIN,
  DIRECTION_MAX,
  clampDirection,
  nearestOption,
  describeDirection,
  directionToLadderShift,
  isDirectional,
  parseScaleMode,
  ratingFromDirection,
} from "./fitDirection";

describe("fitDirection scale", () => {
  it("is bipolar and centred on zero", () => {
    expect(DIRECTION_MIN).toBe(-10);
    expect(DIRECTION_MAX).toBe(10);
    const values = DIRECTION_OPTIONS.map((o) => o.value);
    expect(values).toEqual([-10, -5, 0, 5, 10]);
    // The whole point of the scale: the middle option means "correct", and the
    // two halves mean opposite things.
    expect(DIRECTION_OPTIONS[2].value).toBe(0);
  });

  it("orders the options tight -> loose", () => {
    const values = DIRECTION_OPTIONS.map((o) => o.value);
    const sorted = [...values].sort((a, b) => a - b);
    expect(values).toEqual(sorted);
  });

  it("clamps out-of-range and non-finite input", () => {
    expect(clampDirection(99)).toBe(10);
    expect(clampDirection(-99)).toBe(-10);
    expect(clampDirection(3.4)).toBe(3);
    expect(clampDirection(NaN)).toBe(0);
    expect(clampDirection(Infinity)).toBe(0);
  });

  it("maps a stored value to the nearest descriptive option", () => {
    expect(nearestOption(0).key).toBe("just-right");
    expect(nearestOption(-10).key).toBe("too-tight");
    expect(nearestOption(-4).key).toBe("snug");
    expect(nearestOption(7).key).toBe("roomy");
    expect(nearestOption(9).key).toBe("too-loose");
  });

  it("rounds before matching, so fractional input lands predictably", () => {
    // Options sit 5 apart, so after rounding to an integer there is never an
    // exact tie. -2.5 rounds to -2 (JS rounds .5 toward +Infinity), which is
    // nearer 0 than -5.
    expect(nearestOption(-2.5).key).toBe("just-right");
    expect(nearestOption(-3).key).toBe("snug");
  });

  it("describes a value in plain language, and null stays null", () => {
    expect(describeDirection(0)).toBe("just right");
    expect(describeDirection(-10)).toBe("too tight");
    expect(describeDirection(null)).toBeNull();
    expect(describeDirection(undefined)).toBeNull();
  });

  describe("directionToLadderShift", () => {
    it("is zero when nothing was reported, so legacy items behave as before", () => {
      expect(directionToLadderShift(null)).toBe(0);
      expect(directionToLadderShift(undefined)).toBe(0);
    });

    it("is zero when the garment fits", () => {
      expect(directionToLadderShift(0)).toBe(0);
    });

    it("shifts UP when the owned garment is tight", () => {
      // Tight means their true size is bigger than the one they own.
      expect(directionToLadderShift(-10)).toBe(1);
      expect(directionToLadderShift(-5)).toBe(0.5);
    });

    it("shifts DOWN when the owned garment is loose", () => {
      expect(directionToLadderShift(10)).toBe(-1);
      expect(directionToLadderShift(5)).toBe(-0.5);
    });

    it("never exceeds one ladder step, matching the +/-1 return-shift literature", () => {
      for (let v = -50; v <= 50; v++) {
        expect(Math.abs(directionToLadderShift(v))).toBeLessThanOrEqual(1);
      }
    });

    it("is monotone decreasing in the reported direction", () => {
      let prev = Infinity;
      for (let v = -10; v <= 10; v++) {
        const s = directionToLadderShift(v);
        expect(s).toBeLessThanOrEqual(prev);
        prev = s;
      }
    });
  });

  it("flags only values far enough from centre to mention", () => {
    expect(isDirectional(0)).toBe(false);
    expect(isDirectional(2)).toBe(false);
    expect(isDirectional(-3)).toBe(true);
    expect(isDirectional(10)).toBe(true);
    expect(isDirectional(null)).toBe(false);
  });

  it("defaults the scale mode to descriptive for anything unrecognised", () => {
    expect(parseScaleMode("numeric")).toBe("numeric");
    expect(parseScaleMode("descriptive")).toBe("descriptive");
    expect(parseScaleMode(null)).toBe("descriptive");
    expect(parseScaleMode("nonsense")).toBe("descriptive");
  });
});

describe("ratingFromDirection", () => {
  it("is a 5 at dead centre and never below 2", () => {
    expect(ratingFromDirection(0)).toBe(5);
    expect(ratingFromDirection(-10)).toBe(2);
    expect(ratingFromDirection(10)).toBe(2);
  });

  it("is symmetric — tight and loose by the same amount fit equally badly", () => {
    for (let d = 0; d <= 10; d++) {
      expect(ratingFromDirection(-d)).toBe(ratingFromDirection(d));
    }
  });

  it("is monotone non-increasing as the garment gets further off", () => {
    let prev = 6;
    for (let d = 0; d <= 10; d++) {
      const r = ratingFromDirection(d);
      expect(r).toBeLessThanOrEqual(prev);
      prev = r;
    }
  });

  it("stays inside the legacy 1-5 range", () => {
    for (let d = -20; d <= 20; d++) {
      const r = ratingFromDirection(d);
      expect(r).toBeGreaterThanOrEqual(1);
      expect(r).toBeLessThanOrEqual(5);
    }
  });

  it("falls back to the old default when nothing was reported", () => {
    expect(ratingFromDirection(null)).toBe(4);
    expect(ratingFromDirection(undefined)).toBe(4);
  });

  it("keeps a centred item above the strong-anchor threshold (>=4)", () => {
    // hasStrongAnchor() in fitEngine requires fitRating >= 4; a well-fitting
    // reported item must clear it or the [F1] anchor fix silently stops firing.
    expect(ratingFromDirection(0)).toBeGreaterThanOrEqual(4);
    expect(ratingFromDirection(-5)).toBeGreaterThanOrEqual(4);
    expect(ratingFromDirection(5)).toBeGreaterThanOrEqual(4);
  });
});
