// How often the recommended size was right, read from what people did after buying
// (Session 103). Only outcomes measure real accuracy: the evaluation's charts say
// what a page printed, not whether the shirt fit.
//
// For each outcome, the recommendation that counts is the latest one the same person
// got for the same product BEFORE reporting. What the outcome says the right size was:
//   - kept, fit about right (|direction| <= JUST_RIGHT, or not given): the size bought;
//   - exchanged: the size swapped to;
//   - returned or kept, too tight / too loose: only a side. Some size above (or
//     below) the one bought. The recommendation is "on the right side" when it
//     points that way, and is never counted as an exact hit;
//   - returned with no direction: says nothing about size (could be colour, quality).

import { alphaIndex, normalizeToAlpha } from "./sizing";

/** On the signed fit scale (-10 too tight .. +10 too loose), what counts as "about right". */
export const JUST_RIGHT = 2;

export type OutcomeRow = {
  userId: string;
  productId: string;
  purchasedSize: string;
  decision: string;
  exchangedForSize: string | null;
  fitDirection: number | null;
  createdAt: Date;
  /** The product's size labels, in chart order: used when labels are not S/M/L. */
  sizeLabels: string[];
};

export type RecRow = {
  userId: string;
  productId: string;
  recommendedSizeLabel: string;
  confidence: number;
  createdAt: Date;
};

export type Verdict =
  | "hit" // the recommendation was the size that turned out right
  | "miss" // a right size is known, and it was another
  | "right-side" // only a side is known, and the recommendation points that way
  | "wrong-side" // only a side is known, and the recommendation does not point that way
  | "no-signal"; // the outcome says nothing about size

export type Judged = {
  verdict: Verdict;
  /** The person bought the size recommended. */
  followed: boolean;
  confidence: number;
};

const norm = (s: string) => s.trim().toUpperCase().replace(/\s+/g, "");

// Letters only: a number like "48" also normalises to a letter, and two different
// numbers can land on the same one, which would make two sizes one.
const letter = (s: string) => (/[A-Z]/i.test(s) ? normalizeToAlpha(s) : null);

/** Positions of two sizes: the product's own chart order when it lists both, else the S/M/L ladder. */
function ranks(a: string, b: string, labels: string[]): [number, number] | null {
  const i = labels.findIndex((l) => norm(l) === norm(a));
  const j = labels.findIndex((l) => norm(l) === norm(b));
  if (i !== -1 && j !== -1) return [i, j];
  const x = alphaIndex(letter(a)), y = alphaIndex(letter(b));
  return x != null && y != null ? [x, y] : null;
}

function same(a: string, b: string): boolean {
  if (norm(a) === norm(b)) return true;
  const x = letter(a), y = letter(b);
  return x != null && x === y;
}

export function judge(o: OutcomeRow, rec: RecRow): Judged {
  const r = rec.recommendedSizeLabel;
  const followed = same(o.purchasedSize, r);
  const out = (verdict: Verdict): Judged => ({ verdict, followed, confidence: rec.confidence });
  const dir = o.fitDirection;

  if (o.decision === "exchange" && o.exchangedForSize) return out(same(o.exchangedForSize, r) ? "hit" : "miss");
  if (o.decision === "keep" && (dir == null || Math.abs(dir) <= JUST_RIGHT)) return out(followed ? "hit" : "miss");
  if (dir == null || Math.abs(dir) <= JUST_RIGHT) return out("no-signal"); // returned, no size reason

  // Too tight (dir < 0): the right size is above the one bought; too loose: below.
  const pos = ranks(o.purchasedSize, r, o.sizeLabels);
  if (!pos) return out("no-signal");
  const [bought, recd] = pos;
  const pointsRight = dir < 0 ? recd > bought : recd < bought;
  return out(pointsRight ? "right-side" : "wrong-side");
}

export type Band = { from: number; to: number; n: number; hits: number };

export type Accuracy = {
  outcomes: number;
  /** Outcomes with a recommendation before them: the only ones that can be judged. */
  judged: number;
  followed: number;
  verdicts: Record<Verdict, number>;
  /** hits / (hits + misses): the exact-size accuracy, or null with nothing to judge. */
  exactRate: number | null;
  /** By the confidence the engine stated: does 80% confidence mean 80% right? */
  bands: Band[];
};

const BANDS: Array<[number, number]> = [[0, 0.5], [0.5, 0.65], [0.65, 0.8], [0.8, 1.0001]];

export function accuracy(outcomes: OutcomeRow[], recs: RecRow[]): Accuracy {
  const byKey = new Map<string, RecRow[]>();
  for (const r of recs) {
    const k = `${r.userId}|${r.productId}`;
    byKey.set(k, [...(byKey.get(k) ?? []), r]);
  }
  const verdicts: Record<Verdict, number> = { hit: 0, miss: 0, "right-side": 0, "wrong-side": 0, "no-signal": 0 };
  const bands: Band[] = BANDS.map(([from, to]) => ({ from, to: Math.min(to, 1), n: 0, hits: 0 }));
  let judged = 0, followed = 0;
  for (const o of outcomes) {
    const before = (byKey.get(`${o.userId}|${o.productId}`) ?? []).filter((r) => r.createdAt <= o.createdAt);
    if (!before.length) continue;
    const rec = before.reduce((a, b) => (b.createdAt > a.createdAt ? b : a));
    const j = judge(o, rec);
    judged++;
    if (j.followed) followed++;
    verdicts[j.verdict]++;
    if (j.verdict === "hit" || j.verdict === "miss") {
      const i = BANDS.findIndex(([from, to]) => j.confidence >= from && j.confidence < to);
      if (i !== -1) { bands[i].n++; if (j.verdict === "hit") bands[i].hits++; }
    }
  }
  const exact = verdicts.hit + verdicts.miss;
  return { outcomes: outcomes.length, judged, followed, verdicts, exactRate: exact ? verdicts.hit / exact : null, bands };
}
