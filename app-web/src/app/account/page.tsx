"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, Card, Field, inputClass, LinkButton } from "@/components/ui";

type Me = {
  claimed: boolean;
  accountCode: string | null;
  username: string | null;
  email: string | null;
  bodyType: string | null;
  exportPolicy: string;
  canEdit: boolean;
};

const BODY_TYPES = [
  { v: "", label: "Don't share" },
  { v: "slim", label: "Slim" },
  { v: "average", label: "Average" },
  { v: "athletic", label: "Athletic" },
  { v: "broad", label: "Broad" },
];

export default function AccountPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [form, setForm] = useState({
    username: "",
    password: "",
    email: "",
    bodyType: "",
    exportPolicy: "owner" as "owner" | "anyone",
  });
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [claimResult, setClaimResult] = useState<{ accountCode: string; hasEmail: boolean } | null>(null);
  const [copied, setCopied] = useState(false);

  async function load() {
    const d = await fetch("/api/auth/me").then((r) => r.json());
    setMe(d);
  }
  useEffect(() => { load(); }, []);

  async function claim(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSaving(true);
    try {
      const r = await fetch("/api/auth/claim", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          username: form.username,
          password: form.password,
          email: form.email || undefined,
          bodyType: form.bodyType || undefined,
          exportPolicy: form.exportPolicy,
        }),
      });
      const j = await r.json();
      if (!r.ok) {
        const msg =
          typeof j.error === "string"
            ? j.error
            : j.error?.fieldErrors
              ? Object.values(j.error.fieldErrors).flat().join(", ")
              : "could not create account";
        throw new Error(msg);
      }
      setClaimResult({ accountCode: j.accountCode, hasEmail: j.hasEmail });
      load();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "error");
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setClaimResult(null);
    load();
  }

  if (!me) {
    return <main className="flex-1"><div className="mx-auto max-w-2xl px-6 py-10 text-ink-faint">Loading…</div></main>;
  }

  // Just claimed — show the account code.
  if (claimResult) {
    return (
      <main className="flex-1">
        <div className="mx-auto max-w-2xl px-6 py-10">
          <h1 className="text-3xl font-bold text-ink">Your account is ready 🎉</h1>
          <p className="mt-2 text-ink-soft">
            You can log in later with your <strong>username</strong> or your
            <strong> account code</strong>, plus your password.
          </p>

          <Card className="mt-6">
            <p className="text-xs uppercase tracking-widest text-ink-faint">Account code (shareable)</p>
            <div className="mt-1 flex items-center gap-3">
              <code className="rounded-lg bg-brand-tint px-3 py-2 text-lg font-bold tracking-wider text-brand">
                {claimResult.accountCode}
              </code>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(claimResult.accountCode);
                  setCopied(true);
                }}
                className="text-sm text-brand hover:underline"
              >
                {copied ? "Copied ✓" : "Copy"}
              </button>
            </div>
            <p className="mt-2 text-xs text-ink-faint">
              Anyone with your code can view your closet (read-only). Give it to
              friends who want to browse.
            </p>
          </Card>

          {!claimResult.hasEmail && (
            <Card className="mt-4 border-l-4 border-l-amber-400 bg-amber-50">
              <p className="text-sm font-semibold text-amber-900">
                ⚠️ You didn&apos;t add a recovery email
              </p>
              <p className="mt-1 text-sm text-amber-800">
                Without one, there&apos;s <strong>no way</strong> to reset your password
                if you forget it. You&apos;d permanently lose editing access to this
                account. Consider adding an email later from your account page.
              </p>
            </Card>
          )}

          <div className="mt-6 flex gap-3">
            <LinkButton href="/closet">
              Go to my closet →
            </LinkButton>
            <LinkButton href={`/u/${encodeURIComponent(claimResult.accountCode)}`} variant="secondary">
              Preview my public view
            </LinkButton>
          </div>
        </div>
      </main>
    );
  }

  // Already claimed — show status.
  if (me.claimed) {
    return (
      <main className="flex-1">
        <div className="mx-auto max-w-2xl px-6 py-10">
          <h1 className="text-3xl font-bold text-ink">Account</h1>
          <Card className="mt-6 space-y-3">
            <Row label="Username" value={me.username ?? "—"} />
            <Row label="Account code" value={me.accountCode ?? "—"} mono />
            <Row label="Recovery email" value={me.email ?? "none — can't reset password"} />
            <Row label="Body type shared" value={me.bodyType ?? "not shared"} />
            <Row label="Export by code" value={me.exportPolicy === "anyone" ? "anyone with code" : "only me"} />
          </Card>
          <div className="mt-4 flex flex-wrap gap-3">
            <LinkButton href={`/u/${encodeURIComponent(me.accountCode ?? "")}`} variant="secondary">
              View my public closet
            </LinkButton>
            <Button variant="ghost" onClick={logout}>Log out</Button>
          </div>
          <p className="mt-6 text-xs text-ink-faint">
            Anyone with your code can view your closet and body type (if shared),
            but only someone with your password can edit it.{" "}
            <Link href="/community" className="text-brand hover:underline">See the community →</Link>
          </p>
        </div>
      </main>
    );
  }

  // Unclaimed — show claim form.
  return (
    <main className="flex-1">
      <div className="mx-auto max-w-2xl px-6 py-10">
        {/* Back links so users aren't trapped — they can go fix their passport
            or closet before locking in an account. Nothing here is committed
            until "Claim my account code" is pressed. */}
        <div className="mb-4 flex items-center gap-4 text-sm">
          <Link href="/passport" className="text-ink-faint hover:text-brand">← Edit my passport</Link>
          <Link href="/closet" className="text-ink-faint hover:text-brand">← Edit my closet</Link>
        </div>
        <h1 className="text-3xl font-bold text-ink">Claim your account</h1>
        <p className="mt-2 text-ink-soft">
          You&apos;ve been using a private, temporary account. Claim it to get a
          shareable <strong>account code</strong> and lock editing behind a password.
          Your passport and closet are already filled in — you can go back and
          tweak them first; nothing is locked until you press claim.
        </p>

        <Card className="mt-6">
          <form onSubmit={claim} className="space-y-4">
            <Field label="Username" hint="shown to people who view your closet">
              <input className={inputClass} value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="e.g. alex_fits" />
            </Field>
            <Field label="Password" hint="needed to edit — this is your key">
              <input type="password" className={inputClass} value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="at least 6 characters" />
            </Field>
            <Field label="Recovery email" hint="optional but strongly recommended">
              <input type="email" className={inputClass} value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com — so you can reset your password" />
            </Field>
            <Field label="Body type to share" hint="coarse only — precise measurements never shared">
              <select className={inputClass} value={form.bodyType}
                onChange={(e) => setForm({ ...form, bodyType: e.target.value })}>
                {BODY_TYPES.map((b) => <option key={b.v} value={b.v}>{b.label}</option>)}
              </select>
            </Field>
            <Field label="Who can export your closet by code?">
              <select className={inputClass} value={form.exportPolicy}
                onChange={(e) => setForm({ ...form, exportPolicy: e.target.value as "owner" | "anyone" })}>
                <option value="owner">Only me (recommended)</option>
                <option value="anyone">Anyone with my code</option>
              </select>
            </Field>

            {err && <p className="text-sm text-red-700">{err}</p>}

            <Button type="submit" size="lg" disabled={saving || !form.username || form.password.length < 6}>
              {saving ? "Creating…" : "Claim my account code"}
            </Button>
          </form>
        </Card>

        <p className="mt-4 text-xs text-ink-faint">
          Already have a code? <Link href="/login" className="text-brand hover:underline">Log in →</Link>
        </p>
      </div>
    </main>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-ink-faint">{label}</span>
      <span className={`text-sm text-ink ${mono ? "font-mono font-semibold" : ""}`}>{value}</span>
    </div>
  );
}
