"use client";

import { Suspense, lazy, useCallback, useEffect, useState } from "react";
import { Alert, ArrowRight, ArrowUpRight, BrowserIcon, CaretDown, Check, Globe, Info, LinkIcon, Robot, Ruler, Scales, Warning } from "@/components/Icon";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Button,
  Card,
  ConfidenceRing,
  LinkButton,
  Segmented,
  Skeleton,
  inputClass,
} from "@/components/ui";
import { convert, detectScale, scalesForDomain } from "@/lib/sizeConvert";
import type { SizeDomain } from "@/lib/sizeSystems";
import { FitFigure } from "@/components/FitFigure";
import { SafeBoundary } from "@/components/SafeBoundary";
import { CONFIDENCE_WEIGHTS } from "@/lib/confidenceWeights";
import { chestEaseCm } from "@/lib/bodyMesh";
import { useT } from "@/i18n/client";
import { DEMO_PRODUCTS } from "@/lib/demoProducts";
import { isResaleHost } from "@/lib/sellerMeasurements";
import type { Judgement } from "@/lib/listingJudgement";
import { useGarmentText } from "@/i18n/garment";
import { Headline } from "@/components/Headline";

// three.js only loads if someone opens the 3D view. Boundaried because a failed
// chunk silently blanks its subtree rather than throwing.
const BodyMesh3D = lazy(() =>
  import("@/components/BodyMesh3D").then((m) => ({ default: m.BodyMesh3D })),
);

type SizeScore = {
  label: string;
  normalized: string | null;
  score: number;
  confidence: number;
  reasons: Array<{ signal: string; weight: number; message: string }>;
  verdict?: "too small" | "snug" | "true to size" | "relaxed" | "too big";
};

// Ordinal verdict → chip colour. Green = as you asked; amber = usable but off;
// neutral for the extremes so the "pick" chip stays the loudest thing in the row.
const VERDICT_STYLE: Record<string, string> = {
  "too small": "bg-paper-dim text-ink-faint",
  snug: "bg-warn-tint text-warn",
  "true to size": "bg-ok-tint text-ok",
  relaxed: "bg-warn-tint text-warn",
  "too big": "bg-paper-dim text-ink-faint",
};

type SizeOption = {
  label: string;
  region: string | null;
  chestCm: number | null;
  shoulderCm: number | null;
  sleeveCm: number | null;
  lengthCm: number | null;
  bodyChestMinCm: number | null;
  bodyChestMaxCm: number | null;
  waistCm?: number | null;
  bodyWaistMinCm?: number | null;
  bodyWaistMaxCm?: number | null;
};

type Product = {
  id: string;
  url: string;
  retailer: string | null;
  brand: string | null;
  productName: string | null;
  category: string | null;
  material: string | null;
  fitNotes: string | null;
  sizeOptions: SizeOption[];
};

type Source = {
  url: string;
  host: string;
  derived: boolean;
  slug?: string;
  sizesFrom?: "fixture" | "page" | "brand-chart" | "seller" | "estimated";
  chart?: { sourceUrl: string; capturedAt: string };
  measurementKind?: "body" | "garment";
  measurementKindFrom?: "page" | "table" | "brand";
  /** "extension" = the page came from the user's own browser, not our fetch. */
  fetch?: "ok" | "blocked" | "unreachable" | "skipped" | "extension";
  /** Which reader produced page sizes — a table, or a model reading text/images. */
  extractedBy?: "table" | "llm-text" | "llm-vision" | "hao-xing" | "seller-title" | "seller-specs" | "seller-description" | "seller-typed";
};

type Body = {
  chestCm: number | null;
  waistCm: number | null;
  shoulderCm: number | null;
  estimated: boolean;
};

