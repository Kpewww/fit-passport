// A size chart uploaded on its own, with no product page — Session 100.

import { describe, expect, it, vi } from "vitest";
import { readUploadedChart, uploadMediaType, MAX_UPLOAD_BYTES, type CachedRead, type ChartImageStore } from "./chartImage";
import { chartGaps, productFromUpload } from "./chartUpload";
import { withUserCategory } from "./extractor";
import { refusalFor } from "./checkPolicy";

function memoryStore() {
  const rows = new Map<string, CachedRead>();
  const store: ChartImageStore & { rows: typeof rows } = {
    rows,
    async get(key) { return rows.get(key) ?? null; },
    async put(key, _url, read) { rows.set(key, read); },
  };
  return store;
}

// A PNG's first bytes, then anything: what the reader sees of an uploaded picture.
const png = (n: number) => new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, n, 1, 2, 3]);

// The IND4000Z chart as the model transcribes it: cells as printed, nothing converted.
const IND4000Z_GRID = [
  ["Size", "S", "M", "L", "XL", "2XL", "3XL"],
  ["Body Length", "28 1/2", "29 1/2", "30 1/2", "31 1/2", "32 1/2", "33 1/2"],
  ["Chest Width (1/2)", "21", "23", "24 1/2", "26 1/2", "27 1/2", "28 1/2"],
];
const modelSizes = [{ label: "S", chestCm: 53.3 }, { label: "M", chestCm: 58.4 }, { label: "L", chestCm: 62.2 }];

describe("an uploaded size chart", () => {
  it("knows a picture by its first bytes, never by what the request claims", () => {
    expect(uploadMediaType(png(0))).toBe("image/png");
    expect(uploadMediaType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe("image/jpeg");
    expect(uploadMediaType(new TextEncoder().encode("RIFF....WEBPVP8 "))).toBe("image/webp");
    expect(uploadMediaType(new TextEncoder().encode("<svg onload=alert(1)>"))).toBeNull();
  });

  it("refuses what is not a picture, or too large, without calling the model", async () => {
    const vision = vi.fn();
    const deps = { store: memoryStore(), vision, model: "m", hasKey: true };
    expect((await readUploadedChart(new TextEncoder().encode("hello"), deps)).status).toBe("bad-address");
    const big = new Uint8Array(MAX_UPLOAD_BYTES + 1); big.set(png(0));
    expect((await readUploadedChart(big, deps)).status).toBe("bad-address");
    expect(vision).not.toHaveBeenCalled();
  });

  it("reads a picture once for everyone, by its bytes, and keeps the transcription", async () => {
    const store = memoryStore();
    const vision = vi.fn(async () => ({ sizes: modelSizes, header: null, grid: IND4000Z_GRID }));
    const deps = { store, vision, model: "m", hasKey: true };
    const first = await readUploadedChart(png(7), deps);
    const again = await readUploadedChart(png(7), deps);
    expect(first.status).toBe("read");
    expect(again.status).toBe("cached");
    expect(again.grid).toEqual(IND4000Z_GRID);
    expect(again.sha).toBe(first.sha);
    expect(vision).toHaveBeenCalledTimes(1);
    expect((await readUploadedChart(png(8), deps)).status).toBe("read"); // another picture, another read
  });

  it("stands the chart in for a product: the half chest doubled, no name, the garment asked", async () => {
    const read = await readUploadedChart(png(1), {
      store: memoryStore(), vision: async () => ({ sizes: modelSizes, header: null, grid: IND4000Z_GRID }), model: "m", hasKey: true,
    });
    const ex = productFromUpload(read, { sha: read.sha })!;
    expect(ex.sizes.map((s) => s.chestCm)).toEqual([106.7, 116.8, 124.5, 134.6, 139.7, 144.8]);
    expect(ex.brand).toBe("");
    expect(ex.source.extractedBy).toBe("uploaded-picture");
    expect(ex.source.sizesFrom).toBe("page");
    expect(ex.source.measurementKind).toBe("garment");
    // No garment named yet: the check asks rather than guessing a T-shirt.
    expect(refusalFor(ex)?.error).toBe("pick-category");
    // Once the shopper names it, nothing stands in the way.
    expect(refusalFor(withUserCategory(ex, "hoodie"))).toBeNull();
  });

  it("keeps a link the shopper gave as the product's reference", async () => {
    const read = await readUploadedChart(png(2), {
      store: memoryStore(), vision: async () => ({ sizes: modelSizes, header: null, grid: IND4000Z_GRID }), model: "m", hasKey: true,
    });
    const ex = productFromUpload(read, { sha: read.sha, link: "https://drive.google.com/file/d/abc/view" })!;
    expect(ex.source.url).toBe("https://drive.google.com/file/d/abc/view");
    expect(ex.source.host).toBe("drive.google.com");
  });

  it("falls back to the model's own sizes for a read with no transcription", async () => {
    const read = { status: "cached" as const, sizes: [...modelSizes, { label: "XL", chestCm: 66 }], header: null, grid: null, sha: "x" };
    expect(productFromUpload(read, { sha: "x" })!.sizes.length).toBe(4);
    expect(productFromUpload({ status: "not-a-chart", sizes: [], header: null, grid: null }, { sha: "y" })).toBeNull();
  });

  it("says what a chart lacks before it can size anyone", () => {
    expect(chartGaps([{ label: "S", chestCm: 100 }, { label: "M", chestCm: 104 }])).toBe("few-sizes");
    expect(chartGaps([{ label: "S", lengthCm: 70 }, { label: "M", lengthCm: 72 }, { label: "L", lengthCm: 74 }])).toBe("no-girth");
    expect(chartGaps([{ label: "28", waistCm: 72 }, { label: "30", waistCm: 77 }, { label: "32", waistCm: 82 }])).toBeNull();
    expect(chartGaps([{ label: "S", bodyChestMinCm: 86, bodyChestMaxCm: 91 }, { label: "M", bodyChestMinCm: 91, bodyChestMaxCm: 97 }, { label: "L", bodyChestMinCm: 97, bodyChestMaxCm: 104 }])).toBeNull();
  });
});
