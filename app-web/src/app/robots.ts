// robots.txt — what search engines may crawl (Session 91). Public pages only: the
// API, admin, and anything tied to one person's account stay out of search results.
import type { MetadataRoute } from "next";
import { SITE_ORIGIN as SITE } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin", "/account", "/closet", "/passport", "/saved", "/history", "/refresh", "/onboarding", "/u/", "/login", "/recover", "/reset", "/brand/", "/extension/welcome"],
    },
    sitemap: `${SITE}/sitemap.xml`,
  };
}
