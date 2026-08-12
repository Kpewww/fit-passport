import { describe, expect, it } from "vitest";
import { parseFeedScope, rankFeed } from "./feed";

const post = (id: string, likeCount: number, iso: string) => ({ id, likeCount, createdAt: iso });

describe("parseFeedScope", () => {
  it("defaults to the public feed", () => {
    expect(parseFeedScope(null)).toBe("everyone");
    expect(parseFeedScope(undefined)).toBe("everyone");
    expect(parseFeedScope("")).toBe("everyone");
  });

  it("rejects anything unrecognised rather than guessing", () => {
    expect(parseFeedScope("friends")).toBe("everyone");
    expect(parseFeedScope("FOLLOWING")).toBe("everyone");
  });

  it("reads the followed scope", () => {
    expect(parseFeedScope("following")).toBe("following");
  });
});

describe("rankFeed", () => {
  const feed = [
    post("old-hit", 40, "2026-01-01T00:00:00Z"),
    post("fresh-quiet", 1, "2026-08-01T00:00:00Z"),
    post("mid", 12, "2026-04-01T00:00:00Z"),
  ];

  it("puts the most-liked first on the public feed", () => {
    expect(rankFeed(feed, "everyone").map((p) => p.id)).toEqual([
      "old-hit",
      "mid",
      "fresh-quiet",
    ]);
  });

  it("breaks like-count ties by recency", () => {
    const tied = [
      post("older", 5, "2026-01-01T00:00:00Z"),
      post("newer", 5, "2026-06-01T00:00:00Z"),
    ];
    expect(rankFeed(tied, "everyone").map((p) => p.id)).toEqual(["newer", "older"]);
  });

  it("is strictly newest-first on a followed feed, even when an old post is more liked", () => {
    expect(rankFeed(feed, "following").map((p) => p.id)).toEqual([
      "fresh-quiet",
      "mid",
      "old-hit",
    ]);
  });

  it("accepts Date objects as well as ISO strings", () => {
    const dates = [
      { likeCount: 0, createdAt: new Date("2026-02-01T00:00:00Z"), id: "a" },
      { likeCount: 0, createdAt: new Date("2026-03-01T00:00:00Z"), id: "b" },
    ];
    expect(rankFeed(dates, "following").map((p) => p.id)).toEqual(["b", "a"]);
  });

  it("does not mutate the input", () => {
    const original = feed.map((p) => p.id);
    rankFeed(feed, "everyone");
    expect(feed.map((p) => p.id)).toEqual(original);
  });

  it("handles an empty feed", () => {
    expect(rankFeed([], "following")).toEqual([]);
  });
});
