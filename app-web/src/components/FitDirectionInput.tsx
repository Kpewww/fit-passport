"use client";

// FitDirectionInput — how a wearer reports the way a garment sits on them.
//
// Two modes over ONE stored scalar (lib/fitDirection.ts):
//
//   descriptive — five words, tight → loose. The default.
//   numeric     — the same -10..+10 range at finer resolution, as a VAS.
//
// DESIGN CONSTRAINT, not a preference: neither mode is a DRAG SLIDER.
// Funke (Social Science Computer Review, 2016) measured break-off across formats
// that look alike but differ mechanically — point-and-click is two actions,
// drag-and-drop is four. Radio buttons broke off at 1.5%, slider scales at 4.2%,
// and on phones and tablets at 37% versus 2.3%. A handle sitting at rest also
// anchors the answer, and if it starts at a valid value we cannot tell a real
// answer from an untouched control — which would silently corrupt the signal.
//
// So: the descriptive mode is radio-button semantics, and the numeric mode is a
// VAS you TAP (with keyboard arrows for accessibility). Dragging is offered as an
// optional enhancement on the numeric track, but tapping is sufficient and is the
// primary interaction. Nothing here writes React state on pointermove.
//
// See docs/design/closet-signal-and-interaction-cost.md §4bis.

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import {
  DIRECTION_OPTIONS,
  DIRECTION_MIN,
  DIRECTION_MAX,
  clampDirection,
  nearestOption,
  parseScaleMode,
  type FitScaleMode,
} from "@/lib/fitDirection";

// The chosen mode is a PER-USER preference stored server-side, and the control
// appears in several places (add form, edit row, and later the refresh stack), so
// it travels by context rather than being drilled through every intermediate
// component. Switching is sticky per user, never per item — see fitDirection.ts.
type FitScaleCtxValue = { mode: FitScaleMode; setMode: (m: FitScaleMode) => void };
const FitScaleCtx = createContext<FitScaleCtxValue | null>(null);

export function FitScaleProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<FitScaleMode>("descriptive");

  useEffect(() => {
    let alive = true;
    fetch("/api/status")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (alive && j) setModeState(parseScaleMode(j.fitScaleMode));
      })
      .catch(() => {
        /* the default mode is a fine fallback — never block the closet on this */
      });
    return () => {
      alive = false;
    };
  }, []);

  const setMode = useCallback((m: FitScaleMode) => {
    setModeState(m); // optimistic: the control should switch instantly
    fetch("/api/profile/prefs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ fitScaleMode: m }),
    }).catch(() => {
      /* a failed persist just means it resets next visit, not a broken form */
    });
  }, []);

  return <FitScaleCtx.Provider value={{ mode, setMode }}>{children}</FitScaleCtx.Provider>;
}

/** Mode + setter, falling back to the default when no provider is mounted. */
export function useFitScale(): FitScaleCtxValue {
  const ctx = useContext(FitScaleCtx);
  const [local, setLocal] = useState<FitScaleMode>("descriptive");
  return ctx ?? { mode: local, setMode: setLocal };
}

export function FitDirectionInput({
  value,
  onChange,
  id,
}: {
  value: number;
  onChange: (n: number) => void;
  id?: string;
}) {
  const { mode, setMode } = useFitScale();
  const onModeChange = setMode;
  return (
    <div>
      {mode === "descriptive" ? (
        <DescriptiveScale value={value} onChange={onChange} id={id} />
      ) : (
        <NumericScale value={value} onChange={onChange} id={id} />
      )}
      {onModeChange && (
        <button
          type="button"
          onClick={() => onModeChange(mode === "descriptive" ? "numeric" : "descriptive")}
          className="mt-2 text-[11px] text-ink-faint underline decoration-line underline-offset-2 hover:text-ink-soft"
        >
          {mode === "descriptive" ? "Use a number instead" : "Use words instead"}
        </button>
      )}
    </div>
  );
}

