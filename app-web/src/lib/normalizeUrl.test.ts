import { describe, expect, it } from "vitest";
import { normalizeUrl } from "./normalizeUrl";

describe("normalizeUrl", () => {
  it("accepts a bare domain with a path + query (the reported failure)", () => {
    expect(
      normalizeUrl("patagonia.com/product/womens-fitz-roy-down-hoody/85506.html?dwvar_85506_color=SMTB"),
    ).toBe(
      "https://patagonia.com/product/womens-fitz-roy-down-hoody/85506.html?dwvar_85506_color=SMTB",
    );
  });

  it("leaves a full URL intact", () => {
    expect(normalizeUrl("https://www.zara.com/us/en/x-p123.html")).toBe(
      "https://www.zara.com/us/en/x-p123.html",
    );
  });

  it("keeps http as-is and adds https only when there's no scheme", () => {
    expect(normalizeUrl("http://example.com/a")).toBe("http://example.com/a");
    expect(normalizeUrl("www.example.com/a")).toBe("https://www.example.com/a");
  });

  it("trims whitespace and stray wrapping characters", () => {
    expect(normalizeUrl("  <https://example.com/a>  ")).toBe("https://example.com/a");
    expect(normalizeUrl('"example.com/a"')).toBe("https://example.com/a");
  });

  it("rejects things that aren't links", () => {
    expect(normalizeUrl("")).toBeNull();
    expect(normalizeUrl("   ")).toBeNull();
    expect(normalizeUrl("just some words")).toBeNull();
    expect(normalizeUrl("localhost/no-dot")).toBeNull();
    expect(normalizeUrl("javascript:alert(1)")).toBeNull();
  });
});
