"use client";

// Badge library — your trophy case. Shows every badge (earned, in-progress, and
// locked/coming-soon), and lets you pin up to 3 earned ones to your passport.

import { useEffect, useState } from "react";
import { ArrowLeft, Check, Pin } from "@/components/Icon";
import Link from "next/link";
import { Card } from "@/components/ui";
import { BadgeSeal } from "@/components/Badges";
import { badgesByTrack, METAL_STYLE, type EarnedBadge } from "@/lib/badges";
import { useT } from "@/i18n/client";
import { useBadgeWords } from "@/i18n/badges";

type StatusResp = {
  badges: EarnedBadge[];
  earnedBadgeIds: string[];
  pinnedBadges: string[];
  claimed: boolean;
};

export default function BadgesPage() {
  const t = useT("badges");
  const w = useBadgeWords();
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
    return <main className="flex-1"><div className="mx-auto max-w-3xl px-4 sm:px-6 py-14 text-ink-faint">{t("loading")}</div></main>;
  }

  const earnedCount = data.badges.filter((b) => b.earnedNow).length;
  const byId = Object.fromEntries(data.badges.map((b) => [b.id, b]));
  const tracks = badgesByTrack().map((t) => ({
    ...t,
    badges: t.badges.map((b) => byId[b.id]).filter(Boolean),
  }));

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-h1 text-ink">{t("title")}</h1>
            <p className="mt-1 text-ink-soft">{t("lede")}</p>
          </div>
          <Link href="/passport" className="text-sm text-ink-faint hover:text-brand"><ArrowLeft size={14} className="-mt-px inline" /> {t("passport")}</Link>
        </div>

        <p className="mt-4 text-sm text-ink-soft">
          {t.rich("earnedOf", { b: (c) => <strong className="text-ink">{c}</strong> }, { n: earnedCount, total: data.badges.length })} ·{" "}
          <span className="text-ink-faint">{t("pinned", { n: pinned.length })}{saving ? t("saving") : ""}</span>
        </p>

        {tracks.map((tr) => (
          <Section key={tr.track} title={w.track(tr.track, tr.label)}>
            <div className="grid gap-3 sm:grid-cols-2">
              {tr.badges.map((b) => (
                <BadgeCard key={b.id} badge={b}
                  pinned={pinned.includes(b.id)}
                  canPin={b.earnedNow && (pinned.length < 3 || pinned.includes(b.id))}
                  onPin={b.earnedNow ? () => togglePin(b.id) : undefined} />
              ))}
            </div>
          </Section>
        ))}
      </div>

    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    // `defer-offscreen`: each track holds several dimensional coins, and a coin is
    // an expensive object (see the comment on .defer-offscreen in globals.css).
    // Off-screen tracks should not sit in GPU memory.
    <div className="defer-offscreen mt-8">
      <h2 className="mb-3 text-h3 font-semibold text-ink">{title}</h2>
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
  const t = useT("badges");
  const w = useBadgeWords();
  const st = METAL_STYLE[badge.metal];
  const dim = !badge.earnedNow;
  return (
    <Card className={`flex gap-3 !p-4 ${dim ? "bg-paper-dim" : ""}`}>
      {/* The seal opens its own inspect stage — no wrapper button, or we'd nest
          one button inside another. */}
      <BadgeSeal
        id={badge.id}
        metal={badge.metal}
        size={54}
        locked={!badge.earnedNow}
        title={w.title(badge.id, badge.title)}
        detail={badge}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className={`truncate font-semibold ${dim ? "text-ink-soft" : "text-ink"}`}>{w.title(badge.id, badge.title)}</p>
          <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase ${st.bg} ${st.text}`}>
            {w.metal(badge.metal, st.label)}
          </span>
          {badge.earnedNow && <span className="inline-flex items-center gap-0.5 text-[10px] text-ok"><Check size={10} />{t("earned")}</span>}
        </div>
        <p className="mt-0.5 text-xs text-ink-soft">{w.blurb(badge.id, badge.blurb)}</p>
        <p className="mt-0.5 text-[11px] italic text-ink-faint">{w.lore(badge.id, badge.lore)}</p>
        {badge.progressText && !badge.earnedNow && (
          <p className="mt-1 text-[11px] font-medium text-brand">{w.progress(badge.progressText)}</p>
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
            {pinned ? <><Pin size={14} weight="fill" className="mr-1 inline -mt-0.5" />{t("pinnedUnpin")}</> : canPin ? t("pinToPassport") : t("threePinned")}
          </button>
        )}
      </div>
    </Card>
  );
}
