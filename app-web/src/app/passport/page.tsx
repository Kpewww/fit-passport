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
import { Avatar, BadgeSeal, EarnedSealRow } from "@/components/Badges";
import { badgeById, highestMetal } from "@/lib/badges";
import { OutfitMannequin } from "@/components/OutfitMannequin";
import { garmentLabel } from "@/lib/garments";
import type { OutfitView } from "@/components/OutfitCard";

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
  preferredFit: string; // CSV of up to 3 fits; first = primary
  region: "US" | "EU" | "UK" | "JP" | "CN";
  avatarDataUrl: string | null;
  notes: string | null;
};

type Me = { claimed: boolean; username: string | null; accountCode: string | null };

const EMPTY: Profile = {
  sex: null, shopsFor: null,
  heightCm: null, weightKg: null, chestCm: null, waistCm: null, hipCm: null,
  shoulderCm: null, sleeveCm: null, inseamCm: null,
  preferredFit: "regular", region: "US", avatarDataUrl: null, notes: "",
};

const FITS: Fit[] = ["slim", "regular", "relaxed", "oversized"];
const MAX_FITS = 3;
const REGIONS = ["US", "EU", "UK", "JP", "CN"] as const;
const SHOPS = ["mens", "womens", "unisex"] as const;
const REGION_HELP =
  "Which country's size labels you shop most. It sets the default scale we show " +
  "(US = S/M/L, EU = 46/48…). You can still check products from any region — this " +
  "just picks the labels shown first.";

// Parse/serialize the CSV preferredFit.
function fitList(csv: string): Fit[] {
  return csv.split(",").map((s) => s.trim()).filter(Boolean) as Fit[];
}

// "Has the user actually filled anything in?" — decides view vs edit default.
function hasContent(p: Profile): boolean {
  return (
    p.sex != null ||
    p.chestCm != null || p.waistCm != null || p.heightCm != null || p.weightKg != null ||
    (p.notes != null && p.notes !== "") ||
    p.avatarDataUrl != null
  );
}

