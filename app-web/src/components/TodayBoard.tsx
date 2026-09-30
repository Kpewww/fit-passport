"use client";

// The "Today" band — Daily Top Outfits + Top Stylists (ecosystem step 3).
//
// A daily board is worth more than a lifetime one: it RESETS, so a member who
// posts a good look this morning can top it this afternoon. That's the whole
// retention argument, so the copy says it out loud.

import { useEffect, useState } from "react";
import { Heart } from "@/components/Icon";
import Link from "next/link";
import { Card, Segmented } from "@/components/ui";
import { useT } from "@/i18n/client";
import { usePeopleWords } from "@/i18n/people";
import { Avatar } from "@/components/Badges";
import { OutfitMannequin, type OutfitLayer } from "@/components/OutfitMannequin";
import { PALETTE } from "@/components/BadgeMedallion";
import type { LeaderWindow } from "@/lib/leaderboard";

type Author = {
  username: string | null;
  accountCode: string | null;
  avatarDataUrl: string | null;
  bodyType?: string | null;
};

type Board = {
  windowLabel: string;
  topLooks: Array<{
    id: string;
    title: string;
    occasion: string | null;
    likesInWindow: number;
    likeCount: number;
    layers: OutfitLayer[];
    author: Author;
  }>;
  topStylists: Array<Author & { likes: number; helpful: number; score: number }>;
};

const WINDOWS: LeaderWindow[] = ["today", "week"];

export function TodayBoard() {
  const t = useT("board");
  const tc = useT("common");
  const people = usePeopleWords();
  const [w, setW] = useState<LeaderWindow>("today");
  const [board, setBoard] = useState<Board | null>(null);

  useEffect(() => {
    setBoard(null);
    fetch(`/api/leaderboard?window=${w}`)
      .then((r) => r.json())
      .then(setBoard)
      .catch(() => setBoard({ windowLabel: "", topLooks: [], topStylists: [] }));
  }, [w]);

  return (
    <section className="mt-8">
      {/* Fixed heading + fixed tab labels: nothing here may resize with state. */}
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-h3 font-semibold text-ink">{t("title")}</h2>
        <Segmented
          label={t("windowLabel")}
          options={WINDOWS.map((k) => ({ value: k, label: t(k) }))}
          value={w}
          onChange={setW}
        />
      </div>
      <p className="mt-1 text-xs text-ink-faint">{t("note")}</p>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Card className="!p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-faint">
            {t("topLooks")}
          </p>
          {board === null ? (
            <p className="mt-3 text-sm text-ink-faint">{tc("loading")}</p>
          ) : board.topLooks.length === 0 ? (
            <p className="mt-3 text-sm text-ink-soft">
              {t.rich("noLikes", {
                link: (c) => <Link href="/community#looks" className="text-brand hover:underline">{c}</Link>,
              })}
            </p>
          ) : (
            <ol className="mt-2 space-y-2">
              {board.topLooks.map((l, i) => (
                <li key={l.id} className="flex items-center gap-3">
                  <RankMark n={i + 1} />
                  <div className="flex-shrink-0 rounded-lg bg-paper-soft p-0.5">
                    <OutfitMannequin layers={l.layers} volume="average" shape="straight" size={44} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{l.title}</p>
                    <p className="truncate text-xs text-ink-faint">
                      {l.author.accountCode ? (
                        <Link
                          href={`/u/${encodeURIComponent(l.author.accountCode)}`}
                          className="hover:text-ink hover:underline"
                        >
                          {l.author.username}
                        </Link>
                      ) : (
                        l.author.username
                      )}
                      {l.author.bodyType ? ` · ${people.build(l.author.bodyType)}` : ""}
                    </p>
                  </div>
                  <span className="flex-shrink-0 text-xs font-medium text-ink-soft">
                    <Heart size={12} weight="fill" className="mr-0.5 inline -mt-0.5" />{l.likesInWindow}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Card>

        <Card className="!p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-faint">
            {t("topStylists")}
          </p>
          {board === null ? (
            <p className="mt-3 text-sm text-ink-faint">{tc("loading")}</p>
          ) : board.topStylists.length === 0 ? (
            <p className="mt-3 text-sm text-ink-soft">
              {t.rich("noStylists", {
                link: (c) => <Link href="/ask" className="text-brand hover:underline">{c}</Link>,
              })}
            </p>
          ) : (
            <ol className="mt-2 space-y-2">
              {board.topStylists.map((s, i) => (
                <li key={s.accountCode ?? s.username ?? i} className="flex items-center gap-3">
                  <RankMark n={i + 1} />
                  <Avatar
                    src={s.avatarDataUrl}
                    initials={(s.username ?? "?").slice(0, 2).toUpperCase()}
                    size={26}
                    ring={false}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">
                      {s.accountCode ? (
                        <Link href={`/u/${encodeURIComponent(s.accountCode)}`} className="hover:underline">
                          {s.username}
                        </Link>
                      ) : (
                        s.username
                      )}
                    </p>
                    {/* Show the make-up of the score, not just the score — the
                        same "explain the number" rule as the fit engine. */}
                    <p className="truncate text-xs text-ink-faint">
                      {s.likes > 0 ? t.n("likes", s.likes) : ""}
                      {s.likes > 0 && s.helpful > 0 ? " · " : ""}
                      {s.helpful > 0 ? t.n("helpful", s.helpful) : ""}
                    </p>
                  </div>
                  <span className="flex-shrink-0 text-xs font-semibold text-ink">{s.score}</span>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>
    </section>
  );
}

/**
 * Rank numeral. Top three wear bronze/silver/gold so the board speaks the same
 * metal language as the badges and the passport card.
 */
function RankMark({ n }: { n: number }) {
  const metal = n === 1 ? PALETTE.gold : n === 2 ? PALETTE.silver : n === 3 ? PALETTE.bronze : null;
  if (!metal) {
    return (
      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md text-xs font-semibold text-ink-faint">
        {n}
      </span>
    );
  }
  return (
    <span
      className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md text-[11px] font-bold"
      style={{
        background: `linear-gradient(145deg, ${metal.light} 0%, ${metal.mid} 55%, ${metal.dark} 100%)`,
        color: metal.ink,
        boxShadow: `inset 0 0 0 1px ${metal.rim}55`,
      }}
    >
      {n}
    </span>
  );
}
