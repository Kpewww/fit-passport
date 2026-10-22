import { describe, expect, it } from "vitest";
import { accuracy, judge, type OutcomeRow, type RecRow } from "./pilotAccuracy";

const t = (m: number) => new Date(Date.UTC(2026, 9, 22, 0, m));
const rec = (size: string, confidence = 0.7, at = 0, productId = "p"): RecRow =>
  ({ userId: "u", productId, recommendedSizeLabel: size, confidence, createdAt: t(at) });
const out = (purchasedSize: string, decision: string, fitDirection: number | null, extra: Partial<OutcomeRow> = {}): OutcomeRow =>
  ({ userId: "u", productId: "p", purchasedSize, decision, exchangedForSize: null, fitDirection, createdAt: t(10), sizeLabels: ["S", "M", "L", "XL"], ...extra });

describe("judging one outcome against the recommendation", () => {
  it("kept and about right: the size bought was right", () => {
    expect(judge(out("M", "keep", 0), rec("M"))).toMatchObject({ verdict: "hit", followed: true });
    expect(judge(out("M", "keep", null), rec("L"))).toMatchObject({ verdict: "miss", followed: false });
    expect(judge(out("m", "keep", 2), rec("M "))).toMatchObject({ verdict: "hit" });
    expect(judge(out("2XL", "keep", 0), rec("XXL"))).toMatchObject({ verdict: "hit" });
    expect(judge(out("48", "keep", 0), rec("50"))).toMatchObject({ verdict: "miss" });
  });

  it("an exchange names the right size", () => {
    expect(judge(out("M", "exchange", -6, { exchangedForSize: "L" }), rec("L"))).toMatchObject({ verdict: "hit", followed: false });
    expect(judge(out("M", "exchange", -6, { exchangedForSize: "L" }), rec("M"))).toMatchObject({ verdict: "miss", followed: true });
  });

  it("a tight or loose return only gives a side, never an exact hit", () => {
    expect(judge(out("M", "return", -6), rec("L")).verdict).toBe("right-side");
    expect(judge(out("M", "return", -6), rec("M")).verdict).toBe("wrong-side");
    expect(judge(out("L", "return", 6), rec("M")).verdict).toBe("right-side");
    expect(judge(out("L", "keep", 5), rec("L")).verdict).toBe("wrong-side");
  });

  it("a return with no fit reason says nothing about size", () => {
    expect(judge(out("M", "return", null), rec("M")).verdict).toBe("no-signal");
  });

  it("numbered sizes go by the chart's order", () => {
    const o = out("48", "return", -5, { sizeLabels: ["46", "48", "50", "52"] });
    expect(judge(o, rec("50")).verdict).toBe("right-side");
    expect(judge(o, rec("46")).verdict).toBe("wrong-side");
  });
});

describe("accuracy over a pilot", () => {
  it("uses the latest recommendation BEFORE the outcome, and skips outcomes with none", () => {
    const recs = [rec("S", 0.6, 1), rec("M", 0.9, 5), rec("XL", 0.9, 20)];
    const a = accuracy([out("M", "keep", 0), out("M", "keep", 0, { productId: "other" })], recs);
    expect(a).toMatchObject({ outcomes: 2, judged: 1, followed: 1, exactRate: 1 });
    expect(a.bands.find((b) => b.from === 0.8)).toMatchObject({ n: 1, hits: 1 });
  });

  it("an exact rate only from outcomes that name a size", () => {
    const a = accuracy(
      [out("M", "keep", 0, { productId: "a" }), out("M", "keep", 0, { productId: "b" }), out("M", "return", -6, { productId: "c" }), out("M", "return", null, { productId: "d" })],
      [rec("M", 0.7, 0, "a"), rec("L", 0.7, 0, "b"), rec("L", 0.7, 0, "c"), rec("M", 0.7, 0, "d")],
    );
    expect(a.verdicts).toEqual({ hit: 1, miss: 1, "right-side": 1, "wrong-side": 0, "no-signal": 1 });
    expect(a.exactRate).toBe(0.5);
  });

  it("nothing to judge reads as null, not 0%", () => {
    expect(accuracy([], []).exactRate).toBeNull();
  });
});
