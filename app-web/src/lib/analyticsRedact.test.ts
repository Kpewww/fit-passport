// What Vercel Web Analytics may count (Session 86): never an account code (the
// read capability for a closet) and never a query string (reset tokens, pasted
// product links).
import { describe, expect, it } from "vitest";
import { redactUrl } from "@/components/SiteAnalytics";

describe("redactUrl", () => {
  it("replaces an account code with a placeholder", () => {
    expect(redactUrl("https://fit-passport.vercel.app/u/k7Qx9mP2vR4tL8wZ")).toBe("https://fit-passport.vercel.app/u/[code]");
    expect(redactUrl("https://fit-passport.vercel.app/u/k7Qx9mP2vR4tL8wZ/outfits")).toBe("https://fit-passport.vercel.app/u/[code]/outfits");
  });

  it("drops every query string and fragment", () => {
    expect(redactUrl("https://fit-passport.vercel.app/reset?token=abc123secret")).toBe("https://fit-passport.vercel.app/reset");
    expect(redactUrl("https://fit-passport.vercel.app/check?url=https%3A%2F%2Fshop.test%2Fp%2F1#top")).toBe("https://fit-passport.vercel.app/check");
  });

  it("leaves ordinary pages as they are", () => {
    expect(redactUrl("https://fit-passport.vercel.app/closet")).toBe("https://fit-passport.vercel.app/closet");
    expect(redactUrl("https://fit-passport.vercel.app/")).toBe("https://fit-passport.vercel.app/");
  });
});
