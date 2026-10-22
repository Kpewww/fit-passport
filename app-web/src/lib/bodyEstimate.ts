// A body estimate that narrows with every piece of evidence (Session 102).
//
// Session 101 read the labels of pieces that FIT into body ranges and took their
// overlap. Two kinds of evidence were thrown away: a piece the wearer says is tight or
// loose, and what happened after a purchase (kept, returned, exchanged). Both say
// something about the body:
//   - "my XL is tight": the chest is at least the middle of XL's range;
//   - "returned the M, too small": the chest is at least the middle of that M's range;
//   - "exchanged M for L": the chest is in L's range, the strongest a person can say.
// Each becomes a constraint on one dimension, with a strength. Constraints are taken
// strongest first; one that would leave no room at all is set aside and NAMED, never
// dropped silently. An estimate needs both a lower and an upper bound.
//
// Pure: no database, no locale. recommendService.ts and the passport's estimate route
// build the inputs the same way (bodyEstimateService.ts), so both see one estimate.

import type { BodyRange } from "./sizeRegimes";

export type Dim = "chest" | "waist" | "hip" | "height";
export const DIMS: Dim[] = ["chest", "waist", "hip", "height"];

/** What a constraint came from: a closet piece, or a purchase. */
export type EvidenceKind =
  | "piece-fits" | "piece-tight" | "piece-loose"
  | "kept" | "kept-tight" | "kept-loose"
  | "returned-small" | "returned-big" | "exchanged";

// Strongest first. A purchase is evidence the wearer acted on; a stated fit on a
// piece they own is next; a one-sided "tight"/"loose" is the weakest.
const STRENGTH: Record<EvidenceKind, number> = {
  exchanged: 5, kept: 4, "piece-fits": 3,
  "returned-small": 2, "returned-big": 2, "kept-tight": 2, "kept-loose": 2,
  "piece-tight": 1, "piece-loose": 1,
};

export type Constraint = {
  dim: Dim;
  kind: EvidenceKind;
  /** How the reason names it: "Muji XL", "Uniqlo M". */
  label: string;
  lo: number | null;
  hi: number | null;
  range: BodyRange;
};

export type DimEstimate = {
  dim: Dim;
  lo: number;
  hi: number;
  mid: number;
  used: Constraint[];
  /** Evidence that contradicted stronger evidence, set aside and shown. */
  ignored: Constraint[];
};

/** A stated fit: -10 tight .. +10 loose; within ±2 is "fits" (fitDirection.ts). */
const TIGHT = -2, LOOSE = 2;
const mid = (r: BodyRange) => (r.minCm + r.maxCm) / 2;

export type PieceEvidence = {
  label: string;
  fitRating: number;
  fitDirection?: number | null;
  /** The body ranges its label is cut for, per dimension, where a standard says. */
  body: Partial<Record<Dim, BodyRange | null>>;
};

export function pieceConstraints(p: PieceEvidence): Constraint[] {
  const out: Constraint[] = [];
  const d = p.fitDirection;
  const kind: EvidenceKind | null =
    d != null ? (d < TIGHT ? "piece-tight" : d > LOOSE ? "piece-loose" : "piece-fits") : p.fitRating >= 4 ? "piece-fits" : null;
  if (!kind) return out;
  for (const dim of DIMS) {
    const r = p.body[dim];
    if (!r) continue;
    out.push(boundFor(dim, kind, p.label, r));
  }
  return out;
}

export type PurchaseEvidence = {
  label: string;
  decision: "keep" | "return" | "exchange";
  fitDirection?: number | null;
  /** The body ranges of the size bought, per dimension (from the product's chart). */
  bought: Partial<Record<Dim, BodyRange | null>>;
  /** On an exchange: the size swapped to, and its ranges. */
  exchangedLabel?: string | null;
  exchangedTo?: Partial<Record<Dim, BodyRange | null>>;
};

export function purchaseConstraints(o: PurchaseEvidence): Constraint[] {
  const out: Constraint[] = [];
  const d = o.fitDirection;
  for (const dim of DIMS) {
    const bought = o.bought[dim];
    const to = o.exchangedTo?.[dim];
    if (o.decision === "exchange" && to) {
      out.push(boundFor(dim, "exchanged", o.exchangedLabel ?? o.label, to));
      continue;
    }
    if (!bought) continue;
    if (o.decision === "keep") {
      const kind: EvidenceKind = d != null && d < TIGHT ? "kept-tight" : d != null && d > LOOSE ? "kept-loose" : "kept";
      out.push(boundFor(dim, kind, o.label, bought));
    } else if (d != null && d < TIGHT) {
      out.push(boundFor(dim, "returned-small", o.label, bought));
    } else if (d != null && d > LOOSE) {
      out.push(boundFor(dim, "returned-big", o.label, bought));
    }
    // A return with no direction says nothing about the body.
  }
  return out;
}

function boundFor(dim: Dim, kind: EvidenceKind, label: string, r: BodyRange): Constraint {
  switch (kind) {
    case "piece-tight": case "kept-tight": case "returned-small":
      return { dim, kind, label, lo: mid(r), hi: null, range: r };
    case "piece-loose": case "kept-loose": case "returned-big":
      return { dim, kind, label, lo: null, hi: mid(r), range: r };
    default:
      return { dim, kind, label, lo: r.minCm, hi: r.maxCm, range: r };
  }
}

/** Intersect, strongest first, setting aside what would leave no room. */
export function estimate(constraints: Constraint[]): Partial<Record<Dim, DimEstimate>> {
  const out: Partial<Record<Dim, DimEstimate>> = {};
  for (const dim of DIMS) {
    const cs = constraints
      .map((c, i) => ({ c, i }))
      .filter(({ c }) => c.dim === dim)
      .sort((a, b) => STRENGTH[b.c.kind] - STRENGTH[a.c.kind] || a.i - b.i)
      .map(({ c }) => c);
    if (!cs.length) continue;
    let lo = -Infinity, hi = Infinity;
    const used: Constraint[] = [], ignored: Constraint[] = [];
    for (const c of cs) {
      const nlo = Math.max(lo, c.lo ?? -Infinity);
      const nhi = Math.min(hi, c.hi ?? Infinity);
      if (nlo > nhi) { ignored.push(c); continue; }
      lo = nlo; hi = nhi; used.push(c);
    }
    if (!Number.isFinite(lo) || !Number.isFinite(hi)) continue;
    const r1 = (x: number) => Math.round(x * 10) / 10;
    out[dim] = { dim, lo: r1(lo), hi: r1(hi), mid: r1((lo + hi) / 2), used, ignored };
  }
  return out;
}
