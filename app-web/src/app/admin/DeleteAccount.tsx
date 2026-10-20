"use client";

// Erase an account by its code or username (Session 100f, admin only). Shows whose it
// is first — name, code, claimed or deactivated, how much it holds — then asks for the
// word, since nothing brings it back. Another admin, or yourself, is refused.

import { useState } from "react";
import { Button, Card, inputClass } from "@/components/ui";
import { useT } from "@/i18n/client";

type Found = { id: string; username: string | null; accountCode: string | null; claimed: boolean; deactivated: boolean; isAdmin: boolean; pieces: number; checks: number; createdAt: string };

export function DeleteAccount() {
  const t = useT("admin");
  const [q, setQ] = useState("");
  const [found, setFound] = useState<Found | null | undefined>(undefined);
  const [word, setWord] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const confirmWord = t("del.word");

  async function look(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null); setWord("");
    const r = await fetch(`/api/admin/users?q=${encodeURIComponent(q.trim())}`).catch(() => null);
    const j = await r?.json().catch(() => null);
    setFound(j?.user ?? null);
  }

  async function erase() {
    if (!found) return;
    setBusy(true);
    const r = await fetch("/api/admin/users", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: found.id, confirm: "delete" }) }).catch(() => null);
    setBusy(false);
    if (r?.ok) { setMsg(t("del.done", { name: found.username ?? found.accountCode ?? found.id })); setFound(undefined); setQ(""); setWord(""); }
    else setMsg(t("del.failed"));
  }

  return (
    <section className="mt-8">
      <h2 className="text-h3 text-ink">{t("del.title")}</h2>
      <Card className="mt-3 !p-4">
        <p className="text-xs text-ink-soft">{t("del.intro")}</p>
        <form onSubmit={look} className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input className={inputClass + " min-w-0 flex-1"} value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("del.placeholder")} />
          <Button type="submit" variant="secondary" disabled={q.trim().length < 2}>{t("del.find")}</Button>
        </form>
        {found === null && <p className="mt-3 text-sm text-ink-soft">{t("del.none")}</p>}
        {found && (
          <div className="mt-4 space-y-3 rounded-xl border border-line p-3 text-sm">
            <p className="font-medium text-ink">{found.username ?? t("del.noName")} <span className="font-mono text-xs text-ink-faint">{found.accountCode ?? "—"}</span></p>
            <p className="text-xs text-ink-soft">
              {[found.claimed ? t("del.claimed") : t("del.unclaimed"), found.deactivated ? t("del.deactivated") : null, t("del.holds", { pieces: found.pieces, checks: found.checks }), new Date(found.createdAt).toLocaleDateString()].filter(Boolean).join(" · ")}
            </p>
            {found.isAdmin ? (
              <p className="text-xs text-bad">{t("del.isAdmin")}</p>
            ) : (
              <>
                <label className="grid gap-1 text-xs text-ink-soft">{t("del.type", { word: confirmWord })}
                  <input className={inputClass} value={word} onChange={(e) => setWord(e.target.value)} autoComplete="off" />
                </label>
                <Button onClick={erase} disabled={busy || word.trim() !== confirmWord} className="!bg-bad hover:!bg-bad">{busy ? "…" : t("del.submit")}</Button>
              </>
            )}
          </div>
        )}
        {msg && <p className="mt-3 text-sm text-ink">{msg}</p>}
      </Card>
    </section>
  );
}
