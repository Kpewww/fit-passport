"use client";

// /feedback — tell us what went wrong, or what you wish it did (Session 100). Linked
// from every page's footer. Notes the page you came from; nothing else is attached.

import { useEffect, useState } from "react";
import { Button, Card, Page, PageHeader, inputClass } from "@/components/ui";
import { useT } from "@/i18n/client";

export default function FeedbackPage() {
  const t = useT("feedback");
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");
  const [from, setFrom] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const r = document.referrer ? new URL(document.referrer) : null;
      if (r && r.origin === location.origin && r.pathname !== "/feedback") setFrom(r.pathname);
    } catch { /* no page to note */ }
  }, []);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    setError(null);
    const r = await fetch("/api/feedback", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message, contact: contact || undefined, path: from ?? undefined }),
    }).catch(() => null);
    if (r?.ok) return setState("sent");
    const j = await r?.json().catch(() => null);
    setError(typeof j?.message === "string" ? j.message : t("failed"));
    setState("error");
  }

  return (
    <Page width="read">
      <PageHeader eyebrow={t("eyebrow")} title={t("title")} lede={t("lede")} />
      <Card className="mt-8">
        {state === "sent" ? (
          <p className="text-sm text-ink">{t("thanks")}</p>
        ) : (
          <form onSubmit={send} className="space-y-4">
            <label className="grid gap-1.5 text-sm font-medium text-ink">
              {t("message")}
              <textarea required minLength={2} maxLength={4000} rows={6} value={message} onChange={(e) => setMessage(e.target.value)}
                placeholder={t("messagePlaceholder")} className={inputClass} />
            </label>
            <label className="grid gap-1.5 text-sm font-medium text-ink">
              {t("contact")}
              <input value={contact} onChange={(e) => setContact(e.target.value)} maxLength={200} placeholder={t("contactPlaceholder")} className={inputClass} />
            </label>
            <p className="text-xs text-ink-faint">{from ? t("fromPage", { path: from }) : t("noPage")}</p>
            {error && <p role="alert" className="text-sm text-bad">{error}</p>}
            <Button type="submit" disabled={state === "sending" || message.trim().length < 2}>
              {state === "sending" ? t("sending") : t("send")}
            </Button>
          </form>
        )}
      </Card>
    </Page>
  );
}
