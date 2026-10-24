// Seasons a closet piece is for (Session 104). Pure, so the closet page can filter by
// them in the browser; lib/wear.ts re-exports them for the server.

import { z } from "zod";

export const SEASONS = ["spring", "summer", "autumn", "winter"] as const;
export type Season = (typeof SEASONS)[number];

/** "spring,winter" in a canonical order; null for none (= every season). */
export function normaliseSeasons(v: string | string[] | null | undefined): string | null {
  const list = (Array.isArray(v) ? v : (v ?? "").split(",")).map((s) => s.trim().toLowerCase());
  const kept = SEASONS.filter((s) => list.includes(s));
  return kept.length === 0 || kept.length === SEASONS.length ? null : kept.join(",");
}

export const SeasonsInput = z
  .union([z.string().max(60), z.array(z.string().max(10)).max(4)])
  .nullable()
  .transform(normaliseSeasons);

/** True when an item tagged with these seasons is meant for `season` (untagged = always). */
export function inSeason(seasons: string | null | undefined, season: Season): boolean {
  return !seasons || seasons.split(",").includes(season);
}

