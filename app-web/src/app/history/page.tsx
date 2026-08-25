"use client";

import { useEffect, useState } from "react";
import { Button, Card, EmptyState, Field, LinkButton, inputClass } from "@/components/ui";

type Outcome = {
  id: string;
  purchasedSize: string;
  decision: "keep" | "return" | "exchange";
  exchangedForSize: string | null;
  overallFit: number | null;
  notes: string | null;
  createdAt: string;
  product: { id: string; brand: string | null; productName: string | null; category: string | null };
};

type Product = { id: string; brand: string | null; productName: string | null };

export default function HistoryPage() {
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState({
    productId: "", purchasedSize: "", decision: "keep" as "keep" | "return" | "exchange",
    exchangedForSize: "", overallFit: 4, notes: "",
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
        overallFit: form.overallFit,
        notes: form.notes || null,
        areaIssuesJson: Object.keys(areaIssues).length > 0 ? JSON.stringify(areaIssues) : null,
      }),
    });
    setForm({ ...form, purchasedSize: "", notes: "", areaShoulders: "", areaChest: "", areaSleeve: "", areaLength: "" });
    load();
  }

  const noProducts = products.length === 0;

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
        <h1 className="font-serif text-4xl text-ink">Fit history</h1>
        <p className="mt-2 text-ink-soft">
          Record what actually happened. Every keep, return, or exchange becomes ground
          truth that sharpens your future recommendations.
        </p>

        {noProducts ? (
          <div className="mt-6">
            <EmptyState
              title="Nothing to record yet"
              body="Check a product first — then come back here to log whether the recommended size actually fit."
              action={<LinkButton href="/check">Check a product →</LinkButton>}
            />
          </div>
        ) : (
          <Card className="mt-6">
            <form onSubmit={submit} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <Field label="Product">
                    <select className={inputClass} value={form.productId}
                      onChange={(e) => setForm({ ...form, productId: e.target.value })}>
                      <option value="">Pick a product you checked…</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>{p.brand} · {p.productName}</option>
                      ))}
                    </select>
                  </Field>
                </div>
                <Field label="Size purchased">
                  <input className={inputClass} placeholder="M" value={form.purchasedSize}
                    onChange={(e) => setForm({ ...form, purchasedSize: e.target.value })} />
                </Field>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Decision">
                  <select className={inputClass} value={form.decision}
                    onChange={(e) => setForm({ ...form, decision: e.target.value as typeof form.decision })}>
                    <option value="keep">Kept</option>
                    <option value="return">Returned</option>
                    <option value="exchange">Exchanged</option>
                  </select>
                </Field>
                <Field label="Exchanged for">
                  <input className={inputClass} placeholder="L" value={form.exchangedForSize}
                    disabled={form.decision !== "exchange"}
                    onChange={(e) => setForm({ ...form, exchangedForSize: e.target.value })} />
                </Field>
                <Field label="Overall fit">
                  <select className={inputClass} value={form.overallFit}
                    onChange={(e) => setForm({ ...form, overallFit: Number(e.target.value) })}>
                    {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}/5</option>)}
                  </select>
                </Field>
              </div>

              <fieldset className="rounded-xl border border-neutral-200 p-3">
                <legend className="px-1 text-xs uppercase tracking-widest text-ink-faint">
                  Area issues (optional)
                </legend>
                <div className="grid gap-3 sm:grid-cols-4">
                  {([
                    ["shoulders", "areaShoulders"],
                    ["chest", "areaChest"],
                    ["sleeve", "areaSleeve"],
                    ["length", "areaLength"],
                  ] as const).map(([area, key]) => (
                    <label key={area} className="text-sm">
                      <span className="mb-1 block capitalize text-ink-soft">{area}</span>
                      <select className={inputClass} value={form[key]}
                        onChange={(e) => setForm({ ...form, [key]: e.target.value })}>
                        <option value="">—</option>
                        {["tight", "ok", "loose", "short", "long"].map((v) => (
                          <option key={v} value={v}>{v}</option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>
              </fieldset>

              <Field label="Notes">
                <textarea className={inputClass} rows={2} value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Anything the size labels can't capture." />
              </Field>

              <Button type="submit" disabled={!form.productId || !form.purchasedSize}>
                Record outcome
              </Button>
            </form>
          </Card>
        )}

        {/* Timeline */}
        {outcomes.length > 0 && (
          <div className="mt-8 space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-ink-faint">
              Recorded outcomes
            </h2>
            {outcomes.map((o) => (
              <Card key={o.id} className="!p-4 animate-fade-in-up">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-ink">
                    {o.product.brand} · {o.product.productName} · size {o.purchasedSize}
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    o.decision === "keep" ? "bg-green-100 text-green-800"
                      : o.decision === "return" ? "bg-red-100 text-red-800"
                        : "bg-amber-100 text-amber-800"
                  }`}>
                    {o.decision}{o.exchangedForSize ? ` → ${o.exchangedForSize}` : ""}
                  </span>
                </div>
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
