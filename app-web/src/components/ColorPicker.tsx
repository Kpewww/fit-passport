"use client";

// Choosing a colour without typing one — Session 98.
//
// The founder: a colour should be picked, not written. Twenty swatches
// (lib/colors.ts COLOR_PRESETS, named so they read in both languages), a hex box
// for an exact value ("#1f2a44" or "1f2a44"), and the system colour wheel. A typed
// name is no longer accepted; names saved before still show (colorHex reads both).
//
// No <label> wraps the grid: a label forwards a click on a gap to its first button,
// which picked black (see ui.tsx Field `as`).

import { useEffect, useRef, useState } from "react";
import { COLOR_PRESETS, colorHex } from "@/lib/colors";
import { PaletteIcon } from "@/components/Icon";
import { useT } from "@/i18n/client";
import { useGarmentText } from "@/i18n/garment";

const HEX = /^#?([0-9a-f]{6})$/i;

export function ColorPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const t = useT("colorPicker");
  const g = useGarmentText();
  const hex = colorHex(value);
  const [typed, setTyped] = useState(hex ?? "");
  useEffect(() => { setTyped(hex ?? ""); }, [hex]);
  const preset = COLOR_PRESETS.find((c) => c.name.toLowerCase() === value.toLowerCase());

  return (
    <div className="space-y-2.5">
      <div className="grid grid-cols-10 gap-1.5" role="radiogroup" aria-label={t("swatches")}>
        {COLOR_PRESETS.map((c) => {
          const on = preset?.name === c.name;
          return (
            <button
              key={c.name}
              type="button"
              role="radio"
              aria-checked={on}
              title={g.color(c.name)}
              aria-label={g.color(c.name)}
              onClick={() => onChange(on ? "" : c.name)}
              className={`h-7 w-7 rounded-full border transition-transform hover:scale-110 ${on ? "scale-110 border-brand ring-2 ring-brand/40" : "border-line"}`}
              style={{ backgroundColor: c.hex }}
            />
          );
        })}
      </div>
      <div className="flex items-center gap-2">
        <span aria-hidden className="h-9 w-9 flex-shrink-0 rounded-lg border border-line" style={{ backgroundColor: hex ?? "transparent" }} />
        <input
          className="h-9 w-28 rounded-lg border border-line bg-white px-2.5 font-mono text-sm uppercase text-ink placeholder:normal-case placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-ink/10"
          placeholder="#1F2A44"
          aria-label={t("hex")}
          value={typed}
          maxLength={7}
          onChange={(e) => {
            setTyped(e.target.value);
            const m = e.target.value.trim().match(HEX);
            if (m) onChange(`#${m[1].toLowerCase()}`);
          }}
        />
        <span className="relative flex h-9 w-9 flex-shrink-0 cursor-pointer items-center justify-center rounded-lg border border-line bg-paper-soft" title={t("wheel")}>
          <input
            type="color"
            aria-label={t("wheel")}
            value={hex ?? "#9ca3af"}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
          <PaletteIcon size={16} className="pointer-events-none text-ink-soft" />
        </span>
        {value && (
          <span className="min-w-0 truncate text-xs text-ink-soft">
            {preset ? g.color(preset.name) : hex?.toUpperCase()}
            <button type="button" onClick={() => onChange("")} className="ml-2 text-ink-faint hover:text-bad">{t("clear")}</button>
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * The same picker behind a swatch button, for rows with no room for a grid (an
 * outfit's pieces). The panel closes on a pick or a click outside it.
 */
export function ColorSwatchButton({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const t = useT("colorPicker");
  const g = useGarmentText();
  const [open, setOpen] = useState(false);
  const hostRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const off = (e: PointerEvent) => { if (!hostRef.current?.contains(e.target as Node)) setOpen(false); };
    window.addEventListener("pointerdown", off);
    return () => window.removeEventListener("pointerdown", off);
  }, [open]);
  const hex = colorHex(value);
  const preset = COLOR_PRESETS.find((c) => c.name.toLowerCase() === value.toLowerCase());
  return (
    <div ref={hostRef} className="relative min-w-0">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex h-11 w-full min-w-0 items-center gap-2.5 rounded-full border border-line bg-white px-3.5 text-left text-sm hover:border-ink/30"
      >
        <span aria-hidden className="h-5 w-5 flex-shrink-0 rounded-full border border-line" style={{ background: hex ?? "repeating-conic-gradient(#e5e5e5 0 25%, #fff 0 50%) 50% / 8px 8px" }} />
        <span className={`min-w-0 truncate ${value ? "text-ink" : "text-ink-faint"}`}>
          {preset ? g.color(preset.name) : hex ? hex.toUpperCase() : t("choose")}
        </span>
      </button>
      {open && (
        <div className="absolute left-0 top-full z-30 mt-2 w-[19rem] rounded-2xl border border-line bg-white p-3 shadow-lift">
          <ColorPicker value={value} onChange={(v) => { onChange(v); if (COLOR_PRESETS.some((c) => c.name === v)) setOpen(false); }} />
        </div>
      )}
    </div>
  );
}
