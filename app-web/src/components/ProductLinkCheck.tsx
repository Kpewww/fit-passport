"use client";

// A closet piece's product link, checked as it is given — Session 98.
//
// The founder: the edit sheet should take the shop's link, try to read the page,
// and either confirm what it found or say how to get it read. The read is the same
// one the add flow's "auto-fill" makes (/api/closet/extract). When the page's chart
// has a row for this piece's size, its garment measurements can be taken in one tap
// — they feed the wearer's own ease target, the reason the add flow captures them.

import { useState } from "react";
import { useT } from "@/i18n/client";
import { inputClass } from "@/components/ui";

export type GarmentFields = {
  garmentChestCm: number | null;
  garmentShoulderCm: number | null;
  garmentSleeveCm: number | null;
  garmentLengthCm: number | null;
  garmentMeasuredFrom: string;
};

type Row = { label: string; chestCm: number | null; shoulderCm: number | null; sleeveCm: number | null; lengthCm: number | null };
type State =
  | { kind: "idle" }
  | { kind: "reading" }
  | { kind: "read"; brand: string | null; row: Row | null; measuredFrom: string | null; labels: string[] }
  | { kind: "unreadable"; host: string | null }
  | { kind: "error" };

export function ProductLinkCheck({
  url,
  onUrl,
  size,
  onGarment,
}: {
  url: string;
  onUrl: (u: string) => void;
  /** This piece's size, to find its row in the page's chart. */
  size: string;
  onGarment: (g: GarmentFields) => void;
}) {
  const t = useT("productLink");
  const [state, setState] = useState<State>({ kind: "idle" });
  const [taken, setTaken] = useState(false);

  async function check(u: string) {
    if (!u.trim()) { setState({ kind: "idle" }); return; }
    setState({ kind: "reading" });
    setTaken(false);
    try {
      const r = await fetch("/api/closet/extract", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: u.trim() }),
      });
      const j = await r.json().catch(() => null);
      if (!r.ok || !j) { setState({ kind: "error" }); return; }
      if (j.result === "unreadable") { setState({ kind: "unreadable", host: j.host ?? null }); return; }
      const rows: Row[] = Array.isArray(j.sizeRows) ? j.sizeRows : [];
      const row = rows.find((x) => x.label.trim().toUpperCase() === size.trim().toUpperCase()) ?? null;
      setState({ kind: "read", brand: j.brand ?? null, row, measuredFrom: j.measuredFrom ?? null, labels: rows.map((x) => x.label) });
    } catch {
      setState({ kind: "error" });
    }
  }

  const cm = (n: number | null) => (n == null ? null : `${n} cm`);

  return (
    <div>
      <input
        className={inputClass}
        type="url"
        inputMode="url"
        placeholder={t("placeholder")}
        value={url}
        onChange={(e) => onUrl(e.target.value)}
        onBlur={(e) => check(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); check((e.target as HTMLInputElement).value); } }}
      />
      <div className="mt-1.5 text-xs" aria-live="polite">
        {state.kind === "reading" && <p className="text-ink-faint">{t("reading")}</p>}
        {state.kind === "error" && <p className="text-warn">{t("error")}</p>}
        {state.kind === "unreadable" && (
          <p className="text-warn">{t("unreadable", { host: state.host ?? "" })}</p>
        )}
        {state.kind === "read" && (
          <div className="rounded-lg bg-ok-tint px-3 py-2 text-ok">
            <p>{t("read")}{state.brand ? ` · ${state.brand}` : ""}</p>
            {state.row && state.measuredFrom ? (
              <div className="mt-1 flex flex-wrap items-center gap-2 text-ink-soft">
                <span>
                  {t("rowFor", { size: state.row.label })}{" "}
                  {[cm(state.row.chestCm) && `${t("chest")} ${cm(state.row.chestCm)}`, cm(state.row.shoulderCm) && `${t("shoulder")} ${cm(state.row.shoulderCm)}`, cm(state.row.lengthCm) && `${t("length")} ${cm(state.row.lengthCm)}`].filter(Boolean).join(" · ")}
                </span>
                <button
                  type="button"
                  disabled={taken}
                  onClick={() => {
                    const row = state.row!;
                    onGarment({ garmentChestCm: row.chestCm, garmentShoulderCm: row.shoulderCm, garmentSleeveCm: row.sleeveCm, garmentLengthCm: row.lengthCm, garmentMeasuredFrom: state.measuredFrom! });
                    setTaken(true);
                  }}
                  className="rounded-full border border-ok/40 bg-white px-2.5 py-0.5 font-medium text-ok disabled:opacity-60"
                >
                  {taken ? t("taken") : t("take")}
                </button>
              </div>
            ) : (
              <p className="mt-1 text-ink-soft">{state.labels.length ? t("noRow", { size }) : t("noChart")}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
