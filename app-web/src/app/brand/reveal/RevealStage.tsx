"use client";

// The presenting stage for the mark's reveal (Session 89).
//
//   Space / click   play again
//   D               ink or porcelain ground
//   Q               hero (~2.6 s) or quick (~0.9 s)
//   C               the line "One thread through the maze of fit." after the settle
//
// The same choices as query parameters, so a slide can link to an exact setup:
// ?bg=ink&variant=quick&caption=1, and &clean=1 hides the key hint. &still=1 shows
// the static mark at the same size and place: an end frame for a slide, and what the
// settled reveal is compared against, pixel for pixel.

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { LazyMotion, domAnimation, m } from "framer-motion";
import { AnimatedFitPassportLogo } from "@/components/AnimatedFitPassportLogo";
import { Logo } from "@/components/Logo";
import { useT } from "@/i18n/client";

export function RevealStage() {
  const t = useT("brandReveal");
  const th = useT("help");
  const q = useSearchParams();
  const [ink, setInk] = useState(q.get("bg") === "ink");
  const [variant, setVariant] = useState<"hero" | "quick">(q.get("variant") === "quick" ? "quick" : "hero");
  const [caption, setCaption] = useState(q.get("caption") === "1");
  const clean = q.get("clean") === "1";
  const still = q.get("still") === "1";
  // 0 would mean "first play" to the component's once-per-session rule; the stage
  // always plays, so it starts at 1.
  const [take, setTake] = useState(1);
  const [settled, setSettled] = useState(false);
  const [size, setSize] = useState(0);

  useEffect(() => {
    const fit = () => setSize(Math.round(Math.min(window.innerWidth, window.innerHeight) * 0.56));
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  const replay = useCallback(() => { setSettled(false); setTake((n) => n + 1); }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === " " || k === "enter") { e.preventDefault(); replay(); }
      else if (k === "d") setInk((v) => !v);
      else if (k === "q") { setVariant((v) => (v === "hero" ? "quick" : "hero")); replay(); }
      else if (k === "c") setCaption((v) => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [replay]);

  return (
    <div
      onClick={replay}
      className={`fixed inset-0 z-[80] flex cursor-pointer select-none flex-col items-center justify-center overflow-hidden ${ink ? "bg-ink text-paper" : "bg-paper text-ink"}`}
      data-settled={settled ? "1" : "0"}
    >
      {size > 0 && still && (
        <span className="relative inline-block align-middle" style={{ width: size, height: size }}>
          <span><Logo size={size} className="block" /></span>
        </span>
      )}
      {size > 0 && !still && (
        <AnimatedFitPassportLogo
          key={`${variant}-${take}`}
          variant={variant}
          size={size}
          once={false}
          replayKey={take}
          onDone={() => setSettled(true)}
        />
      )}
      {/* On Framer's frame clock, not a CSS transition, so a frame-by-frame recording
          (scripts/record-logo.mjs) fades it at the same pace as everything else. */}
      <LazyMotion features={domAnimation}>
        <m.p
          className="mt-[6vh] font-serif text-[clamp(1.1rem,2.6vw,2.2rem)] tracking-tight"
          aria-hidden={!caption}
          onUpdate={() => {}}
          initial={{ opacity: 0 }}
          animate={{ opacity: caption && (settled || still) ? 1 : 0 }}
          transition={{ duration: still ? 0 : 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          {th("markLine")}
        </m.p>
      </LazyMotion>
      {!clean && (
        <p className={`absolute bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs ${ink ? "text-paper/45" : "text-ink-faint"}`}>
          {t("keys")}
        </p>
      )}
    </div>
  );
}
