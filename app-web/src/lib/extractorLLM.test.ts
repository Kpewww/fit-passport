// Integration tests for extractSmart's layered pipeline, with the NETWORK stubbed.
//
// These exercise the real decision tree — fixture → fetch+deterministic-parse →
// (LLM, skipped: no key) → offered labels / 号型 → estimate — plus the HTML cache
// and bot-block handling, without hitting a real site. The LLM/vision layers are
// key-gated, so with ANTHROPIC_API_KEY unset they're skipped and we're testing the
// deterministic path that runs for every user by default.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { extractSmart, htmlToLlmText, __clearPageCache } from "./extractorLLM";
import { recommend } from "./fitEngine";
import { engineSizes } from "./engineInput";

// Build a fetch Response-like object for the stub.
function resp(
  body: string,
  { status = 200, contentType = "text/html" }: { status?: number; contentType?: string } = {},
) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (k: string) => (k.toLowerCase() === "content-type" ? contentType : null) },
    text: async () => body,
    arrayBuffer: async () => new ArrayBuffer(0),
  };
}

let savedKey: string | undefined;
beforeEach(() => {
  __clearPageCache();
  savedKey = process.env.ANTHROPIC_API_KEY;
  delete process.env.ANTHROPIC_API_KEY; // force the deterministic (no-LLM) path
});
afterEach(() => {
  vi.unstubAllGlobals();
  if (savedKey !== undefined) process.env.ANTHROPIC_API_KEY = savedKey;
});

const TABLE_HTML = `<html><body><h1>Linen Shirt</h1>
  <table>
    <tr><th>Size</th><th>Chest</th><th>Shoulder</th></tr>
    <tr><td>S</td><td>96</td><td>43</td></tr>
    <tr><td>M</td><td>100</td><td>44</td></tr>
    <tr><td>L</td><td>104</td><td>46</td></tr>
  </table></body></html>`;

