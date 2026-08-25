"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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
  // Below `sm` every nav link used to be `hidden` with nothing in its place, so
  // a phone had NO navigation at all — the only way to reach Check or Closet was
  // to go back to the homepage and hunt for an in-page link. This panel is that
  // missing navigation.
  const [menuOpen, setMenuOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setMe({ claimed: d.claimed, username: d.username, role: d.role }))
      .catch(() => {});
  }, [pathname]); // re-check on navigation (e.g. after claim/login)

  // Close on navigation, and on Escape. Without the first, tapping a link leaves
  // the panel covering the page you just asked for.
  useEffect(() => setMenuOpen(false), [pathname]);
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const links = [...LINKS, ...(me?.role === "ADMIN" ? [{ href: "/admin", label: "Review" }] : [])];
  const isActive = (href: string, also?: string[]) =>
    [href, ...(also ?? [])].some((pfx) => pathname === pfx || pathname.startsWith(`${pfx}/`));

  return (
    // z-50: must sit above every in-page layer (converging cards, parallax
    // words) so the bar is always reachable.
    <header className="sticky top-0 z-50 border-b border-line bg-paper/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6 sm:py-3.5">
        <Link href="/" className="group flex items-center gap-2 text-ink">
          <Logo size={26} className="transition-transform group-hover:-rotate-3" />
          <span className="font-serif text-xl italic">Fit Passport</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {/* Desktop tabs. Hidden on a phone, where the panel below takes over. */}
          {links.map((l) => {
            // startsWith so nested routes keep their tab lit; `also` covers
            // sections whose detail pages live under a different path.
            const active = isActive(l.href, "also" in l ? l.also : undefined);
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
          {/* Account chip. On a phone it keeps a 44px touch box without growing
              visually — padding, not size. */}
          {me?.claimed ? (
            <Link
              href="/account"
              className={`ml-2 flex min-h-[44px] items-center px-3 transition-colors sm:min-h-0 sm:py-1.5 ${
                pathname === "/account" ? "font-medium text-ink" : "text-ink-soft hover:text-ink"
              }`}
            >
              @{me.username}
            </Link>
          ) : (
            <Link
              href="/account"
              className="ml-2 flex min-h-[44px] items-center rounded-full bg-ink px-4 text-xs font-medium tracking-wide text-paper hover:bg-black sm:min-h-0 sm:py-1.5"
            >
              Claim account
            </Link>
          )}
          {/* Menu button — phones only. */}
          <button
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            onClick={() => setMenuOpen((v) => !v)}
            className="-mr-2 ml-1 flex h-11 w-11 items-center justify-center rounded-full text-ink hover:bg-ink/5 sm:hidden"
          >
            <svg viewBox="0 0 24 24" width={20} height={20} aria-hidden fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round">
              {menuOpen ? (
                <>
                  <line x1="5" y1="5" x2="19" y2="19" />
                  <line x1="19" y1="5" x2="5" y2="19" />
                </>
              ) : (
                <>
                  <line x1="3.5" y1="7" x2="20.5" y2="7" />
                  <line x1="3.5" y1="12" x2="20.5" y2="12" />
                  <line x1="3.5" y1="17" x2="20.5" y2="17" />
                </>
              )}
            </svg>
          </button>
        </nav>
      </div>

      {/* Mobile navigation panel. Rendered inside the sticky header so it inherits
          the backdrop and can never be painted over by an in-page layer. */}
      {menuOpen && (
        <div
          id="mobile-nav"
          ref={panelRef}
          className="border-t border-line bg-paper sm:hidden"
        >
          <ul className="mx-auto max-w-5xl px-4 py-2">
            {links.map((l) => {
              const active = isActive(l.href, "also" in l ? l.also : undefined);
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className={`flex min-h-[48px] items-center rounded-xl px-3 text-base transition-colors ${
                      active ? "bg-ink/5 font-medium text-ink" : "text-ink-soft active:bg-ink/5"
                    }`}
                  >
                    {l.label}
                    {active && <span className="ml-2 h-1 w-1 rounded-full bg-ink" aria-hidden />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </header>
  );
}
