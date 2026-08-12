import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { ClaimNudge } from "@/components/ClaimNudge";
import { Footer } from "@/components/Footer";
import { BackToTop } from "@/components/BackToTop";

// Clean sans for UI/body…
const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
// …paired with a characterful editorial serif for display headings.
const fraunces = Fraunces({
  subsets: ["latin"],
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
