"use client";

// Help — how the app works + how to earn every badge. Badge rows are generated
// from the single source of truth (BADGES) so this never drifts from reality.

import Link from "next/link";
import { Card } from "@/components/ui";
import { BadgeSeal } from "@/components/Badges";
import { BADGES, METAL_STYLE } from "@/lib/badges";
import { Logo } from "@/components/Logo";
import { ArrowLeft, ArrowRight } from "@/components/Icon";
import { useT } from "@/i18n/client";
import { useBadgeWords } from "@/i18n/badges";
import { Headline } from "@/components/Headline";

// Earn conditions come straight from each badge's own `blurb` in badges.ts —
// a single source of truth, so this table can never drift from the real rules.

export default function HelpPage() {
  const t = useT("help");
  const w = useBadgeWords();
  return (
    <main className="flex-1">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
        <h1 className="font-serif text-h1 text-ink"><Headline>{t("title")}</Headline></h1>
        <p className="mt-2 text-ink-soft">{t("lede")}</p>

        {/* Core concepts */}
        <Section title={t("basics")}>
          <HelpRow q={t("whatQ")} a={t("whatA")} />
          <HelpRow q={t("howQ")} a={t("howA")} />
          <HelpRow q={t("showsQ")} a={t("showsA")} />
        </Section>

        {/* Privacy */}
        <Section title={t("privacy")}>
          <HelpRow q={t("whoQ")} a={t("whoA")} />
          <HelpRow q={t("editQ")} a={t("editA")} />
          <HelpRow q={t("directoryQ")} a={t("directoryA")} />
        </Section>

        {/* Outfits */}
        <Section title={t("outfits")}>
          <HelpRow q={t("postingQ")} a={t("postingA")} />
          <HelpRow q={t("inStoreQ")} a={t("inStoreA")} />
          <HelpRow q={t("likesQ")} a={t("likesA")} />
        </Section>

        {/* Badges — generated from the ladder */}
        <Section title={t("badges")}>
          <div className="space-y-2">
            {BADGES.map((b) => (
              <div key={b.id} className="flex items-center gap-3 rounded-xl border border-line bg-white px-3 py-2.5">
                <BadgeSeal id={b.id} metal={b.metal} size={42} title={w.title(b.id, b.title)} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-ink">{w.title(b.id, b.title)}</span>
                    <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase ${METAL_STYLE[b.metal].bg} ${METAL_STYLE[b.metal].text}`}>
                      {w.metal(b.metal, METAL_STYLE[b.metal].label)}
                    </span>
                  </div>
                  <p className="text-xs text-ink-soft">{w.blurb(b.id, b.blurb)}</p>
                  <p className="text-[11px] italic text-ink-faint">{w.lore(b.id, b.lore)}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-sm text-ink-soft">
            {t.rich("pinNote", { link: (c) => <Link href="/badges" className="text-brand hover:underline">{c}</Link> })}
          </p>
        </Section>

        {/* The mark, presented as a specimen plate rather than a paragraph with a
            logo beside it. Every word here is the concept document's own —
            docs/design/LOGO_CONCEPT.md §16 "Core Brand Language". An earlier
            version paraphrased it from memory and invented a reading the document
            does not contain, so the copy is fixed and only the presentation moves.
            The Chinese (messages help.*) translates that copy and adds no reading.

            The size row at the bottom SHOWS the floor the caption describes. This
            project measures things and publishes the evidence; a claim about
            legibility that the reader can check in place is worth more than the
            same sentence asserted. */}
        <Section title={t("mark")}>
          <Card className="overflow-hidden !p-0">
            {/* Reversed on ink — the brand's own ground pair, and the mark takes
                its colour from `currentColor`, so this needs no separate asset. */}
            <div className="bg-ink px-6 py-10 text-paper sm:px-10 sm:py-12">
              <div className="flex flex-col items-center gap-7 text-center sm:flex-row sm:gap-10 sm:text-left">
                <div className="flex-shrink-0">
                  <Logo size={112} />
                </div>
                <div className="min-w-0">
                  <p className="font-serif text-2xl leading-snug sm:text-[1.75rem]">
                    {t("markLine")}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-paper/70">
                    {t.rich("markBody", { strong: (c) => <strong className="text-paper">{c}</strong> })}
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-7 sm:px-10">
              <p className="max-w-2xl text-sm leading-relaxed text-ink-soft">
                {t.rich("myth", { strong: (c) => <strong className="text-ink">{c}</strong>, em: (c) => <em>{c}</em> })}
              </p>

              {/* The myth maps to the product in three steps, and it is a journey,
                  so it reads across rather than down. The 1px gap trick gives
                  hairline rules between cells without border math. */}
              <ol className="mt-5 grid gap-px overflow-hidden rounded-xl bg-line sm:grid-cols-3">
                {[
                  [t("step1"), t("step1Body")],
                  [t("step2"), t("step2Body")],
                  [t("step3"), t("step3Body")],
                ].map(([myth, ours], i) => (
                  <li key={myth} className="min-w-0 bg-paper-soft p-4">
                    <div className="flex items-center gap-2">
                      <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-brand text-[9px] font-bold text-white">
                        {i + 1}
                      </span>
                      <span className="min-w-0 text-[10px] font-bold uppercase tracking-[0.16em] text-brand">
                        {myth}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-snug text-ink">{ours}</p>
                  </li>
                ))}
              </ol>

              <p className="mt-6 border-l-2 border-brand pl-4 font-serif text-lg leading-snug text-ink">
                {t("notAPicture")}
              </p>
            </div>

            {/* Shown, not told: the caption's claim is checkable right here. */}
            <div className="border-t border-line bg-paper px-6 py-6 sm:px-10">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink-faint">
                {t("floorTitle")}
              </p>
              {/* A fixed 4-column grid, not a wrapping flex row: the whole point is
                  seeing the four side by side, and a wrap that drops 16px onto its
                  own line breaks the comparison exactly where it matters most. */}
              <div className="mt-4 grid grid-cols-4 items-end gap-2 sm:gap-8">
                {[
                  { px: 96, note: t("sizeFull") },
                  { px: 40, note: t("sizeFloor") },
                  { px: 24, note: t("sizeThick") },
                  { px: 16, note: t("sizeGivesUp") },
                ].map(({ px, note }) => (
                  <div key={px} className="flex min-w-0 flex-col items-center gap-2 text-ink">
                    <div className="flex h-20 items-end sm:h-24">
                      <Logo size={px} />
                    </div>
                    <div className="min-w-0 text-center">
                      <div className="text-[11px] font-semibold tabular-nums text-ink">{px}px</div>
                      <div className="truncate text-[10px] text-ink-faint">{note}</div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-5 max-w-2xl text-xs leading-relaxed text-ink-faint">
                {t("floorNote")}
              </p>
            </div>
          </Card>
        </Section>

        <div className="mt-8 flex gap-3 text-sm">
          <Link href="/passport" className="text-brand hover:underline"><ArrowLeft size={14} className="-mt-px inline" /> {t("back")}</Link>
          <Link href="/badges" className="text-brand hover:underline">{t("library")} <ArrowRight size={14} className="-mt-px inline" /></Link>
        </div>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-8">
      <h2 className="mb-3 text-h3 font-semibold text-ink">{title}</h2>
      {children}
    </div>
  );
}

function HelpRow({ q, a }: { q: string; a: string }) {
  return (
    <Card className="mb-2 !p-4">
      <p className="font-medium text-ink">{q}</p>
      <p className="mt-1 text-sm text-ink-soft">{a}</p>
    </Card>
  );
}
