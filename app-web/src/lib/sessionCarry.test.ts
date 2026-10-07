// The move to www.fitpassport.fit (Session 92): which requests at the old address
// move and how, the one-minute pass that carries a session across, and which
// account the new address keeps. The routes are thin over these; the whole flow ran
// end to end in a browser on two local hosts before it shipped (DEVLOG Session 92).

import { afterEach, describe, expect, it, vi } from "vitest";
import { CARRY_TTL_MS, decodeCarryPass, decodeSession, encodeCarryPass, encodeSession } from "./auth";
import { isCarryState, receiveDecision, safeNext } from "./sessionCarry";
import { LEGACY_ORIGIN, SITE_ORIGIN, isLegacyHost, isSiteHost, legacyMove } from "./site";

const CHROME = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36";
const GOOGLEBOT = "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Googlebot/2.1; +http://www.google.com/bot.html) Chrome/129.0.0.0 Safari/537.36";
const page = { host: "fit-passport.vercel.app", method: "GET", path: "/closet?tab=saved", userAgent: CHROME, fetchMode: "navigate", accept: "text/html" };

describe("the two addresses", () => {
  afterEach(() => { vi.unstubAllEnvs(); });

  it("are the new www address and the old vercel.app one", () => {
    expect(SITE_ORIGIN).toBe("https://www.fitpassport.fit");
    expect(LEGACY_ORIGIN).toBe("https://fit-passport.vercel.app");
    expect(isSiteHost("www.fitpassport.fit")).toBe(true);
    expect(isSiteHost("WWW.FitPassport.fit")).toBe(true);
    expect(isLegacyHost("fit-passport.vercel.app")).toBe(true);
  });

  it("leave every other host alone: previews, localhost, the bare domain", () => {
    for (const host of ["fit-passport-git-main-kpew.vercel.app", "localhost:3000", "fitpassport.fit", null]) {
      expect(isSiteHost(host)).toBe(false);
      expect(isLegacyHost(host)).toBe(false);
      expect(legacyMove({ ...page, host })).toBeNull();
    }
  });

  it("can be pointed at two local hosts for a test run", () => {
    vi.stubEnv("FP_SITE_ORIGIN", "http://localhost:3000");
    vi.stubEnv("FP_LEGACY_ORIGIN", "http://127.0.0.1:3000");
    expect(isSiteHost("localhost:3000")).toBe(true);
    expect(legacyMove({ ...page, host: "127.0.0.1:3000" })).toEqual({
      kind: "carry",
      location: "http://localhost:3000/api/session/carry?next=%2Fcloset%3Ftab%3Dsaved",
    });
  });
});

describe("the old address", () => {
  it("sends a person opening a page through the hand-over, with the page they asked for", () => {
    expect(legacyMove(page)).toEqual({
      kind: "carry",
      location: "https://www.fitpassport.fit/api/session/carry?next=%2Fcloset%3Ftab%3Dsaved",
    });
  });

  it("sends crawlers straight to the same page, permanently — Search Console's change of address needs it", () => {
    expect(legacyMove({ ...page, userAgent: GOOGLEBOT })).toEqual({ kind: "permanent", location: "https://www.fitpassport.fit/closet?tab=saved" });
    expect(legacyMove({ ...page, path: "/", userAgent: "Slackbot-LinkExpanding 1.0", fetchMode: null })).toEqual({ kind: "permanent", location: "https://www.fitpassport.fit/" });
  });

  it("moves what is not a page view straight across: pictures, the app's own data fetches", () => {
    expect(legacyMove({ ...page, path: "/brand/mark.svg", fetchMode: "no-cors", accept: "image/*" })?.kind).toBe("permanent");
    expect(legacyMove({ ...page, fetchMode: "cors", accept: "*/*" })?.kind).toBe("permanent");
    // A browser that sends no Sec-Fetch-Mode: a page is what asks for HTML.
    expect(legacyMove({ ...page, fetchMode: null, accept: "text/html,application/xhtml+xml" })?.kind).toBe("carry");
    expect(legacyMove({ ...page, fetchMode: null, accept: null })?.kind).toBe("permanent");
  });

  it("serves anything but GET and HEAD where it is", () => {
    expect(legacyMove({ ...page, method: "HEAD" })?.kind).toBe("carry");
    for (const method of ["POST", "PUT", "PATCH", "DELETE"]) expect(legacyMove({ ...page, method })).toBeNull();
  });
});

describe("where the hand-over lands", () => {
  it("keeps a path on this site", () => {
    expect(safeNext("/closet")).toBe("/closet");
    expect(safeNext("/check?product=abc&x=1")).toBe("/check?product=abc&x=1");
    expect(safeNext("/reset?token=t0k3n")).toBe("/reset?token=t0k3n");
  });

  it("never goes to another site", () => {
    for (const raw of ["//evil.example/x", "/\\evil.example", "https://evil.example/", "javascript:alert(1)", "evil.example", "", null, undefined]) {
      expect(safeNext(raw), String(raw)).toBe("/");
    }
  });
});

describe("the one-minute pass", () => {
  const session = { userId: "u_old", canEdit: true };
  const state = "a".repeat(43);
  const now = 1_790_000_000_000;

  it("carries the session to the browser that asked for it", () => {
    expect(decodeCarryPass(encodeCarryPass(session, state, now), state, now + 5_000)).toEqual(session);
  });

  it("is dead after a minute", () => {
    const pass = encodeCarryPass(session, state, now);
    expect(decodeCarryPass(pass, state, now + CARRY_TTL_MS)).toEqual(session);
    expect(decodeCarryPass(pass, state, now + CARRY_TTL_MS + 1)).toBeNull();
    expect(CARRY_TTL_MS).toBeLessThanOrEqual(60_000);
  });

  it("is useless in another browser: someone else's link cannot sign you into their account", () => {
    expect(decodeCarryPass(encodeCarryPass(session, state, now), "b".repeat(43), now)).toBeNull();
    expect(decodeCarryPass(encodeCarryPass(session, state, now), null, now)).toBeNull();
  });

  it("cannot be forged or edited", () => {
    const pass = encodeCarryPass(session, state, now);
    const [body, sig] = pass.split(".");
    const edited = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(body, "base64url").toString()), userId: "u_someone" })).toString("base64url");
    expect(decodeCarryPass(`${edited}.${sig}`, state, now)).toBeNull();
    expect(decodeCarryPass(`${body}.x${sig.slice(1)}`, state, now)).toBeNull();
    expect(decodeCarryPass("garbage", state, now)).toBeNull();
  });

  it("is never a session cookie, and a session cookie is never a pass", () => {
    expect(decodeSession(encodeCarryPass(session, state, now))).toBeNull();
    expect(decodeCarryPass(encodeSession(session), state, now)).toBeNull();
  });

  it("is checked against the state the new address made: 32 random bytes", () => {
    expect(isCarryState(Buffer.alloc(32, 7).toString("base64url"))).toBe(true);
    expect(isCarryState("short")).toBe(false);
    expect(isCarryState(null)).toBe(false);
  });
});

describe("which account the new address keeps", () => {
  const old = { userId: "u_old", canEdit: true };

  it("takes the carried one when there is none here, or only an empty one", () => {
    expect(receiveDecision(old, null, false)).toBe("adopt");
    expect(receiveDecision(old, { userId: "u_fresh", canEdit: true }, false)).toBe("adopt");
  });

  it("never replaces an account already in use here", () => {
    expect(receiveDecision(old, { userId: "u_new", canEdit: true }, true)).toBe("keep");
    expect(receiveDecision(old, old, true)).toBe("keep");
  });
});
