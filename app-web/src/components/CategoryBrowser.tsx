"use client";

// The two-level type browser behind CategoryPicker — Session 98. Parents as chips
// with icons, the chosen parent's types below them, and a search box over every
// type in both languages (its words load on first focus). See CategoryPicker for
// why it is shaped this way.

import { useEffect, useId, useMemo, useState } from "react";
import { GarmentIcon, PARENT_ICON } from "@/components/GarmentIcon";
import { Search } from "@/components/Icon";
import { PARENT_ORDER, garmentType, typesUnder, type GarmentParent } from "@/lib/garmentTaxonomy";
import type { searchGarmentTypes } from "@/lib/garmentSearch";
import { SCOREABLE_DOMAINS, domainForCategory } from "@/lib/sizeSystems";
import { useT } from "@/i18n/client";
import { useGarmentText } from "@/i18n/garment";

export function TypeBrowser({
  value,
  parent,
  onPick,
}: {
  value: string;
  parent: GarmentParent;
  onPick: (key: string, under: GarmentParent) => void;
}) {
  const t = useT("garment");
  const g = useGarmentText();
  const [shown, setShown] = useState<GarmentParent>(parent);
  useEffect(() => { setShown(parent); }, [parent]);
  const [query, setQuery] = useState("");
  const searchId = useId();
  // The search words are a few kilobytes no one needs until they search: loaded on
  // the box's first focus.
  const [search, setSearch] = useState<typeof searchGarmentTypes | null>(null);
  const loadSearch = () => {
    if (!search) import("@/lib/garmentSearch").then((m) => setSearch(() => m.searchGarmentTypes)).catch(() => {});
  };
  const results = useMemo(
    () => (query.trim() && search ? search(query, (k) => [g.label(k)]).slice(0, 14) : null),
    [query, g, search],
  );
  const chosen = garmentType(value);
  const scored = SCOREABLE_DOMAINS.includes(domainForCategory(value));

  const typeChip = (key: string, under: GarmentParent, showParent = false) => {
    const on = key === value;
    return (
      <button
        key={`${under}:${key}`}
        type="button"
        aria-pressed={on}
        onClick={() => { onPick(key, under); setQuery(""); }}
        className={`inline-flex h-9 max-w-full items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors sm:h-8 ${on ? "border-ink bg-ink text-paper" : "border-line bg-white text-ink-soft hover:border-ink/40 hover:text-ink"}`}
      >
        <GarmentIcon category={key} size={15} className="flex-shrink-0" />
        <span className="truncate">{g.label(key)}</span>
        {showParent && <span className={`truncate font-normal ${on ? "text-paper/70" : "text-ink-faint"}`}>· {g.parent(under)}</span>}
      </button>
    );
  };

  return (
    <div className="min-w-0 space-y-3">
      <div className="relative">
        <label htmlFor={searchId} className="sr-only">{t("picker.search")}</label>
        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
        <input
          id={searchId}
          type="search"
          value={query}
          onFocus={loadSearch}
          onChange={(e) => { loadSearch(); setQuery(e.target.value); }}
          placeholder={t("picker.searchPlaceholder")}
          className="h-10 w-full rounded-xl border border-line bg-paper-soft pl-9 pr-3 text-sm text-ink placeholder:text-ink-faint focus:bg-white focus:outline-none focus:ring-2 focus:ring-ink/10"
        />
      </div>

      {results ? (
        results.length ? (
          <div className="flex flex-wrap gap-1.5">{results.map((r) => typeChip(r.key, r.parents[0], true))}</div>
        ) : (
          <p className="text-xs text-ink-soft">{t("picker.noMatch")}</p>
        )
      ) : (
        <>
          <div role="group" aria-label={t("picker.parents")} className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
            {PARENT_ORDER.map((p) => {
              const on = p === shown;
              return (
                <button
                  key={p}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setShown(p)}
                  className={`flex min-w-0 flex-col items-center gap-1 rounded-xl border px-1.5 py-2 text-[11px] font-medium leading-tight transition-colors ${on ? "border-brand bg-brand/5 text-ink" : "border-line bg-white text-ink-soft hover:border-ink/30 hover:text-ink"}`}
                >
                  <GarmentIcon category={PARENT_ICON[p]} size={20} className={on ? "text-brand" : "text-ink-faint"} />
                  <span className="w-full truncate text-center">{g.parent(p)}</span>
                </button>
              );
            })}
          </div>
          <div role="group" aria-label={t("picker.types")} className="flex flex-wrap gap-1.5 rounded-xl bg-paper-soft p-2">
            {typesUnder(shown).map((ty) => typeChip(ty.key, shown))}
          </div>
        </>
      )}

      {chosen && (
        <p className="text-[11px] leading-relaxed text-ink-faint">
          <span className="font-medium text-ink-soft">{t("picker.chosen")}</span>
          {g.parent(parent)} · {g.label(value)}
          {chosen.parents[0] === "sets" && <span className="block">{t("picker.setsNote")}</span>}
          {!scored && <span className="block">{t("picker.notScored")}</span>}
        </p>
      )}
    </div>
  );
}
