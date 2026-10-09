"use client";

// /body — "my 3D body" (Session 98, phase 3). The founder: the 3D view must be
// findable, must show something from height and weight alone, must have a face
// that is not frightening, and must say what more data unlocks.
//
//   - Dress form or realistic body (Anny), a face for the realistic one (sculpted,
//     eyes closed; lib/annyHead.ts) and a body colour, remembered in this browser.
//   - With height and weight only, Anny gives the shape, and the dress form borrows
//     the girths measured on it, labelled as estimated. Those numbers are for the
//     drawing alone and never reach the engine (invariant 98).
//   - A size checked on /check arrives in the URL (lib/bodyView.ts fitLink) and can
//     be laid on the body as its fit colours, with the centimetres printed beside.
//
// three.js, the body file and each face load only when needed.

import Link from "next/link";
import { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import { Card, Page, PageHeader } from "@/components/ui";
import { Check, Lock } from "@/components/Icon";
import { SafeBoundary } from "@/components/SafeBoundary";
import { useT } from "@/i18n/client";
import { BODY_TONES, bodyReadiness, readFitLink, type FitView, type ReadinessItem, type ToneId } from "@/lib/bodyView";
import { VERDICT_COLOUR } from "@/lib/fitMapColours";
import type { AnnyData, AnnyFit } from "@/lib/annyBody";
import type { Attachment } from "@/components/FitMap3D";
import { FACE_IDS, defaultHead, type HeadChoice, type HeadsMeta } from "@/lib/annyHead";

const FitMap3D = lazy(() => import("@/components/FitMap3D").then((m) => ({ default: m.FitMap3D })));

type Profile = {
  sex?: string | null; heightCm?: number | null; weightKg?: number | null; chestCm?: number | null;
  waistCm?: number | null; hipCm?: number | null; shoulderCm?: number | null; inseamCm?: number | null;
};
type Prefs = { kind: "form" | "real"; head: HeadChoice | null; tone: ToneId };
const PREFS_KEY = "fp-body3d";
const DEFAULT_PREFS: Prefs = { kind: "real", head: null, tone: "form" };

function readPrefs(): Prefs {
  try {
    const p = JSON.parse(localStorage.getItem(PREFS_KEY) ?? "null");
    if (p && (p.kind === "form" || p.kind === "real")) {
      return {
        kind: p.kind,
        head: p.head === "form" || FACE_IDS.includes(p.head) ? p.head : null,
        tone: BODY_TONES.some((t) => t.id === p.tone) ? p.tone : "form",
      };
    }
  } catch { /* private window or blocked storage: the defaults */ }
  return DEFAULT_PREFS;
}

const PASSPORT_FIELD: Record<ReadinessItem, string> = {
  heightCm: "measurements", weightKg: "measurements", chestCm: "measurements", waistCm: "measurements",
  hipCm: "measurements", shoulderCm: "measurements", sex: "reference",
};
const editLink = (focus: string) => `/passport?edit=1&focus=${focus}`;

export function BodyStudio() {
  const t = useT("body3d");
  const tf = useT("fit");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fitView, setFitView] = useState<FitView | null>(null);
  const [showFit, setShowFit] = useState(true);
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [anny, setAnny] = useState<{ data: AnnyData; lib: typeof import("@/lib/annyBody") } | null>(null);
  const [head, setHead] = useState<{ id: string; attachment: Attachment } | null>(null);
  const [error, setError] = useState(false);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    setPrefs(readPrefs());
    setFitView(readFitLink(new URLSearchParams(window.location.search)));
    fetch("/api/profile").then((r) => r.json()).then((d) => setProfile(d.profile ?? {})).catch(() => setProfile({}));
  }, []);
  const choose = (next: Partial<Prefs>) => {
    const p = { ...prefs, ...next };
    setPrefs(p);
    try { localStorage.setItem(PREFS_KEY, JSON.stringify(p)); } catch { /* not kept; still shown */ }
  };

  const sex: "male" | "female" | null = profile?.sex === "male" || profile?.sex === "female" ? profile.sex : null;
  const ready = bodyReadiness(profile ?? {});
  const unlocked = profile != null && ready.level !== "locked";
  const needAnny = unlocked && (prefs.kind === "real" || ready.girthsMissing.length > 0);

  useEffect(() => {
    if (!needAnny || anny) return;
    import("@/lib/annyBody")
      .then(async (lib) => setAnny({ data: await lib.loadAnny(), lib }))
      .catch(() => setError(true));
  }, [needAnny, anny]);

  const measurements = useMemo(() => ({
    heightCm: profile?.heightCm, weightKg: profile?.weightKg, chestCm: profile?.chestCm, waistCm: profile?.waistCm,
    hipCm: profile?.hipCm, shoulderCm: profile?.shoulderCm, inseamCm: profile?.inseamCm, sex,
  }), [profile, sex]);

  const fit: AnnyFit | null = useMemo(
    () => (anny && unlocked ? anny.lib.fitAnny(anny.data, measurements) : null),
    [anny, unlocked, measurements],
  );
  // The dress form's missing girths, measured on the realistic body: drawing only.
  const estimate = useMemo(
    () => (anny && fit && ready.girthsMissing.length ? anny.lib.estimateGirths(anny.data, fit) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [anny, fit, ready.girthsMissing.join()],
  );
  const formMeasurements = useMemo(() => {
    if (!estimate) return measurements;
    const m = { ...measurements };
    for (const k of ready.girthsMissing) m[k] = estimate[k];
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [measurements, estimate, ready.girthsMissing.join()]);

  const headChoice: HeadChoice = prefs.head ?? defaultHead(sex);
  useEffect(() => {
    if (prefs.kind !== "real" || headChoice === "form" || !anny || !fit) { setHead(null); return; }
    let live = true;
    (async () => {
      try {
        const lib = await import("@/lib/annyHead");
        const meta: HeadsMeta = await fetch("/anny/heads.json").then((r) => r.json());
        const fm = meta.faces.find((f) => f.id === headChoice);
        if (!fm) return;
        const buf = await fetch(`/anny/head-${headChoice}.bin.gz`).then((r) => r.arrayBuffer()).then(anny.lib.inflate);
        const face = lib.parseFace(buf, fm, meta.unitPerCm);
        if (live) setHead({ id: headChoice, attachment: { positions: lib.placeFace(face, fm, fit.body.positions, anny.data), indices: face.indices } });
      } catch {
        if (live) setHead(null); // the ellipsoid stays: a plain head is better than none
      }
    })();
    return () => { live = false; };
  }, [prefs.kind, headChoice, anny, fit]);

  // The viewer fills its column, up to 560 px.
  const boxRef = useRef<HTMLDivElement>(null);
  const [px, setPx] = useState(360);
  useEffect(() => {
    const el = boxRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([e]) => setPx(Math.max(260, Math.min(560, Math.floor(e.contentRect.width)))));
    ro.observe(el);
    return () => ro.disconnect();
  }, [unlocked]);

  const tone = BODY_TONES.find((x) => x.id === prefs.tone)?.hex ?? BODY_TONES[0].hex;
  const zones = fitView && showFit ? fitView.zones : null;
  const realBody = prefs.kind === "real" && fit
    ? head && head.id === headChoice && anny
      ? { ...fit.body, indices: (anny.data.meta.headEllipsoid ? anny.data.indices.subarray(0, anny.data.meta.headEllipsoid.faces[0] * 3) : anny.data.indices) }
      : fit.body
    : null;
  const formReady = prefs.kind === "form" && (!ready.girthsMissing.length || estimate);
  const canDraw = realBody || formReady;
  const cm = (d: number) => `${d > 0 ? "+" : d < 0 ? "−" : ""}${Math.abs(d).toFixed(1)} cm`;

  const header = (
    <PageHeader
      eyebrow={t("eyebrow")}
      title={t("title")}
      lede={t("lede")}
      action={<Link href={editLink("measurements")} className="text-sm font-medium text-ink-soft underline decoration-line underline-offset-4 hover:text-ink">{t("editPassport")}</Link>}
    />
  );

  const checklist = (
    <div>
      <h2 className="text-sm font-semibold text-ink">{t("builtFrom")}</h2>
      <ul className="mt-2 divide-y divide-line rounded-xl border border-line bg-white">
        {(["heightCm", "weightKg", "sex", "chestCm", "waistCm", "hipCm", "shoulderCm"] as const).map((k) => {
          const done = ready.done.includes(k);
          const v = profile?.[k];
          return (
            <li key={k} className="flex items-center gap-2.5 px-3 py-2 text-sm">
              <span className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full ${done ? "bg-ok/15 text-ok" : "border border-dashed border-line"}`}>
                {done && <Check size={12} />}
              </span>
              <span className={done ? "text-ink" : "text-ink-soft"}>{t(`items.${k}`)}</span>
              {k === "sex" && !done && <span className="truncate text-[11px] text-ink-faint">{t("sexWhy")}</span>}
              <span className="ml-auto flex-shrink-0 tabular-nums text-xs text-ink-soft">
                {done
                  ? k === "sex" ? "" : k === "weightKg" ? `${v} kg` : `${v} cm`
                  : <Link href={editLink(PASSPORT_FIELD[k])} className="font-medium text-brand hover:underline">{t("add")}</Link>}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );

  if (!profile) {
    return <Page>{header}<div className="mt-10 h-[420px] animate-pulse rounded-3xl bg-paper-soft" /></Page>;
  }

  if (!unlocked) {
    return (
      <Page>
        {header}
        <Card className="mt-10">
          <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_20rem] md:items-start">
            <div className="flex flex-col items-center justify-center gap-4 rounded-2xl bg-paper-soft px-6 py-12 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-ink-soft ring-1 ring-line"><Lock size={20} /></span>
              <h2 className="max-w-sm text-h3 font-semibold text-ink">{t("lockedTitle")}</h2>
              <p className="max-w-md text-sm leading-relaxed text-ink-soft">{t("lockedBody")}</p>
              <Link href={editLink("measurements")} className="mt-1 inline-flex h-11 items-center whitespace-nowrap rounded-full bg-ink px-5 text-sm font-medium text-paper hover:bg-ink/90">{t("lockedCta")}</Link>
            </div>
            {checklist}
          </div>
        </Card>
      </Page>
    );
  }

  const segment = (on: boolean) =>
    `flex-1 whitespace-nowrap rounded-full px-3 py-2 text-xs font-medium transition-colors ${on ? "bg-ink text-paper" : "text-ink-soft hover:text-ink"}`;

  return (
    <Page>
      {header}
      <div className="mt-10 grid gap-6 md:grid-cols-[minmax(0,1fr)_20rem] md:items-start">
        <div className="min-w-0">
          <div ref={boxRef} className="relative flex justify-center overflow-hidden rounded-3xl bg-paper-soft">
            {error ? (
              <p className="flex h-[360px] items-center px-6 text-center text-sm text-ink-faint">{t("cantStart")}</p>
            ) : canDraw ? (
              <SafeBoundary fallback={<p className="flex h-[360px] items-center px-6 text-center text-sm text-ink-faint">{t("cantStart")}</p>}>
                <Suspense fallback={<div className="animate-pulse" style={{ width: px, height: px }} />}>
                  <FitMap3D
                    size={px}
                    measurements={prefs.kind === "form" ? formMeasurements : measurements}
                    body={realBody}
                    zones={zones}
                    tint={tone}
                    head={realBody && head?.id === headChoice ? head.attachment : null}
                    zoom={zoom}
                  />
                </Suspense>
              </SafeBoundary>
            ) : (
              <div className="flex items-center justify-center text-sm text-ink-faint" style={{ width: px, height: px }}>{t("loading")}</div>
            )}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between p-3">
              <span className="rounded-full bg-white/80 px-2.5 py-1 text-[11px] text-ink-soft backdrop-blur">{t("drag")}</span>
              <span className="pointer-events-auto flex overflow-hidden rounded-full bg-white/90 ring-1 ring-line backdrop-blur">
                <button type="button" aria-label={t("zoomOut")} disabled={zoom <= 1} onClick={() => setZoom((z) => Math.max(1, z - 0.5))} className="h-9 w-9 text-lg text-ink disabled:text-ink-faint">−</button>
                <button type="button" aria-label={t("zoomIn")} disabled={zoom >= 3} onClick={() => setZoom((z) => Math.min(3, z + 0.5))} className="h-9 w-9 border-l border-line text-lg text-ink disabled:text-ink-faint">+</button>
              </span>
            </div>
          </div>
          <div className="mt-3 space-y-1.5 text-xs leading-relaxed text-ink-soft">
            {ready.level === "rough" && <p>{t("roughNote")}</p>}
            {ready.level === "own" && <p>{t("ownNote", { n: ready.girthsMissing.length })}</p>}
            {prefs.kind === "form" && estimate && <p className="rounded-lg bg-warn-tint px-3 py-2 text-warn">{t("estimated")}</p>}
          </div>
        </div>

        <div className="min-w-0 space-y-6">
          <section>
            <h2 className="text-sm font-semibold text-ink">{t("bodyLabel")}</h2>
            <div role="radiogroup" aria-label={t("bodyLabel")} className="mt-2 flex rounded-full bg-paper-soft p-1 ring-1 ring-line">
              {(["real", "form"] as const).map((k) => (
                <button key={k} type="button" role="radio" aria-checked={prefs.kind === k} onClick={() => choose({ kind: k })} className={segment(prefs.kind === k)}>
                  {t(k)}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[11px] text-ink-faint">{t(prefs.kind === "real" ? "realHint" : "formHint")}</p>
          </section>

          {prefs.kind === "real" && (
            <section>
              <h2 className="text-sm font-semibold text-ink">{t("faceLabel")}</h2>
              <div role="radiogroup" aria-label={t("faceLabel")} className="mt-2 flex flex-wrap gap-1.5">
                {([...FACE_IDS, "form"] as const).map((id) => (
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={headChoice === id}
                    onClick={() => choose({ head: id })}
                    className={`h-9 whitespace-nowrap rounded-full border px-3 text-xs font-medium transition-colors ${headChoice === id ? "border-ink bg-ink text-paper" : "border-line bg-white text-ink-soft hover:border-ink/40 hover:text-ink"}`}
                  >
                    {t(`faces.${id}`)}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-[11px] text-ink-faint">{t("faceNote")}</p>
            </section>
          )}

          <section>
            <h2 className="text-sm font-semibold text-ink">{t("toneLabel")}</h2>
            <div role="radiogroup" aria-label={t("toneLabel")} className="mt-2 flex flex-wrap gap-3">
              {BODY_TONES.map((x) => (
                <button key={x.id} type="button" role="radio" aria-checked={prefs.tone === x.id} onClick={() => choose({ tone: x.id })} className="flex flex-col items-center gap-1">
                  <span className={`h-8 w-8 rounded-full ring-offset-2 transition ${prefs.tone === x.id ? "ring-2 ring-ink" : "ring-1 ring-line"}`} style={{ background: x.hex }} />
                  <span className={`text-[11px] ${prefs.tone === x.id ? "font-medium text-ink" : "text-ink-soft"}`}>{t(`tones.${x.id}`)}</span>
                </button>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-ink">{t("fitLabel")}</h2>
            {fitView ? (
              <div className="mt-2 rounded-xl border border-line bg-white p-3">
                <p className="text-xs text-ink-soft">
                  {fitView.item ? t("fitFrom", { size: fitView.size, item: fitView.item }) : t("fitFromNoItem", { size: fitView.size })}
                </p>
                <label className="mt-2 flex w-fit items-center gap-2 text-xs text-ink">
                  <input type="checkbox" className="accent-brand" checked={showFit} onChange={(e) => setShowFit(e.target.checked)} />
                  {t("fitShow")}
                </label>
                <ul className="mt-2 space-y-1">
                  {fitView.zones.map((z) => (
                    <li key={z.key} className="flex items-center gap-2 text-xs">
                      <span aria-hidden className="h-2.5 w-2.5 flex-shrink-0 rounded-full ring-1 ring-ink/10" style={{ background: VERDICT_COLOUR[z.verdict] }} />
                      <span className="text-ink">{t(`residualPart.${z.key}`)}</span>
                      <span className="ml-auto font-semibold tabular-nums text-ink">{cm(z.deltaCm)}</span>
                      <span className="w-20 text-right text-ink-soft">{tf(`verdict.${z.verdict}`)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">{t("fitNone")}</p>
            )}
          </section>

          {checklist}

          {prefs.kind === "real" && fit && Object.keys(fit.residuals).some((k) => k !== "height") && (
            <section>
              <h2 className="text-sm font-semibold text-ink">{t("residualTitle")}</h2>
              <p className="mt-0.5 text-[11px] text-ink-faint">{t("residualBody")}</p>
              <ul className="mt-2 space-y-1 text-xs">
                {(["chest", "waist", "hip", "shoulder"] as const).filter((k) => fit.residuals[k] != null).map((k) => (
                  <li key={k} className="flex justify-between"><span className="text-ink-soft">{t(`residualPart.${k}`)}</span><span className="tabular-nums text-ink">{cm(fit.residuals[k]!)}</span></li>
                ))}
              </ul>
            </section>
          )}

          <p className="text-[11px] leading-relaxed text-ink-faint">{t("privacy")} {prefs.kind === "real" && t("credit")}</p>
        </div>
      </div>
    </Page>
  );
}
