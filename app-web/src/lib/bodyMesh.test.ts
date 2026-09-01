import { describe, it, expect } from "vitest";
import {
  DEFAULT_STATURE_CM,
  TORSO_DEPTH_RATIO,
  bodyCrossSections,
  ellipseSemiAxes,
  landmarkHeightCm,
  drawingRings,
  measuredFraction,
  statureCm,
} from "./bodyMesh";

// Ramanujan's approximation, used forwards to check the inversion.
const perimeter = (a: number, b: number) =>
  Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));

describe("ellipseSemiAxes", () => {
  it("reduces to a circle when depth equals width", () => {
    const { halfWidth, halfDepth } = ellipseSemiAxes(100, 1);
    expect(halfWidth).toBeCloseTo(100 / (2 * Math.PI), 6);
    expect(halfDepth).toBeCloseTo(halfWidth, 10);
  });

  it("round-trips: the ellipse it returns has the circumference asked for", () => {
    // The whole point — the measurement the user typed must survive the drawing.
    for (const c of [70, 84, 96, 100, 118, 140]) {
      const { halfWidth, halfDepth } = ellipseSemiAxes(c);
      expect(perimeter(halfWidth, halfDepth)).toBeCloseTo(c, 6);
    }
  });

  it("keeps the requested depth-to-width ratio", () => {
    const { halfWidth, halfDepth } = ellipseSemiAxes(100);
    expect(halfDepth / halfWidth).toBeCloseTo(TORSO_DEPTH_RATIO, 10);
  });

  it("scales linearly with circumference", () => {
    const a = ellipseSemiAxes(100);
    const b = ellipseSemiAxes(200);
    expect(b.halfWidth).toBeCloseTo(a.halfWidth * 2, 10);
  });
});

describe("bodyCrossSections", () => {
  it("refuses to draw a body from nothing", () => {
    // A figure invented from no input is decoration pretending to be data.
    expect(bodyCrossSections({})).toEqual([]);
    expect(bodyCrossSections({ heightCm: 178 })).toEqual([]);
  });

  it("draws from a single girth, and marks everything it had to infer", () => {
    const s = bodyCrossSections({ chestCm: 100 });
    expect(s.length).toBeGreaterThan(0);
    const chest = s.find((x) => x.key === "chest")!;
    expect(chest.estimated).toBe(false);
    expect(chest.circumferenceCm).toBe(100);
    // Everything else came from a ratio, and says so.
    for (const other of s.filter((x) => x.key !== "chest")) {
      expect(other.estimated, `${other.key} should be flagged`).toBe(true);
    }
  });

  it("never reports a circumference for a section it inferred", () => {
    // `circumferenceCm` is what we print beside the figure. A number there that
    // the user did not give us would be the worst failure available here.
    for (const s of bodyCrossSections({ chestCm: 100 })) {
      if (s.estimated) expect(s.circumferenceCm).toBeNull();
    }
  });

  it("uses every measurement it is given", () => {
    const s = bodyCrossSections({ chestCm: 100, waistCm: 84, hipCm: 98, shoulderCm: 45 });
    expect(s.every((x) => !x.estimated)).toBe(true);
    expect(measuredFraction(s)).toBe(1);
    expect(s.find((x) => x.key === "waist")!.circumferenceCm).toBe(84);
  });

  it("puts the shoulder's own breadth on the width, not through a circumference", () => {
    // shoulderCm is stored as an across-the-back breadth. Treating it as a girth
    // would draw a shoulder roughly a third of its real width.
    const s = bodyCrossSections({ chestCm: 100, shoulderCm: 46 });
    expect(s.find((x) => x.key === "shoulder")!.halfWidth).toBeCloseTo(23, 6);
    expect(s.find((x) => x.key === "shoulder")!.circumferenceCm).toBeNull();
  });

  it("returns sections ordered bottom to top", () => {
    const s = bodyCrossSections({ chestCm: 100, waistCm: 84, hipCm: 98 });
    const ys = s.map((x) => x.y);
    expect([...ys].sort((a, b) => a - b)).toEqual(ys);
  });

  it("distinguishes two bodies with the same volume but different shape", () => {
    // The reason for building this at all: the flat BodyFigure buckets people
    // into six bands, so every "average" build is drawn identically. These two
    // have the same chest and very different waists.
    const tapered = bodyCrossSections({ chestCm: 100, waistCm: 78 });
    const straight = bodyCrossSections({ chestCm: 100, waistCm: 96 });
    const w = (s: ReturnType<typeof bodyCrossSections>) =>
      s.find((x) => x.key === "waist")!.halfWidth;
    expect(w(straight)).toBeGreaterThan(w(tapered) * 1.15);
  });
});

