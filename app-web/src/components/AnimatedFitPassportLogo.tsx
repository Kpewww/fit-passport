"use client";

// The mark, revealed as two threads — Sessions 89 and 90.
//
// "One thread through the maze of fit" (LOGO_CONCEPT.md §16), played: thin threads
// feel their way through a space with no walls drawn and pull back, while two threads
// at the mark's own weight come in and draw it — A from the top-left, the small p; B
// from the bottom-right, the lower loop and up the spine into the big P (the founder's
// route, Session 90). Each runs on one progress value along its whole route, so it
// never jumps between pieces. Where a thread had to cross one of the mark's gaps, that
// stretch fades once both are done, and the mark's real gaps appear; then the drawn
// thread crossfades into the real <Logo>, which settles.
//
//   <AnimatedFitPassportLogo variant="hero" />   ~2.6 s, plays on every arrival
//   <AnimatedFitPassportLogo variant="quick" />  ~0.9 s, no exploring lines
//   <AnimatedFitPassportLogo variant="intro" />  the hero's choreography with a
//                                                full-screen field (HomeIntro.tsx)
//
// THE FINAL FRAME IS THE MASTER. The threads are drawn on an overlay with the mark's
// own viewBox and size, over <Logo> itself; when the reveal ends the overlay is gone
// and what remains is the same <Logo> a static page renders — pixel-identical by
// construction; the mark's geometry is never copied or morphed.
//
// Quiet on purpose (the concept forbids spinning, neon and elastic motion): no
// springs, no overshoot, no glow. prefers-reduced-motion shows the mark at once.

import { useEffect, useMemo, useState } from "react";
import { LazyMotion, animate, domAnimation, m, useMotionValue, useReducedMotion, useTransform, type MotionValue } from "framer-motion";
import { Logo } from "@/components/Logo";
import { CENTERLINE_STROKE } from "@/lib/logoCenterline";
import { REVEAL_TIMING, revealDuration, spline, threadsEnd, threads, type Piece, type Thread, type Variant } from "@/lib/logoReveal";

const VIEW_W = 536.03;
const VIEW_H = 501.64;
const ONCE_KEY = "fp-logo-reveal-played";

// Restrained, fabric-like: slow in, a longer slow out; nothing overshoots.
const THREAD_EASE = [0.45, 0, 0.25, 1] as const;
const DRAW_EASE = [0.65, 0, 0.35, 1] as const;
const SETTLE_EASE = [0.22, 1, 0.36, 1] as const;

// An onUpdate listener keeps an HTML layer on Framer's own frame clock rather than the
// Web Animations API (AcceleratedAnimation.supports), so every layer shares one clock —
// which is what lets scripts/record-logo.mjs step the reveal frame by frame.
export const keepOnFrameClock = () => {};

// ---- thin exploring lines: atmosphere, not the mark ----
//
// Smooth curves through a few waypoints, sweeping in and curling back; no right
// angles, grid or nodes — a thread looking for its way, not a circuit or a chart.

type Pt = [number, number];
/** Around the mark (the inline hero). */
const DECOYS_HERO: Pt[][] = [
  [[-305, 384], [-160, 354], [-10, 312], [78, 226], [64, 130], [-6, 98]],
  [[-236, -64], [-140, 30], [-10, 150], [130, 196], [250, 268], [306, 366], [252, 432]],
  [[-332, 540], [-160, 476], [30, 474], [150, 520], [196, 566]],
];
/** Across the whole screen (the full-screen intro), from every side. */
const DECOYS_INTRO: Pt[][] = [
  [[-1150, -200], [-700, -60], [-300, -180], [60, -120], [300, -260]],
  [[-1150, 300], [-760, 360], [-420, 250], [-120, 300], [80, 460], [20, 600]],
  [[-1100, 820], [-650, 700], [-300, 780], [0, 700], [160, 560]],
  [[1700, -300], [1250, -120], [900, -220], [640, -80], [560, 60]],
  [[1750, 420], [1300, 330], [1000, 450], [760, 380], [640, 250]],
  [[1600, 1100], [1200, 880], [900, 980], [620, 860], [520, 700]],
  [[-500, -800], [-380, -480], [-460, -220], [-250, -40]],
  [[900, 1350], [760, 1050], [880, 820], [700, 660]],
];

type Phase = "pending" | "play" | "done";

