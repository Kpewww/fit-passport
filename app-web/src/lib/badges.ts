// Badge system — the "prestige layer" that makes a passport worth showing off.
//
// Like the fit engine, badges are TRANSPARENT and earned from REAL data (closet
// size, recorded outcomes, organization, community participation) — never faked.
// Each badge has a metal tier and a plain-language "how you earned it" line, so
// the whole thing is auditable and honest.
//
// Some tiers depend on features that don't exist yet (outfit posts, likes). Those
// badges are declared here as `locked: true` with a "coming soon" note, so the
// full ladder is visible and aspirational without shipping fake counts. When the
// outfit/social features land, we flip `locked` off and add their `earned` rule.

export type Metal =
  | "bronze"
  | "silver"
  | "gold"
  | "obsidian"
  | "diamond"
  | "jade";

export type BadgeStats = {
  closetCount: number;
  outcomeCount: number;
  collectionsUsed: number; // # of non-empty collections
  refreshCount: number; // # of comfort checks recorded
  brandsCount: number; // distinct brands in closet
  communityListed: boolean;
  // Staged (not yet real): outfit posts + likes. Present so rules can read them
  // once the feature exists; currently always 0.
  outfitPosts: number;
  outfitLikes: number;
};

export type BadgeDef = {
  id: string;
  title: string; // shown on the badge
  metal: Metal;
  glyph: string; // emoji shown in the seal
  blurb: string; // what it represents
  // How the user earns it, from real stats. Locked badges have no earn rule yet.
  earned?: (s: BadgeStats) => boolean;
  // Progress toward earning it, "3/5" style (optional).
  progress?: (s: BadgeStats) => string | null;
  locked?: boolean; // depends on a feature not built yet
  comingSoon?: string; // why it's locked
};

// Metal → visual treatment (used by the seal + badge chips). Tailwind classes.
export const METAL_STYLE: Record<Metal, { ring: string; bg: string; text: string; label: string }> = {
  bronze: { ring: "ring-amber-700/40", bg: "bg-gradient-to-br from-amber-600 to-amber-800", text: "text-amber-50", label: "Bronze" },
  silver: { ring: "ring-slate-400/50", bg: "bg-gradient-to-br from-slate-300 to-slate-500", text: "text-slate-900", label: "Silver" },
  gold: { ring: "ring-yellow-500/50", bg: "bg-gradient-to-br from-yellow-400 to-amber-600", text: "text-yellow-950", label: "Gold" },
  obsidian: { ring: "ring-neutral-700/60", bg: "bg-gradient-to-br from-neutral-800 to-black", text: "text-neutral-100", label: "Obsidian" },
  diamond: { ring: "ring-cyan-300/60", bg: "bg-gradient-to-br from-cyan-200 via-white to-sky-300", text: "text-sky-900", label: "Diamond" },
  jade: { ring: "ring-emerald-400/60", bg: "bg-gradient-to-br from-emerald-300 to-green-600", text: "text-emerald-950", label: "Jade" },
};

