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
//
// THE RESTING TILT IS NOT DECORATION. Head-on, a disc's edge is hidden exactly
// behind its face, so a coin at rotation zero is — correctly — a flat circle, and
// no amount of gradient fixes that. Every badge therefore sits at a small standing
// angle, so its thickness and its milled edge are visible before you touch it.
// Hovering turns it further from there.

import { useRef, useState } from "react";
import { BadgeMedallion, PALETTE, shapePath } from "@/components/BadgeMedallion";
import { badgeById, METAL_STYLE, type Metal } from "@/lib/badges";

/**
 * Clip the edge stack, back face and sheen to the badge's ACTUAL silhouette, at
 * the same radius the SVG art uses (0.44 × size).
 *
 * Before this, every layer was a `rounded-full` box — a circle 6% wider than the
 * medal itself. Round badges gained a phantom outer rim and shields sat on a disc
 * they didn't belong to, which is a large part of why they read as flat decals.
 */
function silhouette(id: string, size: number): React.CSSProperties {
  const shape = badgeById(id)?.shape ?? "circle";
  const r = size * 0.44;
  if (shape === "circle") {
    // A true circle of the art's radius, not of the layout box.
    return { inset: size / 2 - r, borderRadius: "50%" };
  }
  const d = shapePath(shape, size / 2, r) ?? "";
  return { inset: 0, clipPath: `path("${d}")`, WebkitClipPath: `path("${d}")` } as React.CSSProperties;
}

/** Slices and depth both scale with the coin, so proportions hold at any size. */
function geometry(size: number) {
  return {
    slices: Math.max(3, Math.min(12, Math.round(size / 12))),
    // A real medal is thick. Thin depth is what made these read as decals.
    depth: Math.max(3.5, size * 0.17),
  };
}

/**
 * The standing angle. Smaller coins get less of it: a 26px seal turned 20° loses
 * too much of its engraving to foreshortening, and legibility beats swagger at
 * that size.
 */
function restTilt(size: number) {
  if (size < 32) return { x: -10, y: -14 };
  if (size < 64) return { x: -13, y: -19 };
  return { x: -15, y: -22 };
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
  const rest = restTilt(size);
  const [hover, setHover] = useState({ x: rest.x, y: rest.y, active: false });

  const controlled = !!rot;
  const rx = controlled ? rot!.x : hover.x;
  const ry = controlled ? rot!.y : hover.y;

  const p = PALETTE[metal];
  const { slices, depth } = geometry(size);
  const plate = showBackPlate ?? size >= 120;
  const clip = silhouette(id, size);

  function onMove(e: React.PointerEvent) {
    if (!interactive || controlled) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    // Turn FROM the standing angle rather than from flat, so the cursor never
    // pushes the medal back into looking like a sticker.
    setHover({ x: rest.x - py * 24, y: rest.y + px * 30, active: true });
  }
  function reset() {
    if (controlled) return;
    setHover({ x: rest.x, y: rest.y, active: false });
  }

  // Specular travels with the turn — the tell that a surface is metal.
  const hx = 50 + ry * 1.5;
  const hy = 50 - rx * 1.5;
  const turned = Math.min(1, (Math.abs(rx - rest.x) + Math.abs(ry - rest.y)) / 36);

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={reset}
      className="relative flex-shrink-0"
      // Close perspective (≈4× the medal's width). The old value was so far away
      // the projection was nearly orthographic, which is another way of saying
      // "flat": nothing foreshortened, so nothing looked turned.
      style={{ perspective: size * 4.2, width: size, height: size }}
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
          opacity: locked ? 0.12 : 0.38 + turned * 0.18,
          transform: `translateX(${ry * 0.3}px) scaleX(${1 - Math.abs(ry) / 260})`,
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
              className="absolute"
              style={{
                ...clip,
                transform: `translateZ(${z}px)`,
                // Two layers: the milled flutes of a coin's edge over the metal
                // itself, darkening toward the back of the stack.
                backgroundImage: [
                  `repeating-linear-gradient(90deg, ${p.rim}00 0px, ${p.rim}55 ${Math.max(1, size * 0.018)}px, ${p.light}33 ${Math.max(2, size * 0.03)}px, ${p.rim}00 ${Math.max(3, size * 0.045)}px)`,
                  `linear-gradient(118deg, ${p.light} 0%, ${p.mid} 30%, ${p.dark} 64%, ${p.rim} 100%)`,
                ].join(","),
                filter: `brightness(${0.42 + t * 0.5})`,
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
            className="pointer-events-none absolute"
            style={{
              ...clip,
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
          className="absolute flex flex-col items-center justify-center overflow-hidden"
          style={{
            ...clip,
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
