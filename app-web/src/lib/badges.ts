// Badge system — the "prestige layer" that makes a passport worth showing off.
//
// Structure (Tracks + Capstones — chosen 2026-08-11):
//   • THREE progression TRACKS, each with 3 tiers (bronze → silver → gold):
//       closet-building, feedback loop, outfits.
//     Tiers give everyday goals and a clear ladder within a category.
//   • THREE rare CAPSTONES (diamond / obsidian / jade) that sit above the tracks
//     and are genuinely hard — big like counts / total mastery. Scarcity = value.
//
// Everything is TRANSPARENT and earned from REAL data — never faked. Each badge
// also carries a `motif`: a real textile/fashion-history reference, so the
// medallion art has cultural depth (Roman fibula, Tang silk, guild marks, etc).
//
// `finish` (0..5) drives how ornate the medallion is — low tiers are plain struck
// coins, high tiers gain deep relief, engraving, and a laurel that overflows the
// rim. See components/BadgeMedallion.tsx.

// The progression ladder, in ascending prestige:
//   bronze → silver → gold → platinum → diamond → obsidian
// plus SPECIAL metals reserved for unusual/rare achievements (not part of the
// ladder): amethyst (gem purple), jade (agate green), amber (orange).
// Diamond and above gain agate-style white veining in the medallion art.
export type Metal =
  | "bronze"
  | "silver"
  | "gold"
  | "platinum"
  | "diamond"
  | "obsidian"
  // specials
  | "amethyst"
  | "jade"
  | "amber";

/** Ascending prestige order — used to pick a user's highest metal. */
export const METAL_RANK: Record<Metal, number> = {
  bronze: 1,
  silver: 2,
  gold: 3,
  platinum: 4,
  diamond: 5,
  obsidian: 6,
  // specials rank alongside the top of the ladder but stay visually distinct
  amethyst: 5,
  jade: 5,
  amber: 4,
};

/** Metals that get agate/marble white veining in the art (diamond and above). */
export const VEINED_METALS: Metal[] = ["diamond", "obsidian", "amethyst", "jade"];

/**
 * The highest-prestige metal among a set of earned badge IDs. Used to theme the
 * passport card. Returns null when nothing is earned (caller uses the default).
 */
export function highestMetal(earnedIds: string[]): Metal | null {
  let best: Metal | null = null;
  for (const id of earnedIds) {
    const b = badgeById(id);
    if (!b) continue;
    if (!best || METAL_RANK[b.metal] > METAL_RANK[best]) best = b.metal;
  }
  return best;
}

export type BadgeTrack = "closet" | "feedback" | "outfits" | "capstone";

export type BadgeStats = {
  closetCount: number;
  outcomeCount: number;
  collectionsUsed: number; // # of non-empty collections
  refreshCount: number; // # of comfort checks recorded
  brandsCount: number; // distinct brands in closet
  communityListed: boolean;
  // Outfit posting + likes (real as of the outfits feature).
  outfitPosts: number; // # of outfits the user has posted
  outfitLikes: number; // total likes across all their outfits
  topOutfitLikes: number; // likes on their single most-liked outfit
};

export type BadgeDef = {
  id: string;
  title: string;
  metal: Metal;
  track: BadgeTrack;
  tier: number; // 1..3 within a track; capstones use ascending rarity order
  glyph: string; // legacy/emoji fallback — medallion uses `motif` icons now
  motif: string; // icon key + cultural reference (see BadgeMedallion)
  finish: number; // 0..5 ornateness of the medallion art
  blurb: string;
  lore: string; // the historical/cultural note shown on hover / help
  earned?: (s: BadgeStats) => boolean;
  progress?: (s: BadgeStats) => string | null;
  locked?: boolean;
  comingSoon?: string;
};

