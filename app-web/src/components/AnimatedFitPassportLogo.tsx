"use client";

// The mark, revealed as a thread — Session 89.
//
// "One thread through the maze of fit" (LOGO_CONCEPT.md §16), played: a few thin
// threads feel their way through a space with no walls drawn, turn, take wrong ways
// and pull back; one carries on, reaches the mark's entry, and draws the mark in the
// concept's order (§9: enter from the left, the upper turn and hidden FP, descend,
// the lower loop). In the last ~150 ms the drawn thread crossfades into the real
// <Logo>, which then settles.
//
//   <AnimatedFitPassportLogo variant="hero" />   ~2.6 s, plays once per session
//   <AnimatedFitPassportLogo variant="quick" />  ~0.9 s, no exploration
//
// THE FINAL FRAME IS THE MASTER. The thread is drawn on an overlay with the mark's
// own viewBox and size, over <Logo> itself; when the reveal ends the overlay is gone
// and what remains is the same <Logo> a static page renders — so the settled mark is
// pixel-identical by construction, and its geometry is never copied or morphed.
// The thread follows a measured centerline (lib/logoCenterline.ts).
//
// Quiet on purpose (the concept forbids spinning, neon and elastic motion): no
// springs, no overshoot, no glow; only pathLength, opacity and stroke width move.
// prefers-reduced-motion shows the mark at once.

import { useEffect, useState } from "react";
import { LazyMotion, domAnimation, m, useReducedMotion } from "framer-motion";
import { Logo } from "@/components/Logo";
import { CENTERLINE, CENTERLINE_STROKE } from "@/lib/logoCenterline";
import { REVEAL_TIMING, revealDuration, reverseCubic } from "@/lib/logoReveal";

const VIEW_W = 536.03;
const VIEW_H = 501.64;
const SESSION_KEY = "fp-logo-reveal-played";

// Restrained, fabric-like: slow in, slow out; nothing overshoots.
const DRAW_EASE = [0.65, 0, 0.35, 1] as const;
const SETTLE_EASE = [0.22, 1, 0.36, 1] as const;

// ---- the exploring threads (hero only) ----
//
// Threads feeling their way through a space with no walls drawn: smooth curves
// through a few waypoints, some sweeping into the area the mark will take and
// curling back (a wrong way), some running off low. No right angles, no grid, no
// nodes or end dots — a thread looking for its way, not a circuit or a chart. All in
// the mark's own coordinates; the overlay does not clip.