export function AnimatedFitPassportLogo({
  variant = "hero",
  size = 96,
  className = "",
  once = false,
  replayKey = 0,
  yieldToIntro = false,
  onDone,
}: {
  variant?: Variant;
  size?: number;
  className?: string;
  /** Play at most once per browser session. */
  once?: boolean;
  /** Change it to play again (the presentation page's replay). */
  replayKey?: number;
  /** Stand still while the homepage's full-screen intro plays — it lands on this mark. */
  yieldToIntro?: boolean;
  onDone?: () => void;
}) {
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("pending");
  const total = revealDuration(variant);

  useEffect(() => {
    let skip = false;
    try {
      skip = (once && replayKey === 0 && sessionStorage.getItem(ONCE_KEY) === "1") ||
        (yieldToIntro && document.documentElement.dataset.fpIntro === "play");
    } catch { /* storage blocked */ }
    if (reduce || skip) { setPhase("done"); onDone?.(); return; }
    setPhase("play");
    // Marked when it finishes: React runs effects twice in development, and a mark set
    // at the start made the second run skip the reveal.
    const id = setTimeout(() => {
      try { if (once) sessionStorage.setItem(ONCE_KEY, "1"); } catch { /* storage blocked */ }
      setPhase("done");
      onDone?.();
    }, total * 1000);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [replayKey, reduce, variant]);

  const box = { width: size, height: size };
  if (phase !== "play") {
    return (
      <span className={`relative inline-block align-middle ${className}`} style={box}>
        {/* Pending: the space is held but nothing shows, so the mark never flashes on,
            vanishes, and then draws. */}
        <span style={phase === "pending" ? { visibility: "hidden" } : undefined}><Logo size={size} className="block" /></span>
      </span>
    );
  }
  return (
    <LazyMotion features={domAnimation}>
      <Reveal key={replayKey} variant={variant} size={size} className={className} />
    </LazyMotion>
  );
}

function Reveal({ variant, size, className }: { variant: Variant; size: number; className: string }) {
  const t = REVEAL_TIMING[variant];
  const { a, b } = useMemo(() => threads(variant), [variant]);
  const drawn = threadsEnd(variant);
  const crossAt = drawn + t.gaps;
  // A hairline that stays a hairline at any size, in the mark's own units.
  const hair = (Math.max(1.25, size * 0.004) * VIEW_W) / size;
  const decoys = variant === "intro" ? DECOYS_INTRO : variant === "hero" ? DECOYS_HERO : [];

  // The two connectors fade together once both threads are done: the gaps appear.
  const gaps = useMotionValue(1);
  useEffect(() => {
    const c = animate(gaps, 0, { delay: drawn, duration: t.gaps, ease: "linear" });
    return () => c.stop();
  }, [gaps, drawn, t.gaps]);

  return (
    <span className={`relative inline-block align-middle ${className}`} style={{ width: size, height: size }}>
      {/* The real mark, faded in under the still-opaque thread, then settled. */}
      <m.span
        className="block"
        onUpdate={keepOnFrameClock}
        initial={{ opacity: 0, scale: 1.012 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          // In first, under the opaque thread: two layers fading at once would each be
          // half there, and the mark would dip to grey mid-crossfade.
          opacity: { delay: crossAt, duration: t.crossfade * 0.6, ease: "linear" },
          scale: { delay: crossAt, duration: t.crossfade + t.settle, ease: SETTLE_EASE },
        }}
      >
        <Logo size={size} className="block" />
      </m.span>

      <m.svg
        width={size}
        height={size}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        aria-hidden
        data-fp-reveal="thread"
        className="pointer-events-none absolute inset-0 overflow-visible"
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        // Out once the mark below is solid; only the thread's round ends and the
        // ~2% it spills past the mark's edge actually fade.
        transition={{ delay: crossAt + t.crossfade * 0.4, duration: t.crossfade * 0.6, ease: "linear" }}
      >
        {decoys.map((pts, i) => (
          <m.path
            key={i}
            d={spline(pts)}
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth={hair}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: [0, 0.9, 0.9, 0], opacity: [0, 0.5, 0.5, 0] }}
            transition={{ delay: 0.04 + (i * (t.explore - 0.9)) / Math.max(1, decoys.length - 1), duration: 0.9, times: [0, 0.55, 0.66, 1], ease: DRAW_EASE }}
          />
        ))}
        <ThreadPaths thread={a} timing={t.threadA} gaps={gaps} />
        <ThreadPaths thread={b} timing={t.threadB} gaps={gaps} />
      </m.svg>
    </span>
  );
}

/**
 * One thread: its lead-in and pieces, all driven by `dist`, the distance its head has
 * travelled along the whole route. A piece shows from its start up to the head; the
 * lead-in shows only a window behind the head, so the thread slides in and its tail
 * is drawn into the mark.
 */
function ThreadPaths({ thread, timing, gaps }: { thread: Thread; timing: [number, number]; gaps: MotionValue<number> }) {
  const dist = useMotionValue(0);
  useEffect(() => {
    const c = animate(dist, thread.length, { delay: timing[0], duration: timing[1], ease: THREAD_EASE });
    return () => c.stop();
  }, [dist, thread.length, timing]);

  let offset = thread.leadIn.length;
  const starts = thread.pieces.map((p) => { const o = offset; offset += p.length; return o; });
  return (
    <>
      <LeadInPath piece={thread.leadIn} window={thread.window} dist={dist} />
      {thread.pieces.map((p, i) => (
        <PiecePath key={i} piece={p} start={starts[i]} dist={dist} gaps={gaps} />
      ))}
    </>
  );
}

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: CENTERLINE_STROKE,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function LeadInPath({ piece, window, dist }: { piece: Piece; window: number; dist: MotionValue<number> }) {
  const L = piece.length;
  const head = (v: number) => Math.min(v, L);
  const tail = (v: number) => Math.min(Math.max(0, v - window), L);
  const pathOffset = useTransform(dist, (v) => tail(v) / L);
  const pathLength = useTransform(dist, (v) => (head(v) - tail(v)) / L);
  // Nothing at all when nothing is drawn: a round end at zero length is a dot.
  const opacity = useTransform(dist, (v) => (head(v) - tail(v) > 0.5 ? 1 : 0));
  return <m.path d={piece.d} {...stroke} style={{ pathOffset, pathLength, opacity }} />;
}

function PiecePath({ piece, start, dist, gaps }: { piece: Piece; start: number; dist: MotionValue<number>; gaps: MotionValue<number> }) {
  const L = piece.length;
  const pathLength = useTransform(dist, (v) => Math.min(Math.max(0, v - start), L) / L);
  const opacity = useTransform([dist, gaps], ([v, g]: number[]) => (v - start > 0.5 ? (piece.connector ? g : 1) : 0));
  return <m.path d={piece.d} {...stroke} style={{ pathLength, opacity }} />;
}
