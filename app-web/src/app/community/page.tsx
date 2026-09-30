"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Card, Field, PageHeader, Segmented, inputClass } from "@/components/ui";
import { Avatar, PinnedSeals } from "@/components/Badges";
import { OutfitCard } from "@/components/OutfitCard";
import { FollowButton } from "@/components/FollowButton";
import { TodayBoard } from "@/components/TodayBoard";
import { AskSection } from "@/components/AskSection";
import { MetalSurface, resolveTheme } from "@/components/MetalCard";
import type { FeedScope } from "@/lib/feed";
import { ArrowRight } from "@/components/Icon";
import { useT } from "@/i18n/client";
import { usePeopleWords } from "@/i18n/people";

type Entry = {
  username: string;
  accountCode: string;
  avatarDataUrl: string | null;
  bodyType: string | null;
  cardMetal: string | null;
  sex: string | null;
  shopsFor: string | null;
  closetCount: number;
  followerCount: number;
  badges: string[];
  badgeCount: number;
};

type Me = { claimed: boolean; listedInCommunity: boolean };

type FollowSummary = {
  claimed: boolean;
  accountCode: string | null;
  following: string[];
  followingCount: number;
  followerCount: number;
};

type OutfitFeed = {
  id: string; title: string; description: string | null; occasion: string | null;
  onlineAvailable: boolean; likeCount: number; likedByMe: boolean; mine: boolean;
  author: { username: string | null; accountCode: string | null; avatarDataUrl: string | null };
  items: Array<{ id: string; brand: string | null; category: string; color: string | null; size: string | null; note: string | null; onlineAvailable: boolean }>;
};

