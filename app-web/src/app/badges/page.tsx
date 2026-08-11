"use client";

// Badge library — your trophy case. Shows every badge (earned, in-progress, and
// locked/coming-soon), and lets you pin up to 3 earned ones to your passport.

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui";
import { BadgeSeal } from "@/components/Badges";
import { METAL_STYLE, type EarnedBadge } from "@/lib/badges";

type StatusResp = {
  badges: EarnedBadge[];
  earnedBadgeIds: string[];
  pinnedBadges: string[];
  claimed: boolean;
};

export default function BadgesPage() {
  const [data, setData] = useState<StatusResp | null>(null);
  const [pinned, setPinned] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/status").then((r) => r.json()).then((d) => {
      setData(d);
      setPinned(d.pinnedBadges ?? []);
    });
  }, []);

  async function togglePin(id: string) {
    let next: string[];
    if (pinned.includes(id)) next = pinned.filter((x) => x !== id);
    else if (pinned.length < 3) next = [...pinned, id];
    else return; // at cap
    setPinned(next);
    setSaving(true);
    await fetch("/api/profile/prefs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ pinnedBadges: next }),
    }).catch(() => {});
    setSaving(false);
  }

  if (!data) {
    return <main className="flex-1"><div className="mx-auto max-w-3xl px-6 py-14 text-ink-faint">Loading…</div></main>;
  }

  const earned = data.badges.filter((b) => b.earnedNow);
  const inProgress = data.badges.filter((b) => !b.earnedNow && !b.locked);
  const locked = data.badges.filter((b) => b.locked);

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-ink">Badges</h1>
            <p className="mt-1 text-ink-soft">
              Earn badges by building and sharing your fit identity. Pin up to 3 to
              show off on your passport.
            </p>
          </div>
          <Link href="/passport" className="text-sm text-ink-faint hover:text-brand">← Passport</Link>
        </div>

        <p className="mt-4 text-sm text-ink-soft">
          <strong className="text-ink">{earned.length}</strong> earned ·{" "}
          <span className="text-ink-faint">{pinned.length}/3 pinned{saving ? " · saving…" : ""}</span>
        </p>

        {/* Earned */}
        <Section title="Earned">
          {earned.length === 0 ? (
            <p className="text-sm text-ink-faint">None yet — add clothes, record fit, and share to start earning.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {earned.map((b) => (
                <BadgeCard key={b.id} badge={b} pinned={pinned.includes(b.id)}
                  canPin={pinned.length < 3 || pinned.includes(b.id)} onPin={() => togglePin(b.id)} />
              ))}
            </div>
          )}
        </Section>

        {/* In progress */}
        {inProgress.length > 0 && (
          <Section title="In progress">
            <div className="grid gap-3 sm:grid-cols-2">
              {inProgress.map((b) => <BadgeCard key={b.id} badge={b} />)}
            </div>
          </Section>
        )}

        {/* Locked / coming soon */}
        {locked.length > 0 && (
          <Section title="Coming soon">
            <div className="grid gap-3 sm:grid-cols-2">
              {locked.map((b) => <BadgeCard key={b.id} badge={b} />)}
            </div>
          </Section>
        )}
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-8">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-ink-soft">{title}</h2>
      {children}
    </div>
  );
}

function BadgeCard({
  badge,
  pinned,
  canPin,
  onPin,
}: {
  badge: EarnedBadge;
  pinned?: boolean;
  canPin?: boolean;
  onPin?: () => void;
}) {
  const st = METAL_STYLE[badge.metal];
  return (
    <Card className={`flex gap-3 !p-4 ${badge.locked ? "opacity-75" : ""}`}>
      <BadgeSeal id={badge.id} metal={badge.metal} size={52} locked={badge.locked} title={badge.title} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-semibold text-ink">{badge.title}</p>
          <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase ${st.bg} ${st.text}`}>
            {st.label}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-ink-soft">{badge.blurb}</p>
        {badge.progressText && (
          <p className="mt-1 text-[11px] text-ink-faint">{badge.progressText}</p>
        )}
        {onPin && (
          <button
            onClick={onPin}
            disabled={!pinned && !canPin}
            className={`mt-2 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
              pinned
                ? "border-brand bg-brand-tint text-brand"
                : canPin
                  ? "border-neutral-300 text-ink-soft hover:border-brand hover:text-brand"
                  : "cursor-not-allowed border-neutral-200 text-ink-faint"
            }`}
          >
            {pinned ? "📌 Pinned — click to unpin" : canPin ? "Pin to passport" : "3 pinned already"}
          </button>
        )}
      </div>
    </Card>
  );
}
