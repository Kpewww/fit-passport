// Reporting + takedown rules.
//
// Moderation was listed in docs/design/community-ecosystem.md as something that
// "must not be an afterthought", so it gets the same treatment as the fit engine:
// the rules live in one testable place instead of being scattered through routes.

export type ReportKind = "POST" | "ANSWER" | "OUTFIT";

const KINDS = new Set<string>(["POST", "ANSWER", "OUTFIT"]);

export function parseReportKind(raw: string | null | undefined): ReportKind | null {
  if (!raw) return null;
  const up = raw.toUpperCase();
  return KINDS.has(up) ? (up as ReportKind) : null;
}

export const REPORT_REASONS: Array<{ key: string; label: string }> = [
  { key: "SPAM", label: "Spam or advertising" },
  // Named explicitly because it's our specific legal exposure: we allow only
  // user-taken photos, never scraped brand imagery.
  { key: "STOLEN_IMAGE", label: "Not their photo / brand imagery" },
  { key: "ABUSE", label: "Abusive or harassing" },
  { key: "MISLEADING", label: "Misleading fit advice" },
  { key: "OTHER", label: "Something else" },
];

const REASONS = new Set(REPORT_REASONS.map((r) => r.key));

export function parseReportReason(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const up = raw.toUpperCase();
  return REASONS.has(up) ? up : null;
}

/**
 * How many DISTINCT reporters auto-hide a piece of content.
 *
 * This is a blunt instrument and we should be honest about it: three coordinated
 * accounts can hide something legitimate. It's set deliberately low anyway,
 * because at this stage nobody is watching a queue, and the failure mode we care
 * about more is abusive content staying up for days. `hidden` is reversible, the
 * author keeps seeing their own content, and scripts/moderate.mjs is the
 * authoritative restore path. Replace this with a review queue before real scale.
 */
export const REPORT_HIDE_THRESHOLD = 3;

export function shouldAutoHide(distinctReporters: number): boolean {
  return distinctReporters >= REPORT_HIDE_THRESHOLD;
}

/** Reports still needed before content is auto-hidden (0 once it's hit). */
export function reportsUntilHidden(distinctReporters: number): number {
  return Math.max(0, REPORT_HIDE_THRESHOLD - distinctReporters);
}
