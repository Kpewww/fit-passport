"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, useScroll, useTransform, useReducedMotion, type MotionValue } from "framer-motion";
import { Button, Card, LinkButton, AccuracyBadge } from "@/components/ui";
import { Avatar, PinnedSeals } from "@/components/Badges";
import { OutfitMannequin } from "@/components/OutfitMannequin";
import { GarmentCover } from "@/components/GarmentCover";
import { BadgeMedallion } from "@/components/BadgeMedallion";
import { productLabel } from "@/lib/productLabel";
import { ArrowRight, BrowserIcon, CaretRight, Check, Hanger, Ruler, Scales, Store } from "@/components/Icon";
import { EXTENSION_DISTRIBUTION } from "@/lib/extensionDistribution";
import { useT } from "@/i18n/client";
import { Headline } from "@/components/Headline";
import { AnimatedFitPassportLogo } from "@/components/AnimatedFitPassportLogo";
import { HomeIntro } from "@/components/HomeIntro";

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
  // what you get, who owns the profile, why people stay. "Three signals" came
  // back on 2026-09-30, also the founder's decision, for its scroll moment
  // (SignalsDeck).
  const returning = status !== null && !isNewUser;

  return (
    <main className="flex-1">
      {/* The first visit of a session opens on a full-screen intro that lands on the
          hero's mark (Session 90). */}
      <HomeIntro />
      <Hero url={url} setUrl={setUrl} goCheck={goCheck} reduce={!!reduce} />

      {returning && (
        <section className="mx-auto max-w-3xl px-4 pb-4 pt-16 sm:px-6">
          <ReturningUserDashboard status={status} />
        </section>
      )}

      <StickyHowItWorks />
      <WhatYouGet />
      <SignalsDeck reduce={!!reduce} />
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
  { n: "01", key: "bodies", href: "/community" },
  { n: "02", key: "taste", href: "/outfits" },
  { n: "03", key: "next", href: "/badges" },
] as const;

