// A judgement for a one-off listing — Session 80.
//
// A second-hand listing is one garment in one size. There is nothing to rank it
// against, so the engine's ranking has nothing to say ("the largest size offered",
// a tie that can never happen, stability over one label). What the shopper needs
// is a yes-or-no with a reason: likely fits / may be tight / may be loose, and how
// sure that is.
//
// The judgement uses the engine's own rules, so a product judged here and the same
// numbers ranked by the engine cannot disagree:
//   - the target is the engine's (body + resolved ease + the category's ease;
//     waist × the engine's waist ease factor), or a garment the wearer owns moved
//     by its fit report the way the engine moves an anchor (directionToLadderShift
//     × one measured size step);
//   - the verdict is the engine's `verdictFromDelta`, on the same scale.
//
// What it rests on, strongest first: a garment of the same kind the wearer owns
// and has measured (garment against garment — no ease assumption at all), the
// wearer's own measurement, a printed size against a size in the closet (weak:
// labels differ by brand). With none of these it says what would settle it.

import type { FitPreference } from "./sizing";
import { alphaIndex, easeAdjustForCategory, normalizeToAlpha } from "./sizing";
import { domainForCategory } from "./sizeSystems";
import { directionToLadderShift, isDirectional, nearestOption } from "./fitDirection";
import { verdictFromDelta, type FitVerdict } from "./fitEngine";
import type { DirectionKey, EngineText } from "./engineText";
import { DIMENSIONS, LISTING, PERSONAL_EASE, STABILITY } from "./scoringConstants";
import type { AmbiguousMeasurement, SellerMeasurement, SellerReading } from "./sellerMeasurements";

export type JudgementOutcome = "likely-fits" | "may-be-tight" | "may-be-loose" | "too-small" | "too-big" | "unknown";
export type JudgementStrength = "strong" | "moderate" | "weak";
export type NextStep = "enter-chest" | "enter-waist" | "add-body" | "confirm-measure" | "choose-category";

export type Judgement = {
  outcome: JudgementOutcome;
  strength: JudgementStrength;
  basis: "closet-garment" | "body" | "label" | "none";
  verdict: FitVerdict | null;
  /** The garment measurement judged (chest for tops, waist for bottoms), in cm. */
  listingCm: number | null;
  targetCm: number | null;
  deltaCm: number | null;
  reasons: string[];
  notes: string[];
  next: NextStep[];
  /** What the seller (or the user) stated, as read — for the reader to check. */
  measurements: SellerMeasurement[];
  ambiguous: AmbiguousMeasurement[];
  sizeLabel: string | null;
  confidence: number;
};

export type ListingInput = {
  option: { label: string; chestCm?: number | null; waistCm?: number | null };
  category: string | null;
  categoryGuessed: boolean;
  profile: { chestCm: number | null; waistCm: number | null; preferredFit: FitPreference; chestIsEstimated?: boolean };
  /** The ease the engine resolved for this wearer (stated, or learned from the closet). */
  easeCm: number;
  knownGood: Array<{
    brand: string;
    category: string;
    size: string;
    fitDirection?: number | null;
    garmentChestCm?: number | null;
    garmentMeasuredFrom?: string | null;
  }>;
  seller?: SellerReading;
};

const OUTCOME: Record<FitVerdict, JudgementOutcome> = {
  "too small": "too-small",
  snug: "may-be-tight",
  "true to size": "likely-fits",
  relaxed: "may-be-loose",
  "too big": "too-big",
};

/** Garment measurements whose source is a real chart or a tape measure. */
const MEASURED = new Set(["page", "fixture", "brand-chart", "seller"]);
const DOWNGRADE: Record<JudgementStrength, JudgementStrength> = { strong: "moderate", moderate: "weak", weak: "weak" };
const r1 = (n: number) => Math.round(n * 10) / 10;