describe("extractSmart — deterministic pipeline (network stubbed, no key)", () => {
  it("reads a real size TABLE off the page → sizesFrom 'page'", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => resp(TABLE_HTML)));
    const out = await extractSmart("https://shop.test/p/mens-linen-shirt-a1");
    expect(out.source.sizesFrom).toBe("page");
    expect(out.source.derived).toBe(false);
    expect(out.sizes.map((s) => s.label)).toEqual(["S", "M", "L"]);
    expect(out.sizes[1]).toMatchObject({ chestCm: 100, shoulderCm: 44 });
  });

  it("uses JSON-LD identity even when the size table drives the sizes", async () => {
    const html = `<script type="application/ld+json">
      {"@type":"Product","name":"Oxford Popover","brand":"Testmark"}</script>${TABLE_HTML}`;
    vi.stubGlobal("fetch", vi.fn(async () => resp(html)));
    const out = await extractSmart("https://shop.test/p/some-shirt-a2");
    expect(out.brand).toBe("Testmark");
    expect(out.productName).toBe("Oxford Popover");
    expect(out.source.sizesFrom).toBe("page");
  });

  it("treats a 403 bot-block as unreachable → falls back to 'estimated'", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => resp("<html>Access Denied</html>", { status: 403 })));
    const out = await extractSmart("https://shop.test/p/mens-shirt-a3");
    expect(out.source.sizesFrom).toBe("estimated");
    expect(out.sizes.length).toBeGreaterThan(0); // still gives a synthesized ladder
  });

  it("treats a 200 CAPTCHA page as unreachable → 'estimated'", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => resp("<html><body>请完成安全验证</body></html>")));
    const out = await extractSmart("https://shop.test/p/mens-shirt-a4");
    expect(out.source.sizesFrom).toBe("estimated");
  });

  it("ranks REAL offered labels from a <select> when there's no chart (still 'estimated')", async () => {
    const html = `<html><head><title>Cotton Tee</title></head><body>
      <h1>Cotton Tee</h1>
      <p>A soft everyday crew-neck tee in mid-weight cotton. Pre-shrunk, machine washable.
         Model is 183cm and wears a size M. Ethically made. Free returns within 30 days.</p>
      <select name="size"><option value="">Choose a size</option>
        <option>S</option><option>M</option><option>L</option><option>XL</option></select>
    </body></html>`;
    vi.stubGlobal("fetch", vi.fn(async () => resp(html)));
    const out = await extractSmart("https://shop.test/p/mens-tshirt-a5");
    expect(out.source.sizesFrom).toBe("estimated"); // no measurements
    expect(out.sizes.map((s) => s.label).sort()).toEqual(["L", "M", "S", "XL"]);
  });

  it("turns a top's 号型 labels into real body-chest bands → 'page'", async () => {
    const html = `<html><head><title>纯棉衬衫</title></head><body>
      <h1>男士纯棉长袖衬衫</h1>
      <p>经典版型,100%纯棉,透气舒适。面料柔软,四季可穿。支持七天无理由退换货。
         模特身高180cm,体重70kg,穿着165/88A。请参考下方尺码选择合适的号型。</p>
      <select name="尺码"><option>请选择</option>
        <option>160/84A</option><option>165/88A</option><option>170/92A</option></select>
    </body></html>`;
    vi.stubGlobal("fetch", vi.fn(async () => resp(html)));
    // URL says 'shirt' → a top category, so 号型 型 = intended body chest.
    const out = await extractSmart("https://shop.test/p/mens-shirt-a6");
    expect(out.source.sizesFrom).toBe("page");
    const s = out.sizes.find((x) => x.label === "165/88A")!;
    expect(s.bodyChestMinCm).toBe(85); // 88 - 3
    expect(s.bodyChestMaxCm).toBe(91); // 88 + 3
  });

  it("caches by URL: a second check does not re-fetch", async () => {
    const f = vi.fn(async () => resp(TABLE_HTML));
    vi.stubGlobal("fetch", f);
    await extractSmart("https://shop.test/p/mens-linen-shirt-a7");
    const callsAfterFirst = f.mock.calls.length; // 1 success (no retry needed)
    await extractSmart("https://shop.test/p/mens-linen-shirt-a7");
    expect(f.mock.calls.length).toBe(callsAfterFirst); // cache hit → no new fetch
  });

  it("retries once on a transient network error, then succeeds", async () => {
    let n = 0;
    const f = vi.fn(async () => {
      n += 1;
      if (n === 1) throw new Error("ECONNRESET");
      return resp(TABLE_HTML);
    });
    vi.stubGlobal("fetch", f);
    const out = await extractSmart("https://shop.test/p/mens-linen-shirt-a8");
    expect(out.source.sizesFrom).toBe("page");
    expect(f.mock.calls.length).toBe(2); // first threw, retry succeeded
  });

  it("a non-HTML content type is not parsed → 'estimated'", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => resp("%PDF-1.4", { contentType: "application/pdf" })));
    const out = await extractSmart("https://shop.test/p/mens-shirt-a9");
    expect(out.source.sizesFrom).toBe("estimated");
  });
});

// `sizesFrom: "estimated"` has two causes that need OPPOSITE remedies: a page we
// were refused (needs different transport) vs. a page we read but couldn't parse
// (needs a better reader). Until we record which, we're guessing about where to
// spend. See docs/design/fetch-strategy.md §6.
describe("fetch-outcome instrumentation", () => {
  it("records a 403 as 'blocked', not merely unreachable", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => resp("<html>Access Denied</html>", { status: 403 })));
    const out = await extractSmart("https://shop.test/p/mens-shirt-b1");
    expect(out.source.sizesFrom).toBe("estimated");
    expect(out.source.fetch).toBe("blocked");
  });

  it("records a 200 CAPTCHA challenge as 'blocked' too", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => resp("<html><body>请完成安全验证</body></html>")));
    const out = await extractSmart("https://shop.test/p/mens-shirt-b2");
    expect(out.source.fetch).toBe("blocked");
  });

  it("does NOT retry a block — the CDN already said no, twice is just rude", async () => {
    const f = vi.fn(async () => resp("<html>Access Denied</html>", { status: 403 }));
    vi.stubGlobal("fetch", f);
    await extractSmart("https://shop.test/p/mens-shirt-b3");
    expect(f.mock.calls.length).toBe(1);
  });

  it("still retries a TRANSIENT failure (a block is not transient, a throw is)", async () => {
    const f = vi.fn(async () => {
      throw new Error("ECONNRESET");
    });
    vi.stubGlobal("fetch", f);
    const out = await extractSmart("https://shop.test/p/mens-shirt-b4");
    expect(f.mock.calls.length).toBe(2);
    expect(out.source.fetch).toBe("unreachable");
  });

  it("records 'ok' when the page WAS read but held no chart — the fixable case", async () => {
    const html = `<html><head><title>Plain Tee</title></head><body>
      <h1>Plain Tee</h1><p>${"A soft everyday tee. ".repeat(30)}</p>
      </body></html>`;
    vi.stubGlobal("fetch", vi.fn(async () => resp(html)));
    const out = await extractSmart("https://shop.test/p/mens-plain-tee-b5");
    expect(out.source.sizesFrom).toBe("estimated"); // no chart found
    expect(out.source.fetch).toBe("ok"); // but the page itself was fine
  });

  it("records 'skipped' for a fixture — no network was involved at all", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => resp(TABLE_HTML)));
    const out = await extractSmart("https://www.uniqlo.com/us/en/products/airism-cotton-t-shirt");
    expect(out.source.sizesFrom).toBe("fixture");
    expect(out.source.fetch).toBe("skipped");
  });
});

