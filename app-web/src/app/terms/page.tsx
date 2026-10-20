"use client";

// Terms — plain-language terms of use (Session 100: the site had none, and a pilot with
// people outside the team needs them). Written by the team for a student prototype and
// NOT reviewed by a lawyer; every promise in it is one the product keeps (the privacy
// page has the detail of what is kept and sent).

import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { CONTACT_EMAIL } from "@/lib/siteContact";
import { useT } from "@/i18n/client";

const SECTIONS = ["what", "estimate", "account", "community", "use", "stores", "warranty", "changes"] as const;

export default function TermsPage() {
  const t = useT("terms");
  return (
    <main className="flex-1">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <PageHeader title={t("title")} lede={t("lede")} />
        <p className="mt-2 text-xs text-ink-faint">{t("updated")}</p>
        {SECTIONS.map((k) => (
          <section key={k} className="mt-10">
            <h2 className="text-h3 font-semibold text-ink">{t(`${k}.title`)}</h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">{t(`${k}.body`)}</p>
          </section>
        ))}
        <section className="mt-10">
          <h2 className="text-h3 font-semibold text-ink">{t("contact.title")}</h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            {t("contact.body")}{" "}
            {CONTACT_EMAIL && <a href={`mailto:${CONTACT_EMAIL}`} className="text-brand underline underline-offset-4">{CONTACT_EMAIL}</a>}
            {" · "}
            <Link href="/privacy" className="text-brand underline underline-offset-4">{t("contact.privacy")}</Link>
          </p>
        </section>
      </div>
    </main>
  );
}
