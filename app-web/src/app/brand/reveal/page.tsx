// /brand/reveal — the mark's animated reveal, full screen, for presenting
// (Session 89). Not for search engines. The stage covers the site's own chrome so
// a browser in full-screen mode shows nothing else; scripts/record-logo.mjs records
// it frame by frame into a video for slides.

import type { Metadata } from "next";
import { Suspense } from "react";
import { getT } from "@/i18n/server";
import { RevealStage } from "./RevealStage";

export function generateMetadata(): Metadata {
  const t = getT("brandReveal");
  return { title: t("metaTitle"), robots: { index: false } };
}

export default function BrandRevealPage() {
  return (
    <Suspense>
      <RevealStage />
    </Suspense>
  );
}
