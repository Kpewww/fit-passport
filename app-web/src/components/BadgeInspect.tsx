"use client";

// Badge INSPECT stage — modelled on a game's weapon-inspect screen (CS2): the
// medal is lifted onto a dark stage, drag turns it, a restrained light rakes
// across the metal, and it idles with a slow drift so metal keeps reading as
// metal.
//
// There is no longer a Flat / True-3D switch. It is ALWAYS the real 3D renderer;
// the CSS coin is only a fallback for devices that can't give us a WebGL context,
// and it's dimensional too, so nothing here is ever flat.

import { useCallback, useEffect, useRef, useState, lazy, Suspense } from "react";
import { BadgeMedallion, PALETTE } from "@/components/BadgeMedallion";
import { BadgeCoin } from "@/components/BadgeCoin";
import { SafeBoundary } from "@/components/SafeBoundary";
import { METAL_STYLE, type BadgeDef } from "@/lib/badges";

// three.js is heavy, so it arrives with the stage rather than with the page.
const BadgeWebGL = lazy(() =>
  import("@/components/BadgeWebGL").then((m) => ({ default: m.BadgeWebGL })),
);

/** Earned state is optional — a seal anywhere in the app can open this. */
type InspectBadge = BadgeDef & { earnedNow?: boolean; progressText?: string | null };

export function BadgeInspect({
  badge,
  onClose,
}: {
  badge: InspectBadge;
  onClose: () => void;
}) {
  const [rot, setRot] = useState({ x: -8, y: 18 });
  const [face, setFace] = useState<{ svg: string; aspect: number } | null>(null);
  const [cssOnly, setCssOnly] = useState(false);
  const [dragging, setDragging] = useState(false);
  const artRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ down: false, x: 0, y: 0, rx: 0, ry: 0 });

  // Serialize the medallion art once, so the 3D face texture is the same drawing
  // the 2D seals use — one source of truth for the engraving.
  useEffect(() => {
    const svgEl = artRef.current?.querySelector("svg");
    if (!svgEl) {
      setCssOnly(true); // no art to texture with → stay on the CSS coin
      return;
    }
    const w = parseFloat(svgEl.getAttribute("width") ?? "0");
    const h = parseFloat(svgEl.getAttribute("height") ?? "0");
    setFace({
      svg: new XMLSerializer().serializeToString(svgEl),
      aspect: w > 0 && h > 0 ? h / w : 1,
    });
  }, [badge.id, badge.metal]);

  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Idle drift for the CSS fallback (the WebGL loop drifts on its own).
  useEffect(() => {
    if (!cssOnly || dragging) return;
    let raf = 0;
    const tick = () => {
      setRot((r) => ({ x: r.x, y: r.y + 0.16 }));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [cssOnly, dragging]);

  const fallBackToCss = useCallback(() => setCssOnly(true), []);

  function onDown(e: React.PointerEvent) {
    drag.current = { down: true, x: e.clientX, y: e.clientY, rx: rot.x, ry: rot.y };
    setDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
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
  const size = 300;

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-[#0b0c0f]/95 backdrop-blur-sm"
      onClick={onClose}
    >
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

      {/* hidden source art — serialized into the 3D face texture */}
      <div ref={artRef} className="pointer-events-none absolute h-0 w-0 overflow-hidden opacity-0" aria-hidden>
        <BadgeMedallion id={badge.id} metal={badge.metal} size={512} />
      </div>

      <div onClick={(e) => e.stopPropagation()} className="relative">
        {cssOnly ? (
          // Dimensional CSS medal: drag to turn, real thickness, back face.
          <div
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
            className={`select-none ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
            style={{ touchAction: "none" }}
          >
            <BadgeCoin
              id={badge.id}
              metal={badge.metal}
              size={size}
              title={badge.title}
              rot={rot}
              interactive={false}
              showBackPlate
              dimensional
            />
          </div>
        ) : face ? (
          <SafeBoundary
            fallback={
              <BadgeCoin id={badge.id} metal={badge.metal} size={size} title={badge.title} showBackPlate dimensional />
            }
          >
            <Suspense
              fallback={
                <div className="flex h-[300px] w-[300px] items-center justify-center text-xs text-white/40">
                  Preparing the metal…
                </div>
              }
            >
              <BadgeWebGL
                metal={badge.metal}
                shape={badge.shape ?? "circle"}
                faceSvg={face.svg}
                faceAspect={face.aspect}
                size={size}
                onUnavailable={fallBackToCss}
              />
            </Suspense>
          </SafeBoundary>
        ) : (
          <div className="h-[300px] w-[300px]" />
        )}
      </div>

      {/* info panel */}
      <div onClick={(e) => e.stopPropagation()} className="relative mt-8 max-w-md px-8 text-center text-white">
        <div className="flex items-center justify-center gap-2">
          <h3 className="font-serif text-3xl">{badge.title}</h3>
          <span className="rounded-full border border-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white/70">
            {st.label}
          </span>
        </div>
        <p className="mt-3 text-sm text-white/70">{badge.blurb}</p>
        <p className="mt-2 text-xs italic text-white/45">{badge.lore}</p>
        {badge.earnedNow === false && badge.progressText && (
          <p className="mt-3 text-xs font-medium text-white/80">{badge.progressText}</p>
        )}
        <p className="mt-6 text-[10px] uppercase tracking-[0.24em] text-white/30">
          Drag to turn · Esc to close
        </p>
      </div>
    </div>
  );
}
