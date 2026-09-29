"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { Button, Card, LinkButton, AccuracyBadge } from "@/components/ui";
import { Avatar, PinnedSeals } from "@/components/Badges";
import { OutfitMannequin } from "@/components/OutfitMannequin";
import { GarmentCover } from "@/components/GarmentCover";
import { BadgeMedallion } from "@/components/BadgeMedallion";
import { productLabel } from "@/lib/productLabel";
import { ArrowRight, BrowserIcon, CaretRight, Check, Hanger, Scales } from "@/components/Icon";
import { EXTENSION_DISTRIBUTION } from "@/lib/extensionDistribution";

type Step = {
  key: string;
  label: string;
  done: boolean;
  progress?: string;
  href: string;
};

type Status = {
  profileExists: boolean;
  profileStated: boolean;
  hasBody: boolean;
  hasChest: boolean;
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
  username?: string | null;
  claimed?: boolean;
  avatarDataUrl?: string | null;
  earnedBadgeIds?: string[];
  pinnedBadges?: string[];
};

// Scroll-linked elements MUST be promoted to their own compositor layer.
//
// Without this the browser re-rasterises on every frame, and the cost scales with
// the painted area — which is brutal here, because the decorative words are
// `text-[22vw]` and `text-[38vw]` (≈317px and ≈547px on a 1440px viewport). Two of
// those sections are adjacent, so at the boundary between "Everything you know
// about your fit." and "You keep the profile." BOTH giant layers are on screen and
// repainting together. That is exactly where the jank was reported.
//
// `will-change: transform` alone is enough to promote the layer in every current
// browser, and it must be ALONE here: these are framer-motion elements, which
// compose `transform` themselves from x/y/rotate/scale. Adding the legacy
// `translateZ(0)` string would fight framer for the same CSS property.
//
// Applied only to elements that are actually scroll-driven — promoting everything
// wastes GPU memory and can end up slower than not promoting at all.
const GPU_LAYER = { willChange: "transform" } as const;

export default function Home() {
  const router = useRouter();
  const [status, setStatus] = useState<Status | null>(null);
  const [url, setUrl] = useState("");
  const reduce = useReducedMotion();

  useEffect(() => {
    fetch("/api/status")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => setStatus(null));
  }, []);

  // Lenis smooth-scroll was REMOVED here (2026-08-25) because it was the amplifier
  // for every other scroll cost on this page, not a cost of its own.
  //
  // Native scrolling is handled on the compositor thread. Lenis replaces it with a
  // main-thread rAF loop that runs every frame, and each synthetic scroll position
  // fires a scroll event that makes all four `useScroll` sections re-measure their
  // element positions — roughly sixteen scroll-linked transforms recomputed and
  // written per frame. With `lerp: 0.1` the scroll also keeps settling for ~20 more
  // frames after the wheel stops, so that work continued after the input ended.
  //
  // Removing it puts scrolling back on the compositor. The parallax and reveal
  // effects are untouched; only the inertia easing is gone. (Precedent: Session 27
  // removed pinned scroll-jacking from this page for feeling heavy — same family of
  // complaint, same answer.)

  function goCheck(e: React.FormEvent) {
    e.preventDefault();
    if (!url) return;
    router.push(`/check?url=${encodeURIComponent(url)}`);
  }

  const isNewUser =
    status != null && !status.hasBody && status.closetCount === 0 && status.productCount === 0;

  // Someone who has already given us data is not here to be convinced. Measured
  // before this change: the dashboard sat at screen 5.6 of 10 on a phone, behind
  // four consecutive pitch sections that restate the same proposition — read any
  // store's page, weigh it against your closet, explain the answer. A returning
  // user scrolled 4.5 screens of argument to reach their own status.
  //
  // So the order is by INTENT, not by narrative: your state first, the pitch
  // after it for anyone who wants it.
  //
  // The pitch itself was cut from five sets of "three things" to three
  // (2026-09-28, founder's decision): "Three signals" restated How it works step
  // 2, and "Get started" restated How it works; its demo-closet action moved
  // into the closing CTA. What is left says each thing once — how it works,
  // what you get, who owns the profile, why people stay.
  const returning = status !== null && !isNewUser;

  return (
    <main className="flex-1">
      <Hero url={url} setUrl={setUrl} goCheck={goCheck} reduce={!!reduce} />

      {returning && (
        <section className="mx-auto max-w-3xl px-4 pb-4 pt-16 sm:px-6">
          <ReturningUserDashboard status={status} />
        </section>
      )}

      <StickyHowItWorks />
      <WhatYouGet />
      <ParallaxStatement reduce={!!reduce} />
      <CommunityValue />
      <ClosingCTA newUser={isNewUser} />
    </main>
  );
}

