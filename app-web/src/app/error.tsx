"use client";

// A page that broke (Session 100: there was no error page, so a crash was a blank
// screen and nobody heard of it). Says so plainly, offers to try again, and reports
// the error's message — never more — to /api/event for the pilot.

import { useEffect } from "react";
import { Button, LinkButton } from "@/components/ui";
import { useT } from "@/i18n/client";
import { Headline } from "@/components/Headline";

export default function PageError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useT("errors");
  useEffect(() => {
    fetch("/api/event", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "client-error", detail: `${error.digest ? error.digest + " " : ""}${error.message}`.slice(0, 500), path: location.pathname }),
    }).catch(() => {});
  }, [error]);
  return (
    <main className="flex-1">
      <div className="mx-auto max-w-xl px-4 py-20 text-center sm:px-6">
        <p className="eyebrow text-ink-faint">{t("eyebrow")}</p>
        <h1 className="mt-4 font-serif text-h1 text-ink"><Headline>{t("title")}</Headline></h1>
        <p className="mt-3 text-sm text-ink-soft">{t("body")}</p>
        <div className="mt-6 flex justify-center gap-2">
          <Button onClick={reset}>{t("retry")}</Button>
          <LinkButton href="/" variant="secondary">{t("home")}</LinkButton>
        </div>
      </div>
    </main>
  );
}
