// Which likes and helpful votes COUNT toward rankings and badges.
//
// Anyone with a session may like a look or mark an answer helpful — that stays,
// because it is feedback. But the daily leaderboard and the badges are STATUS that
// other people see, and before Session 78 they counted every like, including:
//   • anonymous ones — an anonymous account is one cleared cookie away, so a single
//     person could raise any look's count without limit;
//   • the author's own — a claimed user could like their own looks.
//
// So a vote counts only when it was cast by a CLAIMED account that is not the
// author. Claiming costs a username and a password and is rate-limited per network,
// which makes a vote cost something without asking anyone for an email address.
// This is the per-feature version of the defences cross-user brand knowledge
// would need (docs/design/scoring-system.md §9).

/** Prisma `where` fragment for a like or vote that counts, given the content's author. */
export function countedVoteWhere(authorId: string): { userId: { not: null; notIn: string[] } } {
  return { userId: { not: null, notIn: [authorId] } };
}

/** Prisma `where` fragment when the author is joined through the relation instead. */
export const COUNTED_VOTE: { userId: { not: null } } = { userId: { not: null } };
