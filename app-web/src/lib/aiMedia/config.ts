// AI photo processing: which services are on, what they cost, and the limits
// (Session 104, docs/plans/product-upgrade-2026-10-24.md phase 4).
//
// Everything here is off until its key is set, and the whole feature is off until
// the founder sets a monthly budget: AI_MONTHLY_BUDGET_USD=0 (the default) sends
// nothing anywhere. Prices are the providers' published per-image rates on
// 2026-10-24 (docs/research/virtual-tryon-and-cutout-2026-10-24.md); the budget
// check counts them, so a price change means changing them here.

export type AiKind = "cutout" | "tryon";

export const COST_USD: Readonly<Record<AiKind, number>> = {
  cutout: 0.018, // BRIA background removal, per image
  tryon: 0.075,  // FASHN try-on v1.6, one credit per output
};

const num = (v: string | undefined, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};

/** The site-wide monthly cap in USD. 0 = AI photo features off. */
export const monthlyBudgetUsd = () => num(process.env.AI_MONTHLY_BUDGET_USD, 0);
/** Jobs one person may start per day, failures not counted. */
export const userDailyLimit = () => num(process.env.AI_USER_DAILY_LIMIT, 10);

export const providerFor: Readonly<Record<AiKind, string>> = { cutout: "bria", tryon: "fashn" };

/** Whether a kind can run at all: its key is set and there is a budget. */
export function aiEnabled(kind: AiKind): boolean {
  if (monthlyBudgetUsd() <= 0) return false;
  return kind === "cutout" ? !!process.env.BRIA_API_TOKEN : !!process.env.FASHN_API_KEY;
}
