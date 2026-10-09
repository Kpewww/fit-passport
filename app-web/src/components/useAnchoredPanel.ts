"use client";

// Where a pop-over panel goes (Session 98). Opened inside a narrow column (the closet's
// edit sheet), a panel positioned against its button ran off the window's edge and
// was cut off (founder's screenshot). This places it against the WINDOW instead:
// inside both edges, below the button or above it when there is more room there.
// Render the panel `position: fixed` in a portal (document.body) with the style this
// returns; null means a phone, where the caller shows a bottom sheet.

import { useLayoutEffect, useState, type CSSProperties, type RefObject } from "react";

export function useAnchoredPanel(open: boolean, anchor: RefObject<HTMLElement>, width: number, maxHeight = 448): CSSProperties | null {
  const [place, setPlace] = useState<CSSProperties | null>(null);
  useLayoutEffect(() => {
    if (!open) return;
    const at = () => {
      const r = anchor.current?.getBoundingClientRect();
      if (!r) return;
      const W = window.innerWidth, H = window.innerHeight;
      if (W < 640) { setPlace(null); return; }
      const w = Math.min(width, W - 24);
      const left = Math.max(12, Math.min(r.left, W - w - 12));
      const below = H - r.bottom - 20, above = r.top - 20;
      setPlace(below >= Math.min(360, maxHeight) || below >= above
        ? { left, width: w, top: r.bottom + 8, maxHeight: Math.min(maxHeight, below) }
        : { left, width: w, bottom: H - r.top + 8, maxHeight: Math.min(maxHeight, above) });
    };
    at();
    window.addEventListener("resize", at);
    window.addEventListener("scroll", at, true);
    return () => { window.removeEventListener("resize", at); window.removeEventListener("scroll", at, true); };
  }, [open, anchor, width, maxHeight]);
  return place;
}
