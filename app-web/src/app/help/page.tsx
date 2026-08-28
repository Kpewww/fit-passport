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

        {/* The mark, with the mark itself beside it — a metaphor explained next to
            the thing it explains, rather than as a paragraph somewhere it can't be
            checked against. */}
        <Section title="The mark">
          <Card className="!p-5">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="flex-shrink-0 self-start text-ink sm:self-center">
                <Logo size={96} />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-ink">It&apos;s called Fit Thread.</p>
                <p className="mt-1.5 text-sm text-ink-soft">
                  One continuous thread draws an <strong>F</strong> and a <strong>P</strong>,
                  and never lifts. The straight run is the <strong>measurement</strong> — the
                  tape, the number, the thing that is actually true about you. The loop is
                  the <strong>garment</strong> it comes back around to.
                </p>
                <p className="mt-2 text-sm text-ink-soft">
                  That is the whole product in one line: a measurement is only worth
                  something once it closes around a real piece of clothing. Your closet is
                  where the thread comes back.
                </p>
                <p className="mt-2 text-xs text-ink-faint">
                  Drawn as a single path so it survives being stamped small — though not
                  infinitely small: below about 20 pixels the loop fills in, which is why
                  the browser-tab icon is a simpler glyph rather than this one shrunk.
                </p>
              </div>
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
