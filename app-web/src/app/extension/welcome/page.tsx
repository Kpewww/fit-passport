// /extension/welcome — what the extension opens on first install (background.js,
// Session 85).
//
// Opening this page is itself what connects the extension: the middleware mints
// the Fit Passport session on any visit, and the popup's checks carry that
// session. So the page can say "you're connected" truthfully without asking the
// visitor to do anything. It then shows how to pin the icon and how to try it.
//
// Server component, no JavaScript of its own; not for search engines.

import type { Metadata } from "next";
import { Card, LinkButton, Page, PageHeader } from "@/components/ui";
import { CheckCircle, Pin, Ruler } from "@/components/Icon";
import { getT } from "@/i18n/server";

export function generateMetadata(): Metadata {
  const t = getT("extension");
  return { title: t("welcome.metaTitle"), robots: { index: false } };
}

export default function ExtensionWelcomePage() {
  const t = getT("extension");
  return (
    <Page width="read">
      <PageHeader eyebrow={t("welcome.eyebrow")} title={t("welcome.title")} />

      <div className="mt-8 flex items-start gap-3 rounded-2xl bg-ok-tint px-5 py-4 text-sm text-ok">
        <CheckCircle size={20} className="mt-px flex-shrink-0" />
        <p>{t("welcome.connected")}</p>
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
