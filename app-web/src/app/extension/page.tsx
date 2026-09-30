// /extension — where the browser extension is offered.
//
// Server component on purpose: nothing here needs the browser, so the page ships
// no JavaScript of its own. Everything that decides WHAT is offered lives in
// `extensionDistribution.ts`; when the Chrome Web Store listing exists, that one
// constant changes and this page swaps its install steps for an "Add to Chrome"
// button without further edits.

import type { Metadata } from "next";
import Link from "next/link";
import { Card, Page, PageHeader } from "@/components/ui";
import { BrowserIcon, Download, Info, Lock, Shield } from "@/components/Icon";
import { EXTENSION_DISTRIBUTION } from "@/lib/extensionDistribution";
import { getT } from "@/i18n/server";

export function generateMetadata(): Metadata {
  const t = getT("extension");
  return { title: t("metaTitle"), description: t("metaDescription") };
}

const dist = EXTENSION_DISTRIBUTION;

const b = (c: string) => <b>{c}</b>;
const code = (c: string) => <code className="rounded bg-paper-soft px-1.5 py-0.5 text-[0.9em]">{c}</code>;

export default function ExtensionPage() {
  const t = getT("extension");
  return (
    <Page width="read">
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        lede={t("lede")}
      />

      {/* The one thing this page is for. */}
      <Card className="mt-10">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="mt-0.5 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-ink text-paper">
              <BrowserIcon size={22} />
            </span>
            <div>
              <p className="font-medium text-ink">{t("cardName")}</p>
              <p className="mt-0.5 text-sm text-ink-soft">
                {dist.kind === "zip"
                  ? t("versionZip", { version: dist.version, size: dist.sizeKb })
                  : t("versionStore", { version: dist.version })}
              </p>
            </div>
          </div>
          {dist.kind === "zip" ? (
            <a
              href={dist.href}
              download
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-ink px-6 text-sm font-medium text-paper transition-colors hover:bg-ink/85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              <Download size={18} /> {t("download")}
            </a>
          ) : (
            <a
              href={dist.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-ink px-6 text-sm font-medium text-paper transition-colors hover:bg-ink/85"
            >
              <BrowserIcon size={18} /> {t("addToChrome")}
            </a>
          )}
        </div>
        {dist.kind === "zip" && (
          <p className="mt-5 flex gap-2 border-t border-line pt-4 text-sm text-ink-soft">
            <Info size={18} className="mt-0.5 flex-shrink-0 text-ink-faint" />
            <span>{t("notInStore")}</span>
          </p>
        )}
      </Card>

      {dist.kind === "zip" && (
        <section className="mt-12">
          <h2 className="text-h3 font-semibold text-ink">{t("installTitle")}</h2>
          <ol className="mt-5 space-y-4">
            {[
              t.rich("install.unzip", { b }),
              t.rich("install.devMode", { b, code }),
              t.rich("install.load", { b }),
              t.rich("install.connect", {
                link: (c) => <Link href="/" className="underline underline-offset-2 hover:text-ink">{c}</Link>,
              }),
            ].map((step, i) => (
              <li key={i} className="flex gap-4">
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-line text-sm tabular-nums text-ink-soft">
                  {i + 1}
                </span>
                <p className="pt-0.5 text-ink-soft">{step}</p>
              </li>
            ))}
          </ol>
          <p className="mt-5 text-sm text-ink-faint">{t("pinTip")}</p>
        </section>
      )}

      <section className="mt-12">
        <h2 className="text-h3 font-semibold text-ink">{t("usingTitle")}</h2>
        <div className="mt-4 space-y-3 text-ink-soft">
          <p>{t.rich("using1", { b })}</p>
          <p>{t.rich("using2", { b })}</p>
        </div>
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

      <section className="mt-12">
        <h2 className="text-h3 font-semibold text-ink">{t("troubleTitle")}</h2>
        <dl className="mt-4 divide-y divide-line border-y border-line text-sm">
          {(["connect", "noChart", "market", "devMode"] as const).map((k) => [t(`trouble.${k}Q`), t(`trouble.${k}A`)]).map(([q, a]) => (
            <div key={q} className="py-4">
              <dt className="font-medium text-ink">{q}</dt>
              <dd className="mt-1 text-ink-soft">{a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </Page>
  );
}
