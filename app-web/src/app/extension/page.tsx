// /extension — a short introduction to the browser extension, and the way to it.
//
// Since Session 85 the extension is in the Chrome Web Store, so this page is an
// introduction with one button: "Add to Chrome" opens the listing, and Chrome
// keeps the extension updated. The manual install (the zip, Developer mode) moved
// to /help as a backup for anyone who cannot use the store.
//
// Server component on purpose: nothing here needs the browser, so the page ships
// no JavaScript of its own. What is offered lives in `extensionDistribution.ts`.

import type { Metadata } from "next";
import Link from "next/link";
import { Card, Page, PageHeader } from "@/components/ui";
import { BrowserIcon, Lock, Shield } from "@/components/Icon";
import { EXTENSION_DISTRIBUTION } from "@/lib/extensionDistribution";
import { getT } from "@/i18n/server";

export function generateMetadata(): Metadata {
  const t = getT("extension");
  return { title: t("metaTitle"), description: t("metaDescription") };
}

const b = (c: string) => <b>{c}</b>;
const privacyLink = (c: string) => <Link href="/privacy" className="underline underline-offset-2 hover:text-ink">{c}</Link>;
const manualLink = (c: string) => <Link href="/help#manual-install" className="underline underline-offset-2 hover:text-ink">{c}</Link>;

export default function ExtensionPage() {
  const t = getT("extension");
  return (
    <Page width="read">
      <PageHeader eyebrow={t("eyebrow")} title={t("title")} lede={t("lede")} />

      {/* The one thing this page is for. */}
      <Card className="mt-10">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="mt-0.5 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-ink text-paper">
              <BrowserIcon size={22} />
            </span>
            <div>
              <p className="font-medium text-ink">{t("cardName")}</p>
              <p className="mt-0.5 text-sm text-ink-soft">{t("storeNote")}</p>
            </div>
          </div>
          <a
            href={EXTENSION_DISTRIBUTION.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-ink px-6 text-sm font-medium text-paper transition-colors hover:bg-ink/85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            <BrowserIcon size={18} /> {t("addToChrome")}
          </a>
        </div>
      </Card>

      <section className="mt-12">
        <h2 className="text-h3 font-semibold text-ink">{t("stepsTitle")}</h2>
        <ol className="mt-5 space-y-4">
          {(["add", "pin", "use"] as const).map((k, i) => (
            <li key={k} className="flex gap-4">
              <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-line text-sm tabular-nums text-ink-soft">
                {i + 1}
              </span>
              <p className="pt-0.5 text-ink-soft">{t.rich(`steps.${k}`, { b })}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-12 grid gap-4 sm:grid-cols-2">
        <Card>
          <div className="flex items-center gap-2 text-ink">
            <Lock size={18} />
            <h3 className="font-medium">{t("readsTitle")}</h3>
          </div>
          <p className="mt-2 text-sm text-ink-soft">{t.rich("readsBody", { b })}</p>
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-ink">
            <Shield size={18} />
            <h3 className="font-medium">{t("whyTitle")}</h3>
          </div>
          <p className="mt-2 text-sm text-ink-soft">{t("whyBody")}</p>
        </Card>
      </section>
      <p className="mt-4 text-sm text-ink-soft">{t.rich("privacyLink", { link: privacyLink })}</p>

      <section className="mt-12">
        <h2 className="text-h3 font-semibold text-ink">{t("troubleTitle")}</h2>
        {/* Question and answer, each marked, so the page reads as a Q&A rather
            than a wall of paragraphs (Session 98). */}
        <dl className="mt-5 space-y-3 text-sm">
          {(["connect", "noChart", "market"] as const).map((k) => [t(`trouble.${k}Q`), t(`trouble.${k}A`)]).map(([q, a]) => (
            <div key={q} className="rounded-2xl border border-line bg-white px-5 py-4">
              <dt className="flex items-start gap-3">
                <span aria-hidden className="mt-px flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-ink text-[11px] font-semibold text-paper">{t("qMark")}</span>
                <span className="pt-0.5 font-semibold leading-snug text-ink">{q}</span>
              </dt>
              <dd className="mt-2.5 flex items-start gap-3">
                <span aria-hidden className="mt-px flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-line text-[11px] font-semibold text-ink-soft">{t("aMark")}</span>
                <span className="pt-0.5 leading-relaxed text-ink-soft">{a}</span>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <p className="mt-10 text-sm text-ink-faint">{t.rich("manualLink", { link: manualLink })}</p>
    </Page>
  );
}
