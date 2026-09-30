"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Card, Field, inputClass } from "@/components/ui";
import { ArrowRight } from "@/components/Icon";
import { useT } from "@/i18n/client";

export default function LoginPage() {
  const t = useT("auth");
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
        <h1 className="font-serif text-h1 text-ink">{t("loginTitle")}</h1>
        <p className="mt-2 text-ink-soft">{t("loginLede")}</p>
        <Card className="mt-6">
          <form onSubmit={submit} className="space-y-4">
            <Field label={t("identifierLabel")}>
              <input className={inputClass} value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="alex_fits  ·  you@example.com  ·  FP-XXXX-XXXX-XXXXX"
                autoComplete="username" />
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
