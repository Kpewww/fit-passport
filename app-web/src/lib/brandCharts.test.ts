import { describe, it, expect } from "vitest";
import {
  BRAND_CHARTS,
  CM_PER_INCH,
  chartAgeDays,
  chartFor,
  chartToSizes,
  inToCm,
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
    expect(chartFor("www.patagonia.com", "jacket", "mens")).toBeNull();
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
