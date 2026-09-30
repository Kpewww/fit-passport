"use client";

// Words about people shown across the social pages: the coarse body type a
// member chose to share (stored as an English key such as "slim"), and the
// "<type> build" phrase. English shows the stored key as it always has.

import { useMemo } from "react";
import { useLocale, useT } from "./client";

const BODY_TYPES = new Set(["petite", "slim", "lean", "average", "athletic", "curvy", "broad", "tall", "plus"]);

export function usePeopleWords() {
  const locale = useLocale();
  const ta = useT("account");
  const tc = useT("common");
  return useMemo(() => {
    const bodyType = (v: string) =>
      locale === "zh" && BODY_TYPES.has(v) ? ta(`bodyType.${v as "slim"}`) : v;
    return { bodyType, build: (v: string) => tc("build", { type: bodyType(v) }) };
  }, [locale, ta, tc]);
}
