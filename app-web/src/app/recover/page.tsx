"use client";

// Request a password-reset link. We email a one-time link to the address on
// file; the actual new-password step happens on /reset?token=…. Account code is
// never changed — only the password.

import { useState } from "react";
import Link from "next/link";
import { Button, Card, Field, inputClass } from "@/components/ui";

export default function RecoverPage() {
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
      if (!r.ok) throw new Error(typeof j.error === "string" ? j.error : "request failed");
      setSent(true);
      setDevLink(j.devLink ?? null);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "request failed");
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <main className="flex-1">
        <div className="mx-auto max-w-md px-6 py-14">
          <h1 className="text-3xl font-bold text-ink">Check your email 📬</h1>
          <p className="mt-2 text-ink-soft">
            If an account matches that, we&apos;ve sent a password-reset link to the
            email on file. It expires in 30 minutes.
          </p>
          {devLink && (
            <Card className="mt-6 bg-amber-50 ring-amber-200">
              <p className="text-xs font-semibold text-amber-900">Email isn&apos;t configured (dev/beta)</p>
              <p className="mt-1 text-xs text-amber-800">Use this link to reset directly:</p>
              <Link href={devLink.replace(/^https?:\/\/[^/]+/, "")} className="mt-1 block break-all text-xs text-brand hover:underline">
                {devLink}
              </Link>
            </Card>
          )}
          <p className="mt-6 text-xs text-ink-faint">
            <Link href="/login" className="text-brand hover:underline">Back to login</Link>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-md px-6 py-14">
        <h1 className="text-3xl font-bold text-ink">Reset your password</h1>
        <p className="mt-2 text-ink-soft">
          Enter your username, email, or account code. We&apos;ll email a reset
          link to the address on file.
        </p>
        <Card className="mt-6">
          <form onSubmit={submit} className="space-y-4">
            <Field label="Username, email, or account code">
              <input className={inputClass} value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="alex_fits · you@example.com · FP-XXXX-XXXX-XXXXX" />
            </Field>
            {err && <p className="text-sm text-red-700">{err}</p>}
            <Button type="submit" size="lg" disabled={busy || identifier.trim().length < 2}>
              {busy ? "Sending…" : "Send reset link"}
            </Button>
          </form>
        </Card>
        <p className="mt-4 text-xs text-ink-faint">
          No recovery email on file? Unfortunately there&apos;s no way to reset
          without one. <Link href="/login" className="text-brand hover:underline">Back to login</Link>
        </p>
      </div>
    </main>
  );
}
