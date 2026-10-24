// Spending limits for AI photo jobs (Session 104): a site-wide monthly cap and a
// per-person daily allowance. Failed jobs cost nothing (both providers do not charge
// for failures) and do not count against anyone.

import { prisma } from "../db";
import { COST_USD, aiEnabled, monthlyBudgetUsd, userDailyLimit, type AiKind } from "./config";

export type SpendCheck = { ok: true } | { ok: false; reason: "off" | "budget" | "daily" };

const startOfMonth = (now: Date) => new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
const startOfDay = (now: Date) => new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

/** What the site spent this month, counting running jobs at their price so a burst cannot overshoot. */
export async function monthSpendUsd(now = new Date()): Promise<number> {
  const r = await prisma.mediaJob.aggregate({ where: { createdAt: { gte: startOfMonth(now) }, status: { in: ["running", "done"] } }, _sum: { costUsd: true } });
  return r._sum.costUsd ?? 0;
}

export async function jobsToday(userId: string, now = new Date()): Promise<number> {
  return prisma.mediaJob.count({ where: { userId, createdAt: { gte: startOfDay(now) }, status: { in: ["running", "done"] } } });
}

export async function canSpend(userId: string, kind: AiKind, now = new Date()): Promise<SpendCheck> {
  if (!aiEnabled(kind)) return { ok: false, reason: "off" };
  if ((await monthSpendUsd(now)) + COST_USD[kind] > monthlyBudgetUsd()) return { ok: false, reason: "budget" };
  if ((await jobsToday(userId, now)) >= userDailyLimit()) return { ok: false, reason: "daily" };
  return { ok: true };
}
