"use client";

// The one and only way a badge is drawn: as a THREE-DIMENSIONAL struck coin.
//
// There is no "flat" mode. A badge is the prestige object of this product, so it
// gets real thickness (a stack of rim slices in CSS 3D), a back face, a specular
// that travels as it turns, and a contact shadow so it sits ON the page instead
// of being printed on it. Hovering turns it; clicking lifts it into the inspect
// stage. This is used at every size, from a 26px seal in a list to the 260px
// hero on the inspect stage.
//
// Cost control: slice count scales with size, so a small seal builds 3 extra
// divs while the inspect hero builds 12. That keeps a grid of 60 seals cheap.

import { useRef, useState } from "react";
import { BadgeMedallion, PALETTE } from "@/components/BadgeMedallion";
import { METAL_STYLE, type Metal } from "@/lib/badges";

/** Slices and depth both scale with the coin, so proportions hold at any size. */
function geometry(size: number) {
  return {
    slices: Math.max(3, Math.min(12, Math.round(size / 14))),
    depth: Math.max(3, size * 0.1),
  };
}

export function BadgeCoin({
  id,
  metal,
  size = 48,
  locked = false,
  title,
  /** Controlled rotation (inspect stage drives this); omit for hover-driven. */
  rot,
  /** Follow the pointer on hover. Off when a parent controls rotation. */
  interactive = true,
  /** Bigger coins get an engraved back plate; small ones a plain metal back. */
  showBackPlate,
}: {
  id: string;
  metal: Metal;
  size?: number;
  locked?: boolean;
  title?: string;
  rot?: { x: number; y: number };
  interactive?: boolean;
  showBackPlate?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState({ x: 0, y: 0, active: false });

  const controlled = !!rot;
  const rx = controlled ? rot!.x : hover.x;
  const ry = controlled ? rot!.y : hover.y;

  const p = PALETTE[metal];
  const { slices, depth } = geometry(size);
  const plate = showBackPlate ?? size >= 120;

  function onMove(e: React.PointerEvent) {
    if (!interactive || controlled) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    setHover({ x: -py * 26, y: px * 30, active: true });
  }
  function reset() {
    if (controlled) return;
    setHover({ x: 0, y: 0, active: false });
  }

  // Specular travels with the turn — the tell that a surface is metal.
  const hx = 50 + ry * 1.5;
  const hy = 50 - rx * 1.5;
  const turned = Math.min(1, (Math.abs(rx) + Math.abs(ry)) / 40);

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={reset}
      className="relative flex-shrink-0"
      style={{ perspective: size * 9, width: size, height: size }}
    >
      {/* Contact shadow: grounds the coin so it reads as an object on a surface. */}
      <div
        aria-hidden
        className="pointer-events-none absolute rounded-[50%]"
        style={{
          left: "8%",
          right: "8%",
          bottom: -size * 0.06,
          height: size * 0.16,
          background: "rgba(0,0,0,0.28)",
          filter: `blur(${Math.max(2, size * 0.05)}px)`,
          opacity: locked ? 0.12 : 0.34 + turned * 0.16,
          transform: `translateX(${ry * 0.25}px)`,
          transition: hover.active ? "none" : "opacity 700ms ease, transform 700ms ease",
        }}
      />

      <div
        className="relative h-full w-full"
        style={{
          transformStyle: "preserve-3d",
          transform: `rotateX(${rx}deg) rotateY(${ry}deg)`,
          // Weighty, metal-like motion in, slow settle out.
          transition: controlled
            ? "none"
            : hover.active
              ? "transform 380ms cubic-bezier(0.22,1,0.36,1)"
              : "transform 900ms cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        {/* The edge: stacked slices, darkening toward the back, so the coin has
            genuine thickness rather than a painted-on rim. */}
        {Array.from({ length: slices }, (_, i) => {
          const t = slices === 1 ? 0.5 : i / (slices - 1);
          const z = -depth / 2 + t * depth;
          return (
            <div
              key={i}
              aria-hidden
              className="absolute inset-0 rounded-full"
              style={{
                transform: `translateZ(${z}px)`,
                background: `linear-gradient(120deg, ${p.mid} 0%, ${p.dark} 46%, ${p.rim} 100%)`,
                filter: `brightness(${0.5 + t * 0.42})`,
                opacity: locked ? 0.45 : 1,
              }}
            />
          );
        })}

        {/* Front face — the struck art. */}
        <div
          className="absolute inset-0"
          style={{ transform: `translateZ(${depth / 2 + 0.4}px)` }}
        >
          <BadgeMedallion id={id} metal={metal} size={size} locked={locked} title={title} />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-full"
            style={{
              background: `radial-gradient(circle at ${hx}% ${hy}%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.16) 24%, transparent 56%)`,
              mixBlendMode: "soft-light",
              opacity: locked ? 0 : 0.45 + turned * 0.4,
              transition: hover.active ? "none" : "opacity 700ms ease",
            }}
          />
        </div>

        {/* Back face — you can turn a coin over, so there has to be something there. */}
        <div
          aria-hidden
          className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden rounded-full"
          style={{
            transform: `translateZ(-${depth / 2 + 0.4}px) rotateY(180deg)`,
            background: `radial-gradient(circle at 40% 30%, ${p.mid}, ${p.dark} 68%, ${p.rim})`,
            boxShadow: `inset 0 0 ${size * 0.12}px ${p.rim}`,
            color: p.ink,
            opacity: locked ? 0.5 : 1,
          }}
        >
          {plate ? (
            <>
              <span className="text-[10px] uppercase tracking-[0.3em] opacity-70">Fit Passport</span>
              <span className="mt-1 font-serif text-2xl italic">{METAL_STYLE[metal].label}</span>
              <span className="mt-3 h-px w-16" style={{ background: p.light, opacity: 0.4 }} />
              {title && (
                <span className="mt-3 px-10 text-center text-[10px] leading-snug opacity-70">{title}</span>
              )}
            </>
          ) : (
            // Small coins get a struck ring instead of unreadable text.
            <span
              className="rounded-full"
              style={{
                width: size * 0.5,
                height: size * 0.5,
                border: `${Math.max(1, size * 0.03)}px solid ${p.light}`,
                opacity: 0.35,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
