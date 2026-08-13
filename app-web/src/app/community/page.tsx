"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Card, Field, inputClass } from "@/components/ui";
import { Avatar, PinnedSeals } from "@/components/Badges";
import { OutfitCard } from "@/components/OutfitCard";
import { FollowButton } from "@/components/FollowButton";
import { TodayBoard } from "@/components/TodayBoard";
import { MetalSurface, resolveTheme } from "@/components/MetalCard";
import type { FeedScope } from "@/lib/feed";

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
      <div className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="font-serif text-4xl text-ink">Community</h1>
        <p className="mt-2 text-ink-soft">
          Fit is easier to trust when it comes from someone built like you. Browse
          public closets, follow the people whose taste you trust, or enter a
          friend&apos;s code to see theirs.
        </p>
        {follow?.claimed && (
          <p className="mt-2 text-xs uppercase tracking-widest text-ink-faint">
            {follow.followerCount} follower{follow.followerCount === 1 ? "" : "s"}
            {" · "}
            {follow.followingCount} following
          </p>
        )}

        <p className="mt-3 text-sm">
          <Link href="/ask" className="font-medium text-brand hover:underline">
            Ask the community about fit →
          </Link>
        </p>

        {/* The live band — what's happening right now, before anything static. */}
        <TodayBoard />

        {/* Post yourself to community */}
        <Card className="mt-6 flex items-center justify-between gap-4 bg-brand-tint/40">
          <div>
            <p className="font-semibold text-ink">Post yourself to the community</p>
            <p className="mt-0.5 text-sm text-ink-soft">
              {me?.claimed
                ? "List your closet publicly so others can find your fit. Coarse info only — precise measurements are never shared. You can unlist anytime."
                : "Claim an account first, then you can share your closet publicly."}
            </p>
          </div>
          {me?.claimed ? (
            me.listedInCommunity ? (
              <Button variant="secondary" size="md" disabled={posting} onClick={() => toggleListing(false)}>
                {posting ? "…" : "Unlist"}
              </Button>
            ) : (
              <Button size="md" disabled={posting} onClick={() => toggleListing(true)}>
                {posting ? "…" : "Post me →"}
              </Button>
            )
          ) : (
            <Link href="/account" className="whitespace-nowrap rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-dark">
              Claim account
            </Link>
          )}
        </Card>

        {/* Outfit feed — two scopes, two orderings (see lib/feed.ts).
            NOTHING in this header may change width with the scope, or the tabs
            visibly jump when you switch. So the heading text is fixed, the tab
            labels are fixed (the follow count lives in the line above), and the
            caption below always renders one line. */}
        <div id="looks" className="mt-8 flex flex-wrap items-center gap-3 scroll-mt-20">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-ink-soft">Latest looks</h2>
          <ScopeTabs scope={scope} onChange={setScope} />
          <Link href="/outfits" className="ml-auto text-xs font-medium text-brand hover:underline">Post an outfit →</Link>
        </div>
        <p className="mt-1 text-xs text-ink-faint">
          {scope === "following"
            ? "Newest first, from the people you follow."
            : "Most-liked first — what the community rated highest."}
        </p>
        {feed === null ? (
          <p className="mt-3 text-sm text-ink-faint">Loading…</p>
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

        {/* Code lookup */}
        <Card className="mt-8">
          <form onSubmit={go} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Field label="Have a code? View a specific closet">
                <input className={inputClass} value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="FP-XXXX-XXXX-XXXXX" />
              </Field>
            </div>
            <Button type="submit" disabled={!code.trim()}>View</Button>
          </form>
        </Card>

        {/* Public directory */}
        <h2 className="mt-10 text-sm font-semibold uppercase tracking-widest text-ink-soft">
          Public closets
        </h2>
        {entries === null ? (
          <p className="mt-3 text-sm text-ink-faint">Loading…</p>
        ) : entries.length === 0 ? (
          <Card className="mt-3 bg-neutral-50 text-center">
            <p className="text-sm text-ink-soft">
              No public closets yet. Be the first — post yourself above!
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

        <Card className="mt-8 bg-neutral-50">
          <h2 className="text-sm font-semibold text-ink">How sharing works</h2>
          <ul className="mt-2 space-y-1.5 text-sm text-ink-soft">
            <li>• Anyone with your <strong>account code</strong> can view your closet — read only.</li>
            <li>• Editing needs your <strong>password</strong>. Your code alone can&apos;t change anything.</li>
            <li>• Precise body measurements are <strong>never</strong> shared — only a coarse body type, if you opt in.</li>
            <li>• The public directory is <strong>strictly opt-in</strong> — you choose to be listed, and can unlist anytime.</li>
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
  const tabs: Array<{ key: FeedScope; label: string }> = [
    { key: "everyone", label: "Everyone" },
    { key: "following", label: "Following" },
  ];
  return (
    <div className="inline-flex rounded-full border border-line bg-paper-soft p-0.5 text-xs font-medium">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          aria-pressed={scope === t.key}
          className={`rounded-full px-3 py-1 transition-colors ${
            scope === t.key ? "bg-ink text-paper" : "text-ink-soft hover:text-ink"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
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
  if (scope === "everyone") {
    return (
      <Card className="mt-3 bg-neutral-50 text-center">
        <p className="text-sm text-ink-soft">
          No outfits yet.{" "}
          <Link href="/outfits" className="text-brand hover:underline">Post the first look →</Link>
        </p>
      </Card>
    );
  }
  if (!claimed) {
    return (
      <Card className="mt-3 bg-brand-tint/40 text-center">
        <p className="font-semibold text-ink">A feed of your own</p>
        <p className="mx-auto mt-1 max-w-md text-sm text-ink-soft">
          Claim an account to follow the people whose fit you trust — then this tab
          becomes their looks only, newest first.
        </p>
        <Link
          href="/account"
          className="mt-4 inline-block rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          Claim account
        </Link>
      </Card>
    );
  }
  return (
    <Card className="mt-3 bg-neutral-50 text-center">
      <p className="text-sm text-ink-soft">
        {followingCount === 0
          ? "You're not following anyone yet. Follow a few closets below and this becomes your feed."
          : "The people you follow haven't posted a look yet."}
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
  const theme = resolveTheme(entry.cardMetal, null);
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-line transition-shadow hover:shadow-lift">
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
          {theme.label}
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
            {entry.closetCount} items
            {entry.bodyType ? ` · ${entry.bodyType}` : ""}
            {entry.followerCount > 0
              ? ` · ${entry.followerCount} follower${entry.followerCount === 1 ? "" : "s"}`
              : ""}
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
