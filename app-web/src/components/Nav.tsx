"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";

const LINKS = [
  { href: "/check", label: "Check" },
  { href: "/closet", label: "Closet" },
  { href: "/passport", label: "Passport" },
  { href: "/outfits", label: "Outfits" },
  { href: "/ask", label: "Ask" },
  { href: "/community", label: "Community" },
  { href: "/help", label: "Help" },
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
    // z-50: must sit above every in-page layer (converging cards, parallax
    // words) so the bar is always reachable.
    <header className="sticky top-0 z-50 border-b border-line bg-paper/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3.5">
        <Link href="/" className="group flex items-center gap-2 text-ink">
          <Logo size={26} className="transition-transform group-hover:-rotate-3" />
          <span className="font-serif text-xl italic">Fit Passport</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {LINKS.map((l) => {
            // startsWith so nested routes (/ask/[id]) keep their tab lit.
            const active = pathname === l.href || pathname.startsWith(`${l.href}/`);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`relative hidden px-3 py-1.5 transition-colors sm:block ${
                  active ? "font-medium text-ink" : "text-ink-soft hover:text-ink"
                }`}
              >
                {l.label}
                {active && <span className="absolute inset-x-3 -bottom-px h-px bg-ink" />}
              </Link>
            );
          })}
          {/* Account chip */}
          {me?.claimed ? (
            <Link
              href="/account"
              className={`ml-2 px-3 py-1.5 transition-colors ${
                pathname === "/account" ? "font-medium text-ink" : "text-ink-soft hover:text-ink"
              }`}
            >
              @{me.username}
            </Link>
          ) : (
            <Link
              href="/account"
              className="ml-2 rounded-full bg-ink px-4 py-1.5 text-xs font-medium tracking-wide text-paper hover:bg-black"
            >
              Claim account
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
