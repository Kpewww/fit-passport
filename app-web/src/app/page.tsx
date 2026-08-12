"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Lenis from "lenis";
import { motion, useScroll, useTransform, useReducedMotion, type MotionValue } from "framer-motion";
import { Card, LinkButton, AccuracyBadge, Skeleton } from "@/components/ui";
import { Avatar, PinnedSeals } from "@/components/Badges";
import { OutfitMannequin } from "@/components/OutfitMannequin";

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
  username?: string | null;
  claimed?: boolean;
  avatarDataUrl?: string | null;
  earnedBadgeIds?: string[];
  pinnedBadges?: string[];
};

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

  // Smooth inertia scroll — homepage only, and never when reduced motion is asked.
  useEffect(() => {
    if (reduce) return;
    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    let raf = 0;
    const loop = (t: number) => {
      lenis.raf(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, [reduce]);

  function goCheck(e: React.FormEvent) {
    e.preventDefault();
    if (!url) return;
    router.push(`/check?url=${encodeURIComponent(url)}`);
  }

  const isNewUser =
    status != null && !status.hasBody && status.closetCount === 0 && status.productCount === 0;

  return (
    <main className="flex-1">
      <Hero url={url} setUrl={setUrl} goCheck={goCheck} reduce={!!reduce} />
      <StickyHowItWorks />
      <HorizontalShowcase reduce={!!reduce} />
      <ConvergingStack reduce={!!reduce} />
      <ParallaxStatement reduce={!!reduce} />

      {/* Value-first content preserved: returning users get their dashboard,
          new users get the guided start. */}
      <section className="mx-auto max-w-3xl px-6 pb-24 pt-16">
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

      <ClosingCTA />
    </main>
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
        style={{ y, opacity }}
        className="mx-auto max-w-5xl px-6 pt-20 pb-16 text-center sm:pt-28 sm:pb-24"
      >
        <p className="eyebrow text-paper/45 animate-rise">One body · one fit identity · any store</p>
        <h1 className="mx-auto mt-7 max-w-4xl font-serif text-6xl font-semibold leading-[0.95] tracking-tight animate-rise sm:text-8xl" style={{ animationDelay: "60ms" }}>
          Know what fits,
          <br />
          <span className="italic font-normal text-brand">anywhere.</span>
        </h1>
        <p className="mx-auto mt-8 max-w-lg text-base leading-relaxed text-paper/65 animate-rise sm:text-lg" style={{ animationDelay: "120ms" }}>
          Paste any product link. We read its sizing, weigh it against the clothes
          you already love, and tell you the size — and&nbsp;why.
        </p>

        <form
          onSubmit={goCheck}
          className="mx-auto mt-10 flex max-w-xl items-center gap-2 rounded-full border border-paper/15 bg-paper/10 p-1.5 backdrop-blur animate-rise focus-within:border-paper/40"
          style={{ animationDelay: "180ms" }}
        >
          <input
            type="url"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste a product URL…"
            className="flex-1 bg-transparent px-4 py-2.5 text-sm text-paper placeholder:text-paper/40 focus:outline-none"
          />
          <button
            type="submit"
            className="flex-shrink-0 rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-white transition-transform hover:scale-[0.98] active:scale-95"
          >
            Get my size →
          </button>
        </form>
        <p className="mt-4 text-xs text-paper/40 animate-rise" style={{ animationDelay: "220ms" }}>
          No account needed. Try a demo product on the next screen.
        </p>

        {!reduce && (
          <div className="mt-16 flex flex-col items-center gap-2 text-paper/40">
            <span className="text-[10px] uppercase tracking-[0.24em]">Scroll</span>
            <motion.span
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
              className="text-lg"
            >
              ↓
            </motion.span>
          </div>
        )}
      </motion.div>
    </section>
  );
}

// ---------------- Sticky "how it works": pinned text, gliding panels ----------------
const HOW_STEPS = [
  {
    n: "01",
    title: "Paste a product",
    body: "Any store, any link. We read the brand, garment type, and size chart straight from the page.",
    tint: "bg-brand text-white",
    glyph: "🔗",
  },
  {
    n: "02",
    title: "We weigh it against you",
    body: "Your measurements, your preferred fit, and the clothes you already own and love — all considered.",
    tint: "bg-ink text-paper",
    glyph: "⚖",
  },
  {
    n: "03",
    title: "A size, and the reason",
    body: "Not a guess. Every recommendation shows its work, so you can trust it — or overrule it.",
    tint: "bg-paper-dim text-ink",
    glyph: "✓",
  },
];

function StickyHowItWorks() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
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
          <LinkButton href="/passport" variant="secondary" className="mt-6">
            Build your passport →
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
              className={`flex min-h-[240px] flex-col justify-between rounded-3xl p-8 shadow-card ${s.tint}`}
            >
              <div className="flex items-start justify-between">
                <span className="font-serif text-5xl italic opacity-70">{s.n}</span>
                <span className="text-3xl opacity-80">{s.glyph}</span>
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

// ---------------- Horizontal scroll showcase (a lookbook you scroll sideways) ------
type ShowCard = { n: string; title: string; line: string; render: () => React.ReactNode };

const SHOW_CARDS: ShowCard[] = [
  {
    n: "01",
    title: "Any store",
    line: "Paste a link from anywhere. No retailer integration needed.",
    render: () => <ColorField className="from-brand to-brand-dark" label="LINK →" />,
  },
  {
    n: "02",
    title: "Explained, not guessed",
    line: "A transparent engine that shows every reason behind a size.",
    render: () => <ColorField className="from-ink to-neutral-700" label="WHY" light />,
  },
  {
    n: "03",
    title: "Your closet, learned",
    line: "Anchors from clothes you love; we learn how each brand runs on you.",
    render: () => (
      <div className="flex h-full items-center justify-center bg-paper-dim">
        <OutfitMannequin layers={[{ category: "jacket", color: "navy" }, { category: "pants", color: "charcoal" }]} volume={"average" as never} shape={"straight" as never} size={150} />
      </div>
    ),
  },
  {
    n: "04",
    title: "Compose the look",
    line: "Build outfits on a mannequin, then share them.",
    render: () => (
      <div className="flex h-full items-center justify-center bg-paper-dim">
        <OutfitMannequin layers={[{ category: "sweater", color: "burgundy" }, { category: "jeans", color: "denim" }, { category: "sneakers", color: "white" }]} volume={"lean" as never} shape={"straight" as never} size={150} />
      </div>
    ),
  },
  {
    n: "05",
    title: "Earn your taste",
    line: "Struck-metal badges for a curated closet and admired looks.",
    render: () => <ColorField className="from-brand via-ink to-ink" label="✦" light />,
  },
];

// A light, USER-CONTROLLED horizontal lookbook: drag it, swipe it, or use the
// arrows / trackpad. No scroll-jacking — the page never pins or blocks you.
function HorizontalShowcase({ reduce }: { reduce: boolean }) {
  const rowRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ down: false, startX: 0, startLeft: 0, moved: false });

  function onPointerDown(e: React.PointerEvent) {
    const el = rowRef.current;
    if (!el) return;
    drag.current = { down: true, startX: e.clientX, startLeft: el.scrollLeft, moved: false };
    el.setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent) {
    const el = rowRef.current;
    if (!el || !drag.current.down) return;
    const dx = e.clientX - drag.current.startX;
    if (Math.abs(dx) > 3) drag.current.moved = true;
    el.scrollLeft = drag.current.startLeft - dx;
  }
  function endDrag(e: React.PointerEvent) {
    const el = rowRef.current;
    if (el?.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
    drag.current.down = false;
  }
  function nudge(dir: -1 | 1) {
    rowRef.current?.scrollBy({ left: dir * Math.min(440, window.innerWidth * 0.8), behavior: reduce ? "auto" : "smooth" });
  }

  return (
    <section className="bg-paper py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow text-ink-faint">Why it works</p>
            <h2 className="mt-3 font-serif text-4xl text-ink sm:text-5xl">A wardrobe that travels.</h2>
          </div>
          {/* arrows — an obvious way to move without dragging */}
          <div className="hidden gap-2 sm:flex">
            <button onClick={() => nudge(-1)} aria-label="Previous" className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-ink-soft transition-colors hover:border-ink hover:text-ink">←</button>
            <button onClick={() => nudge(1)} aria-label="Next" className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-ink-soft transition-colors hover:border-ink hover:text-ink">→</button>
          </div>
        </div>
      </div>

      <div
        ref={rowRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        data-lenis-prevent
        className="no-scrollbar mt-8 flex cursor-grab snap-x gap-6 overflow-x-auto scroll-px-6 px-6 pb-4 active:cursor-grabbing"
      >
        {SHOW_CARDS.map((c) => (
          <div
            key={c.n}
            className="h-[52vh] max-h-[460px] w-[82vw] flex-shrink-0 snap-start sm:w-[380px]"
            // a drag that moved shouldn't also register as a click on card links
            onClickCapture={(e) => { if (drag.current.moved) { e.preventDefault(); e.stopPropagation(); } }}
          >
            <ShowCardView c={c} />
          </div>
        ))}
        {/* trailing spacer so the last card can snap fully into view */}
        <div className="w-2 flex-shrink-0 sm:hidden" />
      </div>
      <p className="mx-auto mt-3 max-w-6xl px-6 text-xs text-ink-faint">Drag, swipe, or use the arrows →</p>
    </section>
  );
}

function ShowCardView({ c }: { c: ShowCard }) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-line">
      <div className="relative flex-1 overflow-hidden">{c.render()}</div>
      <div className="p-6">
        <span className="font-serif text-sm italic text-brand">{c.n}</span>
        <h3 className="mt-1 font-serif text-2xl text-ink">{c.title}</h3>
        <p className="mt-1.5 text-sm text-ink-soft">{c.line}</p>
      </div>
    </div>
  );
}

