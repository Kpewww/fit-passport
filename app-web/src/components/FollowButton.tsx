"use client";

// A follow toggle, used on member cards, outfit cards and public profiles.
//
// Two details that matter:
//  1. It is often rendered INSIDE a <Link> (the whole member card is one link),
//     so it must swallow the click before the router sees it — otherwise
//     following someone navigates away from the grid.
//  2. Unclaimed visitors can't follow (a follow needs a durable identity), so
//     instead of a dead button we send them to claim an account. Following is
//     one of the few moments where creating an account is obviously worth it.

import { useState } from "react";
import { useRouter } from "next/navigation";

export function FollowButton({
  accountCode,
  following,
  canFollow,
  onChange,
  size = "sm",
}: {
  accountCode: string;
  following: boolean;
  canFollow: boolean;
  /** Called after a successful toggle so the parent can refresh counts/feed. */
  onChange?: (nowFollowing: boolean) => void;
  size?: "sm" | "md";
}) {
  const router = useRouter();
  const [on, setOn] = useState(following);
  const [busy, setBusy] = useState(false);

  // The parent list can reload and hand us a new truth; keep in step without an
  // effect by tracking the prop we last synced from.
  const [syncedFrom, setSyncedFrom] = useState(following);
  if (following !== syncedFrom) {
    setSyncedFrom(following);
    setOn(following);
  }

  async function click(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    if (!canFollow) {
      router.push("/account");
      return;
    }
    const next = !on;
    setOn(next);
    setBusy(true);
    const res = await fetch("/api/follow", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ accountCode, follow: next }),
    })
      .then((r) => r.json())
      .catch(() => null);
    setBusy(false);
    if (!res || res.error) {
      setOn(!next); // roll back — the server said no
      return;
    }
    setOn(!!res.following);
    onChange?.(!!res.following);
  }

  const pad = size === "md" ? "px-3.5 py-1.5 text-sm" : "px-2.5 py-1 text-xs";
  const look = on
    ? "border-ink bg-ink text-paper hover:bg-black"
    : "border-line bg-white text-ink-soft hover:border-ink/40 hover:text-ink";

  return (
    <button
      onClick={click}
      disabled={busy}
      title={
        canFollow
          ? on
            ? "Unfollow — their looks leave your Following feed"
            : "Follow — their looks show up in your Following feed"
          : "Claim an account to follow people"
      }
      className={`whitespace-nowrap rounded-full border font-medium transition-colors disabled:opacity-60 ${pad} ${look}`}
    >
      {on ? "Following" : "+ Follow"}
    </button>
  );
}
