"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Download } from "@/components/Icon";
import { FitStars } from "@/components/ui";
import Link from "next/link";
import { Card, EmptyState, LinkButton } from "@/components/ui";
import { Avatar, PinnedSeals } from "@/components/Badges";
import { FollowButton } from "@/components/FollowButton";
import { colorHex } from "@/lib/colors";
import { useT } from "@/i18n/client";
import { useGarmentText } from "@/i18n/garment";
import { usePeopleWords } from "@/i18n/people";

type ClosetItem = {
  id: string;
  brand: string;
  category: string;
  gender: string | null;
  size: string;
  region: string | null;
  fitRating: number;
  areaNotesJson: string | null;
  color: string | null;
  collectionId: string | null;
};

type PublicView = {
  username: string;
  accountCode: string;
  avatarDataUrl: string | null;
  bodyType: string | null;
  sex: "male" | "female" | "unspecified" | null;
  shopsFor: string | null;
  canExport: boolean;
  followerCount: number;
  memberNo: number | null;
  collections: Array<{ id: string; name: string; sortIndex: number }>;
  closet: ClosetItem[];
  badges: Array<{ id: string; title: string; metal: string }>;
  pinnedBadges: string[];
};

export default function ViewByCodePage({
  params,
}: {
  params: { code: string };
}) {
  const t = useT("profile");
  const tc = useT("common");
  const tCommunity = useT("community");
  const g = useGarmentText();
  const people = usePeopleWords();
  const tSocial = useT("social");
  const { code } = params;
  const [data, setData] = useState<PublicView | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [follow, setFollow] = useState<{
    claimed: boolean;
    accountCode: string | null;
    following: string[];
  } | null>(null);
  const [blocked, setBlocked] = useState<string[] | null>(null);
  const [blocking, setBlocking] = useState(false);

  const loadView = useCallback(() => {
    fetch(`/api/view/${encodeURIComponent(code)}`)
      .then((r) => {
        if (!r.ok) throw new Error("not found");
        return r.json();
      })
      .then(setData)
      .catch(() => setNotFound(true));
  }, [code]);

  const loadFollow = useCallback(() => {
    fetch("/api/follow").then((r) => r.json()).then(setFollow).catch(() => setFollow(null));
  }, []);

  const loadBlocks = useCallback(() => {
    fetch("/api/block").then((r) => r.json()).then((d) => setBlocked(d.blocked ?? [])).catch(() => setBlocked([]));
  }, []);

  useEffect(() => { loadView(); loadFollow(); loadBlocks(); }, [loadView, loadFollow, loadBlocks]);

  // Blocking is a decision about a PERSON, so it belongs on their profile rather
  // than buried in a content menu.
  async function toggleBlock(next: boolean) {
    if (!data) return;
    if (next && !confirm(t("blockConfirm", { name: data.username }))) return;
    setBlocking(true);
    await fetch("/api/block", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ accountCode: data.accountCode, block: next }),
    }).catch(() => {});
    setBlocking(false);
    loadBlocks();
    loadFollow();
  }

  if (notFound) {
    return (
      <main className="flex-1">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 py-14">
          <EmptyState
            title={t("notFoundTitle")}
            body={t("notFoundBody")}
            action={<LinkButton href="/community">{t("tryAnother")}</LinkButton>}
          />
        </div>
      </main>
    );
  }

  if (!data) {
    return <main className="flex-1"><div className="mx-auto max-w-2xl px-4 sm:px-6 py-14 text-ink-faint">{tc("loading")}</div></main>;
  }

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
        <div className="flex items-center gap-2 text-xs">
          <span className="rounded-full bg-brand-tint px-2.5 py-0.5 font-medium text-brand">
            {t("viewing", { name: data.username })}
          </span>
          <span className="rounded-full bg-paper-dim px-2.5 py-0.5 text-ink-faint">
            {t("readOnly")}
          </span>
        </div>
        <div className="mt-3 flex items-center gap-4">
          <Avatar src={data.avatarDataUrl} initials={data.username.slice(0, 2).toUpperCase()} size={64} />
          <div className="min-w-0">
            <h1 className="font-serif text-h1 text-ink">{data.username}</h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
              {(data.pinnedBadges.length > 0 || data.badges.length > 0) && (
                <PinnedSeals ids={data.pinnedBadges.length > 0 ? data.pinnedBadges : data.badges.map((b) => b.id).slice(0, 3)} size={30} />
              )}
              {data.memberNo != null && (
                <span className="font-mono text-xs tracking-[0.16em] text-ink-faint">
                  No. {String(data.memberNo).padStart(8, "0")}
                </span>
              )}
              {data.followerCount > 0 && (
                <span className="text-xs text-ink-faint">
                  {tCommunity.n("followers", data.followerCount)}
                </span>
              )}
            </div>
          </div>
          {/* No follow button on your own profile — the server rejects it anyway,
              but offering it would just look broken. */}
          {follow?.accountCode !== data.accountCode && (
            <div className="ml-auto flex flex-shrink-0 flex-col items-end gap-1.5">
              <FollowButton
                accountCode={data.accountCode}
                following={!!follow?.following.includes(data.accountCode)}
                canFollow={!!follow?.claimed}
                size="md"
                onChange={() => { loadView(); loadFollow(); }}
              />
              {follow?.claimed && blocked && (
                <button
                  onClick={() => toggleBlock(!blocked.includes(data.accountCode))}
                  disabled={blocking}
                  className="text-[11px] text-ink-faint underline-offset-2 hover:text-bad hover:underline disabled:opacity-50"
                >
                  {blocked.includes(data.accountCode) ? t("unblock") : t("block")}
                </button>
              )}
            </div>
          )}
        </div>
        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-ink-soft">
          {data.sex && data.sex !== "unspecified" && (
            <span>{t.rich("sex", { b: (c) => <strong className="capitalize">{c}</strong> }, { sex: data.sex === "male" || data.sex === "female" ? t(`sexValue.${data.sex}`) : data.sex })}</span>
          )}
          {data.bodyType ? (
            <span>{t.rich("bodyType", { b: (c) => <strong className="capitalize">{c}</strong> }, { type: people.bodyType(data.bodyType) })}</span>
          ) : (
            <span className="text-ink-faint">{t("bodyNotShared")}</span>
          )}
          {data.shopsFor && (
            <span>{t.rich("shops", { b: (c) => <strong>{c}</strong> }, { lines: data.shopsFor.split(",").map((l) => g.line(l)).join(" + ") })}</span>
          )}
          <span className="text-ink-faint">{t("items", { n: data.closet.length })}</span>
        </p>
        {data.shopsFor && data.sex && data.sex !== "unspecified" &&
         ((data.sex === "male" && data.shopsFor.includes("womens")) ||
          (data.sex === "female" && data.shopsFor.includes("mens"))) && (
          <p className="mt-1 text-xs text-brand">
            {t("crossDept")}
          </p>
        )}

        <p className="mt-2 text-xs text-ink-faint">{t("privacy")}</p>

        <div className="mt-6 space-y-6">
          {data.closet.length === 0 ? (
            <EmptyState title={t("emptyTitle")} body={t("emptyBody")} />
          ) : (
            buildSections(data).map((sec) => (
              <div key={sec.id}>
                <h2 className="mb-2 text-h3 font-semibold text-ink">
                  {g.folder(sec.name)}
                  <span className="ml-2 rounded-full bg-paper-dim px-2 py-0.5 text-[10px] font-normal normal-case text-ink-faint">
                    {sec.items.length}
                  </span>
                </h2>
                <div className="space-y-2">
                  {sec.items.map((it) => (
                    <Card key={it.id} className="!p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-medium text-ink">
                          <ColorDot color={it.color} />
                          {it.brand} · <span className="text-ink-soft">{g.label(it.category)}</span> · {tSocial("sizeN", { size: it.size })}
                          {it.gender && <GenderTag gender={it.gender} />}
                          {it.color && <span className="text-xs text-ink-faint">· {g.color(it.color)}</span>}
                        </div>
                        <span className="inline-flex gap-0.5 text-xs">
                          <FitStars rating={it.fitRating} size={11} />
                        </span>
                      </div>
                      {it.areaNotesJson && (
                        <p className="mt-0.5 text-xs text-ink-faint">{safeNotes(it.areaNotesJson)}</p>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {data.canExport && (
          <div className="mt-6 flex items-center justify-between rounded-xl border border-line bg-white px-4 py-3">
            <p className="text-sm text-ink-soft">
              {t("canExport", { name: data.username })}
            </p>
            <a
              href={`/api/view/${encodeURIComponent(code)}/export`}
              className="whitespace-nowrap rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-ink-soft hover:border-brand hover:text-brand"
            >
              <Download size={14} className="mr-1 inline -mt-0.5" />{t("exportJson")}
            </a>
          </div>
        )}

        <Card className="mt-6 flex flex-col items-start gap-3 bg-paper-soft sm:flex-row sm:items-center sm:justify-between sm:gap-0">
          <p className="text-sm text-ink-soft">{t("likeThis", { name: data.username })}</p>
          <LinkButton href="/">{t("getStarted")}</LinkButton>
        </Card>

        <p className="mt-4 text-center text-xs text-ink-faint">
          <Link href="/community" className="hover:underline"><ArrowLeft size={14} className="-mt-px inline" /> {t("backToCommunity")}</Link>
        </p>
      </div>
    </main>
  );
}

function buildSections(data: PublicView) {
  const sections = data.collections
    .slice()
    .sort((a, b) => a.sortIndex - b.sortIndex)
    .map((c) => ({
      id: c.id,
      name: c.name,
      items: data.closet.filter((it) => it.collectionId === c.id),
    }))
    .filter((s) => s.items.length > 0);
  const uncategorized = data.closet.filter((it) => !it.collectionId);
  if (uncategorized.length > 0) {
    sections.push({ id: "__uncat__", name: "Uncategorized", items: uncategorized });
  }
  return sections;
}

function GenderTag({ gender }: { gender: string }) {
  const g = useGarmentText();
  // One neutral treatment, as in the closet: the line is information, not a colour code.
  if (!["mens", "womens", "unisex"].includes(gender)) return null;
  return <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-ink-soft ring-1 ring-line" title={g.line(gender)}>{g.lineShort(gender)}</span>;
}

function ColorDot({ color }: { color: string | null }) {
  const g = useGarmentText();
  if (!color) return null;
  const hex = colorHex(color);
  if (!hex) return null;
  return (
    <span className="inline-block h-3 w-3 flex-shrink-0 rounded-full border border-line"
      style={{ backgroundColor: hex }} title={g.color(color)} />
  );
}

function safeNotes(json: string | null): string | undefined {
  if (!json) return undefined;
  try { return JSON.parse(json)?.notes ?? undefined; } catch { return undefined; }
}
