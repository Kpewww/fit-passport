"use client";

import { useState } from "react";
import { Check } from "@/components/Icon";
import { Button, Card, LinkButton } from "@/components/ui";
import { useT } from "@/i18n/client";
import type { CheckResponse } from "./types";
import { SourceRow } from "./SourceRow";
import { SellerMeasureForm, type SellerInput } from "./ListingForms";

/**
 * The seller's measurements, typed from the listing (Session 80). A second-hand
 * listing rarely has a size chart, and eBay refuses our server outright, so this
 * is how the website judges one: the shopper copies the pit to pit (and, if given,
 * the waist and length) and the same judgement runs as for the extension.
 */
/**
 * A one-off listing's answer (Session 80): a judgement, not a ranking — the server
 * decides it (listingJudgement.ts) with the engine's own target and verdict scale.
 */
export function JudgementCard({ data, onMeasure }: { data: CheckResponse; onMeasure: (s: SellerInput) => void }) {
  const t = useT("check");
  const j = data.result.judgement!;
  const known = j.outcome !== "unknown";
  const [showForm, setShowForm] = useState(false);
  const tone =
    j.outcome === "likely-fits" ? "text-ok" : j.outcome === "may-be-tight" || j.outcome === "may-be-loose" ? "text-warn" : j.outcome === "unknown" ? "text-ink" : "text-bad";
  const wantsForm = j.next.some((n) => n !== "add-body");
  return (
    <div className="mt-8 space-y-4">
      <Card>
        <p className="eyebrow text-ink-faint">{t("judge.eyebrow")}</p>
        <p className="mt-2 break-words text-sm text-ink-soft">{[data.product.brand, data.product.productName].filter(Boolean).join(" · ")}</p>
        <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-2">
          <h2 className={`font-serif text-h1 ${tone}`}>{t(`judge.outcome.${j.outcome}`)}</h2>
          {known && <span className="rounded-full border border-line px-2.5 py-0.5 text-xs text-ink-soft">{t(`judge.strength.${j.strength}`)}</span>}
        </div>
        {known && (
          <p className="mt-1 text-xs text-ink-faint">
            {t(`judge.basis.${j.basis}`)}{j.sizeLabel ? ` · ${t("judge.labelled", { size: j.sizeLabel })}` : ""}
          </p>
        )}
        {j.reasons.length > 0 && (
          <ul className="mt-4 space-y-1.5 text-sm text-ink">
            {j.reasons.map((r) => <li key={r} className="flex gap-2"><Check size={16} className="mt-0.5 flex-shrink-0 text-ink-faint" /><span>{r}</span></li>)}
          </ul>
        )}
        {j.notes.length > 0 && <p className="mt-3 rounded-xl bg-warn-tint px-3.5 py-2.5 text-sm text-warn">{j.notes.join(" ")}</p>}
        {j.ambiguous.length > 0 && (
          <p className="mt-3 text-xs text-ink-soft">{t("judge.ambiguous", { raw: j.ambiguous.map((a) => a.raw).join("；") })}</p>
        )}
        {j.next.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {j.next.map((n) =>
              n === "add-body" ? (
                <LinkButton key={n} href="/passport" size="sm" variant="secondary">{t(`judge.next.${n}`)}</LinkButton>
              ) : (
                <Button key={n} size="sm" variant="secondary" onClick={() => setShowForm(true)}>{t(`judge.next.${n}`)}</Button>
              ),
            )}
          </div>
        )}
        <div className="mt-5 border-t border-line pt-4">
          <SourceRow product={data.product} source={data.source} />
        </div>
      </Card>
      {(showForm || (!known && wantsForm)) && (
        <SellerMeasureForm onSubmit={onMeasure} askCategory={j.next.includes("choose-category")} />
      )}
    </div>
  );
}