// The full ladder. Order matters — earned-and-highest first is a nice default.
export const BADGES: BadgeDef[] = [
  // ---- Closet-building (bronze → gold) ----
  {
    id: "starter",
    title: "Verified Closet",
    metal: "bronze",
    glyph: "🥉",
    blurb: "Added at least 5 known-good garments.",
    earned: (s) => s.closetCount >= 5,
    progress: (s) => (s.closetCount >= 5 ? null : `${s.closetCount}/5 items`),
  },
  {
    id: "curator",
    title: "Curator",
    metal: "silver",
    glyph: "🥈",
    blurb: "A well-organized closet — 12+ items across 3+ collections.",
    earned: (s) => s.closetCount >= 12 && s.collectionsUsed >= 3,
    progress: (s) =>
      s.closetCount >= 12 && s.collectionsUsed >= 3
        ? null
        : `${Math.min(s.closetCount, 12)}/12 items · ${Math.min(s.collectionsUsed, 3)}/3 collections`,
  },
  {
    id: "archivist",
    title: "Wardrobe Archivist",
    metal: "gold",
    glyph: "🏅",
    blurb: "A serious wardrobe — 25+ items spanning 6+ brands.",
    earned: (s) => s.closetCount >= 25 && s.brandsCount >= 6,
    progress: (s) =>
      s.closetCount >= 25 && s.brandsCount >= 6
        ? null
        : `${Math.min(s.closetCount, 25)}/25 items · ${Math.min(s.brandsCount, 6)}/6 brands`,
  },

  // ---- Feedback loop (silver → gold) ----
  {
    id: "truth-teller",
    title: "Truth-Teller",
    metal: "silver",
    glyph: "📋",
    blurb: "Recorded how 3+ purchases actually fit — the data that improves everyone's sizing.",
    earned: (s) => s.outcomeCount >= 3,
    progress: (s) => (s.outcomeCount >= 3 ? null : `${s.outcomeCount}/3 outcomes`),
  },
  {
    id: "calibrated",
    title: "Calibrated",
    metal: "gold",
    glyph: "🎯",
    blurb: "Kept your fit fresh — 10+ comfort refreshes recorded.",
    earned: (s) => s.refreshCount >= 10,
    progress: (s) => (s.refreshCount >= 10 ? null : `${s.refreshCount}/10 refreshes`),
  },

  // ---- Community (bronze) ----
  {
    id: "public-figure",
    title: "Open Closet",
    metal: "bronze",
    glyph: "🌐",
    blurb: "Shared your closet to the public community directory.",
    earned: (s) => s.communityListed,
    progress: (s) => (s.communityListed ? null : "List your closet in Community"),
  },

  // ---- Staged / aspirational (locked until outfits + likes exist) ----
  {
    id: "stylist",
    title: "Stylist",
    metal: "obsidian",
    glyph: "🖤",
    blurb: "Post 3 complete outfits to the community.",
    locked: true,
    comingSoon: "Unlocks when outfit posting ships.",
  },
  {
    id: "acclaimed",
    title: "Acclaimed",
    metal: "diamond",
    glyph: "💎",
    blurb: "An outfit that the community loves — 100+ likes.",
    locked: true,
    comingSoon: "Unlocks with outfit likes.",
  },
  {
    id: "head-designer",
    title: "Head Designer",
    metal: "jade",
    glyph: "🟢",
    blurb: "A top-ranked tastemaker — the community's most-followed looks.",
    locked: true,
    comingSoon: "Unlocks with the outfit leaderboard.",
  },
];

const BY_ID: Record<string, BadgeDef> = Object.fromEntries(BADGES.map((b) => [b.id, b]));

export function badgeById(id: string): BadgeDef | undefined {
  return BY_ID[id];
}

export type EarnedBadge = BadgeDef & { earnedNow: boolean; progressText: string | null };

/** Evaluate every badge against a user's stats. */
export function evaluateBadges(stats: BadgeStats): EarnedBadge[] {
  return BADGES.map((b) => ({
    ...b,
    earnedNow: !b.locked && !!b.earned?.(stats),
    progressText: b.locked ? (b.comingSoon ?? null) : (b.progress?.(stats) ?? null),
  }));
}

/** Just the earned badge IDs, highest-tier-first for a nice default pin order. */
const METAL_RANK: Record<Metal, number> = {
  jade: 6, diamond: 5, obsidian: 4, gold: 3, silver: 2, bronze: 1,
};
export function earnedBadgeIds(stats: BadgeStats): string[] {
  return evaluateBadges(stats)
    .filter((b) => b.earnedNow)
    .sort((a, b) => METAL_RANK[b.metal] - METAL_RANK[a.metal])
    .map((b) => b.id);
}

/** Parse/format the comma-separated pinned list (max 3, only earned + valid). */
export function parsePinned(csv: string | null | undefined): string[] {
  return (csv ?? "").split(",").map((s) => s.trim()).filter(Boolean).slice(0, 3);
}
