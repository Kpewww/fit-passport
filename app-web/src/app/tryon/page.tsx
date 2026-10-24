"use client";

// AI try-on (Session 104, plan phase 4c): a closet piece on the person's own photo.
// A preview of looks only: every result carries the "not a size or fit answer" label,
// and the size engine never reads it. Off, with a note, until the founder sets a key
// and a budget.

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Sparkle, Trash } from "@/components/Icon";
import { Button, Card, Page, PageHeader } from "@/components/ui";
import { GarmentIcon } from "@/components/GarmentIcon";
import { PhotoSource } from "@/components/PhotoSource";
import { AiConsentDialog, useAiStatus } from "@/components/AiConsent";
import { resizeBodyPhoto } from "@/lib/imageResize";
import { useT } from "@/i18n/client";
import { useGarmentText } from "@/i18n/garment";

type Piece = { id: string; brand: string; displayName: string | null; category: string; size: string; imageDataUrl: string | null; cutoutPhoto?: string | null };
type BodyPhoto = { id: string; url: string };
type Job = { id: string; status: "running" | "done" | "failed"; itemId: string | null; hasResult: boolean };
type ErrorKey = "consent" | "not-found" | "no-photo" | "off" | "budget" | "daily" | "failed";

export default function TryonPage() {
  const t = useT("ai");
  const g = useGarmentText();
  const [status, refresh] = useAiStatus();
  const [photos, setPhotos] = useState<BodyPhoto[]>([]);
  const [photoId, setPhotoId] = useState<string | null>(null);
  const [closet, setCloset] = useState<Piece[]>([]);
  const [itemId, setItemId] = useState<string | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [asking, setAsking] = useState<null | (() => void)>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ErrorKey | null>(null);
  const [cleared, setCleared] = useState(false);
  const ready = !!status?.tryon.enabled && !!status.claimed;

  const load = useCallback(() => {
    fetch("/api/ai/photos").then((r) => (r.ok ? r.json() : { photos: [] })).then((d) => {
      setPhotos(d.photos ?? []);
      setPhotoId((cur) => cur ?? d.photos?.[0]?.id ?? null);
    }).catch(() => {});
    fetch("/api/ai/tryon").then((r) => (r.ok ? r.json() : { jobs: [] })).then((d) => setJobs(d.jobs ?? [])).catch(() => {});
  }, []);
  useEffect(() => {
    if (!ready) return;
    load();
    fetch("/api/closet").then((r) => r.json()).then((d) => setCloset((d.items ?? []).filter((p: Piece) => p.imageDataUrl))).catch(() => {});
    // Arriving from a closet piece (?item=…) picks it.
    const wanted = new URLSearchParams(window.location.search).get("item");
    if (wanted) setItemId(wanted);
  }, [ready, load]);

  // Ask about running jobs every 2.5 s until they finish.
  useEffect(() => {
    const running = jobs.filter((j) => j.status === "running");
    if (!running.length) return;
    const timer = setTimeout(async () => {
      const next = await Promise.all(running.map((j) => fetch(`/api/ai/jobs/${j.id}`).then((r) => (r.ok ? r.json() : null)).catch(() => null)));
      setJobs((prev) => prev.map((j) => next.find((n) => n?.job?.id === j.id)?.job ?? j));
      if (next.some((n) => n?.job && n.job.status !== "running")) refresh();
    }, 2500);
    return () => clearTimeout(timer);
  }, [jobs, refresh]);

  const withConsent = (go: () => void) => (status?.tryon.consent ? go() : setAsking(() => go));

  async function upload(file: Blob) {
    setError(null);
    const dataUrl = await resizeBodyPhoto(file);
    const r = await fetch("/api/ai/photos", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ dataUrl }) }).catch(() => null);
    if (!r?.ok) return setError(((await r?.json().catch(() => ({})))?.error as ErrorKey) ?? "failed");
    const { photo } = await r.json();
    setPhotoId(photo.id);
    load();
  }
  async function removePhoto(id: string) {
    await fetch(`/api/ai/photos?id=${encodeURIComponent(id)}`, { method: "DELETE" }).catch(() => null);
    if (photoId === id) setPhotoId(null);
    load();
  }
  async function go() {
    if (!photoId || !itemId) return;
    setBusy(true);
    setError(null);
    const r = await fetch("/api/ai/tryon", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ aiPhotoId: photoId, itemId }) }).catch(() => null);
    setBusy(false);
    if (!r?.ok) {
      setError(((await r?.json().catch(() => ({})))?.error as ErrorKey) ?? "failed");
      return refresh();
    }
    const { jobId } = await r.json();
    setJobs((prev) => [{ id: jobId, status: "running", itemId, hasResult: false }, ...prev]);
    refresh();
  }
  async function removeJob(id: string) {
    await fetch(`/api/ai/jobs/${id}`, { method: "DELETE" }).catch(() => null);
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, hasResult: false } : j)).filter((j) => j.id !== id || j.status === "running"));
  }
  async function deleteAll() {
    await fetch("/api/ai/all", { method: "DELETE" }).catch(() => null);
    setCleared(true);
    setPhotoId(null);
    load();
  }
  async function withdraw() {
    await fetch("/api/ai/consent", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind: "tryon", accept: false }) }).catch(() => null);
    refresh();
  }

  const pieceOf = (id: string | null) => closet.find((c) => c.id === id);
  const gateNote = !status ? null : !status.tryon.enabled ? t("tryon.off") : !status.claimed ? t("claimFirst") : null;

  return (
    <Page>
      <PageHeader eyebrow={t("tryon.eyebrow")} title={t("tryon.title")} lede={t("tryon.lede")} />

      {!status ? null : gateNote ? (
        <Card className="mt-8">
          <p className="text-sm text-ink-soft">
            {gateNote}{" "}
            {status.tryon.enabled && <Link href="/account" aria-label={gateNote} className="text-brand hover:underline"><ArrowRight size={14} className="-mt-px inline" /></Link>}
          </p>
        </Card>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Card className="!p-5 space-y-6">
            {/* 1. The person's own photo */}
            <section>
              <h2 className="text-sm font-semibold text-ink">1 · {t("tryon.step1")}</h2>
              <p className="mt-1 text-xs text-ink-soft">{t("tryon.step1Hint")}</p>
              <div className="mt-3 flex flex-wrap gap-3">
                {photos.map((p) => (
                  <div key={p.id} className="relative">
                    <button type="button" aria-pressed={photoId === p.id} onClick={() => setPhotoId(p.id)}
                      className={`block overflow-hidden rounded-xl ${photoId === p.id ? "ring-2 ring-ink" : "ring-1 ring-line"}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.url} alt="" className="h-36 w-24 object-cover" />
                    </button>
                    <button type="button" aria-label={t("tryon.deletePhoto")} onClick={() => removePhoto(p.id)}
                      className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-ink-soft shadow ring-1 ring-line hover:text-ink">
                      <Trash size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-3">
                <PhotoSource listenForPaste={false} onPick={(b) => withConsent(() => void upload(b[0]))} />
              </div>
            </section>

            {/* 2. A closet piece with a photo */}
            <section>
              <h2 className="text-sm font-semibold text-ink">2 · {t("tryon.step2")}</h2>
              <p className="mt-1 text-xs text-ink-soft">{t("tryon.step2Hint")}</p>
              {closet.length === 0 ? (
                <p className="mt-3 text-xs text-ink-soft">{t("tryon.noPieces")} <Link href="/closet" aria-label={t("tryon.noPieces")} className="text-brand hover:underline"><ArrowRight size={14} className="-mt-px inline" /></Link></p>
              ) : (
                <div className="mt-3 grid max-h-72 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4">
                  {closet.map((c) => (
                    <button key={c.id} type="button" aria-pressed={itemId === c.id} onClick={() => setItemId(c.id)}
                      className={`overflow-hidden rounded-xl bg-paper-soft text-left ${itemId === c.id ? "ring-2 ring-ink" : "ring-1 ring-line"}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={c.cutoutPhoto ?? c.imageDataUrl!} alt="" className="aspect-[4/5] w-full object-cover" />
                      <span className="block truncate px-1.5 py-1 text-[11px] text-ink">{c.displayName || c.brand} · {c.size}</span>
                    </button>
                  ))}
                </div>
              )}
            </section>

            <div>
              <Button className="w-full" icon={<Sparkle size={18} />} loading={busy} disabled={!photoId || !itemId || status.leftToday <= 0} onClick={() => withConsent(() => void go())}>
                {t("tryon.go")}
              </Button>
              <p className="mt-2 text-center text-xs text-ink-faint">{t("tryon.leftToday", { n: status.leftToday })}</p>
              {error && <p role="alert" className="mt-2 text-center text-xs text-bad">{t(`errors.${error}`)}</p>}
            </div>
          </Card>

          {/* Results */}
          <Card className="!p-5">
            <h2 className="text-sm font-semibold text-ink">{t("tryon.results")}</h2>
            <p className="mt-1 text-xs font-medium text-warn">{t("label")}</p>
            {jobs.length === 0 && <p className="mt-3 text-xs text-ink-faint">{t("tryon.none")}</p>}
            <div className="mt-3 grid grid-cols-2 gap-3">
              {jobs.map((j) => {
                const piece = pieceOf(j.itemId);
                return (
                  <figure key={j.id} className="overflow-hidden rounded-xl ring-1 ring-line">
                    {j.status === "running" ? (
                      <div className="flex aspect-[2/3] items-center justify-center bg-paper-soft p-3 text-center text-xs text-ink-soft">{t("tryon.running")}</div>
                    ) : j.status === "failed" ? (
                      <div className="flex aspect-[2/3] items-center justify-center bg-paper-soft p-3 text-center text-xs text-ink-soft">{t("tryon.failedOne")}</div>
                    ) : j.hasResult ? (
                      <div className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={`/api/ai/result/${j.id}`} alt={t("label")} className="aspect-[2/3] w-full object-cover" />
                        <span className="absolute left-2 top-2 rounded-full bg-ink/80 px-2 py-0.5 text-[10px] font-medium text-paper">AI</span>
                      </div>
                    ) : null}
                    <figcaption className="flex items-center justify-between gap-2 px-2 py-1.5 text-[11px]">
                      <span className="flex min-w-0 items-center gap-1 truncate text-ink-soft">
                        {piece && <GarmentIcon category={piece.category} size={14} />}
                        {piece ? `${piece.displayName || piece.brand} · ${g.label(piece.category)}` : ""}
                      </span>
                      {j.status !== "running" && (
                        <button type="button" onClick={() => removeJob(j.id)} className="flex-shrink-0 text-ink-faint hover:text-ink">{t("tryon.deleteOne")}</button>
                      )}
                    </figcaption>
                  </figure>
                );
              })}
            </div>
            <div className="mt-6 flex flex-wrap gap-2 border-t border-line pt-4">
              <Button size="sm" variant="ghost" icon={<Trash size={16} />} onClick={deleteAll}>{t("tryon.deleteAll")}</Button>
              {status.tryon.consent && <Button size="sm" variant="ghost" onClick={withdraw}>{t("tryon.withdraw")}</Button>}
              {cleared && <span className="self-center text-xs text-ink-faint">{t("tryon.deletedAll")}</span>}
            </div>
          </Card>
        </div>
      )}
      {asking && <AiConsentDialog kind="tryon" onDone={(ok) => { const next = asking; setAsking(null); refresh(); if (ok) next(); }} />}
    </Page>
  );
}
