"use client";

// What the closet page and its on-demand parts share (Session 100, when the page
// was split so the add flow, the edit row and the detail sheet load when opened).

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui";
import { Trash } from "@/components/Icon";
import { garmentLabel } from "@/lib/garments";
import { GarmentIcon } from "@/components/GarmentIcon";
import { DIRECTION_DEFAULT } from "@/lib/fitDirection";
import { colorHex, iconToneOn } from "@/lib/colors";
import { useT } from "@/i18n/client";
import { useGarmentText } from "@/i18n/garment";

export type Item = {
  id: string;
  brand: string;
  displayName: string | null;
  category: string;
  gender: string | null;
  size: string;
  region: string | null;
  fitRating: number;
  fitDirection?: number | null;
  areaNotesJson: string | null;
  color: string | null;
  imageDataUrl: string | null;
  collectionId: string | null;
  sortIndex: number;
  groupId: string | null;
  groupName: string | null;
  createdAt?: string;
  editHistory?: string | null;
  // The garment's OWN measurements, captured from the retailer's chart when the
  // item was added by URL. Null for anything typed in by hand.
  garmentChestCm?: number | null;
  garmentShoulderCm?: number | null;
  garmentSleeveCm?: number | null;
  garmentLengthCm?: number | null;
  garmentMeasuredFrom?: string | null;
  productUrl?: string | null;
};

export type Collection = { id: string; name: string; sortIndex: number; itemCount: number; color?: string | null };

/** One row of the size chart the extractor read, as returned by /api/closet/extract. */
export type SizeRow = {
  label: string;
  chestCm: number | null;
  shoulderCm: number | null;
  sleeveCm: number | null;
  lengthCm: number | null;
};

export type Group = { key: string; label: string; items: Item[]; isVariant: boolean };

// Product line values; their names come from garment.line (messages).
export const GENDERS = ["", "mens", "womens", "unisex"] as const;

export const BLANK = { brand: "", displayName: "", category: "tshirt", gender: "", size: "", fitRating: 5, fitDirection: DIRECTION_DEFAULT, areaNotes: "", color: "", onlineAvailable: true, imageDataUrl: "", region: "" };

export function GenderBadge({ gender }: { gender: string }) {
  const g = useGarmentText();
  // One neutral treatment: the line is information, not a colour code.
  if (!["mens", "womens", "unisex"].includes(gender)) return null;
  return (
    <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-ink-soft ring-1 ring-line" title={g.line(gender)}>
      {g.lineShort(gender)}
    </span>
  );
}

export function ColorDot({ color }: { color: string | null }) {
  const g = useGarmentText();
  const hex = colorHex(color);
  if (!hex) return null;
  return (
    <span
      className="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full ring-1 ring-black/10"
      style={{ backgroundColor: hex }}
      title={color ? g.color(color) : undefined}
    />
  );
}

export function safeNotes(json: string | null): string | undefined {
  if (!json) return undefined;
  try { return JSON.parse(json)?.notes ?? undefined; } catch { return undefined; }
}

// A small square thumbnail: the user's photo if present, else a color-tinted
// glyph. Used in list rows and (larger) in grid tiles.
export function ItemThumb({ item, size }: { item: Item; size: number }) {
  const hex = colorHex(item.color);
  if (item.imageDataUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={item.imageDataUrl} alt="" className="flex-shrink-0 rounded-lg object-cover"
        style={{ width: size, height: size }} />
    );
  }
  return (
    <div className={`flex flex-shrink-0 items-center justify-center rounded-lg border border-line ${iconToneOn(hex) === "light" ? "text-white/90" : "text-ink-soft"}`}
      style={{ width: size, height: size, backgroundColor: hex ?? "#f5f5f5" }}>
      <GarmentIcon category={item.category} size={Math.round(size * 0.55)} />
    </div>
  );
}

// ---------------- Folder view (physical filing metaphor) ----------------
//
// Each COLLECTION is drawn as a real folder — a tabbed, colored sleeve that is
// clearly a different color from the white "file" cards tucked inside it. The
// items stack, each showing just one key-info row, with the front-most file
// fully open. Hover a file to peek at its overview; click to pull it fully out
// onto the "desk" (the detail sheet). A comparison bucket lets you set a few
// files aside to look at together — the way you pull a few things out of a real
// closet when planning an outfit.

export function itemName(it: Item, label: (category: string) => string = garmentLabel): string {
  return it.displayName || `${it.brand} ${label(it.category)}`;
}

