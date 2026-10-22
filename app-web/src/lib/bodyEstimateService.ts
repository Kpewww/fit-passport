// Builds the body estimate's evidence from what is stored (Session 102). Server only.
//
// One function for both readers, so the passport's "estimated from your closet" and
// the check's chest/waist are the same numbers:
//   - closet pieces: each label read by its market's standard (sizeRegimes.ts), the
//     chest shifted by its brand's own charts in that market (brandOffsets.ts);
//   - purchases: the size bought, read from that product's own chart (body ranges as
//     printed; a garment chest less a regular ease), with what happened after.
// Then bodyEstimate.ts intersects them, strongest first.

import { prisma } from "./db";
import { estimate, pieceConstraints, purchaseConstraints, type Constraint, type Dim, type DimEstimate } from "./bodyEstimate";
import { bodyChestFor, bodyHeightFor, bodyHipFor, bodyWaistFor, regimeForCountry, regimeFromField, type BodyRange } from "./sizeRegimes";
import { domainForCategory } from "./sizeSystems";
import { easeAdjustForCategory, easeChestCm, normalizeToAlpha } from "./sizing";
import { lookupBrand } from "./brandRegistry";
import { brandReports, offsetFor } from "./brandOffsets";
import { soleDepartment } from "./womensSizes";
import { usLetterChest, type BrandReport } from "./brandCalibration";
import type { EngineText } from "./engineText";
import type { Locale } from "@/i18n/config";
import { PERSONAL_EASE } from "./scoringConstants";

type Piece = {
  id: string; brand: string; category: string; size: string; fitRating: number;
  fitDirection: number | null; region: string | null; gender: string | null; displayName: string | null;
};
type SizeRow = {
  label: string; chestCm: number | null;
  bodyChestMinCm: number | null; bodyChestMaxCm: number | null;
  bodyWaistMinCm: number | null; bodyWaistMaxCm: number | null;
  bodyHipMinCm: number | null; bodyHipMaxCm: number | null;
};
type Purchase = {
  purchasedSize: string; decision: string; exchangedForSize: string | null; fitDirection: number | null;
  product: { brand: string | null; category: string | null; rawJson: string | null; sizeOptions?: SizeRow[] };
};

const PAGE: Pick<BodyRange, "evidence"> = {
  evidence: { grade: "B", source: "the product page's own size chart", sourceZh: "商品页自己的尺码表" },
};

/** A purchased size's body ranges, from the product's own chart. */
function sizeBody(sizes: SizeRow[] | undefined, label: string | null, category: string | null): Partial<Record<Dim, BodyRange>> {
  if (!sizes?.length || !label) return {};
  const want = label.trim().toUpperCase();
  const alpha = normalizeToAlpha(label);
  const s = sizes.find((x) => x.label.trim().toUpperCase() === want) ?? (alpha ? sizes.find((x) => normalizeToAlpha(x.label) === alpha) : undefined);
  if (!s) return {};
  const out: Partial<Record<Dim, BodyRange>> = {};
  const domain = category ? domainForCategory(category) : "top";
  if (domain === "top" || domain === "onepiece") {
    if (s.bodyChestMinCm != null && s.bodyChestMaxCm != null) out.chest = { minCm: s.bodyChestMinCm, maxCm: s.bodyChestMaxCm, ...PAGE };
    else if (s.chestCm != null) {
      // A garment chest: the body it suits is the chest less a regular ease, give or
      // take half a size step (the measured step, scoringConstants).
      const body = s.chestCm - easeChestCm("regular") - easeAdjustForCategory(category);
      const half = PERSONAL_EASE.ladderStepChestCm / 2;
      out.chest = { minCm: body - half, maxCm: body + half, ...PAGE };
    }
  }
  if ((domain === "bottom" || domain === "onepiece") && s.bodyWaistMinCm != null && s.bodyWaistMaxCm != null) out.waist = { minCm: s.bodyWaistMinCm, maxCm: s.bodyWaistMaxCm, ...PAGE };
  if ((domain === "bottom" || domain === "onepiece") && s.bodyHipMinCm != null && s.bodyHipMaxCm != null) out.hip = { minCm: s.bodyHipMinCm, maxCm: s.bodyHipMaxCm, ...PAGE };
  return out;
}