export default function PassportPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [closetCount, setClosetCount] = useState(0);
  const [bodyChanged, setBodyChanged] = useState(false); // measurement edited this visit
  const [lengthUnit, setLengthUnit] = useState<"cm" | "in">("cm"); // display unit for lengths
  const [weightUnit, setWeightUnit] = useState<"kg" | "lb">("kg"); // display unit for weight
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [pinnedBadges, setPinnedBadges] = useState<string[]>([]);
  const [earnedBadges, setEarnedBadges] = useState<string[]>([]);
  const [showBodyType, setShowBodyType] = useState(true);
  const [myOutfits, setMyOutfits] = useState<OutfitView[]>([]);
  const [signatureOutfitId, setSignatureOutfitId] = useState<string | null>(null);

  async function saveSignature(id: string | null) {
    setSignatureOutfitId(id);
    await fetch("/api/profile/prefs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ signatureOutfitId: id }),
    });
  }

  useEffect(() => {
    Promise.all([
      fetch("/api/profile").then((r) => r.json()),
      fetch("/api/auth/me").then((r) => r.json()),
      fetch("/api/status").then((r) => r.json()).catch(() => ({ closetCount: 0 })),
      fetch("/api/outfits?mine=1").then((r) => r.json()).catch(() => ({ outfits: [] })),
    ]).then(([p, m, s, o]) => {
      const prof = { ...EMPTY, ...(p.profile ?? {}) };
      setProfile(prof);
      setMe({ claimed: m.claimed, username: m.username, accountCode: m.accountCode });
      setShowBodyType(m.showBodyType ?? true);
      setClosetCount(s.closetCount ?? 0);
      setPinnedBadges(s.pinnedBadges ?? []);
      setEarnedBadges(s.earnedBadgeIds ?? []);
      setSignatureOutfitId(s.signatureOutfitId ?? null);
      setMyOutfits(Array.isArray(o.outfits) ? o.outfits : []);
      // Default to the polished VIEW card once the passport has real content;
      // brand-new/empty passports open straight into edit so there's something to do.
      setMode(p.profile && hasContent(prof) ? "view" : "edit");
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
  const bt = deriveBodyType({
    heightCm: profile.heightCm, weightKg: profile.weightKg,
    chestCm: profile.chestCm, waistCm: profile.waistCm, hipCm: profile.hipCm,
  });

  // ---------- VIEW MODE — the polished, show-off passport card ----------
  if (mode === "view") {
    return (
      <ViewBook
        profile={profile}
        me={me}
        initials={initials}
        holder={holder ?? "—"}
        idLine={idLine ?? "—"}
        bodyLabel={bt.label}
        figureKey={bt.figureKey}
        shape={bt.shape}
        showBodyType={showBodyType}
        pinnedBadges={pinnedBadges}
        earnedBadges={earnedBadges}
        outfits={myOutfits}
        signatureOutfitId={signatureOutfitId}
        onSetSignature={saveSignature}
        onEdit={() => setMode("edit")}
      />
    );
  }

  // ---------- EDIT MODE — the existing inline-editable book ----------
  return (
    <main className="flex-1 bg-paper py-10">
      <div className="mx-auto max-w-2xl px-6">
        <div className="mb-3 flex items-center justify-between">
          <button onClick={() => setMode("view")} className="text-sm text-ink-faint hover:text-brand">
            ← Back to my passport
          </button>
          <Button size="md" onClick={() => setMode("view")}>Done editing</Button>
        </div>
        {/* PASSPORT BOOK */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-lift ring-1 ring-neutral-200">
          {/* Cover strip */}
          <div className="relative bg-gradient-to-br from-brand-dark via-brand to-brand-dark px-6 py-5 text-white">
            {/* subtle shine */}
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent_20%,rgba(255,255,255,0.08)_40%,transparent_60%)]" />
            <div className="relative">
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] opacity-80">
                Fit Passport
              </p>
              <p className="mt-1 text-lg font-semibold tracking-wide">
                International Sizing Identity
              </p>
            </div>
          </div>

          {/* Portrait + identity */}
          <div className="grid gap-6 border-b border-neutral-200 px-6 py-6 sm:grid-cols-[auto,1fr]">
            <PortraitUpload
              initials={initials}
              value={profile.avatarDataUrl}
              onChange={(v) => update("avatarDataUrl", v)}
            />
            <div className="min-w-0 space-y-2">
              <Line label="Holder" value={holder ?? "—"} mono />
              <Line label="Passport no." value={idLine ?? "—"} mono />
              <Line label="Region of issue" value={profile.region} mono />
              <Line label="Preferred fit" value={fitList(profile.preferredFit).join(", ").toUpperCase() || "—"} mono />
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

            <Section title="Preferred fit" subtitle="pick up to 3 · first is your default">
              <div className="grid grid-cols-4 gap-2">
                {FITS.map((f) => {
                  const list = fitList(profile.preferredFit);
                  const idx = list.indexOf(f);
                  const active = idx >= 0;
                  return (
                    <button
                      key={f}
                      onClick={() => {
                        let next: Fit[];
                        if (active) {
                          next = list.filter((x) => x !== f);
                        } else if (list.length < MAX_FITS) {
                          next = [...list, f];
                        } else {
                          return; // at cap — ignore
                        }
                        // Never allow empty; fall back to regular.
                        update("preferredFit", (next.length ? next : ["regular"]).join(","));
                      }}
                      className={`relative rounded-lg border px-2 py-2 text-xs capitalize transition-all ${
                        active ? "border-brand bg-brand-tint font-semibold text-brand" : "border-neutral-300 text-ink hover:border-neutral-400"
                      }`}
                    >
                      {f}
                      {idx === 0 && (
                        <span className="absolute -right-1 -top-1 rounded-full bg-brand px-1 text-[8px] font-bold text-white">
                          1st
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="mt-1.5 text-[11px] text-ink-faint">
                Your recommendations default to the 1st pick. On the Check page you
                can preview any of the others.
              </p>
            </Section>

            <Section title="Measurements" subtitle="all optional">
              <div className="mb-3 flex items-center gap-4">
                <UnitToggle
                  label="Lengths"
                  options={["cm", "in"]}
                  value={lengthUnit}
                  onChange={(u) => setLengthUnit(u as "cm" | "in")}
                />
                <UnitToggle
                  label="Weight"
                  options={["kg", "lb"]}
                  value={weightUnit}
                  onChange={(u) => setWeightUnit(u as "kg" | "lb")}
                />
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <LenField label="Chest" hint="most useful" unit={lengthUnit} valueCm={profile.chestCm} onCommitCm={(v) => update("chestCm", v)} />
                <LenField label="Waist" unit={lengthUnit} valueCm={profile.waistCm} onCommitCm={(v) => update("waistCm", v)} />
                <LenField label="Hip" unit={lengthUnit} valueCm={profile.hipCm} onCommitCm={(v) => update("hipCm", v)} />
                <LenField label="Shoulder" unit={lengthUnit} valueCm={profile.shoulderCm} onCommitCm={(v) => update("shoulderCm", v)} />
                <LenField label="Sleeve" unit={lengthUnit} valueCm={profile.sleeveCm} onCommitCm={(v) => update("sleeveCm", v)} />
                <LenField label="Inseam" unit={lengthUnit} valueCm={profile.inseamCm} onCommitCm={(v) => update("inseamCm", v)} />
                <LenField label="Height" unit={lengthUnit} valueCm={profile.heightCm} onCommitCm={(v) => update("heightCm", v)} />
                <WeightField label="Weight" unit={weightUnit} valueKg={profile.weightKg} onCommitKg={(v) => update("weightKg", v)} />
              </div>
            </Section>

            <BodyTypeSection
              profile={profile}
              showBodyType={showBodyType}
              onToggleShow={(v) => {
                setShowBodyType(v);
                fetch("/api/profile/prefs", {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({ showBodyType: v }),
                }).catch(() => {});
              }}
            />

            <Section title="Region" subtitle="which size labels to show first">
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
              <p className="mt-1.5 text-[11px] text-ink-faint">{REGION_HELP}</p>
            </Section>

            <Section title="Memo" subtitle="a short note about your fit / style">
              <TextField
                value={profile.notes ?? ""}
                onCommit={(v) => update("notes", v || null)}
                placeholder="e.g. long torso, broad shoulders, prefer soft cotton, minimalist style"
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

        {/* spacer so content isn't hidden behind the sticky bar */}
        <div className="h-20" />
      </div>

      {/* STICKY SAVE BAR — always visible so the user knows edits persist and
          how to keep them. Explains autosave + gives explicit next steps. */}
      <div className="sticky bottom-0 z-10 border-t border-neutral-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-6 py-3">
          <div className="flex items-center gap-2 text-xs">
            <SaveDot status={status} />
            <div className="leading-tight">
              <p className="font-medium text-ink">
                {status === "saving" ? "Saving…" : status === "error" ? "Save failed — check connection" : "Changes save automatically"}
              </p>
              <p className="text-[11px] text-ink-faint">
                {me.claimed
                  ? "Edits are saved to your account as you type."
                  : "Saved to this device. Claim an account to keep it safe & shareable."}
              </p>
            </div>
          </div>
          <div className="flex flex-shrink-0 gap-2">
            <Link href="/closet" className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-medium text-ink-soft hover:border-neutral-400">
              Closet →
            </Link>
            {!me.claimed && (
              <Link href="/account" className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark">
                Save — claim account →
              </Link>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function SaveDot({ status }: { status: "idle" | "saving" | "saved" | "error" }) {
  const cls =
    status === "error" ? "bg-red-500"
    : status === "saving" ? "bg-amber-400 animate-pulse"
    : "bg-green-500";
  return <span className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${cls}`} />;
}

// ---------- VIEW MODE: the polished, show-off passport card ----------
function ViewBook({
  profile,
  me,
  initials,
  holder,
  idLine,
  bodyLabel,
  figureKey,
  shape,
  showBodyType,
  pinnedBadges,
  earnedBadges,
  outfits,
  signatureOutfitId,
  onSetSignature,
  onEdit,
}: {
  profile: Profile;
  me: Me;
  initials: string;
  holder: string;
  idLine: string;
  bodyLabel: string;
  figureKey: Parameters<typeof BodyFigure>[0]["volume"];
  shape: Parameters<typeof BodyFigure>[0]["shape"];
  showBodyType: boolean;
  pinnedBadges: string[];
  earnedBadges: string[];
  outfits: OutfitView[];
  signatureOutfitId: string | null;
  onSetSignature: (id: string | null) => void;
  onEdit: () => void;
}) {
  const fits = fitList(profile.preferredFit);
  // Seal glyph = the highest pinned badge, else the classic "FP".
  const sealBadge = pinnedBadges.map(badgeById).find(Boolean);
  const signature = outfits.find((o) => o.id === signatureOutfitId) ?? null;
  // The card takes its metal from your highest EARNED badge (lapis by default).
  const theme = CARD_THEMES[highestMetal(earnedBadges) ?? "lapis"] ?? CARD_THEMES.lapis;

  return (
    <main className="flex-1 bg-paper py-12">
      <div className="mx-auto max-w-2xl px-6">
        <div className="mb-4 flex items-center justify-end">
          <Button size="md" variant="secondary" onClick={onEdit}>✎ Edit passport</Button>
        </div>

        {/* THE CARD — one solid metal slab, Amex-black in spirit. Its color comes
            from your highest earned badge metal (cobalt lapis by default). */}
        <MetalCard theme={theme}>
          {/* top row: wordmark + issued */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-serif text-[26px] italic leading-none">Fit Passport</p>
              <p className="mt-2 text-[9px] uppercase tracking-[0.3em] opacity-60">{theme.label}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className="text-[9px] uppercase tracking-[0.24em] opacity-60">Issued 2026</span>
              {sealBadge && <BadgeSeal id={sealBadge.id} metal={sealBadge.metal} size={40} title={sealBadge.title} />}
            </div>
          </div>

          {/* middle: portrait + holder — big, quiet, confident */}
          <div className="mt-9 flex items-end gap-5">
            <div
              className="rounded-full p-[2px]"
              style={{ background: `linear-gradient(135deg, ${theme.sheen}, transparent 70%)` }}
            >
              <Avatar src={profile.avatarDataUrl} initials={initials} size={72} ring={false} />
            </div>
            <div className="min-w-0 pb-1">
              <p className="text-[9px] uppercase tracking-[0.24em] opacity-55">Holder</p>
              <p className="truncate font-serif text-2xl leading-tight">{holder}</p>
            </div>
          </div>

          {/* card-style detail row */}
          <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
            <CardField label="Passport no." value={idLine} mono />
            <CardField label="Region" value={profile.region || "—"} mono />
            <CardField label="Preferred fit" value={fits.join(" · ").toUpperCase() || "—"} />
          </div>

          {/* bottom: verification + logo slot */}
          <div className="mt-9 flex items-end justify-between gap-4 border-t border-white/15 pt-4">
            <div className="min-w-0">
              <p className="text-[8px] uppercase tracking-[0.24em] opacity-50">Verification</p>
              <p className="truncate font-mono text-[10px] tracking-[0.2em] opacity-75">{mrz(profile, me)}</p>
            </div>
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md border border-dashed border-white/25 text-[7px] uppercase tracking-widest opacity-50">
              logo
            </div>
          </div>
        </MetalCard>

        {/* Details live BELOW the card so the card itself stays clean. */}
        <div className="mt-6 space-y-4">
          {/* Achievements */}
          <div className="rounded-2xl bg-white p-6 shadow-card ring-1 ring-line">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-ink-faint">Achievements</p>
              {earnedBadges.length > 0 && <span className="text-[10px] text-ink-faint">tilt a medallion to catch the light</span>}
            </div>
            {earnedBadges.length > 0 ? (
              <EarnedSealRow earnedIds={earnedBadges} pinnedIds={pinnedBadges} size={52} />
            ) : (
              <Link href="/badges" className="text-sm text-brand hover:underline">Earn badges and pin up to 3 here →</Link>
            )}
          </div>

          {/* Signature look */}
          <div className="rounded-2xl bg-white p-6 shadow-card ring-1 ring-line">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-ink-faint">Signature look</p>
              {outfits.length > 0 && (
                <select
                  value={signatureOutfitId ?? ""}
                  onChange={(e) => onSetSignature(e.target.value || null)}
                  className="rounded-md border border-line bg-paper-soft px-2 py-1 text-xs text-ink-soft"
                >
                  <option value="">None</option>
                  {outfits.map((o) => (
                    <option key={o.id} value={o.id}>{o.title}</option>
                  ))}
                </select>
              )}
            </div>
            {signature ? (
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 rounded-xl border border-line bg-paper-soft p-1">
                  <OutfitMannequin
                    layers={signature.items.map((it) => ({ category: it.category, color: it.color }))}
                    volume={figureKey as never}
                    shape={shape as never}
                    size={72}
                  />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-ink">{signature.title}</p>
                  {signature.occasion && <p className="text-xs text-brand">{signature.occasion}</p>}
                  <p className="mt-0.5 text-xs text-ink-faint">
                    {signature.items.map((it) => garmentLabel(it.category)).join(" · ")}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-faint">♥ {signature.likeCount}</p>
                </div>
              </div>
            ) : outfits.length > 0 ? (
              <p className="text-sm text-ink-soft">Pick one of your outfits above to feature it here.</p>
            ) : (
              <Link href="/outfits" className="text-sm text-brand hover:underline">Compose an outfit to feature as your signature look →</Link>
            )}
          </div>

          {/* Body type — text only; the figure is kept off the card for cleanliness */}
          <div className="rounded-2xl bg-white p-6 shadow-card ring-1 ring-line">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-ink-faint">Body type</p>
            <p className="mt-1 text-lg font-semibold text-ink">{showBodyType ? bodyLabel : "Hidden"}</p>
            <p className="mt-0.5 text-xs text-ink-faint">
              {showBodyType
                ? "Precise measurements stay private — never shared by code."
                : "You've hidden your body type from your public view."}
            </p>
          </div>
        </div>

        {/* actions */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
          <div className="flex gap-4">
            <Link href="/closet" className="text-ink-soft hover:text-brand">My closet →</Link>
            <Link href="/badges" className="text-ink-soft hover:text-brand">Badge library →</Link>
          </div>
          {me.claimed ? (
            <Link href={`/u/${encodeURIComponent(me.accountCode ?? "")}`} className="text-ink-soft hover:text-brand">
              Preview public view →
            </Link>
          ) : (
            <Link href="/account" className="font-medium text-brand hover:underline">
              Claim account to save &amp; share →
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}

// ---------- The metal card ----------
//
// One solid slab in the spirit of a metal charge card: a deep two-stop metal
// gradient, brushed-metal micro-grain, a broad diagonal sheen, and a slow
// travelling glint. Its color is driven by the holder's highest badge metal.

type CardTheme = {
  label: string;
  from: string;
  via: string;
  to: string;
  sheen: string; // highlight color for the sheen/ring
  text: string; // body text color on the slab
  veined?: boolean; // agate-style white striations (top metals)
};

const CARD_THEMES: Record<string, CardTheme> = {
  // default — lapis lazuli cobalt
  lapis: { label: "Lapis Edition", from: "#0f1a52", via: "#2438d6", to: "#0a0f2e", sheen: "rgba(190,205,255,0.9)", text: "#eef1ff" },
  bronze: { label: "Bronze Edition", from: "#3a220e", via: "#b57838", to: "#2a1809", sheen: "rgba(255,224,186,0.9)", text: "#fdf1e2" },
  silver: { label: "Silver Edition", from: "#5f6872", via: "#c2cad3", to: "#454c55", sheen: "rgba(255,255,255,0.95)", text: "#12161b" },
  gold: { label: "Gold Edition", from: "#5c4406", via: "#e6b23d", to: "#3d2c04", sheen: "rgba(255,246,200,0.95)", text: "#221903" },
  platinum: { label: "Platinum Edition", from: "#7c848f", via: "#e8ecf1", to: "#69717b", sheen: "rgba(255,255,255,0.98)", text: "#14181d" },
  diamond: { label: "Diamond Edition", from: "#0e5b73", via: "#c4ecf6", to: "#0b465a", sheen: "rgba(255,255,255,0.98)", text: "#06303d", veined: true },
  obsidian: { label: "Obsidian Edition", from: "#101216", via: "#2a2e35", to: "#000000", sheen: "rgba(200,210,225,0.75)", text: "#eef0f4", veined: true },
  amethyst: { label: "Amethyst Edition", from: "#2c1553", via: "#8b5cd6", to: "#1d0e38", sheen: "rgba(232,214,251,0.92)", text: "#f6efff", veined: true },
  jade: { label: "Jade Edition", from: "#0b3d23", via: "#43b972", to: "#072b18", sheen: "rgba(211,246,222,0.92)", text: "#f0fff6", veined: true },
  amber: { label: "Amber Edition", from: "#4d2607", via: "#e8912f", to: "#331803", sheen: "rgba(255,225,168,0.95)", text: "#2b1504" },
};

function MetalCard({ theme, children }: { theme: CardTheme; children: React.ReactNode }) {
  return (
    <div
      className="relative overflow-hidden rounded-[22px] p-7 shadow-lift sm:p-9"
      style={{
        background: `linear-gradient(140deg, ${theme.from} 0%, ${theme.via} 52%, ${theme.to} 100%)`,
        color: theme.text,
      }}
    >
      {/* brushed-metal micro-grain */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.14] mix-blend-overlay"
        style={{
          backgroundImage:
            "repeating-linear-gradient(115deg, rgba(255,255,255,0.55) 0px, rgba(255,255,255,0) 2px, rgba(0,0,0,0.35) 3px, rgba(0,0,0,0) 5px)",
        }}
      />
      {/* agate-style striations for the top metals */}
      {theme.veined && (
        <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-40" preserveAspectRatio="none" viewBox="0 0 100 60">
          <path d="M-2,14 C18,7 30,22 52,15 C72,9 86,20 102,12" fill="none" stroke="#fff" strokeOpacity="0.7" strokeWidth="0.7" />
          <path d="M-2,34 C20,27 28,42 50,36 C70,30 84,43 102,34" fill="none" stroke="#fff" strokeOpacity="0.45" strokeWidth="0.4" />
          <path d="M-2,48 C22,44 34,55 56,49 C74,44 88,53 102,47" fill="none" stroke="#fff" strokeOpacity="0.3" strokeWidth="0.35" />
        </svg>
      )}
      {/* broad diagonal sheen */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: `linear-gradient(125deg, transparent 22%, ${theme.sheen} 47%, transparent 68%)`, opacity: 0.16 }}
      />
      {/* slow travelling glint */}
      <div className="pointer-events-none absolute inset-0 -translate-x-full animate-[shimmer_9s_ease-in-out_infinite] bg-[linear-gradient(110deg,transparent_42%,rgba(255,255,255,0.28)_50%,transparent_58%)]" />
      {/* inner hairline bevel */}
      <div className="pointer-events-none absolute inset-0 rounded-[22px] ring-1 ring-inset ring-white/20" />
      <div className="relative">{children}</div>
    </div>
  );
}

// A quiet label/value pair rendered on the metal slab.
function CardField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-[8px] uppercase tracking-[0.24em] opacity-55">{label}</p>
      <p className={`mt-1 truncate text-sm ${mono ? "font-mono tracking-tight" : "font-medium"}`}>{value}</p>
    </div>
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

// A small segmented unit toggle (cm/in, kg/lb).
function UnitToggle({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: [string, string];
  value: string;
  onChange: (u: string) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] uppercase tracking-widest text-ink-faint">{label}</span>
      <div className="inline-flex rounded-lg border border-neutral-300 p-0.5">
        {options.map((o) => (
          <button
            key={o}
            onClick={() => onChange(o)}
            className={`rounded-md px-2 py-0.5 text-xs transition-colors ${
              value === o ? "bg-brand text-white" : "text-ink-soft hover:bg-neutral-100"
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

// The raw numeric field — displays whatever the parent passes and commits raw.
function RawNumField({
  label,
  hint,
  unit,
  text,
  onText,
  onCommit,
}: {
  label: string;
  hint?: string;
  unit: string;
  text: string;
  onText: (s: string) => void;
  onCommit: () => void;
}) {
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
          onChange={(e) => onText(e.target.value)}
          onBlur={onCommit}
          onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
          placeholder="—"
          className="w-full bg-transparent px-2.5 py-2 text-sm text-ink outline-none placeholder:text-ink-faint"
        />
        <span className="pr-2 text-[10px] text-ink-faint">{unit}</span>
      </div>
    </div>
  );
}

// A length field that STORES cm but DISPLAYS the chosen unit (cm/in).
function LenField({
  label,
  hint,
  unit,
  valueCm,
  onCommitCm,
}: {
  label: string;
  hint?: string;
  unit: "cm" | "in";
  valueCm: number | null;
  onCommitCm: (v: number | null) => void;
}) {
  const toDisplay = (cm: number | null) =>
    cm == null ? "" : String(unit === "in" ? Math.round((cm / 2.54) * 10) / 10 : cm);
  const [text, setText] = useState(toDisplay(valueCm));
  useEffect(() => setText(toDisplay(valueCm)), [valueCm, unit]);
  return (
    <RawNumField
      label={label} hint={hint} unit={unit} text={text} onText={setText}
      onCommit={() => {
        if (text.trim() === "") return onCommitCm(null);
        const n = Number(text);
        if (!Number.isFinite(n)) return onCommitCm(null);
        onCommitCm(unit === "in" ? Math.round(n * 2.54 * 10) / 10 : n);
      }}
    />
  );
}

// A weight field that STORES kg but DISPLAYS the chosen unit (kg/lb).
function WeightField({
  label,
  unit,
  valueKg,
  onCommitKg,
}: {
  label: string;
  unit: "kg" | "lb";
  valueKg: number | null;
  onCommitKg: (v: number | null) => void;
}) {
  const toDisplay = (kg: number | null) =>
    kg == null ? "" : String(unit === "lb" ? Math.round(kg * 2.2046 * 10) / 10 : kg);
  const [text, setText] = useState(toDisplay(valueKg));
  useEffect(() => setText(toDisplay(valueKg)), [valueKg, unit]);
  return (
    <RawNumField
      label={label} unit={unit} text={text} onText={setText}
      onCommit={() => {
        if (text.trim() === "") return onCommitKg(null);
        const n = Number(text);
        if (!Number.isFinite(n)) return onCommitKg(null);
        onCommitKg(unit === "lb" ? Math.round((n / 2.2046) * 10) / 10 : n);
      }}
    />
  );
}

// Portrait upload — click to pick an image, resized client-side to a small
// square data URL. Falls back to initials when empty.
function PortraitUpload({
  initials,
  value,
  onChange,
}: {
  initials: string;
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  const [busy, setBusy] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const dataUrl = await resizeImage(file, 256);
      onChange(dataUrl);
    } catch {
      // ignore — keep old value
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }

  return (
    <div className="flex flex-col items-center">
      <label className="group relative h-24 w-20 cursor-pointer overflow-hidden rounded-md border-2 border-neutral-800 bg-neutral-50">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="portrait" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center font-mono text-2xl font-bold text-neutral-800">
            {initials}
          </span>
        )}
        <span className="absolute inset-x-0 bottom-0 bg-black/50 py-0.5 text-center text-[8px] uppercase tracking-wider text-white opacity-0 transition-opacity group-hover:opacity-100">
          {busy ? "…" : "change"}
        </span>
        <input type="file" accept="image/*" onChange={onFile} className="hidden" />
      </label>
      <p className="mt-1 text-[9px] uppercase tracking-widest text-ink-faint">portrait</p>
      {value && (
        <button onClick={() => onChange(null)} className="mt-0.5 text-[9px] text-ink-faint hover:text-red-600">
          remove
        </button>
      )}
    </div>
  );
}

// Resize an image file to a square data URL (max `size` px), JPEG-encoded.
function resizeImage(file: File, size: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read failed"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("decode failed"));
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("no ctx"));
        // center-crop to square
        const min = Math.min(img.width, img.height);
        const sx = (img.width - min) / 2;
        const sy = (img.height - min) / 2;
        ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
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

function BodyTypeSection({
  profile,
  showBodyType,
  onToggleShow,
}: {
  profile: Profile;
  showBodyType: boolean;
  onToggleShow: (v: boolean) => void;
}) {
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
          <label className="mt-2 flex items-center gap-1.5 text-[11px] text-ink-soft">
            <input type="checkbox" checked={showBodyType} className="accent-brand"
              onChange={(e) => onToggleShow(e.target.checked)} />
            Show my body type on my passport &amp; public view
          </label>
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
