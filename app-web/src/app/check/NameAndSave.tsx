"use client";

// Name what was checked, and keep it (Session 100). A chart uploaded on its own
// comes with no brand or name — the shopper adds them here, after the answer. Any
// other check can be kept the same way: the website had no "save to buy" until now,
// only the extension did. Saved to the to-buy list (/api/saved, with this check's
// product and its chart); once bought, the closet's add flow takes it from there
// (/closet?fromSaved=…), which asks the size bought and how it fits.

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui";
import { Basket } from "@/components/Icon";
import { useT } from "@/i18n/client";
import { useGarmentText } from "@/i18n/garment";
import { PICKABLE_CATEGORIES } from "@/lib/garments";
import type { Product } from "./types";

export function NameAndSave({ product, size, startOpen = false }: { product: Product; size: string; startOpen?: boolean }) {
  const t = useT("check");
  const g = useGarmentText();
  const [open, setOpen] = useState(startOpen);
  const [brand, setBrand] = useState(product.brand ?? "");
  const [name, setName] = useState(product.productName ?? "");
  const [category, setCategory] = useState(product.category ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const r = await fetch("/api/saved", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          url: product.url,
          productId: product.id,
          size,
          brand: brand.trim() || null,
          productName: name.trim() || null,
          category: category || null,
        }),
      });
      const j = await r.json().catch(() => ({}));
      const id = j?.item?.id as string | undefined;
      if (id && (r.ok || j?.error === "already-saved")) setSaved(id);
      else setError(typeof j?.message === "string" ? j.message : t("save.failed"));
    } catch {
      setError(t("save.failed"));
    } finally {
      setSaving(false);
    }
  }

  if (saved) {
    return (
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <span className="text-ink">{t("save.done")}</span>
        <Link href="/saved" className="font-medium text-brand hover:underline">{t("save.seeList")}</Link>
        <Link href={`/closet?fromSaved=${encodeURIComponent(saved)}`} className="font-medium text-brand hover:underline">{t("save.bought")}</Link>
      </div>
    );
  }

  if (!open) {
    return (
      <Button size="sm" variant="secondary" icon={<Basket size={16} />} onClick={() => setOpen(true)}>{t("save.open")}</Button>
    );
  }

  const field = "w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-ink/40 focus:outline-none";
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-ink">{t("save.title")}</p>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="grid gap-1 text-xs text-ink-soft">{t("save.brand")}
          <input value={brand} onChange={(e) => setBrand(e.target.value)} maxLength={80} placeholder={t("save.brandPlaceholder")} className={field} />
        </label>
        <label className="grid gap-1 text-xs text-ink-soft">{t("save.name")}
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={200} placeholder={t("save.namePlaceholder")} className={field} />
        </label>
        <label className="grid gap-1 text-xs text-ink-soft">{t("save.kind")}
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={field}>
            <option value="">—</option>
            {PICKABLE_CATEGORIES.map((c) => <option key={c} value={c}>{g.label(c)}</option>)}
          </select>
        </label>
      </div>
      {error && <p role="alert" className="text-sm text-bad">{error}</p>}
      <Button size="sm" icon={<Basket size={16} />} disabled={saving} onClick={save}>
        {saving ? t("save.saving") : t("save.submit", { size })}
      </Button>
    </div>
  );
}