function ColorField({ className, label, light }: { className: string; label: string; light?: boolean }) {
  return (
    <div className={`flex h-full items-center justify-center bg-gradient-to-br ${className}`}>
      <span className={`font-serif text-5xl italic ${light ? "text-paper/90" : "text-white/90"}`}>{label}</span>
    </div>
  );
}

// ---------------- Converging layers ----------------
//
// An oversized word sits behind three cards that start spread apart and, as you
// scroll, gather into a FANNED DECK — they overlap, but each card keeps its own
// visible band (title + line), so nothing is ever hidden behind another. Reduced
// motion → they stay in a plain row.
const SIGNALS = [
  { n: "01", title: "Measurements", line: "Your body, once — kept private." },
  { n: "02", title: "Known-good items", line: "The clothes that already fit you." },
  { n: "03", title: "Brand behaviour", line: "How each label runs on you." },
];

function ConvergingStack({ reduce }: { reduce: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });

  // Spread → gathered. The deck converges to a diagonal stagger (not a pile),
  // so every card still shows its heading.
  const t = useTransform(scrollYProgress, [0.12, 0.55], reduce ? [1, 1] : [0, 1]);
  const wordScale = useTransform(scrollYProgress, [0, 1], reduce ? [1, 1] : [0.94, 1.08]);

  return (
    <section ref={ref} className="relative isolate overflow-hidden bg-paper py-28">
      {/* oversized word behind everything (clipped by the section) */}
      <motion.p
        style={{ scale: wordScale }}
        className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 select-none whitespace-nowrap text-center font-serif text-[22vw] font-semibold leading-none text-ink/[0.05]"
      >
        ONE FIT
      </motion.p>

      <div className="relative mx-auto max-w-5xl px-6">
        <div className="text-center">
          <p className="eyebrow text-ink-faint">Three signals, one answer</p>
          <h2 className="mx-auto mt-3 max-w-xl font-serif text-4xl leading-tight text-ink sm:text-5xl">
            Everything you know about your fit, in one place.
          </h2>
        </div>

        {/* Mobile: a plain readable column. Desktop: the gathering deck. */}
        <div className="mt-14 grid gap-4 sm:hidden">
          {SIGNALS.map((s) => (
            <SignalCard key={s.n} signal={s} />
          ))}
        </div>

        <div className="relative mt-16 hidden h-64 sm:block">
          {SIGNALS.map((s, i) => (
            <DeckCard key={s.n} signal={s} index={i} t={t} />
          ))}
        </div>

        <p className="mt-12 text-center text-sm text-ink-faint">
          They converge into a single recommendation — with its reasoning attached.
        </p>
      </div>
    </section>
  );
}