/** Five options, tight → loose, radio semantics. One tap, no dragging. */
function DescriptiveScale({
  value,
  onChange,
  id,
}: {
  value: number;
  onChange: (n: number) => void;
  id?: string;
}) {
  const active = nearestOption(value);
  return (
    <div role="radiogroup" aria-label="How this garment fits" id={id}>
      <div className="grid grid-cols-5 gap-1">
        {DIRECTION_OPTIONS.map((o) => {
          const on = o.key === active.key;
          return (
            <button
              key={o.key}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(o.value)}
              title={o.hint}
              className={`rounded-lg border px-1.5 py-2 text-[11px] leading-tight transition-colors ${
                on
                  ? "border-ink bg-ink text-paper font-medium"
                  : "border-line bg-paper-soft text-ink-soft hover:bg-ink/5"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      <p className="mt-1.5 text-[11px] text-ink-faint">{active.hint}</p>
    </div>
  );
}

const TRACK_STEPS = DIRECTION_MAX - DIRECTION_MIN; // 20

/**
 * The signed numeric scale as a VAS: a track you tap. The marker is only drawn
 * once a value has been reported, so "not answered" stays visually distinct from
 * "answered zero" — the defect that makes a resting slider handle unusable as
 * evidence.
 */
function NumericScale({
  value,
  onChange,
  id,
}: {
  value: number;
  onChange: (n: number) => void;
  id?: string;
}) {
  const trackRef = useRef<HTMLDivElement | null>(null);

  const valueAt = useCallback((clientX: number): number => {
    const el = trackRef.current;
    if (!el) return 0;
    const r = el.getBoundingClientRect();
    if (r.width === 0) return 0;
    const t = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
    return clampDirection(DIRECTION_MIN + t * TRACK_STEPS);
  }, []);

  const pct = ((clampDirection(value) - DIRECTION_MIN) / TRACK_STEPS) * 100;
  const label = nearestOption(value).label;

  return (
    <div id={id}>
      <div className="flex items-baseline justify-between text-[11px] text-ink-faint">
        <span>Too tight</span>
        <span className="font-mono text-ink-soft">
          {value > 0 ? `+${value}` : value}
        </span>
        <span>Too loose</span>
      </div>
      <div
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-label="How this garment fits, from -10 too tight to +10 too loose"
        aria-valuemin={DIRECTION_MIN}
        aria-valuemax={DIRECTION_MAX}
        aria-valuenow={clampDirection(value)}
        aria-valuetext={`${value > 0 ? `+${value}` : value} — ${label}`}
        onPointerDown={(e) => onChange(valueAt(e.clientX))}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
            e.preventDefault();
            onChange(clampDirection(value - 1));
          } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
            e.preventDefault();
            onChange(clampDirection(value + 1));
          } else if (e.key === "Home") {
            e.preventDefault();
            onChange(DIRECTION_MIN);
          } else if (e.key === "End") {
            e.preventDefault();
            onChange(DIRECTION_MAX);
          }
        }}
        className="relative mt-1 h-9 cursor-pointer rounded-lg border border-line bg-paper-soft focus:outline-none focus:ring-2 focus:ring-ink/10"
      >
        {/* centre mark — 0 is "just right", and it should read as the anchor */}
        <div className="pointer-events-none absolute inset-y-1.5 left-1/2 w-px -translate-x-1/2 bg-line" />
        {/* tick marks every 5 */}
        {[-5, 5].map((t) => (
          <div
            key={t}
            className="pointer-events-none absolute inset-y-3 w-px bg-line/60"
            style={{ left: `${((t - DIRECTION_MIN) / TRACK_STEPS) * 100}%` }}
          />
        ))}
        <div
          className="pointer-events-none absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-paper bg-ink shadow-sm"
          style={{ left: `${pct}%` }}
        />
      </div>
      <p className="mt-1.5 text-[11px] text-ink-faint">
        Tap the line, or use ← →. <span className="text-ink-soft">0 = just right.</span>
      </p>
    </div>
  );
}