// The LLM input cap is a COST control: at $1/1M input tokens the old 600KB cap
// allowed ~$0.15 of spend on a single heavy page, ~20x the documented estimate.
// Cutting it is only safe because tables are emitted BEFORE prose — so this
// tests the property the cost fix actually depends on, rather than trusting it.
describe("LLM input cap (cost control)", () => {
  const CHART = `<table>
    <tr><th>Size</th><th>Chest</th></tr>
    <tr><td>S</td><td>96</td></tr>
    <tr><td>M</td><td>100</td></tr>
    <tr><td>L</td><td>104</td></tr>
  </table>`;

  it("keeps the size chart even when the page is enormous", () => {
    // 2MB of marketing copy AFTER the chart — far past any sane cap.
    const bloat = `<p>${"Crafted from premium cotton. ".repeat(70_000)}</p>`;
    const text = htmlToLlmText(`<html><body>${CHART}${bloat}</body></html>`);
    expect(text).toContain("SIZE TABLES");
    expect(text).toContain("S | 96");
    expect(text).toContain("M | 100");
    expect(text).toContain("L | 104");
  });

  it("keeps the chart even when the bloat comes BEFORE it in the HTML", () => {
    // Ordering in the OUTPUT is what matters, not ordering in the source.
    const bloat = `<p>${"Free shipping and returns. ".repeat(70_000)}</p>`;
    const text = htmlToLlmText(`<html><body>${bloat}${CHART}</body></html>`);
    expect(text).toContain("S | 96");
    expect(text).toContain("L | 104");
  });

  it("actually truncates, so a huge page cannot run up an unbounded bill", () => {
    const bloat = `<p>${"Crafted from premium cotton. ".repeat(70_000)}</p>`;
    const text = htmlToLlmText(`<html><body>${CHART}${bloat}</body></html>`);
    // ~80KB ≈ 20K tokens ≈ $0.02 worst case at Haiku 4.5 input pricing.
    expect(text.length).toBeLessThanOrEqual(80_000);
  });
});