function SignalCard({ signal }: { signal: (typeof SIGNALS)[number] }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-line">
      <span className="font-serif text-sm italic text-brand">{signal.n}</span>
      <p className="mt-1 font-serif text-xl text-ink">{signal.title}</p>
      <p className="mt-1 text-sm text-ink-soft">{signal.line}</p>
    </div>
  );
}

// One card in the gathering deck. Spread position → gathered position, with the
// gathered offsets kept large enough that each card's heading stays readable.
function DeckCard({
  signal,
  index,
  t,
}: {
  signal: (typeof SIGNALS)[number];
  index: number;
  t: MotionValue<number>;
}) {
  const spreadX = [-320, 0, 320][index];
  const spreadY = [0, -14, 0][index];
  // Gathered: a diagonal stagger — 96px apart horizontally, 40px vertically.
  const gatherX = [-96, 0, 96][index];
  const gatherY = [-40, 0, 40][index];
  const spreadRot = [-7, 0, 7][index];
  const gatherRot = [-3.5, 0, 3.5][index];

  const x = useTransform(t, [0, 1], [spreadX, gatherX]);
  const y = useTransform(t, [0, 1], [spreadY, gatherY]);
  const rotate = useTransform(t, [0, 1], [spreadRot, gatherRot]);

  return (
    <motion.div
      style={{ x, y, rotate, zIndex: index + 1 }}
      className="absolute left-1/2 top-6 -ml-[9.5rem] w-[19rem] rounded-2xl bg-white/95 p-5 shadow-lift ring-1 ring-line backdrop-blur-sm"
    >
      <span className="font-serif text-sm italic text-brand">{signal.n}</span>
      <p className="mt-1 font-serif text-xl text-ink">{signal.title}</p>
      <p className="mt-1 text-sm text-ink-soft">{signal.line}</p>
    </motion.div>
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
        style={{ y: bgY }}
        className="pointer-events-none absolute select-none font-serif text-[38vw] font-semibold leading-none text-paper/[0.05]"
      >
        FIT
      </motion.span>
      {/* faster foreground statement */}
      <motion.div style={{ y: fgY }} className="relative mx-auto max-w-3xl px-6 text-center">
        <p className="eyebrow text-brand">Consumer-owned</p>
        <h2 className="mt-4 font-serif text-4xl leading-tight sm:text-6xl">
          You keep the profile.
          <br />
          It works at every store.
        </h2>
        <p className="mx-auto mt-5 max-w-md text-paper/60">
          Precise measurements stay private — never shared by code. Your taste is
          yours to carry.
        </p>
      </motion.div>
    </section>
  );
}

