"use client";

// The homepage's first-visit intro — Session 90.
//
// Full screen, on ink: thin lines search the screen while the mark's two threads draw
// a giant mark (the reveal's `intro` variant). When it settles, the giant mark flies
// into the hero's mark — measured, so it lands exactly on it — while the black fades
// into the page, whose hero is the same ink. Then the overlay is gone and the hero's
// own <Logo> is what remains, so the landing frame is the master.
//
// Plays once per browser session (the founder's call), decided before the first paint
// by lib/homeIntro.ts. A click, a tap or any key skips straight to the landing; there
// is no button, so nothing but the mark is on screen.

import { useCallback, useEffect, useRef, useState } from "react";
import { LazyMotion, animate, domAnimation, m, useMotionValue } from "framer-motion";
import { AnimatedFitPassportLogo, keepOnFrameClock } from "@/components/AnimatedFitPassportLogo";
import { Logo } from "@/components/Logo";
import { endIntro, introPlaying } from "@/lib/homeIntro";

type Phase = "idle" | "draw" | "land" | "gone";

/** The landing: quick, decelerating, no overshoot. */
const LAND = { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const };

export function HomeIntro() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [size, setSize] = useState(0);
  const markRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const scale = useMotionValue(1);
  const ground = useMotionValue(1);

  useEffect(() => {
    if (!introPlaying()) { setPhase("gone"); return; }
    setSize(Math.round(Math.min(window.innerWidth * 0.62, window.innerHeight * 0.62, 520)));
    setPhase("draw");
  }, []);

  const land = useCallback(() => setPhase((p) => (p === "draw" ? "land" : p)), []);

  // Skip: any click, tap or key while it draws goes straight to the landing.
  useEffect(() => {
    if (phase !== "draw") return;
    window.addEventListener("pointerdown", land);
    window.addEventListener("keydown", land);
    return () => { window.removeEventListener("pointerdown", land); window.removeEventListener("keydown", land); };
  }, [phase, land]);

  // Fly the giant mark onto the hero's mark, and fade the ground.
  useEffect(() => {
    if (phase !== "land") return;
    const target = document.querySelector("[data-fp-hero-mark]")?.getBoundingClientRect();
    const from = markRef.current?.getBoundingClientRect();
    const controls: Array<{ stop: () => void }> = [];
    if (target && from && from.width > 0) {
      controls.push(
        animate(x, target.left + target.width / 2 - (from.left + from.width / 2), LAND),
        animate(y, target.top + target.height / 2 - (from.top + from.height / 2), LAND),
        animate(scale, target.width / from.width, LAND),
      );
    }
    controls.push(animate(ground, 0, { duration: LAND.duration * 0.9, ease: "easeOut" }));
    const id = setTimeout(() => { endIntro(); setPhase("gone"); }, LAND.duration * 1000);
    return () => { clearTimeout(id); controls.forEach((c) => c.stop()); };
  }, [phase, x, y, scale, ground]);

  if (phase === "gone") return null;
  return (
    // Server-rendered and hidden by CSS unless the head script marked the page, so it
    // covers the page from the first paint — never a flash of the page, then black.
    <div className="fp-intro fixed inset-0 z-[100] items-center justify-center overflow-hidden text-paper" aria-hidden>
      <LazyMotion features={domAnimation}>
        <m.div className="absolute inset-0 bg-ink" onUpdate={keepOnFrameClock} style={{ opacity: ground }} />
        {size > 0 && (
          <m.div ref={markRef} className="relative" onUpdate={keepOnFrameClock} style={{ x, y, scale, width: size, height: size }}>
            {phase === "draw" ? (
              <AnimatedFitPassportLogo variant="intro" size={size} onDone={land} />
            ) : (
              // Landing (or skipped): the settled mark itself, at the giant size.
              <Logo size={size} className="block" />
            )}
          </m.div>
        )}
      </LazyMotion>
    </div>
  );
}
