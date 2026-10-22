// /extension/welcome — what the extension opens on first install (background.js,
// Session 85).
//
// Opening this page is itself what connects the extension: the middleware mints
// the Fit Passport session on any visit, and the popup's checks carry that
// session. So the page can say "you're connected" truthfully without asking the
// visitor to do anything. It then shows how to pin the icon and how to try it.
//
// Server component; its only script is the mark's quick reveal. Not for search engines.

import type { Metadata } from "next";
import { Card, LinkButton, Page, PageHeader } from "@/components/ui";
import { Info, Pin, Ruler } from "@/components/Icon";
import Link from "next/link";
import { getT } from "@/i18n/server";
import { AnimatedFitPassportLogoLazy } from "@/components/AnimatedFitPassportLogoLazy";

export async function generateMetadata(): Promise<Metadata> {
  const t = (await getT("extension"));
  return { title: t("welcome.metaTitle"), robots: { index: false } };
}

export default async function ExtensionWelcomePage() {
  const t = (await getT("extension"));
  return (
    <Page width="read">
      {/* The quick reveal: the first thing a new install sees (Session 89). */}
      <AnimatedFitPassportLogoLazy variant="quick" size={56} className="mb-6 text-ink" />
      <PageHeader eyebrow={t("welcome.eyebrow")} title={t("welcome.title")} />

      {/* Not "you're connected": the site cannot see whether the extension's requests
          will carry the session (blocked third-party cookies stop them) — the popup
          finds out on the first check. Said plainly, with where to look (Session 100e). */}
      <div className="mt-8 flex items-start gap-3 rounded-2xl bg-paper-soft px-5 py-4 text-sm text-ink-soft ring-1 ring-line">
        <Info size={20} className="mt-px flex-shrink-0 text-ink-faint" />
        <p>{t("welcome.connected")} <Link href="/help#check-failed" className="font-medium text-brand hover:underline">{t("welcome.helpLink")}</Link></p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Card>
          <div className="flex items-center gap-2 text-ink">
            <Pin size={18} />
            <h2 className="font-medium">{t("welcome.pinTitle")}</h2>
          </div>
          <p className="mt-2 text-sm text-ink-soft">{t("welcome.pinBody")}</p>
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-ink">
            <Ruler size={18} />
            <h2 className="font-medium">{t("welcome.tryTitle")}</h2>
          </div>
          <p className="mt-2 text-sm text-ink-soft">{t("welcome.tryBody")}</p>
          <p className="mt-2 text-sm text-ink-faint">{t("welcome.chartTip")}</p>
        </Card>
      </div>

      <Card className="mt-4">
        <h2 className="font-medium text-ink">{t("welcome.passportTitle")}</h2>
        <p className="mt-2 text-sm text-ink-soft">{t("welcome.passportBody")}</p>
        <div className="mt-4">
          <LinkButton href="/passport" arrow>{t("welcome.passportCta")}</LinkButton>
        </div>
      </Card>
    </Page>
  );
}