// ---------------- What the community adds ----------------
//
// The engine is the core, but the reason to STAY is social: seeing how clothes
// fit real bodies like yours, and learning what to buy from people whose taste
// you trust. Spelled out plainly, because it isn't obvious from the sizing tool.
const COMMUNITY_VALUE = [
  {
    n: "01",
    title: "Fit intelligence from real bodies",
    body:
      "See which brands and sizes actually worked for people built like you — not a model in a studio.",
    href: "/community",
    cta: "Browse the directory",
  },
  {
    n: "02",
    title: "Share your taste, build a reputation",
    body:
      "Post outfits from your own closet and earn struck-metal badges as your archive grows.",
    href: "/outfits",
    cta: "Compose a look",
  },
  {
    n: "03",
    title: "Learn what to buy next",
    body:
      "Every look shows its pieces and sizes — so one you like is one you can actually find and fit.",
    href: "/badges",
    cta: "See the badge ladder",
  },
];

function CommunityValue() {
  return (
    <section className="border-y border-line bg-paper-soft py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="eyebrow text-ink-faint">More than a size calculator</p>
          <h2 className="mt-4 font-serif text-5xl font-semibold leading-[1.02] tracking-tight text-ink sm:text-6xl">
            A community that
            <br />
            <span className="font-normal italic text-brand">dresses better together.</span>
          </h2>
          <p className="mt-6 text-ink-soft">
            Sizing is the tool. The reason people stay is each other — seeing what
            fits real bodies, sharing taste, and getting better at buying clothes.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-3">
          {COMMUNITY_VALUE.map((v) => (
            <motion.div
              key={v.n}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col rounded-2xl bg-white p-7 ring-1 ring-line"
            >
              <h3 className="font-serif text-2xl leading-tight text-ink">{v.title}</h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-soft">{v.body}</p>
              <Link href={v.href} className="group mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-ink">
                <span className="underline decoration-line underline-offset-4 group-hover:decoration-ink">{v.cta}</span>
                <ArrowRight size={16} className="transition-transform duration-200 ease-out group-hover:translate-x-0.5" />
              </Link>
            </motion.div>
          ))}
        </div>

        <p className="mt-8 max-w-xl text-xs text-ink-faint">
          Everything social is opt-in: you choose to be listed, and precise
          measurements are never shared — only coarse, useful signals.
        </p>
      </div>
    </section>
  );
}

