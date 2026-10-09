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
// VAS you TAP (with keyboard arrows for accessibility). Dragging is an optional
// enhancement on the numeric track (built in Session 98, when the founder found the
// tap-only track stiff), and a typed number is another way in; tapping alone is
// still sufficient. Dragging moves the marker through refs and commits once, on
// release — nothing here writes React state on pointermove. One decimal place.
//
// See docs/design/closet-signal-and-interaction-cost.md §4bis.

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useT } from "@/i18n/client";
import type { DirectionKey } from "@/lib/engineText";
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
// appears in several places (add form, edit row, the refresh stack), so it travels
// by context rather than being drilled through every intermediate component.
// Switching is sticky per user, never per item — see fitDirection.ts.
type FitScaleCtxValue = { mode: FitScaleMode; setMode: (m: FitScaleMode) => void; saveFailed?: boolean };
const FitScaleCtx = createContext<FitScaleCtxValue | null>(null);

export function FitScaleProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<FitScaleMode>("descriptive");
  const [saveFailed, setSaveFailed] = useState(false);
  // Once the wearer has switched, the stored mode arriving late must not undo it
  // (it did: a quick switch was overwritten when /api/status answered).
  const touched = useRef(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/status")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (alive && j && !touched.current) setModeState(parseScaleMode(j.fitScaleMode));
      })
      .catch(() => {
        /* the default mode is a fine fallback — never block the closet on this */
      });
    return () => {
      alive = false;
    };
  }, []);

  const setMode = useCallback((m: FitScaleMode) => {
    touched.current = true;
    setModeState(m); // optimistic: the control should switch instantly
    fetch("/api/profile/prefs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ fitScaleMode: m }),
    })
      .then((r) => setSaveFailed(!r.ok))
      .catch(() => setSaveFailed(true));
  }, []);

  return <FitScaleCtx.Provider value={{ mode, setMode, saveFailed }}>{children}</FitScaleCtx.Provider>;
}

/** Mode + setter, falling back to the default when no provider is mounted. */
export function useFitScale(): FitScaleCtxValue {
  const ctx = useContext(FitScaleCtx);
  const [local, setLocal] = useState<FitScaleMode>("descriptive");
  return ctx ?? { mode: local, setMode: setLocal };
}

/** "+3.5", "-10", "0" — the sign always shown, one decimal only when there is one. */
export function formatDirection(v: number): string {
  const n = clampDirection(v);
  const s = Number.isInteger(n) ? String(n) : n.toFixed(1);
  return n > 0 ? `+${s}` : s;
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
  const { mode, setMode, saveFailed } = useFitScale();
  const t = useT("fitScale");
  return (
    <div>
      {/* The two ways to answer, side by side, so the number is found (Session 98:
          a small link under the words went unnoticed). */}
      <div role="radiogroup" aria-label={t("modeLabel")} className="mb-2 inline-flex rounded-full border border-line bg-white p-0.5 text-[11px] font-medium">
        {(["descriptive", "numeric"] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={mode === m}
            onClick={() => mode !== m && setMode(m)}
            className={`rounded-full px-3 py-1 transition-colors ${mode === m ? "bg-ink text-paper" : "text-ink-soft hover:text-ink"}`}
          >
            {m === "descriptive" ? t("modeWords") : t("modeNumber")}
          </button>
        ))}
      </div>
      {mode === "descriptive" ? (
        <DescriptiveScale value={value} onChange={onChange} id={id} />
      ) : (
        <NumericScale value={value} onChange={onChange} id={id} />
      )}
      {saveFailed && <p className="mt-1.5 text-[11px] text-warn">{t("saveFailed")}</p>}
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
  const t = useT("fitScale");
  const tf = useT("fit");
  const label = (key: string) => tf(`direction.${key as DirectionKey}.label`);
  const hint = (key: string) => tf(`direction.${key as DirectionKey}.hint`);
  return (
    <div role="radiogroup" aria-label={t("groupLabel")} id={id}>
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
              title={hint(o.key)}
              className={`rounded-lg border px-1.5 py-2 text-[11px] leading-tight transition-colors ${
                on
                  ? "border-ink bg-ink text-paper font-medium"
                  : "border-line bg-paper-soft text-ink-soft hover:bg-ink/5"
              }`}
            >
              {label(o.key)}
            </button>
          );
        })}
      </div>
      <p className="mt-1.5 text-[11px] text-ink-faint">{hint(active.key)}</p>
    </div>
  );
}

const TRACK_STEPS = DIRECTION_MAX - DIRECTION_MIN; // 20
const pctOf = (v: number) => ((clampDirection(v) - DIRECTION_MIN) / TRACK_STEPS) * 100;

