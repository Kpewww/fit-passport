"use client";

// Whose account a typed code is (Session 100e): once the field holds a whole account
// code, the account's username fades in under it, faint on purpose — a reassurance,
// not a headline. Nothing shows for a partial code or one that names no active account.

import { useEffect, useState } from "react";
import { useT } from "@/i18n/client";

const SHAPE = /^(FP-)?[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{5}$/i;

export function CodeOwner({ value }: { value: string }) {
  const t = useT("account");
  const [name, setName] = useState<string | null>(null);
  useEffect(() => {
    setName(null);
    const v = value.trim().replace(/\s+/g, "");
    if (!SHAPE.test(v)) return;
    const timer = setTimeout(() => {
      fetch(`/api/account-name?code=${encodeURIComponent(v)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((j) => setName(typeof j?.username === "string" ? j.username : null))
        .catch(() => {});
    }, 350);
    return () => clearTimeout(timer);
  }, [value]);
  if (!name) return null;
  return (
    <p key={name} aria-live="polite" className="code-owner mt-1.5 text-xs text-ink">
      {t("codeOwner", { name })}
    </p>
  );
}
