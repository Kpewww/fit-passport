"use client";

// The way into /body ("my 3D body", Session 98): the founder could not find the 3D
// view, so the passport shows this card in both its views, with what the body is
// built from and what more would unlock or sharpen it.

import Link from "next/link";
import { ArrowRight, UserIcon } from "@/components/Icon";
import { useT } from "@/i18n/client";
import { bodyReadiness, type BodyFacts } from "@/lib/bodyView";

export function Body3DEntry({ facts, className = "" }: { facts: BodyFacts; className?: string }) {
  const t = useT("body3d");
  const r = bodyReadiness(facts);
  const line =
    r.level === "locked" ? t("entryLocked", { n: r.toUnlock.length })
    : r.level === "rough" ? t("entryRough", { n: r.girthsMissing.length })
    : t("entryOwn");
  return (
    <Link
      href="/body"
      className={`group flex items-center gap-4 rounded-2xl bg-white p-5 ring-1 ring-line transition hover:ring-ink/30 ${className}`}
    >
      <span className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${r.level === "locked" ? "bg-paper-soft text-ink-faint" : "bg-brand/10 text-brand"}`}>
        <UserIcon size={22} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[10px] font-bold uppercase tracking-[0.25em] text-ink-faint">3D</span>
        <span className="mt-0.5 block text-base font-semibold text-ink">{t("entryTitle")}</span>
        <span className="mt-0.5 block text-xs leading-relaxed text-ink-soft">{line}</span>
      </span>
      <span className="flex flex-shrink-0 items-center gap-1 whitespace-nowrap text-sm font-medium text-brand">
        {r.level === "locked" ? t("entryUnlock") : t("entryOpen")}
        <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
