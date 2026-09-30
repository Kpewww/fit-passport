// Locale and messages for server components. Reading the cookie makes a route
// dynamic — accepted in Session 79 so the first byte is already in the reader's
// language (most pages here are client-rendered and dynamic anyway).

import { cookies, headers } from "next/headers";
import { LANG_COOKIE, resolveLocale, type Locale } from "./config";
import { en } from "./messages/en";
import { zh } from "./messages/zh";
import { makeT } from "./translator";
import type { Messages, Namespace } from "./types";

export function getLocale(): Locale {
  return resolveLocale({
    cookie: cookies().get(LANG_COOKIE)?.value ?? null,
    acceptLanguage: headers().get("accept-language"),
  });
}

export function messagesFor(locale: Locale): Messages {
  return locale === "zh" ? zh : en;
}

export function getT<N extends Namespace>(ns: N) {
  return makeT(messagesFor(getLocale()), ns);
}
