// The mark's reveal — Session 89. What can be checked without a browser; the
// pixel identity of the settled frame and the centerline's fit are measured in a
// browser (brand/tests/centerline-fit.mjs, DEVLOG Session 89).

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { REVEAL_TIMING, revealDuration, reverseCubic } from "./logoReveal";
import { CENTERLINE, CENTERLINE_STROKE } from "./logoCenterline";

const APP = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const numbers = (d: string) => (d.match(/-?\d*\.?\d+/g) ?? []).map(Number);

describe("the reveal's timing", () => {
  it("is ~2.6 s for the hero and ~0.9 s for quick, as the brief asked", () => {
    expect(revealDuration("hero")).toBeCloseTo(2.6, 5);
    expect(revealDuration("quick")).toBeCloseTo(0.9, 5);
    expect(REVEAL_TIMING.hero.settle).toBeCloseTo(0.15, 5);
    expect(REVEAL_TIMING.quick.explore).toBe(0);
  });

  it("is what the video script records", () => {
    const script = readFileSync(join(APP, "scripts", "record-logo.mjs"), "utf8");
    const m = script.match(/const DURATION = \{ hero: ([\d.]+), quick: ([\d.]+) \}/);
    expect(m, "DURATION not found in record-logo.mjs").toBeTruthy();
    expect(Number(m![1])).toBeCloseTo(revealDuration("hero"), 5);
    expect(Number(m![2])).toBeCloseTo(revealDuration("quick"), 5);
  });
});

describe("the centerline", () => {
  it("is four M…C paths in the master's coordinates", () => {
    for (const d of Object.values(CENTERLINE)) {
      expect(d).toMatch(/^M[-\d.]+ [-\d.]+(C[-\d. ]+)+$/);
      expect((numbers(d).length - 2) % 6).toBe(0);
      for (const [i, v] of numbers(d).entries()) {
        if (i % 2 === 0) expect(v).toBeGreaterThan(-5), expect(v).toBeLessThan(541);
        else expect(v).toBeGreaterThan(-5), expect(v).toBeLessThan(507);
      }
    }
    expect(CENTERLINE_STROKE).toBe(22);
  });

  it("enters from the left, at the mark's top-left entry", () => {
    const [x, y] = numbers(CENTERLINE.entryAndTurn);
    expect(x).toBeLessThan(20);
    expect(y).toBeLessThan(50);
  });
});

describe("reverseCubic", () => {
  const d = CENTERLINE.lowerLoop;
  it("starts where the path ended and ends where it started", () => {
    const n = numbers(d), r = numbers(reverseCubic(d));
    expect(r.slice(0, 2)).toEqual(n.slice(-2));
    expect(r.slice(-2)).toEqual(n.slice(0, 2));
    expect(r.length).toBe(n.length);
  });

  it("run twice gives the path back", () => {
    expect(numbers(reverseCubic(reverseCubic(d)))).toEqual(numbers(d));
  });
});
