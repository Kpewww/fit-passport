// Badges in Chinese — Session 79; wording from docs/design/chinese-copy-2026-09-30.md
// §05.15–05.17 (Session 80).
//
// The English (titles, requirements, the short historical notes, progress lines)
// stays in badges.ts, where the badge logic and its tests live. This file holds
// the Chinese for the same badges, keyed by id; badgeText.test.ts fails if a
// badge has no Chinese, or if a progress line the badges can produce has none.
//
// Progress lines are built by badges.ts as "a/b unit" parts joined by " · "
// ("2/20 items · 1/4 collections"); `progress` rewrites each part's unit (and the slash to ／), so the
// numbers are the engine's own and only the words change.

import type { Locale } from "@/i18n/config";
import type { BadgeTrack, Metal } from "./badges";

type Text = { title: string; blurb: string; lore: string };

export const ZH_BADGES: Record<string, Text> = {
  starter: { title: "合身入藏", blurb: "添加至少 8 件已知合身的衣物。", lore: "一枚朴素的印记，记下衣橱最初的积累。" },
  curator: { title: "衣橱策展人", blurb: "将至少 20 件衣物整理到至少 4 个分组。", lore: "灵感来自文艺复兴时期的 guardaroba：悉心照料，让衣橱井然有序。" },
  archivist: { title: "衣橱典藏家", blurb: "衣橱中拥有至少 45 件衣物，涵盖至少 10 个品牌。", lore: "如一座宫廷丝绸典藏，汇集不同世家与时代的衣着。" },
  "grand-wardrobe": { title: "衣橱大成", blurb: "将至少 100 件衣物、20 个品牌，整理到至少 6 个分组。", lore: "灵感来自皇家衣橱署：藏品渐丰，管理也自成学问。" },
  "truth-teller": { title: "如实记衣", blurb: "记录至少 5 次购买后的实际合身体验。", lore: "如古罗马蜡板，诚实记下每一次合身与不合身。" },
  calibrated: { title: "合身常新", blurb: "累计更新至少 25 次舒适度评价。", lore: "如日晷上的晷针，随身形变化，持续校准合身感。" },
  "open-closet": { title: "敞开衣橱", blurb: "在社区公开展示衣橱，并拥有至少 15 件衣物作为参照。", lore: "一枚制图师的罗盘玫瑰，让你的合身经验在共同的地图上留下坐标。" },
  "fit-scholar": { title: "合身研习者", blurb: "累计至少 60 次合身更新、20 次穿着结果记录。", lore: "灵感来自测量标尺：耐心丈量，让经验逐渐有据。" },
  "first-look": { title: "初见风格", blurb: "发布第一套搭配。", lore: "一枚骨针，承接约 40,000 年前衣着工艺的起点。" },
  stylist: { title: "穿搭师", blurb: "向社区发布 6 套搭配。", lore: "一把裁缝剪，留下穿搭工坊日常创作的印记。" },
  couturier: { title: "风格匠人", blurb: "发布至少 15 套搭配，累计获得至少 150 次点赞。", lore: "灵感来自提花织机，让纹样化为可延续的工艺。" },
  "atelier-master": { title: "工坊主理人", blurb: "发布 30 套搭配，累计获得至少 500 次点赞。", lore: "如时装屋的工坊主理人，以持续创作，维系一贯水准。" },
  "sounding-board": { title: "悉心回应", blurb: "回答社区中的 3 个问题。", lore: "一枚顶针，小而平常，护住每一双付诸实践的手。" },
  "trusted-voice": { title: "可信之声", blurb: "完成 10 个回答，并获得 8 次“有帮助”评价。", lore: "一条裁缝软尺，让建议经得起丈量。" },
  "fit-oracle": { title: "合身知音", blurb: "完成 30 个回答，获得 40 次“有帮助”评价，并有 3 个回答获提问者采纳。", lore: "灵感来自中世纪行会印记：落下印章，也为作品担起信誉。" },
  "community-pillar": { title: "社区中坚", blurb: "完成 80 个回答，获得 150 次“有帮助”评价，并有 12 个回答获采纳。", lore: "一枚古罗马衣扣，将整件衣物稳稳相连。" },
  acclaimed: { title: "众望之作", blurb: "单套搭配获得至少 250 次点赞。", lore: "如一颗明亮式切割宝石，一套搭配，汇集社区的欣赏。" },
  tastemaker: { title: "品味引领者", blurb: "特别荣誉：所有搭配累计获得至少 1,500 次点赞。", lore: "紫水晶曾与钻石同受珍视，映照引领品味的人。" },
  polymath: { title: "风格通才", blurb: "特别荣誉：四条成长路径均达到黄金等级或以上。", lore: "带有玛瑙纹理的帝王翡翠，映照广博而深厚的积累。" },
  "head-designer": { title: "首席设计师", blurb: "巅峰荣誉：所有搭配累计获得至少 4,000 次点赞。", lore: "黑曜石自古受人珍视，深邃、稀有，也承载更高的要求。" },
};