// Metal → visual treatment (chips/labels). The medallion itself uses richer
// gradients defined in its own component.
export const METAL_STYLE: Record<Metal, { ring: string; bg: string; text: string; label: string }> = {
  bronze: { ring: "ring-amber-700/40", bg: "bg-gradient-to-br from-amber-600 to-amber-800", text: "text-amber-50", label: "Bronze" },
  silver: { ring: "ring-slate-400/50", bg: "bg-gradient-to-br from-slate-300 to-slate-500", text: "text-slate-900", label: "Silver" },
  gold: { ring: "ring-yellow-500/50", bg: "bg-gradient-to-br from-yellow-400 to-amber-600", text: "text-yellow-950", label: "Gold" },
  platinum: { ring: "ring-zinc-300/60", bg: "bg-gradient-to-br from-zinc-100 via-zinc-300 to-zinc-400", text: "text-zinc-900", label: "Platinum" },
  diamond: { ring: "ring-cyan-300/60", bg: "bg-gradient-to-br from-cyan-200 via-white to-sky-300", text: "text-sky-900", label: "Diamond" },
  obsidian: { ring: "ring-neutral-700/60", bg: "bg-gradient-to-br from-neutral-800 to-black", text: "text-neutral-100", label: "Obsidian" },
  amethyst: { ring: "ring-violet-400/60", bg: "bg-gradient-to-br from-violet-300 to-purple-700", text: "text-violet-50", label: "Amethyst" },
  jade: { ring: "ring-emerald-400/60", bg: "bg-gradient-to-br from-emerald-300 to-green-600", text: "text-emerald-950", label: "Jade" },
  amber: { ring: "ring-orange-400/60", bg: "bg-gradient-to-br from-amber-300 to-orange-600", text: "text-orange-950", label: "Amber" },
};

export const TRACK_LABEL: Record<BadgeTrack, string> = {
  closet: "The Wardrobe",
  feedback: "The Fit Record",
  outfits: "The Atelier",
  capstone: "Rare Honors",
};