describe("landmark heights", () => {
  it("falls back to a stated default stature rather than guessing silently", () => {
    expect(statureCm({})).toBe(DEFAULT_STATURE_CM);
    expect(statureCm({ heightCm: 183 })).toBe(183);
  });

  it("scales with the user's height", () => {
    const short = landmarkHeightCm("chest", { heightCm: 155 });
    const tall = landmarkHeightCm("chest", { heightCm: 190 });
    expect(tall).toBeGreaterThan(short);
  });

  it("lets a real inseam override the proportional crotch", () => {
    // A measurement always beats a convention where we have one.
    expect(landmarkHeightCm("crotch", { heightCm: 180, inseamCm: 79 })).toBe(79);
    expect(landmarkHeightCm("crotch", { heightCm: 180 })).toBeCloseTo(180 * 0.47, 6);
  });

  it("keeps the landmarks in anatomical order", () => {
    const m = { heightCm: 175 };
    const y = (k: Parameters<typeof landmarkHeightCm>[0]) => landmarkHeightCm(k, m);
    expect(y("crotch")).toBeLessThan(y("hip"));
    expect(y("hip")).toBeLessThan(y("waist"));
    expect(y("waist")).toBeLessThan(y("chest"));
    expect(y("chest")).toBeLessThan(y("shoulder"));
    expect(y("shoulder")).toBeLessThan(y("crown"));
  });
});

describe("drawingRings", () => {
  const measured = bodyCrossSections({ chestCm: 100, waistCm: 82, hipCm: 96, shoulderCm: 46 });

  it("never claims a circumference", () => {
    // These exist to make the form read as a torso rather than a vase. They are
    // not data, and a number here would be one the user never gave us.
    const { above, below } = drawingRings(measured);
    for (const r of [...above, ...below]) {
      expect(r.circumferenceCm).toBeNull();
      expect(r.estimated).toBe(true);
    }
  });

  it("sits entirely outside the measured range, so it cannot alter the volume", () => {
    // The guarantee that matters: between shoulder and hip, what the user sees is
    // their own numbers. The caps only shape the two ends.
    const { above, below } = drawingRings(measured);
    const top = Math.max(...measured.map((s) => s.y));
    const bottom = Math.min(...measured.map((s) => s.y));
    for (const r of above) expect(r.y).toBeGreaterThan(top);
    for (const r of below) expect(r.y).toBeLessThan(bottom);
  });

  it("narrows monotonically away from the body", () => {
    // A ring that widened again would read as a bulge, which is what the first
    // render did at the neck.
    const { above, below } = drawingRings(measured);
    const topW = measured[measured.length - 1].halfWidth;
    let prev = topW;
    for (const r of above) { expect(r.halfWidth).toBeLessThan(prev); prev = r.halfWidth; }
    let prevB = measured[0].halfWidth;
    for (const r of below) { expect(r.halfWidth).toBeLessThan(prevB); prevB = r.halfWidth; }
  });

  it("produces nothing when there is not enough body to cap", () => {
    expect(drawingRings([])).toEqual({ above: [], below: [] });
  });
});
