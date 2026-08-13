import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { ClaimNudge } from "@/components/ClaimNudge";
import { Footer } from "@/components/Footer";
import { BackToTop } from "@/components/BackToTop";

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

export const metadata: Metadata = {
  title: "Fit Passport",
  description:
    "One body. One fit identity. Any store. A consumer-owned fit layer for apparel.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      {/* overflow-x-clip: oversized display type / parallax words must never
          make the page scrollable sideways. */}
      <body className={`${inter.variable} ${fraunces.variable} font-sans min-h-full flex flex-col overflow-x-clip bg-paper text-ink antialiased`}>
        <Nav />
        {children}
        <Footer />
        <ClaimNudge />
        <BackToTop />
      </body>
    </html>
  );
}
