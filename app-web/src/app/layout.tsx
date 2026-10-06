import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { ClaimNudge } from "@/components/ClaimNudge";
import { Footer } from "@/components/Footer";
import { BackToTop } from "@/components/BackToTop";
import { I18nProvider } from "@/i18n/client";
import { htmlLang } from "@/i18n/config";
import { getLocale, messagesFor } from "@/i18n/server";
import { SiteAnalytics } from "@/components/SiteAnalytics";

// Fonts are SELF-HOSTED (see src/app/fonts/LICENSE.md — both are OFL 1.1).
// `next/font/google` downloads at BUILD time, so a deploy fails whenever Google
// Fonts is unreachable — which happened twice on a network with no usable IPv6
// route. Bundling the latin variable subsets removes that dependency from the
// build path, and the files are ~120KB and ~73KB.

// Clean sans for UI/body…
const inter = localFont({
  src: "./fonts/Inter.woff2",
  weight: "100 900", // variable
  style: "normal",
  variable: "--font-sans",
  display: "swap",
});
// …paired with a characterful editorial serif for display headings.
const fraunces = localFont({
  src: "./fonts/Fraunces.woff2",
  weight: "100 900", // variable
  style: "normal",
  variable: "--font-serif",
  display: "swap",
});

export function generateMetadata(): Metadata {
  const { meta } = messagesFor(getLocale());
  return { title: meta.title, description: meta.description };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The language is decided once, here, and handed down: server components ask
  // getT(), client components useT() — and only this language's messages ship.
  const locale = getLocale();
  return (
    <html lang={htmlLang(locale)} className="h-full">
      {/* overflow-x-clip: oversized display type / parallax words must never
          make the page scrollable sideways. */}
      <body className={`${inter.variable} ${fraunces.variable} font-sans min-h-full flex flex-col overflow-x-clip bg-paper text-ink antialiased`}>
        <I18nProvider locale={locale} messages={messagesFor(locale)}>
          <Nav />
          {children}
          <Footer />
          <ClaimNudge />
          <BackToTop />
        </I18nProvider>
        {/* Vercel Web Analytics (page views, cookieless, nothing visible), with secrets
            redacted from URLs first — see SiteAnalytics.tsx. */}
        <SiteAnalytics />
      </body>
    </html>
  );
}
