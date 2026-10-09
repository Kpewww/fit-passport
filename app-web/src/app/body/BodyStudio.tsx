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
import { BODY_TONES, CUPS, UNDERTONES, bodyReadiness, readFitLink, toneHex, type Cup, type FitView, type ReadinessItem, type ToneId, type Undertone } from "@/lib/bodyView";
import { VERDICT_COLOUR } from "@/lib/fitMapColours";
import type { AnnyData, AnnyFit } from "@/lib/annyBody";
import type { Attachment } from "@/components/FitMap3D";
import { HEAD_CHOICES, faceFor, type HeadChoice, type HeadsMeta } from "@/lib/annyHead";
import type { BodyGeometryData } from "@/lib/fitMapColours";

const FitMap3D = lazy(() => import("@/components/FitMap3D").then((m) => ({ default: m.FitMap3D })));

type Profile = {
  sex?: string | null; heightCm?: number | null; weightKg?: number | null; chestCm?: number | null;
  waistCm?: number | null; hipCm?: number | null; shoulderCm?: number | null; inseamCm?: number | null;
};
// The body's sex is chosen here (null: the passport's); the head is none or a face of
// face A, B or C; a cup size for a woman's body (Sessions 98d, 98f, 98g).
type Prefs = { kind: "form" | "real"; sex: "female" | "male" | null; head: HeadChoice; tone: ToneId; undertone: Undertone; cup: Cup | null };
const PREFS_KEY = "fp-body3d";
const DEFAULT_PREFS: Prefs = { kind: "real", sex: null, head: "none", tone: "form", undertone: "neutral", cup: null };

