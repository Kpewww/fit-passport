"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Card, Field, inputClass } from "@/components/ui";

export default function RecoverPage() {
  const [accountCode, setAccountCode] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ recoveryCode: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const r = await fetch("/api/auth/recover", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ accountCode, recoveryCode, newPassword }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(typeof j.error === "string" ? j.error : "recovery failed");
      setDone({ recoveryCode: j.recoveryCode });
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "recovery failed");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <main className="flex-1">
        <div className="mx-auto max-w-md px-6 py-14">
          <h1 className="text-3xl font-bold text-ink">Password reset ✓</h1>
          <p className="mt-2 text-ink-soft">
            You&apos;re logged in with your new password. Your old recovery code is
            now used up — here&apos;s a fresh one. Save it.
          </p>
          <Card className="mt-6 border-2 border-red-400 bg-red-50">
            <p className="text-xs font-bold uppercase tracking-widest text-red-700">
              New recovery code — save it now
            </p>
            <code className="mt-1 block rounded-lg border border-red-200 bg-white px-3 py-2 text-lg font-bold tracking-wider text-red-900">
              {done.recoveryCode}
            </code>
          </Card>
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
          Enter your account code and the one-time recovery code you saved when you
          created the account.
        </p>
        <Card className="mt-6">
          <form onSubmit={submit} className="space-y-4">
            <Field label="Account code">
              <input className={inputClass} value={accountCode}
                onChange={(e) => setAccountCode(e.target.value)}
                placeholder="FP-XXXX-XXXX-XXXXX" />
            </Field>
            <Field label="Recovery code">
              <input className={inputClass} value={recoveryCode}
                onChange={(e) => setRecoveryCode(e.target.value)}
                placeholder="XXXXX-XXXXX" />
            </Field>
            <Field label="New password">
              <input type="password" className={inputClass} value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="at least 6 characters" />
            </Field>
            {err && <p className="text-sm text-red-700">{err}</p>}
            <Button type="submit" size="lg" disabled={busy || !accountCode || !recoveryCode || newPassword.length < 6}>
              {busy ? "Resetting…" : "Reset password"}
            </Button>
          </form>
        </Card>
        <p className="mt-4 text-xs text-ink-faint">
          Lost your recovery code too?{" "}
          {/* Email-based recovery needs mail infrastructure — noted for later. */}
          Email-based reset is coming soon. For now the recovery code is required.{" "}
          <Link href="/login" className="text-brand hover:underline">Back to login</Link>
        </p>
      </div>
    </main>
  );
}
