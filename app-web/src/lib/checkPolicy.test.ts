// The decisions a size check makes around the engine: when to refuse, how far to
// trust each source, and whether an extension request may run without a session.
// Pure functions, plus a few end-to-end cases through the REAL extractor, because
// the gap these close was exactly a test that checked the extractor's label while
// the route did something else.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  applyProvenanceCap,
  isExtensionRequest,
  refusalFor,
  sessionGate,
  sourceFromRawJson,
} from "./checkPolicy";
import { extractSmart, __clearPageCache } from "./extractorLLM";
import type { ExtractedProduct } from "./extractor";
import type { EngineOutput, SizeScore } from "./fitEngine";

function product(
  source: Partial<ExtractedProduct["source"]>,
  category = "tshirt",
): ExtractedProduct {
  return {
    retailer: "Shop",
    brand: "Shop",
    productName: "Tee",
    category,
    sizes: [
      { label: "S", chestCm: 96 },
      { label: "M", chestCm: 100 },
    ],
    source: { url: "https://shop.test/p/tee", host: "shop.test", derived: true, ...source },
  };
}

describe("refusalFor — the existing refusals, unchanged by the move", () => {
  it("refuses a page our fetch never got, when the sizes are estimated (㊼)", () => {
    expect(refusalFor(product({ fetch: "blocked", sizesFrom: "estimated" }))?.error).toBe("unreadable");
    expect(refusalFor(product({ fetch: "unreachable", sizesFrom: "estimated" }))?.error).toBe("unreadable");
  });

  it("refuses when nothing identified a garment (⑪)", () => {
    const r = refusalFor(product({ fetch: "ok", sizesFrom: "estimated", categoryGuessed: true }));
    expect(r?.error).toBe("not-apparel");
  });

  it("refuses a category the engine cannot measure anyone against (㉜), naming it", () => {
    const r = refusalFor(product({ fetch: "ok", sizesFrom: "page" }, "sneakers"));
    expect(r?.error).toBe("unsupported-category");
    expect(r?.category).toBe("sneakers");
  });

  it("lets a read page with a real chart through", () => {
    expect(refusalFor(product({ fetch: "ok", sizesFrom: "page" }))).toBeNull();
  });
});

describe("refusalFor — an invented ladder on a page the browser handed us", () => {
  it("refuses: the extension sent a page with no chart and the sizes are synthesized", () => {
    const r = refusalFor(product({ fetch: "extension", sizesFrom: "estimated", sizesSynthesized: true }));
    expect(r?.error).toBe("no-chart-on-page");
    // A refusal is the product working, so it has to say what to do next.
    expect(r?.message).toMatch(/size guide/i);
  });

  it("lets the page's own offered labels through — a closet anchor can rank real labels", () => {
    // Labels with no measurements are still `estimated`, but nothing was invented.
    expect(refusalFor(product({ fetch: "extension", sizesFrom: "estimated" }))).toBeNull();
  });

  it("lets a curated brand chart through — those numbers are the brand's", () => {
    expect(refusalFor(product({ fetch: "extension", sizesFrom: "brand-chart" }))).toBeNull();
  });

  it("does not yet change the URL path: a readable page with no chart is a separate decision", () => {
    // Recorded as an open decision for the founder (retiring BRAND_TABLE). This
    // test pins today's scope so widening it is a deliberate change.
    expect(refusalFor(product({ fetch: "ok", sizesFrom: "estimated", sizesSynthesized: true }))).toBeNull();
  });

  it("gives the more fundamental answer when several apply", () => {
    expect(
      refusalFor(product({ fetch: "extension", sizesFrom: "estimated", sizesSynthesized: true }, "sneakers"))?.error,
    ).toBe("unsupported-category");
    expect(
      refusalFor(product({ fetch: "extension", sizesFrom: "estimated", sizesSynthesized: true, categoryGuessed: true }))?.error,
    ).toBe("not-apparel");
  });
});