function readPrefs(): Prefs {
  try {
    const p = JSON.parse(localStorage.getItem(PREFS_KEY) ?? "null");
    if (p && (p.kind === "form" || p.kind === "real")) {
      return {
        kind: p.kind,
        sex: p.sex === "female" || p.sex === "male" ? p.sex : null,
        head: HEAD_CHOICES.includes(p.head) ? p.head : "none",
        tone: BODY_TONES.some((t) => t.id === p.tone) ? p.tone : "form",
        undertone: p.undertone in UNDERTONES ? p.undertone : "neutral",
        cup: p.cup && p.cup in CUPS ? p.cup : null,
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
  const [head, setHead] = useState<{ id: string; key: string; attachment: Attachment; chinY: number } | null>(null);
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

  const passportSex: "male" | "female" | null = profile?.sex === "male" || profile?.sex === "female" ? profile.sex : null;
  // What the page draws: the choice made here, else the passport's, else a woman's body.
  const sex: "male" | "female" = prefs.sex ?? passportSex ?? "female";
  const cup = sex === "female" ? prefs.cup : null;
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
  const fitInput = useMemo(() => ({ ...measurements, cup }), [measurements, cup]);

  const fit: AnnyFit | null = useMemo(
    () => (anny && unlocked ? anny.lib.fitAnny(anny.data, fitInput) : null),
    [anny, unlocked, fitInput],
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

  // The head: none (a shop mannequin's neck, the default; no face is assumed for anyone)
  // or face A, B or C as the wearer picks, for the body's sex.
  const headChoice: HeadChoice = prefs.head;
  const faceId = headChoice === "none" ? null : faceFor(sex, headChoice);
  const [faceFailed, setFaceFailed] = useState(false);
  useEffect(() => {
    setFaceFailed(false);
    if (prefs.kind !== "real" || !faceId || !anny || !fit) { setHead(null); return; }
    let live = true;
    (async () => {
      try {
        const lib = await import("@/lib/annyHead");
        const meta: HeadsMeta = await fetch("/anny/heads.json").then((r) => r.json());
        const fm = meta.faces.find((f) => f.id === faceId);
        if (!fm) throw new Error("no such face");
        const buf = await fetch(`/anny/head-${faceId}.bin.gz`).then((r) => r.arrayBuffer()).then(anny.lib.inflate);
        const face = lib.parseFace(buf, fm, meta.unitPerCm);
        if (live) setHead({ id: faceId, key: faceId, attachment: { positions: lib.placeFace(face, fm, fit.body.positions, anny.data), indices: face.indices }, chinY: lib.placedChinY(fm, fit.body.positions, anny.data) });
      } catch {
        if (live) { setHead(null); setFaceFailed(true); } // shown headless instead
      }
    })();
    return () => { live = false; };
  }, [prefs.kind, faceId, anny, fit]);

  // The shape tools: the neck cut and the rounding (lib/pnSubdivide.ts), loaded with the body.
  const [shape, setShape] = useState<{ cut: typeof import("@/lib/neckCut"); pn: typeof import("@/lib/pnSubdivide"); head: typeof import("@/lib/annyHead") } | null>(null);
  useEffect(() => {
    if (prefs.kind !== "real" || shape) return;
    Promise.all([import("@/lib/neckCut"), import("@/lib/pnSubdivide"), import("@/lib/annyHead")])
      .then(([cut, pn, head]) => setShape({ cut, pn, head }))
      .catch(() => setError(true));
  }, [prefs.kind, shape]);
  const faceReady = !!faceId && head?.id === faceId;
  // What is drawn: the body rounded, and with a face, the two joined at the neck
  // (neckCut.ts joinFaceAtNeck) so no seam shows.
  const real: { body: BodyGeometryData; face: Attachment | null } | null = useMemo(() => {
    if (prefs.kind !== "real" || !fit || !anny || !shape) return null;
    if (faceReady && head) {
      const at = shape.cut.joinLevel(fit.body, anny.data, head.chinY);
      const joined = shape.cut.joinFaceAtNeck(shape.cut.cutAtNeck(fit.body, anny.data, { cap: false, at }), head.attachment);
      return { body: shape.pn.roundBody(joined.body), face: joined.face };
    }
    if (!faceId || faceFailed) return { body: shape.pn.roundBody(shape.cut.cutAtNeck(fit.body, anny.data)), face: null };
    return null; // the face is on its way
  }, [prefs.kind, fit, anny, shape, faceReady, head, faceId, faceFailed]);
  const realBody = real?.body ?? null;

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

  const tone = toneHex(prefs.tone, prefs.undertone);
  const zones = fitView && showFit ? fitView.zones : null;
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
                    head={real?.face ?? null}
                    zoom={zoom}
                    skin={prefs.tone !== "form"}
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

          <section>
            <h2 className="text-sm font-semibold text-ink">{t("sexLabel")}</h2>
            <div role="radiogroup" aria-label={t("sexLabel")} className="mt-2 flex rounded-full bg-paper-soft p-1 ring-1 ring-line">
              {(["female", "male"] as const).map((k) => (
                <button key={k} type="button" role="radio" aria-checked={sex === k} onClick={() => choose({ sex: k })} className={segment(sex === k)}>
                  {t(`sexes.${k}`)}
                </button>
              ))}
            </div>
            {passportSex !== sex && <p className="mt-1.5 text-[11px] text-ink-faint">{t("sexNote")}</p>}
          </section>

          {sex === "female" && prefs.kind === "real" && (
            <section>
              <h2 className="text-sm font-semibold text-ink">{t("cupLabel")}</h2>
              <div role="radiogroup" aria-label={t("cupLabel")} className="mt-2 flex flex-wrap gap-1.5">
                {([null, ...Object.keys(CUPS)] as Array<Cup | null>).map((c) => (
                  <button
                    key={c ?? "auto"}
                    type="button"
                    role="radio"
                    aria-checked={cup === c}
                    onClick={() => choose({ cup: c })}
                    className={`h-9 min-w-[40px] whitespace-nowrap rounded-full border px-3 text-xs font-medium transition-colors ${cup === c ? "border-ink bg-ink text-paper" : "border-line bg-white text-ink-soft hover:border-ink/40 hover:text-ink"}`}
                  >
                    {c ?? t("cupAuto")}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-[11px] text-ink-faint">{t("cupNote")}</p>
              {cup && fit?.cupMeasure && (
                <p className="mt-1 text-[11px] tabular-nums text-ink-soft">
                  {t("cupDrawn", { bust: fit.cupMeasure.bustCm, under: fit.cupMeasure.underbustCm, diff: Math.round((fit.cupMeasure.bustCm - fit.cupMeasure.underbustCm) * 10) / 10 })}
                </p>
              )}
              {cup && fit?.residuals.cup != null && Math.abs(fit.residuals.cup) > 1 && (
                <p className="mt-1 text-[11px] text-warn">{t("cupResidual", { cup, cm: `${Math.abs(fit.residuals.cup).toFixed(1)} cm` })}</p>
              )}
            </section>
          )}

          {prefs.kind === "real" && (
            <section>
              <h2 className="text-sm font-semibold text-ink">{t("faceLabel")}</h2>
              <div role="radiogroup" aria-label={t("faceLabel")} className="mt-2 flex flex-wrap gap-1.5">
                {HEAD_CHOICES.map((id) => (
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={headChoice === id}
                    onClick={() => choose({ head: id })}
                    className={`h-9 whitespace-nowrap rounded-full border px-3 text-xs font-medium transition-colors ${headChoice === id ? "border-ink bg-ink text-paper" : "border-line bg-white text-ink-soft hover:border-ink/40 hover:text-ink"}`}
                  >
                    {t(`heads.${id}`)}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-[11px] text-ink-faint">{t(headChoice === "none" ? "noneNote" : "faceNote")}</p>
            </section>
          )}

          <section>
            <h2 className="text-sm font-semibold text-ink">{t("toneLabel")}</h2>
            {/* The mannequin's colour, then measured skin lightness, drawn in the chosen undertone. */}
            <div role="radiogroup" aria-label={t("toneLabel")} className="mt-2 grid grid-cols-7 gap-1.5">
              {BODY_TONES.map((x, i) => {
                const id = x.id as ToneId;
                const name = id === "form" ? t("tones.form") : t("toneN", { n: i });
                return (
                  <button key={id} type="button" role="radio" aria-checked={prefs.tone === id} aria-label={name} title={name} onClick={() => choose({ tone: id })} className="flex flex-col items-center gap-1">
                    <span className={`h-8 w-8 rounded-full ring-offset-2 transition ${prefs.tone === id ? "ring-2 ring-ink" : "ring-1 ring-ink/15"}`} style={{ background: toneHex(id, prefs.undertone) }} />
                    <span className={`text-[10px] tabular-nums ${prefs.tone === id ? "font-medium text-ink" : "text-ink-faint"}`}>{id === "form" ? t("tones.form") : i}</span>
                  </button>
                );
              })}
            </div>
            {prefs.tone !== "form" && (
              <div role="radiogroup" aria-label={t("undertoneLabel")} className="mt-2.5 flex rounded-full bg-paper-soft p-1 ring-1 ring-line">
                {(Object.keys(UNDERTONES) as Undertone[]).map((u) => (
                  <button key={u} type="button" role="radio" aria-checked={prefs.undertone === u} onClick={() => choose({ undertone: u })} className={segment(prefs.undertone === u)}>
                    {t(`undertones.${u}`)}
                  </button>
                ))}
              </div>
            )}
            <p className="mt-1.5 text-[11px] text-ink-faint">{t("toneNote")}</p>
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
                {(["chest", "waist", "hip", "shoulder", "cup"] as const).filter((k) => fit.residuals[k] != null).map((k) => (
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
