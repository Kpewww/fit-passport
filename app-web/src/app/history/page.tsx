"use client";

import { useEffect, useState } from "react";
import { Button, Card, EmptyState, Field, LinkButton, inputClass } from "@/components/ui";
import { ArrowRight } from "@/components/Icon";
import { FitDirectionInput } from "@/components/FitDirectionInput";
import { nearestOption } from "@/lib/fitDirection";
import { useT } from "@/i18n/client";
import type { DirectionKey } from "@/lib/engineText";

type Outcome = {
  id: string;
  purchasedSize: string;
  decision: "keep" | "return" | "exchange";
  exchangedForSize: string | null;
  overallFit: number | null;
  fitDirection: number | null;
  notes: string | null;
  createdAt: string;
  product: { id: string; brand: string | null; productName: string | null; category: string | null };
};

type Product = { id: string; brand: string | null; productName: string | null };

export default function HistoryPage() {
  const t = useT("history");
  const tf = useT("fit");
  // The fit a record states, in the reader's language ("a bit snug" / "略紧").
  const fitWord = (n: number | null) =>
    n == null ? null : tf(`direction.${nearestOption(n).key as DirectionKey}.label`).toLowerCase();
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState({
    productId: "", purchasedSize: "", decision: "keep" as "keep" | "return" | "exchange",
    exchangedForSize: "", fitDirection: 0, fitChosen: false, notes: "",
    areaShoulders: "", areaChest: "", areaSleeve: "", areaLength: "",
  });

  async function load() {
    const [o, prods] = await Promise.all([
      fetch("/api/outcome").then((r) => r.json()),
      fetch("/api/products").then((r) => r.json()).catch(() => ({ products: [] })),
    ]);
    setOutcomes(o.outcomes);
    setProducts(prods.products ?? []);
  }
  useEffect(() => { load(); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.productId || !form.purchasedSize) return;
    const areaIssues: Record<string, string> = {};
    if (form.areaShoulders) areaIssues.shoulders = form.areaShoulders;
    if (form.areaChest) areaIssues.chest = form.areaChest;
    if (form.areaSleeve) areaIssues.sleeve = form.areaSleeve;
    if (form.areaLength) areaIssues.length = form.areaLength;

    await fetch("/api/outcome", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        productId: form.productId,
        purchasedSize: form.purchasedSize,
        decision: form.decision,
        exchangedForSize: form.exchangedForSize || null,
        // A keep may rest on "just right" — kept already implies it fit, and that is
        // the modal answer (DIRECTION.default). A return or exchange may not: the
        // form will not submit until they say which way it was wrong.
        fitDirection: form.decision === "keep" || form.fitChosen ? form.fitDirection : null,
        notes: form.notes || null,
        areaIssuesJson: Object.keys(areaIssues).length > 0 ? JSON.stringify(areaIssues) : null,
      }),
    });
    setForm({ ...form, purchasedSize: "", notes: "", fitDirection: 0, fitChosen: false, areaShoulders: "", areaChest: "", areaSleeve: "", areaLength: "" });
    load();
  }

  const noProducts = products.length === 0;

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
        <h1 className="font-serif text-h1 text-ink">{t("title")}</h1>
        <p className="mt-2 text-ink-soft">{t("lede")}</p>

        {noProducts ? (
          <div className="mt-6">
            <EmptyState
              title={t("emptyTitle")}
              body={t("emptyBody")}
              action={<LinkButton href="/check">{t("emptyCta")} <ArrowRight size={14} className="-mt-px inline" /></LinkButton>}
            />
          </div>
        ) : (
          <Card className="mt-6">
            <form onSubmit={submit} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <Field label={t("product")}>
                    <select className={inputClass} value={form.productId}
                      onChange={(e) => setForm({ ...form, productId: e.target.value })}>
                      <option value="">{t("pickProduct")}</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>{p.brand} · {p.productName}</option>
                      ))}
                    </select>
                  </Field>
                </div>
                <Field label={t("sizePurchased")}>
                  <input className={inputClass} placeholder="M" value={form.purchasedSize}
                    onChange={(e) => setForm({ ...form, purchasedSize: e.target.value })} />
                </Field>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={t("decision")}>
                  <select className={inputClass} value={form.decision}
                    onChange={(e) => setForm({ ...form, decision: e.target.value as typeof form.decision })}>
                    <option value="keep">{t("kept")}</option>
                    <option value="return">{t("returned")}</option>
                    <option value="exchange">{t("exchanged")}</option>
                  </select>
                </Field>
                <Field label={t("exchangedFor")}>
                  <input className={inputClass} placeholder="L" value={form.exchangedForSize}
                    disabled={form.decision !== "exchange"}
                    onChange={(e) => setForm({ ...form, exchangedForSize: e.target.value })} />
                </Field>

              </div>

              {/* How it fit — the signed scale the closet uses. It replaced a 1–5
                  select that defaulted to 4, so an untouched form was stored as a
                  good fit and a return never said which way it was wrong. */}
              <div>
                <p className="mb-1.5 text-sm font-medium text-ink">
                  {t("howFit")}
                  {form.decision !== "keep" && !form.fitChosen && (
                    <span className="ml-2 font-normal text-ink-faint">{t("chooseOne")}</span>
                  )}
                </p>
                <FitDirectionInput
                  value={form.fitDirection}
                  onChange={(n) => setForm({ ...form, fitDirection: n, fitChosen: true })}
                />
              </div>

              <fieldset className="rounded-xl border border-line p-3">
                <legend className="px-1 text-xs uppercase tracking-widest text-ink-faint">
                  {t("areaIssues")}
                </legend>
                <div className="grid gap-3 sm:grid-cols-4">
                  {([
                    ["shoulders", "areaShoulders"],
                    ["chest", "areaChest"],
                    ["sleeve", "areaSleeve"],
                    ["length", "areaLength"],
                  ] as const).map(([area, key]) => (
                    <label key={area} className="text-sm">
                      <span className="mb-1 block capitalize text-ink-soft">{t(`area.${area}`)}</span>
                      <select className={inputClass} value={form[key]}
                        onChange={(e) => setForm({ ...form, [key]: e.target.value })}>
                        <option value="">—</option>
                        {(["tight", "ok", "loose", "short", "long"] as const).map((v) => (
                          // The stored value stays the English word brand bias reads.
                          <option key={v} value={v}>{t(`areaValue.${v}`)}</option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>
              </fieldset>

              <Field label={t("notes")}>
                <textarea className={inputClass} rows={2} value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder={t("notesPlaceholder")} />
              </Field>

              <Button
                type="submit"
                disabled={
                  !form.productId || !form.purchasedSize ||
                  (form.decision !== "keep" && !form.fitChosen) ||
                  (form.decision === "exchange" && !form.exchangedForSize.trim())
                }
              >
                {t("submit")}
              </Button>
            </form>
          </Card>
        )}

        {/* Timeline */}
        {outcomes.length > 0 && (
          <div className="mt-8 space-y-2">
            <h2 className="text-h3 font-semibold text-ink">
              {t("recorded")}
            </h2>
            {outcomes.map((o) => (
              <Card key={o.id} className="!p-4 animate-fade-in-up">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-ink">
                    {t("sizeLine", {
                      product: [o.product.brand, o.product.productName].filter(Boolean).join(" · "),
                      size: o.purchasedSize,
                    })}
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    o.decision === "keep" ? "bg-ok-tint text-ok"
                      : o.decision === "return" ? "bg-bad-tint text-bad"
                        : "bg-warn-tint text-warn"
                  }`}>
                    {(() => {
                      const d = t(o.decision === "keep" ? "decisionKeep" : o.decision === "return" ? "decisionReturn" : "decisionExchange");
                      return o.exchangedForSize ? t("forSize", { decision: d, size: o.exchangedForSize }) : d;
                    })()}
                  </span>
                </div>
                {fitWord(o.fitDirection) && (
                  <p className="mt-1 text-sm text-ink-soft">{t("fitLine", { fit: fitWord(o.fitDirection)! })}</p>
                )}
                {o.notes && <p className="mt-1 text-sm text-ink-soft">{o.notes}</p>}
                <p className="mt-1 text-xs text-ink-faint">
                  {new Date(o.createdAt).toLocaleString()}
                </p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
