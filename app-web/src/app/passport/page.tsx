"use client";

// Fit Passport — the "identity document" page.
// Styled after a real passport data page (cover strip, MRZ-like details block,
// portrait avatar) while staying quiet enough to be actually usable. Editable
// inline: click a field, change it, blur/Enter saves. All fields optional.

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, Card } from "@/components/ui";
import { BodyFigure } from "@/components/BodyFigure";
import { deriveBodyType } from "@/lib/bodyType";

type Sex = "male" | "female" | "unspecified" | null;
type Fit = "slim" | "regular" | "relaxed" | "oversized";

type Profile = {
  sex: Sex;
  shopsFor: string | null;
  heightCm: number | null;
  weightKg: number | null;
  chestCm: number | null;
  waistCm: number | null;
  hipCm: number | null;
  shoulderCm: number | null;
  sleeveCm: number | null;
  inseamCm: number | null;
  preferredFit: Fit;
  region: "US" | "EU" | "UK" | "JP" | "CN";
  notes: string | null;
};

type Me = { claimed: boolean; username: string | null; accountCode: string | null };

const EMPTY: Profile = {
  sex: null, shopsFor: null,
  heightCm: null, weightKg: null, chestCm: null, waistCm: null, hipCm: null,
  shoulderCm: null, sleeveCm: null, inseamCm: null,
  preferredFit: "regular", region: "US", notes: "",
};

const FITS: Fit[] = ["slim", "regular", "relaxed", "oversized"];
const REGIONS = ["US", "EU", "UK", "JP", "CN"] as const;
const SHOPS = ["mens", "womens", "unisex"] as const;

