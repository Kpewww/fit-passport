"use client";

// Asking before a photo leaves for an AI service (Session 104): who gets it, how long
// they keep it, no training by us, how to delete. One yes per kind, kept on the server.

import { useEffect, useState } from "react";
import { Button } from "@/components/ui";
import { Close } from "@/components/Icon";
import { useT } from "@/i18n/client";

export type AiStatus = {
  claimed: boolean;
  cutout: { enabled: boolean; consent: boolean };
  tryon: { enabled: boolean; consent: boolean };
  leftToday: number;
};

let cached: Promise<AiStatus | null> | null = null;

/** /api/ai/status, fetched once per page load; `refresh` asks again. */
export function useAiStatus(): [AiStatus | null, () => void] {
  const [s, setS] = useState<AiStatus | null>(null);
  const load = (force = false) => {
    if (force || !cached) cached = fetch("/api/ai/status").then((r) => (r.ok ? r.json() : null)).catch(() => null);
    cached.then(setS);
  };
  useEffect(() => load(), []);
  return [s, () => load(true)];
}

export function AiConsentDialog({ kind, onDone }: { kind: "cutout" | "tryon"; onDone: (agreed: boolean) => void }) {
  const t = useT("ai");
  const [busy, setBusy] = useState(false);
  async function agree() {
    setBusy(true);
    const r = await fetch("/api/ai/consent", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind, accept: true }) }).catch(() => null);
    setBusy(false);
    cached = null;
    onDone(!!r?.ok);
  }
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center" onClick={() => onDone(false)}>
      <div className="absolute inset-0 bg-ink/40" />
      <div role="dialog" aria-modal="true" aria-labelledby="ai-consent-title" onClick={(e) => e.stopPropagation()}
        className="relative z-10 w-full max-w-md rounded-t-2xl bg-white p-6 sm:rounded-2xl">
        <button type="button" aria-label={t("consent.cancel")} onClick={() => onDone(false)} className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full text-ink-soft hover:bg-ink/5">
          <Close size={20} />
        </button>
        <h2 id="ai-consent-title" className="pr-8 text-h3 font-semibold text-ink">{t(`consent.${kind}.title`)}</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-ink-soft">
          {(["p1", "p2", "p3", "p4"] as const).map((k) => <li key={k}>{t(`consent.${kind}.${k}`)}</li>)}
        </ul>
        <div className="mt-6 flex gap-2">
          <Button className="flex-1" loading={busy} onClick={agree}>{t("consent.agree")}</Button>
          <Button variant="secondary" onClick={() => onDone(false)}>{t("consent.cancel")}</Button>
        </div>
      </div>
    </div>
  );
}
