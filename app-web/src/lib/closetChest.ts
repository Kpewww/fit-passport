// A chest estimate from the closet's own labels (Session 101).
//
// A wearer with no chest on file used to be scored against a regional average body
// (populationPrior.ts). Pieces they own and say fit say more about them than an
// average does — when their label means a body measurement by a standard: a Chinese
// 号型 by GB/T 1335, a European letter size by EN 13402-3 (sizeRegimes.ts). The
// estimate is the overlap of those pieces' ranges; pieces that do not overlap give
// none, rather than an average of two contradicting bodies.

import { bodyChestFor, regimeForCountry, regimeFromField, type BodyRange, type Regime } from "./sizeRegimes";
import { domainForCategory } from "./sizeSystems";

export type ClosetPiece = {
  brand: string;
  category: string;
  size: string;
  fitRating: number;
  fitDirection?: number | null;
  region?: string | null;
  gender?: string | null;
  name?: string | null;
};

export type ClosetChest = {
  chestCm: number;
  lo: number;
  hi: number;
  used: Array<{ piece: ClosetPiece; regime: Regime | null; range: BodyRange }>;
};

/** A piece that fits: rated well, or reported as neither tight nor loose. */
const fits = (p: ClosetPiece) =>
  p.fitDirection != null ? Math.abs(p.fitDirection) <= 2 : p.fitRating >= 4;

export function chestFromCloset(
  pieces: ClosetPiece[],
  countryOfBrand: (brand: string) => string | null,
): ClosetChest | null {
  const used: ClosetChest["used"] = [];
  for (const p of pieces) {
    if (domainForCategory(p.category) !== "top" || !fits(p)) continue;
    const regime = regimeFromField(p.region) ?? regimeForCountry(countryOfBrand(p.brand));
    const range = bodyChestFor(p.size, regime, p.gender, "top");
    if (range) used.push({ piece: p, regime, range });
  }
  if (!used.length) return null;
  const lo = Math.max(...used.map((u) => u.range.minCm));
  const hi = Math.min(...used.map((u) => u.range.maxCm));
  if (lo > hi) return null;
  return { chestCm: Math.round(((lo + hi) / 2) * 10) / 10, lo, hi, used };
}
