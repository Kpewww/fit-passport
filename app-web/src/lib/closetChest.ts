// A chest estimate from the closet's own labels (Session 101).
//
// A wearer with no chest on file used to be scored against a regional average body
// (populationPrior.ts). Pieces they own and say fit say more about them than an
// average does — when their label means a body measurement by a standard: a Chinese
// 号型 by GB/T 1335, a European letter size by EN 13402-3 (sizeRegimes.ts). The
// estimate is the overlap of those pieces' ranges; pieces that do not overlap give
// none, rather than an average of two contradicting bodies.

import { bodyChestFor, bodyWaistFor, regimeForCountry, regimeFromField, type BodyRange, type Regime } from "./sizeRegimes";
import { domainForCategory } from "./sizeSystems";
import { estimate, pieceConstraints } from "./bodyEstimate";

export type ClosetPiece = {
  brand: string;
  category: string;
  size: string;
  fitRating: number;
  fitDirection?: number | null;
  region?: string | null;
  gender?: string | null;
  name?: string | null;
  /** A range already read for this piece (with any brand calibration); undefined = read it here. */
  body?: BodyRange | null;
};

export type ClosetChest = {
  chestCm: number;
  lo: number;
  hi: number;
  used: Array<{ piece: ClosetPiece; regime: Regime | null; range: BodyRange }>;
};

// Since Session 102 both functions are thin views of bodyEstimate.ts, so there is one
// rule for the estimate: tight and loose pieces bound it from one side, and a piece
// that contradicts stronger (or earlier, equally strong) evidence is set aside.

function viaEstimate(
  pieces: ClosetPiece[],
  countryOfBrand: (brand: string) => string | null,
  dim: "chest" | "waist",
): ClosetChest | null {
  const byLabel = new Map<string, { piece: ClosetPiece; regime: Regime | null; range: BodyRange }>();
  const constraints = pieces.flatMap((p, i) => {
    const regime = regimeFromField(p.region) ?? regimeForCountry(countryOfBrand(p.brand));
    const domain = domainForCategory(p.category);
    const range = dim === "chest"
      ? (domain === "top" ? (p.body !== undefined ? p.body : bodyChestFor(p.size, regime, p.gender, "top")) : null)
      : (domain === "bottom" ? bodyWaistFor(p.size, regime, p.gender) : null);
    if (!range) return [];
    const label = `#${i}`;
    byLabel.set(label, { piece: p, regime, range });
    return pieceConstraints({ label, fitRating: p.fitRating, fitDirection: p.fitDirection, body: { [dim]: range } });
  });
  const e = estimate(constraints)[dim];
  if (!e) return null;
  return { chestCm: e.mid, lo: e.lo, hi: e.hi, used: e.used.map((c) => byLabel.get(c.label)!) };
}

export function chestFromCloset(pieces: ClosetPiece[], countryOfBrand: (brand: string) => string | null): ClosetChest | null {
  return viaEstimate(pieces, countryOfBrand, "chest");
}

/** The same for the waist, from bottoms (Session 101h). */
export function waistFromCloset(pieces: ClosetPiece[], countryOfBrand: (brand: string) => string | null): ClosetChest | null {
  return viaEstimate(pieces, countryOfBrand, "waist");
}
