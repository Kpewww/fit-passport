// A rough guess from a small closet — Session 92c.
//
// The founder, testing with one or two pieces in the closet and no measurements:
// "give a rough guess, with low confidence — don't make it unusable." Until now the
// engine said "can't tell these sizes apart" whenever no signal applied, and two
// ordinary closets hit that: a piece of another garment type (closet evidence across
// types is dropped on purpose — fitEngine.ts, "Three pairs of jeans tell us almost
// nothing about a shirt"), and a piece whose size is not on the S–XL ladder (a
// brand's own "2").
//
// This runs only when the ranking is otherwise a dead heat, so it can never move a
// size any real signal chose. In order:
//   1. a piece of the same brand whose size label the page offers ("2" and "2");
//   2. a piece whose size sits on the S–XL ladder, placed on the page's ladder —
//      across garment types and brands, so only roughly;
//   3. nothing: the reason then says which piece could not be placed, rather than a
//      bare "can't tell".
// Either guess carries a low confidence ceiling (CONFIDENCE_CAPS) and says how to
// make it a real answer. Shoes, hats and the like are never used: no clothing size
// follows from them.

import { normalizeToAlpha, alphaIndex } from "./sizing";
import { SCOREABLE_DOMAINS, domainForCategory } from "./sizeSystems";
import { directionToLadderShift } from "./fitDirection";
import type { KnownGoodInput } from "./fitEngine";

export type RoughGuess =
  | { kind: "same-label"; label: string; piece: KnownGoodInput }
  | { kind: "ladder"; label: string; piece: KnownGoodInput }
  | { kind: "unreadable"; piece: KnownGoodInput };

/** A size label compared as printed: "Size 2", "T2", "FR 2" and "2" are one label. */
export function labelKey(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/^SIZE\s*/, "")
    .replace(/^(?:FR|IT|EU|UK|US|DE|T)\s*(?=\d)/, "")
    .replace(/\s+/g, "");
}

export function roughGuess(
  product: { brand?: string | null; gender?: string | null },
  sizes: ReadonlyArray<{ label: string }>,
  closet: ReadonlyArray<KnownGoodInput>,
): RoughGuess | null {
  const pieces = closet.filter((k) => SCOREABLE_DOMAINS.includes(domainForCategory(k.category)));
  if (pieces.length === 0 || sizes.length < 2) return null;

  const brand = product.brand?.trim().toLowerCase();
  for (const piece of pieces) {
    if (!brand || piece.brand.trim().toLowerCase() !== brand) continue;
    const hit = sizes.find((s) => labelKey(s.label) === labelKey(piece.size));
    if (hit) return { kind: "same-label", label: hit.label, piece };
  }

  const ladder = sizes
    .map((s) => ({ label: s.label, idx: alphaIndex(normalizeToAlpha(s.label, product.gender)) }))
    .filter((s): s is { label: string; idx: number } => s.idx != null);
  const placed = pieces
    .map((piece) => ({ piece, idx: alphaIndex(normalizeToAlpha(piece.size, piece.gender)) }))
    .filter((p): p is { piece: KnownGoodInput; idx: number } => p.idx != null);
  if (ladder.length >= 2 && placed.length > 0) {
    // The middle piece when there are several: one odd size does not pull the guess.
    const mid = placed.slice().sort((a, b) => a.idx - b.idx)[Math.floor((placed.length - 1) / 2)];
    const target = mid.idx + directionToLadderShift(mid.piece.fitDirection);
    const nearest = ladder.reduce((a, b) => (Math.abs(b.idx - target) < Math.abs(a.idx - target) ? b : a));
    return { kind: "ladder", label: nearest.label, piece: mid.piece };
  }

  return { kind: "unreadable", piece: pieces[0] };
}
