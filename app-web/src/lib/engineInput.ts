// How stored size rows become the engine's size input — one place, so
// /api/check, /api/recommend, the evaluation harness and the tests all feed the
// engine the same way. No database import, so tests can use it directly.
//
// ⚠ `waistCm` is NOT passed, and that is currently correct, though it looks
// like a bug (it was recorded as one in Session 75's audit: `scoreMeasurementFit`
// reads `size.waistCm`, and nothing ever supplies it). The page parser moves a
// body chart's CHEST into `bodyChestMinCm/MaxCm`, but leaves its WAIST in
// `waistCm` — the garment field. Uniqlo's, Nike's and Patagonia's charts all
// carry a body waist column. Passing `waistCm` today would feed those body
// waists to the engine as garment waists, which then adds the wearer's ease on
// top: invariant ㊿ again, one column over. Wire waist through only together
// with a body-waist field on the parser side (the schema already has
// `bodyWaistMinCm/MaxCm`, unused).

import type { SizeOptionInput } from "./fitEngine";

export type SizeRow = {
  label: string;
  region?: string | null;
  chestCm?: number | null;
  shoulderCm?: number | null;
  sleeveCm?: number | null;
  bodyChestMinCm?: number | null;
  bodyChestMaxCm?: number | null;
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
  }));
}
