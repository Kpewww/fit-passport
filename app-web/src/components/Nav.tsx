"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const LINKS = [
  { href: "/check", label: "Check a product" },
  { href: "/closet", label: "Closet" },
  { href: "/passport", label: "Passport" },
  { href: "/history", label: "History" },
  { href: "/community", label: "Community" },
];

type Me = { claimed: boolean; username: string | null };

export function Nav() {
  const pathname = usePathname();
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setMe({ claimed: d.claimed, username: d.username }))
      .catch(() => {});
  }, [pathname]); // re-check on navigation (e.g. after claim/login)

  return (
    <header className="sticky top-0 z-20 border-b border-neutral-200/80 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3.5">
        <Link href="/" className="flex items-center gap-2 font-semibold text-ink">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-brand text-[10px] font-bold text-white">
            FP
          </span>
          Fit Passport
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {LINKS.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`hidden rounded-lg px-3 py-1.5 transition-colors sm:block ${
                  active
                    ? "bg-brand-tint font-medium text-brand"
                    : "text-ink-soft hover:bg-neutral-100 hover:text-ink"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
          {/* Account chip */}
          {me?.claimed ? (
            <Link
              href="/account"
              className={`ml-1 rounded-lg px-3 py-1.5 transition-colors ${
                pathname === "/account"
                  ? "bg-brand-tint font-medium text-brand"
                  : "text-ink-soft hover:bg-neutral-100 hover:text-ink"
              }`}
            >
              @{me.username}
            </Link>
          ) : (
            <Link
              href="/account"
              className="ml-1 rounded-lg bg-brand px-3 py-1.5 font-medium text-white hover:bg-brand-dark"
            >
              Claim account
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
