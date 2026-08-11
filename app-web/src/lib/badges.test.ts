import { describe, expect, it } from "vitest";
import { badgesByTrack, earnedBadgeIds, evaluateBadges, parsePinned, type BadgeStats } from "./badges";

const EMPTY: BadgeStats = {
  closetCount: 0, outcomeCount: 0, collectionsUsed: 0, refreshCount: 0,
  brandsCount: 0, communityListed: false, outfitPosts: 0, outfitLikes: 0, topOutfitLikes: 0,
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

  it("earns Open Closet only when listed", () => {
    expect(earnedBadgeIds({ ...EMPTY, communityListed: true })).toContain("open-closet");
  });

  it("earns the outfit track + capstones from real stats", () => {
    expect(earnedBadgeIds({ ...EMPTY, outfitPosts: 1 })).toContain("first-look");
    expect(earnedBadgeIds({ ...EMPTY, outfitPosts: 3 })).toContain("stylist");
    expect(earnedBadgeIds({ ...EMPTY, outfitPosts: 2 })).not.toContain("stylist");
    expect(earnedBadgeIds({ ...EMPTY, outfitPosts: 8, outfitLikes: 50 })).toContain("couturier");
    expect(earnedBadgeIds({ ...EMPTY, outfitPosts: 8, outfitLikes: 49 })).not.toContain("couturier");
    expect(earnedBadgeIds({ ...EMPTY, topOutfitLikes: 100 })).toContain("acclaimed");
    expect(earnedBadgeIds({ ...EMPTY, outfitLikes: 500 })).toContain("tastemaker");
    expect(earnedBadgeIds({ ...EMPTY, outfitLikes: 1000 })).toContain("head-designer");
    expect(earnedBadgeIds({ ...EMPTY, outfitLikes: 999 })).not.toContain("head-designer");
  });

  it("sorts earned highest-metal-first", () => {
    const ids = earnedBadgeIds({ ...EMPTY, closetCount: 25, brandsCount: 6, collectionsUsed: 3 });
    // archivist (gold) should come before starter (bronze)
    expect(ids.indexOf("archivist")).toBeLessThan(ids.indexOf("starter"));
  });

  it("shows progress text for unearned badges", () => {
    const evald = evaluateBadges({ ...EMPTY, closetCount: 2 });
    const starter = evald.find((b) => b.id === "starter")!;
    expect(starter.progressText).toBe("2/5 items");
    const stylist = evald.find((b) => b.id === "stylist")!;
    expect(stylist.progressText).toMatch(/outfits posted/);
  });

  it("groups into 3 tracks + capstones with tiers in order", () => {
    const tracks = badgesByTrack();
    expect(tracks.map((t) => t.track)).toEqual(["closet", "feedback", "outfits", "capstone"]);
    for (const t of tracks) {
      const tiers = t.badges.map((b) => b.tier);
      expect(tiers).toEqual([...tiers].sort((a, b) => a - b)); // ascending
    }
  });

  it("parsePinned caps at 3 and trims", () => {
    expect(parsePinned(" a , b ,c, d ")).toEqual(["a", "b", "c"]);
    expect(parsePinned(null)).toEqual([]);
  });
});
