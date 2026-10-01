"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ComponentType } from "react";
import { Logo } from "@/components/Logo";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { useT } from "@/i18n/client";
import {
  Board,
  BrowserIcon,
  Close,
  Hanger,
  IdCard,
  Menu,
  People,
  Question,
  Ruler,
  Shield,
  type IconProps,
} from "@/components/Icon";

type LinkKey = "check" | "extension" | "closet" | "passport" | "outfits" | "community" | "help" | "review";
type NavLink = { href: string; label: LinkKey; Icon: ComponentType<IconProps>; also?: string[] };

// Order (founder, 2026-09-30): what you keep first — closet, passport, outfits,
// community — then the tools, the extension before the link box it replaced as
// the way in, then help.
const LINKS: NavLink[] = [
  { href: "/closet", label: "closet", Icon: Hanger },
  { href: "/passport", label: "passport", Icon: IdCard },
  { href: "/outfits", label: "outfits", Icon: Board },
  // Questions live inside /community, so they get no tab of their own. Thread
  // pages sit at /ask/[id] and don't share the prefix, hence `also`.
  { href: "/community", label: "community", Icon: People, also: ["/ask"] },
  { href: "/extension", label: "extension", Icon: BrowserIcon },
  { href: "/check", label: "check", Icon: Ruler },
  { href: "/help", label: "help", Icon: Question },
];

type Me = { claimed: boolean; username: string | null; role?: string };

export function Nav() {
  const pathname = usePathname();
  const t = useT("nav");
  const [me, setMe] = useState<Me | null>(null);
  // Below `sm` every nav link is hidden, and this panel IS the navigation
  // (build-state ㉔) — before it existed a phone could not get past the homepage.
  const [menuOpen, setMenuOpen] = useState(false);

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

  const links: NavLink[] = [...LINKS, ...(me?.role === "ADMIN" ? [{ href: "/admin", label: "review" as const, Icon: Shield }] : [])];
  const isActive = (l: NavLink) =>
    [l.href, ...(l.also ?? [])].some((pfx) => pathname === pfx || pathname.startsWith(`${pfx}/`));
  const onAccount = pathname === "/account";

  return (
    // z-50: must sit above every in-page layer (converging cards, parallax
    // words) so the bar is always reachable.
    <header className="sticky top-0 z-50 border-b border-line bg-paper/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:h-16 sm:px-6">
        <Link href="/" className="group flex min-h-[44px] items-center gap-2 text-ink">
          <Logo size={26} className="transition-transform duration-200 ease-out group-hover:-rotate-3" />
          {/* lang="en": the wordmark keeps its italic in the Chinese layout, where
              italics are switched off for CJK text (globals.css). */}
          <span lang="en" className="font-serif text-xl italic">Fit Passport</span>
        </Link>

        <nav aria-label={t("main")} className="flex items-center gap-0.5 text-[13px]">
          {/* Desktop tabs, from lg: below 1024px the English row is wider than the
              screen, so the menu panel takes over there. The row keeps the English
              width in both languages (min-w, spread by justify-between), so switching
              language moves neither the tabs' ends nor the controls beside them. */}
          <div className="hidden lg:flex lg:min-w-[32.5rem] lg:justify-between">
            {links.map((l) => {
              const active = isActive(l);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  aria-current={active ? "page" : undefined}
                  className={`nav-tab relative flex h-16 items-center px-3 tracking-[0.01em] transition-colors duration-200 ${
                    active ? "font-medium text-ink" : "text-ink-soft hover:text-ink"
                  }`}
                >
                  {t(l.label)}
                  {active && <span className="absolute inset-x-3 -bottom-px h-px bg-ink" aria-hidden />}
                </Link>
              );
            })}
          </div>

          <span className="mx-2 hidden h-4 w-px bg-line lg:block" aria-hidden />
          <LanguageSwitch compact className="mr-2 hidden lg:inline-flex" />

          {/* Account. Claimed: an initial in a hairline circle, plus the handle on
              wide screens. Unclaimed: the one ink action in the bar. Both keep a
              44px touch box on a phone by height, not by size. */}
          {me?.claimed ? (
            <Link
              href="/account"
              aria-label={t("yourAccount", { username: me.username ?? "" })}
              aria-current={onAccount ? "page" : undefined}
              className={`flex min-h-[44px] items-center gap-2 rounded-full px-1.5 transition-colors duration-200 lg:min-h-0 lg:py-1 lg:pr-3 ${
                onAccount ? "text-ink" : "text-ink-soft hover:text-ink"
              }`}
            >
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium uppercase ${
                  onAccount ? "bg-ink text-paper" : "bg-white text-ink ring-1 ring-line"
                }`}
                aria-hidden
              >
                {(me.username ?? "?").slice(0, 1)}
              </span>
              <span className="hidden max-w-[10rem] truncate lg:inline">@{me.username}</span>
            </Link>
          ) : (
            <Link
              href="/account"
              className="flex h-11 items-center justify-center rounded-full bg-ink px-4 text-xs font-medium tracking-wide text-paper transition-colors duration-200 hover:bg-black lg:h-8 lg:min-w-[7.375rem]"
            >
              {t("claimAccount")}
            </Link>
          )}

          {/* Menu button — phones only. */}
          <button
            type="button"
            aria-label={menuOpen ? t("closeMenu") : t("openMenu")}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            onClick={() => setMenuOpen((v) => !v)}
            className="-mr-2 ml-1 flex h-11 w-11 items-center justify-center rounded-full text-ink hover:bg-ink/5 lg:hidden"
          >
            {menuOpen ? <Close size={22} /> : <Menu size={22} />}
          </button>
        </nav>
      </div>

      {/* Mobile navigation panel. Rendered inside the sticky header so it inherits
          the backdrop and can never be painted over by an in-page layer. */}
      {menuOpen && (
        <nav id="mobile-nav" aria-label={t("main")} className="border-t border-line bg-paper lg:hidden">
          <ul className="mx-auto max-w-6xl px-4 py-3">
            {links.map((l) => {
              const active = isActive(l);
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-[52px] items-center gap-3.5 px-1 text-base transition-colors ${
                      active ? "font-medium text-ink" : "text-ink-soft active:text-ink"
                    }`}
                  >
                    <l.Icon size={22} className={active ? "text-ink" : "text-ink-faint"} />
                    {t(l.label)}
                    {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brand" aria-hidden />}
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="mx-auto max-w-6xl border-t border-line px-4 py-3">
            <LanguageSwitch />
          </div>
        </nav>
      )}
    </header>
  );
}
