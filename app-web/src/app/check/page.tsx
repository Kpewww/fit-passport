"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Card,
  ConfidenceRing,
  LinkButton,
  Skeleton,
} from "@/components/ui";

type SizeScore = {
  label: string;
  normalized: string | null;
  score: number;
  confidence: number;
  reasons: Array<{ signal: string; weight: number; message: string }>;
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

type Source = { url: string; host: string; derived: boolean; slug?: string };

type CheckResponse = {
  product: Product;
  source: Source;
  result: {
    ranked: SizeScore[];
    best: SizeScore;
    explanation: string;
    domainNote: string | null;
    domainRelevance: "match" | "cross" | "empty";
  };
  effectiveFit: FitPref;
  recommendationId: string;
};

type Status = { hasBody: boolean; closetCount: number; accuracy: "low" | "medium" | "high" };

type FitPref = "slim" | "regular" | "relaxed" | "oversized";
const FIT_LABELS: Record<FitPref, string> = {
  slim: "Slim",
  regular: "Regular",
  relaxed: "Relaxed",
  oversized: "Oversized",
};

const DEMO_URLS = [
  { label: "Uniqlo AIRism T-Shirt", url: "https://www.uniqlo.com/us/en/products/airism-cotton-t-shirt" },
  { label: "COS Oxford Shirt", url: "https://www.cos.com/en_usd/oxford-shirt" },
  { label: "Levi's Trucker Jacket", url: "https://www.levi.com/US/en_US/clothing/men/outerwear/vintage-fit-trucker-jacket" },
  { label: "Zara Knit Sweater", url: "https://www.zara.com/us/en/wool-blend-knit-sweater-p12345.html" },
];

function CheckInner() {
  const params = useSearchParams();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CheckResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [status, setStatus] = useState<Status | null>(null);

  // The fit currently being previewed on the result. Seeded from the saved
  // profile (effectiveFit) on first load, then user can toggle live.
  const [fit, setFit] = useState<FitPref>("regular");
  const [reranking, setReranking] = useState(false);

  useEffect(() => {
    fetch("/api/status").then((r) => r.json()).then(setStatus).catch(() => {});
  }, []);

  const runCheck = useCallback(async (targetUrl: string) => {
    setErr(null);
    setLoading(true);
    setData(null);
    try {
      const r = await fetch("/api/check", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: targetUrl }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(typeof j.error === "string" ? j.error : "check failed");
      setData(j);
      setFit(j.effectiveFit as FitPref);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "check failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const incoming = params.get("url");
    if (incoming) {
      setUrl(incoming);
      runCheck(incoming);
    }
  }, [params, runCheck]);

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

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (url) runCheck(url);
  }

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <p className="eyebrow text-ink-faint">Size check</p>
        <h1 className="mt-3 font-serif text-4xl leading-tight text-ink sm:text-5xl">What size should I buy?</h1>
        <p className="mt-3 max-w-lg text-ink-soft">
          Paste a product URL. We&apos;ll read the page, extract its sizing, and recommend a
          size — with the reasons, so you can see exactly what it&apos;s based on.
        </p>

        {/* Same pill field family as the homepage hero, in the light palette. */}
        <form
          onSubmit={submit}
          className="mt-7 flex max-w-xl items-center gap-2 rounded-full border border-line bg-paper-soft p-1.5 shadow-card focus-within:border-ink/30"
        >
          <input
            type="url"
            required
            placeholder="Paste a product URL…"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 bg-transparent px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="flex-shrink-0 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper transition-transform hover:scale-[0.98] active:scale-95 disabled:opacity-50"
          >
            {loading ? "Reading…" : "Get my size →"}
          </button>
        </form>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-ink-faint">Try:</span>
          {DEMO_URLS.map((d) => (
            <button
              key={d.url}
              type="button"
              onClick={() => {
                setUrl(d.url);
                runCheck(d.url);
              }}
              className="rounded-full border border-line px-3 py-1 text-ink-soft transition-colors hover:border-ink hover:text-ink"
            >
              {d.label}
            </button>
          ))}
        </div>

        {status && status.accuracy !== "high" && !loading && (
          <AccuracyNudge status={status} />
        )}

        {err && (
          <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{err}</div>
        )}

        {loading && <LoadingResult />}
        {data && !loading && (
          <Result data={data} fit={fit} onFit={rerank} reranking={reranking} />
        )}
      </div>
    </main>
  );
}

