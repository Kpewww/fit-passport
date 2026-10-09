"use client";

// The two bodies side by side, on the signed-in wearer's own measurements, with the
// numbers the ship gate asks about: residual centimetres per girth, the asset's
// size, the fit's time, and the frame rate. Internal; English only on purpose.

import { Suspense, lazy, useEffect, useState } from "react";
import { SafeBoundary } from "@/components/SafeBoundary";
import type { AnnyFit } from "@/lib/annyBody";
import type { Zone } from "@/lib/fitMapColours";

const FitMap3D = lazy(() => import("@/components/FitMap3D").then((m) => ({ default: m.FitMap3D })));

type Profile = { sex?: string | null; heightCm?: number | null; weightKg?: number | null; chestCm?: number | null; waistCm?: number | null; hipCm?: number | null; shoulderCm?: number | null; inseamCm?: number | null };

const SAMPLE_ZONES: Zone[] = [
  { key: "shoulder", deltaCm: -0.5, verdict: "true to size" },
  { key: "chest", deltaCm: 3.2, verdict: "relaxed" },
  { key: "waist", deltaCm: -3.1, verdict: "snug" },
  { key: "hip", deltaCm: -7, verdict: "too small" },
];

export function BodyLab() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [anny, setAnny] = useState<{ fit: AnnyFit; bytes: number; ms: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [colours, setColours] = useState(true);
  const [fps, setFps] = useState<number | null>(null);
  // ?big=1: the realistic body alone, large, to judge the head and the surface.
  const [big, setBig] = useState(false);
  useEffect(() => { setBig(new URLSearchParams(window.location.search).has("big")); }, []);

  useEffect(() => {
    fetch("/api/profile").then((r) => r.json()).then((d) => setProfile(d.profile ?? {})).catch(() => setProfile({}));
  }, []);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      try {
        const t0 = performance.now();
        const { loadAnny, fitAnny } = await import("@/lib/annyBody");
        const data = await loadAnny();
        const sex = profile.sex === "male" || profile.sex === "female" ? profile.sex : null;
        const fit = fitAnny(data, { ...profile, sex });
        setAnny({ fit, bytes: 89716, ms: Math.round(performance.now() - t0) });
      } catch (e) {
        setError(String(e));
      }
    })();
  }, [profile]);

  // Frame rate of the page while both views spin.
  useEffect(() => {
    let frames = 0, raf = 0;
    const start = performance.now();
    const tick = () => {
      frames++;
      if (performance.now() - start < 3000) raf = requestAnimationFrame(tick);
      else setFps(Math.round((frames * 1000) / (performance.now() - start)));
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [anny]);

  const m = profile ?? {};
  const sex = m.sex === "male" || m.sex === "female" ? m.sex : null;
  const zones = colours ? SAMPLE_ZONES : null;
  const view = (body?: AnnyFit["body"], px = 420) => (
    <SafeBoundary fallback={<p className="text-xs text-ink-faint">WebGL could not start.</p>}>
      <Suspense fallback={<div className="animate-pulse rounded-2xl bg-paper-dim" style={{ width: px, height: px }} />}>
        <FitMap3D size={px} measurements={{ ...m, sex }} zones={zones} body={body ?? null} />
      </Suspense>
    </SafeBoundary>
  );

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="font-serif text-h1 text-ink">Body lab</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-soft">
        The dress form and the realistic body, on your passport&apos;s measurements. The colours are sample zones, the same on both.
        The page people see is <a href="/body" className="text-brand underline">/body</a>.
      </p>
      <label className="mt-4 flex w-fit items-center gap-2 text-sm">
        <input type="checkbox" checked={colours} onChange={(e) => setColours(e.target.checked)} /> Sample fit colours
      </label>

      {big && anny && <div className="mt-6 flex justify-center rounded-2xl bg-paper-soft">{view(anny.fit.body, 900)}</div>}
      <div className={`mt-6 grid gap-6 md:grid-cols-2 ${big ? "hidden" : ""}`}>
        <section className="rounded-2xl bg-paper-soft p-4">
          <h2 className="text-sm font-semibold text-ink">Dress form</h2>
          <div className="mt-3 flex justify-center">{profile && view()}</div>
        </section>
        <section className="rounded-2xl bg-paper-soft p-4">
          <h2 className="text-sm font-semibold text-ink">Anny (NAVER, Apache 2.0)</h2>
          <div className="mt-3 flex justify-center">{anny ? view(anny.fit.body) : <div className="h-[420px] w-[420px] animate-pulse rounded-2xl bg-paper-dim" />}</div>
          {error && <p className="mt-2 text-xs text-bad">{error}</p>}
        </section>
      </div>

      {anny && (
        <table className="mt-6 text-sm">
          <tbody>
            <tr><td className="pr-6 text-ink-soft">Asset</td><td className="tabular-nums">{(anny.bytes / 1024).toFixed(0)} KB gzip (body.bin.gz)</td></tr>
            <tr><td className="pr-6 text-ink-soft">Fetch + fit</td><td className="tabular-nums">{anny.ms} ms</td></tr>
            <tr><td className="pr-6 text-ink-soft">Frame rate</td><td className="tabular-nums">{fps ?? "…"} fps</td></tr>
            {Object.entries(anny.fit.residuals).map(([k, v]) => (
              <tr key={k}><td className="pr-6 text-ink-soft">Residual, {k}</td><td className="tabular-nums">{v! > 0 ? "+" : ""}{v} cm</td></tr>
            ))}
            <tr><td className="pr-6 text-ink-soft">Phenotype</td><td className="tabular-nums">{JSON.stringify(anny.fit.phenotype)}</td></tr>
          </tbody>
        </table>
      )}
    </main>
  );
}