/**
 * The signed numeric scale: a track you tap or drag, a number you can type, and
 * arrow keys (0.1 a press, 1 with Shift or Page Up/Down). While dragging, only the
 * marker and the readout move (refs); the value is committed once, on release.
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
  const markerRef = useRef<HTMLDivElement | null>(null);
  const readoutRef = useRef<HTMLSpanElement | null>(null);
  const dragRef = useRef<{ value: number } | null>(null);
  const [typed, setTyped] = useState<string | null>(null);

  const valueAt = useCallback((clientX: number): number => {
    const el = trackRef.current;
    if (!el) return 0;
    const r = el.getBoundingClientRect();
    if (r.width === 0) return 0;
    const f = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
    return clampDirection(DIRECTION_MIN + f * TRACK_STEPS);
  }, []);

  const preview = (v: number) => {
    if (markerRef.current) markerRef.current.style.left = `${pctOf(v)}%`;
    if (readoutRef.current) readoutRef.current.textContent = formatDirection(v);
  };

  const t = useT("fitScale");
  const tf = useT("fit");
  const label = tf(`direction.${nearestOption(value).key as DirectionKey}.label`);
  const step = (d: number) => onChange(clampDirection(value + d));

  return (
    <div id={id}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <span ref={readoutRef} className="font-mono text-base font-semibold tabular-nums text-ink">{formatDirection(value)}</span>
          <span className="text-[11px] text-ink-soft">{label}</span>
        </div>
        <input
          type="number"
          inputMode="decimal"
          step={0.1}
          min={DIRECTION_MIN}
          max={DIRECTION_MAX}
          aria-label={t("numberLabel")}
          value={typed ?? String(clampDirection(value))}
          onChange={(e) => setTyped(e.target.value)}
          onBlur={() => {
            if (typed != null && typed.trim() !== "" && Number.isFinite(Number(typed))) onChange(clampDirection(Number(typed)));
            setTyped(null);
          }}
          onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
          className="w-20 rounded-lg border border-line bg-white px-2 py-1 text-right font-mono text-sm tabular-nums text-ink focus:outline-none focus:ring-2 focus:ring-ink/10"
        />
      </div>
      <div
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-label={t("sliderLabel")}
        aria-valuemin={DIRECTION_MIN}
        aria-valuemax={DIRECTION_MAX}
        aria-valuenow={clampDirection(value)}
        aria-valuetext={`${formatDirection(value)} — ${label}`}
        onPointerDown={(e) => {
          e.preventDefault();
          (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
          const v = valueAt(e.clientX);
          dragRef.current = { value: v };
          preview(v);
        }}
        onPointerMove={(e) => {
          if (!dragRef.current) return;
          const v = valueAt(e.clientX);
          dragRef.current.value = v;
          preview(v);
        }}
        onPointerUp={(e) => {
          const d = dragRef.current;
          dragRef.current = null;
          try { (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId); } catch { /* released */ }
          if (d) onChange(d.value);
        }}
        onPointerCancel={() => { dragRef.current = null; preview(value); }}
        onKeyDown={(e) => {
          const big = e.shiftKey ? 1 : 0.1;
          if (e.key === "ArrowLeft" || e.key === "ArrowDown") { e.preventDefault(); step(-big); }
          else if (e.key === "ArrowRight" || e.key === "ArrowUp") { e.preventDefault(); step(big); }
          else if (e.key === "PageDown") { e.preventDefault(); step(-1); }
          else if (e.key === "PageUp") { e.preventDefault(); step(1); }
          else if (e.key === "Home") { e.preventDefault(); onChange(DIRECTION_MIN); }
          else if (e.key === "End") { e.preventDefault(); onChange(DIRECTION_MAX); }
        }}
        className="relative mt-2 h-10 cursor-pointer touch-none select-none rounded-full border border-line bg-gradient-to-r from-[#f3e3cf] via-paper-soft to-[#dfe4f8] focus:outline-none focus:ring-2 focus:ring-ink/10"
      >
        {/* centre mark — 0 is "just right", and it should read as the anchor */}
        <div className="pointer-events-none absolute inset-y-2 left-1/2 w-px -translate-x-1/2 bg-ink/25" />
        {[-5, 5].map((m) => (
          <div key={m} className="pointer-events-none absolute inset-y-3 w-px bg-ink/10" style={{ left: `${pctOf(m)}%` }} />
        ))}
        <div
          ref={markerRef}
          className="pointer-events-none absolute top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-ink shadow-sm"
          style={{ left: `${pctOf(value)}%` }}
        />
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-ink-faint">
        <span>{t("tooTight")} −10</span>
        <span>{tf("direction.just-right.label")} 0</span>
        <span>+10 {t("tooLoose")}</span>
      </div>
      <p className="mt-1.5 text-[11px] text-ink-faint">
        {t.rich("sliderHelp", { em: (c) => <span className="text-ink-soft">{c}</span> })}
      </p>
    </div>
  );
}