// The browser-extension transport. Measured 2026-09-08: retailers' bot protection
// detects headless automation, and the configuration that gets through needs a
// display, which serverless does not have — so the page can only reach us from a
// browser someone is already looking at. Everything downstream is unchanged; only
// where the bytes came from is different.
describe("extractSmart — HTML supplied by the caller (the extension path)", () => {
  const UNREACHABLE = () => vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("network is off"); }));

  it("reads a chart out of supplied HTML without any fetch at all", async () => {
    const spy = vi.fn(async () => resp("should never be called"));
    vi.stubGlobal("fetch", spy);
    const out = await extractSmart("https://shop.test/p/mens-linen-shirt-x1", { html: TABLE_HTML });
    expect(spy).not.toHaveBeenCalled();
    expect(out.sizes.map((s) => s.label)).toEqual(["S", "M", "L"]);
  });

  it("says the numbers came from the PAGE and the bytes came from the EXTENSION", async () => {
    // Two different questions. `sizesFrom` is about where the measurements came
    // from — the retailer's real page, so "page" is true. `fetch` is about who
    // went and got it, and claiming "ok" would say our server read a page it
    // never requested. Collapsing them is the mistake invariant ㊿ records.
    UNREACHABLE();
    const out = await extractSmart("https://shop.test/p/mens-linen-shirt-x2", { html: TABLE_HTML });
    expect(out.source.sizesFrom).toBe("page");
    expect(out.source.fetch).toBe("extension");
  });

  it("works for a retailer our servers cannot reach", async () => {
    // The whole point: this is the case that returns 422 today.
    UNREACHABLE();
    const out = await extractSmart(
      "https://www.patagonia.com/product/mens-insulated-boulder-fork-rain-jacket/85220.html",
      { html: TABLE_HTML },
    );
    expect(out.source.fetch).toBe("extension");
    expect(out.source.sizesFrom).toBe("page");
    expect(out.sizes.length).toBe(3);
  });

  it("prefers supplied HTML over a demo fixture", async () => {
    // A fixture stands in for a page we could not read. Serving it while holding
    // the real page substitutes our demo data for the retailer's, which is the
    // same class of mistake as the invented ladder.
    UNREACHABLE();
    const out = await extractSmart("https://www.uniqlo.com/us/en/products/airism-t-shirt", { html: TABLE_HTML });
    expect(out.source.sizesFrom).toBe("page");
    expect(out.source.fetch).toBe("extension");
  });

  it("ignores markup too short to be a page, rather than treating it as a read", async () => {
    // Guards against an extension that fired before the page had rendered.
    vi.stubGlobal("fetch", vi.fn(async () => resp(TABLE_HTML)));
    const out = await extractSmart("https://shop.test/p/mens-linen-shirt-x3", { html: "<html></html>" });
    expect(out.source.fetch).toBe("ok"); // fell through to our own fetch
  });

  it("flags the fallback ladder as synthesized when the supplied page holds no chart", async () => {
    // Being handed the page is not permission to make numbers up. This test used
    // to be called "still refuses to invent…" while asserting only the label
    // below — and the ROUTE then scored the invented ladder anyway, because ㊼
    // only looked at our own fetch failing. The flag is what lets checkPolicy
    // refuse it; checkPolicy.test.ts asserts the refusal end to end.
    UNREACHABLE();
    const out = await extractSmart("https://shop.test/p/mens-linen-shirt-x4", {
      html: `<html><body><h1>A shirt</h1><p>${"no chart here. ".repeat(30)}</p></body></html>`,
    });
    expect(out.source.sizesFrom).toBe("estimated");
    expect(out.source.fetch).toBe("extension");
    expect(out.source.sizesSynthesized).toBe(true);
  });
});