/** A smooth curve through the points (Catmull-Rom, as cubic Béziers). */
function spline(points: Array<[number, number]>): string {
  const r = (v: number) => Math.round(v * 10) / 10;
  let d = `M${points[0][0]} ${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)], p1 = points[i], p2 = points[i + 1], p3 = points[Math.min(points.length - 1, i + 2)];
    d += ` C${r(p1[0] + (p2[0] - p0[0]) / 6)} ${r(p1[1] + (p2[1] - p0[1]) / 6)} ${r(p2[0] - (p3[0] - p1[0]) / 6)} ${r(p2[1] - (p3[1] - p1[1]) / 6)} ${p2[0]} ${p2[1]}`;
  }
  return d;
}

/** Wrong ways: each runs, turns, meets nothing, and pulls back. */
const DECOYS = [
  // Into the space the lower loop will take, then curling back up and away.
  spline([[-305, 384], [-160, 354], [-10, 312], [78, 226], [64, 130], [-6, 98]]),
  // A long sweep through the middle of the mark's space, hooking back at the end.
  spline([[-236, -64], [-140, 30], [-10, 150], [130, 196], [250, 268], [306, 366], [252, 432]]),
  // Low, and off the bottom.
  spline([[-332, 540], [-160, 476], [30, 474], [150, 520], [196, 566]]),
];

/** The way through: it ends at the mark's entry, heading the way the thread enters. */
const LEAD_IN = spline([[-322, 236], [-190, 186], [-114, 104], [-80, 22], [-32, -8], [0, 18], [10.2, 35.3]]);

const STROKES = [CENTERLINE.entryAndTurn, CENTERLINE.innerCurl, CENTERLINE.stem, reverseCubic(CENTERLINE.lowerLoop)];

type Phase = "pending" | "play" | "done";

// See the canonical layer below: an onUpdate listener stops Framer handing opacity
// to the Web Animations API (AcceleratedAnimation.supports).
const keepOnFrameClock = () => {};

export function AnimatedFitPassportLogo({
  variant = "hero",
  size = 96,
  className = "",
  once,
  replayKey = 0,
  onDone,
}: {
  variant?: "hero" | "quick";
  size?: number;
  className?: string;
  /** Play at most once per browser session (default: hero yes, quick no). */
  once?: boolean;
  /** Change it to play again (the presentation page's replay). */
  replayKey?: number;
  onDone?: () => void;
}) {
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("pending");
  const playOnce = once ?? variant === "hero";
  const t = REVEAL_TIMING[variant];
  const total = revealDuration(variant);

  useEffect(() => {
    let played = false;
    try { played = playOnce && replayKey === 0 && sessionStorage.getItem(SESSION_KEY) === "1"; } catch { /* storage blocked */ }
    if (reduce || played) { setPhase("done"); onDone?.(); return; }
    setPhase("play");
    // Marked as played when it finishes, not when it starts: React runs effects twice
    // in development, and a mark set at the start made the second run skip the reveal.
    // (Leaving mid-reveal means it plays again next time, which is the right way round.)
    const id = setTimeout(() => {
      try { if (playOnce) sessionStorage.setItem(SESSION_KEY, "1"); } catch { /* storage blocked */ }
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
        {/* Pending: the space is held but nothing shows, so the mark never flashes
            on, vanishes, and then draws. */}
        <span style={phase === "pending" ? { visibility: "hidden" } : undefined}><Logo size={size} className="block" /></span>
      </span>
    );
  }

  // A hairline that stays a hairline at any size, in the mark's own units.
  const hair = (Math.max(1.25, size * 0.004) * VIEW_W) / size;
  const drawStart = t.explore;
  const starts = t.draw.map((_, i) => drawStart + t.draw.slice(0, i).reduce((a, b) => a + b, 0));
  const drawEnd = drawStart + t.draw.reduce((a, b) => a + b, 0);
  const common = { fill: "none", stroke: "currentColor", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

  return (
    <LazyMotion features={domAnimation}>
      <span key={replayKey} className={`relative inline-block align-middle ${className}`} style={box}>
        {/* The real mark, faded in under the thread at the end, then settled. */}
        <m.span
          className="block"
          // Keeps this layer on Framer's own frame clock rather than the browser's
          // Web Animations, so every layer of the reveal shares one clock — which is
          // what lets scripts/record-logo.mjs step it frame by frame.
          onUpdate={keepOnFrameClock}
          initial={{ opacity: 0, scale: 1.012 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            // In first, under the still-opaque thread: two layers fading at once
            // would each be half there, and the mark would dip to grey mid-crossfade.
            opacity: { delay: drawEnd, duration: t.crossfade * 0.6, ease: "linear" },
            scale: { delay: drawEnd, duration: t.crossfade + t.settle, ease: SETTLE_EASE },
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
          // 1.8% it spills past the mark's edge actually fade.
          transition={{ delay: drawEnd + t.crossfade * 0.4, duration: t.crossfade * 0.6, ease: "linear" }}
        >
          {t.explore > 0 && DECOYS.map((d, i) => (
            <m.path
              key={i}
              d={d}
              {...common}
              strokeWidth={hair}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: [0, 0.9, 0.9, 0], opacity: [0, 0.55, 0.55, 0] }}
              transition={{
                delay: 0.06 + i * 0.11,
                duration: 0.86,
                times: [0, 0.55, 0.66, 1],
                ease: DRAW_EASE,
              }}
            />
          ))}
          {t.explore > 0 && (
            <m.path
              d={LEAD_IN}
              {...common}
              strokeWidth={hair}
              initial={{ pathLength: 0, pathOffset: 0, opacity: 0 }}
              animate={{ pathLength: [0, 1, 0], pathOffset: [0, 0, 1], opacity: [0, 1, 1, 0] }}
              transition={{
                pathLength: { delay: 0.12, duration: drawStart - 0.12 + 0.42, times: [0, (drawStart - 0.12) / (drawStart + 0.3), 1], ease: DRAW_EASE },
                pathOffset: { delay: 0.12, duration: drawStart - 0.12 + 0.42, times: [0, (drawStart - 0.12) / (drawStart + 0.3), 1], ease: DRAW_EASE },
                opacity: { delay: 0.12, duration: drawStart + 0.3, times: [0, 0.04, 0.96, 1], ease: "linear" },
              }}
            />
          )}
          {STROKES.map((d, i) => (
            <m.path
              key={d.slice(0, 24)}
              d={d}
              {...common}
              initial={{ pathLength: 0, opacity: 0, strokeWidth: i === 0 && t.explore > 0 ? hair : CENTERLINE_STROKE }}
              animate={{ pathLength: 1, opacity: 1, strokeWidth: CENTERLINE_STROKE }}
              transition={{
                pathLength: { delay: starts[i], duration: t.draw[i], ease: i === 0 ? [0.55, 0, 1, 1] : i === STROKES.length - 1 ? [0, 0, 0.35, 1] : "linear" },
                // Fades in as it starts, so the round end never shows as a dot first:
                // a pen touching down.
                opacity: { delay: starts[i], duration: Math.min(0.06, t.draw[i] / 3), ease: "easeOut" },
                // The thread thickens into the mark's weight as it enters.
                strokeWidth: { delay: starts[i], duration: t.draw[0] * 0.45, ease: DRAW_EASE },
              }}
            />
          ))}
        </m.svg>
      </span>
    </LazyMotion>
  );
}
