"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, CaretDown, Check, Warning } from "@/components/Icon";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Card, Field, inputClass, LinkButton } from "@/components/ui";
import { useT } from "@/i18n/client";
import { Headline } from "@/components/Headline";

type Me = {
  claimed: boolean;
  accountCode: string | null;
  username: string | null;
  email: string | null;
  bodyType: string | null;
  exportPolicy: string;
  canEdit: boolean;
};

// The claim form REQUIRES an explicit pick — but "Prefer not to say" (empty
// value) is a valid choice. Whether it's shown publicly is a separate checkbox.
const CLAIM_PLACEHOLDER = "__pick__";
// "" = prefer not to say; labels come from account.bodyType (messages).
const BODY_TYPES = ["", "petite", "slim", "lean", "average", "athletic", "curvy", "broad", "tall", "plus"] as const;
type BodyTypeKey = Exclude<(typeof BODY_TYPES)[number], ""> | "none";

export default function AccountPage() {
  const t = useT("account");
  const bt = (v: string) => t(`bodyType.${(v || "none") as BodyTypeKey}`);
  const [me, setMe] = useState<Me | null>(null);
  const [form, setForm] = useState({
    username: "",
    password: "",
    email: "",
    bodyType: CLAIM_PLACEHOLDER, // must be changed to a real choice (incl. "prefer not to say")
    showBodyType: true,
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
          // "prefer not to say" = empty string → send undefined (no body type)
          bodyType: form.bodyType && form.bodyType !== CLAIM_PLACEHOLDER ? form.bodyType : undefined,
          showBodyType: form.showBodyType,
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
              : t("couldNotCreate");
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
    return <main className="flex-1"><div className="mx-auto max-w-2xl px-4 sm:px-6 py-10 text-ink-faint">{t("loading")}</div></main>;
  }

  // Just claimed — show the account code.
  if (claimResult) {
    return (
      <main className="flex-1">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 py-10">
          <h1 className="font-serif text-h1 text-ink"><Headline>{t("readyTitle")}</Headline></h1>
          <p className="mt-2 text-ink-soft">{t.rich("readyLede", { b: (c) => <strong>{c}</strong> })}</p>

          <Card className="mt-6">
            <p className="text-xs uppercase tracking-widest text-ink-faint">{t("codeLabel")}</p>
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
                {copied ? <><Check size={14} className="-mt-px inline" /> {t("copied")}</> : t("copy")}
              </button>
            </div>
            <p className="mt-2 text-xs text-ink-faint">{t("codeNote")}</p>
          </Card>

          {!claimResult.hasEmail && (
            <Card className="mt-4 border-l-4 border-l-amber-400 bg-warn-tint">
              <p className="text-sm font-semibold text-warn">
                <Warning size={16} className="mr-1.5 inline -mt-0.5" />{t("noEmailTitle")}
              </p>
              <p className="mt-1 text-sm text-warn">{t.rich("noEmailBody", { b: (c) => <strong>{c}</strong> })}</p>
            </Card>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <LinkButton href="/passport">
              {t("viewPassport")} <ArrowRight size={14} className="-mt-px inline" />
            </LinkButton>
            <LinkButton href="/closet" variant="secondary">
              {t("myCloset")}
            </LinkButton>
            <LinkButton href={`/u/${encodeURIComponent(claimResult.accountCode)}`} variant="secondary">
              {t("previewPublic")}
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
        <div className="mx-auto max-w-2xl px-4 sm:px-6 py-10">
          <h1 className="font-serif text-h1 text-ink"><Headline>{t("title")}</Headline></h1>
          <Card className="mt-6 space-y-3">
            <Row label={t("username")} value={me.username ?? "—"} />
            <Row label={t("accountCode")} value={me.accountCode ?? "—"} mono />
            <Row label={t("recoveryEmail")} value={me.email ?? t("noEmailValue")} />
            <Row label={t("bodyTypeShared")} value={me.bodyType ? bt(me.bodyType) : t("notShared")} />
            <Row label={t("exportByCode")} value={me.exportPolicy === "anyone" ? t("exportAnyone") : t("exportOnlyMe")} />
          </Card>
          <div className="mt-4 flex flex-wrap gap-3">
            <LinkButton href={`/u/${encodeURIComponent(me.accountCode ?? "")}`} variant="secondary">
              {t("viewPublicCloset")}
            </LinkButton>
            <Button variant="ghost" onClick={logout}>{t("logOut")}</Button>
          </div>

          <ChangePassword />
          <DangerZone />

          <p className="mt-6 text-xs text-ink-faint">
            {t.rich("publicNote", {
              link: (c) => <Link href="/community" className="text-brand hover:underline">{c} <ArrowRight size={14} className="-mt-px inline" /></Link>,
            })}
          </p>
        </div>
      </main>
    );
  }

  // Unclaimed — show claim form.
  return (
    <main className="flex-1">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-10">
        {/* Back links so users aren't trapped — they can go fix their passport
            or closet before locking in an account. Nothing here is committed
            until "Claim my account code" is pressed. */}
        <div className="mb-4 flex items-center gap-4 text-sm">
          <Link href="/passport" className="text-ink-faint hover:text-brand"><ArrowLeft size={14} className="-mt-px inline" /> {t("editPassport")}</Link>
          <Link href="/closet" className="text-ink-faint hover:text-brand"><ArrowLeft size={14} className="-mt-px inline" /> {t("editCloset")}</Link>
        </div>
        <h1 className="font-serif text-h1 text-ink"><Headline>{t("claimTitle")}</Headline></h1>
        <p className="mt-2 text-ink-soft">{t.rich("claimLede", { b: (c) => <strong>{c}</strong> })}</p>

        <Card className="mt-6">
          <form onSubmit={claim} className="space-y-4">
            <Field label={t("username")} hint={t("usernameHint")}>
              <input className={inputClass} value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder={t("usernamePlaceholder")} />
            </Field>
            <Field label={t("passwordLabel")} hint={t("passwordHint")}>
              <input type="password" className={inputClass} value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder={t("atLeast6")} />
            </Field>
            <Field label={t("recoveryEmail")} hint={t("emailHint")}>
              <input type="email" className={inputClass} value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder={t("emailPlaceholder")} />
            </Field>
            <Field label={t("bodyTypeLabel")} hint={t("bodyTypeHint")}>
              <select className={inputClass} value={form.bodyType}
                onChange={(e) => setForm({ ...form, bodyType: e.target.value })}>
                <option value={CLAIM_PLACEHOLDER} disabled>{t("chooseOne")}</option>
                {BODY_TYPES.map((v) => <option key={v} value={v}>{bt(v)}</option>)}
              </select>
              <label className="mt-2 flex items-center gap-1.5 text-xs text-ink-soft">
                <input type="checkbox" checked={form.showBodyType} className="accent-brand"
                  onChange={(e) => setForm({ ...form, showBodyType: e.target.checked })} />
                {t("showBodyType")}
              </label>
            </Field>
            <Field label={t("exportLabel")}>
              <select className={inputClass} value={form.exportPolicy}
                onChange={(e) => setForm({ ...form, exportPolicy: e.target.value as "owner" | "anyone" })}>
                <option value="owner">{t("exportOwner")}</option>
                <option value="anyone">{t("exportAnyoneOption")}</option>
              </select>
            </Field>

            {err && <p className="text-sm text-bad">{err}</p>}

            <Button type="submit" size="lg" disabled={saving || !form.username || form.password.length < 6 || form.bodyType === CLAIM_PLACEHOLDER}>
              {saving ? t("creating") : t("claimSubmit")}
            </Button>
            {form.bodyType === CLAIM_PLACEHOLDER && (
              <p className="text-xs text-ink-faint">{t("pickBodyType")}</p>
            )}
          </form>
        </Card>

        <p className="mt-4 text-xs text-ink-faint">
          {t.rich("haveCode", {
            link: (c) => <Link href="/login" className="text-brand hover:underline">{c} <ArrowRight size={14} className="-mt-px inline" /></Link>,
          })}
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

// Change password while logged in (account code stays the same).
function ChangePassword() {
  const t = useT("account");
  const tAuth = useT("auth");
  const [open, setOpen] = useState(false);
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  // Success is a state, not a comparison with the English sentence.
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true); setMsg(null);
    const r = await fetch("/api/auth/change-password", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ currentPassword: cur, newPassword: next }),
    });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (r.ok) { setOk(true); setMsg(t("passwordUpdated")); setCur(""); setNext(""); }
    else { setOk(false); setMsg(typeof j.error === "string" ? j.error : t("couldNotUpdate")); }
  }

  return (
    <Card className="mt-4">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between text-left">
        <span className="text-sm font-semibold text-ink">{t("changePassword")}</span>
        <CaretDown size={16} className={`text-ink-faint transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="mt-3 space-y-3">
          <p className="text-xs text-ink-faint">{tAuth("codeStays")}</p>
          <Field label={t("currentPassword")}>
            <input type="password" className={inputClass} value={cur} onChange={(e) => setCur(e.target.value)} autoComplete="current-password" />
          </Field>
          <Field label={t("newPassword")}>
            <input type="password" className={inputClass} value={next} onChange={(e) => setNext(e.target.value)} placeholder={t("atLeast6")} autoComplete="new-password" />
          </Field>
          {msg && <p className={`text-sm ${ok ? "text-ok" : "text-bad"}`}>{msg}</p>}
          <Button onClick={save} disabled={busy || !cur || next.length < 6}>{busy ? t("saving") : t("updatePassword")}</Button>
        </div>
      )}
    </Card>
  );
}

// Deactivate the account (soft delete — data retained, hidden from everyone
// external; support can reverse it).
function DangerZone() {
  const t = useT("account");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function deactivate() {
    if (!confirm(t("deactivateConfirm"))) return;
    setBusy(true); setMsg(null);
    const r = await fetch("/api/auth/deactivate", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (r.ok) router.push("/");
    else setMsg(typeof j.error === "string" ? j.error : t("couldNotDeactivate"));
  }

  return (
    <Card className="mt-4 ring-bad/30">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between text-left">
        <span className="text-sm font-semibold text-bad">{t("deactivateTitle")}</span>
        <CaretDown size={16} className={`text-ink-faint transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="mt-3 space-y-3">
          <p className="text-xs text-ink-soft">{t("deactivateBody")}</p>
          <Field label={t("passwordLabel")}>
            <input type="password" className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          </Field>
          {msg && <p className="text-sm text-bad">{msg}</p>}
          <Button onClick={deactivate} disabled={busy || !password} className="!bg-bad hover:!bg-bad">
            {busy ? "…" : t("deactivateSubmit")}
          </Button>
        </div>
      )}
    </Card>
  );
}
