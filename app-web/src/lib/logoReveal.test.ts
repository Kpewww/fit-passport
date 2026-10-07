// The mark's reveal — Session 89. What can be checked without a browser; the
// pixel identity of the settled frame and the centerline's fit are measured in a
// browser (brand/tests/centerline-fit.mjs, DEVLOG Session 89).

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { REVEAL_TIMING, cubicLength, revealDuration, reverseCubic, startOf, threads } from "./logoReveal";
import { CENTERLINE, CENTERLINE_STROKE, CONNECTORS } from "./logoCenterline";

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
  it("is M…C paths in the master's coordinates", () => {
    for (const d of [...Object.values(CENTERLINE), ...Object.values(CONNECTORS)]) {
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
    const [x, y] = numbers(CENTERLINE.entryBar);
    expect(x).toBeLessThan(20);
    expect(y).toBeLessThan(50);
  });
});

describe("the two threads (Session 90)", () => {
  const end = (d: string) => numbers(d).slice(-2);
  const start = (d: string) => numbers(d).slice(0, 2);

  it("are continuous: each piece starts where the one before it ended", () => {
    for (const variant of ["hero", "quick", "intro"] as const) {
      for (const th of Object.values(threads(variant))) {
        const route = [th.leadIn, ...th.pieces];
        for (let i = 1; i < route.length; i++) {
          const [x0, y0] = end(route[i - 1].d), [x1, y1] = start(route[i].d);
          expect(Math.hypot(x1 - x0, y1 - y0), `${variant} piece ${i}`).toBeLessThan(0.5);
        }
      }
    }
  });

  it("arrive heading the way the mark sets off — no kink at the entry or the tip", () => {
    for (const d of [CENTERLINE.entryBar, CENTERLINE.lowerLoop]) {
      const lead = threads("hero")[d === CENTERLINE.entryBar ? "a" : "b"].leadIn.d;
      const n = numbers(lead);
      const [c2x, c2y, ex, ey] = n.slice(-4);
      const into = [ex - c2x, ey - c2y], l = Math.hypot(into[0], into[1]);
      const out = startOf(d).dir;
      expect((into[0] / l) * out[0] + (into[1] / l) * out[1]).toBeGreaterThan(0.9);
    }
  });

  it("cross the mark's gaps only through the two connectors", () => {
    const { a, b } = threads("hero");
    expect(a.pieces.map((p) => p.connector)).toEqual([false, true, false]);
    expect(b.pieces.map((p) => p.connector)).toEqual([false, true, false]);
    for (const c of Object.values(CONNECTORS)) expect(cubicLength(c)).toBeLessThan(80);
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
