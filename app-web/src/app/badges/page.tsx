"use client";

// Badge library — your trophy case. Shows every badge (earned, in-progress, and
// locked/coming-soon), and lets you pin up to 3 earned ones to your passport.

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui";
import { BadgeSeal } from "@/components/Badges";
import { BadgeInspect } from "@/components/BadgeInspect";
import { badgesByTrack, METAL_STYLE, type EarnedBadge } from "@/lib/badges";

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
  // The badge currently lifted into the inspect stage (CS2-style), if any.
  const [inspecting, setInspecting] = useState<EarnedBadge | null>(null);

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

  const earnedCount = data.badges.filter((b) => b.earnedNow).length;
  const byId = Object.fromEntries(data.badges.map((b) => [b.id, b]));
  const tracks = badgesByTrack().map((t) => ({
    ...t,
    badges: t.badges.map((b) => byId[b.id]).filter(Boolean),
  }));

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-ink">Badges</h1>
            <p className="mt-1 text-ink-soft">
              Progress through each track; the Rare Honors sit above them. Pin up
              to 3 earned badges to show off on your passport.
            </p>
          </div>
          <Link href="/passport" className="text-sm text-ink-faint hover:text-brand">← Passport</Link>
        </div>

        <p className="mt-4 text-sm text-ink-soft">
          <strong className="text-ink">{earnedCount}</strong> of {data.badges.length} earned ·{" "}
          <span className="text-ink-faint">{pinned.length}/3 pinned{saving ? " · saving…" : ""}</span>
        </p>

        {tracks.map((t) => (
          <Section key={t.track} title={t.label}>
            <div className="grid gap-3 sm:grid-cols-2">
              {t.badges.map((b) => (
                <BadgeCard key={b.id} badge={b}
                  pinned={pinned.includes(b.id)}
                  canPin={b.earnedNow && (pinned.length < 3 || pinned.includes(b.id))}
                  onPin={b.earnedNow ? () => togglePin(b.id) : undefined}
                  onInspect={() => setInspecting(b)} />
              ))}
            </div>
          </Section>
        ))}
      </div>

      {inspecting && <BadgeInspect badge={inspecting} onClose={() => setInspecting(null)} />}
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
  onInspect,
}: {
  badge: EarnedBadge;
  pinned?: boolean;
  canPin?: boolean;
  onPin?: () => void;
  onInspect?: () => void;
}) {
  const st = METAL_STYLE[badge.metal];
  const dim = !badge.earnedNow;
  return (
    <Card className={`flex gap-3 !p-4 ${dim ? "bg-paper-dim" : ""}`}>
      <button
        onClick={onInspect}
        title="Inspect"
        className="flex-shrink-0 rounded-full transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
      >
        <BadgeSeal id={badge.id} metal={badge.metal} size={54} locked={!badge.earnedNow} title={badge.title} />
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className={`truncate font-semibold ${dim ? "text-ink-soft" : "text-ink"}`}>{badge.title}</p>
          <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase ${st.bg} ${st.text}`}>
            {st.label}
          </span>
          {badge.earnedNow && <span className="text-[10px] text-green-600">✓ earned</span>}
        </div>
        <p className="mt-0.5 text-xs text-ink-soft">{badge.blurb}</p>
        <p className="mt-0.5 text-[11px] italic text-ink-faint">{badge.lore}</p>
        {badge.progressText && !badge.earnedNow && (
          <p className="mt-1 text-[11px] font-medium text-brand">{badge.progressText}</p>
        )}
        {onPin && (
          <button
            onClick={onPin}
            disabled={!pinned && !canPin}
            className={`mt-2 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
              pinned
                ? "border-brand bg-brand-tint text-brand"
                : canPin
                  ? "border-line text-ink-soft hover:border-brand hover:text-brand"
                  : "cursor-not-allowed border-line text-ink-faint"
            }`}
          >
            {pinned ? "📌 Pinned — click to unpin" : canPin ? "Pin to passport" : "3 pinned already"}
          </button>
        )}
      </div>
    </Card>
  );
}
