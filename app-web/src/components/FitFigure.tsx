"use client";

// FitFigure — a schematic drawing of the gap between a body and a garment.
//
// WHAT THIS IS: a diagram of the arithmetic the engine already performs. For each
// size it draws the wearer's silhouette and the garment's silhouette around it,
// so the ease (garment − body) is something you SEE rather than read.
//
// WHAT THIS IS DELIBERATELY NOT: a try-on preview. docs/design/fit-algorithm-
// research.md §1 opens with the finding that every mainstream image-based virtual
// try-on transfers APPEARANCE, NOT FIT — Google's own TryOnDiffusion page says
// "we don't promise fit" — and concludes that size recommendation must stay
// separate from any try-on visual. A figure that looked like a person wearing
// clothes would quietly make exactly the promise the research says nobody can
// keep. So this stays abstract, and the centimetre number is printed beside the
// picture: the drawing carries the gestalt, the number carries the truth.
//
// SCALE HONESTY: the silhouettes are drawn to TRUE proportion — no exaggerated
// gap. The viewBox is tight around the torso so a 10 cm difference in
// circumference is legible without being amplified.
//
// PERFORMANCE: no pointer tracking of any kind. Switching size is a discrete tap
// and the transition is CSS. This is on purpose — see
// docs/memory/project-fit-passport-performance.md for the two times a
// pointer-driven visual re-rendered React 60-120x/second in this codebase.

import { useMemo, useState } from "react";

export type FigureSize = {
  label: string;
  chestCm: number | null;
  shoulderCm: number | null;
};

export type FigureBody = {
  chestCm: number | null;
  shoulderCm: number | null;
  /** True when the body numbers are a regional-average prior, not the wearer's. */
  estimated?: boolean;
};

// Circumference (cm) → half-width in viewBox units. Chosen so a typical adult
// chest fills a readable share of the frame; a 10 cm circumference difference is
// then ~3 units per side against a ~30-unit half-width, i.e. visible at a glance.
const CM_TO_HALF = 0.3125;

const VIEW_W = 100;
const VIEW_H = 132;
const CX = VIEW_W / 2;

const SHOULDER_Y = 30;
const WAIST_Y = 96;

function halfWidth(cm: number): number {
  // Clamp so an absurd value can't draw outside the frame.
  return Math.max(6, Math.min(46, cm * CM_TO_HALF));
}

/** Torso outline: shoulders tapering to a waist. */
function torsoPath(shoulderHalf: number, waistHalf: number): string {
  return [
    `M ${CX - shoulderHalf} ${SHOULDER_Y}`,
    `C ${CX - shoulderHalf} ${SHOULDER_Y + 22}, ${CX - waistHalf} ${WAIST_Y - 26}, ${CX - waistHalf} ${WAIST_Y}`,
    `L ${CX + waistHalf} ${WAIST_Y}`,
    `C ${CX + waistHalf} ${WAIST_Y - 26}, ${CX + shoulderHalf} ${SHOULDER_Y + 22}, ${CX + shoulderHalf} ${SHOULDER_Y}`,
    "Z",
  ].join(" ");
}