// End to end through the real extractor, network off. The old test asserted only
// what the extractor labelled; these assert what the route will actually do.
describe("refusalFor — through the real extractor (extension transport)", () => {
  let savedKey: string | undefined;
  beforeEach(() => {
    __clearPageCache();
    savedKey = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("network is off"); }));
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    if (savedKey !== undefined) process.env.ANTHROPIC_API_KEY = savedKey;
  });

  const prose = `<p>${"A soft everyday shirt in brushed cotton. ".repeat(12)}</p>`;

  it("a supplied page with no chart is refused, not scored against an invented ladder", async () => {
    const out = await extractSmart("https://shop.test/p/mens-linen-shirt-p1", {
      html: `<html><body><h1>Linen Shirt</h1>${prose}</body></html>`,
    });
    expect(out.source.sizesSynthesized).toBe(true);
    expect(refusalFor(out)?.error).toBe("no-chart-on-page");
  });

  it("a supplied page listing real sizes but no chart goes through", async () => {
    const out = await extractSmart("https://shop.test/p/mens-linen-shirt-p2", {
      html: `<html><body><h1>Linen Shirt</h1>${prose}
        <select name="size"><option>S</option><option>M</option><option>L</option></select></body></html>`,
    });
    expect(out.source.sizesSynthesized).toBeUndefined();
    expect(refusalFor(out)).toBeNull();
  });

  it("a supplied page with no chart, for a brand we curated, falls back to the brand's numbers", async () => {
    const out = await extractSmart(
      "https://www.patagonia.com/product/mens-insulated-boulder-fork-rain-jacket/85220.html",
      { html: `<html><body><h1>Boulder Fork Rain Jacket</h1>${prose}</body></html>` },
    );
    expect(out.source.sizesFrom).toBe("brand-chart");
    expect(refusalFor(out)).toBeNull();
  });
});

function size(label: string, confidence: number): SizeScore {
  return { label, normalized: null, score: confidence, confidence, reasons: [] };
}

function engineOutput(): EngineOutput {
  const ranked = [size("M", 0.9), size("L", 0.7), size("S", 0.4)];
  return {
    ranked,
    best: ranked[0], // the engine returns ranked[0] by reference
    explanation: "",
    undetermined: false,
    domainNote: null,
    domainRelevance: "empty",
    conflictNote: null,
    stability: null,
  };
}

describe("applyProvenanceCap", () => {
  it("holds estimated sizes at 0.5 and brand-chart sizes at 0.75", () => {
    const est = applyProvenanceCap(engineOutput(), "estimated");
    expect(est.ranked.map((r) => r.confidence)).toEqual([0.5, 0.5, 0.4]);
    expect(est.best.confidence).toBe(0.5);
    const brand = applyProvenanceCap(engineOutput(), "brand-chart");
    expect(brand.ranked.map((r) => r.confidence)).toEqual([0.75, 0.7, 0.4]);
  });

  it("keeps best and ranked[0] as one object, as the engine made them", () => {
    const out = applyProvenanceCap(engineOutput(), "estimated");
    expect(out.best).toBe(out.ranked[0]);
  });

  it("leaves page and fixture provenance, and unknown provenance, untouched", () => {
    for (const from of ["page", "fixture", undefined] as const) {
      const input = engineOutput();
      expect(applyProvenanceCap(input, from)).toBe(input);
    }
  });

  it("does not mutate the engine's output", () => {
    const input = engineOutput();
    applyProvenanceCap(input, "estimated");
    expect(input.ranked.map((r) => r.confidence)).toEqual([0.9, 0.7, 0.4]);
  });
});

describe("sourceFromRawJson — provenance read back from a stored product", () => {
  it("returns the stored source", () => {
    const raw = JSON.stringify(product({ fetch: "extension", sizesFrom: "page" }));
    expect(sourceFromRawJson(raw)?.sizesFrom).toBe("page");
  });

  it("returns null for missing or malformed payloads, so no cap is invented", () => {
    expect(sourceFromRawJson(null)).toBeNull();
    expect(sourceFromRawJson("")).toBeNull();
    expect(sourceFromRawJson("{not json")).toBeNull();
    expect(sourceFromRawJson(JSON.stringify({ brand: "x" }))).toBeNull();
  });
});

