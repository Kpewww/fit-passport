"use client";

// Locale and messages for client components. The root layout (a server
// component) picks the locale and hands over only that language's messages, so a
// page never ships both.

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { Locale } from "./config";
import { makeT } from "./translator";
import type { Messages, Namespace } from "./types";

const I18nContext = createContext<{ locale: Locale; messages: Messages } | null>(null);

export function I18nProvider({
  locale,
  messages,
  children,
}: {
  locale: Locale;
  messages: Messages;
  children: ReactNode;
}) {
  const value = useMemo(() => ({ locale, messages }), [locale, messages]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useT/useLocale outside <I18nProvider> (app/layout.tsx provides it)");
  return ctx;
}

export function useLocale(): Locale {
  return useI18n().locale;
}

export function useT<N extends Namespace>(ns: N) {
  const { messages } = useI18n();
  return useMemo(() => makeT(messages, ns), [messages, ns]);
}