// Which reader produced the numbers, and what is and is not kept. `sizesFrom:
// "page"` alone could mean a parsed table, a language model reading prose, a
// vision model reading an image, or 号型 codes — four levels of trust.
describe("extractSmart — provenance of page sizes", () => {
  const UNREACHABLE = () => vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("network is off"); }));

  it("credits a parsed table to 'table' and clears the synthesized flag", async () => {
    UNREACHABLE();
    const out = await extractSmart("https://shop.test/p/mens-linen-shirt-y1", { html: TABLE_HTML });
    expect(out.source.extractedBy).toBe("table");
    expect(out.source.sizesSynthesized).toBeUndefined();
  });

  it("credits 号型 labels to 'hao-xing'", async () => {
    UNREACHABLE();
    const html = `<html><body><h1>男士纯棉长袖衬衫</h1><p>${"经典版型,100%纯棉,透气舒适。".repeat(12)}</p>
      <select name="尺码"><option>160/84A</option><option>165/88A</option><option>170/92A</option></select>
      </body></html>`;
    const out = await extractSmart("https://shop.test/p/mens-shirt-y2", { html });
    expect(out.source.sizesFrom).toBe("page");
    expect(out.source.extractedBy).toBe("hao-xing");
  });

  it("marks the URL-only ladder as synthesized — no source stated those numbers", async () => {
    UNREACHABLE();
    const out = await extractSmart("https://shop.test/p/mens-linen-shirt-y3");
    expect(out.source.fetch).toBe("unreachable");
    expect(out.source.sizesSynthesized).toBe(true);
    expect(out.source.extractedBy).toBeUndefined();
  });

  it("drops the brand-chart credit when the LLM reads the page instead (invariant (56))", async () => {
    // Before Session 75 only the table and 号型 branches cleared it, so a
    // Patagonia page read by the LLM still claimed "body measurements, from the
    // brand's guide" beside numbers that came from the page.
    process.env.ANTHROPIC_API_KEY = "test-key"; // restored by afterEach
    const llmReply = {
      brand: "Patagonia",
      productName: "Boulder Fork Rain Jacket",
      category: "jacket",
      sizes: [{ label: "S", chestCm: 104 }, { label: "M", chestCm: 110 }, { label: "L", chestCm: 116 }],
    };
    const fetchSpy = vi.fn(async (input: unknown) => {
      if (String(input).includes("api.anthropic.com")) {
        return { ok: true, status: 200, json: async () => ({ content: [{ type: "text", text: JSON.stringify(llmReply) }] }) };
      }
      throw new Error("no other network in this test");
    });
    vi.stubGlobal("fetch", fetchSpy);
    const out = await extractSmart(
      "https://www.patagonia.com/product/mens-insulated-boulder-fork-rain-jacket/85220.html",
      { html: `<html><body><h1>Boulder Fork Rain Jacket</h1><p>${"Waterproof, breathable shell. ".repeat(20)}</p></body></html>` },
    );
    expect(out.source.sizesFrom).toBe("page");
    expect(out.source.extractedBy).toBe("llm-text");
    expect(out.source.chart).toBeUndefined();
    expect(out.source.measurementKindFrom).toBeUndefined();
    expect(out.sizes.map((s) => s.label)).toEqual(["S", "M", "L"]);
  });

  it("answers M for a 100cm chest on Uniqlo's chart, where it used to say L at 65%", async () => {
    // The browser extension's first real Uniqlo page (2026-09-28): the table as
    // captured, and the line of site chrome that sits beside it. End to end
    // through the extractor and the engine, fed the way /api/check feeds it.
    UNREACHABLE();
    const html = `<html><body><h1>Men's AIRism Cotton T-Shirt</h1>
      <p>Compare all product measurements with previous purchases</p>
      <table><tr><th>Size</th><th>Chest</th><th>Waist</th></tr>
      <tr><td>XS</td><td>31 1/2-34 3/4</td><td>26-28 1/4</td></tr>
      <tr><td>S</td><td>34 3/4-37 3/4</td><td>26 3/4-30</td></tr>
      <tr><td>M</td><td>37 3/4-41</td><td>30-33</td></tr>
      <tr><td>L</td><td>41-44</td><td>33-36 1/4</td></tr>
      <tr><td>XL</td><td>44-47 1/4</td><td>36 1/4-39 1/4</td></tr>
      <tr><td>XXL</td><td>47 1/4-50 1/2</td><td>39 1/4-42 1/2</td></tr>
      <tr><td>3XL</td><td>50 1/2-53 1/2</td><td>42 1/2-45 3/4</td></tr></table></body></html>`;
    const out = await extractSmart("https://www.uniqlo.com/us/en/products/E474244-000/00", { html });
    expect(out.source).toMatchObject({ sizesFrom: "page", measurementKind: "body", measurementKindFrom: "table" });
    const result = recommend({
      profile: { chestCm: 100, waistCm: 86, shoulderCm: 46, preferredFit: "regular" },
      product: { brand: out.brand, category: out.category },
      sizes: engineSizes(out.sizes),
      knownGood: [],
      outcomes: [],
    });
    expect(result.best.label).toBe("M");
    expect(result.best.verdict).toBe("true to size");
  });

  it("keeps none of the supplied page's prose in what gets stored", async () => {
    // /api/check persists JSON.stringify(extracted) as Product.rawJson. The page
    // a user was looking at never should be in it — only what we read off it.
    UNREACHABLE();
    const marker = "PRIVATE-PROSE-MARKER-7f3a";
    const html = TABLE_HTML.replace("<h1>Linen Shirt</h1>", `<h1>Linen Shirt</h1><p>Deliver to ${marker}</p>`);
    const out = await extractSmart("https://shop.test/p/mens-linen-shirt-y4", { html });
    expect(out.sizes.length).toBe(3);
    expect(JSON.stringify(out)).not.toContain(marker);
  });
});