function CommunityValue() {
  const t = useT("home");
  return (
    <section className="border-y border-line bg-paper-soft py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="eyebrow text-ink-faint">{t("community.eyebrow")}</p>
          <h2 className="mt-4 font-serif text-5xl font-semibold leading-[1.02] tracking-tight text-ink sm:text-6xl">
            <Headline>{t.rich("community.title", { accent: (c) => <span className="font-normal italic text-brand">{c}</span> })}</Headline>
          </h2>
          <p className="mt-6 text-ink-soft">{t("community.body")}</p>
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
              <h3 className="font-serif text-2xl leading-tight text-ink">{t(`community.cards.${v.key}.title`)}</h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-soft">{t(`community.cards.${v.key}.body`)}</p>
              <Link href={v.href} className="group mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-ink">
                <span className="underline decoration-line underline-offset-4 group-hover:decoration-ink">{t(`community.cards.${v.key}.cta`)}</span>
                <ArrowRight size={16} className="transition-transform duration-200 ease-out group-hover:translate-x-0.5" />
              </Link>
            </motion.div>
          ))}
        </div>

        <p className="mt-8 max-w-xl text-xs text-ink-faint">{t("community.footnote")}</p>
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
  const t = useT("home");
  const tc = useT("common");
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
        {/* The mark, revealed as two threads on every arrival (Sessions 89–90); on a
            session's first visit it stands still and the full-screen intro lands on it.
            White on the hero's ink: the reverse of the concept's ink-on-porcelain, the
            founder's call. */}
        <span data-fp-hero-mark className="mb-8 inline-flex text-paper">
          <AnimatedFitPassportLogo variant="hero" size={80} yieldToIntro />
        </span>
        <p className="eyebrow text-paper/60 animate-rise">{t("hero.eyebrow")}</p>
        <h1 className="hero-title mx-auto mt-7 max-w-4xl font-serif text-6xl font-semibold leading-[0.95] tracking-tight animate-rise sm:text-8xl" style={{ animationDelay: "60ms" }}>
          <Headline>{t.rich("hero.title", { accent: (c) => <span className="hero-line italic font-normal text-brand">{c}</span> })}</Headline>
        </h1>
        <p className="mx-auto mt-8 max-w-lg text-base leading-relaxed text-paper/65 animate-rise sm:text-lg" style={{ animationDelay: "120ms" }}>
          {/* Three sentences became one. The headline already says what this is;
              this line only has to say what to do and what makes it different,
              and "we tell you why" is demonstrated on the next screen rather than
              promised on this one. */}
          {t("hero.lede")}
        </p>

        {/* The extension is the way in. Pasting a link used to be the hero, and
            it works on fewer stores than it looks like it should: many large
            retailers block servers from reading their pages (measured, Sessions
            70–75d), while the extension reads the page in the shopper's own
            browser. So the link box is still here, folded, and labelled for what
            it is — see docs/design/browser-extension.md. Since Session 85 the
            button goes straight to the Chrome Web Store listing. */}
        <div className="mt-10 flex flex-col items-center gap-3 animate-rise" style={{ animationDelay: "180ms" }}>
          <a
            href={EXTENSION_DISTRIBUTION.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[48px] items-center gap-2.5 rounded-full bg-paper px-7 text-sm font-medium text-ink transition-colors hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paper"
          >
            <BrowserIcon size={18} /> {t("hero.cta")}
          </a>
          <p className="text-xs text-paper/60">{t("hero.noteStore")}</p>
        </div>

        <details className="group mx-auto mt-8 max-w-xl text-left animate-rise" style={{ animationDelay: "220ms" }}>
          <summary className="mx-auto flex min-h-[44px] w-fit cursor-pointer list-none items-center gap-1.5 rounded-full px-3 text-sm text-paper/70 transition-colors hover:text-paper [&::-webkit-details-marker]:hidden">
            <CaretRight size={14} className="transition-transform group-open:rotate-90" />
            {t("hero.pasteLink")}
            <span className="ml-1 rounded-full border border-paper/25 px-2 py-px text-[10px] uppercase tracking-wider text-paper/60">{tc("beta")}</span>
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
              placeholder={t("hero.placeholder")}
              aria-label={t("hero.linkLabel")}
              /* min-w-0: without it the input refuses to shrink below its
                 placeholder's intrinsic width and pushes the button off a 360px
                 screen, where overflow-x-clip then hides it entirely. */
              className="min-w-0 flex-1 bg-transparent px-4 py-3 text-base text-paper placeholder:text-paper/40 focus:outline-none sm:py-2.5 sm:text-sm"
            />
            <button
              type="submit"
              className="flex min-h-[44px] flex-shrink-0 items-center gap-2 rounded-full bg-brand px-4 text-sm font-medium text-white transition-colors hover:bg-brand-dark sm:min-h-0 sm:px-5 sm:py-2.5"
            >
              {t("hero.submit")} <ArrowRight size={16} />
            </button>
          </form>
          <p className="mt-3 text-center text-xs leading-relaxed text-paper/60">{t("hero.pasteNote")}</p>
        </details>

      </motion.div>
    </section>
  );
}

// ---------------- Sticky "how it works": pinned text, gliding panels ----------------
const HOW_STEPS = [
  { n: "01", key: "open", tint: "bg-brand text-white", Icon: BrowserIcon },
  { n: "02", key: "weigh", tint: "bg-ink text-paper", Icon: Scales },
  { n: "03", key: "answer", tint: "bg-white text-ink ring-1 ring-line", Icon: Check },
] as const;