function AccuracyNudge({ status }: { status: Status }) {
  return (
    <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
      <span className="mt-0.5 text-amber-600">★</span>
      <div className="text-amber-900">
        {status.closetCount === 0 ? (
          <>Recommendations get far sharper once we know what already fits you.{" "}
            <Link href="/closet" className="font-medium underline">Add 3 clothes you own →</Link></>
        ) : !status.hasBody ? (
          <>Add your chest measurement to unlock measurement-based sizing.{" "}
            <Link href="/passport" className="font-medium underline">Update passport →</Link></>
        ) : (
          <>Add a couple more known-good items to reach high accuracy.{" "}
            <Link href="/closet" className="font-medium underline">Add to closet →</Link></>
        )}
      </div>
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
      <Card className="flex items-center justify-between">
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
  const { product, source, result } = data;
  return (
    <section className="mt-8 space-y-5 animate-fade-in-up">
      {/* PROVENANCE — prove we read THIS page */}
      <Card>
        <div className="flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 font-medium text-green-800">
            <span className="h-1.5 w-1.5 rounded-full bg-green-600" />
            Read from {source.host || "the page"}
          </span>
          {source.derived && (
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-ink-faint">
              auto-extracted · confirm below
            </span>
          )}
        </div>
        <h2 className="mt-2 text-xl font-semibold text-ink">{product.productName}</h2>
        <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm sm:grid-cols-3">
          <Detail label="Retailer" value={product.retailer} />
          <Detail label="Brand" value={product.brand} />
          <Detail label="Category" value={product.category} />
          <Detail label="Material" value={product.material} />
          <Detail label="Sizes found" value={`${product.sizeOptions.length} options`} />
          <Detail label="Fit note" value={product.fitNotes} />
        </dl>
        <a
          href={product.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block max-w-full truncate text-xs text-brand hover:underline"
          title={product.url}
        >
          {product.url}
        </a>
      </Card>

      {/* CROSS-DOMAIN DISCLAIMER — closet evidence is a different garment type */}
      {result.domainNote && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm">
          <span className="mt-0.5 text-lg text-amber-600">⚠️</span>
          <div className="text-amber-900">
            <p className="font-semibold">Low-confidence recommendation</p>
            <p className="mt-0.5 text-amber-800">{result.domainNote}</p>
          </div>
        </div>
      )}

      {/* THE ANSWER + fit toggle */}
      <Card className="border-l-4 border-l-brand">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-brand">Recommended size</p>
            <p className={`mt-1 text-5xl font-bold text-ink transition-opacity ${reranking ? "opacity-40" : ""}`}>
              {result.best.label}
            </p>
            {result.best.normalized && result.best.normalized !== result.best.label && (
              <p className="mt-1 text-sm text-ink-faint">≈ {result.best.normalized}</p>
            )}
          </div>
          <div className="text-center">
            <ConfidenceRing value={result.best.confidence} />
            <p className="mt-1 text-xs text-ink-faint">confidence</p>
          </div>
        </div>

        {/* Fit preference toggle — default regular; preview others live */}
        <div className="mt-4">
          <p className="mb-1.5 text-xs font-medium text-ink-soft">
            Preview a different fit preference:
          </p>
          <div className="inline-flex rounded-xl border border-neutral-300 p-0.5">
            {(Object.keys(FIT_LABELS) as FitPref[]).map((f) => (
              <button
                key={f}
                onClick={() => onFit(f)}
                disabled={reranking}
                className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                  fit === f
                    ? "bg-brand text-white"
                    : "text-ink-soft hover:bg-neutral-100"
                }`}
              >
                {FIT_LABELS[f]}
              </button>
            ))}
          </div>
        </div>

        <div className={`mt-4 space-y-1.5 rounded-xl bg-brand-tint px-4 py-3 text-sm text-ink transition-opacity ${reranking ? "opacity-40" : ""}`}>
          {result.explanation.split("\n").map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <LinkButton href="/history" variant="secondary" size="md">
            I bought it — record how it fit
          </LinkButton>
          <span className="text-xs text-ink-faint">
            Recording outcomes makes your next recommendation smarter.
          </span>
        </div>
      </Card>

      {/* Ranked sizes — now interactive */}
      <Card>
        <h3 className="font-semibold text-ink">Why this size — all options ranked</h3>
        <p className="mb-3 mt-0.5 text-xs text-ink-faint">Tap a size to see the full breakdown.</p>
        <div className={`space-y-2.5 transition-opacity ${reranking ? "opacity-40" : ""}`}>
          {result.ranked.map((s, idx) => (
            <SizeRow
              key={s.label}
              score={s}
              isBest={idx === 0}
              option={product.sizeOptions.find((o) => o.label === s.label)}
            />
          ))}
        </div>
      </Card>
    </section>
  );
}

function Detail({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-widest text-ink-faint">{label}</dt>
      <dd className="text-ink">{value}</dd>
    </div>
  );
}

function SizeRow({
  score,
  isBest,
  option,
}: {
  score: SizeScore;
  isBest: boolean;
  option?: SizeOption;
}) {
  const [open, setOpen] = useState(isBest);
  return (
    <div
      className={`overflow-hidden rounded-xl border transition-colors ${
        isBest ? "border-brand/40 bg-brand-tint/40" : "border-neutral-200"
      }`}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-neutral-50/60"
      >
        <div className="flex items-center gap-2 font-medium text-ink">
          {score.label}
          {score.normalized && score.normalized !== score.label && (
            <span className="text-xs text-ink-faint">≈ {score.normalized}</span>
          )}
          {isBest && (
            <span className="rounded-full bg-brand px-2 py-0.5 text-[10px] font-semibold uppercase text-white">
              pick
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <ScoreBar score={score.score} />
          <span className={`text-ink-faint transition-transform ${open ? "rotate-180" : ""}`}>
            ⌄
          </span>
        </div>
      </button>

      {open && (
        <div className="space-y-3 border-t border-neutral-200/70 px-3 py-3 text-sm animate-fade-in-up">
          {/* Reasons */}
          <div>
            <p className="mb-1 text-[11px] uppercase tracking-widest text-ink-faint">
              What this is based on
            </p>
            {score.reasons.length > 0 ? (
              <ul className="space-y-1.5">
                {score.reasons.map((r, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span
                      className={`mt-1.5 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full ${
                        r.weight < 0 ? "bg-red-400" : "bg-brand"
                      }`}
                    />
                    <span className="text-ink-soft">
                      <span className="mr-1.5 rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-ink-faint">
                        {r.signal}
                      </span>
                      {r.message}
                      <span className={`ml-1.5 text-xs ${r.weight < 0 ? "text-red-500" : "text-green-600"}`}>
                        ({r.weight < 0 ? "" : "+"}{Math.round(r.weight * 100)})
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-ink-faint">
                No qualifying signal for this size — its score reflects the missing-data floor.
              </p>
            )}
          </div>

          {/* Garment measurements from the page */}
          {option && (
            <div>
              <p className="mb-1 text-[11px] uppercase tracking-widest text-ink-faint">
                Measurements from the page
              </p>
              <div className="flex flex-wrap gap-1.5">
                {measurementChips(option).length > 0 ? (
                  measurementChips(option).map((m) => (
                    <span key={m} className="rounded-lg bg-neutral-100 px-2 py-0.5 text-xs text-ink-soft">
                      {m}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-ink-faint">Only a size label was published.</span>
                )}
              </div>
            </div>
          )}

          {/* Score + confidence footer */}
          <div className="flex gap-6 border-t border-neutral-200/60 pt-2 text-xs text-ink-faint">
            <span>match score <b className="text-ink">{Math.round(score.score * 100)}</b>/100</span>
            <span>confidence <b className="text-ink">{Math.round(score.confidence * 100)}%</b></span>
          </div>
        </div>
      )}
    </div>
  );
}

function measurementChips(o: SizeOption): string[] {
  const chips: string[] = [];
  if (o.chestCm != null) chips.push(`chest ${o.chestCm}cm`);
  if (o.shoulderCm != null) chips.push(`shoulder ${o.shoulderCm}cm`);
  if (o.sleeveCm != null) chips.push(`sleeve ${o.sleeveCm}cm`);
  if (o.lengthCm != null) chips.push(`length ${o.lengthCm}cm`);
  if (o.bodyChestMinCm != null && o.bodyChestMaxCm != null)
    chips.push(`fits body chest ${o.bodyChestMinCm}–${o.bodyChestMaxCm}cm`);
  return chips;
}

function ScoreBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-neutral-200">
        <div
          className="h-full rounded-full bg-brand transition-all"
          style={{ width: `${Math.round(score * 100)}%` }}
        />
      </div>
      <span className="w-7 text-right text-xs text-ink-faint">{Math.round(score * 100)}</span>
    </div>
  );
}

export default function CheckPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-3xl px-6 py-10">Loading…</div>}>
      <CheckInner />
    </Suspense>
  );
}
