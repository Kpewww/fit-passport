// The wear calendar's rules (Session 104): what a day is, what seasons are, what a
// request to log a day may contain, and how often each piece was worn.
//
// Kept apart from the route so the rules can be tested. Only status "worn" counts:
// a planned day is a wish until the wearer confirms it (research, 2026-10-24: apps
// that count plans or generated looks as worn pollute what they learn).

import { z } from "zod";
import { prisma } from "./db";
import { DIRECTION_MIN, DIRECTION_MAX, clampDirection } from "./fitDirection";

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

const DAY_RE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
export const DayInput = z.string().regex(DAY_RE, "a day is YYYY-MM-DD").refine((d) => !Number.isNaN(Date.parse(`${d}T00:00:00Z`)), "not a real day");

/** Days between two "YYYY-MM-DD" (b − a). */
export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
}

/** The server's today as a day string, give or take the wearer's timezone (±1 allowed below). */
export const serverToday = (now = new Date()) => now.toISOString().slice(0, 10);

const Fit = z.object({
  itemId: z.string().min(1).max(40),
  direction: z.coerce.number().min(DIRECTION_MIN).max(DIRECTION_MAX).transform(clampDirection),
});

export const LogInput = z
  .object({
    day: DayInput,
    status: z.enum(["worn", "planned"]).default("worn"),
    itemIds: z.array(z.string().min(1).max(40)).min(1).max(15),
    outfitId: z.string().max(40).optional().nullable(),
    note: z.string().max(300).optional().nullable(),
    /** "Does it still fit?" answers, only for pieces in this day and only when worn. */
    fits: z.array(Fit).max(15).optional(),
  })
  // A worn day cannot be in the future (one day of slack for timezones); a plan can.
  .refine((d) => d.status === "planned" || daysBetween(serverToday(), d.day) <= 1, { message: "a worn day cannot be in the future", path: ["day"] })
  .refine((d) => !d.fits?.length || d.status === "worn", { message: "fit answers belong to a worn day", path: ["fits"] })
  .refine((d) => (d.fits ?? []).every((f) => d.itemIds.includes(f.itemId)), { message: "a fit answer must be for a piece worn that day", path: ["fits"] });

export const PatchInput = z.object({
  id: z.string().min(1).max(40),
  /** Confirm a plan as worn. There is no way back to "planned": undo by deleting. */
  status: z.literal("worn").optional(),
  note: z.string().max(300).optional().nullable(),
  fits: z.array(Fit).max(15).optional(),
});

export type WearStat = { count: number; lastDay: string | null };

/** How often each of a user's pieces was worn, and when last. Planned days do not count. */
export async function wearStats(userId: string): Promise<Map<string, WearStat>> {
  const rows = await prisma.wearLogItem.findMany({
    where: { wearLog: { userId, status: "worn" } },
    select: { itemId: true, wearLog: { select: { day: true } } },
  });
  const out = new Map<string, WearStat>();
  for (const r of rows) {
    const s = out.get(r.itemId) ?? { count: 0, lastDay: null };
    s.count += 1;
    if (!s.lastDay || r.wearLog.day > s.lastDay) s.lastDay = r.wearLog.day;
    out.set(r.itemId, s);
  }
  return out;
}
