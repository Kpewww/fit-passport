"use client";

// /admin — the moderation review queue.
//
// Auto-hiding at three reports was always a stopgap; this is the thing that makes
// it defensible. A human sees what was reported, why, by how many distinct people,
// and the content itself, then decides. Restoring also clears the reports —
// otherwise the same three would re-hide it the moment a fourth arrived.
//
// Non-admins get the same "no such page" as a bad URL: an admin surface shouldn't
// confirm it exists.

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card, EmptyState, LinkButton } from "@/components/ui";
import { ArrowRight } from "@/components/Icon";
import { useT } from "@/i18n/client";
import { Headline } from "@/components/Headline";

type Item = {
  kind: "POST" | "ANSWER" | "OUTFIT";
  targetId: string;
  count: number;
  reasons: string[];
  notes: string[];
  latest: string;
  target: {
    id: string;
    label: string;
    text: string;
    hidden: boolean;
    createdAt: string;
    postId?: string;
    user: { username: string | null; accountCode: string | null; memberNo: number | null };
  };
};

type Queue = { admin: { username: string | null }; threshold: number; items: Item[] };

/** The author's name, linked to their public closet when they have a code. */
function authorLink(item: Item, name: React.ReactNode) {
  const code = item.target.user.accountCode;
  if (!code) return name;
  return (
    <Link href={`/u/${encodeURIComponent(code)}`} className="hover:text-ink hover:underline">
      {name}
    </Link>
  );
}

export default function AdminPage() {
  const t = useT("admin");
  const [data, setData] = useState<Queue | null>(null);
  const [denied, setDenied] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch("/api/admin/reports")
      .then((r) => {
        if (!r.ok) throw new Error("no");
        return r.json();
      })
      .then(setData)
      .catch(() => setDenied(true));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function act(item: Item, action: "hide" | "unhide" | "delete") {
    if (action === "delete" && !confirm(t("deleteConfirm"))) return;
    setBusy(item.targetId);
    await fetch("/api/admin/reports", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kind: item.kind, targetId: item.targetId, action }),
    }).catch(() => {});
    setBusy(null);
    load();
  }

  if (denied) {
    return (
      <main className="flex-1">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 py-14">
          <EmptyState
            title={t("notFoundTitle")}
            body={t("notFoundBody")}
            action={<LinkButton href="/">{t("goHome")}</LinkButton>}
          />
        </div>
      </main>
    );
  }

  if (!data) {
    return <main className="flex-1"><div className="mx-auto max-w-3xl px-4 sm:px-6 py-14 text-ink-faint">{t("loading")}</div></main>;
  }

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
        <h1 className="font-serif text-h1 text-ink"><Headline>{t("title")}</Headline></h1>
        <p className="mt-2 text-ink-soft">
          {t.rich("signedIn", { strong: (c) => <strong className="text-ink">{c}</strong> }, { username: data.admin.username ?? "", threshold: data.threshold })}
        </p>
        <p className="mt-2 text-xs text-ink-faint">
          {t("restoreNote")}
        </p>

        {data.items.length === 0 ? (
          <Card className="mt-6 bg-paper-soft text-center">
            <p className="text-sm text-ink-soft">{t("nothingReported")}</p>
          </Card>
        ) : (
          <div className="mt-6 space-y-3">
            {data.items.map((item) => (
              <Card key={`${item.kind}:${item.targetId}`} className="!p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-paper-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft ring-1 ring-line">
                    {t(`kind.${item.kind}`)}
                  </span>
                  <span className="text-xs font-semibold text-bad">{t.n("reports", item.count)}</span>
                  {item.target.hidden && (
                    <span className="rounded-full bg-warn-tint px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-warn">
                      {t("hidden")}
                    </span>
                  )}
                  <span className="text-xs text-ink-faint">{item.reasons.join(" · ")}</span>
                </div>

                <p className="mt-2 font-medium text-ink">{item.target.label}</p>
                {item.target.text && (
                  <p className="mt-0.5 line-clamp-3 text-sm text-ink-soft">{item.target.text}</p>
                )}
                {item.notes.length > 0 && (
                  <p className="mt-1.5 text-xs italic text-ink-faint">
                    {t("reporterNotes", { notes: item.notes.join(" | ") })}
                  </p>
                )}

                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-faint">
                  <span>
                    {t.rich("by", { link: (c) => authorLink(item, c) }, { username: item.target.user.username ?? "" })}
                    {item.target.user.memberNo != null &&
                      ` · ${t("memberNo", { n: String(item.target.user.memberNo).padStart(8, "0") })}`}
                  </span>
                  {item.kind !== "OUTFIT" && (
                    <Link
                      href={`/ask/${encodeURIComponent(item.kind === "ANSWER" ? (item.target.postId ?? "") : item.targetId)}`}
                      className="text-brand hover:underline"
                    >
                      {t("openThread")} <ArrowRight size={14} className="-mt-px inline" />
                    </Link>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {item.target.hidden ? (
                    <button
                      disabled={busy === item.targetId}
                      onClick={() => act(item, "unhide")}
                      className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-ink-soft hover:border-ok hover:text-ok disabled:opacity-50"
                    >
                      {t("restore")}
                    </button>
                  ) : (
                    <button
                      disabled={busy === item.targetId}
                      onClick={() => act(item, "hide")}
                      className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-ink-soft hover:border-warn hover:text-warn disabled:opacity-50"
                    >
                      {t("hide")}
                    </button>
                  )}
                  <button
                    disabled={busy === item.targetId}
                    onClick={() => act(item, "delete")}
                    className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-ink-soft hover:border-bad hover:text-bad disabled:opacity-50"
                  >
                    {t("deletePermanently")}
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
