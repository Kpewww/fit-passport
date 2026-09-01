"use client";

// Help — how the app works + how to earn every badge. Badge rows are generated
// from the single source of truth (BADGES) so this never drifts from reality.

import Link from "next/link";
import { Card } from "@/components/ui";
import { BadgeSeal } from "@/components/Badges";
import { BADGES, METAL_STYLE } from "@/lib/badges";
import { Logo } from "@/components/Logo";

// Earn conditions come straight from each badge's own `blurb` in badges.ts —
// a single source of truth, so this table can never drift from the real rules.

export default function HelpPage() {
  return (
    <main className="flex-1">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
        <h1 className="font-serif text-4xl text-ink">Help &amp; guide</h1>
        <p className="mt-2 text-ink-soft">
          Everything Fit Passport does, and how to earn every badge.
        </p>

        {/* Core concepts */}
        <Section title="The basics">
          <HelpRow q="What is Fit Passport?"
            a="One portable fit identity. You keep a profile (body info, preferred fit, clothes you own that fit well), then paste any product URL to get a size recommendation — with the reasons, not a black box." />
          <HelpRow q="How is my size decided?"
            a="A transparent scoring engine compares the product's size chart to your measurements and the clothes you already own, adjusted by your preferred fit. Every recommendation shows exactly what it's based on." />
          <HelpRow q="What does the passport show?"
            a="Your holder name, region, preferred fit, an optional portrait, your pinned badges, and a coarse body type (which you can hide). Precise measurements are never shared." />
        </Section>

        {/* Privacy */}
        <Section title="Privacy & sharing">
          <HelpRow q="Who can see my stuff?"
            a="Anyone with your account code can view your closet (read-only) and — only if you opt in — a coarse body type. Precise cm/kg measurements never leave your account." />
          <HelpRow q="How do I edit vs view?"
            a="Editing needs your password. Your account code alone can only view. That's the 'capability to read, credential to write' model." />
          <HelpRow q="The community directory"
            a="Strictly opt-in. Toggle 'Post yourself' in Community to be listed; unlist anytime." />
        </Section>

        {/* Outfits */}
        <Section title="Outfits & likes">
          <HelpRow q="Posting outfits"
            a="Compose a look from garment types + colors on the Outfits page, preview it on a body-typed mannequin, then post it to the community feed." />
          <HelpRow q="In-store only pieces"
            a="If a piece isn't sold online, tick 'in-store only' — the post shows a 🏬 tag so others know it's a local/thrift/tailor find." />
          <HelpRow q="Likes"
            a="Anyone can like an outfit once. Likes drive the top prestige badges." />
        </Section>

        {/* Badges — generated from the ladder */}
        <Section title="Badges — how to earn each">
          <div className="space-y-2">
            {BADGES.map((b) => (
              <div key={b.id} className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-3 py-2.5">
                <BadgeSeal id={b.id} metal={b.metal} size={42} title={b.title} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-ink">{b.title}</span>
                    <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase ${METAL_STYLE[b.metal].bg} ${METAL_STYLE[b.metal].text}`}>
                      {METAL_STYLE[b.metal].label}
                    </span>
                  </div>
                  <p className="text-xs text-ink-soft">{b.blurb}</p>
                  <p className="text-[11px] italic text-ink-faint">{b.lore}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-sm text-ink-soft">
            Pin up to 3 earned badges to your passport from the{" "}
            <Link href="/badges" className="text-brand hover:underline">badge library</Link>.
          </p>
        </Section>

        {/* The mark, presented as a specimen plate rather than a paragraph with a
            logo beside it. Every word here is the concept document's own —
            docs/design/LOGO_CONCEPT.md §16 "Core Brand Language". An earlier
            version paraphrased it from memory and invented a reading the document
            does not contain, so the copy is fixed and only the presentation moves.

            The size row at the bottom SHOWS the floor the caption describes. This
            project measures things and publishes the evidence; a claim about
            legibility that the reader can check in place is worth more than the
            same sentence asserted. */}
        <Section title="The mark">
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
                    One thread through the maze of fit.
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-paper/70">
                    Across brands, sizing becomes a labyrinth. Fit Passport keeps the
                    thread: what you wore, how it felt, and what worked. The mark is a
                    single thread folded into an <strong className="text-paper">FP</strong> — a
                    personal signet that guides you back to your fit.
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-7 sm:px-10">
              <p className="max-w-2xl text-sm leading-relaxed text-ink-soft">
                The reference is <strong className="text-ink">Ariadne&apos;s thread</strong>. She
                gives Theseus a thread to unroll into the Labyrinth so he can find his way
                out — and the useful half of that story is not the monster, it is that{" "}
                <em>she gives him the means to navigate without taking over</em>. That is
                the product:
              </p>

              {/* The myth maps to the product in three steps, and it is a journey,
                  so it reads across rather than down. The 1px gap trick gives
                  hairline rules between cells without border math. */}
              <ol className="mt-5 grid gap-px overflow-hidden rounded-xl bg-line sm:grid-cols-3">
                {[
                  ["The labyrinth", "Sizes that disagree across brands and regions"],
                  ["The thread", "Everything you\u2019ve worn and how it actually fit"],
                  ["The way back out", "A recommendation that shows its reasoning"],
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
                Which is why it isn&apos;t a picture of a shirt, a hanger or a tape measure.
                It&apos;s the memory that travels through clothing.
              </p>
            </div>

            {/* Shown, not told: the caption's claim is checkable right here. */}
            <div className="border-t border-line bg-paper px-6 py-6 sm:px-10">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink-faint">
                Where it stops working
              </p>
              {/* A fixed 4-column grid, not a wrapping flex row: the whole point is
                  seeing the four side by side, and a wrap that drops 16px onto its
                  own line breaks the comparison exactly where it matters most. */}
              <div className="mt-4 grid grid-cols-4 items-end gap-2 sm:gap-8">
                {[
                  { px: 96, note: "full mark" },
                  { px: 40, note: "the floor" },
                  { px: 24, note: "thickened" },
                  { px: 16, note: "gives up" },
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
                No claim is made on the myth — it&apos;s a lens for reading a modern mark,
                not a provenance. Drawn as one unbroken path so it survives being stamped
                small, though not infinitely small: below about 20 pixels the loop fills
                in, which is why the browser-tab icon is a simpler glyph rather than this
                one shrunk.
              </p>
            </div>
          </Card>
        </Section>

        <div className="mt-8 flex gap-3 text-sm">
          <Link href="/passport" className="text-brand hover:underline">← My passport</Link>
          <Link href="/badges" className="text-brand hover:underline">Badge library →</Link>
        </div>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-8">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-ink-soft">{title}</h2>
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
