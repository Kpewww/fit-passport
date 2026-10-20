"use client";

import { CodeOwner } from "@/components/CodeOwner";
import { ACCOUNT_CHANGED } from "@/components/Nav";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Card, Field, inputClass } from "@/components/ui";
import { ArrowRight } from "@/components/Icon";
import { useT } from "@/i18n/client";
import { Headline } from "@/components/Headline";

export default function LoginPage() {
  const t = useT("auth");
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // What this browser added before logging in, offered to the account (Session 100).
  const [offer, setOffer] = useState<{ pieces: number; saved: number; checks: number; outfits: number } | null>(null);

  async function answer(accept: boolean) {
    setBusy(true);
    await fetch("/api/auth/fold-browser", {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ accept }),
    }).catch(() => null);
    setBusy(false);
    window.dispatchEvent(new Event(ACCOUNT_CHANGED));
    router.push(accept ? "/closet" : "/account");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(typeof j.error === "string" ? j.error : t("loginFailed"));
      window.dispatchEvent(new Event(ACCOUNT_CHANGED));
      if (j.offer) { setOffer(j.offer); return; }
      router.push("/account");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : t("loginFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-md px-4 sm:px-6 py-14">
        <h1 className="font-serif text-h1 text-ink"><Headline>{t("loginTitle")}</Headline></h1>
        <p className="mt-2 text-ink-soft">{t("loginLede")}</p>
        {offer ? (
          <Card className="mt-6 space-y-4">
            <h2 className="text-h3 text-ink">{t("foldTitle")}</h2>
            <p className="text-sm text-ink-soft">
              {t("foldBody", { pieces: offer.pieces, saved: offer.saved, checks: offer.checks, outfits: offer.outfits })}
            </p>
            <p className="text-xs text-ink-faint">{t("foldNote")}</p>
            <div className="flex flex-wrap gap-2">
              <Button disabled={busy} onClick={() => answer(true)}>{t("foldYes")}</Button>
              <Button variant="secondary" disabled={busy} onClick={() => answer(false)}>{t("foldNo")}</Button>
            </div>
          </Card>
        ) : (
        <Card className="mt-6">
          <form onSubmit={submit} className="space-y-4">
            <Field label={t("identifierLabel")}>
              <input className={inputClass} value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="alex_fits  ·  you@example.com  ·  FP-XXXX-XXXX-XXXXX"
                autoComplete="username" />
              <CodeOwner value={identifier} />
            </Field>
            <Field label={t("passwordLabel")}>
              <input type="password" className={inputClass} value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password" />
            </Field>
            {err && <p className="text-sm text-bad">{err}</p>}
            <Button type="submit" size="lg" disabled={busy || !identifier || !password}>
              {busy ? t("loginBusy") : t("loginSubmit")}
            </Button>
          </form>
        </Card>
        )}
        <p className="mt-4 text-xs text-ink-faint">
          {t.rich("forgot", { link: (c) => <Link href="/recover" className="text-brand hover:underline">{c} <ArrowRight size={14} className="-mt-px inline" /></Link> })}
        </p>
        <p className="mt-1 text-xs text-ink-faint">
          {t.rich("peek", { link: (c) => <Link href="/community" className="text-brand hover:underline">{c} <ArrowRight size={14} className="-mt-px inline" /></Link> })}
        </p>
      </div>
    </main>
  );
}
