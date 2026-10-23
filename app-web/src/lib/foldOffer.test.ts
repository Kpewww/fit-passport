import { describe, expect, it } from "vitest";
import { decodeFoldOffer, decodeSession, encodeFoldOffer, encodeSession, FOLD_OFFER_TTL_MS } from "./auth";

describe("login's offer to bring this browser's things over (Session 100)", () => {
  it("reads back what it signed, until it expires", () => {
    const now = 1_000_000;
    const raw = encodeFoldOffer("anon", "claimed", now);
    expect(decodeFoldOffer(raw, now + 1000)).toEqual({ fold: "anon", keep: "claimed", exp: now + FOLD_OFFER_TTL_MS });
    expect(decodeFoldOffer(raw, now + FOLD_OFFER_TTL_MS + 1)).toBeNull();
  });

  it("refuses a forged or altered offer", () => {
    const raw = encodeFoldOffer("anon", "claimed");
    const [body, sig] = raw.split(".");
    const other = Buffer.from(JSON.stringify({ fold: "someone-else", keep: "claimed", exp: Date.now() + 60_000 })).toString("base64url");
    expect(decodeFoldOffer(`${other}.${sig}`)).toBeNull();
    // Change the first character to one it is not, so the signature always differs
    // (replacing it with a fixed "x" was a no-op whenever the signature began with x).
    const flipped = (sig[0] === "x" ? "y" : "x") + sig.slice(1);
    expect(decodeFoldOffer(`${body}.${flipped}`)).toBeNull();
    expect(decodeFoldOffer("nonsense")).toBeNull();
  });

  it("is never a session, and a session is never an offer", () => {
    const offer = encodeFoldOffer("anon", "claimed");
    expect(decodeSession(offer)).toBeNull();
    expect(decodeFoldOffer(encodeSession({ userId: "claimed", canEdit: true }))).toBeNull();
  });
});
