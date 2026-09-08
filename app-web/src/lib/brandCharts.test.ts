import { describe, it, expect } from "vitest";
import {
  BRAND_CHARTS,
  CM_PER_INCH,
  chartAgeDays,
  chartFor,
  chartToSizes,
  inToCm,
  pointRange,
  type BrandChart,
} from "./brandCharts";
import { normalizeToAlpha } from "./sizing";

describe("inToCm", () => {
  it("uses the defined inch", () => {
    expect(CM_PER_INCH).toBe(2.54);
    expect(inToCm(40)).toBe(101.6);
    // Rounded to one decimal by contract, so the result is within half a
    // millimetre of the exact conversion rather than equal to it.
    expect(inToCm(1)).toBeCloseTo(2.54, 1);
  });

  it("rounds to one decimal, because the source is printed to the half-inch", () => {
    expect(inToCm(37.5)).toBe(95.3); // 95.25
    expect(inToCm(48.5)).toBe(123.2); // 123.19
  });
});

describe("the library itself", () => {
  it("gives every chart the provenance that makes it checkable", () => {
    // A chart nobody can trace back to a page is indistinguishable from the
    // invented BRAND_TABLE ladder this file exists to replace.
    for (const c of BRAND_CHARTS) {
      expect(c.sourceUrl, `${c.brand} sourceUrl`).toMatch(/^https:\/\//);
      expect(c.capturedAt, `${c.brand} capturedAt`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(["fetch", "manual"]).toContain(c.capturedBy);
      expect(c.rows.length, `${c.brand} rows`).toBeGreaterThan(2);
    }
  });

  it("points each chart's source URL at the brand's own domain", () => {
    // The rule that keeps third-party aggregators out. Their numbers are someone
    // else's compilation, frequently stale, and the one input shape with a real
    // copyright question attached.
    for (const c of BRAND_CHARTS) {
      const host = new URL(c.sourceUrl).hostname.toLowerCase();
      expect(
        c.hostKeys.some((k) => host.includes(k)),
        `${c.brand}: sourceUrl ${host} is not one of its own hostKeys`,
      ).toBe(true);
    }
  });

  it("keeps Nike's numbers exactly as Nike prints them", () => {
    // Pinned verbatim on purpose. If someone 'tidies' these, the test names the
    // page to re-check them against.
    const nike = BRAND_CHARTS.find((c) => c.brand === "Nike")!;
    expect(nike.units).toBe("in");
    expect(nike.kind).toBe("body");
    expect(nike.sourceUrl).toBe("https://www.nike.com/size-fit/mens_tops_alpha");
    const m = nike.rows.find((r) => r.label === "M")!;
    expect([m.chestMin, m.chestMax]).toEqual([37.5, 41]);
    const xl = nike.rows.find((r) => r.label === "XL")!;
    expect([xl.chestMin, xl.chestMax]).toEqual([44, 48.5]);
  });
});

describe("chartToSizes", () => {
  const nike = BRAND_CHARTS.find((c) => c.brand === "Nike")!;

  it("puts a BODY chart's numbers in the body-range fields and never in chestCm", () => {
    // THE ONE THAT MATTERS. `chestCm` means the garment's flat chest. A body
    // range dropped into it reads as a garment about one full size smaller than
    // it is, and every recommendation from that brand would be wrong in the same
    // direction — the kind of bug that looks like a tuning problem for months.
    const sizes = chartToSizes(nike);
    for (const s of sizes) {
      expect(s.chestCm, `${s.label} must not claim a garment chest`).toBeUndefined();
      expect(s.waistCm, `${s.label} must not claim a garment waist`).toBeUndefined();
      expect(s.bodyChestMinCm).toBeGreaterThan(0);
      expect(s.bodyChestMaxCm).toBeGreaterThan(s.bodyChestMinCm!);
    }
  });

  it("converts to centimetres", () => {
    const m = chartToSizes(nike).find((s) => s.label === "M")!;
    expect(m.bodyChestMinCm).toBe(95.3); // 37.5in
    expect(m.bodyChestMaxCm).toBe(104.1); // 41in
  });

  it("drops a label the engine's ladder cannot place, rather than shipping a size that is never scored", () => {
    // Nike prints 4XL. ALPHA_LADDER stops at XXXL, so `alphaIndex` would return
    // null downstream and the size would be displayed and then silently ignored
    // in scoring. Dropping it here keeps "what we showed" == "what we scored".
    expect(nike.rows.some((r) => r.label === "4XL")).toBe(true);
    const labels = chartToSizes(nike).map((s) => s.label);
    expect(labels).not.toContain("4XL");
    expect(labels).toContain("3XL"); // this one DOES have a rung (→ XXXL)
    expect(labels).toEqual(["XS", "S", "M", "L", "XL", "XXL", "3XL"]);
  });

  it("takes the midpoint for a garment chart, and marks it as a garment measurement", () => {
    const garment: BrandChart = {
      ...nike,
      kind: "garment",
      rows: [{ label: "M", chestMin: 40, chestMax: 42, waistMin: 34, waistMax: 36 }],
    };
    const [m] = chartToSizes(garment);
    expect(m.chestCm).toBe(inToCm(41));
    expect(m.waistCm).toBe(inToCm(35));
    expect(m.bodyChestMinCm).toBeUndefined();
  });

  it("passes centimetre charts through without converting them", () => {
    const metric: BrandChart = {
      ...nike,
      units: "cm",
      rows: [{ label: "M", chestMin: 96, chestMax: 104 }],
    };
    const [m] = chartToSizes(metric);
    expect(m.bodyChestMinCm).toBe(96);
    expect(m.bodyChestMaxCm).toBe(104);
  });
});

describe("chartFor", () => {
  it("finds a men's tops chart for a men's top", () => {
    expect(chartFor("www.nike.com", "tshirt", "mens")?.brand).toBe("Nike");
    expect(chartFor("nike.com", "hoodie", "mens")?.brand).toBe("Nike");
  });

  it("declines a different garment domain rather than serving a near miss", () => {
    // A tops chart answering for trousers would be presented to the user as the
    // brand's own published sizing. Worse than having no chart.
    expect(chartFor("www.nike.com", "jeans", "mens")).toBeNull();
    expect(chartFor("www.nike.com", "sneakers", "mens")).toBeNull();
  });

  it("declines when the product's gender is wrong or unknown", () => {
    // Men's and women's ladders differ by roughly a full size at the same label,
    // so an undetected gender is a reason to read the page, not to guess.
    expect(chartFor("www.nike.com", "tshirt", "womens")).toBeNull();
    expect(chartFor("www.nike.com", "tshirt", undefined)).toBeNull();
  });

  it("does not match a brand it has no chart for", () => {
    expect(chartFor("www.adidas.com", "jacket", "mens")).toBeNull();
    expect(chartFor("example.com", "tshirt", "mens")).toBeNull();
  });

  it("does not let a hostKey match some other retailer's domain", () => {
    // `hostKeys` are substrings, like BRAND_TABLE's keys. Worth a test so that
    // adding a short key (say "gap") is a decision someone makes with the failure
    // mode visible.
    expect(chartFor("nike.example.com", "tshirt", "mens")?.brand).toBe("Nike");
    expect(chartFor("notnike-outlet.com", "tshirt", "mens")?.brand).toBe("Nike");
  });
});

describe("chartAgeDays", () => {
  it("reports the age so the UI can disclose it", () => {
    const c = { ...BRAND_CHARTS[0], capturedAt: "2026-09-01" };
    expect(chartAgeDays(c, new Date("2026-09-08T12:00:00Z"))).toBe(7);
  });
});

describe("normalizeToAlpha — the multi-X labels retailers actually print", () => {
  it("understands 2XL / 3XL, which used to normalise to null", () => {
    // Before this, a page printing "2XL" had that size shown and then dropped
    // from scoring, because alphaIndex(null) is null.
    expect(normalizeToAlpha("2XL")).toBe("XXL");
    expect(normalizeToAlpha("3XL")).toBe("XXXL");
    expect(normalizeToAlpha("2X")).toBe("XXL");
    expect(normalizeToAlpha("2xl")).toBe("XXL");
  });

  it("returns null above the ladder instead of clamping", () => {
    // Clamping 4XL to XXXL would put a size on a rung it does not occupy.
    expect(normalizeToAlpha("4XL")).toBeNull();
    expect(normalizeToAlpha("5XL")).toBeNull();
  });

  it("leaves 1X alone — it is a different ladder, not a synonym for XL", () => {
    expect(normalizeToAlpha("1X")).toBeNull();
  });

  it("still reads the labels it always did", () => {
    expect(normalizeToAlpha("M")).toBe("M");
    expect(normalizeToAlpha("XXL")).toBe("XXL");
    expect(normalizeToAlpha("EU 48")).toBe("M");
    expect(normalizeToAlpha("US L")).toBe("L");
  });
});

describe("pointRange — turning a one-value-per-size chart into ranges", () => {
  // Patagonia men's shape: "S 37in · M 40in · L 44in".
  const rows = [
    { label: "S", chest: 37 },
    { label: "M", chest: 40 },
    { label: "L", chest: 44 },
  ];

  it("puts the boundaries at the midpoints to the neighbours", () => {
    // The reading the chart is written for: pick the nearest size. Every input
    // is the brand's; only the boundary rule is ours, and it is stated.
    expect(pointRange(rows, 1, "chest")).toEqual([38.5, 42]);
  });

  it("extends the end rows outward by their own half-step", () => {
    // A degenerate zero-width range at the extremes would claim we know the ends
    // far more precisely than the middle, which is backwards.
    expect(pointRange(rows, 0, "chest")).toEqual([35.5, 38.5]);
    expect(pointRange(rows, 2, "chest")).toEqual([42, 46]);
  });

  it("never leaves a gap or an overlap between consecutive sizes", () => {
    // Each size's upper bound is the next one's lower bound, so no body chest
    // falls between two sizes or into both.
    for (let i = 0; i < rows.length - 1; i++) {
      expect(pointRange(rows, i, "chest")![1]).toBe(pointRange(rows, i + 1, "chest")![0]);
    }
  });

  it("says only what it knows for a single-row chart", () => {
    expect(pointRange([{ label: "M", chest: 40 }], 0, "chest")).toEqual([40, 40]);
  });

  it("returns null for a row with no point value", () => {
    expect(pointRange([{ label: "M", chestMin: 39, chestMax: 41 }], 0, "chest")).toBeNull();
  });
});

describe("Patagonia — captured by hand, because its edge refuses every automated client", () => {
  const mens = BRAND_CHARTS.find((c) => c.brand === "Patagonia" && c.gender === "mens")!;
  const womens = BRAND_CHARTS.find((c) => c.brand === "Patagonia" && c.gender === "womens")!;

  it("records that a person read it, not a fetch", () => {
    expect(mens.capturedBy).toBe("manual");
    expect(womens.capturedBy).toBe("manual");
  });

  it("keeps the men's numbers as printed — one chest per size, no range", () => {
    expect(mens.rows.find((r) => r.label === "M")!.chest).toBe(40);
    expect(mens.rows.find((r) => r.label === "L")!.chest).toBe(44);
    expect(mens.rows.every((r) => r.chestMin === undefined)).toBe(true);
  });

  it("keeps the women's numbers as printed — a stated range per letter", () => {
    // Women's lists two numeric sizes under each letter, so the range is the
    // chart's own rather than derived.
    const m = womens.rows.find((r) => r.label === "M")!;
    expect([m.chestMin, m.chestMax]).toEqual([36.5, 37.5]);
  });

  it("gives men's and women's genuinely different ladders at the same letter", () => {
    // The reason chartFor refuses to answer without a known gender.
    const m = chartToSizes(mens).find((s) => s.label === "M")!;
    const w = chartToSizes(womens).find((s) => s.label === "M")!;
    expect(m.bodyChestMinCm).toBeGreaterThan(w.bodyChestMaxCm!);
  });
});