describe("the extension's session gate", () => {
  it("recognises the extension by its client header, case-insensitively", () => {
    expect(isExtensionRequest(new Headers({ "x-fp-client": "extension/0.1.0" }))).toBe(true);
    expect(isExtensionRequest(new Headers({ "X-FP-Client": "Extension/0.1.0" }))).toBe(true);
    expect(isExtensionRequest(new Headers({ "x-fp-client": "web" }))).toBe(false);
    expect(isExtensionRequest(new Headers())).toBe(false);
  });

  it("refuses an extension request with no session instead of minting an account", () => {
    expect(sessionGate(true, false)).toBe("not-connected");
    expect(sessionGate(true, true)).toBe("proceed");
  });

  it("leaves the website's own requests exactly as they were", () => {
    // The first page load mints the cookie in middleware; a cookieless API hit
    // from the site still gets an account, as it always has.
    expect(sessionGate(false, false)).toBe("proceed");
    expect(sessionGate(false, true)).toBe("proceed");
  });
});

// The garment used to be read from the URL alone. Gap's "Classic T-Shirt" — a URL
// of product ids — was refused as not-apparel with a message telling the user to
// paste a link to a garment, which they had. And JSON-LD's category went in raw,
// so an unknown string defaulted to the "top" domain.
describe("category from the page, not only the URL", () => {
  let savedKey: string | undefined;
  beforeEach(() => {
    __clearPageCache();
    savedKey = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    if (savedKey !== undefined) process.env.ANTHROPIC_API_KEY = savedKey;
  });

  const prose = `<p>${"Soft everyday cotton, cut for layering. ".repeat(12)}</p>`;
  const offline = () => vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("network is off"); }));
  const TABLE = `<table><tr><th>Size</th><th>Chest</th></tr>
    <tr><td>S</td><td>96</td></tr><tr><td>M</td><td>100</td></tr><tr><td>L</td><td>104</td></tr></table>`;

  it("reads the garment off the headline when the URL names nothing", async () => {
    offline();
    const out = await extractSmart("https://www.gap.com/browse/product.do?pid=123456002", {
      html: `<html><body><h1>Classic T-Shirt</h1>${prose}${TABLE}</body></html>`,
    });
    expect(out.category).toBe("tshirt");
    expect(out.source.categoryFrom).toBe("page-name");
    expect(out.source.categoryGuessed).toBe(false);
    expect(refusalFor(out)).toBeNull(); // a real chart and a real garment: answer it
  });

  it("tells the truth when the garment is named but there is no chart", async () => {
    // Previously `not-apparel` — "paste a link to a specific garment" — to someone
    // who had. Now the reason is the real one.
    offline();
    const out = await extractSmart("https://www.gap.com/browse/product.do?pid=123456003", {
      html: `<html><body><h1>Classic T-Shirt</h1>${prose}</body></html>`,
    });
    expect(refusalFor(out)?.error).toBe("no-chart-on-page");
  });

  it("does not start serving an invented ladder on a server-read page named only by the page", async () => {
    // The invented-ladder question on server-read pages is an open founder
    // decision (todo/decisions/03). Fixing the category must not decide it.
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true, status: 200,
      headers: { get: (k: string) => (k.toLowerCase() === "content-type" ? "text/html" : null) },
      text: async () => `<html><body><h1>Classic T-Shirt</h1>${prose}</body></html>`,
      arrayBuffer: async () => new ArrayBuffer(0),
    })));
    const out = await extractSmart("https://www.gap.com/browse/product.do?pid=123456004");
    expect(out.source.fetch).toBe("ok");
    expect(out.source.sizesSynthesized).toBe(true);
    expect(refusalFor(out)?.error).toBe("no-chart-on-page");
  });

  it("normalises JSON-LD's category instead of trusting the raw string", async () => {
    // Raw, "Men's Sneakers" is not one of our keys, and domainForCategory's
    // fallback is "top" — a shoe would have been sized like a t-shirt.
    offline();
    const ld = `<script type="application/ld+json">{"@type":"Product","name":"Court Classic","category":"Men's Sneakers"}</script>`;
    const out = await extractSmart("https://shop.test/p/court-classic-7", {
      html: `<html><head>${ld}</head><body><h1>Court Classic</h1>${prose}${TABLE}</body></html>`,
    });
    expect(out.category).toBe("sneakers");
    expect(out.source.categoryFrom).toBe("page-structured");
    expect(refusalFor(out)?.error).toBe("unsupported-category");
  });

  it("still refuses a page that names no garment anywhere", async () => {
    offline();
    const out = await extractSmart("https://shop.test/p/item-999", {
      html: `<html><body><h1>Gift Card</h1>${prose}</body></html>`,
    });
    expect(refusalFor(out)?.error).toBe("not-apparel");
  });
});
