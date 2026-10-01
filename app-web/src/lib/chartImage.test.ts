// A picture the shopper picked as the size chart — Session 83.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { chartImageKey, normalImageUrl, readChartImage, type CachedRead, type ChartImageStore } from "./chartImage";
import { extractSmart, __clearPageCache } from "./extractorLLM";

function memoryStore(seed: Record<string, CachedRead> = {}) {
  const rows = new Map(Object.entries(seed));
  const store: ChartImageStore & { rows: typeof rows } = {
    rows,
    async get(key) { return rows.get(key) ?? null; },
    async put(key, _url, read) { rows.set(key, read); },
  };
  return store;
}

const PIC = "https://i.ebayimg.com/images/g/abc/s-l1600.jpg";
const CHART = [
  { label: "S", chestCm: 106.7 },
  { label: "M", chestCm: 116.8 },
  { label: "L", chestCm: 127 },
];

describe("reading a picked picture", () => {
  it("accepts https addresses only, without the fragment", () => {
    expect(normalImageUrl(PIC + "#zoom")).toBe(PIC);
    expect(normalImageUrl("http://i.ebayimg.com/x.jpg")).toBeNull();
    expect(normalImageUrl("data:image/png;base64,AAAA")).toBeNull();
    expect(normalImageUrl("https://x/" + "a".repeat(3000))).toBeNull();
  });

  it("reads once, then answers everyone from the cache", async () => {
    const store = memoryStore();
    const vision = vi.fn(async () => ({ sizes: CHART, header: "Garment measurements (inches)" }));
    const deps = { store, vision, model: "m", hasKey: true };
    const first = await readChartImage(PIC, deps);
    const second = await readChartImage(PIC + "#again", deps);
    expect(first.status).toBe("read");
    expect(second.status).toBe("cached");
    expect(second.sizes).toEqual(CHART);
    expect(second.header).toBe("Garment measurements (inches)");
    expect(vision).toHaveBeenCalledTimes(1);
  });

  it("remembers a picture that is not a chart, so it is not paid for twice", async () => {
    const store = memoryStore();
    const vision = vi.fn(async () => "not-a-chart" as const);
    const deps = { store, vision, model: "m", hasKey: true };
    expect((await readChartImage(PIC, deps)).status).toBe("not-a-chart");
    expect((await readChartImage(PIC, deps)).status).toBe("not-a-chart");
    expect(vision).toHaveBeenCalledTimes(1);
  });

  it("does not remember a failed read — a later try may work", async () => {
    const store = memoryStore();
    const vision = vi.fn(async () => null);
    const deps = { store, vision, model: "m", hasKey: true };
    expect((await readChartImage(PIC, deps)).status).toBe("failed");
    expect(store.rows.size).toBe(0);
  });

  it("says the reader is off when there is no key and nothing cached, without calling it", async () => {
    const vision = vi.fn();
    const r = await readChartImage(PIC, { store: memoryStore(), vision, model: "m", hasKey: false });
    expect(r.status).toBe("unavailable");
    expect(vision).not.toHaveBeenCalled();
  });

  it("still serves a cached read when the key is gone", async () => {
    const store = memoryStore({ [chartImageKey(PIC)]: { sizesJson: JSON.stringify(CHART), header: null } });
    const r = await readChartImage(PIC, { store, vision: vi.fn(), model: "m", hasKey: false });
    expect(r.status).toBe("cached");
  });
});

describe("a picked picture in the pipeline", () => {
  let savedKey: string | undefined;
  beforeEach(() => {
    __clearPageCache();
    savedKey = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
  });
  afterEach(() => {
    if (savedKey !== undefined) process.env.ANTHROPIC_API_KEY = savedKey;
  });

  // An eBay listing as the extension sends it: a title, specifics with a printed
  // size, no chart in the text.
  const LISTING = `<!doctype html><html lang="en"><head><title>Men's Long Sleeve Button Down Dress Shirt Blue | eBay</title></head>
    <body><h1>Men's Long Sleeve Button Down Dress Shirt Blue</h1>
    <dl data-fp="specs"><dt>Brand</dt><dd>UltraClub</dd><dt>Size</dt><dd>M</dd><dt>Department</dt><dd>Men</dd><dt>Type</dt><dd>Dress Shirt</dd></dl>
    </body></html>`;

  it("ranks the picked chart's sizes instead of judging the printed size alone", async () => {
    const store = memoryStore({ [chartImageKey(PIC)]: { sizesJson: JSON.stringify(CHART), header: "Garment measurements" } });
    const out = await extractSmart("https://www.ebay.com/itm/225480311393", { html: LISTING, chartImage: PIC, chartStore: store });
    expect(out.source.chartImage).toBe("cached");
    expect(out.source.sizesFrom).toBe("page");
    expect(out.source.extractedBy).toBe("picked-picture");
    expect(out.sizes.map((s) => s.label)).toEqual(["S", "M", "L"]);
    // The chart's own heading decided what the numbers measure.
    expect(out.source.measurementKind).toBe("garment");
  });

  it("reads 'body' from a chart headed as body measurements", async () => {
    const store = memoryStore({ [chartImageKey(PIC)]: { sizesJson: JSON.stringify(CHART), header: "Body measurements - to fit chest" } });
    const out = await extractSmart("https://www.ebay.com/itm/225480311393", { html: LISTING, chartImage: PIC, chartStore: store });
    expect(out.source.measurementKind).toBe("body");
  });

  it("falls back to the listing's own answer when the picture cannot be read", async () => {
    const out = await extractSmart("https://www.ebay.com/itm/225480311393", { html: LISTING, chartImage: PIC, chartStore: memoryStore() });
    expect(out.source.chartImage).toBe("unavailable");
    expect(out.source.extractedBy).not.toBe("picked-picture");
  });

  it("keeps a table on the page over a picked picture", async () => {
    const html = `<html><body><h1>Linen Shirt</h1><table>
      <tr><th>Size</th><th>Chest</th></tr><tr><td>S</td><td>96</td></tr><tr><td>M</td><td>100</td></tr><tr><td>L</td><td>104</td></tr>
      </table>${"<p>pad</p>".repeat(30)}</body></html>`;
    const store = memoryStore({ [chartImageKey(PIC)]: { sizesJson: JSON.stringify(CHART), header: null } });
    const out = await extractSmart("https://shop.example.com/p/linen-shirt", { html, chartImage: PIC, chartStore: store });
    expect(out.source.extractedBy).toBe("table");
    expect(out.source.chartImage).toBe("page-has-table");
  });
});
