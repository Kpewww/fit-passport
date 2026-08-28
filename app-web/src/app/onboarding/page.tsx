"use client";

// Passport onboarding — one question per screen, and skippable at every point.
//
// This page used to put ten inputs on one screen, nine of them body
// measurements. It measured worse than the closet add form did before Session
// 58 rebuilt that, and it sits EARLIER in the journey: the closet is somewhere a
// person chooses to go, this is what they hit first.
//
// Which questions are here, and which moved behind the disclosure, is settled by
// what the engine reads — the counts and the reasoning live in
// lib/onboardingFlow.ts, and onboardingFlow.test.ts fails if a step is added
// without a stated engine use or if anything starts blocking.
//
// The skip is not politeness. The engine already answers on an empty profile by
// falling back to a regional prior and capping its own confidence, so gating a
// first size check behind ten questions throws away an honest answer to collect
// data the person may not have to hand.

import { useEffect, useState } from "react";
import { Button, Card, Field, LinkButton, inputClass } from "@/components/ui";
import {
  ONBOARDING_STEPS,
  SCORED_MEASUREMENTS,
  type OnboardingStep,
  type ScoredMeasurement,
} from "@/lib/onboardingFlow";

type Profile = {
  sex: "male" | "female" | "unspecified" | null;
  shopsFor: string | null; // csv of mens/womens/unisex
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
  sex: null, shopsFor: null,
  heightCm: null, weightKg: null, chestCm: null, waistCm: null, hipCm: null,
  shoulderCm: null, sleeveCm: null, inseamCm: null,
  preferredFit: "regular", region: "US", notes: "",
};

const SEX_OPTIONS: Array<{ v: "male" | "female" | "unspecified"; label: string }> = [
  { v: "male", label: "Male" },
  { v: "female", label: "Female" },
  { v: "unspecified", label: "Prefer not to say" },
];

const SHOPS_OPTIONS = ["mens", "womens", "unisex"] as const;

const FIT_OPTIONS: Array<{ v: Profile["preferredFit"]; label: string; desc: string }> = [
  { v: "slim", label: "Slim", desc: "Close to the body" },
  { v: "regular", label: "Regular", desc: "Standard · default" },
  { v: "relaxed", label: "Relaxed", desc: "Room to move" },
  { v: "oversized", label: "Oversized", desc: "Deliberately big" },
];

const MEASUREMENT_LABEL: Record<ScoredMeasurement, { label: string; why: string }> = {
  chestCm: { label: "Chest", why: "The single most useful number — around the fullest part." },
  waistCm: { label: "Waist", why: "Where you'd wear a belt, not where trousers sit." },
  shoulderCm: { label: "Shoulder width", why: "Seam to seam across the back." },
};

const UNSCORED_NUMBERS: Array<{ k: keyof Profile; label: string; unit: string }> = [
  { k: "heightCm", label: "Height", unit: "cm" },
  { k: "weightKg", label: "Weight", unit: "kg" },
  { k: "hipCm", label: "Hip", unit: "cm" },
  { k: "inseamCm", label: "Inseam", unit: "cm" },
  { k: "sleeveCm", label: "Sleeve length", unit: "cm" },
];

const STEP_TITLE: Record<OnboardingStep, string> = {
  fit: "How do you like clothes to fit?",
  reference: "Which size charts should we read you against?",
  measurements: "Any measurements you know?",
};

