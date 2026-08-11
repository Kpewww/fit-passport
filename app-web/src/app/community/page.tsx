"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Card, Field, inputClass } from "@/components/ui";
import { Avatar, PinnedSeals } from "@/components/Badges";
import { OutfitCard } from "@/components/OutfitCard";

type Entry = {
  username: string;
  accountCode: string;
  avatarDataUrl: string | null;
  bodyType: string | null;
  sex: string | null;
  shopsFor: string | null;
  closetCount: number;
  badges: string[];
  badgeCount: number;
};

type Me = { claimed: boolean; listedInCommunity: boolean };

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

  function load() {
    fetch("/api/community").then((r) => r.json()).then((d) => setEntries(d.entries ?? []));
    fetch("/api/outfits").then((r) => r.json()).then((d) => setFeed(d.outfits ?? []));
    fetch("/api/status").then((r) => r.json())
      .then((s) => setMe({ claimed: !!s.claimed, listedInCommunity: !!s.listedInCommunity }))
      .catch(() => setMe(null));
  }
  useEffect(load, []);

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
        <h1 className="text-3xl font-bold text-ink">Community</h1>
        <p className="mt-2 text-ink-soft">
          Fit is easier to trust when it comes from someone built like you. Browse
          public closets, or enter a friend&apos;s code to see theirs.
        </p>

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
                {posting ? "…" : "Listed ✓ · Unlist"}
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

        {/* Outfit feed */}
        <div className="mt-8 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-ink-soft">Latest looks</h2>
          <Link href="/outfits" className="text-xs font-medium text-brand hover:underline">Post an outfit →</Link>
        </div>
        {feed === null ? (
          <p className="mt-3 text-sm text-ink-faint">Loading…</p>
        ) : feed.length === 0 ? (
          <Card className="mt-3 bg-neutral-50 text-center">
            <p className="text-sm text-ink-soft">No outfits yet. <Link href="/outfits" className="text-brand hover:underline">Post the first look →</Link></p>
          </Card>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {feed.map((o) => (
              <OutfitCard key={o.id} outfit={o} figure={{ volume: "average", shape: "straight" }} onChange={load} />
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
                <Card className="flex items-center gap-3 !p-4 transition-shadow hover:shadow-lift">
                  <Avatar src={e.avatarDataUrl} initials={e.username.slice(0, 2).toUpperCase()} size={48} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-ink">{e.username}</p>
                    <p className="text-xs text-ink-faint">
                      {e.closetCount} items
                      {e.bodyType ? ` · ${e.bodyType}` : ""}
                      {e.badgeCount > 0 ? ` · ${e.badgeCount} badge${e.badgeCount === 1 ? "" : "s"}` : ""}
                    </p>
                  </div>
                  {e.badges.length > 0 && <PinnedSeals ids={e.badges} size={28} />}
                </Card>
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
