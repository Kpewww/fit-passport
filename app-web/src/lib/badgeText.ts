// Badges in Chinese — Session 79.
//
// The English (titles, requirements, the short historical notes, progress lines)
// stays in badges.ts, where the badge logic and its tests live. This file holds
// the Chinese for the same badges, keyed by id; badgeText.test.ts fails if a
// badge has no Chinese, or if a progress line the badges can produce has none.
//
// Progress lines are built by badges.ts as "a/b unit" parts joined by " · "
// ("2/20 items · 1/4 collections"); `progress` rewrites each part's unit, so the
// numbers are the engine's own and only the words change.

import type { Locale } from "@/i18n/config";
import type { BadgeTrack, Metal } from "./badges";

type Text = { title: string; blurb: string; lore: string };

export const ZH_BADGES: Record<string, Text> = {
  starter: { title: "实证衣橱", blurb: "添加了至少 8 件穿着合身的衣服。", lore: "一枚朴素的压印代币——每一份衣物档案，都从第一份清单开始。" },
  curator: { title: "策展人", blurb: "20 件以上衣服，整理进 4 个以上分组。", lore: "文艺复兴时期的衣帽总管——打理一座井井有条衣帽间的人。" },
  archivist: { title: "衣橱档案官", blurb: "45 件以上衣服，横跨 10 个以上品牌。", lore: "宫廷的丝绸库房——横跨各家、各个年代的广度。" },
  "grand-wardrobe": { title: "宏大衣橱", blurb: "100 件以上衣服、20 个以上品牌、6 个以上分组。", lore: "皇家的衣物司——规模大到需要专人管理，而不只是拥有。" },
  "truth-teller": { title: "实话实说", blurb: "记录了 5 次以上购买后的实际合身情况。", lore: "罗马人的蜡板——诚实记下哪件合身、哪件不合身的账本。" },
  calibrated: { title: "精准校准", blurb: "随时间记录了 25 次以上的合身更新。", lore: "日晷的晷针——身形在变，量度始终准确。" },
  "open-closet": { title: "敞开的衣橱", blurb: "公开列入社区，且衣橱内容充实（15 件以上）。", lore: "制图师的罗盘玫瑰——把你的合身经验放上共享的地图。" },
  "fit-scholar": { title: "合身学者", blurb: "60 次以上更新，外加 20 次以上购买结果记录。", lore: "测量员的标尺——真相来自耐心的测量。" },
  "first-look": { title: "初次亮相", blurb: "发布了你的第一套搭配。", lore: "一根骨针——人类最古老的穿衣工具，已有四万年历史。" },
  stylist: { title: "搭配师", blurb: "向社区发布了 6 套搭配。", lore: "裁缝的剪刀——一间正在运转的工坊的标志。" },
  couturier: { title: "高定裁缝", blurb: "发布 15 套搭配，共获 150 个以上的赞。", lore: "提花织机——图案在这里成为规模化的工艺。" },
  "atelier-master": { title: "工坊大师", blurb: "30 套搭配，共获 500 个以上的赞。", lore: "时装屋的首席工坊——以最高标准持续出品。" },
  "sounding-board": { title: "参谋", blurb: "回答了社区的 3 个问题。", lore: "一枚顶针——这一行里最不起眼的工具，却护着干活的那只手。" },
  "trusted-voice": { title: "可信之声", blurb: "10 个回答，其中 8 个被投票认为有帮助。", lore: "裁缝的软尺——值得听的建议，都是先量过的。" },
  "fit-oracle": { title: "合身神谕", blurb: "30 个回答、40 个“有帮助”，并有 3 个被采纳为最佳答案。", lore: "中世纪的行会印记——工坊只在愿意担保的作品上盖这个章。" },
  "community-pillar": { title: "社区支柱", blurb: "80 个回答、150 个“有帮助”，12 个被采纳。", lore: "罗马人的扣针——把整件衣服扣在一起的那一枚。" },
  acclaimed: { title: "众望所归", blurb: "单套搭配获得 250 个以上的赞。", lore: "一颗明亮式切工的钻石——整个社区都欣赏的一套搭配。" },
  tastemaker: { title: "品味引领者", blurb: "特别荣誉——你的搭配共获 1,500 个以上的赞。", lore: "紫水晶，曾与钻石同价——属于引领品味的人。" },
  polymath: { title: "博学通才", blurb: "特别荣誉——四条路线都达到金级或以上。", lore: "带玛瑙纹的御用翡翠——胜在广博，而不只是深入。" },
  "head-designer": { title: "首席设计师", blurb: "巅峰——你的搭配共获 4,000 个以上的赞。", lore: "黑曜石，自古珍贵——稀有、深沉、严苛。" },
};

export const ZH_TRACK: Record<BadgeTrack, string> = {
  closet: "衣橱",
  feedback: "合身记录",
  outfits: "搭配工坊",
  help: "答疑",
  capstone: "稀有殊荣",
};

export const ZH_METAL: Record<Metal, string> = {
  bronze: "青铜", silver: "白银", gold: "黄金", titanium: "钛金", diamond: "钻石",
  obsidian: "黑曜石", amethyst: "紫水晶", jade: "翡翠", amber: "琥珀",
};

// The unit after "a/b " in a progress part, and the two whole sentences.
export const ZH_PROGRESS_UNIT: Record<string, string> = {
  items: "件",
  collections: "个分组",
  brands: "个品牌",
  outcomes: "条购买结果",
  refreshes: "次更新",
  "outfits posted": "套已发布搭配",
  posts: "套搭配",
  likes: "个赞",
  answers: "个回答",
  helpful: "个“有帮助”",
  accepted: "个被采纳",
  "likes on your best look": "个赞（最受欢迎的一套）",
  "total likes": "个总赞",
  "tracks at gold": "条路线达到金级",
};
export const ZH_PROGRESS_SENTENCE: Record<string, string> = {
  "Post 1 outfit": "发布 1 套搭配",
  "List your closet in Community": "在社区公开你的衣橱",
};

/** A progress line in Chinese, or null when some part has no translation. */
export function zhProgress(text: string): string | null {
  if (text in ZH_PROGRESS_SENTENCE) return ZH_PROGRESS_SENTENCE[text];
  const parts = text.split(" · ").map((part) => {
    const m = part.match(/^(\d+\/\d+) (.+)$/);
    const unit = m ? ZH_PROGRESS_UNIT[m[2]] : undefined;
    return m && unit ? `${m[1]} ${unit}` : null;
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
