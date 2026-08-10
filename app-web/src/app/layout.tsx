import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/Nav";

const inter = Inter({ subsets: ["latin"] });

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
      <body className={`${inter.className} min-h-full flex flex-col bg-neutral-50 text-neutral-900`}>
        <Nav />
        {children}
      </body>
    </html>
  );
}
