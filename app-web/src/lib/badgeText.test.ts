import { describe, expect, it } from "vitest";
import { BADGES, evaluateBadges, TRACK_LABEL, type BadgeStats } from "./badges";
import { ZH_BADGES, ZH_TRACK, badgeWords, zhProgress } from "./badgeText";

const EMPTY: BadgeStats = {
  closetCount: 0, collectionsUsed: 0, brandsCount: 0, outcomeCount: 0, refreshCount: 0,
  communityListed: false, outfitPosts: 0, outfitLikes: 0, topOutfitLikes: 0,
  answersGiven: 0, answerHelpful: 0, answersAccepted: 0,
} as BadgeStats;

describe("badges in Chinese", () => {
  it("name, describe and annotate every badge", () => {
    const missing = BADGES.filter((b) => !ZH_BADGES[b.id]?.title || !ZH_BADGES[b.id]?.blurb || !ZH_BADGES[b.id]?.lore).map((b) => b.id);
    expect(missing).toEqual([]);
    expect(Object.keys(ZH_TRACK).sort()).toEqual(Object.keys(TRACK_LABEL).sort());
  });

  it("translate every progress line the badges can produce, keeping the numbers", () => {
    const states: BadgeStats[] = [
      EMPTY,
      { ...EMPTY, closetCount: 12, collectionsUsed: 2, brandsCount: 5, outcomeCount: 3, refreshCount: 9, outfitPosts: 2, outfitLikes: 40, topOutfitLikes: 12, answersGiven: 4, answerHelpful: 3, answersAccepted: 1 },
      { ...EMPTY, communityListed: true, closetCount: 7 },
    ];
    const lines = states.flatMap((s) => evaluateBadges(s).map((b) => b.progressText)).filter((t): t is string => !!t);
    expect(lines.length).toBeGreaterThan(15);
    const untranslated = lines.filter((l) => zhProgress(l) == null);
    expect(untranslated).toEqual([]);
    expect(zhProgress("2/20 items · 1/4 collections")).toBe("2／20 件衣物 · 1／4 个分组");
    expect(zhProgress("12/250 likes on your best look")).toBe("最受欢迎的搭配：12／250 次点赞");
  });

  it("leave English exactly as badges.ts writes it", () => {
    const w = badgeWords("en");
    expect(w.title("starter", "Verified Closet")).toBe("Verified Closet");
    expect(w.progress("2/8 items")).toBe("2/8 items");
  });
});