export const BADGES: BadgeDef[] = [
  // ============ TRACK 1 — The Wardrobe (closet building) ============
  {
    id: "starter",
    title: "Verified Closet",
    metal: "bronze", track: "closet", tier: 1, finish: 0,
    glyph: "🥉", motif: "hanger",
    blurb: "Added at least 8 known-good garments.",
    lore: "A plain struck token — every archive begins with a first inventory.",
    earned: (s) => s.closetCount >= 8,
    progress: (s) => (s.closetCount >= 8 ? null : `${s.closetCount}/8 items`),
  },
  {
    id: "curator",
    title: "Curator",
    metal: "silver", track: "closet", tier: 2, finish: 2,
    glyph: "🥈", motif: "shelves",
    blurb: "20+ items organized across 4+ collections.",
    lore: "The Renaissance 'guardaroba' — the keeper of a well-ordered wardrobe.",
    earned: (s) => s.closetCount >= 20 && s.collectionsUsed >= 4,
    progress: (s) =>
      s.closetCount >= 20 && s.collectionsUsed >= 4
        ? null
        : `${Math.min(s.closetCount, 20)}/20 items · ${Math.min(s.collectionsUsed, 4)}/4 collections`,
  },
  {
    id: "archivist",
    title: "Wardrobe Archivist",
    metal: "gold", track: "closet", tier: 3, finish: 3,
    glyph: "🏅", motif: "archive",
    blurb: "45+ items spanning 10+ brands.",
    lore: "An imperial silk archive — breadth across houses and eras.",
    earned: (s) => s.closetCount >= 45 && s.brandsCount >= 10,
    progress: (s) =>
      s.closetCount >= 45 && s.brandsCount >= 10
        ? null
        : `${Math.min(s.closetCount, 45)}/45 items · ${Math.min(s.brandsCount, 10)}/10 brands`,
  },
  {
    id: "grand-wardrobe",
    title: "Grand Wardrobe",
    metal: "platinum", track: "closet", tier: 4, finish: 4,
    glyph: "🏛", motif: "obelisk",
    blurb: "100+ items across 20+ brands, in 6+ collections.",
    lore: "A royal wardrobe office — scale that must be administered, not merely owned.",
    earned: (s) => s.closetCount >= 100 && s.brandsCount >= 20 && s.collectionsUsed >= 6,
    progress: (s) =>
      s.closetCount >= 100 && s.brandsCount >= 20 && s.collectionsUsed >= 6
        ? null
        : `${Math.min(s.closetCount, 100)}/100 items · ${Math.min(s.brandsCount, 20)}/20 brands`,
  },

  // ============ TRACK 2 — The Fit Record (feedback loop) ============
  {
    id: "truth-teller",
    title: "Truth-Teller",
    metal: "bronze", track: "feedback", tier: 1, finish: 0,
    glyph: "📋", motif: "tablet",
    blurb: "Recorded how 5+ purchases actually fit.",
    lore: "A Roman wax tablet — the honest ledger of what fit and what didn't.",
    earned: (s) => s.outcomeCount >= 5,
    progress: (s) => (s.outcomeCount >= 5 ? null : `${s.outcomeCount}/5 outcomes`),
  },
  {
    id: "calibrated",
    title: "Calibrated",
    metal: "silver", track: "feedback", tier: 2, finish: 2,
    glyph: "🎯", motif: "gnomon",
    blurb: "Logged 25+ comfort refreshes over time.",
    lore: "The gnomon of a sundial — measurement kept true as the body changes.",
    earned: (s) => s.refreshCount >= 25,
    progress: (s) => (s.refreshCount >= 25 ? null : `${s.refreshCount}/25 refreshes`),
  },
  {
    id: "open-closet",
    title: "Open Closet",
    metal: "gold", track: "feedback", tier: 3, finish: 3,
    glyph: "🌐", motif: "compass-rose",
    blurb: "Listed publicly with a substantiated closet (15+ items).",
    lore: "A cartographer's compass rose — putting your fit on the shared map.",
    earned: (s) => s.communityListed && s.closetCount >= 15,
    progress: (s) =>
      s.communityListed && s.closetCount >= 15
        ? null
        : s.communityListed
          ? `${Math.min(s.closetCount, 15)}/15 items`
          : "List your closet in Community",
  },
  {
    id: "fit-scholar",
    title: "Fit Scholar",
    metal: "platinum", track: "feedback", tier: 4, finish: 4,
    glyph: "📐", motif: "tablet",
    blurb: "60+ refreshes and 20+ recorded outcomes.",
    lore: "The surveyor's rod — truth accumulated by patient measurement.",
    earned: (s) => s.refreshCount >= 60 && s.outcomeCount >= 20,
    progress: (s) =>
      s.refreshCount >= 60 && s.outcomeCount >= 20
        ? null
        : `${Math.min(s.refreshCount, 60)}/60 refreshes · ${Math.min(s.outcomeCount, 20)}/20 outcomes`,
  },

  // ============ TRACK 3 — The Atelier (outfits) ============
  {
    id: "first-look",
    title: "First Look",
    metal: "bronze", track: "outfits", tier: 1, finish: 1,
    glyph: "👗", motif: "needle",
    blurb: "Posted your first outfit.",
    lore: "A bone needle — the oldest tool of dress, 40,000 years old.",
    earned: (s) => s.outfitPosts >= 1,
    progress: (s) => (s.outfitPosts >= 1 ? null : "Post 1 outfit"),
  },
  {
    id: "stylist",
    title: "Stylist",
    metal: "silver", track: "outfits", tier: 2, finish: 2,
    glyph: "✂️", motif: "shears",
    blurb: "Posted 6 outfits to the community.",
    lore: "The tailor's shears — mark of a working atelier.",
    earned: (s) => s.outfitPosts >= 6,
    progress: (s) => (s.outfitPosts >= 6 ? null : `${s.outfitPosts}/6 outfits posted`),
  },
  {
    id: "couturier",
    title: "Couturier",
    metal: "gold", track: "outfits", tier: 3, finish: 4,
    glyph: "🧵", motif: "loom",
    blurb: "Posted 15 outfits and earned 150+ total likes.",
    lore: "The Jacquard loom — where pattern becomes craft at scale.",
    earned: (s) => s.outfitPosts >= 15 && s.outfitLikes >= 150,
    progress: (s) =>
      s.outfitPosts >= 15 && s.outfitLikes >= 150
        ? null
        : `${Math.min(s.outfitPosts, 15)}/15 posts · ${Math.min(s.outfitLikes, 150)}/150 likes`,
  },
  {
    id: "atelier-master",
    title: "Atelier Master",
    metal: "platinum", track: "outfits", tier: 4, finish: 4,
    glyph: "🏆", motif: "loom",
    blurb: "30 outfits and 500+ total likes.",
    lore: "A maison's head atelier — output sustained at the highest standard.",
    earned: (s) => s.outfitPosts >= 30 && s.outfitLikes >= 500,
    progress: (s) =>
      s.outfitPosts >= 30 && s.outfitLikes >= 500
        ? null
        : `${Math.min(s.outfitPosts, 30)}/30 posts · ${Math.min(s.outfitLikes, 500)}/500 likes`,
  },

  // ============ RARE CAPSTONES (hard; scarcity = prestige) ============
  // Diamond and obsidian sit at the top of the LADDER; amethyst / jade / amber
  // are SPECIAL honors for unusual feats, not steps on the ladder.
  {
    id: "acclaimed",
    title: "Acclaimed",
    metal: "diamond", track: "capstone", tier: 1, finish: 4,
    glyph: "💎", motif: "gem",
    blurb: "250+ likes on a single look.",
    lore: "A cut brilliant — one look the whole community admired.",
    earned: (s) => s.topOutfitLikes >= 250,
    progress: (s) => (s.topOutfitLikes >= 250 ? null : `${s.topOutfitLikes}/250 likes on your best look`),
  },
  {
    id: "tastemaker",
    title: "Tastemaker",
    metal: "amethyst", track: "capstone", tier: 2, finish: 5,
    glyph: "🔮", motif: "gem",
    blurb: "Special honor — 1,500+ total likes across your looks.",
    lore: "Amethyst, once valued with diamond — worn by those who set the taste.",
    earned: (s) => s.outfitLikes >= 1500,
    progress: (s) => (s.outfitLikes >= 1500 ? null : `${s.outfitLikes}/1500 total likes`),
  },
  {
    id: "polymath",
    title: "Polymath",
    metal: "jade", track: "capstone", tier: 3, finish: 5,
    glyph: "🌿", motif: "compass-rose",
    blurb: "Special honor — mastered all three tracks (gold or above in each).",
    lore: "Imperial jade with agate veining — breadth, not just depth.",
    earned: (s) =>
      s.closetCount >= 45 && s.brandsCount >= 10 &&
      s.communityListed && s.closetCount >= 15 &&
      s.outfitPosts >= 15 && s.outfitLikes >= 150,
    progress: (s) => {
      const done =
        (s.closetCount >= 45 && s.brandsCount >= 10 ? 1 : 0) +
        (s.communityListed && s.closetCount >= 15 ? 1 : 0) +
        (s.outfitPosts >= 15 && s.outfitLikes >= 150 ? 1 : 0);
      return done === 3 ? null : `${done}/3 tracks at gold`;
    },
  },
  {
    id: "head-designer",
    title: "Head Designer",
    metal: "obsidian", track: "capstone", tier: 4, finish: 5,
    glyph: "👑", motif: "crown",
    blurb: "The pinnacle — 4,000+ total likes across your looks.",
    lore: "Obsidian, prized since antiquity — rare, dark, and exacting.",
    earned: (s) => s.outfitLikes >= 4000,
    progress: (s) => (s.outfitLikes >= 4000 ? null : `${s.outfitLikes}/4000 total likes`),
  },
];

