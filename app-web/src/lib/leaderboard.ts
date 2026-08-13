// Daily Top Outfits + Top Stylists — ecosystem step 3.
//
// The point of a DAILY board is that it resets: a newcomer who posts a good look
// today can top it today, which a lifetime-totals board can never offer. So every
// number here is counted **inside a time window**, never all-time.
//
// Scoring is deliberately transparent and testable, the same principle as the fit
// engine: a reader should be able to reconstruct any rank by hand.

export type LeaderWindow = "today" | "week";

/** Parse `?window=`; anything unrecognised falls back to the daily board. */
export function parseLeaderWindow(raw: string | null | undefined): LeaderWindow {
  return raw === "week" ? "week" : "today";
}

export const WINDOW_LABEL: Record<LeaderWindow, string> = {
  today: "Today",
  week: "This week",
};

/**
 * Start of the window, in UTC.
 *
 * UTC rather than the viewer's local midnight, on purpose: a leaderboard has to
 * be the SAME board for everyone, or two people comparing ranks disagree. "week"
 * is a rolling 7 UTC days INCLUDING today, not an ISO calendar week — a rolling
 * window keeps the board alive on a Monday morning.
 */
export function windowStart(w: LeaderWindow, now: number): Date {
  const d = new Date(now);
  const utcMidnight = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  return new Date(w === "week" ? utcMidnight - 6 * 86_400_000 : utcMidnight);
}

/**
 * How a stylist's standing is earned. A "helpful" vote on an answer is worth more
 * than a like on a look because it costs the voter more thought — someone had to
 * read a paragraph and decide it was useful. Notably absent: follower count.
 * Status here is earned from what you did in the window, not from an audience you
 * accumulated once.
 */
export const STYLIST_WEIGHTS = { like: 1, helpful: 3 } as const;

export function stylistScore(x: { likes: number; helpful: number }): number {
  return x.likes * STYLIST_WEIGHTS.like + x.helpful * STYLIST_WEIGHTS.helpful;
}

type StylistRow = { username: string | null; likes: number; helpful: number };

/**
 * Rank stylists, highest score first. Ties break on username so the board is
 * STABLE — the same inputs must always produce the same order, or ranks appear to
 * shuffle on every refresh. Rows that earned nothing are dropped: appearing on a
 * leaderboard with a score of zero is worse than not appearing.
 */
export function rankStylists<T extends StylistRow>(rows: T[]): Array<T & { score: number }> {
  return rows
    .map((r) => ({ ...r, score: stylistScore(r) }))
    .filter((r) => r.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.helpful - a.helpful || // deeper contribution wins a tie
        (a.username ?? "").localeCompare(b.username ?? ""),
    );
}

type LookRow = { likesInWindow: number; likeCount: number; createdAt: string | Date };

/**
 * Rank looks by likes earned INSIDE the window. All-time likes only break ties, so
 * an old favourite can't camp at the top of today's board.
 */
export function rankTopLooks<T extends LookRow>(rows: T[]): T[] {
  const t = (v: string | Date) => (v instanceof Date ? v.getTime() : new Date(v).getTime());
  return rows
    .slice()
    .filter((r) => r.likesInWindow > 0)
    .sort(
      (a, b) =>
        b.likesInWindow - a.likesInWindow ||
        b.likeCount - a.likeCount ||
        t(b.createdAt) - t(a.createdAt),
    );
}
