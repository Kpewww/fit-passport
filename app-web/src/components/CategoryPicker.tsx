"use client";

// CategoryPicker — garment types in two levels (Session 98).
//
// The founder: choose a parent, then a type within it ("outerwear, then trench"),
// with every type people wear there, and no wall of words. So the picker shows the
// eleven parents as chips with icons, and only the chosen parent's types below
// them. A type sitting under several parents (a cardigan: knitwear, outerwear,
// tops) is reachable from each. A search box finds any type by any name, either
// language ("开衫", "cardigan", "毛衣开衫"), across parents.
//
// Two forms: `inline` lays the browser out in place (the add-a-piece wizard, which
// has a whole step for it); the default is a button reading "Outerwear · Trench
// coat" that opens it as a panel (edit sheet, outfit rows, batch add), a bottom
// sheet on a phone.
//
// The list itself is lib/garmentTaxonomy.ts; names are i18n garment.cat/parent.
// The browser (parents, types, search) is components/CategoryBrowser.tsx.

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import { GarmentIcon } from "@/components/GarmentIcon";
import { useAnchoredPanel } from "@/components/useAnchoredPanel";
import { CaretDown } from "@/components/Icon";
import { garmentType, homeParentOf, type GarmentParent } from "@/lib/garmentTaxonomy";
import { useT } from "@/i18n/client";
import { useGarmentText } from "@/i18n/garment";

// The browser is what nobody sees until they open it (or reach the wizard's type
// step): its own chunk, so the closet and outfits pages do not carry it up front.
const TypeBrowser = dynamic(() => import("@/components/CategoryBrowser").then((m) => m.TypeBrowser), {
  ssr: false,
  loading: () => <div className="h-64 animate-pulse rounded-xl bg-paper-soft" aria-hidden />,
});

export function CategoryPicker({
  value,
  onChange,
  inline = false,
}: {
  value: string;
  onChange: (v: string) => void;
  inline?: boolean;
}) {
  const t = useT("garment");
  const g = useGarmentText();
  // The parent the person chose it under, so a cardigan picked under outerwear
  // reads "Outerwear · Cardigan", not its home "Knitwear · Cardigan".
  const [via, setVia] = useState<GarmentParent | null>(null);
  const parent = via && garmentType(value)?.parents.includes(via) ? via : homeParentOf(value);
  const [open, setOpen] = useState(false);
  const hostRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  // Placed against the window, not the sheet it sits in (useAnchoredPanel).
  const place = useAnchoredPanel(open, hostRef, 416);

  useEffect(() => {
    if (!open) return;
    const off = (e: PointerEvent) => {
      const n = e.target as Node;
      if (!hostRef.current?.contains(n) && !panelRef.current?.contains(n)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("pointerdown", off);
    window.addEventListener("keydown", esc);
    return () => { window.removeEventListener("pointerdown", off); window.removeEventListener("keydown", esc); };
  }, [open]);

  const pick = (key: string, under: GarmentParent) => {
    setVia(under);
    onChange(key);
    if (!inline) setOpen(false);
  };

  const browser = <TypeBrowser value={value} parent={parent} onPick={pick} />;
  if (inline) return browser;

  return (
    <div ref={hostRef} className="relative min-w-0">
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex h-11 w-full min-w-0 items-center gap-2 rounded-xl border border-line bg-white px-3 text-left text-sm text-ink hover:border-ink/30 focus:outline-none focus:ring-2 focus:ring-ink/10"
      >
        <GarmentIcon category={value} size={18} className="flex-shrink-0 text-ink-soft" />
        <span className="min-w-0 flex-1 truncate">
          {garmentType(value) ? <><span className="text-ink-faint">{g.parent(parent)} · </span>{g.label(value)}</> : value ? g.label(value) : t("picker.choose")}
        </span>
        <CaretDown size={14} className={`flex-shrink-0 text-ink-faint transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && typeof document !== "undefined" && createPortal(
        <>
          {!place && <div aria-hidden onClick={() => setOpen(false)} className="fixed inset-0 z-[60] bg-ink/25" />}
          <div
            ref={panelRef}
            role="dialog"
            aria-label={t("picker.choose")}
            style={place ?? undefined}
            className={`fixed z-[61] overflow-y-auto rounded-2xl border border-line bg-white p-3 shadow-lift ${place ? "" : "inset-x-3 bottom-3 max-h-[78vh]"}`}
          >
            {browser}
            {!place && (
              <div className="mt-3 flex justify-end border-t border-line pt-2.5">
                <button type="button" onClick={() => setOpen(false)} className="h-9 rounded-full bg-ink px-4 text-xs font-medium text-paper">{t("picker.close")}</button>
              </div>
            )}
          </div>
        </>,
        document.body,
      )}
    </div>
  );
}
