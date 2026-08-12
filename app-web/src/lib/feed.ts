// Community feed scoping + ranking.
//
// Two scopes with deliberately DIFFERENT orderings, because they answer
// different questions:
//
//   everyone  → most-liked first. A discovery surface: quality should float up,
//               so a newcomer scrolling for the first time sees the best looks.
//   following → newest first. A subscription surface: recency IS the point.
//               Ranking a followed feed by likes would bury the people you
//               explicitly chose behind whoever happens to be popular.
//
// Kept as pure functions so the ordering rules are unit-tested rather than
// buried in a route handler.

export type FeedScope = "everyone" | "following";

/** Parse the `?scope=` query param, defaulting to the public feed. */
export function parseFeedScope(raw: string | null | undefined): FeedScope {
  return raw === "following" ? "following" : "everyone";
}

type Rankable = { likeCount: number; createdAt: string | Date };

/**
 * Order a feed for the given scope. Non-mutating — returns a new array, since
 * callers hold onto the unsorted list for counts.
 */
export function rankFeed<T extends Rankable>(entries: T[], scope: FeedScope): T[] {
  const t = (v: string | Date) => (v instanceof Date ? v.getTime() : new Date(v).getTime());
  return entries.slice().sort((a, b) =>
    scope === "following"
      ? t(b.createdAt) - t(a.createdAt)
      : // Recency breaks like-count ties, so the order is stable and fresh
        // posts aren't stranded behind equally-liked old ones.
        b.likeCount - a.likeCount || t(b.createdAt) - t(a.createdAt),
  );
}
