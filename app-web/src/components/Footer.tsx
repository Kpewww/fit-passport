// Site footer — treated as a designed closing moment, not a utility strip.
// The DEMO badge stays: this is a working prototype, and saying so is the honest
// version of the same transparency the engine is built on.

import Link from "next/link";
import { Logo } from "@/components/Logo";
import { getT } from "@/i18n/server";
import type { KeyIn } from "@/i18n/types";

type LinkKey = KeyIn<"footer"> & `links.${string}`;

const COLUMNS: Array<{ title: KeyIn<"footer">; links: Array<{ label: LinkKey; href: string }> }> = [
  {
    title: "columns.product",
    links: [
      { label: "links.check", href: "/check" },
      { label: "links.extension", href: "/extension" },
      { label: "links.closet", href: "/closet" },
      { label: "links.passport", href: "/passport" },
      { label: "links.outfits", href: "/outfits" },
    ],
  },
  {
    title: "columns.community",
    links: [
      { label: "links.directory", href: "/community" },
      { label: "links.badges", href: "/badges" },
      { label: "links.help", href: "/help" },
    ],
  },
  {
    title: "columns.account",
    links: [
      { label: "links.account", href: "/account" },
      { label: "links.login", href: "/login" },
      { label: "links.recover", href: "/recover" },
    ],
  },
];

export function Footer() {
  const t = getT("footer");
  return (
    <footer className="mt-auto border-t border-line bg-paper">
      <div className="mx-auto max-w-6xl px-4 pb-10 pt-12 sm:px-6 sm:pt-14">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-[1.4fr,1fr,1fr,1fr]">
          {/* wordmark + statement */}
          <div className="col-span-2 sm:col-span-1">
            <Link href="/" className="flex items-center gap-2 text-ink">
              <Logo size={26} />
              <span lang="en" className="font-serif text-xl italic">Fit Passport</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-soft">{t("tagline")}</p>
            <p className="mt-4 text-xs text-ink-faint">{t("privacy")}</p>
          </div>

          {COLUMNS.map((c) => (
            <div key={c.title}>
              <p className="eyebrow text-ink-faint">{t(c.title)}</p>
              <ul className="mt-4 space-y-2.5 text-[13px]">
                {c.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-ink-soft transition-colors hover:text-ink">
                      {t(l.label)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* closing line */}
        <div className="mt-12 flex flex-col gap-3 border-t border-line pt-6 text-xs text-ink-faint sm:flex-row sm:items-center sm:justify-between">
          <p>
            <span className="rounded-full border border-line px-2 py-0.5 font-medium">{t("demo")}</span>
            <span className="ml-2">{t("demoLine")}</span>
          </p>
          <p lang="en">© 2026 Fit Passport</p>
        </div>
      </div>
    </footer>
  );
}
