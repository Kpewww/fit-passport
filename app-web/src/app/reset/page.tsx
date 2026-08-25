"use client";

// Set a new password from an emailed reset link (/reset?token=…&u=…).

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Card, Field, inputClass } from "@/components/ui";

function ResetInner() {
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
      if (!r.ok) throw new Error(typeof j.error === "string" ? j.error : "reset failed");
      router.push("/closet");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "reset failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-md px-4 sm:px-6 py-14">
        <h1 className="font-serif text-4xl text-ink">Set a new password</h1>
        {invalidLink ? (
          <p className="mt-2 text-sm text-red-700">
            This reset link is missing information. Request a new one from{" "}
            <Link href="/recover" className="text-brand hover:underline">the reset page</Link>.
          </p>
        ) : (
          <>
            <p className="mt-2 text-ink-soft">Your account code stays the same — only the password changes.</p>
            <Card className="mt-6">
              <form onSubmit={submit} className="space-y-4">
                <Field label="New password">
                  <input type="password" className={inputClass} value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="at least 6 characters" autoComplete="new-password" />
                </Field>
                {err && <p className="text-sm text-red-700">{err}</p>}
                <Button type="submit" size="lg" disabled={busy || newPassword.length < 6}>
                  {busy ? "Saving…" : "Set password & sign in"}
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
  return (
    <Suspense fallback={<div className="mx-auto max-w-md px-4 sm:px-6 py-14">Loading…</div>}>
      <ResetInner />
    </Suspense>
  );
}