export function FitFigure({
  body,
  sizes,
  bestLabel,
  className,
}: {
  body: FigureBody;
  sizes: FigureSize[];
  bestLabel?: string;
  className?: string;
}) {
  // Only sizes with a garment chest can be drawn — the rest have nothing to show.
  const drawable = useMemo(() => sizes.filter((s) => s.chestCm != null), [sizes]);
  const initial = drawable.find((s) => s.label === bestLabel) ?? drawable[0];
  const [selected, setSelected] = useState<string | null>(initial?.label ?? null);

  if (body.chestCm == null || drawable.length === 0) return null;

  const current = drawable.find((s) => s.label === selected) ?? drawable[0];
  const bodyChest = body.chestCm;
  const garmentChest = current.chestCm!;
  const ease = garmentChest - bodyChest;

  const bodyHalf = halfWidth(bodyChest);
  const garmentHalf = halfWidth(garmentChest);
  // The waist is drawn narrower than the chest purely so the shape reads as a
  // torso; it carries no measurement claim, so it is a fixed ratio of the chest.
  const bodyWaistHalf = bodyHalf * 0.82;
  const garmentWaistHalf = garmentHalf * 0.82;

  const shoulderEase =
    body.shoulderCm != null && current.shoulderCm != null
      ? current.shoulderCm - body.shoulderCm
      : null;

  return (
    <div className={className}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          className="h-44 w-auto shrink-0"
          role="img"
          aria-label={`${current.label}: garment chest ${garmentChest} cm against your ${bodyChest} cm, ${formatEase(ease)} of room`}
        >
          {/* garment outline — the thing being considered */}
          <path
            d={torsoPath(garmentHalf, garmentWaistHalf)}
            className="fill-brand/10 stroke-brand"
            strokeWidth={1.4}
            strokeLinejoin="round"
            style={{ transition: "d 220ms ease-out" }}
          />
          {/* body silhouette — solid, because it is the fixed fact here */}
          <path
            d={torsoPath(bodyHalf, bodyWaistHalf)}
            className="fill-ink/85 stroke-ink"
            strokeWidth={0.8}
            strokeLinejoin="round"
          />
          {/* head + neck, so the shape reads as a person rather than a vase */}
          <circle cx={CX} cy={14} r={8} className="fill-ink/85" />
          <rect x={CX - 3} y={21} width={6} height={7} className="fill-ink/85" />
          {/* the ease gap, called out on one side only so it stays quiet */}
          {Math.abs(ease) >= 1 && (
            <>
              <line
                x1={CX - bodyHalf}
                y1={SHOULDER_Y + 30}
                x2={CX - garmentHalf}
                y2={SHOULDER_Y + 30}
                className="stroke-brand"
                strokeWidth={0.8}
                strokeDasharray="2 1.5"
              />
              <circle cx={CX - bodyHalf} cy={SHOULDER_Y + 30} r={1.2} className="fill-brand" />
              <circle cx={CX - garmentHalf} cy={SHOULDER_Y + 30} r={1.2} className="fill-brand" />
            </>
          )}
        </svg>

        <div className="min-w-0 flex-1">
          <p className="text-[11px] uppercase tracking-editorial text-ink-faint">
            Room in the chest
          </p>
          <p className="mt-0.5 font-serif text-3xl text-ink">{formatEase(ease)}</p>
          <p className="mt-1 text-xs text-ink-soft">
            {current.label} measures <span className="font-medium text-ink">{garmentChest} cm</span> around
            the chest. {body.estimated ? "Estimated body" : "Yours"} is{" "}
            <span className="font-medium text-ink">{bodyChest} cm</span>.
          </p>
          {shoulderEase != null && (
            <p className="mt-1 text-xs text-ink-soft">
              Shoulders: {formatEase(shoulderEase)} ({current.shoulderCm} cm vs {body.shoulderCm} cm).
            </p>
          )}
          {body.estimated && (
            <p className="mt-1.5 text-[11px] text-amber-700">
              Your body numbers are a regional estimate, so this drawing is too. Add your
              measurements to make it real.
            </p>
          )}
        </div>
      </div>

      {drawable.length > 1 && (
        <div className="mt-3">
          <div className="flex flex-wrap gap-1.5">
            {drawable.map((s) => {
              const on = s.label === current.label;
              return (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => setSelected(s.label)}
                  aria-pressed={on}
                  className={`rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
                    on
                      ? "border-ink bg-ink text-paper font-medium"
                      : "border-line bg-paper-soft text-ink-soft hover:bg-ink/5"
                  }`}
                >
                  {s.label}
                  {s.label === bestLabel && <span className={on ? "opacity-70" : "text-brand"}> ·</span>}
                </button>
              );
            })}
          </div>
          <p className="mt-1.5 text-[11px] text-ink-faint">
            Tap a size to compare. Drawn to scale — the outline is the garment, the solid
            shape is you. Not a preview of how it will look.
          </p>
        </div>
      )}
    </div>
  );
}

function formatEase(cm: number): string {
  const r = Math.round(cm * 10) / 10;
  if (r > 0) return `+${r} cm`;
  if (r < 0) return `${r} cm`;
  return "0 cm";
}