export default function OnboardingPage() {
  const [profile, setProfile] = useState<Profile>(EMPTY);
  const [stepIndex, setStepIndex] = useState(0);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => { if (d.profile) setProfile({ ...EMPTY, ...d.profile }); })
      .catch(() => { /* an empty profile is a valid starting point — never block on this */ });
  }, []);

  function update<K extends keyof Profile>(k: K, v: Profile[K]) {
    setProfile((p) => ({ ...p, [k]: v }));
  }

  const step = ONBOARDING_STEPS[stepIndex];
  const isLast = stepIndex === ONBOARDING_STEPS.length - 1;

  async function save() {
    setStatus("saving");
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(profile),
      });
      setStatus(res.ok ? "saved" : "error");
    } catch {
      setStatus("error");
    }
  }

  const measurementsGiven = SCORED_MEASUREMENTS.filter((m) => profile[m] != null).length;

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-10">
        <p className="text-xs uppercase tracking-[0.18em] text-ink-faint">
          Your passport · {stepIndex + 1} of {ONBOARDING_STEPS.length}
        </p>
        <h1 className="mt-2 font-serif text-3xl sm:text-4xl text-ink">{STEP_TITLE[step]}</h1>

        {status === "saved" ? (
          <Card className="mt-8">
            <p className="text-sm font-medium text-ink">Saved.</p>
            <p className="mt-1 text-sm text-ink-soft">
              {measurementsGiven === 0
                ? "No measurements yet — checks will lean on regional averages and say so."
                : `${measurementsGiven} of 3 measurements recorded. The more of them we have, the less we have to assume.`}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <LinkButton href="/check">Check a size →</LinkButton>
              <LinkButton href="/closet" variant="secondary">Add clothes that fit you</LinkButton>
            </div>
          </Card>
        ) : (
          <>
            <Card className="mt-8">
              {step === "fit" && (
                <>
                  <p className="text-sm text-ink-soft">
                    This shifts how much room we aim for. You can change it on any single check.
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
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
                              : "border-line hover:border-ink-faint"
                          }`}
                        >
                          <div className="text-sm font-semibold text-ink">{o.label}</div>
                          <div className="mt-0.5 text-xs text-ink-faint">{o.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {step === "reference" && (
                <>
                  <p className="text-sm text-ink-soft">
                    Men&apos;s and women&apos;s charts differ, and so do regional ones. Both are
                    defaulted — this only picks which averages we start from when we don&apos;t
                    have your numbers.
                  </p>
                  <div className="mt-4 space-y-4">
                    <div>
                      <p className="mb-1.5 text-xs font-medium text-ink-soft">Biological sex</p>
                      <div className="flex flex-wrap gap-2">
                        {SEX_OPTIONS.map((o) => {
                          const active = profile.sex === o.v;
                          return (
                            <button
                              key={o.v}
                              type="button"
                              onClick={() => update("sex", active ? null : o.v)}
                              className={`min-h-11 flex-1 rounded-xl border px-3 py-2 text-xs transition-all ${
                                active
                                  ? "border-brand bg-brand-tint ring-1 ring-brand text-brand"
                                  : "border-line text-ink hover:border-ink-faint"
                              }`}
                            >
                              {o.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <p className="mb-1.5 text-xs font-medium text-ink-soft">Region</p>
                      <div className="flex flex-wrap gap-2">
                        {(["US", "EU", "UK", "JP", "CN"] as const).map((r) => {
                          const active = profile.region === r;
                          return (
                            <button
                              key={r}
                              type="button"
                              onClick={() => update("region", r)}
                              className={`min-h-11 min-w-[3.5rem] rounded-xl border px-3 py-2 text-xs transition-all ${
                                active
                                  ? "border-brand bg-brand-tint ring-1 ring-brand text-brand"
                                  : "border-line text-ink hover:border-ink-faint"
                              }`}
                            >
                              {r}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {step === "measurements" && (
                <>
                  <p className="text-sm text-ink-soft">
                    All three are optional. Skip any you don&apos;t know — we fall back to
                    regional averages and tell you when we have.
                  </p>
                  <div className="mt-4 space-y-4">
                    {SCORED_MEASUREMENTS.map((m) => (
                      <Field key={m} label={`${MEASUREMENT_LABEL[m].label} (cm)`} hint="optional">
                        <input
                          type="number"
                          step="0.1"
                          inputMode="decimal"
                          value={(profile[m] as number | null) ?? ""}
                          onChange={(e) =>
                            update(m, (e.target.value === "" ? null : Number(e.target.value)) as Profile[typeof m])
                          }
                          className={inputClass}
                          placeholder="—"
                        />
                        <p className="mt-1 text-[11px] text-ink-faint">{MEASUREMENT_LABEL[m].why}</p>
                      </Field>
                    ))}
                  </div>

                  {/* Everything the engine does not read. Collected because it is
                      useful to a person reading their own passport — and labelled,
                      so nobody fills it in believing it sharpens the answer. */}
                  <button
                    type="button"
                    onClick={() => setShowMore(!showMore)}
                    className="mt-5 min-h-11 text-sm font-medium text-brand"
                  >
                    {showMore ? "− Hide extra details" : "+ Add details (optional)"}
                  </button>
                  {showMore && (
                    <div className="mt-3 space-y-4 border-t border-line pt-4">
                      <p className="text-xs text-ink-faint">
                        The fit engine does not read any of these. They are here because they
                        are yours, and they can be useful to you.
                      </p>
                      <div className="grid gap-4 sm:grid-cols-2">
                        {UNSCORED_NUMBERS.map((f) => (
                          <Field key={f.k} label={`${f.label} (${f.unit})`} hint="optional">
                            <input
                              type="number"
                              step="0.1"
                              inputMode="decimal"
                              value={(profile[f.k] as number | null) ?? ""}
                              onChange={(e) =>
                                update(f.k, (e.target.value === "" ? null : Number(e.target.value)) as Profile[typeof f.k])
                              }
                              className={inputClass}
                              placeholder="—"
                            />
                          </Field>
                        ))}
                      </div>
                      <div>
                        <p className="mb-1.5 text-xs font-medium text-ink-soft">I shop in</p>
                        <div className="flex flex-wrap gap-2">
                          {SHOPS_OPTIONS.map((s) => {
                            const set = new Set((profile.shopsFor ?? "").split(",").filter(Boolean));
                            const active = set.has(s);
                            return (
                              <button
                                key={s}
                                type="button"
                                onClick={() => {
                                  if (active) set.delete(s); else set.add(s);
                                  update("shopsFor", Array.from(set).join(",") || null);
                                }}
                                className={`min-h-11 flex-1 rounded-xl border px-3 py-2 text-xs capitalize transition-all ${
                                  active
                                    ? "border-brand bg-brand-tint ring-1 ring-brand text-brand"
                                    : "border-line text-ink hover:border-ink-faint"
                                }`}
                              >
                                {s}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <Field label="Notes" hint="anything the numbers miss">
                        <textarea
                          value={profile.notes ?? ""}
                          onChange={(e) => update("notes", e.target.value)}
                          rows={2}
                          className={inputClass}
                          placeholder="e.g. long torso, broad shoulders, prefer soft cotton"
                        />
                      </Field>
                    </div>
                  )}
                </>
              )}
            </Card>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              {stepIndex > 0 && (
                <Button type="button" variant="secondary" onClick={() => setStepIndex(stepIndex - 1)}>
                  Back
                </Button>
              )}
              {isLast ? (
                <Button type="button" size="lg" onClick={save} disabled={status === "saving"}>
                  {status === "saving" ? "Saving…" : "Save passport"}
                </Button>
              ) : (
                <Button type="button" size="lg" onClick={() => setStepIndex(stepIndex + 1)}>
                  Continue
                </Button>
              )}
              {status === "error" && (
                <span className="text-sm text-red-700">Something went wrong.</span>
              )}
            </div>

            {/* The skip is a first-class path, not fine print. */}
            <p className="mt-6 text-sm text-ink-faint">
              <LinkButton href="/check" variant="ghost" className="!px-0 !text-ink-faint underline">
                Skip this — check a size now
              </LinkButton>
              {" "}You&apos;ll get a real answer at lower confidence, and we&apos;ll say what
              would sharpen it.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
