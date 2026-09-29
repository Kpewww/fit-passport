// How stored size rows become the engine's size input — one place, so
// /api/check, /api/recommend, the evaluation harness and the tests all feed the
// engine the same way. No database import, so tests can use it directly.
//
// Waist travels now, both ways a chart can state it: a GARMENT waist in `waistCm`
// and a BODY waist range in `bodyWaistMinCm/MaxCm`. Until Session 78 it could not
// travel at all — the parser left a body chart's waist in the garment field, so
// passing `waistCm` would have added the wearer's ease on top of their own waist
// (invariant ㊿, one column over). `foldByLabel` and `chartToSizes` now route a body
// waist to the body fields, which is what made this safe.

import type { SizeOptionInput } from "./fitEngine";

export type SizeRow = {
  label: string;
  region?: string | null;
  chestCm?: number | null;
  shoulderCm?: number | null;
  sleeveCm?: number | null;
  bodyChestMinCm?: number | null;
  bodyChestMaxCm?: number | null;
  waistCm?: number | null;
  bodyWaistMinCm?: number | null;
  bodyWaistMaxCm?: number | null;
};

export function engineSizes(rows: SizeRow[]): SizeOptionInput[] {
  return rows.map((s) => ({
    label: s.label,
    region: s.region ?? null,
    chestCm: s.chestCm ?? null,
    shoulderCm: s.shoulderCm ?? null,
    sleeveCm: s.sleeveCm ?? null,
    bodyChestMinCm: s.bodyChestMinCm ?? null,
    bodyChestMaxCm: s.bodyChestMaxCm ?? null,
    waistCm: s.waistCm ?? null,
    bodyWaistMinCm: s.bodyWaistMinCm ?? null,
    bodyWaistMaxCm: s.bodyWaistMaxCm ?? null,
  }));
}
