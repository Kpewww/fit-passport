// Site footer — treated as a designed closing moment, not a utility strip.
// Also makes it obvious this is a course demo rather than a shipping product.

import Link from "next/link";
import { Logo } from "@/components/Logo";

const COLUMNS: Array<{ title: string; links: Array<{ label: string; href: string }> }> = [
  {
    title: "Product",
    links: [
      { label: "Check a size", href: "/check" },
      { label: "Your closet", href: "/closet" },
      { label: "Passport", href: "/passport" },
      { label: "Outfits", href: "/outfits" },
    ],
  },
  {
    title: "Community",
    links: [
      { label: "Directory", href: "/community" },
      { label: "Badges", href: "/badges" },
      { label: "Help & guide", href: "/help" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Your account", href: "/account" },
      { label: "Log in", href: "/login" },
      { label: "Reset password", href: "/recover" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-auto border-t border-line bg-paper">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16">
        <div className="grid gap-10 sm:grid-cols-[1.4fr,1fr,1fr,1fr]">
          {/* wordmark + statement */}
          <div>
            <Link href="/" className="flex items-center gap-2 text-ink">
              <Logo size={26} />
              <span className="font-serif text-xl italic">Fit Passport</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-soft">
              One body. One fit identity. Any store. A consumer-owned fit layer —
              you keep the profile, it works wherever you shop.
            </p>
            <p className="mt-4 text-xs text-ink-faint">
              Precise measurements never leave your account.
            </p>
          </div>

          {COLUMNS.map((c) => (
            <div key={c.title}>
              <p className="eyebrow text-ink-faint">{c.title}</p>
              <ul className="mt-4 space-y-2 text-sm">
                {c.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-ink-soft transition-colors hover:text-ink">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* closing line */}
        <div className="mt-14 flex flex-col gap-3 border-t border-line pt-6 text-xs text-ink-faint sm:flex-row sm:items-center sm:justify-between">
          <p>
            <span className="rounded-full border border-line px-2 py-0.5 font-medium">DEMO</span>
            <span className="ml-2">
              A student project for 49-800 Start Up Creation in Practice · Carnegie Mellon University
            </span>
          </p>
          <p>Xiangchen Kong · Alyssa Qi · Jenny Cao · Nicolas Wang · © 2026</p>
        </div>
      </div>
    </footer>
  );
}
