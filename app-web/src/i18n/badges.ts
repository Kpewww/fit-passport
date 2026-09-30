"use client";

// Badge words in the reader's language (lib/badgeText.ts).

import { useMemo } from "react";
import { useLocale } from "./client";
import { badgeWords } from "@/lib/badgeText";

export function useBadgeWords() {
  const locale = useLocale();
  return useMemo(() => badgeWords(locale), [locale]);
}
