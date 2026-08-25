// Integration tests for extractSmart's layered pipeline, with the NETWORK stubbed.
//
// These exercise the real decision tree — fixture → fetch+deterministic-parse →
// (LLM, skipped: no key) → offered labels / 号型 → estimate — plus the HTML cache
// and bot-block handling, without hitting a real site. The LLM/vision layers are
// key-gated, so with ANTHROPIC_API_KEY unset they're skipped and we're testing the
// deterministic path that runs for every user by default.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { extractSmart, htmlToLlmText, __clearPageCache } from "./extractorLLM";

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
