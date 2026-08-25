"use client";

// The "Today" band — Daily Top Outfits + Top Stylists (ecosystem step 3).
//
// A daily board is worth more than a lifetime one: it RESETS, so a member who
// posts a good look this morning can top it this afternoon. That's the whole
// retention argument, so the copy says it out loud.

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui";
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

const WINDOWS: Array<{ key: LeaderWindow; label: string }> = [
  { key: "today", label: "Today" },
  { key: "week", label: "This week" },
];

export function TodayBoard() {
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
        <h2 className="text-sm font-semibold uppercase tracking-widest text-ink-soft">
          The board
        </h2>
        <div className="inline-flex rounded-full border border-line bg-paper-soft p-0.5 text-xs font-medium">
          {WINDOWS.map((t) => (
            <button
              key={t.key}
              onClick={() => setW(t.key)}
              aria-pressed={w === t.key}
              className={`flex min-h-[40px] items-center rounded-full px-3.5 transition-colors sm:min-h-0 sm:px-3 sm:py-1 ${
                w === t.key ? "bg-ink text-paper" : "text-ink-soft hover:text-ink"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <p className="mt-1 text-xs text-ink-faint">
        Counted from 00:00 UTC and reset every day — a look posted this morning can
        top it by tonight.
      </p>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Card className="!p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-faint">
            Top looks
          </p>
          {board === null ? (
            <p className="mt-3 text-sm text-ink-faint">Loading…</p>
          ) : board.topLooks.length === 0 ? (
            <p className="mt-3 text-sm text-ink-soft">
              No likes yet in this window. Every board starts empty —{" "}
              <Link href="/community#looks" className="text-brand hover:underline">
                like a look
              </Link>{" "}
              to open it.
            </p>
          ) : (
            <ol className="mt-2 space-y-2">
              {board.topLooks.map((l, i) => (
                <li key={l.id} className="flex items-center gap-3">
                  <RankMark n={i + 1} />
                  <div className="flex-shrink-0 rounded-lg bg-neutral-50 p-0.5">
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
                      {l.author.bodyType ? ` · ${l.author.bodyType} build` : ""}
                    </p>
                  </div>
                  <span className="flex-shrink-0 text-xs font-medium text-ink-soft">
                    ♥ {l.likesInWindow}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Card>

        <Card className="!p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-faint">
            Top stylists
          </p>
          {board === null ? (
            <p className="mt-3 text-sm text-ink-faint">Loading…</p>
          ) : board.topStylists.length === 0 ? (
            <p className="mt-3 text-sm text-ink-soft">
              Nobody has earned a place yet. Post a look, or{" "}
              <Link href="/ask" className="text-brand hover:underline">answer a question</Link> —
              a helpful answer is worth more here than a like.
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
                      {s.likes > 0 ? `${s.likes} like${s.likes === 1 ? "" : "s"}` : ""}
                      {s.likes > 0 && s.helpful > 0 ? " · " : ""}
                      {s.helpful > 0 ? `${s.helpful} helpful answer${s.helpful === 1 ? "" : "s"}` : ""}
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
