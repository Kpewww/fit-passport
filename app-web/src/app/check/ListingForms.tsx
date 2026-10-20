"use client";

// Forms /check shows only for some answers (split out of page.tsx in Session 100):
// the garment-type question, and the seller's measurements for a one-off listing.

import { useState } from "react";
import { Button, Card } from "@/components/ui";
import { useT } from "@/i18n/client";
import { useGarmentText } from "@/i18n/garment";
import { PICKABLE_CATEGORIES } from "@/lib/garments";

export type SellerInput = { typed: Array<{ field: "chest" | "waist" | "length"; value: number; unit: "in" | "cm"; flat: boolean }>; category?: "top" | "bottom" };

// "What kind of garment is this?" — the website's twin of the popup's picker
// (Session 85b). The choices are the categories the engine can score.
export function CategoryPicker({ onPick }: { onPick: (category: string) => void }) {
  const t = useT("check");
  const g = useGarmentText();
  const [category, setCategory] = useState<string>(PICKABLE_CATEGORIES[0]);
  return (
    <Card className="mt-6">
      <h2 className="text-h3 text-ink">{t("pickCategory.title")}</h2>
      <p className="mt-1 text-sm text-ink-soft">{t("pickCategory.intro")}</p>
      <form
        onSubmit={(e) => { e.preventDefault(); onPick(category); }}
        className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
      >
        <label className="grid flex-1 gap-1 text-xs text-ink-soft">{t("pickCategory.label")}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink focus:border-ink/40 focus:outline-none"
          >
            {PICKABLE_CATEGORIES.map((c) => <option key={c} value={c}>{g.label(c)}</option>)}
          </select>
        </label>
        <Button type="submit">{t("pickCategory.submit")}</Button>
      </form>
    </Card>
  );
}

export function SellerMeasureForm({ onSubmit, askCategory = false }: { onSubmit: (s: SellerInput) => void; askCategory?: boolean }) {
  const t = useT("check");
  const [chest, setChest] = useState("");
  const [waist, setWaist] = useState("");
  const [length, setLength] = useState("");
  const [unit, setUnit] = useState<"in" | "cm">("in");
  const [category, setCategory] = useState<"" | "top" | "bottom">(askCategory ? "top" : "");
  const [need, setNeed] = useState(false);
  function submit(e: React.FormEvent) {
    e.preventDefault();
    const typed: SellerInput["typed"] = [];
    const add = (v: string, field: "chest" | "waist" | "length", flat: boolean) => {
      const n = parseFloat(v);
      if (n > 0) typed.push({ field, value: n, unit, flat });
    };
    add(chest, "chest", true);
    add(waist, "waist", true);
    add(length, "length", false);
    if (!typed.length) { setNeed(true); return; }
    onSubmit({ typed, category: category || undefined });
  }
  const num = "w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink focus:border-ink/40 focus:outline-none";
  return (
    <Card className="mt-6">
      <h2 className="text-h3 text-ink">{t("measureForm.title")}</h2>
      <p className="mt-1 text-sm text-ink-soft">{t("measureForm.intro")}</p>
      <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-xs text-ink-soft">{t("measureForm.chestFlat")}
          <input type="number" inputMode="decimal" min={1} max={200} step={0.25} className={num} value={chest} onChange={(e) => setChest(e.target.value)} />
        </label>
        <label className="grid gap-1 text-xs text-ink-soft">{t("measureForm.waistFlat")}
          <input type="number" inputMode="decimal" min={1} max={200} step={0.25} className={num} value={waist} onChange={(e) => setWaist(e.target.value)} />
        </label>
        <label className="grid gap-1 text-xs text-ink-soft">{t("measureForm.length")}
          <input type="number" inputMode="decimal" min={1} max={200} step={0.25} className={num} value={length} onChange={(e) => setLength(e.target.value)} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-1 text-xs text-ink-soft">{t("measureForm.unit")}
            <select className={num} value={unit} onChange={(e) => setUnit(e.target.value as "in" | "cm")}>
              <option value="in">{t("measureForm.inches")}</option>
              <option value="cm">{t("measureForm.cm")}</option>
            </select>
          </label>
          <label className="grid gap-1 text-xs text-ink-soft">{t("measureForm.category")}
            <select className={num} value={category} onChange={(e) => setCategory(e.target.value as "" | "top" | "bottom")}>
              <option value="">{t("measureForm.categoryAuto")}</option>
              <option value="top">{t("measureForm.top")}</option>
              <option value="bottom">{t("measureForm.bottom")}</option>
            </select>
          </label>
        </div>
        {need && <p role="alert" className="text-sm text-bad sm:col-span-2">{t("measureForm.needOne")}</p>}
        <div className="sm:col-span-2">
          <Button type="submit">{t("measureForm.submit")}</Button>
        </div>
      </form>
    </Card>
  );
}

