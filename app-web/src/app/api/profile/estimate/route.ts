// GET /api/profile/estimate: the body the closet and purchases point to, per dimension
// (bodyEstimateService.ts, Session 102), for the passport's "estimated from your
// closet" line. The wearer's OWN data, for their own session only; nothing is stored.
// No session, no estimate: reading this never creates an account.

import { NextResponse } from "next/server";
import { readSession } from "@/lib/session";
import { loadBodyEstimate } from "@/lib/bodyEstimateService";
import { engineText } from "@/lib/engineText";
import { getLocale } from "@/i18n/server";
import { DIMS } from "@/lib/bodyEstimate";

export async function GET() {
  const session = (await readSession());
  if (!session) return NextResponse.json({ estimates: {} });
  const locale = (await getLocale());
  const M = engineText(locale);
  const est = await loadBodyEstimate(session.userId);
  const estimates: Record<string, unknown> = {};
  for (const d of DIMS) {
    const e = est[d];
    if (!e) continue;
    estimates[d] = {
      lo: e.lo, hi: e.hi, mid: e.mid,
      evidence: e.used.map((c) => M.evidenceItem(c.kind, c.label)),
      ignored: e.ignored.map((c) => M.evidenceItem(c.kind, c.label)),
      sources: [...new Set(e.used.map((c) => (locale === "zh" ? c.range.evidence.sourceZh : c.range.evidence.source)))],
    };
  }
  return NextResponse.json({ estimates }, { headers: { "cache-control": "no-store" } });
}