// The file pulled fully out onto the desk — a right-side sheet with everything.
// Format an ISO timestamp as a short human date-time.
export function fmtWhen(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

/**
 * The garment's own measurements, when we captured them.
 *
 * Shown rather than kept silently because this is what makes `ease = garment −
 * body` computable for a piece the wearer OWNS AND LIKES — the strongest ease
 * signal available, and until now the extractor read these numbers at add time
 * and threw them away. Displaying them is also the only way the user can tell
 * that we have them, and check them.
 *
 * `garmentMeasuredFrom` is always shown alongside. A measurement read off the
 * retailer's own chart and one produced by the extractor's fallback ladder look
 * identical on screen, and the difference is exactly what `source.sizesFrom`
 * exists to preserve.
 */
export function GarmentMeasurements({ item }: { item: Item }) {
  const t = useT("closet");
  const tm = useT("check");
  const parts = [
    item.garmentChestCm != null && tm("measure.chest", { n: item.garmentChestCm }),
    item.garmentShoulderCm != null && tm("measure.shoulder", { n: item.garmentShoulderCm }),
    item.garmentSleeveCm != null && tm("measure.sleeve", { n: item.garmentSleeveCm }),
    item.garmentLengthCm != null && tm("measure.length", { n: item.garmentLengthCm }),
  ].filter(Boolean) as string[];
  if (parts.length === 0) return null;

  const fromPage = item.garmentMeasuredFrom === "page" || item.garmentMeasuredFrom === "fixture";
  return (
    <div className="mt-1 flex min-w-0 flex-wrap items-center gap-1">
      <span
        className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
          fromPage ? "bg-brand/10 text-brand-dark" : "bg-paper-dim text-ink-faint"
        }`}
        title={fromPage ? t("measuredTitle") : t("estimatedTitle")}
      >
        {fromPage ? t("garmentMeasured") : t("garmentEstimated")}
      </span>
      {parts.map((t) => (
        <span key={t} className="min-w-0 truncate rounded bg-paper-soft px-1.5 py-0.5 text-[10px] tabular-nums text-ink-soft">
          {t}
        </span>
      ))}
    </div>
  );
}

/** A link as PATCH takes it: a full URL, or nothing. */
export function validUrl(raw: string): string | null {
  const v = raw.trim();
  if (!v) return null;
  try {
    return new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`).toString();
  } catch {
    return null;
  }
}

/**
 * A delete that asks once, in place (Session 88e): the button turns into a red
 * "Delete" and a "Cancel" where it stood — no dialog box. A tap anywhere else, or
 * Escape, puts the button back.
 */
export function ConfirmDelete({
  label,
  confirmLabel,
  onConfirm,
  variant = "ghost",
  disabled = false,
  hint,
}: {
  label: string;
  confirmLabel?: string;
  /** What else happens, said beside the buttons (a folder's pieces move to Uncategorized). */
  hint?: string;
  onConfirm: () => void;
  variant?: "ghost" | "secondary" | "link";
  disabled?: boolean;
}) {
  const t = useT("closet");
  const [asking, setAsking] = useState(false);
  const boxRef = useRef<HTMLSpanElement>(null);
  const yesRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!asking) return;
    yesRef.current?.focus();
    // pointerdown, not blur: Safari does not focus a button on click, so a blur
    // would fire before the click and swallow it.
    const away = (e: PointerEvent) => { if (!boxRef.current?.contains(e.target as Node)) setAsking(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setAsking(false); };
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("pointerdown", away); document.removeEventListener("keydown", esc); };
  }, [asking]);

  if (!asking) {
    return variant === "link" ? (
      <button type="button" disabled={disabled} onClick={() => setAsking(true)} className="text-ink-faint transition-colors hover:text-bad disabled:opacity-40">{label}</button>
    ) : (
      <Button size="sm" variant={variant} icon={<Trash size={16} />} disabled={disabled} onClick={() => setAsking(true)}>{label}</Button>
    );
  }
  const small = variant === "link";
  return (
    <span ref={boxRef} className="inline-flex animate-pop-in flex-wrap items-center gap-1.5">
      <button ref={yesRef} type="button" onClick={() => { setAsking(false); onConfirm(); }}
        className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-bad font-semibold text-white transition-colors hover:bg-[#7f2323] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bad/40 focus-visible:ring-offset-1 ${small ? "h-7 px-2.5 text-xs" : "h-9 px-3.5 text-sm"}`}>
        {!small && <Trash size={16} />}
        {confirmLabel ?? t("confirmDelete")}
      </button>
      <button type="button" onClick={() => setAsking(false)}
        className={`whitespace-nowrap rounded-full font-medium text-ink-soft ring-1 ring-line transition-colors hover:text-ink ${small ? "h-7 px-2.5 text-xs" : "h-9 px-3.5 text-sm"}`}>
        {t("cancel")}
      </button>
      {hint && <span className="text-xs text-ink-soft">{hint}</span>}
    </span>
  );
}

export function MoveMenu({
  collections,
  currentId,
  onMove,
}: {
  collections: Collection[];
  currentId: string | null;
  onMove: (collectionId: string) => void;
}) {
  const t = useT("closet");
  const g = useGarmentText();
  return (
    <select
      value={currentId ?? ""}
      onChange={(e) => onMove(e.target.value)}
      className="rounded-lg border border-line px-2 py-1 text-xs text-ink-soft"
      title={t("moveTo")}
      aria-label={t("moveTo")}
    >
      {collections.map((c) => (
        <option key={c.id} value={c.id}>{g.folder(c.name)}</option>
      ))}
    </select>
  );
}

