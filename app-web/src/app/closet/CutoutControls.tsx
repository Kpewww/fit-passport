"use client";

// "Remove background (AI)" on a closet piece (Session 104, plan phase 4b). The original
// photo is never changed: the cut-out is a second picture, shown when chosen, deleted
// on request. Hidden entirely when the feature is off.

import { useState } from "react";
import { Button, LinkButton, Segmented } from "@/components/ui";
import { Sparkle, Trash } from "@/components/Icon";
import { AiConsentDialog, useAiStatus } from "@/components/AiConsent";
import { useT } from "@/i18n/client";
import type { Item } from "./shared";

type ErrorKey = "consent" | "not-found" | "no-photo" | "off" | "budget" | "daily" | "failed";

export function CutoutControls({ item, onChanged, onPatch }: { item: Item; onChanged: () => void; onPatch: (id: string, data: Record<string, unknown>) => void }) {
  const t = useT("ai");
  const [status, refresh] = useAiStatus();
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ErrorKey | null>(null);
  if (!status?.cutout.enabled || !item.imageDataUrl) return null;
  if (!status.claimed) return <p className="mt-2 text-xs text-ink-faint">{t("claimFirst")}</p>;

  async function run() {
    setBusy(true);
    setError(null);
    const r = await fetch("/api/ai/cutout", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ itemId: item.id }) }).catch(() => null);
    setBusy(false);
    if (r?.ok) return onChanged();
    const body = r ? await r.json().catch(() => ({})) : {};
    setError((body.error as ErrorKey) ?? "failed");
  }
  function start() {
    if (!status!.cutout.consent) return setAsking(true);
    void run();
  }
  async function remove() {
    setBusy(true);
    await fetch(`/api/ai/cutout?itemId=${encodeURIComponent(item.id)}`, { method: "DELETE" }).catch(() => null);
    setBusy(false);
    onChanged();
  }

  const view = item.photoView === "cutout" && item.cutoutPhoto ? "cutout" : "original";
  return (
    <div className="mt-3 space-y-2">
      {item.cutoutPhoto ? (
        <div className="flex flex-wrap items-center gap-2">
          <Segmented label={t("cutout.cut")} value={view} onChange={(v) => onPatch(item.id, { photoView: v })}
            options={[{ value: "original", label: t("cutout.original") }, { value: "cutout", label: t("cutout.cut") }]} />
          <Button size="sm" variant="ghost" icon={<Sparkle size={16} />} loading={busy} onClick={start}>{t("cutout.redo")}</Button>
          <Button size="sm" variant="ghost" icon={<Trash size={16} />} disabled={busy} onClick={remove}>{t("cutout.remove")}</Button>
        </div>
      ) : (
        <Button size="sm" variant="secondary" icon={<Sparkle size={16} />} loading={busy} onClick={start}>{busy ? t("working") : t("cutout.run")}</Button>
      )}
      {error && <p role="alert" className="text-xs text-bad">{t(`errors.${error}`)}</p>}
      {asking && <AiConsentDialog kind="cutout" onDone={(ok) => { setAsking(false); refresh(); if (ok) void run(); }} />}
    </div>
  );
}

/** "Try it on" from a closet piece, when AI try-on is switched on (Session 104). */
export function TryonLink({ item }: { item: Item }) {
  const t = useT("ai");
  const [status] = useAiStatus();
  if (!status?.tryon.enabled || !item.imageDataUrl) return null;
  return (
    <LinkButton href={`/tryon?item=${encodeURIComponent(item.id)}`} size="sm" variant="ghost" icon={<Sparkle size={16} />}>
      {t("tryon.title")}
    </LinkButton>
  );
}
