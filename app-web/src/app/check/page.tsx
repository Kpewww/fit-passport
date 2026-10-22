"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Alert, ArrowRight, CaretDown, Check, Scales, Warning } from "@/components/Icon";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Button, Card, ConfidenceRing, FitStars, LinkButton, Segmented, Skeleton } from "@/components/ui";
import { useT } from "@/i18n/client";
import { DEMO_PRODUCTS } from "@/lib/demoProducts";
import { isResaleHost } from "@/lib/sellerMeasurements";
import { useGarmentText } from "@/i18n/garment";
import { Headline } from "@/components/Headline";
import { GarmentIcon } from "@/components/GarmentIcon";
import { sameEngineCategory } from "@/lib/garmentTaxonomy";
import type { SellerInput } from "./ListingForms";
import type { ChartUploadInput } from "./ChartUpload";
import type { Body, CheckResponse, FitPref, Product, SizeOption, SizeScore, Source, Status } from "./types";

const LiveConverter = dynamic(() => import("./LiveConverter").then((m) => m.LiveConverter));
const CategoryPicker = dynamic(() => import("./ListingForms").then((m) => m.CategoryPicker));
const SellerMeasureForm = dynamic(() => import("./ListingForms").then((m) => m.SellerMeasureForm));
const FitFigure = dynamic(() => import("@/components/FitFigure").then((m) => m.FitFigure));
const SignalGuide = dynamic(() => import("./SignalGuide").then((m) => m.SignalGuide));
const FitMapCard = dynamic(() => import("./FitMapCard").then((m) => m.FitMapCard));
const ChartUpload = dynamic(() => import("./ChartUpload").then((m) => m.ChartUpload));
const NameAndSave = dynamic(() => import("./NameAndSave").then((m) => m.NameAndSave));
const SourceRow = dynamic(() => import("./SourceRow").then((m) => m.SourceRow));
const JudgementCard = dynamic(() => import("./JudgementCard").then((m) => m.JudgementCard));

// Ordinal verdict → chip colour. Green = as you asked; amber = usable but off;
// neutral for the extremes so the "pick" chip stays the loudest thing in the row.
const VERDICT_STYLE: Record<string, string> = {
  "too small": "bg-paper-dim text-ink-faint",
  snug: "bg-warn-tint text-warn",
  "true to size": "bg-ok-tint text-ok",
  relaxed: "bg-warn-tint text-warn",
  "too big": "bg-paper-dim text-ink-faint",
};

const FIT_PREFS: FitPref[] = ["slim", "regular", "relaxed", "oversized"];

const DEMO_URLS = DEMO_PRODUCTS;