const BY_ID: Record<string, BadgeDef> = Object.fromEntries(BADGES.map((b) => [b.id, b]));

export function badgeById(id: string): BadgeDef | undefined {
  return BY_ID[id];
}

export type EarnedBadge = BadgeDef & { earnedNow: boolean; progressText: string | null };

export function evaluateBadges(stats: BadgeStats): EarnedBadge[] {
  return BADGES.map((b) => ({
    ...b,
    earnedNow: !b.locked && !!b.earned?.(stats),
    progressText: b.locked ? (b.comingSoon ?? null) : (b.progress?.(stats) ?? null),
  }));
}

export function earnedBadgeIds(stats: BadgeStats): string[] {
  return evaluateBadges(stats)
    .filter((b) => b.earnedNow)
    .sort((a, b) => METAL_RANK[b.metal] - METAL_RANK[a.metal])
    .map((b) => b.id);
}

/** Badges grouped by track, tiers in order — for the library UI. */
export function badgesByTrack(): Array<{ track: BadgeTrack; label: string; badges: BadgeDef[] }> {
  const order: BadgeTrack[] = ["closet", "feedback", "outfits", "capstone"];
  return order.map((track) => ({
    track,
    label: TRACK_LABEL[track],
    badges: BADGES.filter((b) => b.track === track).sort((a, b) => a.tier - b.tier),
  }));
}

export function parsePinned(csv: string | null | undefined): string[] {
  return (csv ?? "").split(",").map((s) => s.trim()).filter(Boolean).slice(0, 3);
}
