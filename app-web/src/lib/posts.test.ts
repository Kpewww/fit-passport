import { describe, expect, it } from "vitest";
import { POST_KINDS, parsePostKind, postKindLabel, rankAnswers } from "./posts";

describe("parsePostKind", () => {
  it("accepts every declared kind", () => {
    for (const k of POST_KINDS) expect(parsePostKind(k.kind)).toBe(k.kind);
  });

  it("is case-insensitive on input", () => {
    expect(parsePostKind("help")).toBe("HELP");
    expect(parsePostKind("Recommend")).toBe("RECOMMEND");
  });

  it("returns null rather than guessing", () => {
    expect(parsePostKind("RANT")).toBeNull();
    expect(parsePostKind("")).toBeNull();
    expect(parsePostKind(null)).toBeNull();
    expect(parsePostKind(undefined)).toBeNull();
  });

  it("every kind has a hint and an example, so the composer is never blank", () => {
    for (const k of POST_KINDS) {
      expect(k.hint.length).toBeGreaterThan(10);
      expect(k.example.length).toBeGreaterThan(10);
    }
  });
});

describe("postKindLabel", () => {
  it("labels known kinds and passes through unknown ones", () => {
    expect(postKindLabel("VERDICT")).toBe("Kept or returned");
    expect(postKindLabel("MYSTERY")).toBe("MYSTERY");
  });
});

describe("rankAnswers", () => {
  const a = (id: string, helpfulCount: number, iso: string) => ({ id, helpfulCount, createdAt: iso });
  const thread = [
    a("late-popular", 9, "2026-06-01T00:00:00Z"),
    a("early-quiet", 0, "2026-01-01T00:00:00Z"),
    a("mid", 3, "2026-03-01T00:00:00Z"),
  ];

  it("sorts by helpful votes when nothing is accepted", () => {
    expect(rankAnswers(thread, null).map((x) => x.id)).toEqual([
      "late-popular",
      "mid",
      "early-quiet",
    ]);
  });

  it("puts the accepted answer first even with zero votes", () => {
    expect(rankAnswers(thread, "early-quiet").map((x) => x.id)).toEqual([
      "early-quiet",
      "late-popular",
      "mid",
    ]);
  });

  it("breaks vote ties in favour of whoever answered first", () => {
    const tied = [a("second", 2, "2026-05-01T00:00:00Z"), a("first", 2, "2026-02-01T00:00:00Z")];
    expect(rankAnswers(tied, null).map((x) => x.id)).toEqual(["first", "second"]);
  });

  it("ignores an accepted id that isn't in the thread", () => {
    expect(rankAnswers(thread, "deleted-answer").map((x) => x.id)).toEqual([
      "late-popular",
      "mid",
      "early-quiet",
    ]);
  });

  it("does not mutate the input and handles an empty thread", () => {
    const before = thread.map((x) => x.id);
    rankAnswers(thread, "mid");
    expect(thread.map((x) => x.id)).toEqual(before);
    expect(rankAnswers([], null)).toEqual([]);
  });
});