export default function PassportPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [closetCount, setClosetCount] = useState(0);
  const [bodyChanged, setBodyChanged] = useState(false); // measurement edited this visit

  useEffect(() => {
    Promise.all([
      fetch("/api/profile").then((r) => r.json()),
      fetch("/api/auth/me").then((r) => r.json()),
      fetch("/api/status").then((r) => r.json()).catch(() => ({ closetCount: 0 })),
    ]).then(([p, m, s]) => {
      setProfile({ ...EMPTY, ...(p.profile ?? {}) });
      setMe({ claimed: m.claimed, username: m.username, accountCode: m.accountCode });
      setClosetCount(s.closetCount ?? 0);
    });
  }, []);

  // Keys whose change implies the body changed → clothes may fit differently.
  const MEASUREMENT_KEYS: Array<keyof Profile> = [
    "heightCm", "weightKg", "chestCm", "waistCm", "hipCm", "shoulderCm", "sleeveCm", "inseamCm",
  ];

  async function persist(next: Profile) {
    setStatus("saving");
    const r = await fetch("/api/profile", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(next),
    });
    setStatus(r.ok ? "saved" : "error");
    setTimeout(() => setStatus("idle"), 1200);
  }

  function update<K extends keyof Profile>(k: K, v: Profile[K]) {
    if (!profile) return;
    const next = { ...profile, [k]: v };
    setProfile(next);
    persist(next);
    // If a body measurement changed and there are clothes to re-rate, surface
    // the refresh prompt — fit drifts as the body changes.
    if (MEASUREMENT_KEYS.includes(k) && v !== profile[k] && closetCount > 0) {
      setBodyChanged(true);
    }
  }

  if (!profile || !me) {
    return <main className="flex-1"><div className="mx-auto max-w-2xl px-6 py-14 text-ink-faint">Loading…</div></main>;
  }

  const initials = (me.username ?? "you").slice(0, 2).toUpperCase();
  const holder = me.claimed ? me.username : "TEMPORARY BEARER";
  const idLine = me.claimed ? me.accountCode : "UNCLAIMED";

  return (
    <main className="flex-1 bg-neutral-100 py-10">
      <div className="mx-auto max-w-2xl px-6">
        {/* PASSPORT BOOK */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-lift ring-1 ring-neutral-200">
          {/* Cover strip */}
          <div className="relative bg-gradient-to-br from-brand-dark via-brand to-brand-dark px-6 py-5 text-white">
            {/* subtle shine */}
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent_20%,rgba(255,255,255,0.08)_40%,transparent_60%)]" />
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.3em] opacity-80">
                  Fit Passport
                </p>
                <p className="mt-1 text-lg font-semibold tracking-wide">
                  International Sizing Identity
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/40 text-xs font-bold tracking-widest">
                FP
              </div>
            </div>
          </div>

          {/* Portrait + identity */}
          <div className="grid gap-6 border-b border-neutral-200 px-6 py-6 sm:grid-cols-[auto,1fr]">
            <div className="flex flex-col items-center">
              <div className="flex h-24 w-20 items-center justify-center rounded-md border-2 border-neutral-800 bg-neutral-50 font-mono text-2xl font-bold text-neutral-800">
                {initials}
              </div>
              <p className="mt-1 text-[9px] uppercase tracking-widest text-ink-faint">portrait</p>
            </div>
            <div className="min-w-0 space-y-2">
              <Line label="Holder" value={holder ?? "—"} mono />
              <Line label="Passport no." value={idLine ?? "—"} mono />
              <Line label="Region of issue" value={profile.region} mono />
              <Line label="Preferred fit" value={profile.preferredFit.toUpperCase()} mono />
            </div>
          </div>

          {/* MRZ-like details block — always editable */}
          <div className="space-y-4 px-6 py-6">
            <Section title="Sizing reference">
              <div className="grid gap-3 sm:grid-cols-2">
                <FieldChips
                  label="Sex (biological)"
                  value={profile.sex}
                  options={[
                    { v: "male", label: "M" },
                    { v: "female", label: "F" },
                    { v: "unspecified", label: "X" },
                  ]}
                  onChange={(v) => update("sex", v as Sex)}
                />
                <FieldMultiChips
                  label="Shops in"
                  value={profile.shopsFor}
                  options={SHOPS.map((s) => ({ v: s, label: s }))}
                  onChange={(v) => update("shopsFor", v)}
                />
              </div>
            </Section>

            <Section title="Preferred fit">
              <div className="grid grid-cols-4 gap-2">
                {FITS.map((f) => {
                  const active = profile.preferredFit === f;
                  return (
                    <button
                      key={f}
                      onClick={() => update("preferredFit", f)}
                      className={`rounded-lg border px-2 py-2 text-xs capitalize transition-all ${
                        active ? "border-brand bg-brand-tint font-semibold text-brand" : "border-neutral-300 text-ink hover:border-neutral-400"
                      }`}
                    >{f}</button>
                  );
                })}
              </div>
            </Section>

            <Section title="Measurements" subtitle="all optional · cm/kg">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <NumField label="Chest" hint="most useful" value={profile.chestCm} onCommit={(v) => update("chestCm", v)} />
                <NumField label="Waist" value={profile.waistCm} onCommit={(v) => update("waistCm", v)} />
                <NumField label="Hip" value={profile.hipCm} onCommit={(v) => update("hipCm", v)} />
                <NumField label="Shoulder" value={profile.shoulderCm} onCommit={(v) => update("shoulderCm", v)} />
                <NumField label="Sleeve" value={profile.sleeveCm} onCommit={(v) => update("sleeveCm", v)} />
                <NumField label="Inseam" value={profile.inseamCm} onCommit={(v) => update("inseamCm", v)} />
                <NumField label="Height" value={profile.heightCm} onCommit={(v) => update("heightCm", v)} />
                <NumField label="Weight" unit="kg" value={profile.weightKg} onCommit={(v) => update("weightKg", v)} />
              </div>
            </Section>

            <BodyTypeSection profile={profile} />

            <Section title="Region">
              <div className="flex flex-wrap gap-2">
                {REGIONS.map((r) => {
                  const active = profile.region === r;
                  return (
                    <button
                      key={r}
                      onClick={() => update("region", r)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-mono transition-all ${
                        active ? "border-brand bg-brand-tint font-semibold text-brand" : "border-neutral-300 text-ink hover:border-neutral-400"
                      }`}
                    >{r}</button>
                  );
                })}
              </div>
            </Section>

            <Section title="Notes">
              <TextField
                value={profile.notes ?? ""}
                onCommit={(v) => update("notes", v || null)}
                placeholder="e.g. long torso, broad shoulders, prefer soft cotton"
              />
            </Section>
          </div>

          {/* MRZ footer */}
          <div className="border-t border-neutral-200 bg-neutral-50 px-6 py-3">
            <p className="truncate font-mono text-[10px] tracking-widest text-ink-faint">
              {mrz(profile, me)}
            </p>
          </div>
        </div>

        {/* Body-changed → refresh prompt */}
        {bodyChanged && (
          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-brand/30 bg-brand-tint px-4 py-3 animate-fade-in-up">
            <span className="text-lg">↻</span>
            <div className="flex-1 text-sm text-ink">
              <p className="font-semibold">Your measurements changed</p>
              <p className="text-xs text-ink-soft">
                Clothes may fit differently now. Do a quick fit refresh to update how they feel.
              </p>
            </div>
            <Link
              href="/refresh?collections=all"
              className="whitespace-nowrap rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark"
            >
              Refresh →
            </Link>
            <button onClick={() => setBodyChanged(false)} className="text-ink-faint hover:text-ink" aria-label="Dismiss">✕</button>
          </div>
        )}

        {/* Save indicator + next-step */}
        <div className="mt-4 flex items-center justify-between text-xs text-ink-faint">
          <span>
            {status === "saving" && "Saving…"}
            {status === "saved" && <span className="text-green-700">Saved ✓</span>}
            {status === "error" && <span className="text-red-700">Save failed</span>}
            {status === "idle" && "Changes save automatically"}
          </span>
          <div className="flex gap-3">
            <Link href="/closet" className="hover:text-brand">Go to closet →</Link>
            {!me.claimed && (
              <Link href="/account" className="font-medium text-brand hover:underline">
                Save this passport — claim account →
              </Link>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

// ---------- pieces ----------

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 flex items-baseline gap-2">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.25em] text-ink-faint">{title}</h3>
        {subtitle && <span className="text-[10px] text-ink-faint">· {subtitle}</span>}
      </div>
      {children}
    </div>
  );
}

function Line({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="grid grid-cols-[9rem,1fr] items-baseline gap-2">
      <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-ink-faint">{label}</span>
      <span className={`text-sm text-ink ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}

function FieldChips<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T | null;
  options: Array<{ v: T; label: string }>;
  onChange: (v: T | null) => void;
}) {
  return (
    <div>
      <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-ink-faint">{label}</div>
      <div className="flex gap-1.5">
        {options.map((o) => {
          const active = value === o.v;
          return (
            <button
              key={o.v}
              onClick={() => onChange(active ? null : o.v)}
              className={`flex-1 rounded-lg border px-2 py-2 text-xs font-mono transition-all ${
                active ? "border-brand bg-brand-tint font-bold text-brand" : "border-neutral-300 text-ink hover:border-neutral-400"
              }`}
              title={o.v}
            >{o.label}</button>
          );
        })}
      </div>
    </div>
  );
}

function FieldMultiChips({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string | null;
  options: Array<{ v: string; label: string }>;
  onChange: (v: string | null) => void;
}) {
  const set = new Set((value ?? "").split(",").filter(Boolean));
  return (
    <div>
      <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-ink-faint">{label}</div>
      <div className="flex gap-1.5">
        {options.map((o) => {
          const active = set.has(o.v);
          return (
            <button
              key={o.v}
              onClick={() => {
                if (active) set.delete(o.v); else set.add(o.v);
                onChange(Array.from(set).join(",") || null);
              }}
              className={`flex-1 rounded-lg border px-2 py-2 text-xs capitalize transition-all ${
                active ? "border-brand bg-brand-tint font-bold text-brand" : "border-neutral-300 text-ink hover:border-neutral-400"
              }`}
            >{o.label}</button>
          );
        })}
      </div>
    </div>
  );
}

function NumField({
  label,
  value,
  onCommit,
  hint,
  unit = "cm",
}: {
  label: string;
  value: number | null;
  onCommit: (v: number | null) => void;
  hint?: string;
  unit?: string;
}) {
  const [text, setText] = useState(value == null ? "" : String(value));
  useEffect(() => setText(value == null ? "" : String(value)), [value]);
  return (
    <div>
      <div className="mb-0.5 flex items-baseline justify-between">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink-faint">{label}</span>
        {hint && <span className="text-[9px] italic text-ink-faint">{hint}</span>}
      </div>
      <div className="flex items-center rounded-lg border border-neutral-300 bg-white focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20">
        <input
          inputMode="decimal"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={() => {
            const n = text.trim() === "" ? null : Number(text);
            onCommit(Number.isFinite(n as number) ? (n as number) : null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
          placeholder="—"
          className="w-full bg-transparent px-2.5 py-2 text-sm text-ink outline-none placeholder:text-ink-faint"
        />
        <span className="pr-2 text-[10px] text-ink-faint">{unit}</span>
      </div>
    </div>
  );
}

function TextField({
  value,
  onCommit,
  placeholder,
}: {
  value: string;
  onCommit: (v: string) => void;
  placeholder?: string;
}) {
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  return (
    <textarea
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => onCommit(text)}
      rows={2}
      placeholder={placeholder}
      className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-faint focus:border-brand focus:ring-2 focus:ring-brand/20"
    />
  );
}

function BodyTypeSection({ profile }: { profile: Profile }) {
  const bt = deriveBodyType({
    heightCm: profile.heightCm,
    weightKg: profile.weightKg,
    chestCm: profile.chestCm,
    waistCm: profile.waistCm,
    hipCm: profile.hipCm,
  });
  const anyData = bt.have.volume || bt.have.shape;
  return (
    <Section title="Body type" subtitle="derived from your measurements">
      <div className="flex items-center gap-4 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3">
        <BodyFigure volume={bt.figureKey} shape={bt.shape} size={80} />
        <div className="min-w-0 flex-1">
          <p className="text-lg font-semibold text-ink">{bt.label}</p>
          {bt.bmi != null && (
            <p className="mt-0.5 text-xs text-ink-faint">BMI {bt.bmi}</p>
          )}
          {!anyData && (
            <p className="mt-1 text-xs text-ink-faint">
              Add height + weight above to derive a body type; add chest + waist
              to refine the build.
            </p>
          )}
          {anyData && !bt.have.shape && (
            <p className="mt-1 text-xs text-ink-faint">
              Add chest + waist to derive build (tapered / straight / full-waist).
            </p>
          )}
          {bt.scopeNote && (
            <p className="mt-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              <span className="font-semibold">Sizing note:</span> {bt.scopeNote}
            </p>
          )}
        </div>
      </div>
    </Section>
  );
}

// A one-liner "machine-readable zone" summary of the passport — pure decoration
// but grounded in the real fields, so it changes as you edit.
function mrz(p: Profile, me: Me): string {
  const pad = (s: string, n: number) => (s + "<".repeat(n)).slice(0, n);
  const holder = (me.username ?? "BEARER").toUpperCase().replace(/[^A-Z0-9]/g, "");
  const code = (me.accountCode ?? "UNCLAIMED").replace(/-/g, "");
  const chest = p.chestCm != null ? String(Math.round(p.chestCm)) : "---";
  const waist = p.waistCm != null ? String(Math.round(p.waistCm)) : "---";
  const sex = (p.sex ?? "X").charAt(0).toUpperCase();
  const fit = p.preferredFit.charAt(0).toUpperCase();
  return `FP<${p.region}<${pad(holder, 12)}<<${pad(code, 15)}<${sex}${fit}<C${chest}<W${waist}`;
}
