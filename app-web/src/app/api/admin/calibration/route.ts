// GET /api/admin/calibration: brands' own size charts against their country's
// standard (brandCalibration.ts, Session 101e). Admin only. Reads charts already
// captured by ordinary checks; fetches nothing. Product pages are public; no user is
// named in the report.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { currentAdmin, notAdmin } from "@/lib/admin";
import { calibrate, usLetterConsensus, type Observation } from "@/lib/brandCalibration";
import { lookupBrand } from "@/lib/brandRegistry";
import { BRAND_CHARTS, chartToSizes } from "@/lib/brandCharts";

const lineOf = (raw: string | null) => {
  try { const g = raw ? JSON.parse(raw)?.gender : null; return g === "womens" ? "womens" : g === "mens" ? "mens" : null; } catch { return null; }
};

export async function GET() {
  if (!(await currentAdmin())) return notAdmin();
  const rows = await prisma.sizeOption.findMany({
    where: { bodyChestMinCm: { not: null }, bodyChestMaxCm: { not: null }, product: { brand: { not: null } } },
    select: { label: true, bodyChestMinCm: true, bodyChestMaxCm: true, product: { select: { brand: true, url: true, rawJson: true } } },
    take: 20000,
  });
  const obs: Observation[] = rows
    // An uploaded picture has no page to check it against: not evidence for a brand.
    .filter((r) => r.product.brand && /^https?:/.test(r.product.url))
    .map((r) => ({
      brand: r.product.brand!, url: r.product.url.split("?")[0], line: lineOf(r.product.rawJson),
      label: r.label, bodyChestMinCm: r.bodyChestMinCm!, bodyChestMaxCm: r.bodyChestMaxCm!,
    }));
  // The curated charts count as one page each.
  for (const c of BRAND_CHARTS.filter((c) => c.kind === "body")) {
    for (const s of chartToSizes(c)) {
      if (s.bodyChestMinCm == null || s.bodyChestMaxCm == null) continue;
      obs.push({ brand: c.brand, url: c.sourceUrl, line: c.gender === "womens" ? "womens" : "mens", label: s.label, bodyChestMinCm: s.bodyChestMinCm, bodyChestMaxCm: s.bodyChestMaxCm });
    }
  }
  const reports = calibrate(obs, (b) => lookupBrand(b)?.country ?? null);
  return NextResponse.json({
    observations: obs.length,
    brands: reports,
    usLetters: { mens: usLetterConsensus(reports, "mens"), womens: usLetterConsensus(reports, "womens") },
  });
}