// ---------------- Hero: black statement panel with a subtle parallax ----------------
function Hero({
  url,
  setUrl,
  goCheck,
  reduce,
}: {
  url: string;
  setUrl: (v: string) => void;
  goCheck: (e: React.FormEvent) => void;
  reduce: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -90]);
  const opacity = useTransform(scrollYProgress, [0, 0.85], [1, reduce ? 1 : 0]);

  return (
    <section ref={ref} className="bg-ink text-paper">
      <motion.div
        style={{ y, opacity, ...GPU_LAYER }}
        className="mx-auto max-w-5xl px-4 pb-20 pt-20 text-center sm:px-6 sm:pb-28 sm:pt-28"
      >
        <p className="eyebrow text-paper/60 animate-rise">One body · one fit identity · any store</p>
        <h1 className="mx-auto mt-7 max-w-4xl font-serif text-6xl font-semibold leading-[0.95] tracking-tight animate-rise sm:text-8xl" style={{ animationDelay: "60ms" }}>
          Know what fits,
          <br />
          <span className="italic font-normal text-brand">anywhere.</span>
        </h1>
        <p className="mx-auto mt-8 max-w-lg text-base leading-relaxed text-paper/65 animate-rise sm:text-lg" style={{ animationDelay: "120ms" }}>
          {/* Three sentences became one. The headline already says what this is;
              this line only has to say what to do and what makes it different,
              and "we tell you why" is demonstrated on the next screen rather than
              promised on this one. */}
          Check your size on any product page. We weigh it against the clothes
          you already own — and show our working.
        </p>

        {/* The extension is the way in. Pasting a link used to be the hero, and
            it works on fewer stores than it looks like it should: many large
            retailers block servers from reading their pages (measured, Sessions
            70–75d), while the extension reads the page in the shopper's own
            browser. So the link box is still here, folded, and labelled for what
            it is — see docs/design/browser-extension.md. */}
        <div className="mt-10 flex flex-col items-center gap-3 animate-rise" style={{ animationDelay: "180ms" }}>
          <Link
            href="/extension"
            className="inline-flex min-h-[48px] items-center gap-2.5 rounded-full bg-paper px-7 text-sm font-medium text-ink transition-colors hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paper"
          >
            <BrowserIcon size={18} /> Add Fit Passport to Chrome
          </Link>
          <p className="text-xs text-paper/60">
            Free · {EXTENSION_DISTRIBUTION.kind === "zip" ? `${EXTENSION_DISTRIBUTION.sizeKb} KB · ` : ""}reads only the page you click it on
          </p>
        </div>

        <details className="group mx-auto mt-8 max-w-xl text-left animate-rise" style={{ animationDelay: "220ms" }}>
          <summary className="mx-auto flex min-h-[44px] w-fit cursor-pointer list-none items-center gap-1.5 rounded-full px-3 text-sm text-paper/70 transition-colors hover:text-paper [&::-webkit-details-marker]:hidden">
            <CaretRight size={14} className="transition-transform group-open:rotate-90" />
            Or paste a product link
            <span className="ml-1 rounded-full border border-paper/25 px-2 py-px text-[10px] uppercase tracking-wider text-paper/60">Beta</span>
          </summary>
          <form
            onSubmit={goCheck}
            className="mt-3 flex items-center gap-2 rounded-full border border-paper/15 bg-paper/10 p-1.5 backdrop-blur focus-within:border-paper/40"
          >
            <input
              type="text"
              inputMode="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste a product URL…"
              aria-label="Product link"
              /* min-w-0: without it the input refuses to shrink below its
                 placeholder's intrinsic width and pushes the button off a 360px
                 screen, where overflow-x-clip then hides it entirely. */
              className="min-w-0 flex-1 bg-transparent px-4 py-3 text-base text-paper placeholder:text-paper/40 focus:outline-none sm:py-2.5 sm:text-sm"
            />
            <button
              type="submit"
              className="flex min-h-[44px] flex-shrink-0 items-center gap-2 rounded-full bg-brand px-4 text-sm font-medium text-white transition-colors hover:bg-brand-dark sm:min-h-0 sm:px-5 sm:py-2.5"
            >
              Get my size <ArrowRight size={16} />
            </button>
          </form>
          <p className="mt-3 text-center text-xs leading-relaxed text-paper/60">
            Works on some stores. Many large ones block our servers from reading their pages —
            the extension reads the page in your own browser instead.
          </p>
        </details>

      </motion.div>
    </section>
  );
}

