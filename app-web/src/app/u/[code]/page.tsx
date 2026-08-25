"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card, EmptyState, LinkButton } from "@/components/ui";
import { Avatar, PinnedSeals } from "@/components/Badges";
import { FollowButton } from "@/components/FollowButton";

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
    if (next && !confirm(`Block ${data.username}? Their looks and answers disappear from your feeds, and yours from theirs. They're not told.`)) return;
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
            title="No closet found for that code"
            body="Double-check the account code. Codes look like FP-XXXX-XXXX-XXXXX."
            action={<LinkButton href="/community">Try another code</LinkButton>}
          />
        </div>
      </main>
    );
  }

  if (!data) {
    return <main className="flex-1"><div className="mx-auto max-w-2xl px-4 sm:px-6 py-14 text-ink-faint">Loading…</div></main>;
  }

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
        <div className="flex items-center gap-2 text-xs">
          <span className="rounded-full bg-brand-tint px-2.5 py-0.5 font-medium text-brand">
            Viewing {data.username}&apos;s closet
          </span>
          <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-ink-faint">
            read-only
          </span>
        </div>
        <div className="mt-3 flex items-center gap-4">
          <Avatar src={data.avatarDataUrl} initials={data.username.slice(0, 2).toUpperCase()} size={64} />
          <div className="min-w-0">
            <h1 className="font-serif text-4xl text-ink">{data.username}</h1>
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
                  {data.followerCount} follower{data.followerCount === 1 ? "" : "s"}
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
                  className="text-[11px] text-ink-faint underline-offset-2 hover:text-red-600 hover:underline disabled:opacity-50"
                >
                  {blocked.includes(data.accountCode) ? "Unblock" : "Block"}
                </button>
              )}
            </div>
          )}
        </div>
        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-ink-soft">
          {data.sex && data.sex !== "unspecified" && (
            <span>Sex (sizing ref): <strong className="capitalize">{data.sex}</strong></span>
          )}
          {data.bodyType ? (
            <span>Body type: <strong className="capitalize">{data.bodyType}</strong></span>
          ) : (
            <span className="text-ink-faint">Body type not shared</span>
          )}
          {data.shopsFor && (
            <span>Shops: <strong>{data.shopsFor.split(",").join(" + ")}</strong></span>
          )}
          <span className="text-ink-faint">· {data.closet.length} items</span>
        </p>
        {data.shopsFor && data.sex && data.sex !== "unspecified" &&
         ((data.sex === "male" && data.shopsFor.includes("womens")) ||
          (data.sex === "female" && data.shopsFor.includes("mens"))) && (
          <p className="mt-1 text-xs text-brand">
            ⚡ Cross-department shopper — useful reference for anyone doing the same.
          </p>
        )}

        <p className="mt-2 text-xs text-ink-faint">
          Precise measurements are never shared by code — only the closet and a
          coarse body type (if the owner opted in).
        </p>

        <div className="mt-6 space-y-6">
          {data.closet.length === 0 ? (
            <EmptyState title="This closet is empty" body="Nothing to show yet." />
          ) : (
            buildSections(data).map((sec) => (
              <div key={sec.id}>
                <h2 className="mb-2 text-sm font-semibold uppercase tracking-widest text-ink-soft">
                  {sec.name}
                  <span className="ml-2 rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-normal normal-case text-ink-faint">
                    {sec.items.length}
                  </span>
                </h2>
                <div className="space-y-2">
                  {sec.items.map((it) => (
                    <Card key={it.id} className="!p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-medium text-ink">
                          <ColorDot color={it.color} />
                          {it.brand} · <span className="text-ink-soft">{it.category}</span> · size {it.size}
                          {it.gender && <GenderTag gender={it.gender} />}
                          {it.color && <span className="text-xs text-ink-faint">· {it.color}</span>}
                        </div>
                        <span className="inline-flex gap-0.5 text-xs">
                          <span className="text-amber-500">{"★".repeat(it.fitRating)}</span>
                          <span className="text-neutral-300">{"★".repeat(5 - it.fitRating)}</span>
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
          <div className="mt-6 flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-3">
            <p className="text-sm text-ink-soft">
              {data.username} lets anyone with the code export this closet.
            </p>
            <a
              href={`/api/view/${encodeURIComponent(code)}/export`}
              className="whitespace-nowrap rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium text-ink-soft hover:border-brand hover:text-brand"
            >
              ⬇ Export as JSON
            </a>
          </div>
        )}

        <Card className="mt-6 flex flex-col items-start gap-3 bg-neutral-50 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
          <p className="text-sm text-ink-soft">
            Like this closet? Build your own fit profile and get size
            recommendations based on what fits {data.username}.
          </p>
          <LinkButton href="/">Get started</LinkButton>
        </Card>

        <p className="mt-4 text-center text-xs text-ink-faint">
          <Link href="/community" className="hover:underline">← Back to community</Link>
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

const COLOR_PRESETS: Record<string, string> = {
  black: "#1a1a1a", white: "#f5f5f5", grey: "#9ca3af", charcoal: "#374151",
  navy: "#1f2a44", blue: "#3b82f6", denim: "#4a6fa5", beige: "#d8c3a5",
  cream: "#f0e9d6", brown: "#6b4f3a", olive: "#6b7443", green: "#4b7a53",
  sage: "#9caf88", teal: "#2f8f83", burgundy: "#6d2036", red: "#b03a3a",
  rust: "#b5622f", mustard: "#d0a028", pink: "#dba0b0", purple: "#7c5aa8",
};

function GenderTag({ gender }: { gender: string }) {
  const m: Record<string, { label: string; cls: string }> = {
    mens: { label: "M", cls: "bg-blue-100 text-blue-700" },
    womens: { label: "W", cls: "bg-pink-100 text-pink-700" },
    unisex: { label: "U", cls: "bg-neutral-100 text-neutral-600" },
  };
  const g = m[gender];
  if (!g) return null;
  return <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${g.cls}`} title={gender}>{g.label}</span>;
}

function ColorDot({ color }: { color: string | null }) {
  if (!color) return null;
  const hex = /^#[0-9a-f]{3,8}$/i.test(color) ? color : COLOR_PRESETS[color.toLowerCase()];
  if (!hex) return null;
  return (
    <span className="inline-block h-3 w-3 flex-shrink-0 rounded-full border border-neutral-300"
      style={{ backgroundColor: hex }} title={color} />
  );
}

function safeNotes(json: string | null): string | undefined {
  if (!json) return undefined;
  try { return JSON.parse(json)?.notes ?? undefined; } catch { return undefined; }
}
