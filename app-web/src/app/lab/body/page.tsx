// /lab/body — the dress form beside the realistic body (Anny), for the founder's
// review before Anny may join /check (Session 97, Track 2, the ship gate).
// Not linked from anywhere, kept out of search (robots.ts and noindex).
import type { Metadata } from "next";
import { BodyLab } from "./BodyLab";

export const metadata: Metadata = { title: "Body lab", robots: { index: false, follow: false } };

export default function Page() {
  return <BodyLab />;
}
