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
  // Questions live inside /community, so they get no tab of their own. Thread
  // pages sit at /ask/[id] and don't share the prefix, hence `also`.
  { href: "/community", label: "Community", also: ["/ask"] },
  { href: "/help", label: "Help" },
];

type Me = { claimed: boolean; username: string | null; role?: string };

export function Nav() {
  const pathname = usePathname();
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setMe({ claimed: d.claimed, username: d.username, role: d.role }))
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
            // startsWith so nested routes keep their tab lit; `also` covers
            // sections whose detail pages live under a different path.
            const prefixes = [l.href, ...(("also" in l && l.also) || [])];
            const active = prefixes.some(
              (pfx) => pathname === pfx || pathname.startsWith(`${pfx}/`),
            );
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
          {/* Review queue — only rendered for admins; the API re-checks anyway. */}
          {me?.role === "ADMIN" && (
            <Link
              href="/admin"
              className={`relative hidden px-3 py-1.5 transition-colors sm:block ${
                pathname === "/admin" ? "font-medium text-ink" : "text-ink-soft hover:text-ink"
              }`}
            >
              Review
            </Link>
          )}
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
