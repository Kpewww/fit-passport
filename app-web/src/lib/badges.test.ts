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

  it("earns Verified Closet at 8 items", () => {
    expect(earnedBadgeIds({ ...EMPTY, closetCount: 8 })).toContain("starter");
    expect(earnedBadgeIds({ ...EMPTY, closetCount: 7 })).not.toContain("starter");
  });

  it("earns Curator at 20 items across 4 collections", () => {
    expect(earnedBadgeIds({ ...EMPTY, closetCount: 20, collectionsUsed: 4 })).toContain("curator");
    expect(earnedBadgeIds({ ...EMPTY, closetCount: 20, collectionsUsed: 3 })).not.toContain("curator");
  });

  it("earns Open Closet only when listed AND the closet is substantiated", () => {
    expect(earnedBadgeIds({ ...EMPTY, communityListed: true, closetCount: 15 })).toContain("open-closet");
    expect(earnedBadgeIds({ ...EMPTY, communityListed: true, closetCount: 14 })).not.toContain("open-closet");
  });

  it("earns the platinum tiers only at the hard thresholds", () => {
    expect(earnedBadgeIds({ ...EMPTY, closetCount: 100, brandsCount: 20, collectionsUsed: 6 })).toContain("grand-wardrobe");
    expect(earnedBadgeIds({ ...EMPTY, closetCount: 99, brandsCount: 20, collectionsUsed: 6 })).not.toContain("grand-wardrobe");
    expect(earnedBadgeIds({ ...EMPTY, refreshCount: 60, outcomeCount: 20 })).toContain("fit-scholar");
    expect(earnedBadgeIds({ ...EMPTY, outfitPosts: 30, outfitLikes: 500 })).toContain("atelier-master");
  });

  it("earns the outfit track + capstones from real stats", () => {
    expect(earnedBadgeIds({ ...EMPTY, outfitPosts: 1 })).toContain("first-look");
    expect(earnedBadgeIds({ ...EMPTY, outfitPosts: 6 })).toContain("stylist");
    expect(earnedBadgeIds({ ...EMPTY, outfitPosts: 5 })).not.toContain("stylist");
    expect(earnedBadgeIds({ ...EMPTY, outfitPosts: 15, outfitLikes: 150 })).toContain("couturier");
    expect(earnedBadgeIds({ ...EMPTY, outfitPosts: 15, outfitLikes: 149 })).not.toContain("couturier");
    expect(earnedBadgeIds({ ...EMPTY, topOutfitLikes: 250 })).toContain("acclaimed");
    expect(earnedBadgeIds({ ...EMPTY, outfitLikes: 1500 })).toContain("tastemaker");
    expect(earnedBadgeIds({ ...EMPTY, outfitLikes: 4000 })).toContain("head-designer");
    expect(earnedBadgeIds({ ...EMPTY, outfitLikes: 3999 })).not.toContain("head-designer");
  });

  it("sorts earned highest-metal-first", () => {
    const ids = earnedBadgeIds({ ...EMPTY, closetCount: 45, brandsCount: 10, collectionsUsed: 4 });
    // archivist (gold) should come before starter (bronze)
    expect(ids.indexOf("archivist")).toBeLessThan(ids.indexOf("starter"));
  });

  it("shows progress text for unearned badges", () => {
    const evald = evaluateBadges({ ...EMPTY, closetCount: 2 });
    const starter = evald.find((b) => b.id === "starter")!;
    expect(starter.progressText).toBe("2/8 items");
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
