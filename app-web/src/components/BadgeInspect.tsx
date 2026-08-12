"use client";

// Badge INSPECT view — modelled on a game's weapon-inspect screen (CS2): the
// item is lifted onto a dark stage where you drag to turn it in 3D, it has real
// thickness (a rim of stacked slices, not a flat image), and a restrained light
// rakes across the surface as it rotates. It idles with a slow drift so the
// metal always reads as metal.
//
// Deliberately CSS 3D, not WebGL: the medallion art is already crisp SVG, so we
// get true depth + rotation with no shader pipeline, no asset loading, and it
// works instantly on any device.

import { useEffect, useRef, useState } from "react";
import { BadgeMedallion } from "@/components/BadgeMedallion";
import { PALETTE } from "@/components/BadgeMedallion";
import { METAL_STYLE, type EarnedBadge } from "@/lib/badges";

const SLICES = 12; // rim slices → perceived thickness
const THICKNESS = 15; // px of total depth

export function BadgeInspect({
  badge,
  onClose,
}: {
  badge: EarnedBadge;
  onClose: () => void;
}) {
  const [rot, setRot] = useState({ x: -8, y: 18 });
  const [dragging, setDragging] = useState(false);
  const drag = useRef({ down: false, x: 0, y: 0, rx: 0, ry: 0 });
  const idle = useRef<number>(0);

  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Idle drift — a slow turn so light keeps moving when you're not dragging.
  useEffect(() => {
    if (dragging) return;
    let raf = 0;
    const tick = () => {
      idle.current += 0.16;
      setRot((r) => ({ x: r.x, y: r.y + 0.16 }));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [dragging]);

  function onDown(e: React.PointerEvent) {
    drag.current = { down: true, x: e.clientX, y: e.clientY, rx: rot.x, ry: rot.y };
    setDragging(true);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }
  function onMove(e: React.PointerEvent) {
    if (!drag.current.down) return;
    const dx = e.clientX - drag.current.x;
    const dy = e.clientY - drag.current.y;
    setRot({
      x: Math.max(-70, Math.min(70, drag.current.rx - dy * 0.4)),
      y: drag.current.ry + dx * 0.45,
    });
  }
  function onUp() {
    drag.current.down = false;
    setDragging(false);
  }

  const p = PALETTE[badge.metal];
  const st = METAL_STYLE[badge.metal];
  const size = 260;
  // Light angle follows rotation, so the sheen sweeps as the coin turns.
  const lightX = 50 + Math.sin((rot.y * Math.PI) / 180) * 34;
  const lightY = 42 - Math.sin((rot.x * Math.PI) / 180) * 26;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-[#0b0c0f]/95 backdrop-blur-sm" onClick={onClose}>
      {/* stage lighting */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: `radial-gradient(60% 45% at 50% 38%, ${p.glow}22, transparent 70%)` }}
      />
      <div className="pointer-events-none absolute bottom-0 h-56 w-full bg-gradient-to-t from-black/70 to-transparent" />

      <button
        onClick={onClose}
        className="absolute right-6 top-6 z-10 text-3xl leading-none text-white/50 transition-colors hover:text-white"
        aria-label="Close inspect"
      >
        ×
      </button>

      {/* the coin */}
      <div
        onClick={(e) => e.stopPropagation()}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        className={`relative select-none ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
        style={{ perspective: 1400, width: size, height: size, touchAction: "none" }}
      >
        <div
          className="relative h-full w-full"
          style={{
            transformStyle: "preserve-3d",
            transform: `rotateX(${rot.x}deg) rotateY(${rot.y}deg)`,
            transition: dragging ? "none" : "transform 120ms linear",
          }}
        >
          {/* rim: stacked slices give the coin real thickness */}
          {Array.from({ length: SLICES }, (_, i) => {
            const z = -THICKNESS / 2 + (i / (SLICES - 1)) * THICKNESS;
            const shade = 0.45 + (i / (SLICES - 1)) * 0.3;
            return (
              <div
                key={i}
                className="absolute inset-0 rounded-full"
                style={{
                  transform: `translateZ(${z}px)`,
                  background: p.dark,
                  filter: `brightness(${shade})`,
                }}
              />
            );
          })}

          {/* front face */}
          <div className="absolute inset-0 flex items-center justify-center" style={{ transform: `translateZ(${THICKNESS / 2 + 0.5}px)` }}>
            <BadgeMedallion id={badge.id} metal={badge.metal} size={size} title={badge.title} />
            {/* restrained raking light */}
            <div
              className="pointer-events-none absolute inset-0 rounded-full"
              style={{
                background: `radial-gradient(circle at ${lightX}% ${lightY}%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.12) 24%, transparent 56%)`,
                mixBlendMode: "soft-light",
              }}
            />
          </div>

          {/* back face — engraved plate with the metal name */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center rounded-full"
            style={{
              transform: `translateZ(-${THICKNESS / 2 + 0.5}px) rotateY(180deg)`,
              background: `radial-gradient(circle at 42% 32%, ${p.mid}, ${p.dark} 70%, ${p.rim})`,
              border: `2px solid ${p.rim}`,
              color: p.ink,
            }}
          >
            <span className="text-[10px] uppercase tracking-[0.3em] opacity-70">Fit Passport</span>
            <span className="mt-1 font-serif text-2xl italic">{st.label}</span>
            <span className="mt-3 h-px w-16" style={{ background: p.light, opacity: 0.4 }} />
            <span className="mt-3 px-10 text-center text-[10px] leading-snug opacity-70">{badge.title}</span>
          </div>
        </div>
      </div>

      {/* info panel */}
      <div onClick={(e) => e.stopPropagation()} className="relative mt-10 max-w-md px-8 text-center text-white">
        <div className="flex items-center justify-center gap-2">
          <h3 className="font-serif text-3xl">{badge.title}</h3>
          <span className="rounded-full border border-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white/70">
            {st.label}
          </span>
        </div>
        <p className="mt-3 text-sm text-white/70">{badge.blurb}</p>
        <p className="mt-2 text-xs italic text-white/45">{badge.lore}</p>
        {!badge.earnedNow && badge.progressText && (
          <p className="mt-3 text-xs font-medium text-white/80">{badge.progressText}</p>
        )}
        <p className="mt-6 text-[10px] uppercase tracking-[0.24em] text-white/30">Drag to turn · Esc to close</p>
      </div>
    </div>
  );
}
