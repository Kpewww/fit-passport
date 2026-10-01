"use client";

// Privacy — what the site and the extension keep, send and never do. Written
// for the Chrome Web Store listing (todo/people/05), which needs a policy page,
// and true of the site already. Every sentence is checkable in the code: the
// extension's capture (browser-extension/README.md, "What is sent"), the session
// cookie (lib/session.ts), the services (rateLimit.ts, email.ts, extractorLLM.ts)
// and deactivation, which keeps the data (api/auth/deactivate).

import { PageHeader } from "@/components/ui";
import { CONTACT_EMAIL } from "@/lib/siteContact";
import { useT } from "@/i18n/client";

const SECTIONS = [
  { key: "keeps", items: ["profile", "closet", "products", "account", "community"] },
  { key: "cookies", items: ["session", "lang", "none"] },
  { key: "extension", items: ["click", "reduced", "ebay", "session", "local"] },
  { key: "others", items: ["private", "never", "services"] },
  { key: "choices", items: ["edit", "deactivate"] },
] as const;

export default function PrivacyPage() {
  const t = useT("privacy");
  return (
    <main className="flex-1">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <PageHeader title={t("title")} lede={t("lede")} />
        <p className="mt-2 text-xs text-ink-faint">{t("updated")}</p>

        {SECTIONS.map((s) => (
          <section key={s.key} className="mt-10">
            <h2 className="text-h3 font-semibold text-ink">{t(`${s.key}.title`)}</h2>
            <ul className="mt-3 space-y-2.5 text-sm leading-relaxed text-ink-soft">
              {s.items.map((item) => (
                <li key={item} className="flex gap-2.5">
                  <span aria-hidden="true" className="mt-[0.6em] h-1 w-1 flex-shrink-0 rounded-full bg-ink-faint" />
                  <span>{t(`${s.key}.${item}` as never)}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <section className="mt-10">
          <h2 className="text-h3 font-semibold text-ink">{t("contact.title")}</h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            {CONTACT_EMAIL ? (
              <>
                {t("contact.body", { email: "" })}
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-brand underline underline-offset-4">{CONTACT_EMAIL}</a>
              </>
            ) : (
              t("contact.pending")
            )}
          </p>
        </section>
      </div>
    </main>
  );
}