export type BodyEvidence = {
  /** Each piece's (calibrated) chest range: the engine places the piece by it. */
  pieceChest: Map<string, BodyRange | null>;
  estimates: Partial<Record<Dim, DimEstimate>>;
};

export function buildBodyEvidence(
  pieces: Piece[],
  purchases: Purchase[],
  shopsFor: string | null | undefined,
  reports: BrandReport[],
): BodyEvidence {
  const pieceChest = new Map<string, BodyRange | null>();
  const constraints: Constraint[] = [];
  for (const k of pieces) {
    const line = k.gender ?? soleDepartment(shopsFor);
    const regime = regimeFromField(k.region) ?? regimeForCountry(lookupBrand(k.brand)?.country ?? null);
    const domain = domainForCategory(k.category);
    let chest = domain === "top" ? bodyChestFor(k.size, regime, line, "top") : null;
    // A US letter has no standard: the brand's own charts, else the US consensus.
    const usLetter = !chest && domain === "top" && regime === "US" ? usLetterChest(reports, k.brand, k.size, line) : null;
    if (usLetter) chest = usLetter;
    else if (chest) {
      const off = offsetFor(reports, k.brand, line, k.size, regime);
      if (off) chest = {
        minCm: chest.minCm + off.offsetCm, maxCm: chest.maxCm + off.offsetCm,
        evidence: {
          grade: "B",
          source: `${chest.evidence.source}, adjusted ${off.offsetCm > 0 ? "+" : ""}${off.offsetCm} cm by ${k.brand}'s own charts (${off.pages} pages)`,
          sourceZh: `${chest.evidence.sourceZh}，并按 ${k.brand} 自己的 ${off.pages} 个商品页尺码表修正 ${off.offsetCm > 0 ? "+" : ""}${off.offsetCm} cm`,
        },
      };
    }
    pieceChest.set(k.id, chest);
    const label = [k.brand, k.size].join(" ");
    constraints.push(...pieceConstraints({
      label, fitRating: k.fitRating, fitDirection: k.fitDirection,
      body: {
        chest,
        waist: domain === "bottom" ? bodyWaistFor(k.size, regime, line) : null,
        hip: domain === "bottom" || domain === "onepiece" ? bodyHipFor(k.size, regime, line) : null,
        height: bodyHeightFor(k.size, regime, line),
      },
    }));
  }
  for (const o of purchases) {
    const decision = o.decision === "keep" || o.decision === "return" || o.decision === "exchange" ? o.decision : null;
    if (!decision) continue;
    const brand = o.product.brand ?? "";
    constraints.push(...purchaseConstraints({
      label: [brand, o.purchasedSize].filter(Boolean).join(" "),
      decision,
      fitDirection: o.fitDirection,
      bought: sizeBody(o.product.sizeOptions, o.purchasedSize, o.product.category),
      exchangedLabel: o.exchangedForSize ? [brand, o.exchangedForSize].filter(Boolean).join(" ") : null,
      exchangedTo: sizeBody(o.product.sizeOptions, o.exchangedForSize, o.product.category),
    }));
  }
  return { pieceChest, estimates: estimate(constraints) };
}

/** The reason's sentence for one dimension's estimate, in the reader's language. */
export function estimateNote(e: DimEstimate, M: EngineText, locale: Locale | undefined): string {
  const sources = [...new Set(e.used.map((c) => (locale === "zh" ? c.range.evidence.sourceZh : c.range.evidence.source)))];
  return M.bodyEstimate({
    dim: e.dim, lo: e.lo, hi: e.hi,
    evidence: e.used.map((c) => M.evidenceItem(c.kind, c.label)),
    sources,
    ignored: e.ignored.map((c) => M.evidenceItem(c.kind, c.label)),
  });
}

/** For the passport: the estimate from what is stored, without a product. */
export async function loadBodyEstimate(userId: string) {
  const [profile, pieces, purchases, { reports }] = await Promise.all([
    prisma.fitProfile.findUnique({ where: { userId }, select: { shopsFor: true } }),
    prisma.knownGoodItem.findMany({ where: { userId } }),
    prisma.fitOutcome.findMany({ where: { userId }, include: { product: { include: { sizeOptions: true } } } }),
    brandReports(),
  ]);
  return buildBodyEvidence(pieces, purchases, profile?.shopsFor, reports).estimates;
}
