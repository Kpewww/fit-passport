"use client";

// Request a password-reset link. We email a one-time link to the address on
// file; the actual new-password step happens on /reset?token=…. Account code is
// never changed — only the password.

import { useState } from "react";
import Link from "next/link";
import { Button, Card, Field, inputClass } from "@/components/ui";
import { useT } from "@/i18n/client";
import { Headline } from "@/components/Headline";

export default function RecoverPage() {
  const t = useT("auth");
  const [identifier, setIdentifier] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [devLink, setDevLink] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const r = await fetch("/api/auth/request-reset", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ identifier }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(typeof j.error === "string" ? j.error : t("requestFailed"));
      setSent(true);
      setDevLink(j.devLink ?? null);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : t("requestFailed"));
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <main className="flex-1">
        <div className="mx-auto max-w-md px-4 sm:px-6 py-14">
          <h1 className="font-serif text-h1 text-ink"><Headline>{t("sentTitle")}</Headline></h1>
          <p className="mt-2 text-ink-soft">{t("sentBody")}</p>
          {devLink && (
            <Card className="mt-6 bg-warn-tint ring-warn/30">
              <p className="text-xs font-semibold text-warn">{t("devNoEmail")}</p>
              <p className="mt-1 text-xs text-warn">{t("devUseLink")}</p>
              <Link href={devLink.replace(/^https?:\/\/[^/]+/, "")} className="mt-1 block break-all text-xs text-brand hover:underline">
                {devLink}
              </Link>
            </Card>
          )}
          <p className="mt-6 text-xs text-ink-faint">
            <Link href="/login" className="text-brand hover:underline">{t("backToLogin")}</Link>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-md px-4 sm:px-6 py-14">
        <h1 className="font-serif text-h1 text-ink"><Headline>{t("recoverTitle")}</Headline></h1>
        <p className="mt-2 text-ink-soft">{t("recoverLede")}</p>
        <Card className="mt-6">
          <form onSubmit={submit} className="space-y-4">
            <Field label={t("identifierLabel")}>
              <input className={inputClass} value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="alex_fits · you@example.com · FP-XXXX-XXXX-XXXXX" />
            </Field>
            {err && <p className="text-sm text-bad">{err}</p>}
            <Button type="submit" size="lg" disabled={busy || identifier.trim().length < 2}>
              {busy ? t("recoverBusy") : t("recoverSubmit")}
            </Button>
          </form>
        </Card>
        <p className="mt-4 text-xs text-ink-faint">
          {t.rich("noEmail", { link: (c) => <Link href="/login" className="text-brand hover:underline">{c}</Link> })}
        </p>
      </div>
    </main>
  );
}
