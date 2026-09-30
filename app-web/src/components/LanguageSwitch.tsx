"use client";

// 中 | EN. Sets the one cookie the server reads (i18n/config.ts) and re-renders the
// page in place — the server renders the chosen language, so nothing flashes.
//
// Two sizes: `compact` for the desktop bar (32 px, beside other 32 px controls),
// and the full row for the phone menu and the footer, where every target is 44 px
// (design system rule).

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { htmlLang, LANG_COOKIE, type Locale } from "@/i18n/config";
import { useLocale, useT } from "@/i18n/client";

export function LanguageSwitch({ compact = false, className = "" }: { compact?: boolean; className?: string }) {
  const locale = useLocale();
  const t = useT("common");
  const router = useRouter();
  const [pending, start] = useTransition();

  function choose(next: Locale) {
    if (next === locale) return;
    document.cookie = `${LANG_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    // The fonts switch with `lang` (globals.css), so set it now rather than
    // after the round trip.
    document.documentElement.lang = htmlLang(next);
    start(() => router.refresh());
  }

  const options: Array<{ value: Locale; label: string }> = [
    { value: "zh", label: compact ? t("zhShort") : t("zhLong") },
    { value: "en", label: compact ? t("enShort") : t("enLong") },
  ];

  return (
    <div
      role="radiogroup"
      aria-label={t("languageLabel")}
      aria-busy={pending || undefined}
      className={`inline-flex rounded-full border border-line bg-white p-0.5 ${className}`}
    >
      {options.map((o) => {
        const on = o.value === locale;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            // Each option is named in its own language, so someone who cannot
            // read the current one can still find theirs.
            lang={o.value === "zh" ? "zh-CN" : "en"}
            onClick={() => choose(o.value)}
            className={`rounded-full font-medium transition-colors duration-200 ${
              compact ? "h-7 min-w-[2.25rem] px-2.5 text-xs" : "h-11 min-w-[5rem] px-4 text-sm"
            } ${on ? "bg-ink text-paper" : "text-ink-soft hover:text-ink"}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
