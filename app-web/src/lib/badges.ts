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

export type Metal =
  | "bronze"
  | "silver"
  | "gold"
  | "obsidian"
  | "diamond"
  | "jade";

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
  obsidian: { ring: "ring-neutral-700/60", bg: "bg-gradient-to-br from-neutral-800 to-black", text: "text-neutral-100", label: "Obsidian" },
  diamond: { ring: "ring-cyan-300/60", bg: "bg-gradient-to-br from-cyan-200 via-white to-sky-300", text: "text-sky-900", label: "Diamond" },
  jade: { ring: "ring-emerald-400/60", bg: "bg-gradient-to-br from-emerald-300 to-green-600", text: "text-emerald-950", label: "Jade" },
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
    blurb: "Added at least 5 known-good garments.",
    lore: "A plain struck token — every archive begins with a first inventory.",
    earned: (s) => s.closetCount >= 5,
    progress: (s) => (s.closetCount >= 5 ? null : `${s.closetCount}/5 items`),
  },
  {
    id: "curator",
    title: "Curator",
    metal: "silver", track: "closet", tier: 2, finish: 2,
    glyph: "🥈", motif: "shelves",
    blurb: "12+ items organized across 3+ collections.",
    lore: "The Renaissance 'guardaroba' — the keeper of a well-ordered wardrobe.",
    earned: (s) => s.closetCount >= 12 && s.collectionsUsed >= 3,
    progress: (s) =>
      s.closetCount >= 12 && s.collectionsUsed >= 3
        ? null
        : `${Math.min(s.closetCount, 12)}/12 items · ${Math.min(s.collectionsUsed, 3)}/3 collections`,
  },
  {
    id: "archivist",
    title: "Wardrobe Archivist",
    metal: "gold", track: "closet", tier: 3, finish: 3,
    glyph: "🏅", motif: "archive",
    blurb: "25+ items spanning 6+ brands.",
    lore: "An imperial silk archive — breadth across houses and eras.",
    earned: (s) => s.closetCount >= 25 && s.brandsCount >= 6,
    progress: (s) =>
      s.closetCount >= 25 && s.brandsCount >= 6
        ? null
        : `${Math.min(s.closetCount, 25)}/25 items · ${Math.min(s.brandsCount, 6)}/6 brands`,
  },

  // ============ TRACK 2 — The Fit Record (feedback loop) ============
  {
    id: "truth-teller",
    title: "Truth-Teller",
    metal: "bronze", track: "feedback", tier: 1, finish: 0,
    glyph: "📋", motif: "tablet",
    blurb: "Recorded how 3+ purchases actually fit.",
    lore: "A Roman wax tablet — the honest ledger of what fit and what didn't.",
    earned: (s) => s.outcomeCount >= 3,
    progress: (s) => (s.outcomeCount >= 3 ? null : `${s.outcomeCount}/3 outcomes`),
  },
  {
    id: "calibrated",
    title: "Calibrated",
    metal: "silver", track: "feedback", tier: 2, finish: 2,
    glyph: "🎯", motif: "gnomon",
    blurb: "Logged 10+ comfort refreshes over time.",
    lore: "The gnomon of a sundial — measurement kept true as the body changes.",
    earned: (s) => s.refreshCount >= 10,
    progress: (s) => (s.refreshCount >= 10 ? null : `${s.refreshCount}/10 refreshes`),
  },
  {
    id: "open-closet",
    title: "Open Closet",
    metal: "gold", track: "feedback", tier: 3, finish: 3,
    glyph: "🌐", motif: "compass-rose",
    blurb: "Shared your closet to the public community.",
    lore: "A cartographer's compass rose — putting your fit on the shared map.",
    earned: (s) => s.communityListed,
    progress: (s) => (s.communityListed ? null : "List your closet in Community"),
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
    blurb: "Posted 3 outfits to the community.",
    lore: "The tailor's shears — mark of a working atelier.",
    earned: (s) => s.outfitPosts >= 3,
    progress: (s) => (s.outfitPosts >= 3 ? null : `${s.outfitPosts}/3 outfits posted`),
  },
  {
    id: "couturier",
    title: "Couturier",
    metal: "gold", track: "outfits", tier: 3, finish: 4,
    glyph: "🧵", motif: "loom",
    blurb: "Posted 8 outfits and earned 50+ total likes.",
    lore: "The Jacquard loom — where pattern becomes craft at scale.",
    earned: (s) => s.outfitPosts >= 8 && s.outfitLikes >= 50,
    progress: (s) =>
      s.outfitPosts >= 8 && s.outfitLikes >= 50
        ? null
        : `${Math.min(s.outfitPosts, 8)}/8 posts · ${Math.min(s.outfitLikes, 50)}/50 likes`,
  },

  // ============ RARE CAPSTONES (hard; scarcity = prestige) ============
  {
    id: "acclaimed",
    title: "Acclaimed",
    metal: "diamond", track: "capstone", tier: 1, finish: 4,
    glyph: "💎", motif: "gem",
    blurb: "100+ likes on a single look.",
    lore: "A cut brilliant — one look the whole community admired.",
    earned: (s) => s.topOutfitLikes >= 100,
    progress: (s) => (s.topOutfitLikes >= 100 ? null : `${s.topOutfitLikes}/100 likes on your best look`),
  },
  {
    id: "tastemaker",
    title: "Tastemaker",
    metal: "obsidian", track: "capstone", tier: 2, finish: 5,
    glyph: "🖤", motif: "obelisk",
    blurb: "500+ total likes across your looks.",
    lore: "Obsidian, prized since antiquity — rare, dark, and exacting.",
    earned: (s) => s.outfitLikes >= 500,
    progress: (s) => (s.outfitLikes >= 500 ? null : `${s.outfitLikes}/500 total likes`),
  },
  {
    id: "head-designer",
    title: "Head Designer",
    metal: "jade", track: "capstone", tier: 3, finish: 5,
    glyph: "👑", motif: "crown",
    blurb: "A true tastemaker — 1000+ total likes across your looks.",
    lore: "Imperial jade — reserved, in old China, for the very highest rank.",
    earned: (s) => s.outfitLikes >= 1000,
    progress: (s) => (s.outfitLikes >= 1000 ? null : `${s.outfitLikes}/1000 total likes`),
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

const METAL_RANK: Record<Metal, number> = {
  jade: 6, diamond: 5, obsidian: 4, gold: 3, silver: 2, bronze: 1,
};
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