function StickyHowItWorks() {
  const t = useT("home");
  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 py-24">
      <div className="grid gap-10 md:grid-cols-[0.9fr,1.1fr]">
        {/* pinned side */}
        <div className="md:sticky md:top-28 md:h-fit">
          <p className="eyebrow text-ink-faint">{t("how.eyebrow")}</p>
          <h2 className="mt-4 font-serif text-4xl leading-tight text-ink sm:text-5xl"><Headline>{t.rich("how.title", {})}</Headline></h2>
          <p className="mt-5 max-w-sm text-ink-soft">{t("how.body")}</p>
          <LinkButton href="/passport" variant="secondary" arrow className="mt-6">
            {t("how.cta")}
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
                <h3 className="font-serif text-2xl">{t(`how.steps.${s.key}.title`)}</h3>
                <p className="mt-2 max-w-md text-sm opacity-80">{t(`how.steps.${s.key}.body`)}</p>
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
const GET_CARDS = [{ visual: "closet" }, { visual: "outfit" }, { visual: "badge" }] as const;

function WhatYouGet() {
  const t = useT("home");
  return (
    <section className="bg-paper py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="eyebrow text-ink-faint">{t("get.eyebrow")}</p>
        <h2 className="mt-3 font-serif text-4xl text-ink sm:text-5xl"><Headline>{t("get.title")}</Headline></h2>
      </div>
      <div className="mx-auto mt-10 max-w-6xl sm:px-6">
        <div className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-2 sm:grid sm:snap-none sm:grid-cols-3 sm:gap-6 sm:overflow-visible sm:px-0 sm:pb-0">
          {GET_CARDS.map((c) => (
            <article key={c.visual} className="w-[80vw] flex-shrink-0 snap-start overflow-hidden rounded-2xl bg-white ring-1 ring-line sm:w-auto">
              <div className="aspect-[4/3] overflow-hidden bg-paper-dim">
                <GetVisual kind={c.visual} />
              </div>
              <div className="p-6">
                <h3 className="font-serif text-2xl text-ink">{t(`get.${c.visual}.title`)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{t(`get.${c.visual}.line`)}</p>
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

// ---------------- Three signals: a deck that opens as you scroll ----------------
//
// Cut on 2026-09-28 as a repeat of How it works step 2, restored on 2026-09-30 at
// the founder's request: it is the page's one scroll-driven moment, and the page
// was flatter without it. Restored with three changes:
// - an icon per card instead of 01/02/03 — the signals are not a sequence;
// - the deck from lg up only — opened, it is 1,000 px wide, and between 640 and
//   1,000 px the old version clipped its outer cards; below lg, a plain grid;
// - the backdrop word is centred by framer (`y: "-50%"`), not by a Tailwind
//   translate, which framer's own transform silently replaced.
// Cost: one useScroll, three cards and one word on their own layers (GPU_LAYER);
// with native scrolling that is a handful of transforms per frame (performance
// memory: it was Lenis that made the old page heavy, not this section).
const SIGNALS = [
  { key: "body", Icon: Ruler },
  { key: "closet", Icon: Hanger },
  { key: "brand", Icon: Store },
] as const;

type SignalText = { key: string; Icon: (typeof SIGNALS)[number]["Icon"]; title: string; line: string };

function SignalsDeck({ reduce }: { reduce: boolean }) {
  const t = useT("home");
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  // `open` peaks while the section is centred in the viewport: gathered on the
  // way in, spread while you look at it, gathered again on the way out.
  const open = useTransform(scrollYProgress, [0.12, 0.42, 0.58, 0.88], reduce ? [1, 1, 1, 1] : [0, 1, 1, 0]);
  const wordScale = useTransform(scrollYProgress, [0, 1], reduce ? [1, 1] : [0.94, 1.08]);
  const signals: SignalText[] = SIGNALS.map((s) => ({
    ...s,
    title: t(`signals.cards.${s.key}.title`),
    line: t(`signals.cards.${s.key}.line`),
  }));

  return (
    <section ref={ref} className="relative isolate overflow-hidden border-y border-line bg-paper-soft py-24 sm:py-28">
      <motion.p
        aria-hidden="true"
        style={{ scale: wordScale, y: "-50%", ...GPU_LAYER }}
        className="pointer-events-none absolute inset-x-0 top-1/2 select-none whitespace-nowrap text-center font-serif text-[22vw] font-semibold leading-none text-ink/[0.05]"
      >
        {t("signals.backdrop")}
      </motion.p>

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
        <div className="text-center">
          <p className="eyebrow text-ink-faint">{t("signals.eyebrow")}</p>
          <h2 className="mx-auto mt-4 max-w-4xl font-serif text-5xl font-semibold leading-[1.02] tracking-tight text-ink sm:text-7xl">
            <Headline>{t.rich("signals.title", { accent: (c) => <span className="font-normal italic">{c}</span> })}</Headline>
          </h2>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-3 lg:hidden">
          {signals.map((s) => (
            <div key={s.key} className="rounded-2xl bg-white p-6 ring-1 ring-line">
              <s.Icon size={24} className="text-brand" />
              <p className="mt-4 font-serif text-xl leading-tight text-ink">{s.title}</p>
              <p className="mt-1.5 text-sm text-ink-soft">{s.line}</p>
            </div>
          ))}
        </div>

        <div className="relative mt-20 hidden h-60 lg:block">
          {signals.map((s, i) => (
            <DeckCard key={s.key} signal={s} index={i} open={open} />
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-ink-faint">{t("signals.footnote")}</p>
      </div>
    </section>
  );
}

// One card of the deck. `open` 0 → 1 goes from a near-pile with a slight fan (you
// can tell there are three) to spread side by side, level, nothing overlapping —
// fully readable exactly when the section is in view.
function DeckCard({ signal, index, open }: { signal: SignalText; index: number; open: MotionValue<number> }) {
  const x = useTransform(open, [0, 1], [[-40, 0, 40][index], [-332, 0, 332][index]]);
  const y = useTransform(open, [0, 1], [[10, 0, -10][index], [0, -18, 0][index]]);
  const rotate = useTransform(open, [0, 1], [[-6, 0, 6][index], [-2, 0, 2][index]]);
  // The outer two fade up as they come out from behind the middle one.
  const opacity = useTransform(open, [0, 0.35, 1], index === 1 ? [1, 1, 1] : [0.55, 1, 1]);
  return (
    <motion.div
      // Its own layer: it carries shadow-lift, and animating opacity on a shadowed
      // box repaints the shadow every frame otherwise.
      style={{ x, y, rotate, opacity, zIndex: index === 1 ? 3 : 1, ...GPU_LAYER }}
      className="absolute left-1/2 top-4 -ml-[10rem] w-80 rounded-2xl bg-white p-6 shadow-lift ring-1 ring-line"
    >
      <signal.Icon size={26} className="text-brand" />
      <p className="mt-4 font-serif text-2xl leading-tight text-ink">{signal.title}</p>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">{signal.line}</p>
    </motion.div>
  );
}

// ---------------- Parallax statement: layered depth ----------------
function ParallaxStatement({ reduce }: { reduce: boolean }) {
  const t = useT("home");
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
        <p className="eyebrow text-brand">{t("parallax.eyebrow")}</p>
        <h2 className="mt-4 font-serif text-4xl leading-tight sm:text-6xl"><Headline>{t.rich("parallax.title", {})}</Headline></h2>
        <p className="mx-auto mt-5 max-w-lg text-paper/60">
          {/* Was three sentences building to the same point. The idea is the
              last clause; the run-up was decoration. */}
          {t("parallax.body")}
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
  const t = useT("home");
  const [loadingDemo, setLoadingDemo] = useState(false);
  async function loadDemo() {
    setLoadingDemo(true);
    await fetch("/api/demo", { method: "POST" });
    window.location.href = "/closet";
  }
  return (
    <section className="mx-auto max-w-4xl px-4 sm:px-6 pb-40 pt-24 text-center">
      <h2 className="font-serif text-6xl font-semibold leading-[0.95] tracking-tight text-ink sm:text-[8rem]">
        <Headline>{t.rich("closing.title", { accent: (c) => <span className="font-normal italic text-brand">{c}</span> })}</Headline>
      </h2>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <LinkButton href="/passport" size="lg">{t("closing.create")}</LinkButton>
        <LinkButton href={EXTENSION_DISTRIBUTION.href} external variant="secondary" size="lg" icon={<BrowserIcon size={18} />}>{t("closing.extension")}</LinkButton>
      </div>
      {newUser && (
        <div className="mt-6">
          <Button variant="ghost" size="sm" icon={<Hanger size={16} />} loading={loadingDemo} onClick={loadDemo}>
            {t("closing.demo")}
          </Button>
        </div>
      )}
    </section>
  );
}

function ReturningUserDashboard({ status }: { status: Status }) {
  const t = useT("home");
  const tc = useT("common");
  const pctDone = status.steps.filter((s) => s.done).length / status.steps.length;
  // Step labels are translated here by their stable key; the server's English
  // label is the fallback for a step this page does not know yet.
  const KNOWN_STEPS = ["profile", "closet", "check", "outcome"] as const;
  const stepLabel = (s: Step) =>
    (KNOWN_STEPS as readonly string[]).includes(s.key)
      ? t(`dashboard.steps.${s.key as (typeof KNOWN_STEPS)[number]}`)
      : s.label;
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
              {status.username ?? t("dashboard.yourPassport")}
            </p>
            <p className="text-xs text-ink-faint">
              {status.earnedBadgeIds?.length
                ? t.n("dashboard.badgesEarned", status.earnedBadgeIds.length)
                : t("dashboard.viewPassport")}
            </p>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          {badgesToShow.length > 0 && <PinnedSeals ids={badgesToShow.slice(0, 3)} size={34} />}
          <Link href="/badges" className="inline-flex min-h-[44px] items-center gap-1 text-xs text-ink-faint hover:text-ink sm:min-h-0">{t("dashboard.badges")} <ArrowRight size={14} /></Link>
        </div>
      </Card>

      {/* Accuracy + next step */}
      <Card>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-2xl text-ink">{t("dashboard.profileTitle")}</h2>
              <AccuracyBadge tier={status.accuracy} label={tc(`accuracy.${status.accuracy}`)} />
            </div>
            <p className="mt-1 text-sm text-ink-soft">
              {status.accuracy === "high"
                ? t("dashboard.accuracyHigh")
                : status.accuracy === "medium"
                  ? t("dashboard.accuracyMedium")
                  : t("dashboard.accuracyLow")}
            </p>
          </div>
          <div className="text-right">
            <div className="font-serif text-h2 tabular-nums text-ink">{Math.round(pctDone * 100)}%</div>
            <div className="text-xs text-ink-faint">{t("dashboard.setUp")}</div>
          </div>
        </div>

        <ul className="mt-5 space-y-2">
          {status.steps.map((s) => (
            <li key={s.key} className="flex items-center justify-between rounded-xl border border-line px-4 py-2.5">
              <span className="flex items-center gap-3">
                <span className={`flex h-5 w-5 items-center justify-center rounded-full ${s.done ? "bg-ok text-white" : "bg-paper-dim text-ink-faint"}`}>
                  {s.done && <Check size={12} />}
                </span>
                <span className={s.done ? "text-ink-faint line-through" : "text-ink"}>{stepLabel(s)}</span>
              </span>
              <span className="flex items-center gap-3">
                {s.progress && !s.done && <span className="text-xs text-ink-faint">{s.progress}</span>}
                {!s.done && <LinkButton href={s.href} variant="ghost" size="sm" arrow>{t("dashboard.doIt")}</LinkButton>}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      {status.lastRecommendation && (
        <Card className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
          <div className="min-w-0">
            <p className="eyebrow text-ink-faint">{t("dashboard.lastRecommendation")}</p>
            <p className="mt-1 text-ink">
              {/* productLabel: extractors usually derive the product name from the
                  page title, which already begins with the brand — printing both
                  gave "Uniqlo Uniqlo AIRism Cotton Crew Neck T-Shirt". The brand
                  is prepended only when the name does not already carry it. */}
              {t.rich(
                "dashboard.lastLine",
                { b: (c) => <span className="font-semibold">{c}</span> },
                {
                  size: status.lastRecommendation.size,
                  product: productLabel(status.lastRecommendation.brand, status.lastRecommendation.productName),
                  pct: Math.round(status.lastRecommendation.confidence * 100),
                },
              )}
            </p>
          </div>
          <LinkButton href="/history" variant="secondary">{t("dashboard.recordFit")}</LinkButton>
        </Card>
      )}
    </div>
  );
}
