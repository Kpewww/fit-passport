import { describe, expect, it } from "vitest";
import {
  parseLeaderWindow,
  rankStylists,
  rankTopLooks,
  stylistScore,
  STYLIST_WEIGHTS,
  windowStart,
} from "./leaderboard";

describe("parseLeaderWindow", () => {
  it("defaults to the daily board", () => {
    expect(parseLeaderWindow(null)).toBe("today");
    expect(parseLeaderWindow(undefined)).toBe("today");
    expect(parseLeaderWindow("month")).toBe("today");
  });

  it("reads the weekly board", () => {
    expect(parseLeaderWindow("week")).toBe("week");
  });
});

describe("windowStart", () => {
  // Mid-afternoon UTC, deliberately not near a boundary.
  const now = Date.parse("2026-08-12T15:42:07.500Z");

  it("today starts at UTC midnight of the same day", () => {
    expect(windowStart("today", now).toISOString()).toBe("2026-08-12T00:00:00.000Z");
  });

  it("week is a rolling 7 UTC days including today", () => {
    expect(windowStart("week", now).toISOString()).toBe("2026-08-06T00:00:00.000Z");
  });

  it("uses UTC, not the machine's local midnight, so everyone sees one board", () => {
    // One millisecond after UTC midnight still belongs to the new day.
    const justAfter = Date.parse("2026-08-12T00:00:00.001Z");
    expect(windowStart("today", justAfter).toISOString()).toBe("2026-08-12T00:00:00.000Z");
    // …and one millisecond before belongs to the previous one.
    const justBefore = Date.parse("2026-08-11T23:59:59.999Z");
    expect(windowStart("today", justBefore).toISOString()).toBe("2026-08-11T00:00:00.000Z");
  });
});

describe("stylistScore", () => {
  it("weights a helpful answer above a like, because it costs more thought", () => {
    expect(STYLIST_WEIGHTS.helpful).toBeGreaterThan(STYLIST_WEIGHTS.like);
    expect(stylistScore({ likes: 4, helpful: 2 })).toBe(4 + 2 * STYLIST_WEIGHTS.helpful);
  });

  it("is zero with no contribution", () => {
    expect(stylistScore({ likes: 0, helpful: 0 })).toBe(0);
  });
});

describe("rankStylists", () => {
  it("orders by score, and an answerer can outrank a more-liked poster", () => {
    const ranked = rankStylists([
      { username: "poster", likes: 5, helpful: 0 }, // 5
      { username: "answerer", likes: 0, helpful: 2 }, // 6
    ]);
    expect(ranked.map((r) => r.username)).toEqual(["answerer", "poster"]);
  });

  it("drops anyone who earned nothing in the window", () => {
    const ranked = rankStylists([
      { username: "active", likes: 1, helpful: 0 },
      { username: "idle", likes: 0, helpful: 0 },
    ]);
    expect(ranked.map((r) => r.username)).toEqual(["active"]);
  });

  it("breaks exact ties deterministically so ranks don't shuffle on refresh", () => {
    const rows = [
      { username: "zoe", likes: 3, helpful: 1 },
      { username: "amir", likes: 3, helpful: 1 },
    ];
    expect(rankStylists(rows).map((r) => r.username)).toEqual(["amir", "zoe"]);
    // …and the reverse input produces the same board.
    expect(rankStylists([...rows].reverse()).map((r) => r.username)).toEqual(["amir", "zoe"]);
  });

  it("prefers the deeper contribution when scores tie", () => {
    const ranked = rankStylists([
      { username: "a-likes", likes: 3, helpful: 0 }, // 3
      { username: "b-answers", likes: 0, helpful: 1 }, // 3
    ]);
    expect(ranked[0].username).toBe("b-answers");
  });
});

describe("rankTopLooks", () => {
  const look = (id: string, likesInWindow: number, likeCount: number, iso: string) =>
    ({ id, likesInWindow, likeCount, createdAt: iso });

  it("ranks by likes earned INSIDE the window, not all-time", () => {
    const board = rankTopLooks([
      look("all-time-favourite", 1, 900, "2026-01-01T00:00:00Z"),
      look("todays-hit", 7, 7, "2026-08-12T09:00:00Z"),
    ]);
    expect(board.map((l) => l.id)).toEqual(["todays-hit", "all-time-favourite"]);
  });

  it("excludes looks with no likes in the window", () => {
    expect(rankTopLooks([look("quiet", 0, 40, "2026-05-01T00:00:00Z")])).toEqual([]);
  });

  it("uses all-time likes then recency to break ties", () => {
    const board = rankTopLooks([
      look("older-same", 2, 5, "2026-08-01T00:00:00Z"),
      look("newer-same", 2, 5, "2026-08-11T00:00:00Z"),
      look("proven", 2, 30, "2026-07-01T00:00:00Z"),
    ]);
    expect(board.map((l) => l.id)).toEqual(["proven", "newer-same", "older-same"]);
  });

  it("does not mutate the input", () => {
    const rows = [look("a", 1, 1, "2026-08-12T00:00:00Z"), look("b", 5, 5, "2026-08-12T00:00:00Z")];
    const before = rows.map((r) => r.id);
    rankTopLooks(rows);
    expect(rows.map((r) => r.id)).toEqual(before);
  });
});
