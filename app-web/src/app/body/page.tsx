// /body — my 3D body (Session 98, phase 3). See BodyStudio for what it shows.
import type { Metadata } from "next";
import { getT } from "@/i18n/server";
import { BodyStudio } from "./BodyStudio";

export function generateMetadata(): Metadata {
  return { title: getT("body3d")("metaTitle"), robots: { index: false, follow: true } };
}

export default function Page() {
  return <BodyStudio />;
}