// ---------------- Closing CTA ----------------
function ClosingCTA() {
  return (
    <section className="mx-auto max-w-4xl px-6 pb-40 pt-24 text-center">
      <h2 className="font-serif text-6xl font-semibold leading-[0.95] tracking-tight text-ink sm:text-[8rem]">
        Start your
        <br />
        <span className="font-normal italic text-brand">fit passport.</span>
      </h2>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <LinkButton href="/passport" size="lg">Create your passport</LinkButton>
        <LinkButton href="/check" variant="secondary" size="lg">Check a product →</LinkButton>
      </div>
    </section>
  );
}

// ---------------- Value-first content (preserved from before) ----------------
function NewUserGuide() {
  const [loadingDemo, setLoadingDemo] = useState(false);
  async function loadDemo() {
    setLoadingDemo(true);
    await fetch("/api/demo", { method: "POST" });
    window.location.href = "/closet";
  }
  const steps = [
    { n: "1", title: "Paste a product", body: "Start with the box at the top — even before you fill anything out, you get a recommendation." },
    { n: "2", title: "Add a few clothes you own", body: "Tell us 3 items that fit you well. This is what makes the size scarily accurate." },
    { n: "3", title: "Shop with confidence", body: "Every recommendation explains itself. Record how it fit, and it keeps improving." },
  ];
  return (
    <div>
      <p className="eyebrow text-ink-faint">Get started</p>
      <h2 className="mt-3 font-serif text-3xl text-ink">Three steps to accurate sizing</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {steps.map((s) => (
          <Card key={s.n} className="flex flex-col">
            <div className="mb-3 font-serif text-2xl italic text-brand">{s.n}</div>
            <h3 className="font-serif text-lg text-ink">{s.title}</h3>
            <p className="mt-1 text-sm text-ink-soft">{s.body}</p>
          </Card>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <LinkButton href="/passport" variant="secondary">Set up my passport first</LinkButton>
        <LinkButton href="/check" variant="ghost">Or just check a product →</LinkButton>
      </div>
      <div className="mt-4">
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
  const initials = (status.username ?? "you").slice(0, 2).toUpperCase();
  const badgesToShow = (status.pinnedBadges?.length ? status.pinnedBadges : status.earnedBadgeIds) ?? [];
  return (
    <div className="space-y-5">
      {/* Identity strip */}
      <Card className="flex items-center justify-between gap-4">
        <Link href="/passport" className="group flex items-center gap-3">
          <Avatar src={status.avatarDataUrl} initials={initials} size={48} />
          <div>
            <p className="font-semibold text-ink group-hover:text-brand">
              {status.username ?? "Your passport"}
            </p>
            <p className="text-xs text-ink-faint">
              {status.earnedBadgeIds?.length
                ? `${status.earnedBadgeIds.length} badge${status.earnedBadgeIds.length === 1 ? "" : "s"} earned`
                : "View your fit passport →"}
            </p>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          {badgesToShow.length > 0 && <PinnedSeals ids={badgesToShow.slice(0, 3)} size={34} />}
          <Link href="/badges" className="text-xs text-ink-faint hover:text-brand">Badges →</Link>
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
            <div className="text-2xl font-bold text-brand">{Math.round(pctDone * 100)}%</div>
            <div className="text-xs text-ink-faint">set up</div>
          </div>
        </div>

        <ul className="mt-5 space-y-2">
          {status.steps.map((s) => (
            <li key={s.key} className="flex items-center justify-between rounded-xl border border-line px-4 py-2.5">
              <span className="flex items-center gap-3">
                <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${s.done ? "bg-green-600 text-white" : "bg-paper-dim text-ink-faint"}`}>
                  {s.done ? "✓" : ""}
                </span>
                <span className={s.done ? "text-ink-faint line-through" : "text-ink"}>{s.label}</span>
              </span>
              <span className="flex items-center gap-3">
                {s.progress && !s.done && <span className="text-xs text-ink-faint">{s.progress}</span>}
                {!s.done && <LinkButton href={s.href} variant="ghost" size="md">Do it →</LinkButton>}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      {status.lastRecommendation && (
        <Card className="flex items-center justify-between">
          <div>
            <p className="eyebrow text-ink-faint">Last recommendation</p>
            <p className="mt-1 text-ink">
              <span className="font-semibold">{status.lastRecommendation.size}</span> for{" "}
              {status.lastRecommendation.brand} {status.lastRecommendation.productName} ·{" "}
              {Math.round(status.lastRecommendation.confidence * 100)}% confidence
            </p>
          </div>
          <LinkButton href="/history" variant="secondary">Record fit</LinkButton>
        </Card>
      )}
    </div>
  );
}
