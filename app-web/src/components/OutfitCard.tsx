"use client";

// Shared outfit card — used by /outfits (mine) and /community (feed). Renders the
// stylized mannequin preview, metadata, in-store-only tags, and a like toggle.

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Card } from "@/components/ui";
import { OutfitMannequin, type OutfitLayer } from "@/components/OutfitMannequin";
import { Avatar } from "@/components/Badges";
import { garmentLabel } from "@/lib/garments";

export type OutfitItemView = {
  id: string;
  brand: string | null;
  category: string;
  color: string | null;
  size: string | null;
  note: string | null;
  onlineAvailable: boolean;
};

export type OutfitView = {
  id: string;
  title: string;
  description: string | null;
  occasion: string | null;
  onlineAvailable: boolean;
  likeCount: number;
  likedByMe: boolean;
  mine: boolean;
  author: { username: string | null; accountCode: string | null; avatarDataUrl: string | null };
  items: OutfitItemView[];
};

export function OutfitCard({
  outfit,
  figure,
  onDelete,
  onChange,
  authorAction,
}: {
  outfit: OutfitView;
  figure: { volume: string; shape: string };
  onDelete?: () => void;
  onChange?: () => void;
  /** Optional control beside the author (e.g. a follow toggle on the feed). */
  authorAction?: ReactNode;
}) {
  const [liked, setLiked] = useState(outfit.likedByMe);
  const [count, setCount] = useState(outfit.likeCount);

  async function toggle() {
    const next = !liked;
    setLiked(next); setCount((c) => c + (next ? 1 : -1));
    const r = await fetch("/api/outfits/like", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ outfitId: outfit.id, like: next }),
    }).then((r) => r.json()).catch(() => null);
    if (r) { setCount(r.likeCount); setLiked(r.likedByMe); }
    onChange?.();
  }

  const layers: OutfitLayer[] = outfit.items.map((it) => ({ category: it.category, color: it.color }));
  const offlinePieces = outfit.items.filter((it) => !it.onlineAvailable);

  return (
    <Card className="!p-4">
      <div className="flex gap-3">
        <div className="flex-shrink-0 rounded-lg bg-neutral-50 p-1">
          <OutfitMannequin layers={layers} volume={figure.volume as never} shape={figure.shape as never} size={92} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate font-semibold text-ink">{outfit.title}</p>
            {outfit.mine && onDelete && (
              <button onClick={onDelete} className="text-xs text-ink-faint hover:text-red-600">Delete</button>
            )}
          </div>
          {outfit.occasion && <p className="text-xs text-brand">{outfit.occasion}</p>}
          {outfit.description && <p className="mt-0.5 text-xs text-ink-soft">{outfit.description}</p>}
          <p className="mt-1 text-xs text-ink-faint">
            {outfit.items.map((it) => garmentLabel(it.category)).join(" · ")}
          </p>
          {!outfit.onlineAvailable && (
            <p className="mt-1 inline-block rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
              🏬 In-store only
            </p>
          )}
          {outfit.onlineAvailable && offlinePieces.length > 0 && (
            <p className="mt-1 text-[10px] text-amber-700">Some pieces in-store only</p>
          )}

          <div className="mt-2 flex items-center gap-3">
            {!outfit.mine && (
              <div className="flex min-w-0 items-center gap-1.5 text-xs text-ink-faint">
                <Avatar src={outfit.author.avatarDataUrl} initials={(outfit.author.username ?? "?").slice(0, 2).toUpperCase()} size={20} ring={false} />
                {/* The author's closet is the payoff of liking a look — make the
                    name the way in, then let the follow toggle sit beside it. */}
                {outfit.author.accountCode ? (
                  <Link
                    href={`/u/${encodeURIComponent(outfit.author.accountCode)}`}
                    className="truncate hover:text-ink hover:underline"
                  >
                    {outfit.author.username}
                  </Link>
                ) : (
                  <span className="truncate">{outfit.author.username}</span>
                )}
                {authorAction}
              </div>
            )}
            <button
              onClick={toggle}
              className={`ml-auto flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                liked ? "border-red-300 bg-red-50 text-red-600" : "border-neutral-300 text-ink-soft hover:border-red-300 hover:text-red-500"
              }`}
            >
              {liked ? "♥" : "♡"} {count}
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}
