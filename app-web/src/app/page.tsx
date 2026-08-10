"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, LinkButton, Button, AccuracyBadge, Skeleton } from "@/components/ui";

type Step = {
  key: string;
  label: string;
  done: boolean;
  progress?: string;
  href: string;
};

type Status = {
  profileExists: boolean;
  hasBody: boolean;
  preferredFit: string | null;
  closetCount: number;
  productCount: number;
  outcomeCount: number;
  accuracy: "low" | "medium" | "high";
  steps: Step[];
  nextStep: Step | null;
  lastRecommendation: {
    size: string;
    confidence: number;
    productName: string | null;
    brand: string | null;
  } | null;
};

export default function Home() {
  const router = useRouter();
  const [status, setStatus] = useState<Status | null>(null);
  const [url, setUrl] = useState("");

  useEffect(() => {
    fetch("/api/status")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => setStatus(null));
  }, []);

  function goCheck(e: React.FormEvent) {
    e.preventDefault();
    if (!url) return;
    // Hand the URL to the check page via query so the value-first flow continues.
    router.push(`/check?url=${encodeURIComponent(url)}`);
  }

  const isNewUser =
    status != null && !status.hasBody && status.closetCount === 0 && status.productCount === 0;

  return (
    <main className="flex-1">
      {/* HERO — the one thing a visitor wants: "what size should I buy?" */}
      <section className="mx-auto max-w-3xl px-6 pt-14 pb-8 text-center animate-fade-in-up">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-brand">
          One body · one fit identity · any store
        </p>
        <h1 className="mt-3 text-4xl font-bold leading-tight text-ink sm:text-5xl">
          What size should I buy?
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-ink-soft">
          Paste any product link. We&apos;ll compare it to your fit profile and the
          clothes you already love, then tell you the size — and&nbsp;why.
        </p>

        <form onSubmit={goCheck} className="mx-auto mt-8 flex max-w-xl flex-col gap-2 sm:flex-row">
          <input
            type="url"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste a product URL…"
            className="flex-1 rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm shadow-card focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
          <Button type="submit" size="lg">
            Get my size →
          </Button>
        </form>
        <p className="mt-3 text-xs text-ink-faint">
          No account needed. Try a demo product on the next screen.
        </p>
      </section>

      {/* GUIDED STATE */}
      <section className="mx-auto max-w-3xl px-6 pb-20">
        {status === null ? (
          <Card className="space-y-3">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </Card>
        ) : isNewUser ? (
          <NewUserGuide />
        ) : (
          <ReturningUserDashboard status={status} />
        )}
      </section>
    </main>
  );
}

function NewUserGuide() {
  const [loadingDemo, setLoadingDemo] = useState(false);
  async function loadDemo() {
    setLoadingDemo(true);
    await fetch("/api/demo", { method: "POST" });
    // Full reload so the dashboard re-fetches populated status.
    window.location.href = "/closet";
  }
  const steps = [
    {
      n: "1",
      title: "Paste a product",
      body: "Start with the box above — even before you fill anything out, you get a recommendation.",
    },
    {
      n: "2",
      title: "Add a few clothes you own",
      body: "Tell us 3 items that fit you well. This is what makes the size scarily accurate.",
    },
    {
      n: "3",
      title: "Shop with confidence",
      body: "Every recommendation explains itself. Record how it fit, and it keeps improving.",
    },
  ];
  return (
    <div className="animate-fade-in-up">
      <div className="grid gap-4 sm:grid-cols-3">
        {steps.map((s) => (
          <Card key={s.n} className="flex flex-col">
            <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-brand-light text-sm font-semibold text-brand">
              {s.n}
            </div>
            <h3 className="font-semibold text-ink">{s.title}</h3>
            <p className="mt-1 text-sm text-ink-soft">{s.body}</p>
          </Card>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <LinkButton href="/onboarding" variant="secondary">
          Set up my passport first
        </LinkButton>
        <LinkButton href="/check">Or just check a product →</LinkButton>
      </div>
      <div className="mt-4 text-center">
        <button
          onClick={loadDemo}
          disabled={loadingDemo}
          className="text-xs text-ink-faint underline hover:text-brand disabled:opacity-50"
        >
          {loadingDemo ? "Loading demo…" : "Just exploring? Load demo data →"}
        </button>
      </div>
    </div>
  );
}

function ReturningUserDashboard({ status }: { status: Status }) {
  const pctDone = status.steps.filter((s) => s.done).length / status.steps.length;
  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Accuracy + next step */}
      <Card>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-ink">Your fit profile</h2>
              <AccuracyBadge tier={status.accuracy} />
            </div>
            <p className="mt-1 text-sm text-ink-soft">
              {status.accuracy === "high"
                ? "You've given the engine strong signals — recommendations should be sharp."
                : status.accuracy === "medium"
                  ? "Good start. Add more known-good items to raise accuracy."
                  : "Add your fit preference and a few clothes to unlock accurate sizing."}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-brand">
              {Math.round(pctDone * 100)}%
            </div>
            <div className="text-xs text-ink-faint">set up</div>
          </div>
        </div>

        {/* Progress checklist */}
        <ul className="mt-5 space-y-2">
          {status.steps.map((s) => (
            <li
              key={s.key}
              className="flex items-center justify-between rounded-xl border border-neutral-200 px-4 py-2.5"
            >
              <span className="flex items-center gap-3">
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${
                    s.done ? "bg-green-600 text-white" : "bg-neutral-200 text-neutral-500"
                  }`}
                >
                  {s.done ? "✓" : ""}
                </span>
                <span className={s.done ? "text-ink-faint line-through" : "text-ink"}>
                  {s.label}
                </span>
              </span>
              <span className="flex items-center gap-3">
                {s.progress && !s.done && (
                  <span className="text-xs text-ink-faint">{s.progress}</span>
                )}
                {!s.done && (
                  <LinkButton href={s.href} variant="ghost" size="md">
                    Do it →
                  </LinkButton>
                )}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      {/* Last recommendation recap */}
      {status.lastRecommendation && (
        <Card className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-ink-faint">
              Last recommendation
            </p>
            <p className="mt-1 text-ink">
              <span className="font-semibold">{status.lastRecommendation.size}</span> for{" "}
              {status.lastRecommendation.brand} {status.lastRecommendation.productName} ·{" "}
              {Math.round(status.lastRecommendation.confidence * 100)}% confidence
            </p>
          </div>
          <LinkButton href="/history" variant="secondary">
            Record fit
          </LinkButton>
        </Card>
      )}
    </div>
  );
}