export default function CommunityPage() {
  const t = useT("community");
  const router = useRouter();
  const [code, setCode] = useState("");
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [posting, setPosting] = useState(false);
  const [feed, setFeed] = useState<OutfitFeed[] | null>(null);
  const [scope, setScope] = useState<FeedScope>("everyone");
  const [follow, setFollow] = useState<FollowSummary | null>(null);

  const loadFeed = useCallback((s: FeedScope) => {
    setFeed(null);
    fetch(`/api/outfits?scope=${s}`)
      .then((r) => r.json())
      .then((d) => setFeed(d.outfits ?? []))
      .catch(() => setFeed([]));
  }, []);

  const load = useCallback(() => {
    fetch("/api/community").then((r) => r.json()).then((d) => setEntries(d.entries ?? []));
    fetch("/api/follow").then((r) => r.json()).then(setFollow).catch(() => setFollow(null));
    fetch("/api/status").then((r) => r.json())
      .then((s) => setMe({ claimed: !!s.claimed, listedInCommunity: !!s.listedInCommunity }))
      .catch(() => setMe(null));
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadFeed(scope); }, [scope, loadFeed]);

  const followingSet = useMemo(
    () => new Set(follow?.following ?? []),
    [follow],
  );
  const canFollow = !!follow?.claimed;

  // A follow changes what the Following feed contains, so refresh both the
  // summary (counts) and the feed if it's the one on screen.
  function afterFollowChange() {
    fetch("/api/follow").then((r) => r.json()).then(setFollow).catch(() => {});
    if (scope === "following") loadFeed("following");
  }

  function go(e: React.FormEvent) {
    e.preventDefault();
    if (code.trim()) router.push(`/u/${encodeURIComponent(code.trim())}`);
  }

  async function toggleListing(next: boolean) {
    setPosting(true);
    await fetch("/api/profile/prefs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ listedInCommunity: next }),
    }).catch(() => {});
    setPosting(false);
    load();
  }

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-3xl px-4 pb-16 pt-10 sm:px-6 sm:pt-14">
        <PageHeader
          eyebrow={t("eyebrow")}
          title={t("title")}
          lede={t("lede")}
        />
        {follow?.claimed && (
          <p className="mt-2 text-xs uppercase tracking-widest text-ink-faint">
            {t.n("followers", follow.followerCount)}
            {" · "}
            {t("following", { n: follow.followingCount })}
          </p>
        )}

        <p className="mt-3 text-sm">
          <a href="#questions" className="font-medium text-brand hover:underline">
            {t("askCommunity")} <ArrowRight size={14} className="-mt-px inline" />
          </a>
        </p>

        {/* The live band — what's happening right now, before anything static. */}
        <TodayBoard />

        {/* Post yourself to community */}
        {/* Stack on a phone: side-by-side squeezes the copy into a 3-word column
            while the button holds its width. */}
        <Card className="mt-6 flex flex-col items-start gap-3 bg-brand-tint/40 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div>
            <p className="font-semibold text-ink">{t("postYourself")}</p>
            <p className="mt-0.5 text-sm text-ink-soft">{me?.claimed ? t("postBodyClaimed") : t("postBodyAnon")}</p>
          </div>
          {me?.claimed ? (
            me.listedInCommunity ? (
              <Button variant="secondary" size="md" disabled={posting} onClick={() => toggleListing(false)}>
                {posting ? "…" : t("unlist")}
              </Button>
            ) : (
              <Button size="md" disabled={posting} onClick={() => toggleListing(true)}>
                {posting ? "…" : <>{t("postMe")} <ArrowRight size={14} className="-mt-px inline" /></>}
              </Button>
            )
          ) : (
            <Link href="/account" className="whitespace-nowrap rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-black">
              {t("claimAccount")}
            </Link>
          )}
        </Card>

        {/* Outfit feed — two scopes, two orderings (see lib/feed.ts).
            NOTHING in this header may change width with the scope, or the tabs
            visibly jump when you switch. So the heading text is fixed, the tab
            labels are fixed (the follow count lives in the line above), and the
            caption below always renders one line. */}
        <div id="looks" className="mt-8 flex flex-wrap items-center gap-3 scroll-mt-20">
          <h2 className="text-h3 font-semibold text-ink">{t("latestLooks")}</h2>
          <ScopeTabs scope={scope} onChange={setScope} />
          <Link href="/outfits" className="ml-auto text-xs font-medium text-brand hover:underline">{t("postOutfit")} <ArrowRight size={14} className="-mt-px inline" /></Link>
        </div>
        <p className="mt-1 text-xs text-ink-faint">
          {scope === "following" ? t("captionFollowing") : t("captionEveryone")}
        </p>
        {feed === null ? (
          <p className="mt-3 text-sm text-ink-faint">{t("loading")}</p>
        ) : feed.length === 0 ? (
          <FeedEmpty scope={scope} claimed={canFollow} followingCount={follow?.followingCount ?? 0} />
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {feed.map((o) => (
              <OutfitCard
                key={o.id}
                outfit={o}
                figure={{ volume: "average", shape: "straight" }}
                // Deliberately NOT refetching the feed on a like: the card
                // updates its own count, and a refetch would re-sort the
                // "everyone" feed under the reader's cursor.
                onChange={load}
                authorAction={
                  !o.mine && o.author.accountCode ? (
                    <FollowButton
                      accountCode={o.author.accountCode}
                      following={followingSet.has(o.author.accountCode)}
                      canFollow={canFollow}
                      onChange={afterFollowChange}
                    />
                  ) : undefined
                }
              />
            ))}
          </div>
        )}

        {/* Questions — the utility loop, merged in rather than a separate page */}
        <AskSection />

        {/* Code lookup */}
        <Card className="mt-8">
          <form onSubmit={go} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Field label={t("codeLabel")}>
                <input className={inputClass} value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="FP-XXXX-XXXX-XXXXX" />
              </Field>
            </div>
            <Button type="submit" disabled={!code.trim()}>{t("view")}</Button>
          </form>
        </Card>

        {/* Public directory */}
        <h2 className="mt-10 text-h3 font-semibold text-ink">
          {t("publicClosets")}
        </h2>
        {entries === null ? (
          <p className="mt-3 text-sm text-ink-faint">{t("loading")}</p>
        ) : entries.length === 0 ? (
          <Card className="mt-3 bg-paper-soft text-center">
            <p className="text-sm text-ink-soft">
              {t("noClosets")}
            </p>
          </Card>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {entries.map((e) => (
              <Link key={e.accountCode} href={`/u/${encodeURIComponent(e.accountCode)}`}>
                <MemberCard
                  entry={e}
                  following={followingSet.has(e.accountCode)}
                  canFollow={canFollow}
                  onFollowChange={afterFollowChange}
                />
              </Link>
            ))}
          </div>
        )}

        <Card className="mt-8 bg-paper-soft">
          <h2 className="text-sm font-semibold text-ink">{t("howSharing")}</h2>
          <ul className="mt-2 space-y-1.5 text-sm text-ink-soft">
            {(["share1", "share2", "share3", "share4"] as const).map((k) => (
              <li key={k}>• {t.rich(k, { b: (c) => <strong>{c}</strong> })}</li>
            ))}
          </ul>
        </Card>
      </div>
    </main>
  );
}