// ---------------- Sticky "how it works": pinned text, gliding panels ----------------
const HOW_STEPS = [
  {
    n: "01",
    title: "Open a product page",
    body: "Click Fit Passport on any store's product page. It reads the brand, the garment and the size chart from the page you're looking at.",
    tint: "bg-brand text-white",
    Icon: BrowserIcon,
  },
  {
    n: "02",
    title: "We weigh it against you",
    body: "Your measurements, your preferred fit, and the clothes you already own and love — all considered.",
    tint: "bg-ink text-paper",
    Icon: Scales,
  },
  {
    n: "03",
    title: "A size, and the reason",
    body: "Not a guess. Every recommendation shows its work, so you can trust it — or overrule it.",
    tint: "bg-white text-ink ring-1 ring-line",
    Icon: Check,
  },
];

function StickyHowItWorks() {
  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 py-24">
      <div className="grid gap-10 md:grid-cols-[0.9fr,1.1fr]">
        {/* pinned side */}
        <div className="md:sticky md:top-28 md:h-fit">
          <p className="eyebrow text-ink-faint">The idea</p>
          <h2 className="mt-4 font-serif text-4xl leading-tight text-ink sm:text-5xl">
            Your fit,
            <br />
            carried between stores.
          </h2>
          <p className="mt-5 max-w-sm text-ink-soft">
            Sizes never agree across brands. Fit Passport holds one portable profile
            and translates it anywhere you shop — no retailer integration, no guessing.
          </p>
          <LinkButton href="/passport" variant="secondary" arrow className="mt-6">
            Build your passport
          </LinkButton>
        </div>

        {/* gliding step panels */}
        <div className="space-y-6">
          {HOW_STEPS.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 48 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-12%" }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: i * 0.04 }}
              className={`flex min-h-[240px] flex-col justify-between rounded-3xl p-8 ${s.tint}`}
            >
              <div className="flex items-start justify-between">
                <span className="font-serif text-5xl italic opacity-70">{s.n}</span>
                <s.Icon size={32} className="opacity-80" />
              </div>
              <div>
                <h3 className="font-serif text-2xl">{s.title}</h3>
                <p className="mt-2 max-w-md text-sm opacity-80">{s.body}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------- What you get: three things the product makes ----------------
//
// This was a drag-to-scroll "lookbook". With three cards it had nothing to
// scroll: 3 × 380px is narrower than any desktop, so the arrows and the drag did
// nothing, and the row was full-bleed while its heading sat in the centred
// container — on a wide screen the cards started at the window's edge, 400px
// left of their own title (founder's report, 2026-09-28). Three cards are a
// grid. On a phone they stay a native swipe row, aligned to the same gutter.
//
// Each card shows the real thing rather than a decoration: a closet card drawn
// by the same component the closet uses, the outfit mannequin, and a badge.
const GET_CARDS = [
  {
    title: "Your closet, learned",
    line: "Clothes you love become anchors — we learn how each brand runs on you.",
    visual: "closet",
  },
  {
    title: "Compose the look",
    line: "Build outfits on a mannequin shaped like you, then share them.",
    visual: "outfit",
  },
  {
    title: "Earn your taste",
    line: "Struck-metal badges for a curated closet and admired looks.",
    visual: "badge",
  },
] as const;

function WhatYouGet() {
  return (
    <section className="bg-paper py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="eyebrow text-ink-faint">What you get</p>
        <h2 className="mt-3 font-serif text-4xl text-ink sm:text-5xl">A wardrobe that travels.</h2>
      </div>
      <div className="mx-auto mt-10 max-w-6xl sm:px-6">
        <div className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-2 sm:grid sm:snap-none sm:grid-cols-3 sm:gap-6 sm:overflow-visible sm:px-0 sm:pb-0">
          {GET_CARDS.map((c) => (
            <article key={c.title} className="w-[80vw] flex-shrink-0 snap-start overflow-hidden rounded-2xl bg-white ring-1 ring-line sm:w-auto">
              <div className="aspect-[4/3] overflow-hidden bg-paper-dim">
                <GetVisual kind={c.visual} />
              </div>
              <div className="p-6">
                <h3 className="font-serif text-2xl text-ink">{c.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{c.line}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function GetVisual({ kind }: { kind: (typeof GET_CARDS)[number]["visual"] }) {
  if (kind === "closet") {
    // Two gallery tiles, drawn by the closet's own cover component.
    const tiles = [
      { brand: "Uniqlo", size: "M", category: "tshirt", color: "navy" },
      { brand: "COS", size: "EU 48", category: "shirt", color: "white" },
    ];
    return (
      <div className="flex h-full items-center justify-center gap-3 px-6">
        {tiles.map((t) => (
          <div key={t.brand} className="w-[38%] min-w-0">
            <div className="aspect-[4/5] overflow-hidden rounded-lg ring-1 ring-line/70">
              <GarmentCover category={t.category} color={t.color} iconSize={36} />
            </div>
            <div className="mt-2 flex items-baseline justify-between gap-2 text-[11px]">
              <span className="truncate font-medium text-ink">{t.brand}</span>
              <span className="tabular-nums text-ink-soft">{t.size}</span>
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (kind === "outfit") {
    return (
      <div className="flex h-full items-center justify-center">
        <OutfitMannequin layers={[{ category: "sweater", color: "burgundy" }, { category: "jeans", color: "denim" }, { category: "sneakers", color: "white" }]} volume={"lean" as never} shape={"straight" as never} size={150} />
      </div>
    );
  }
  return (
    <div className="flex h-full items-center justify-center gap-4 bg-ink">
      <BadgeMedallion id="curator" metal="silver" size={72} />
      <BadgeMedallion id="archivist" metal="gold" size={104} />
      <BadgeMedallion id="calibrated" metal="silver" size={72} />
    </div>
  );
}

// ---------------- Parallax statement: layered depth ----------------
function ParallaxStatement({ reduce }: { reduce: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["-18%", "18%"]);
  const fgY = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["12%", "-12%"]);

  return (
    <section ref={ref} className="relative flex h-[70vh] items-center justify-center overflow-hidden bg-ink text-paper">
      {/* slow background layer */}
      <motion.span
        style={{ y: bgY, ...GPU_LAYER }}
        className="pointer-events-none absolute select-none font-serif text-[38vw] font-semibold leading-none text-paper/[0.05]"
      >
        FIT
      </motion.span>
      {/* faster foreground statement */}
      <motion.div style={{ y: fgY, ...GPU_LAYER }} className="relative mx-auto max-w-3xl px-4 sm:px-6 text-center">
        <p className="eyebrow text-brand">Consumer-owned</p>
        <h2 className="mt-4 font-serif text-4xl leading-tight sm:text-6xl">
          You keep the profile.
          <br />
          It works at every store.
        </h2>
        <p className="mx-auto mt-5 max-w-lg text-paper/60">
          {/* Was three sentences building to the same point. The idea is the
              last clause; the run-up was decoration. */}
          Fit was never a picture problem. It&rsquo;s a memory problem — and the
          memory is already hanging in your closet.
        </p>
      </motion.div>
    </section>
  );
}

// ---------------- Closing CTA ----------------
function ClosingCTA({ newUser }: { newUser: boolean }) {
  // The demo closet moved here from the "Get started" section it shared a
  // message with (cut 2026-09-28). /api/demo replaces the closet and the body
  // profile, so it is offered only to someone who has neither.
  const [loadingDemo, setLoadingDemo] = useState(false);
  async function loadDemo() {
    setLoadingDemo(true);
    await fetch("/api/demo", { method: "POST" });
    window.location.href = "/closet";
  }
  return (
    <section className="mx-auto max-w-4xl px-4 sm:px-6 pb-40 pt-24 text-center">
      <h2 className="font-serif text-6xl font-semibold leading-[0.95] tracking-tight text-ink sm:text-[8rem]">
        Start your
        <br />
        <span className="font-normal italic text-brand">fit passport.</span>
      </h2>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <LinkButton href="/passport" size="lg">Create your passport</LinkButton>
        <LinkButton href="/extension" variant="secondary" size="lg" icon={<BrowserIcon size={18} />}>Get the extension</LinkButton>
      </div>
      {newUser && (
        <div className="mt-6">
          <Button variant="ghost" size="sm" icon={<Hanger size={16} />} loading={loadingDemo} onClick={loadDemo}>
            Just exploring? Try a demo closet
          </Button>
        </div>
      )}
    </section>
  );
}

function ReturningUserDashboard({ status }: { status: Status }) {
  const pctDone = status.steps.filter((s) => s.done).length / status.steps.length;
  const initials = (status.username ?? "you").slice(0, 2).toUpperCase();
  const badgesToShow = (status.pinnedBadges?.length ? status.pinnedBadges : status.earnedBadgeIds) ?? [];
  return (
    <div className="space-y-5">
      {/* Identity strip */}
      <Card className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <Link href="/passport" className="group flex items-center gap-3">
          <Avatar src={status.avatarDataUrl} initials={initials} size={48} />
          <div>
            <p className="font-semibold text-ink group-hover:text-brand">
              {status.username ?? "Your passport"}
            </p>
            <p className="text-xs text-ink-faint">
              {status.earnedBadgeIds?.length
                ? `${status.earnedBadgeIds.length} badge${status.earnedBadgeIds.length === 1 ? "" : "s"} earned`
                : "View your fit passport"}
            </p>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          {badgesToShow.length > 0 && <PinnedSeals ids={badgesToShow.slice(0, 3)} size={34} />}
          <Link href="/badges" className="inline-flex min-h-[44px] items-center gap-1 text-xs text-ink-faint hover:text-ink sm:min-h-0">Badges <ArrowRight size={14} /></Link>
        </div>
      </Card>

      {/* Accuracy + next step */}
      <Card>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-2xl text-ink">Your fit profile</h2>
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
            <div className="font-serif text-h2 tabular-nums text-ink">{Math.round(pctDone * 100)}%</div>
            <div className="text-xs text-ink-faint">set up</div>
          </div>
        </div>

        <ul className="mt-5 space-y-2">
          {status.steps.map((s) => (
            <li key={s.key} className="flex items-center justify-between rounded-xl border border-line px-4 py-2.5">
              <span className="flex items-center gap-3">
                <span className={`flex h-5 w-5 items-center justify-center rounded-full ${s.done ? "bg-ok text-white" : "bg-paper-dim text-ink-faint"}`}>
                  {s.done && <Check size={12} />}
                </span>
                <span className={s.done ? "text-ink-faint line-through" : "text-ink"}>{s.label}</span>
              </span>
              <span className="flex items-center gap-3">
                {s.progress && !s.done && <span className="text-xs text-ink-faint">{s.progress}</span>}
                {!s.done && <LinkButton href={s.href} variant="ghost" size="sm" arrow>Do it</LinkButton>}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      {status.lastRecommendation && (
        <Card className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
          <div>
            <p className="eyebrow text-ink-faint">Last recommendation</p>
            <p className="mt-1 text-ink">
              <span className="font-semibold">{status.lastRecommendation.size}</span> for{" "}
              {/* Extractors usually derive the product name from the page title,
                  which already begins with the brand — printing both gave
                  "Uniqlo Uniqlo AIRism Cotton Crew Neck T-Shirt". Prepend the
                  brand only when the name does not already carry it. */}
              {productLabel(status.lastRecommendation.brand, status.lastRecommendation.productName)} ·{" "}
              {Math.round(status.lastRecommendation.confidence * 100)}% confidence
            </p>
          </div>
          <LinkButton href="/history" variant="secondary">Record fit</LinkButton>
        </Card>
      )}
    </div>
  );
}
