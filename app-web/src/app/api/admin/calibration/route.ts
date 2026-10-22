// GET /api/admin/calibration: brands' own size charts against their country's
// standard (brandCalibration.ts, Session 101e). Admin only. Reads charts already
// captured by ordinary checks; fetches nothing. Product pages are public; no user is
// named in the report.

import { NextResponse } from "next/server";
import { currentAdmin, notAdmin } from "@/lib/admin";
import { usLetterConsensus } from "@/lib/brandCalibration";
import { brandReports } from "@/lib/brandOffsets";

export async function GET() {
  if (!(await currentAdmin())) return notAdmin();
  const { reports, observations } = await brandReports();
  return NextResponse.json({
    observations,
    brands: reports,
    usLetters: { mens: usLetterConsensus(reports, "mens"), womens: usLetterConsensus(reports, "womens") },
  });
}
