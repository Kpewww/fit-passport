"use client";

import { Suspense, lazy, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "@/components/Icon";
import { Card } from "@/components/ui";
import { SafeBoundary } from "@/components/SafeBoundary";
import { VERDICT_COLOUR, FORM_COLOUR, type Zone } from "@/lib/fitMapColours";
import { fitLink, readBodyLook, saveBodyKind, toneHex, type BodyLook } from "@/lib/bodyView";
import { useRealisticBody } from "@/components/useRealisticBody";
import { useT } from "@/i18n/client";
import type { Body, Product, SizeScore } from "./types";

// three.js only loads when the fit map scrolls into view. Boundaried because a
// failed chunk silently blanks its subtree rather than throwing.
const FitMap3D = lazy(() =>
  import("@/components/FitMap3D").then((m) => ({ default: m.FitMap3D })),
);

/**
 * The same ease FitFigure draws, in three dimensions.
 *
 * WHY BOTH. The flat figure shows one cross-section; ease is not the same all
 * the way round, and the number beside it is still the truth either way. This is
 * offered, never substituted — it is opt-in, it costs three.js to open, and the
 * 2D diagram stays the thing that loads by default.
 *
 * WHAT IT IS NOT. Still not a try-on: no collar, no hem, no sleeves, no fabric.
 * A shell at the garment's measurements around a form at yours, which is the
 * arithmetic and nothing more (invariant ⑲).
 */
export function FitMapCard({
  body,
  product,
  ranked,
  bestLabel,
}: {
  body: Body;
  product: Product;
  ranked: SizeScore[];
  bestLabel: string;
}) {
  const t = useT("check");
  const tf = useT("fit");
  // In the chart's own order (XS before S), not the ranking's: a switcher reads as a ladder.
  const sizes = product.sizeOptions
    .map((o) => ranked.find((r) => r.label === o.label))
    .filter((r): r is SizeScore => !!r?.zones?.length);
  const [label, setLabel] = useState(sizes.some((s) => s.label === bestLabel) ? bestLabel : sizes[0]?.label);
  // Dress form or the realistic body (Session 100), the same choice /body remembers.
  // Read after mount: the server cannot see this browser's storage.
  const [look, setLook] = useState<BodyLook | null>(null);
  useEffect(() => setLook(readBodyLook("form")), []);
  const kind = look?.kind ?? "form";
  const chooseKind = (k: "form" | "real") => { saveBodyKind(k); setLook((l) => (l ? { ...l, kind: k } : l)); };
  // three.js loads only once the card is on screen.
  const hostRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = hostRef.current;
    if (!el || visible) return;
    if (typeof IntersectionObserver === "undefined") { setVisible(true); return; }
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { setVisible(true); io.disconnect(); }
    }, { rootMargin: "200px" });
    io.observe(el);
    return () => io.disconnect();
  }, [visible]);

  const real = useRealisticBody(visible && kind === "real", { sex: look?.sex ?? null, cup: look?.cup ?? null });

  const current = sizes.find((s) => s.label === label) ?? sizes[0];
  if (!current) return null;
  const option = product.sizeOptions.find((o) => o.label === current.label);
  const garment = option && option.chestCm != null
    ? { label: option.label, chestCm: option.chestCm, shoulderCm: option.shoulderCm, waistCm: option.waistCm ?? null, hipCm: option.hipCm ?? null }
    : null;
  const ORDER: Zone["key"][] = ["shoulder", "chest", "waist", "hip"];
  const zones = (current.zones ?? []).slice().sort((a, b) => ORDER.indexOf(a.key) - ORDER.indexOf(b.key));
  const cm = (d: number) => `${d > 0 ? "+" : d < 0 ? "−" : ""}${Math.abs(d).toFixed(1)} cm`;
  const VERDICTS = ["too small", "snug", "true to size", "relaxed", "too big"] as const;

  return (
    <Card>
      <div ref={hostRef} className="flex flex-col gap-6 md:flex-row md:items-start">
        <div className="flex flex-shrink-0 flex-col items-center rounded-2xl bg-paper-soft md:w-[300px]">
          <SafeBoundary fallback={<p className="flex h-[300px] items-center px-6 text-center text-xs text-ink-faint">{t("fitMap.cantStart")}</p>}>
            {!visible ? (
              <div className="h-[300px] w-[300px]" />
            ) : kind === "real" && real.state !== "ready" ? (
              real.state === "locked" ? (
                <div className="flex h-[300px] w-[300px] flex-col items-center justify-center gap-3 px-6 text-center">
                  <p className="text-xs text-ink-soft">{t("fitMap.realLocked")}</p>
                  <Link href="/passport?edit=1&focus=measurements" className="text-xs font-medium text-brand hover:underline">{t("fitMap.realLockedCta")}</Link>
                </div>
              ) : real.state === "error" ? (
                <p className="flex h-[300px] w-[300px] items-center px-6 text-center text-xs text-ink-faint">{t("fitMap.cantStart")}</p>
              ) : (
                <div className="flex h-[300px] w-[300px] animate-pulse items-center justify-center rounded-2xl bg-paper-dim text-xs text-ink-faint">{t("fitMap.realLoading")}</div>
              )
            ) : (
              <Suspense fallback={<div className="h-[300px] w-[300px] animate-pulse rounded-2xl bg-paper-dim" />}>
                {kind === "real" && real.state === "ready" ? (
                  <FitMap3D
                    size={300}
                    measurements={real.measurements}
                    body={real.body}
                    zones={current.zones}
                    garment={null}
                    zoom={1.5}
                    tint={toneHex(look!.tone, look!.undertone)}
                    skin={look!.tone !== "form"}
                  />
                ) : (
                  <FitMap3D
                    size={300}
                    measurements={{
                      heightCm: body.heightCm, chestCm: body.chestCm, waistCm: body.waistCm, hipCm: body.hipCm,
                      shoulderCm: body.shoulderCm, inseamCm: body.inseamCm, sex: body.sex,
                    }}
                    zones={current.zones}
                    garment={garment}
                  />
                )}
              </Suspense>
            )}
          </SafeBoundary>
          <div className="mt-3 flex justify-center pb-3" role="radiogroup" aria-label={t("fitMap.kindLabel")}>
            <div className="inline-flex rounded-full border border-line bg-white p-0.5 text-xs font-medium">
              {(["form", "real"] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  role="radio"
                  aria-checked={kind === k}
                  onClick={() => chooseKind(k)}
                  className={`min-h-[32px] rounded-full px-3.5 transition-colors ${kind === k ? "bg-ink text-paper" : "text-ink-soft hover:text-ink"}`}
                >
                  {t(k === "form" ? "fitMap.kindForm" : "fitMap.kindReal")}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-h3 font-semibold text-ink">{t("fitMap.title", { size: current.label })}</h3>
          <p className="mt-0.5 text-xs text-ink-faint">{t("fitMap.sub")}</p>

          <div className="mt-4 flex flex-wrap gap-1.5" role="radiogroup" aria-label={t("fitMap.sizes")}>
            {sizes.map((s) => (
              <button
                key={s.label}
                type="button"
                role="radio"
                aria-checked={s.label === current.label}
                onClick={() => setLabel(s.label)}
                className={`min-h-[36px] min-w-[44px] rounded-full border px-3 text-xs font-semibold transition-colors ${
                  s.label === current.label ? "border-ink bg-ink text-paper" : "border-line bg-white text-ink-soft hover:border-ink/30"
                }`}
              >
                {s.label}
                {s.label === bestLabel && (
                  <span aria-label={t("fitMap.recommended")} className={`ml-1.5 inline-block h-1.5 w-1.5 rounded-full align-middle ${s.label === current.label ? "bg-paper" : "bg-brand"}`} />
                )}
              </button>
            ))}
          </div>

          <ul className="mt-5 divide-y divide-line rounded-2xl border border-line">
            {zones.map((z) => (
              <li key={z.key} className="flex items-center gap-3 px-4 py-3 text-sm">
                <span aria-hidden className="h-3 w-3 flex-shrink-0 rounded-full ring-1 ring-ink/10" style={{ background: VERDICT_COLOUR[z.verdict] }} />
                <span className="font-medium text-ink">{t(`fitMap.parts.${z.key}`)}</span>
                <span className="ml-auto font-semibold tabular-nums text-ink">{cm(z.deltaCm)}</span>
                <span className="w-24 text-right text-xs text-ink-soft">{tf(`verdict.${z.verdict}`)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] text-ink-faint">{t("fitMap.signHint")}</p>

          <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1.5 text-[11px] text-ink-soft">
            {VERDICTS.map((v) => (
              <span key={v} className="inline-flex items-center gap-1.5">
                <span aria-hidden className="h-2.5 w-2.5 rounded-full ring-1 ring-ink/10" style={{ background: VERDICT_COLOUR[v] }} />
                {tf(`verdict.${v}`)}
              </span>
            ))}
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden className="h-2.5 w-2.5 rounded-full ring-1 ring-ink/10" style={{ background: FORM_COLOUR }} />
              {t("fitMap.notMeasured")}
            </span>
          </div>

          <p className="mt-4 text-[11px] leading-relaxed text-ink-faint">
            {kind === "real" ? t("fitMap.captionReal") : t("fitMap.caption")}
            {garment && kind === "form" && <> {t("fitMap.captionShell", { size: current.label })}</>}
            {garment && kind === "real" && <> {t("fitMap.shellFormOnly")}</>}
            {body.estimated && <> {t("fitMap.estimated")}</>}
          </p>

          {/* Session 98: the same size on /body, where the realistic body and a face can be chosen. */}
          <Link
            href={fitLink({ size: current.label, item: [product.brand, product.productName].filter(Boolean).join(" ") || null, zones: current.zones ?? [] })}
            className="mt-4 inline-flex h-10 items-center gap-1.5 whitespace-nowrap rounded-full border border-line bg-white px-4 text-xs font-medium text-ink hover:border-ink/30"
          >
            {t("fitMap.openBody")} <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </Card>
  );
}
