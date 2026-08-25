import { describe, it, expect } from "vitest";
import { reportConsistency } from "./closetConsistency";

const ALL = () => true;

describe("reportConsistency", () => {
  it("claims nothing below three reports", () => {
    const r = reportConsistency(
      [
        { category: "tshirt", fitDirection: -10 },
        { category: "tshirt", fitDirection: 10 },
      ],
      ALL,
    );
    expect(r.n).toBe(0);
    expect(r.factor).toBe(1);
    expect(r.note).toBeNull();
  });

  it("ignores items with no reported direction", () => {
    // Three items but only one real report, so this falls under the minimum and
    // nothing is claimed — n reports the CONTRIBUTING count, which is zero here.
    const r = reportConsistency(
      [
        { category: "tshirt", fitDirection: null },
        { category: "tshirt", fitDirection: undefined },
        { category: "tshirt", fitDirection: 0 },
      ],
      ALL,
    );
    expect(r.n).toBe(0);
    expect(r.factor).toBe(1);

    // And with three REAL reports plus two blanks, only the three count.
    const r2 = reportConsistency(
      [
        { category: "tshirt", fitDirection: null },
        { category: "tshirt", fitDirection: undefined },
        { category: "tshirt", fitDirection: 0 },
        { category: "shirt", fitDirection: 0 },
        { category: "polo", fitDirection: 0 },
      ],
      ALL,
    );
    expect(r2.n).toBe(3);
  });

  it("leaves confidence alone when reports agree", () => {
    const r = reportConsistency(
      [
        { category: "tshirt", fitDirection: 0 },
        { category: "shirt", fitDirection: 0 },
        { category: "polo", fitDirection: -1 },
      ],
      ALL,
    );
    expect(r.n).toBe(3);
    expect(r.factor).toBe(1);
    expect(r.note).toBeNull();
  });

  it("agreement is NOT a confidence boost", () => {
    // Deliberate: using the closet at all already assumes the reports agree, so
    // rewarding agreement would count that assumption twice.
    const r = reportConsistency(
      [
        { category: "tshirt", fitDirection: 0 },
        { category: "shirt", fitDirection: 0 },
        { category: "polo", fitDirection: 0 },
        { category: "sweater", fitDirection: 0 },
      ],
      ALL,
    );
    expect(r.factor).toBe(1);
    expect(r.factor).not.toBeGreaterThan(1);
  });

  it("lowers confidence when reports scatter, and says why", () => {
    const r = reportConsistency(
      [
        { category: "tshirt", fitDirection: -10 },
        { category: "shirt", fitDirection: 10 },
        { category: "polo", fitDirection: -10 },
        { category: "sweater", fitDirection: 10 },
      ],
      ALL,
    );
    expect(r.factor).toBeLessThan(1);
    expect(r.note).toBeTruthy();
    expect(r.note!).toContain("closet reports disagree");
  });

  it("never cuts confidence by more than 15%", () => {
    const r = reportConsistency(
      [
        { category: "a", fitDirection: -10 },
        { category: "b", fitDirection: 10 },
        { category: "c", fitDirection: -10 },
        { category: "d", fitDirection: 10 },
        { category: "e", fitDirection: -10 },
      ],
      ALL,
    );
    expect(r.factor).toBeGreaterThanOrEqual(0.85);
  });

  it("is monotone — wider scatter never scores higher", () => {
    const tight = reportConsistency(
      [
        { category: "a", fitDirection: 0 },
        { category: "b", fitDirection: 1 },
        { category: "c", fitDirection: -1 },
      ],
      ALL,
    );
    const mid = reportConsistency(
      [
        { category: "a", fitDirection: -5 },
        { category: "b", fitDirection: 5 },
        { category: "c", fitDirection: 0 },
      ],
      ALL,
    );
    const wide = reportConsistency(
      [
        { category: "a", fitDirection: -10 },
        { category: "b", fitDirection: 10 },
        { category: "c", fitDirection: -10 },
      ],
      ALL,
    );
    expect(tight.factor).toBeGreaterThanOrEqual(mid.factor);
    expect(mid.factor).toBeGreaterThanOrEqual(wide.factor);
  });

  it("does not penalise someone who is CONSISTENTLY off-centre", () => {
    // Everything runs a bit roomy on them. That is a person we understand very
    // well — it just means they buy up. Scatter is the problem, not offset.
    const r = reportConsistency(
      [
        { category: "a", fitDirection: 5 },
        { category: "b", fitDirection: 5 },
        { category: "c", fitDirection: 5 },
      ],
      ALL,
    );
    expect(r.factor).toBe(1);
    expect(r.note).toBeNull();
  });

  it("only compares garments in the same domain", () => {
    // Shoes must not be averaged against shirts. Here the shirts agree; the shoe
    // reports scatter, and must be excluded.
    const sameDomain = (c: string) => ["tshirt", "shirt", "polo"].includes(c);
    const r = reportConsistency(
      [
        { category: "tshirt", fitDirection: 0 },
        { category: "shirt", fitDirection: 0 },
        { category: "polo", fitDirection: 0 },
        { category: "shoes", fitDirection: -10 },
        { category: "boots", fitDirection: 10 },
      ],
      sameDomain,
    );
    expect(r.n).toBe(3);
    expect(r.factor).toBe(1);
  });
});
