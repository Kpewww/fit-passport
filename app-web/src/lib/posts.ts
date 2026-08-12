// Ask & Answer — kinds, answer ordering, and evidence shaping.
//
// Kept pure so the two decisions that actually matter to the product are
// unit-tested instead of inlined in a route:
//   1. which post kinds exist (the taxonomy the whole feature hangs off)
//   2. how answers are ordered (what the community sees first)

export type PostKind = "HELP" | "RECOMMEND" | "VERDICT";

export const POST_KINDS: Array<{
  kind: PostKind;
  label: string;
  /** What this kind is for, shown in the composer. */
  hint: string;
  /** Example title, so a first-time asker knows the expected specificity. */
  example: string;
}> = [
  {
    kind: "HELP",
    label: "Will this fit me?",
    hint: "You found something and want a read from people shaped like you.",
    example: "Patagonia down hoody — I'm broad through the shoulders, size up?",
  },
  {
    kind: "RECOMMEND",
    label: "What should I buy?",
    hint: "You know the job you need done, not the garment that does it.",
    example: "White tee that survives 30 washes without going see-through?",
  },
  {
    kind: "VERDICT",
    label: "Kept or returned",
    hint: "Report back on something you bought — the most useful post there is.",
    example: "Returned the COS oversized shirt: shoulders sat 4cm too wide.",
  },
];

const KIND_SET = new Set<string>(POST_KINDS.map((k) => k.kind));

/** Validate an incoming kind. Returns null when unrecognised — never guesses. */
export function parsePostKind(raw: string | null | undefined): PostKind | null {
  if (!raw) return null;
  const up = raw.toUpperCase();
  return KIND_SET.has(up) ? (up as PostKind) : null;
}

export function postKindLabel(kind: string): string {
  return POST_KINDS.find((k) => k.kind === kind)?.label ?? kind;
}

type Answerable = {
  id: string;
  helpfulCount: number;
  createdAt: string | Date;
};

/**
 * Order answers within a thread:
 *   1. the answer the asker accepted, always first — it's the resolution
 *   2. then most-helpful, because that's the crowd's read
 *   3. then OLDEST first, which rewards whoever showed up early rather than
 *      letting a late duplicate outrank the original
 */
export function rankAnswers<T extends Answerable>(
  answers: T[],
  resolvedAnswerId: string | null | undefined,
): T[] {
  const t = (v: string | Date) => (v instanceof Date ? v.getTime() : new Date(v).getTime());
  return answers.slice().sort((a, b) => {
    if (resolvedAnswerId) {
      if (a.id === resolvedAnswerId) return -1;
      if (b.id === resolvedAnswerId) return 1;
    }
    return b.helpfulCount - a.helpfulCount || t(a.createdAt) - t(b.createdAt);
  });
}
