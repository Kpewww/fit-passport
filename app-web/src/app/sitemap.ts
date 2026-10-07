// sitemap.xml — the public pages, for search engines (Session 91). Private pages
// (a closet, a passport, a profile by code) are deliberately not listed.
import type { MetadataRoute } from "next";

const SITE = "https://fit-passport.vercel.app";
const PAGES: Array<[string, number]> = [["/", 1], ["/extension", 0.8], ["/check", 0.7], ["/help", 0.6], ["/community", 0.5], ["/privacy", 0.3]];

export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.map(([path, priority]) => ({ url: `${SITE}${path}`, changeFrequency: "weekly", priority }));
}
