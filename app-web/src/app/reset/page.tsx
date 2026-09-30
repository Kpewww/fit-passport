"use client";

// Set a new password from an emailed reset link (/reset?token=…&u=…).

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Card, Field, inputClass } from "@/components/ui";
import { useT } from "@/i18n/client";

function ResetInner() {
  const t = useT("auth");
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";
  const userId = params.get("u") ?? "";
  const [newPassword, setNewPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const invalidLink = !token || !userId;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const r = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userId, token, newPassword }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(typeof j.error === "string" ? j.error : t("resetFailed"));
      router.push("/closet");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : t("resetFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-md px-4 sm:px-6 py-14">
        <h1 className="font-serif text-h1 text-ink">{t("resetTitle")}</h1>
        {invalidLink ? (
          <p className="mt-2 text-sm text-bad">
            {t.rich("resetMissing", { link: (c) => <Link href="/recover" className="text-brand hover:underline">{c}</Link> })}
          </p>
        ) : (
          <>
            <p className="mt-2 text-ink-soft">{t("codeStays")}</p>
            <Card className="mt-6">
              <form onSubmit={submit} className="space-y-4">
                <Field label={t("newPassword")}>
                  <input type="password" className={inputClass} value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t("atLeast6")} autoComplete="new-password" />
                </Field>
                {err && <p className="text-sm text-bad">{err}</p>}
                <Button type="submit" size="lg" disabled={busy || newPassword.length < 6}>
                  {busy ? t("saving") : t("resetSubmit")}
                </Button>
              </form>
            </Card>
          </>
        )}
      </div>
    </main>
  );
}

export default function ResetPage() {
  const t = useT("auth");
  return (
    <Suspense fallback={<div className="mx-auto max-w-md px-4 sm:px-6 py-14">{t("loading")}</div>}>
      <ResetInner />
    </Suspense>
  );
}
