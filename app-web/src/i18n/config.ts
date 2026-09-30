// Which languages the product speaks, and how a request picks one.
//
// Pure, no framework imports: used by the server (layout, API routes), the
// client (the switch), and tests alike.
//
// THE RULE (founder's decision, Session 79): a visitor who has chosen a language
// gets it; otherwise the browser's own preference decides; otherwise English. The
// choice lives in one cookie, so the server renders the right language on the
// first byte instead of flashing English and swapping.

export const LOCALES = ["en", "zh"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

/** The cookie holding an explicit choice. Readable by the page, so the switch can set it. */
export const LANG_COOKIE = "fp-lang";
/** Sent by the extension, whose own switch must win over the site's cookie. */
export const LANG_HEADER = "x-fp-lang";

export function isLocale(v: unknown): v is Locale {
  return typeof v === "string" && (LOCALES as readonly string[]).includes(v);
}

/** The `lang` attribute a page in this locale carries. */
export function htmlLang(locale: Locale): string {
  return locale === "zh" ? "zh-CN" : "en";
}

/**
 * The best supported language in an Accept-Language header, by its q-values.
 * "zh-CN,zh;q=0.9,en;q=0.8" → zh; "en-US,en;q=0.9,zh-CN;q=0.8" → en. Any Chinese
 * tag (zh, zh-CN, zh-TW, zh-Hans…) counts as zh: there is one Chinese version.
 */
export function localeFromAcceptLanguage(header: string | null | undefined): Locale | null {
  if (!header) return null;
  const ranked = header
    .split(",")
    .map((part, i) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
      const weight = q ? Number(q.slice(2)) : 1;
      return { tag: tag.trim().toLowerCase(), weight: Number.isFinite(weight) ? weight : 0, i };
    })
    .filter((x) => x.tag && x.weight > 0)
    // Stable: equal weights keep the order the browser listed them in.
    .sort((a, b) => b.weight - a.weight || a.i - b.i);
  for (const { tag } of ranked) {
    const base = tag.split("-")[0];
    if (isLocale(base)) return base;
  }
  return null;
}

/** Read one cookie out of a raw Cookie header. */
export function cookieValue(header: string | null | undefined, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return null;
}

/**
 * The whole decision, from raw request parts: an explicit header (the
 * extension), then the cookie (the site's switch), then the browser, then English.
 */
export function resolveLocale(parts: {
  header?: string | null;
  cookie?: string | null;
  acceptLanguage?: string | null;
}): Locale {
  if (isLocale(parts.header)) return parts.header;
  if (isLocale(parts.cookie)) return parts.cookie;
  return localeFromAcceptLanguage(parts.acceptLanguage) ?? DEFAULT_LOCALE;
}
