// The locale of an API request. No `next/headers`, so it works in any route
// handler and in tests.

import { cookieValue, LANG_COOKIE, LANG_HEADER, resolveLocale, type Locale } from "./config";

export function localeFromRequest(req: Request): Locale {
  return resolveLocale({
    header: req.headers.get(LANG_HEADER),
    cookie: cookieValue(req.headers.get("cookie"), LANG_COOKIE),
    acceptLanguage: req.headers.get("accept-language"),
  });
}