export const ZH_TRACK: Record<BadgeTrack, string> = {
  closet: "衣橱积累",
  feedback: "合身记录",
  outfits: "穿搭工坊",
  help: "经验相助",
  capstone: "珍稀荣誉",
};

export const ZH_METAL: Record<Metal, string> = {
  bronze: "青铜", silver: "白银", gold: "黄金", titanium: "钛金", diamond: "钻石",
  obsidian: "黑曜石", amethyst: "紫水晶", jade: "翡翠", amber: "琥珀",
};

// The unit after "a/b " in a progress part, and the two whole sentences.
export const ZH_PROGRESS_UNIT: Record<string, string> = {
  items: "件衣物",
  collections: "个分组",
  brands: "个品牌",
  outcomes: "次穿着结果",
  refreshes: "次合身更新",
  "outfits posted": "套已发布搭配",
  posts: "次发布",
  likes: "次点赞",
  answers: "个回答",
  helpful: "次有帮助",
  accepted: "个已采纳",
  "total likes": "次累计点赞",
  "tracks at gold": "条路径达到黄金等级或以上",
};
export const ZH_PROGRESS_SENTENCE: Record<string, string> = {
  "Post 1 outfit": "发布 1 套搭配",
  "List your closet in Community": "在社区展示衣橱",
};
// A part whose Chinese names the thing counted first: "最受欢迎的搭配：12／250 次点赞".
const ZH_PROGRESS_LEAD: Record<string, [string, string]> = {
  "likes on your best look": ["最受欢迎的搭配：", "次点赞"],
};

/** A progress line in Chinese, or null when some part has no translation. */
export function zhProgress(text: string): string | null {
  if (text in ZH_PROGRESS_SENTENCE) return ZH_PROGRESS_SENTENCE[text];
  const parts = text.split(" · ").map((part) => {
    const m = part.match(/^(\d+)\/(\d+) (.+)$/);
    if (!m) return null;
    const n = `${m[1]}／${m[2]}`;
    const lead = ZH_PROGRESS_LEAD[m[3]];
    if (lead) return `${lead[0]}${n} ${lead[1]}`;
    const unit = ZH_PROGRESS_UNIT[m[3]];
    return unit ? `${n} ${unit}` : null;
  });
  return parts.every((p) => p != null) ? parts.join(" · ") : null;
}

/** Badge words in a language; English passes the badges.ts text through. */
export function badgeWords(locale: Locale) {
  const zh = locale === "zh";
  return {
    title: (id: string, en: string) => (zh ? ZH_BADGES[id]?.title ?? en : en),
    blurb: (id: string, en: string) => (zh ? ZH_BADGES[id]?.blurb ?? en : en),
    lore: (id: string, en: string) => (zh ? ZH_BADGES[id]?.lore ?? en : en),
    track: (track: BadgeTrack, en: string) => (zh ? ZH_TRACK[track] ?? en : en),
    metal: (metal: Metal, en: string) => (zh ? ZH_METAL[metal] ?? en : en),
    progress: (text: string | null) => (text == null ? null : zh ? zhProgress(text) ?? text : text),
  };
}