type CheckResponse = {
  product: Product;
  source: Source;
  body?: Body;
  result: {
    ranked: SizeScore[];
    best: SizeScore;
    explanation: string;
    /** Nothing separated the sizes — `best` is ladder order, not a pick. */
    undetermined?: boolean;
    domainNote: string | null;
    domainRelevance: "match" | "cross" | "empty";
    conflictNote: string | null;
    /** Does the pick survive plausible measurement error? See lib/stability.ts. */
    stability?: {
      agreement: number;
      runs: number;
      holdsForChestCm: [number, number] | null;
      bodyNoiseCm: number;
      chartNoiseCm: number;
    } | null;
    /** A one-off listing's judgement (Session 80): present instead of a ranking. */
    judgement?: Judgement;
  };
  effectiveFit: FitPref;
  /** Absent when a stored check is reopened (`?product=`) — that is a recompute. */
  recommendationId?: string;
};

type Status = { hasBody: boolean; hasChest: boolean; closetCount: number; accuracy: "low" | "medium" | "high"; claimed?: boolean };

type FitPref = "slim" | "regular" | "relaxed" | "oversized";
const FIT_PREFS: FitPref[] = ["slim", "regular", "relaxed", "oversized"];

const DEMO_URLS = DEMO_PRODUCTS;

function CheckInner() {
  const t = useT("check");
  const params = useSearchParams();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CheckResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);
  // A refusal the user can answer by typing the seller's measurements (a listing
  // with none, or one our server cannot read — eBay refuses it).
  const [canMeasure, setCanMeasure] = useState(false);
  const [status, setStatus] = useState<Status | null>(null);

  // The fit currently being previewed on the result. Seeded from the saved
  // profile (effectiveFit) on first load, then user can toggle live.
  const [fit, setFit] = useState<FitPref>("regular");
  const [reranking, setReranking] = useState(false);

  useEffect(() => {
    fetch("/api/status").then((r) => r.json()).then(setStatus).catch(() => {});
  }, []);

  const runCheck = useCallback(async (targetUrl: string, seller?: SellerInput) => {
    setErr(null);
    setCanMeasure(false);
    setLoading(true);
    setData(null);
    try {
      const r = await fetch("/api/check", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: targetUrl, seller }),
      });
      const j = await r.json();
      const code = typeof j.error === "string" ? j.error : "";
      const host = typeof j.source?.host === "string" ? j.source.host : null;
      if (!r.ok && (code === "no-measurements-listing" || (isResaleHost(host) && (code === "unreadable" || code === "no-chart-on-page")))) {
        setCanMeasure(true);
      }
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
      setUrl(j.product.url ?? "");
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
        {!data && !loading && <LiveConverter />}

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

        {err && (
          <div role="alert" className="mt-6 flex items-start gap-3 rounded-2xl bg-bad-tint px-5 py-4 text-sm text-bad">
            <Alert size={20} className="mt-px flex-shrink-0" />
            <p>{err}</p>
          </div>
        )}
        {canMeasure && !loading && <SellerMeasureForm onSubmit={(seller) => runCheck(url, seller)} />}

        {loading && <LoadingResult />}
        {data && !loading && data.result.judgement ? (
          <JudgementCard data={data} onMeasure={(seller) => runCheck(data.product.url, seller)} />
        ) : data && !loading && (
          <Result data={data} fit={fit} onFit={rerank} reranking={reranking} />
        )}
      </div>
    </main>
  );
}

// A live size converter: pick a garment kind, type the size you normally wear,
// and every regional equivalent updates as you type. Pure client-side maths from
// lib/sizeConvert — no request, no waiting.
const CONV_KINDS: Array<{ label: "tops" | "bottoms" | "shoes"; domain: SizeDomain }> = [
  { label: "tops", domain: "top" },
  { label: "bottoms", domain: "bottom" },
  { label: "shoes", domain: "shoe" },
];

