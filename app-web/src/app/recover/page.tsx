"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Card, Field, inputClass } from "@/components/ui";

export default function RecoverPage() {
  const [identifier, setIdentifier] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const r = await fetch("/api/auth/recover", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ identifier, email, newPassword }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(typeof j.error === "string" ? j.error : "reset failed");
      setDone(true);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "reset failed");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <main className="flex-1">
        <div className="mx-auto max-w-md px-6 py-14">
          <h1 className="text-3xl font-bold text-ink">Password reset ✓</h1>
          <p className="mt-2 text-ink-soft">You&apos;re signed in with the new password.</p>
          <div className="mt-6">
            <Link href="/closet" className="text-brand hover:underline">Go to my closet →</Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-md px-6 py-14">
        <h1 className="text-3xl font-bold text-ink">Reset your password</h1>
        <p className="mt-2 text-ink-soft">
          Enter your username or account code together with the email you saved
          when you created the account. We&apos;ll verify the match and let you
          set a new password.
        </p>
        <Card className="mt-6">
          <form onSubmit={submit} className="space-y-4">
            <Field label="Username or account code">
              <input className={inputClass} value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="alex_fits  or  FP-XXXX-XXXX-XXXXX" />
            </Field>
            <Field label="Recovery email on file">
              <input type="email" className={inputClass} value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com" />
            </Field>
            <Field label="New password">
              <input type="password" className={inputClass} value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="at least 6 characters" />
            </Field>
            {err && <p className="text-sm text-red-700">{err}</p>}
            <Button type="submit" size="lg" disabled={busy || !identifier || !email || newPassword.length < 6}>
              {busy ? "Resetting…" : "Reset password"}
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