function CheckInner() {
  const t = useT("check");
  const params = useSearchParams();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CheckResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);
  // The refusal's code, for the next step offered under its message (Session 100).
  const [errCode, setErrCode] = useState<string | null>(null);
  // The chart-picture panel, opened by that next step too.
  const [uploadOpen, setUploadOpen] = useState(false);
  const answerRef = useRef<HTMLDivElement>(null);
  // A refusal the user can answer by typing the seller's measurements (a listing
  // with none, or one our server cannot read — eBay refuses it).
  const [canMeasure, setCanMeasure] = useState(false);
  // No rule and no classifier could name the garment (Session 85b): the user picks
  // it, and the same link is checked again with that.
  const [pickFor, setPickFor] = useState<string | null>(null);
  // An uploaded chart (Session 100), kept so that "what kind of garment is this?" can
  // send it again with the answer (the server has it cached by then).
  const [upload, setUpload] = useState<ChartUploadInput | null>(null);
  const [status, setStatus] = useState<Status | null>(null);

  // The fit currently being previewed on the result. Seeded from the saved
  // profile (effectiveFit) on first load, then user can toggle live.
  const [fit, setFit] = useState<FitPref>("regular");
  const [reranking, setReranking] = useState(false);

  useEffect(() => {
    fetch("/api/status").then((r) => r.json()).then(setStatus).catch(() => {});
  }, []);

  // A refusal, or a question back, is shown right under the link box and brought into
  // view (Session 100): below the converter and the guide it was a screen away on a
  // phone, and pressing the button looked like nothing happened.
  useEffect(() => {
    if (err || pickFor) answerRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [err, pickFor]);

  const runCheck = useCallback(async (targetUrl: string, seller?: SellerInput, category?: string, chartUpload?: ChartUploadInput) => {
    setErr(null);
    setErrCode(null);
    setUpload(chartUpload ?? null);
    setCanMeasure(false);
    setPickFor(null);
    setLoading(true);
    setData(null);
    try {
      const r = await fetch("/api/check", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(chartUpload ? { chartUpload, category } : { url: targetUrl, seller, category }),
      });
      const j = await r.json();
      const code = typeof j.error === "string" ? j.error : "";
      const host = typeof j.source?.host === "string" ? j.source.host : null;
      if (!r.ok && (code === "no-measurements-listing" || (isResaleHost(host) && (code === "unreadable" || code === "no-chart-on-page")))) {
        setCanMeasure(true);
      }
      if (!r.ok && code === "pick-category") setPickFor(chartUpload ? "upload" : targetUrl);
      if (!r.ok) setErrCode(code || null);
      // Prefer the API's human sentence over its machine code. A refusal here is
      // the product working correctly — "we don't size footwear yet, and here is
      // why" — and showing the raw slug `unsupported-category` instead throws away
      // the whole explanation.
      if (!r.ok) {
        throw new Error(
          typeof j.message === "string" ? j.message
            : typeof j.error === "string" ? j.error
            : t("checkFailed"),
        );
      }
      setData(j);
      setFit(j.effectiveFit as FitPref);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : t("checkFailed"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Reopen a check that was already run — the browser extension's "Open full
  // explanation" lands here. It cannot re-run the check from the URL: the whole
  // reason the extension exists is that our server cannot read that retailer's
  // page. So it recomputes from the stored product instead, through the same
  // route the fit toggle uses, which applies the same provenance ceiling.
  const openStored = useCallback(async (productId: string) => {
    setErr(null);
    setLoading(true);
    setData(null);
    try {
      const r = await fetch("/api/recommend", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      const j = await r.json();
      if (!r.ok || !j.product || !j.result) {
        throw new Error(
          r.status === 404 ? t("notFound") : t("reopenFailed"),
        );
      }
      setData({ product: j.product, source: j.source ?? {}, result: j.result, body: j.body, effectiveFit: j.effectiveFit });
      // An uploaded chart's address is this page itself: not something to paste back.
      setUrl(j.source?.extractedBy === "uploaded-picture" ? "" : j.product.url ?? "");
      setFit(j.effectiveFit as FitPref);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : t("reopenFailed"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    const stored = params.get("product");
    if (stored) {
      openStored(stored);
      return;
    }
    const incoming = params.get("url");
    if (incoming) {
      setUrl(incoming);
      runCheck(incoming);
    }
  }, [params, runCheck, openStored]);

  // Re-run the engine for a different fit preference (no new product row).
  const rerank = useCallback(
    async (nextFit: FitPref) => {
      if (!data) return;
      setFit(nextFit);
      setReranking(true);
      try {
        const r = await fetch("/api/recommend", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ productId: data.product.id, preferredFit: nextFit }),
        });
        const j = await r.json();
        if (r.ok) setData({ ...data, result: j.result, effectiveFit: j.effectiveFit });
      } finally {
        setReranking(false);
      }
    },
    [data],
  );

  const tc = useT("common");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (url) runCheck(url);
  }

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
        {/* Centered hero — mirrors the homepage composition. */}
        <div className="text-center">
          <p className="eyebrow text-ink-faint">{t("eyebrow")}</p>
          <h1 className="mx-auto mt-4 max-w-3xl font-serif text-display text-ink [text-wrap:balance]"><Headline>{t("title")}</Headline></h1>
          <p className="mx-auto mt-5 max-w-lg text-ink-soft">{t("lede")}</p>
          {/* Said once, plainly: many large retailers refuse our servers (measured,
              Sessions 70–75d), so a link that fails here is usually not the
              shopper's mistake. */}
          <p className="mx-auto mt-2 max-w-lg text-xs text-ink-faint">
            <span className="mr-1.5 rounded-full border border-line px-1.5 py-px text-[10px] uppercase tracking-wider">{tc("beta")}</span>
            {t.rich("betaNote", {
              link: (c) => <Link href="/extension" className="underline underline-offset-2 hover:text-ink">{c}</Link>,
            })}
          </p>

          {/* Same pill field family as the homepage hero, in the light palette. */}
          <form
            onSubmit={submit}
            className="mx-auto mt-8 flex max-w-xl items-center gap-2 rounded-full border border-line bg-white p-1.5 transition-colors focus-within:border-ink/40"
          >
            <input
              type="text"
              inputMode="url"
              required
              placeholder={t("placeholder")}
              aria-label={t("placeholder")}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              /* min-w-0 — see the note on the homepage form; same trap. */
              className="min-w-0 flex-1 bg-transparent px-4 py-3 text-base text-ink placeholder:text-ink-faint focus:outline-none sm:py-2.5 sm:text-sm"
            />
            <button
              type="submit"
              disabled={loading}
              className="flex min-h-[44px] flex-shrink-0 items-center gap-2 rounded-full bg-ink px-4 text-sm font-medium text-paper transition-colors hover:bg-black disabled:opacity-50 sm:min-h-0 sm:px-5 sm:py-2.5"
            >
              {loading ? t("reading") : <>{t("submit")} <ArrowRight size={16} /></>}
            </button>
          </form>

          {/* What came back when it is not an answer: a refusal with its next step, a
              question about the garment, the seller's numbers. Right under the box. */}
          <div ref={answerRef} className="mx-auto max-w-xl scroll-mt-24 text-left">
            {err && (
              <div role="alert" className="mt-6 rounded-2xl bg-bad-tint px-5 py-4 text-sm text-bad">
                <div className="flex items-start gap-3">
                  <Alert size={20} className="mt-px flex-shrink-0" />
                  <p>{err}</p>
                </div>
                {/* A store that would not give us its chart: the chart itself still can
                    be given — a screenshot of it — or read by the extension on a computer. */}
                {(errCode === "unreadable" || errCode === "no-chart-on-page") && (
                  <div className="mt-3 flex flex-wrap gap-2 pl-8">
                    <Button size="sm" variant="secondary" onClick={() => setUploadOpen(true)}>{t("next.upload")}</Button>
                    <LinkButton href="/extension" size="sm" variant="ghost" className="hidden sm:inline-flex">{t("next.extension")}</LinkButton>
                  </div>
                )}
              </div>
            )}
            {canMeasure && !loading && <SellerMeasureForm onSubmit={(seller) => runCheck(url, seller)} />}
            {pickFor && !loading && <CategoryPicker onPick={(category) => runCheck(pickFor, undefined, category, pickFor === "upload" ? upload ?? undefined : undefined)} />}
          </div>

          {/* Only a size chart, no page (Session 100). */}
          <ChartUpload key={uploadOpen ? "open" : "closed"} startOpen={uploadOpen} busy={loading} onSubmit={(chart, category) => runCheck("", undefined, category, chart)} />

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="text-ink-faint">{t("try")}</span>
            {DEMO_URLS.map((d) => (
              <button
                key={d.url}
                type="button"
                onClick={() => {
                  setUrl(d.url);
                  runCheck(d.url);
                }}
                className="flex min-h-[40px] items-center rounded-full border border-line px-3.5 text-ink-soft transition-colors hover:border-ink hover:text-ink sm:min-h-0 sm:px-3 sm:py-1"
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Live size converter — usable before you paste anything, so the page is
            never a dead end while you go find a link. */}
        {!data && !loading && <LiveConverter key={status?.department ?? "none"} department={status?.department ?? null} />}

        {/* Guidance: a first-time visitor pasting a link gets a size based on
            almost nothing, so be honest about it and show exactly what would
            sharpen it. Shown above the result too, since that's when it matters. */}
        {/* Not for a one-off listing: a judgement's strength is not this arithmetic,
            and its card says what would settle it. */}
        {status && status.accuracy !== "high" && !loading && !data?.result.judgement && (
          <SignalGuide
            status={status}
            hasResult={!!data}
            confidence={data?.result.undetermined ? undefined : data?.result.best.confidence}
            undetermined={data?.result.undetermined}
          />
        )}


        {loading && <LoadingResult />}
        {data && !loading && data.result.judgement ? (
          <JudgementCard data={data} onMeasure={(seller) => runCheck(data.product.url, seller)} />
        ) : data && !loading && (
          <Result data={data} fit={fit} onFit={rerank} reranking={reranking} onUpload={() => { setUploadOpen(true); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
        )}
      </div>
    </main>
  );
}

// A live size converter: pick a garment kind, type the size you normally wear,
// and every regional equivalent updates as you type. Pure client-side maths from
// lib/sizeConvert — no request, no waiting.
function LoadingResult() {
  return (
    <div className="mt-8 space-y-4">
      <Card className="space-y-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
      </Card>
      <Card className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
        <div className="space-y-3">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-[72px] w-[72px] rounded-full" />
      </Card>
    </div>
  );
}

type ClosetPiece = {
  id: string;
  brand: string;
  displayName: string | null;
  category: string;
  size: string;
  color: string | null;
  fitRating: number;
  imageDataUrl: string | null;
};

/**
 * The closet pieces behind the answer: the one a reason used, and every other
 * piece of the same brand and type — so someone with five Maje sweaters sees which
 * one counted, and that the others are a different size. Session 88b.
 */
function ClosetBasis({ product, result }: { product: Product; result: CheckResponse["result"] }) {
  const t = useT("check");
  const g = useGarmentText();
  const [items, setItems] = useState<ClosetPiece[] | null>(null);
  const usedId = result.best.reasons.find((r) => r.signal === "known-good")?.itemId ?? null;
  const brand = (product.brand ?? "").toLowerCase();

  useEffect(() => {
    if (!usedId && !brand) return;
    fetch("/api/closet").then((r) => r.json()).then((j) => setItems(j.items ?? [])).catch(() => setItems([]));
  }, [usedId, brand]);

  if (!items) return null;
  const same = items.filter((it) => brand && it.brand.toLowerCase() === brand && sameEngineCategory(it.category, product.category));
  const used = items.find((it) => it.id === usedId);
  // The piece the answer used first, then the rest of that brand and type.
  const shown = used ? [used, ...same.filter((it) => it.id !== used.id)] : same;
  if (shown.length === 0) return null;
  const sizes = new Set(same.map((it) => it.size.toUpperCase()));
  const unnamed = same.filter((it) => !it.displayName).length;

  return (
    <div className="border-t border-line px-6 py-4 sm:px-8">
      <p className="eyebrow mb-2.5 text-ink-faint">{t("basis.title")}</p>
      <ul className="space-y-2">
        {shown.map((it) => (
          <li key={it.id} className={`flex min-w-0 items-center gap-3 rounded-xl px-2.5 py-2 ${it.id === usedId ? "bg-brand-tint ring-1 ring-brand/30" : "ring-1 ring-line"}`}>
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-paper-soft">
              {it.imageDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={it.imageDataUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <GarmentIcon category={it.category} size={22} className="text-ink-faint" />
              )}
            </span>
            <span className="min-w-0 flex-1 text-sm">
              <span className="block truncate font-medium text-ink">
                {it.brand} {it.displayName ? `· ${it.displayName}` : it.color ? `· ${g.color(it.color)}` : `· ${g.label(it.category)}`}
              </span>
              <span className="text-xs text-ink-soft">{t("basis.size", { size: it.size })}</span>
            </span>
            <FitStars rating={it.fitRating} size={12} />
            {it.id === usedId && <span className="flex-shrink-0 rounded-full bg-brand px-2 py-0.5 text-[10px] font-semibold text-white">{t("basis.used")}</span>}
          </li>
        ))}
      </ul>
      {same.length >= 2 && sizes.size >= 2 && <p className="mt-2 text-xs text-ink-soft">{t("basis.split", { n: same.length })}</p>}
      {same.length >= 2 && unnamed >= 2 && (
        <Link href="/closet" className="mt-1.5 inline-block text-xs font-medium text-brand hover:underline">{t("basis.nameThem")}</Link>
      )}
    </div>
  );
}

function Result({
  data,
  fit,
  onFit,
  reranking,
  onUpload,
}: {
  data: CheckResponse;
  fit: FitPref;
  onFit: (f: FitPref) => void;
  reranking: boolean;
  /** Open the chart-picture panel: the next step when the page gave sizes but no numbers. */
  onUpload: () => void;
}) {
  const t = useT("check");
  const tf = useT("fit");
  const g = useGarmentText();
  const { product, source, result, body } = data;
  // The first two lines of the engine's explanation are the reasons; the rest is
  // the working, one tap away. Showing all of it at once buried the answer.
  // The engine prefixes its lines with a bullet; the list draws its own.
  const lines = result.explanation
    .split("\n")
    .map((l) => l.replace(/^\s*[•*-]\s*/, ""))
    .filter((l) => l.trim());
  const lead = lines.slice(0, 2);
  const more = lines.slice(2);
  const meta = [product.brand, product.category && g.label(product.category)].filter(Boolean).join(" · ");

  return (
    <section className="mt-10 space-y-6 animate-fade-in-up">
      {/* CROSS-DOMAIN DISCLAIMER — closet evidence is a different garment type */}
      {result.domainNote && (
        <div className="flex items-start gap-3 rounded-2xl bg-warn-tint px-5 py-4 text-sm">
          <Warning size={20} className="mt-px flex-shrink-0 text-warn" />
          <div>
            <p className="font-medium text-warn">{t("result.lowConfidence")}</p>
            <p className="mt-0.5 text-ink-soft">{result.domainNote}</p>
          </div>
        </div>
      )}

      {/* SIGNAL CONFLICT — the evidence points at different sizes. The confidence
          number already reflects this; this says WHY, which is the whole point of
          a transparent engine. Kept visually quieter than the cross-domain
          warning: a conflict lowers certainty, it doesn't invalidate the answer. */}
      {result.conflictNote && (
        <div className="flex items-start gap-3 rounded-2xl bg-paper-soft px-5 py-4 text-sm ring-1 ring-line">
          <Scales size={20} className="mt-px flex-shrink-0 text-ink-faint" />
          <div>
            <p className="font-medium text-ink">{t("result.whyLower")}</p>
            <p className="mt-0.5 text-ink-soft">{result.conflictNote}</p>
          </div>
        </div>
      )}

      {/* THE ANSWER. One card, read top to bottom: the size, the two reasons,
          where the numbers came from, then what to do next. (Session 76, R4 —
          the product card used to come first, so the answer was the second
          thing on the screen.) */}
      <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-line">
        <div className="p-6 sm:p-8">
          {meta && <p className="eyebrow text-ink-faint">{meta}</p>}
          <h2 className="mt-2 text-h3 font-semibold text-ink">
            {product.productName || (source.extractedBy === "uploaded-picture" ? t("result.uploadedTitle") : null)}
          </h2>

          {/* When the engine reports `undetermined`, every size scored identically
              and `best` is just the first rung of the ladder — so we must NOT print
              it in display type with a confidence ring beside it. Showing a number
              there would dress ladder order up as a recommendation, which is the
              exact failure this product exists to avoid. */}
          {result.undetermined ? (
            <div className="mt-6">
              <p className="eyebrow text-ink-faint">{t("result.noRecommendation")}</p>
              <p className="mt-2 font-serif text-h2 text-ink">{t("result.allSame", { n: result.ranked.length })}</p>
              <p className="mt-2 text-sm text-ink-soft">{t("result.breakTie")}</p>
              {/* The page listed its sizes but no measurement (Session 100, a Uniqlo link
                  read on production): the chart itself, as a screenshot, settles it. */}
              {product.sizeOptions.every((o) => o.chestCm == null && o.bodyChestMinCm == null && o.waistCm == null && o.bodyWaistMinCm == null) && (
                <Button size="sm" variant="secondary" className="mt-3" onClick={onUpload}>{t("next.upload")}</Button>
              )}
            </div>
          ) : (
            <div className="mt-6 flex items-end justify-between gap-6">
              <div className="min-w-0">
                <p className="eyebrow text-brand">{t("result.recommended")}</p>
                <p className={`mt-2 font-serif text-display text-ink transition-opacity duration-200 ${reranking ? "opacity-40" : ""}`}>
                  {result.best.label}
                </p>
                {result.best.normalized && result.best.normalized !== result.best.label && (
                  <p className="mt-2 text-sm text-ink-faint">≈ {result.best.normalized}</p>
                )}
                {/* How far the answer holds — the stability grid said in the wearer's
                    own units, so "small changes don't swing it" is something they
                    can check against their tape. Phrased as a fact about THIS
                    answer; the fragile case adds its own sentence in conflictNote. */}
                {result.stability?.holdsForChestCm && (
                  <p className="mt-2 text-sm text-ink-soft">
                    {t("result.holds", { lo: result.stability.holdsForChestCm[0], hi: result.stability.holdsForChestCm[1] })}
                  </p>
                )}
              </div>
              <div className="flex flex-shrink-0 flex-col items-center">
                <ConfidenceRing value={result.best.confidence} size={84} />
                <p className="mt-1.5 text-xs text-ink-faint">{t("result.confidence")}</p>
              </div>
            </div>
          )}

          {/* Fit preference — default from the profile; preview others live. */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="text-xs text-ink-faint">{t("result.previewAs")}</span>
            <Segmented
              label={t("result.fitPrefLabel")}
              options={FIT_PREFS.map((f) => ({ value: f, label: tf(`pref.${f}`) }))}
              value={fit}
              onChange={(f) => { if (!reranking) onFit(f); }}
            />
          </div>
        </div>

        {/* The reasons. */}
        <div className={`border-t border-line bg-paper-soft px-6 py-5 text-sm transition-opacity duration-200 sm:px-8 ${reranking ? "opacity-40" : ""}`}>
          <ul className="space-y-1.5 text-ink">
            {lead.map((line, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="mt-2 h-1 w-1 flex-shrink-0 rounded-full bg-ink" aria-hidden />
                <span>{line}</span>
              </li>
            ))}
          </ul>
          {more.length > 0 && (
            <details className="group mt-3">
              <summary className="inline-flex cursor-pointer list-none items-center gap-1 text-xs font-medium text-ink-soft hover:text-ink">
                <CaretDown size={14} className="transition-transform group-open:rotate-180" />
                {t("result.fullWorking")}
              </summary>
              <div className="mt-2 space-y-1 text-ink-soft">
                {more.map((line, i) => <p key={i}>{line}</p>)}
              </div>
            </details>
          )}
        </div>

        {/* Which closet pieces this leaned on (Session 88b). */}
        <ClosetBasis product={product} result={result} />

        {/* Where the numbers came from. */}
        <div className="border-t border-line px-6 py-4 sm:px-8">
          <SourceRow product={product} source={source} />
        </div>

        {/* Name it and keep it (Session 100): open at once for an uploaded chart,
            which arrives with no brand or name. */}
        {!result.undetermined && (
          <div className="border-t border-line px-6 py-4 sm:px-8">
            <NameAndSave product={product} size={result.best.label} startOpen={source.extractedBy === "uploaded-picture"} />
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-line px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p className="text-xs text-ink-faint">{t("result.recordNote")}</p>
          <LinkButton
            href={`/history?product=${encodeURIComponent(product.id)}&size=${encodeURIComponent(result.undetermined ? "" : result.best.label)}`}
            variant="secondary" size="sm" icon={<Check size={16} />}
          >{t("result.recordCta")}</LinkButton>
        </div>
      </div>

      {/* THE FIT MAP (Session 97): the answer's size on the wearer's own measured
          body, each part coloured by the engine's own numbers. Body charts get it
          too — they carry per-part fit as well as garment charts do. */}
      {body && !result.undetermined && result.ranked.some((r) => r.zones?.length) && (
        <FitMapCard body={body} product={product} ranked={result.ranked} bestLabel={result.best.label} />
      )}

      {/* SEE THE GAP — the ease arithmetic the engine already does, drawn. Only
          renders when we have a body chest AND a garment chest to compare; there
          is nothing honest to draw otherwise.
          The comment always said "AND a garment chest"; the code checked only the
          body, so every BODY chart (most US retailers — Nike, Patagonia, Uniqlo)
          rendered this card with a heading and nothing under it. */}
      {body?.chestCm != null && product.sizeOptions.some((o) => o.chestCm != null) && (
        <Card>
          <h3 className="text-h3 font-semibold text-ink">{t("result.figureTitle")}</h3>
          <p className="mb-4 mt-0.5 text-xs text-ink-faint">{t("result.figureSub")}</p>
          <FitFigure
            body={body}
            bestLabel={result.best.label}
            sizes={product.sizeOptions.map((o) => ({
              label: o.label,
              chestCm: o.chestCm,
              shoulderCm: o.shoulderCm,
            }))}
          />
        </Card>
      )}

      {/* Ranked sizes — interactive */}
      <Card>
        <h3 className="text-h3 font-semibold text-ink">{t("result.rankedTitle")}</h3>
        <p className="mb-4 mt-0.5 text-xs text-ink-faint">{t("result.rankedSub")}</p>
        <div className={`space-y-2 transition-opacity duration-200 ${reranking ? "opacity-40" : ""}`}>
          {result.ranked.map((s, idx) => (
            <SizeRow
              key={s.label}
              score={s}
              isBest={idx === 0 && !result.undetermined}
              option={product.sizeOptions.find((o) => o.label === s.label)}
              sizesFrom={source.sizesFrom}
              measurementKind={source.measurementKind}
              extractedBy={source.extractedBy}
            />
          ))}
        </div>
      </Card>
    </section>
  );
}


/**
 * What the numbers in a size row are, in the fewest words that stay true.
 *
 * Body and garment measurements are different claims (invariant ㊿): one is the
 * wearer this size is cut for, the other is how big the thing is. Saying which
 * costs a word and is the difference between a number the reader can use and one
 * they have to assume about. When the page never said, we say that too rather
 * than picking the likelier answer and presenting it as fact.
 */
function measurementLabel(
  t: ReturnType<typeof useT<"check">>,
  sizesFrom: Source["sizesFrom"],
  kind: Source["measurementKind"],
  extractedBy?: Source["extractedBy"],
): string {
  if (sizesFrom === "estimated") return t("measure.estimated");
  if (sizesFrom === "fixture") return t("measure.demo");
  if (sizesFrom === "seller") return t("measure.seller");
  const where = sizesFrom === "brand-chart" ? t("measure.whereBrand") : t("measure.wherePage");
  // A model reading prose or an image is a weaker claim than a parsed table, and
  // the reader deserves to know which one produced the numbers.
  const reader =
    extractedBy === "llm-text" ? t("measure.readerText")
      : extractedBy === "llm-vision" ? t("measure.readerImage")
      : extractedBy === "picked-picture" ? t("measure.readerPicked")
      : "";
  if (kind === "body") return t("measure.body", { where, reader });
  if (kind === "garment") return t("measure.garment", { where, reader });
  return t("measure.unknown", { where, reader });
}

function SizeRow({
  score,
  isBest,
  option,
  sizesFrom,
  measurementKind,
  extractedBy,
}: {
  score: SizeScore;
  isBest: boolean;
  option?: SizeOption;
  /** Where these numbers came from — this row states it, so it must know it. */
  sizesFrom?: Source["sizesFrom"];
  /** And what they measure. Body and garment numbers are different claims. */
  measurementKind?: Source["measurementKind"];
  /** And what read them: a parsed table, or a model reading text or an image. */
  extractedBy?: Source["extractedBy"];
}) {
  const [open, setOpen] = useState(isBest);
  const t = useT("check");
  const tf = useT("fit");
  const chips = measurementChips(t, option);
  return (
    <div
      className={`overflow-hidden rounded-xl border transition-colors ${
        isBest ? "border-ink/25 bg-paper-soft" : "border-line"
      }`}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-[44px] w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors hover:bg-paper-soft"
      >
        <div className="flex items-center gap-2 font-medium text-ink">
          {score.label}
          {score.normalized && score.normalized !== score.label && (
            <span className="text-xs text-ink-faint">≈ {score.normalized}</span>
          )}
          {isBest && (
            <span className="rounded-full bg-ink px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-paper">
              {t("row.pick")}
            </span>
          )}
          {score.verdict && (
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${VERDICT_STYLE[score.verdict] ?? "bg-paper-dim text-ink-faint"}`}>
              {tf(`verdict.${score.verdict}`)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <ScoreBar score={score.score} />
          <CaretDown size={16} className={`text-ink-faint transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </button>

      {open && (
        <div className="space-y-3 border-t border-line px-4 py-3 text-sm animate-fade-in-up">
          {/* Reasons */}
          <div>
            <p className="mb-1 text-[11px] uppercase tracking-widest text-ink-faint">
              {t("row.basedOn")}
            </p>
            {score.reasons.length > 0 ? (
              <ul className="space-y-1.5">
                {score.reasons.map((r, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span
                      className={`mt-1.5 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full ${
                        r.weight < 0 ? "bg-bad" : "bg-ink"
                      }`}
                    />
                    <span className="text-ink-soft">
                      <span className="mr-1.5 rounded bg-paper-dim px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-ink-faint">
                        {tf(`signal.${r.signal as "measurement-fit"}`)}
                      </span>
                      {r.message}
                      <span className={`ml-1.5 text-xs tabular-nums ${r.weight < 0 ? "text-bad" : "text-ok"}`}>
                        ({r.weight < 0 ? "" : "+"}{Math.round(r.weight * 100)})
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-ink-faint">
                {t("row.noSignal")}
              </p>
            )}
          </div>

          {/* Where these numbers came from. The label used to say "from the page"
              unconditionally; with a brand chart the page was never read, and the
              rendered row was the only place that claim appeared — the API
              response and every test were correct. */}
          {option && (
            <div>
              <p className="mb-1 text-[11px] uppercase tracking-widest text-ink-faint">
                {measurementLabel(t, sizesFrom, measurementKind, extractedBy)}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {chips.length > 0 ? (
                  chips.map((m) => (
                    <span key={m} className="rounded-lg bg-paper-dim px-2 py-0.5 text-xs tabular-nums text-ink-soft">
                      {m}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-ink-faint">{t("row.onlyLabel")}</span>
                )}
              </div>
            </div>
          )}

          {/* Score + confidence footer */}
          <div className="flex gap-6 border-t border-line pt-2 text-xs text-ink-faint">
            <span>{t.rich("row.matchScore", { b: (c) => <b className="text-ink">{c}</b> }, { n: Math.round(score.score * 100) })}</span>
            <span>{t.rich("row.confidence", { b: (c) => <b className="text-ink">{c}</b> }, { pct: Math.round(score.confidence * 100) })}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function measurementChips(t: ReturnType<typeof useT<"check">>, o?: SizeOption): string[] {
  if (!o) return [];
  const chips: string[] = [];
  if (o.chestCm != null) chips.push(t("measure.chest", { n: o.chestCm }));
  if (o.shoulderCm != null) chips.push(t("measure.shoulder", { n: o.shoulderCm }));
  if (o.sleeveCm != null) chips.push(t("measure.sleeve", { n: o.sleeveCm }));
  if (o.lengthCm != null) chips.push(t("measure.length", { n: o.lengthCm }));
  if (o.bodyChestMinCm != null && o.bodyChestMaxCm != null)
    chips.push(t("measure.bodyChest", { lo: o.bodyChestMinCm, hi: o.bodyChestMaxCm }));
  // Waist is scored now (Session 78), so it has to be shown: a number the engine
  // weighed that the screen never mentions is the Session 69 failure again.
  if (o.waistCm != null) chips.push(t("measure.waist", { n: o.waistCm }));
  if (o.bodyWaistMinCm != null && o.bodyWaistMaxCm != null)
    chips.push(t("measure.bodyWaist", { lo: o.bodyWaistMinCm, hi: o.bodyWaistMaxCm }));
  if (o.hipCm != null) chips.push(t("measure.hip", { n: o.hipCm }));
  if (o.bodyHipMinCm != null && o.bodyHipMaxCm != null)
    chips.push(t("measure.bodyHip", { lo: o.bodyHipMinCm, hi: o.bodyHipMaxCm }));
  return chips;
}

function ScoreBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1 w-20 overflow-hidden rounded-full bg-line">
        <div
          className="h-full rounded-full bg-ink transition-all"
          style={{ width: `${Math.round(score * 100)}%` }}
        />
      </div>
      <span className="w-7 text-right text-xs tabular-nums text-ink-faint">{Math.round(score * 100)}</span>
    </div>
  );
}

export default function CheckPage() {
  const t = useT("check");
  return (
    <Suspense fallback={<div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">{t("loading")}</div>}>
      <CheckInner />
    </Suspense>
  );
}


