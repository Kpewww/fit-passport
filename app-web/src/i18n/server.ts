// Locale and messages for server components. Reading the cookie makes a route
// dynamic — accepted in Session 79 so the first byte is already in the reader's
// language (most pages here are client-rendered and dynamic anyway).

import { cookies, headers } from "next/headers";
import { LANG_COOKIE, resolveLocale, type Locale } from "./config";
import { en } from "./messages/en";
import { zh } from "./messages/zh";
import { makeT } from "./translator";
import type { Messages, Namespace } from "./types";

export async function getLocale(): Promise<Locale> {
  return resolveLocale({
    cookie: (await cookies()).get(LANG_COOKIE)?.value ?? null,
    acceptLanguage: (await headers()).get("accept-language"),
  });
}

export function messagesFor(locale: Locale): Messages {
  return locale === "zh" ? zh : en;
}

export async function getT<N extends Namespace>(ns: N) {
  return makeT(messagesFor((await getLocale())), ns);
}
