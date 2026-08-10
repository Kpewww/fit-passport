"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Field, LinkButton, inputClass } from "@/components/ui";

type Profile = {
  heightCm: number | null;
  weightKg: number | null;
  chestCm: number | null;
  waistCm: number | null;
  hipCm: number | null;
  shoulderCm: number | null;
  sleeveCm: number | null;
  inseamCm: number | null;
  preferredFit: "slim" | "regular" | "relaxed" | "oversized";
  region: "US" | "EU" | "UK" | "JP" | "CN";
  notes: string | null;
};

const EMPTY: Profile = {
  heightCm: null, weightKg: null, chestCm: null, waistCm: null, hipCm: null,
  shoulderCm: null, sleeveCm: null, inseamCm: null,
  preferredFit: "regular", region: "US", notes: "",
};

const FIT_OPTIONS: Array<{ v: Profile["preferredFit"]; label: string; desc: string }> = [
  { v: "slim", label: "Slim", desc: "Close to the body" },
  { v: "regular", label: "Regular", desc: "Standard · default" },
  { v: "relaxed", label: "Relaxed", desc: "Room to move" },
  { v: "oversized", label: "Oversized", desc: "Deliberately big" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile>(EMPTY);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => {
        if (d.profile) setProfile({ ...EMPTY, ...d.profile });
      });
  }, []);

  function update<K extends keyof Profile>(k: K, v: Profile[K]) {
    setProfile((p) => ({ ...p, [k]: v }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(profile),
    });
    setStatus(res.ok ? "saved" : "error");
  }

  const fields: Array<{ k: keyof Profile; label: string; unit: string; key?: boolean }> = [
    { k: "chestCm", label: "Chest", unit: "cm", key: true },
    { k: "heightCm", label: "Height", unit: "cm" },
    { k: "weightKg", label: "Weight", unit: "kg" },
    { k: "waistCm", label: "Waist", unit: "cm" },
    { k: "shoulderCm", label: "Shoulder width", unit: "cm" },
    { k: "sleeveCm", label: "Sleeve length", unit: "cm" },
    { k: "hipCm", label: "Hip", unit: "cm" },
    { k: "inseamCm", label: "Inseam", unit: "cm" },
  ];

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="text-3xl font-bold text-ink">Your Fit Passport</h1>
        <p className="mt-2 text-ink-soft">
          Two things matter most: your <strong>preferred fit</strong> and your{" "}
          <strong>chest</strong>. Everything else is optional — skip anything you don&apos;t know.
        </p>

        <form onSubmit={save} className="mt-8 space-y-5">
          {/* Preferred fit — the highest-signal, lowest-effort input */}
          <Card>
            <p className="mb-3 text-sm font-medium text-ink">
              How do you like clothes to fit?
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {FIT_OPTIONS.map((o) => {
                const active = profile.preferredFit === o.v;
                return (
                  <button
                    key={o.v}
                    type="button"
                    onClick={() => update("preferredFit", o.v)}
                    className={`rounded-xl border p-3 text-left transition-all ${
                      active
                        ? "border-brand bg-brand-tint ring-1 ring-brand"
                        : "border-neutral-300 hover:border-neutral-400"
                    }`}
                  >
                    <div className="text-sm font-semibold text-ink">{o.label}</div>
                    <div className="mt-0.5 text-xs text-ink-faint">{o.desc}</div>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Measurements */}
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium text-ink">Measurements</p>
              <div className="text-xs">
                <label className="mr-2 text-ink-faint">Region</label>
                <select
                  value={profile.region}
                  onChange={(e) => update("region", e.target.value as Profile["region"])}
                  className="rounded-lg border border-neutral-300 px-2 py-1"
                >
                  {["US", "EU", "UK", "JP", "CN"].map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {fields.map((f) => (
                <Field
                  key={f.k}
                  label={`${f.label} (${f.unit})`}
                  hint={f.key ? "most useful" : undefined}
                >
                  <input
                    type="number"
                    step="0.1"
                    value={(profile[f.k] as number | null) ?? ""}
                    onChange={(e) => {
                      const v = e.target.value === "" ? null : Number(e.target.value);
                      update(f.k, v as Profile[typeof f.k]);
                    }}
                    className={inputClass}
                    placeholder="—"
                  />
                </Field>
              ))}
            </div>
          </Card>

          <Card>
            <Field label="Notes" hint="anything the numbers miss">
              <textarea
                value={profile.notes ?? ""}
                onChange={(e) => update("notes", e.target.value)}
                rows={2}
                className={inputClass}
                placeholder="e.g. long torso, broad shoulders, prefer soft cotton"
              />
            </Field>
          </Card>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" size="lg" disabled={status === "saving"}>
              {status === "saving" ? "Saving…" : "Save passport"}
            </Button>
            {status === "saved" && (
              <>
                <span className="text-sm text-green-700">Saved ✓</span>
                <LinkButton href="/closet" variant="secondary">
                  Next: add clothes that fit you →
                </LinkButton>
              </>
            )}
            {status === "error" && (
              <span className="text-sm text-red-700">Something went wrong.</span>
            )}
          </div>
        </form>
      </div>
    </main>
  );
}