export function judgeListing(input: ListingInput, M: EngineText): Judgement {
  const domain = domainForCategory(input.category ?? "tshirt");
  const dim: "chest" | "waist" = domain === "bottom" ? "waist" : "chest";
  const listingCm = (dim === "chest" ? input.option.chestCm : input.option.waistCm) ?? null;
  const measurements = input.seller?.measurements ?? [];
  const ambiguous = input.seller?.ambiguous ?? [];
  const sizeLabel = input.seller?.sizeLabel ?? (input.option.label && input.option.label !== "—" ? input.option.label : null);

  const base = { listingCm, measurements, ambiguous, sizeLabel };
  const unknown = (next: NextStep[], notes: string[] = []): Judgement => ({
    ...base, outcome: "unknown", strength: "weak", basis: "none", verdict: null, targetCm: null, deltaCm: null,
    reasons: [], notes, next, confidence: 0,
  });

  // The page never said what kind of garment this is — tops are judged on the
  // chest, bottoms on the waist, and guessing picks the wrong measurement.
  if (input.categoryGuessed) return unknown(["choose-category"]);

  // How the listed number was arrived at, for the reader to check.
  const used = measurements.find((m) => m.field === dim);
  const conversion = used && used.flat
    ? M.listingFlat({ field: dim, value: used.value, unit: used.unit, cm: r1(used.cm), typed: used.source === "you", unitInferred: used.unitInferred })
    : null;
  const confirm = ambiguous.some((a) => a.field === dim) ? (["confirm-measure"] as NextStep[]) : [];

  const verdictSet = (target: number, bodySpread: number) => {
    const noise = used?.flat ? 2 * LISTING.flatNoiseCm : LISTING.flatNoiseCm;
    const set = new Set<FitVerdict>();
    for (const dl of [-noise, 0, noise]) for (const db of [-bodySpread, 0, bodySpread]) set.add(verdictFromDelta(listingCm! + dl - (target + db)));
    return { set, noise: r1(noise) };
  };

  const finish = (basis: Judgement["basis"], target: number, strength: JudgementStrength, reason: string, notes: string[], bodySpread: number): Judgement => {
    const delta = listingCm! - target;
    const verdict = verdictFromDelta(delta);
    const { set, noise } = verdictSet(target, bodySpread);
    let s = strength;
    const allNotes = [...notes];
    if (set.size > 1) {
      s = DOWNGRADE[s];
      allNotes.push(M.listingFragile(noise));
    }
    return {
      ...base, outcome: OUTCOME[verdict], strength: s, basis, verdict, targetCm: r1(target), deltaCm: r1(delta),
      reasons: [conversion, reason].filter((x): x is string => !!x), notes: allNotes, next: confirm,
      confidence: LISTING.confidence[s],
    };
  };

  if (listingCm != null) {
    // 1. A garment the wearer owns, of the same kind, whose chest was measured.
    //    Garment against garment: no ease assumption at all.
    if (dim === "chest") {
      const refs = input.knownGood
        .filter((k) => k.garmentChestCm != null && MEASURED.has(k.garmentMeasuredFrom ?? "") && domainForCategory(k.category) === "top")
        .sort((a, b) =>
          Number(b.category === input.category) - Number(a.category === input.category) ||
          Number(b.fitDirection != null) - Number(a.fitDirection != null) ||
          Math.abs(a.fitDirection ?? 0) - Math.abs(b.fitDirection ?? 0));
      const ref = refs[0];
      if (ref) {
        const target = ref.garmentChestCm! + directionToLadderShift(ref.fitDirection) * PERSONAL_EASE.ladderStepChestCm;
        const dir: DirectionKey | null = isDirectional(ref.fitDirection) ? (nearestOption(ref.fitDirection!).key as DirectionKey) : null;
        const reason = M.listingVsGarment({ refLabel: `${ref.brand} ${ref.size}`, refCm: r1(ref.garmentChestCm!), dir, deltaCm: r1(listingCm - ref.garmentChestCm!) });
        return finish("closet-garment", target, ref.fitDirection != null ? "strong" : "moderate", reason, [], 0);
      }
    }
    // 2. The wearer's own measurement and preferred fit — the engine's target.
    const body = dim === "chest" ? input.profile.chestCm : input.profile.waistCm;
    if (body != null) {
      const ease = dim === "chest"
        ? input.easeCm + easeAdjustForCategory(input.category)
        : input.easeCm * DIMENSIONS.waist.easeFactor;
      const target = body + ease;
      const estimated = dim === "chest" && !!input.profile.chestIsEstimated;
      const reason = M.listingVsBody({ dim, targetCm: Math.round(target), bodyCm: r1(body), pref: input.profile.preferredFit });
      return finish("body", target, estimated ? "weak" : "strong", reason, estimated ? [M.listingEstimatedBody] : [], STABILITY.bodyNoiseCm / 2);
    }
    // A measurement, and nothing of the wearer's to compare it with.
    return unknown(["add-body", ...confirm], [conversion, M.listingNothingToCompare].filter((x): x is string => !!x));
  }

  // 3. Only a printed size: against a size of the same kind in the closet. Weak —
  //    the same letter runs differently from one brand to the next.
  const listingIdx = alphaIndex(normalizeToAlpha(sizeLabel));
  if (listingIdx != null) {
    const refs = input.knownGood
      .map((k) => ({ k, idx: alphaIndex(normalizeToAlpha(k.size)) }))
      .filter((x) => x.idx != null && domainForCategory(x.k.category) === domain)
      .sort((a, b) =>
        Number(b.k.category === input.category) - Number(a.k.category === input.category) ||
        Math.abs(a.k.fitDirection ?? 0) - Math.abs(b.k.fitDirection ?? 0));
    const ref = refs[0];
    if (ref) {
      const steps = listingIdx - (ref.idx! + directionToLadderShift(ref.k.fitDirection));
      const outcome: JudgementOutcome =
        steps <= -1.5 ? "too-small" : steps <= -0.5 ? "may-be-tight" : steps < 0.5 ? "likely-fits" : steps < 1.5 ? "may-be-loose" : "too-big";
      const dir: DirectionKey | null = isDirectional(ref.k.fitDirection) ? (nearestOption(ref.k.fitDirection!).key as DirectionKey) : null;
      return {
        ...base, outcome, strength: "weak", basis: "label", verdict: null, targetCm: null, deltaCm: null,
        reasons: [M.listingVsLabel({ label: sizeLabel!, refLabel: `${ref.k.brand} ${ref.k.size}`, dir })],
        notes: [], next: [dim === "chest" ? "enter-chest" : "enter-waist", ...confirm], confidence: LISTING.confidence.weak,
      };
    }
  }
  return unknown([dim === "chest" ? "enter-chest" : "enter-waist", ...confirm]);
}
