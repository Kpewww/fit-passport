"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Card, Field, inputClass } from "@/components/ui";

export default function LoginPage() {
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
      if (!r.ok) throw new Error(typeof j.error === "string" ? j.error : "login failed");
      router.push("/account");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-md px-4 sm:px-6 py-14">
        <h1 className="font-serif text-4xl text-ink">Log in</h1>
        <p className="mt-2 text-ink-soft">
          Sign in with your username, email, or account code to edit your closet.
        </p>
        <Card className="mt-6">
          <form onSubmit={submit} className="space-y-4">
            <Field label="Username, email, or account code">
              <input className={inputClass} value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="alex_fits  ·  you@example.com  ·  FP-XXXX-XXXX-XXXXX"
                autoComplete="username" />
            </Field>
            <Field label="Password">
              <input type="password" className={inputClass} value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password" />
            </Field>
            {err && <p className="text-sm text-red-700">{err}</p>}
            <Button type="submit" size="lg" disabled={busy || !identifier || !password}>
              {busy ? "Logging in…" : "Log in"}
            </Button>
          </form>
        </Card>
        <p className="mt-4 text-xs text-ink-faint">
          Forgot your password?{" "}
          <Link href="/recover" className="text-brand hover:underline">
            Reset it with your recovery email →
          </Link>
        </p>
        <p className="mt-1 text-xs text-ink-faint">
          Just want to peek at a closet?{" "}
          <Link href="/community" className="text-brand hover:underline">
            View one by code →
          </Link>
        </p>
      </div>
    </main>
  );
}