// Scope switch for the feed. Labels are deliberately CONSTANT — putting the
// follow count in here made the control resize and drift as you used it.
function ScopeTabs({
  scope,
  onChange,
}: {
  scope: FeedScope;
  onChange: (s: FeedScope) => void;
}) {
  const t = useT("community");
  const tabs: Array<{ key: FeedScope; label: string }> = [
    { key: "everyone", label: t("everyone") },
    { key: "following", label: t("followingTab") },
  ];
  return (
    <Segmented
      label={t("scopeLabel")}
      options={tabs.map((tab) => ({ value: tab.key, label: tab.label }))}
      value={scope}
      onChange={onChange}
    />
  );
}

// Three different reasons a feed can be empty — each gets the next useful step
// instead of a dead end.
function FeedEmpty({
  scope,
  claimed,
  followingCount,
}: {
  scope: FeedScope;
  claimed: boolean;
  followingCount: number;
}) {
  const t = useT("community");
  if (scope === "everyone") {
    return (
      <Card className="mt-3 bg-paper-soft text-center">
        <p className="text-sm text-ink-soft">
          {t.rich("noOutfits", {
            link: (c) => <Link href="/outfits" className="text-brand hover:underline">{c} <ArrowRight size={14} className="-mt-px inline" /></Link>,
          })}
        </p>
      </Card>
    );
  }
  if (!claimed) {
    return (
      <Card className="mt-3 bg-brand-tint/40 text-center">
        <p className="font-semibold text-ink">{t("ownFeedTitle")}</p>
        <p className="mx-auto mt-1 max-w-md text-sm text-ink-soft">{t("ownFeedBody")}</p>
        <Link
          href="/account"
          className="mt-4 inline-block rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-black"
        >
          {t("claimAccount")}
        </Link>
      </Card>
    );
  }
  return (
    <Card className="mt-3 bg-paper-soft text-center">
      <p className="text-sm text-ink-soft">
        {followingCount === 0 ? t("notFollowing") : t("noPostsYet")}
      </p>
    </Card>
  );
}

// A member row whose BANNER wears their card metal — the same finish as their
// passport card, so a colour reads as a person's identity across the app.
function MemberCard({
  entry,
  following,
  canFollow,
  onFollowChange,
}: {
  entry: Entry;
  following: boolean;
  canFollow: boolean;
  onFollowChange: () => void;
}) {
  const t = useT("community");
  const tp = useT("passport");
  const people = usePeopleWords();
  const theme = resolveTheme(entry.cardMetal, null);
  return (
    <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-line transition-shadow hover:ring-ink/25">
      {/* metal banner */}
      <div
        className="relative h-16"
        style={{ background: `linear-gradient(140deg, ${theme.from} 0%, ${theme.via} 52%, ${theme.to} 100%)` }}
      >
        <MetalSurface theme={theme} radius={0} />
        <span
          className="absolute bottom-1.5 right-3 text-[8px] uppercase tracking-[0.24em]"
          style={{ color: theme.text, opacity: 0.6 }}
        >
          {tp(`theme.${theme.key as "lapis"}`)}
        </span>
      </div>
      {/* Details, with the avatar overlapping the banner edge.
          `relative z-10` is required: the banner above is positioned, and
          positioned siblings paint over STATIC ones regardless of DOM order — so
          without this the metal surface covers the avatar and badges. */}
      <div className="relative z-10 flex items-end gap-3 px-4 pb-4">
        <div className="-mt-7 rounded-full ring-4 ring-white">
          <Avatar src={entry.avatarDataUrl} initials={entry.username.slice(0, 2).toUpperCase()} size={48} ring={false} />
        </div>
        <div className="min-w-0 flex-1 pb-0.5">
          <p className="truncate font-semibold text-ink">{entry.username}</p>
          {/* Badge COUNT is deliberately not repeated here — the seals on the
              right already say it, and the room is better spent on fit signal. */}
          <p className="text-xs text-ink-faint">
            {t("items", { n: entry.closetCount })}
            {entry.bodyType ? ` · ${people.bodyType(entry.bodyType)}` : ""}
            {entry.followerCount > 0 ? ` · ${t.n("followers", entry.followerCount)}` : ""}
          </p>
        </div>
        <div className="flex flex-shrink-0 flex-col items-end gap-1.5 pb-0.5">
          {entry.badges.length > 0 && <PinnedSeals ids={entry.badges} size={26} />}
          <FollowButton
            accountCode={entry.accountCode}
            following={following}
            canFollow={canFollow}
            onChange={onFollowChange}
          />
        </div>
      </div>
    </div>
  );
}