function LiveConverter() {
  const t = useT("check");
  const [domain, setDomain] = useState<SizeDomain>("top");
  const [raw, setRaw] = useState("M");
  const [scaleId, setScaleId] = useState<string | null>(null);

  const scales = scalesForDomain(domain);
  // Use the explicit scale when the user picked one, else auto-detect what they typed.
  const from = scaleId ?? detectScale(domain, raw);
  const rows = from ? convert(domain, raw, from) : [];

  function pickDomain(d: SizeDomain) {
    setDomain(d);
    setScaleId(null);
    setRaw(d === "top" ? "M" : d === "bottom" ? "32" : "US 9");
  }

  return (
    <div className="mt-12 rounded-2xl bg-white p-6 ring-1 ring-line sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow text-ink-faint">{t("converter.eyebrow")}</p>
          <h2 className="mt-1.5 font-serif text-2xl text-ink">{t("converter.title")}</h2>
        </div>
        <Segmented
          label={t("converter.kindLabel")}
          options={CONV_KINDS.map((k) => ({ value: k.domain, label: t(`converter.${k.label}`) }))}
          value={domain}
          onChange={pickDomain}
        />
      </div>

      <div className="mt-5 flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="mb-1.5 block font-medium text-ink">{t("converter.youWear")}</span>
          <input
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder={domain === "shoe" ? "US 9" : domain === "bottom" ? "32" : "M"}
            className={inputClass + " w-32"}
          />
        </label>
        <label className="text-sm">
          <span className="mb-1.5 block font-medium text-ink">{t("converter.inSystem")}</span>
          <select
            value={from ?? ""}
            onChange={(e) => setScaleId(e.target.value || null)}
            className={inputClass + " w-44"}
          >
            <option value="">{t("converter.auto")}</option>
            {scales.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </label>
      </div>

      {/* live outputs — zeros/dashes until the input parses */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {scales.map((s) => {
          const hit = rows.find((r) => r.scaleId === s.id);
          const isSource = s.id === from;
          return (
            <div
              key={s.id}
              className={`rounded-xl border px-3 py-3 ${isSource ? "border-ink bg-paper-dim" : "border-line"}`}
            >
              <p className="text-meta uppercase text-ink-faint">{s.label}</p>
              <p className="mt-1 text-xl tabular-nums text-ink">{hit?.value ?? "—"}</p>
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-[11px] text-ink-faint">{t("converter.note")}</p>
    </div>
  );
}

// An honest "how good is this answer, and how do I improve it" panel. The engine
// is transparent by design, so we say plainly what it does and doesn't know yet.
function SignalGuide({
  status,
  hasResult,
  confidence,
  undetermined,
}: {
  status: Status;
  hasResult: boolean;
  /** The confidence of the answer just given, 0..1. Undefined before any check. */
  confidence?: number;
  /** True when nothing separated the sizes — see EngineOutput.undetermined. */
  undetermined?: boolean;
}) {
  // The numbers below come from the engine's own confidence arithmetic, not from
  // copywriting — see CONFIDENCE_WEIGHTS, which is the same constant the scorer
  // adds.
  //
  // "up to" is load-bearing, and was corrected before shipping: the raw sum then
  // passes through six caps and multipliers (cross-domain, report consistency,
  // top-2 margin, signal agreement, and two hard caps), every one of which can
  // only SHRINK it. A flat "+35" would have been an overclaim, and a test caught
  // it — a bare floor case measures 0.18, not the 0.30 the constant alone implies.
  const t = useT("check");
  const pts = (w: number) => t("guide.upTo", { n: Math.round(w * 100) });

  const steps = [
    {
      // Gated on the CHEST, not on hasBody. The points below are only ever
      // awarded for a chest (computeConfidence), so ticking this for someone who
      // entered a waist would quietly withdraw an offer that is still open.
      done: status.hasChest,
      key: "chest",
      label: status.hasBody ? t("guide.chestLabelMore") : t("guide.chestLabelAll"),
      why: t("guide.chestWhy", { pts: pts(CONFIDENCE_WEIGHTS.measurements) }),
      href: "/onboarding",
      cta: status.hasBody ? t("guide.chestCtaMore") : t("guide.chestCtaAll"),
    },
    {
      done: status.closetCount >= 3,
      key: "closet",
      label: t("guide.closetLabel"),
      why: t("guide.closetWhy", { pts: pts(CONFIDENCE_WEIGHTS.closetAnchor) }),
      href: "/closet",
      cta: t("guide.closetCta"),
      progress: status.closetCount > 0 ? t("guide.closetProgress", { n: status.closetCount }) : undefined,
    },
    {
      done: !!status.claimed,
      key: "account",
      label: t("guide.accountLabel"),
      why: t("guide.accountWhy"),
      href: "/account",
      cta: t("guide.accountCta"),
    },
  ];
  const remaining = steps.filter((s) => !s.done);
  if (remaining.length === 0) return null;

  return (
    <div className="mt-10 overflow-hidden rounded-2xl bg-white ring-1 ring-line">
      <div className="border-b border-line bg-paper-soft px-6 py-4">
        <p className="eyebrow text-ink-faint">
          {undetermined
            ? t("guide.eyebrowUndetermined")
            : hasResult
              ? t("guide.eyebrowResult")
              : t("guide.eyebrowBefore")}
        </p>
        {/* The invitation is grounded in the answer just given. Generic copy here
            would waste the one moment the person can actually SEE what the missing
            evidence costs them — which is the whole argument for letting a first
            check run on an empty profile. */}
        <h3 className="mt-2 font-serif text-2xl leading-tight text-ink">
          {undetermined
            ? t("guide.titleUndetermined")
            : confidence != null
              ? t("guide.titleConfidence", { pct: Math.round(confidence * 100) })
              : status.closetCount === 0 && !status.hasBody
                ? t("guide.titleGuessing")
                : t("guide.titleMissing")}
        </h3>
        <p className="mt-2 max-w-xl text-sm text-ink-soft">
          {undetermined
            ? t("guide.bodyUndetermined")
            : confidence != null
              // The floor from the engine's own constant, so the sentence cannot drift from it.
              ? t("guide.bodyConfidence", { floor: Math.round(CONFIDENCE_WEIGHTS.floor * 100) })
              : status.closetCount === 0 && !status.hasBody
                ? t("guide.bodyGuessing")
                : t("guide.bodyMissing")}
        </p>
      </div>
      <ul className="divide-y divide-line">
        {steps.map((s) => (
          <li key={s.key} className="flex items-center gap-4 px-6 py-4">
            <span
              className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                s.done ? "bg-ok text-white" : "bg-paper-dim text-ink-faint"
              }`}
            >
              {s.done && <Check size={14} />}
            </span>
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-medium ${s.done ? "text-ink-faint line-through" : "text-ink"}`}>
                {s.label}
                {s.progress && !s.done && <span className="ml-2 text-xs font-normal text-brand">{s.progress}</span>}
              </p>
              {!s.done && <p className="mt-0.5 text-xs text-ink-soft">{s.why}</p>}
            </div>
            {!s.done && (
              <LinkButton href={s.href} variant="secondary" size="sm">{s.cta}</LinkButton>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

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

function Result({
  data,
  fit,
  onFit,
  reranking,
}: {
  data: CheckResponse;
  fit: FitPref;
  onFit: (f: FitPref) => void;
  reranking: boolean;
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
          <h2 className="mt-2 text-h3 font-semibold text-ink">{product.productName}</h2>

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

        {/* Where the numbers came from. */}
        <div className="border-t border-line px-6 py-4 sm:px-8">
          <SourceRow product={product} source={source} />
        </div>

        <div className="flex flex-col gap-3 border-t border-line px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p className="text-xs text-ink-faint">{t("result.recordNote")}</p>
          <LinkButton href="/history" variant="secondary" size="sm" icon={<Check size={16} />}>{t("result.recordCta")}</LinkButton>
        </div>
      </div>

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
          <EaseIn3D body={body} product={product} bestLabel={result.best.label} />
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

type SellerInput = { typed: Array<{ field: "chest" | "waist" | "length"; value: number; unit: "in" | "cm"; flat: boolean }>; category?: "top" | "bottom" };

/**
 * The seller's measurements, typed from the listing (Session 80). A second-hand
 * listing rarely has a size chart, and eBay refuses our server outright, so this
 * is how the website judges one: the shopper copies the pit to pit (and, if given,
 * the waist and length) and the same judgement runs as for the extension.
 */
function SellerMeasureForm({ onSubmit, askCategory = false }: { onSubmit: (s: SellerInput) => void; askCategory?: boolean }) {
  const t = useT("check");
  const [chest, setChest] = useState("");
  const [waist, setWaist] = useState("");
  const [length, setLength] = useState("");
  const [unit, setUnit] = useState<"in" | "cm">("in");
  const [category, setCategory] = useState<"" | "top" | "bottom">(askCategory ? "top" : "");
  const [need, setNeed] = useState(false);
  function submit(e: React.FormEvent) {
    e.preventDefault();
    const typed: SellerInput["typed"] = [];
    const add = (v: string, field: "chest" | "waist" | "length", flat: boolean) => {
      const n = parseFloat(v);
      if (n > 0) typed.push({ field, value: n, unit, flat });
    };
    add(chest, "chest", true);
    add(waist, "waist", true);
    add(length, "length", false);
    if (!typed.length) { setNeed(true); return; }
    onSubmit({ typed, category: category || undefined });
  }
  const num = "w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink focus:border-ink/40 focus:outline-none";
  return (
    <Card className="mt-6">
      <h2 className="text-h3 text-ink">{t("measureForm.title")}</h2>
      <p className="mt-1 text-sm text-ink-soft">{t("measureForm.intro")}</p>
      <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-xs text-ink-soft">{t("measureForm.chestFlat")}
          <input type="number" inputMode="decimal" min={1} max={200} step={0.25} className={num} value={chest} onChange={(e) => setChest(e.target.value)} />
        </label>
        <label className="grid gap-1 text-xs text-ink-soft">{t("measureForm.waistFlat")}
          <input type="number" inputMode="decimal" min={1} max={200} step={0.25} className={num} value={waist} onChange={(e) => setWaist(e.target.value)} />
        </label>
        <label className="grid gap-1 text-xs text-ink-soft">{t("measureForm.length")}
          <input type="number" inputMode="decimal" min={1} max={200} step={0.25} className={num} value={length} onChange={(e) => setLength(e.target.value)} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-1 text-xs text-ink-soft">{t("measureForm.unit")}
            <select className={num} value={unit} onChange={(e) => setUnit(e.target.value as "in" | "cm")}>
              <option value="in">{t("measureForm.inches")}</option>
              <option value="cm">{t("measureForm.cm")}</option>
            </select>
          </label>
          <label className="grid gap-1 text-xs text-ink-soft">{t("measureForm.category")}
            <select className={num} value={category} onChange={(e) => setCategory(e.target.value as "" | "top" | "bottom")}>
              <option value="">{t("measureForm.categoryAuto")}</option>
              <option value="top">{t("measureForm.top")}</option>
              <option value="bottom">{t("measureForm.bottom")}</option>
            </select>
          </label>
        </div>
        {need && <p role="alert" className="text-sm text-bad sm:col-span-2">{t("measureForm.needOne")}</p>}
        <div className="sm:col-span-2">
          <Button type="submit">{t("measureForm.submit")}</Button>
        </div>
      </form>
    </Card>
  );
}

/**
 * A one-off listing's answer (Session 80): a judgement, not a ranking — the server
 * decides it (listingJudgement.ts) with the engine's own target and verdict scale.
 */
function JudgementCard({ data, onMeasure }: { data: CheckResponse; onMeasure: (s: SellerInput) => void }) {
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

/**
 * Where the numbers came from, as one row of plain statements with an icon
 * each. It used to be a row of coloured pills (green, sky, amber, stone) that
 * the reader had to decode. Every claim below is made only when it is true —
 * the rules are unchanged from the pills they replaced.
 */
function SourceRow({ product, source }: { product: Product; source: Source }) {
  const t = useT("check");
  const reader =
    source.extractedBy === "llm-text" ? t("source.sizesAiText")
      : source.extractedBy === "llm-vision" ? t("source.sizesAiImage")
      : null;
  const host = source.host || t("source.thePage");
  return (
    <div className="space-y-2 text-xs text-ink-soft">
      {/* A demo link is answered from a curated sample, not from any page — say so
          and make no claim about reading (Session 80). */}
      {source.sizesFrom === "fixture" ? (
        <p className="inline-flex items-center gap-1.5 font-medium text-ink"><Info size={16} className="text-ink-faint" />{t("source.demo")}</p>
      ) : (
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        {/* Who read it. A brand chart means this product's page was never opened
            — so we say "identified", never "read". The extension hands us the
            page from the user's own browser, which is how we reach retailers
            our server is refused by. */}
        {source.sizesFrom === "brand-chart" || source.fetch === "blocked" || source.fetch === "unreachable" ? (
          // Also when the store refused our server and the numbers are the
          // user's own, typed from the listing: nothing was read (Session 80).
          <span className="inline-flex items-center gap-1.5"><LinkIcon size={16} className="text-ink-faint" />{t("source.identified")}</span>
        ) : source.fetch === "extension" ? (
          <span className="inline-flex items-center gap-1.5"><BrowserIcon size={16} className="text-ink-faint" />{t("source.readInBrowser", { host })}</span>
        ) : (
          <span className="inline-flex items-center gap-1.5"><Globe size={16} className="text-ink-faint" />{t("source.readFrom", { host })}</span>
        )}
        {/* Where the SIZE CHART came from — three cases, three amounts of trust. */}
        {source.sizesFrom === "seller" ? (
          <span className="inline-flex items-center gap-1.5">
            <Ruler size={16} className="text-ink-faint" />{source.extractedBy === "seller-typed" ? t("source.sellerTyped") : t("source.seller")}
          </span>
        ) : source.sizesFrom === "brand-chart" ? (
          <span
            className="inline-flex items-center gap-1.5"
            title={t("source.brandGuideTitle")}
          >
            <Ruler size={16} className="text-ink-faint" />{t("source.brandGuide", { brand: product.brand ?? "" })}
          </span>
        ) : source.sizesFrom === "estimated" ? (
          <span
            className="inline-flex items-center gap-1.5 font-medium text-warn"
            title={t("source.estimatedTitle")}
          >
            <Warning size={16} />{t("source.estimated")}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5">
            {reader ? <Robot size={16} className="text-ink-faint" /> : <Ruler size={16} className="text-ink-faint" />}
            {reader ?? t("source.sizesRead")}
          </span>
        )}
      </div>
      )}
      {/* The chart is checkable or it is not trustworthy — link the page the
          numbers came from, and date it, because a size guide goes stale. */}
      {source.sizesFrom === "brand-chart" && source.chart ? (
        <p className="text-ink-faint">
          {source.measurementKind === "body" ? t("source.brandBody") : t("source.brandGarment")}{" "}
          <a href={source.chart.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-ink">
            {t("source.checkGuide")}
          </a>{" "}
          {t("source.readOn", { date: source.chart.capturedAt })}
        </p>
      ) : null}
      <details className="group">
        <summary className="inline-flex cursor-pointer list-none items-center gap-1 font-medium text-ink-soft hover:text-ink">
          <CaretDown size={14} className="transition-transform group-open:rotate-180" />
          {t("source.productDetails")}
        </summary>
        <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
          <Detail label={t("source.retailer")} value={product.retailer} />
          <Detail label={t("source.brand")} value={product.brand} />
          <Detail label={t("source.category")} value={product.category} />
          <Detail label={t("source.material")} value={product.material} />
          <Detail label={t("source.sizesFound")} value={t("source.sizesFoundValue", { n: product.sizeOptions.length })} />
          <Detail label={t("source.fitNote")} value={product.fitNotes} />
        </dl>
        <a href={product.url} target="_blank" rel="noopener noreferrer" title={product.url}
          className="mt-3 inline-flex max-w-full items-center gap-1 truncate text-brand hover:underline">
          <ArrowUpRight size={14} className="flex-shrink-0" /><span className="truncate">{product.url}</span>
        </a>
      </details>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-meta uppercase text-ink-faint">{label}</dt>
      <dd className="text-ink">{value}</dd>
    </div>
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
function EaseIn3D({
  body,
  product,
  bestLabel,
}: {
  body: { chestCm: number | null; shoulderCm: number | null; estimated?: boolean };
  product: Product;
  bestLabel: string;
}) {
  const t = useT("check");
  const drawable = product.sizeOptions.filter((o) => o.chestCm != null);
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState(bestLabel);

  if (body.chestCm == null || drawable.length === 0) return null;
  const current = drawable.find((o) => o.label === label) ?? drawable[0];
  const ease = chestEaseCm(
    { chestCm: body.chestCm },
    { label: current.label, chestCm: current.chestCm, shoulderCm: current.shoulderCm },
  );

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 inline-flex min-h-[44px] items-center gap-1 text-xs font-medium text-brand underline decoration-brand/30 underline-offset-2 hover:decoration-brand sm:min-h-0"
      >
        {t("threeD.open")} <ArrowRight size={14} />
      </button>
    );
  }

  return (
    <div className="mt-4 border-t border-line pt-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <SafeBoundary
          fallback={
            <p className="text-xs text-ink-faint">{t("threeD.cantStart")}</p>
          }
        >
          <Suspense fallback={<div className="h-[220px] w-[220px] animate-pulse rounded-xl bg-paper-dim" />}>
            <BodyMesh3D
              size={220}
              measurements={{ chestCm: body.chestCm, shoulderCm: body.shoulderCm }}
              garment={{
                label: current.label,
                chestCm: current.chestCm,
                shoulderCm: current.shoulderCm,
              }}
            />
          </Suspense>
        </SafeBoundary>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-1.5">
            {drawable.map((o) => (
              <button
                key={o.label}
                type="button"
                onClick={() => setLabel(o.label)}
                className={`min-h-[34px] rounded-lg border px-2.5 text-xs font-semibold transition-colors ${
                  o.label === current.label
                    ? "border-brand bg-brand text-white"
                    : "border-line bg-paper-soft text-ink-soft hover:border-ink/30"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>

          {ease != null && (
            <p className="mt-3 text-sm text-ink">
              <span className="font-semibold tabular-nums">
                {ease > 0 ? `+${ease.toFixed(1)}` : ease.toFixed(1)} cm
              </span>{" "}
              <span className="text-ink-soft">
                {ease >= 0 ? t("threeD.room") : t("threeD.smaller")}
              </span>
            </p>
          )}

          <p className="mt-3 text-[11px] leading-relaxed text-ink-faint">
            {t.rich(
              ease != null && ease < 0 ? "threeD.shellAmber" : "threeD.shellBlue",
              { b: (c) => <strong>{c}</strong> },
              { label: current.label, shoulder: current.shoulderCm != null ? t("threeD.andShoulder") : "" },
            )}
            {body.estimated && t("threeD.estimated")}
          </p>
        </div>
      </div>
    </div>
  );
}
