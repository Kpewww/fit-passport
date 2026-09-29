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

export const metadata: Metadata = {
  title: "Browser extension · Fit Passport",
  description: "Check your size on the product page you're already looking at.",
};

const dist = EXTENSION_DISTRIBUTION;

export default function ExtensionPage() {
  return (
    <Page width="read">
      <PageHeader
        eyebrow="Browser extension"
        title="Check your size on the page you're already on"
        lede="Open any product page, click Fit Passport, and get the size — with the reasons and where every number came from."
      />

      {/* The one thing this page is for. */}
      <Card className="mt-10">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="mt-0.5 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-ink text-paper">
              <BrowserIcon size={22} />
            </span>
            <div>
              <p className="font-medium text-ink">Fit Passport for Chrome</p>
              <p className="mt-0.5 text-sm text-ink-soft">
                Version {dist.version}
                {dist.kind === "zip" ? ` · ${dist.sizeKb} KB · free` : " · free"}
              </p>
            </div>
          </div>
          {dist.kind === "zip" ? (
            <a
              href={dist.href}
              download
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-ink px-6 text-sm font-medium text-paper transition-colors hover:bg-ink/85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              <Download size={18} /> Download the extension
            </a>
          ) : (
            <a
              href={dist.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-ink px-6 text-sm font-medium text-paper transition-colors hover:bg-ink/85"
            >
              <BrowserIcon size={18} /> Add to Chrome
            </a>
          )}
        </div>
        {dist.kind === "zip" && (
          <p className="mt-5 flex gap-2 border-t border-line pt-4 text-sm text-ink-soft">
            <Info size={18} className="mt-0.5 flex-shrink-0 text-ink-faint" />
            <span>
              It isn&rsquo;t in the Chrome Web Store yet, so for now you add it yourself — four
              steps, about a minute. It&rsquo;s the same extension either way. Tested in Chrome;
              other Chromium browsers (Edge, Brave, Arc) accept the same steps, but we
              haven&rsquo;t tested them.
            </span>
          </p>
        )}
      </Card>

      {dist.kind === "zip" && (
        <section className="mt-12">
          <h2 className="text-h3 font-semibold text-ink">Install it</h2>
          <ol className="mt-5 space-y-4">
            {[
              <>Download the file above and <b>unzip it</b>. Keep the folder somewhere it
                won&rsquo;t be deleted — Chrome loads the extension from it.</>,
              <>In Chrome, go to <code className="rounded bg-paper-soft px-1.5 py-0.5 text-[0.9em]">chrome://extensions</code> and
                turn on <b>Developer mode</b> (top right).</>,
              <>Click <b>Load unpacked</b> and choose the folder you unzipped.</>,
              <>Open <Link href="/" className="underline underline-offset-2 hover:text-ink">Fit Passport</Link> once
                in the same browser. That connects the extension to your passport — without it,
                the extension will ask you to connect first rather than check against an empty
                profile.</>,
            ].map((step, i) => (
              <li key={i} className="flex gap-4">
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-line text-sm tabular-nums text-ink-soft">
                  {i + 1}
                </span>
                <p className="pt-0.5 text-ink-soft">{step}</p>
              </li>
            ))}
          </ol>
          <p className="mt-5 text-sm text-ink-faint">
            Tip: click the puzzle-piece icon in Chrome&rsquo;s toolbar and pin Fit Passport, so
            it&rsquo;s one click away.
          </p>
        </section>
      )}

      <section className="mt-12">
        <h2 className="text-h3 font-semibold text-ink">Using it</h2>
        <div className="mt-4 space-y-3 text-ink-soft">
          <p>
            Open a product page and click the Fit Passport icon. You&rsquo;ll see what it found on
            the page before anything is sent; press <b>Check my size</b> to get the answer.
          </p>
          <p>
            Many stores only load their size chart when you open their &ldquo;Size guide&rdquo;. If
            the extension says it found no chart, open the size guide on the page, then press{" "}
            <b>Re-scan</b>. It never clicks anything on the page for you.
          </p>
        </div>
      </section>

      <section className="mt-12 grid gap-4 sm:grid-cols-2">
        <Card>
          <div className="flex items-center gap-2 text-ink">
            <Lock size={18} />
            <h3 className="font-medium">What it reads</h3>
          </div>
          <p className="mt-2 text-sm text-ink-soft">
            Only the page you click it on, only when you click. It builds a small copy of the
            product parts — name, size chart, size options — and leaves everything else behind:
            your cart, your account, your address, forms. On a real product page that&rsquo;s{" "}
            <b>11 KB out of 1.78 MB</b>.
          </p>
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-ink">
            <Shield size={18} />
            <h3 className="font-medium">Why an extension</h3>
          </div>
          <p className="mt-2 text-sm text-ink-soft">
            Many large stores block our servers from reading their pages — pasting a link works on
            some stores and not others. The extension reads the page in your own browser instead,
            the page you&rsquo;re already looking at, so it works where a link can&rsquo;t.
          </p>
        </Card>
      </section>

      <section className="mt-12">
        <h2 className="text-h3 font-semibold text-ink">If something goes wrong</h2>
        <dl className="mt-4 divide-y divide-line border-y border-line text-sm">
          {[
            [
              "It says “connect Fit Passport first”.",
              "Open Fit Passport once in this browser, then try again. If you block third-party cookies, the extension can't see that you're signed in — it asks you to connect rather than quietly checking against an empty profile.",
            ],
            [
              "It found no size chart.",
              "Open the store's size guide on the page, then press Re-scan. Some stores keep the chart on a separate page; for brands we've curated, Fit Passport falls back to the brand's published chart and says so.",
            ],
            [
              "Chrome mentions a developer-mode extension.",
              "That can happen with extensions added this way. It goes away once Fit Passport is in the Chrome Web Store.",
            ],
          ].map(([q, a]) => (
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
