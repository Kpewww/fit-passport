import { describe, expect, it } from "vitest";
import { earnedBadgeIds, evaluateBadges, parsePinned, type BadgeStats } from "./badges";

const EMPTY: BadgeStats = {
  closetCount: 0, outcomeCount: 0, collectionsUsed: 0, refreshCount: 0,
  brandsCount: 0, communityListed: false, outfitPosts: 0, outfitLikes: 0,
};

describe("badges", () => {
  it("earns nothing at zero", () => {
    expect(earnedBadgeIds(EMPTY)).toEqual([]);
  });

  it("earns Verified Closet at 5 items", () => {
    expect(earnedBadgeIds({ ...EMPTY, closetCount: 5 })).toContain("starter");
    expect(earnedBadgeIds({ ...EMPTY, closetCount: 4 })).not.toContain("starter");
  });

  it("earns Curator at 12 items across 3 collections", () => {
    expect(earnedBadgeIds({ ...EMPTY, closetCount: 12, collectionsUsed: 3 })).toContain("curator");
    expect(earnedBadgeIds({ ...EMPTY, closetCount: 12, collectionsUsed: 2 })).not.toContain("curator");
  });

  it("earns community badge only when listed", () => {
    expect(earnedBadgeIds({ ...EMPTY, communityListed: true })).toContain("public-figure");
  });

  it("never earns locked (staged) badges regardless of stats", () => {
    const maxed: BadgeStats = {
      closetCount: 999, outcomeCount: 999, collectionsUsed: 99, refreshCount: 999,
      brandsCount: 99, communityListed: true, outfitPosts: 999, outfitLikes: 9999,
    };
    const ids = earnedBadgeIds(maxed);
    expect(ids).not.toContain("stylist");
    expect(ids).not.toContain("acclaimed");
    expect(ids).not.toContain("head-designer");
  });

  it("sorts earned highest-metal-first", () => {
    const ids = earnedBadgeIds({ ...EMPTY, closetCount: 25, brandsCount: 6, collectionsUsed: 3 });
    // archivist (gold) should come before starter (bronze)
    expect(ids.indexOf("archivist")).toBeLessThan(ids.indexOf("starter"));
  });

  it("shows progress text for unearned, coming-soon for locked", () => {
    const evald = evaluateBadges({ ...EMPTY, closetCount: 2 });
    const starter = evald.find((b) => b.id === "starter")!;
    expect(starter.progressText).toBe("2/5 items");
    const stylist = evald.find((b) => b.id === "stylist")!;
    expect(stylist.progressText).toMatch(/Unlocks/);
  });

  it("parsePinned caps at 3 and trims", () => {
    expect(parsePinned(" a , b ,c, d ")).toEqual(["a", "b", "c"]);
    expect(parsePinned(null)).toEqual([]);
  });
});
