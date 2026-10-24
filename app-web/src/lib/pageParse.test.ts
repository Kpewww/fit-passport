import { describe, expect, it } from "vitest";
import { detectMeasurementKind, parsePage, parseSizeChart, parseSizeGrid, parseSizeTables, parseSizeLabels, parseChineseSizeCode, findSizeChartImages, looksBlocked, inferGender, siteNameAsBrand } from "./pageParse";

describe("pageParse — JSON-LD", () => {
  it("reads brand/name/material from a schema.org Product block", () => {
    const html = `<html><head>
      <script type="application/ld+json">
      {"@context":"https://schema.org","@type":"Product","name":"Fitz Roy Down Hoody",
       "brand":{"@type":"Brand","name":"Patagonia"},"material":"Recycled nylon"}
      </script></head><body>...</body></html>`;
    const p = parsePage(html);
    expect(p.brand).toBe("Patagonia");
    expect(p.productName).toBe("Fitz Roy Down Hoody");
    expect(p.material).toBe("Recycled nylon");
  });

  it("finds Product inside an @graph array", () => {
    const html = `<script type="application/ld+json">
      {"@graph":[{"@type":"WebPage"},{"@type":"Product","name":"Oxford Shirt","brand":"COS"}]}
    </script>`;
    const p = parsePage(html);
    expect(p.productName).toBe("Oxford Shirt");
    expect(p.brand).toBe("COS");
  });

  it("survives a malformed JSON-LD block and falls back to OpenGraph", () => {
    const html = `<script type="application/ld+json">{ this is broken </script>
      <meta property="og:title" content="Broken but OG works"/>
      <meta property="product:brand" content="Uniqlo"/>`;
    const p = parsePage(html);
    expect(p.productName).toBe("Broken but OG works");
    expect(p.brand).toBe("Uniqlo");
  });
});

describe("pageParse — gender inference", () => {
  it("prefers women over men (women contains 'men')", () => {
    expect(inferGender("Women's Wool Coat")).toBe("womens");
    expect(inferGender("Men's Oxford Shirt")).toBe("mens");
    expect(inferGender("Unisex Hoodie")).toBe("unisex");
    expect(inferGender("女装 羊毛大衣")).toBe("womens");
  });
});

describe("pageParse — size tables", () => {
  it("parses a chart with sizes as ROWS and cm measurements", () => {
    const html = `<table>
      <tr><th>Size</th><th>Chest</th><th>Waist</th><th>Shoulder</th></tr>
      <tr><td>S</td><td>96</td><td>80</td><td>43</td></tr>
      <tr><td>M</td><td>100</td><td>84</td><td>44</td></tr>
      <tr><td>L</td><td>104</td><td>88</td><td>46</td></tr>
    </table>`;
    const sizes = parseSizeTables(html)!;
    expect(sizes.map((s) => s.label)).toEqual(["S", "M", "L"]);
    expect(sizes[1]).toMatchObject({ label: "M", chestCm: 100, waistCm: 84, shoulderCm: 44 });
  });

  it("parses a chart with sizes as COLUMNS", () => {
    const html = `<table>
      <tr><td>Measurement</td><td>S</td><td>M</td><td>L</td></tr>
      <tr><td>Chest (cm)</td><td>96</td><td>100</td><td>104</td></tr>
      <tr><td>Sleeve</td><td>62</td><td>63</td><td>64</td></tr>
    </table>`;
    const sizes = parseSizeTables(html)!;
    expect(sizes.map((s) => s.label)).toEqual(["S", "M", "L"]);
    expect(sizes[2]).toMatchObject({ label: "L", chestCm: 104, sleeveCm: 64 });
  });

  it("converts an inch chart to cm (chest ~38in → ~96.5cm)", () => {
    const html = `<table>
      <tr><th>Size</th><th>Chest</th></tr>
      <tr><td>S</td><td>38</td></tr>
      <tr><td>M</td><td>40</td></tr>
      <tr><td>L</td><td>42</td></tr>
    </table>`;
    const sizes = parseSizeTables(html)!;
    expect(sizes[0].chestCm).toBeCloseTo(96.5, 0);
    expect(sizes[2].chestCm).toBeCloseTo(106.7, 0);
  });

  it("reads a range per size as a body chart, not as a garment's midpoint", () => {
    // This test used to assert chestCm 98 and 102 — a garment reading of a range.
    // A garment has ONE chest measurement; a range per size says who the size is
    // for, which is a body chart (Session 75c). Read as a garment, the engine adds
    // the wearer's ease on top and lands a size too big — the Session 73 bug again.
    const html = `<table>
      <tr><th>Size</th><th>Chest</th></tr>
      <tr><td>S</td><td>96-100</td></tr>
      <tr><td>M</td><td>100-104</td></tr>
    </table>`;
    const sizes = parseSizeTables(html)!;
    expect(sizes.map((s) => s.chestCm)).toEqual([undefined, undefined]);
    expect(sizes[0]).toMatchObject({ bodyChestMinCm: 96, bodyChestMaxCm: 100 });
    expect(sizes[1]).toMatchObject({ bodyChestMinCm: 100, bodyChestMaxCm: 104 });
  });

  it("reads a Chinese-language chart (胸围/腰围/肩宽)", () => {
    const html = `<table>
      <tr><th>尺码</th><th>胸围</th><th>腰围</th><th>肩宽</th></tr>
      <tr><td>M</td><td>100</td><td>84</td><td>44</td></tr>
      <tr><td>L</td><td>104</td><td>88</td><td>46</td></tr>
    </table>`;
    const sizes = parseSizeTables(html)!;
    expect(sizes[0]).toMatchObject({ label: "M", chestCm: 100, waistCm: 84, shoulderCm: 44 });
  });

  it("ignores a non-size table (no measurement headers, no size labels)", () => {
    const html = `<table>
      <tr><th>Feature</th><th>Detail</th></tr>
      <tr><td>Care</td><td>Machine wash</td></tr>
      <tr><td>Origin</td><td>Portugal</td></tr>
    </table>`;
    expect(parseSizeTables(html)).toBeNull();
  });

  it("picks the richest chart when several tables exist", () => {
    const html = `
      <table><tr><th>Size</th><th>Chest</th></tr><tr><td>S</td><td>96</td></tr><tr><td>M</td><td>100</td></tr></table>
      <table><tr><th>Size</th><th>Chest</th><th>Waist</th></tr>
        <tr><td>S</td><td>96</td><td>80</td></tr><tr><td>M</td><td>100</td><td>84</td></tr><tr><td>L</td><td>104</td><td>88</td></tr></table>`;
    const sizes = parseSizeTables(html)!;
    expect(sizes).toHaveLength(3); // the second, richer table wins
  });
});

describe("pageParse — full page merge", () => {
  it("combines JSON-LD identity with an on-page size table", () => {
    const html = `
      <script type="application/ld+json">{"@type":"Product","name":"Wool Coat","brand":"COS"}</script>
      <meta property="og:description" content="A relaxed wool coat."/>
      <h1>Women's Wool Coat</h1>
      <table>
        <tr><th>Size</th><th>Chest</th><th>Length</th></tr>
        <tr><td>S</td><td>98</td><td>110</td></tr>
        <tr><td>M</td><td>102</td><td>112</td></tr>
      </table>`;
    const p = parsePage(html);
    expect(p.brand).toBe("COS");
    expect(p.productName).toBe("Wool Coat");
    expect(p.gender).toBe("womens");
    expect(p.fitNotes).toBe("A relaxed wool coat.");
    expect(p.sizes).toHaveLength(2);
    expect(p.sizes![1]).toMatchObject({ label: "M", chestCm: 102, lengthCm: 112 });
  });
});


describe("pageParse — offered size labels (no chart)", () => {
  it("reads sizes from a size-labelled <select>", () => {
    const html = `<select name="size" id="size">
      <option value="">Choose a size</option>
      <option>S</option><option>M</option><option>L</option><option>XL</option>
    </select>`;
    expect(parseSizeLabels(html).sort()).toEqual(["L", "M", "S", "XL"]);
  });

  it("reads sizes from data-size swatch attributes", () => {
    const html = `<div>
      <button data-size="S">S</button><button data-size="M">M</button><button data-size="L">L</button>
    </div>`;
    expect(parseSizeLabels(html).sort()).toEqual(["L", "M", "S"]);
  });

  it("ignores placeholder options and non-size selects", () => {
    const html = `<select name="color"><option>Red</option><option>Blue</option></select>`;
    expect(parseSizeLabels(html)).toEqual([]);
  });
});

describe("pageParse — bot-block detection", () => {
  it("flags 403/429/503 regardless of body", () => {
    expect(looksBlocked(403, "<html>ok</html>")).toBe(true);
    expect(looksBlocked(429, "")).toBe(true);
    expect(looksBlocked(503, "")).toBe(true);
  });
  it("flags CAPTCHA / challenge bodies on a 200", () => {
    expect(looksBlocked(200, "<html><body>Please verify you are a human. captcha</body></html>")).toBe(true);
    expect(looksBlocked(200, "<html>cf-challenge platform</html>".replace("platform","challenge-platform"))).toBe(true);
    expect(looksBlocked(200, "<html>请完成安全验证</html>")).toBe(true);
  });
  it("does NOT flag a normal product page", () => {
    expect(looksBlocked(200, "<html><body><h1>Wool Coat</h1><table>...</table></body></html>")).toBe(false);
  });
  it("flags patagonia.com's bot-failover page, served with a 200", () => {
    // Measured 2026-09-30: the page's title became the product name ("Hang Tight!
    // Routing to checkout...") and the fetch was recorded as "ok".
    const page = `<!-- saved from url=(0055)file:///Users/x/Downloads/botfailover%20(5).html -->
      <html><head><title>Hang Tight! Routing to checkout...</title></head><body></body></html>`;
    expect(looksBlocked(200, page)).toBe(true);
  });
});

describe("pageParse — names and brands read from meta", () => {
  it("decodes hex character references (nike.com's og:title)", () => {
    const html = `<meta property="og:title" content="Nike Dri-FIT Legend Men&#x27;s Fitness T-Shirt">`;
    expect(parsePage(html).productName).toBe("Nike Dri-FIT Legend Men's Fitness T-Shirt");
  });
  it("decodes entities inside JSON-LD (eBay's names arrive as MEN&#039;S)", () => {
    const html = `<script type="application/ld+json">{"@type":"Product","name":"FREE PLANET MEN&#039;S FLANNEL SHIRT"}</script>`;
    expect(parsePage(html).productName).toBe("FREE PLANET MEN'S FLANNEL SHIRT");
  });
  it("takes a site that names itself by domain as the brand without the domain", () => {
    expect(siteNameAsBrand("Nike.com")).toBe("Nike");
    expect(siteNameAsBrand("www.everlane.com")).toBe("everlane");
    expect(siteNameAsBrand("J.Crew")).toBe("J.Crew");
    expect(siteNameAsBrand("Levi's")).toBe("Levi's");
    expect(siteNameAsBrand("Abercrombie & Fitch")).toBe("Abercrombie & Fitch");
  });
});


describe("pageParse — Chinese 号型 size codes", () => {
  it("parses height / girth / body-type from 160/84A", () => {
    expect(parseChineseSizeCode("160/84A")).toEqual({ heightCm: 160, girthCm: 84, bodyType: "A" });
  });
  it("handles no letter and spacing", () => {
    expect(parseChineseSizeCode(" 175 / 92 ")).toEqual({ heightCm: 175, girthCm: 92, bodyType: null });
  });
  it("rejects things that aren't size codes", () => {
    expect(parseChineseSizeCode("M")).toBeNull();
    expect(parseChineseSizeCode("2024/01")).toBeNull(); // girth 1 out of range
    expect(parseChineseSizeCode("EU 48")).toBeNull();
  });
});


describe("pageParse — size-chart image discovery", () => {
  const base = "https://shop.example.com/products/coat";
  it("finds a chart image by class and resolves a relative src to absolute", () => {
    const html = `<img class="size-chart" src="/img/chart.png"><img src="/img/hero.jpg">`;
    expect(findSizeChartImages(html, base)).toEqual(["https://shop.example.com/img/chart.png"]);
  });
  it("prefers data-src (lazy) over a placeholder src", () => {
    const html = `<img alt="尺码表" src="/placeholder.gif" data-src="//cdn.example.com/size.jpg">`;
    expect(findSizeChartImages(html, base)).toEqual(["https://cdn.example.com/size.jpg"]);
  });
  it("ranks a stronger chart token first", () => {
    const html = `
      <img src="/measurement-note.png" alt="measurement">
      <img src="/the-size-chart.png" alt="size-chart">`;
    const out = findSizeChartImages(html, base);
    expect(out[0]).toContain("the-size-chart.png");
    expect(out).toHaveLength(2);
  });
  it("ignores non-chart images and data: URIs", () => {
    const html = `<img src="/hero.jpg" alt="model"><img class="size-chart" src="data:image/gif;base64,AAAA">`;
    expect(findSizeChartImages(html, base)).toEqual([]);
  });
});

// Real-world table shapes that broke the parser. Each is reduced from a page we
// actually read, not invented.
describe("tableGrid — markup that shifts columns", () => {
  // patagonia.com's size-guide modal carries a commented-out <th> between two
  // real header cells. Counted as a cell, it shifts every column by one, so
  // chestCm silently takes the Waist column: a 100cm chest was recommended 3XL,
  // off a ladder that looked perfectly plausible.
  const PATAGONIA_SHAPE = `<table><thead>
    <tr><th><strong>Alpha Size</strong></th>
        <!-- <th width="15%"></th>-->
        <th><strong>Numeric Size</strong></th>
        <th><strong>Chest*</strong></th>
        <th><strong>Waist</strong></th>
        <th><strong>Hip**</strong></th></tr></thead><tbody>
    <tr><td>XS</td><td>28</td><td>36 in</td><td>28 in</td><td>35 in</td></tr>
    <tr><td>S</td><td>30</td><td>38 in</td><td>30 in</td><td>37 in</td></tr>
    <tr><td>M</td><td>32</td><td>40 in</td><td>32 in</td><td>39 in</td></tr>
    <tr><td>L</td><td>34</td><td>42 in</td><td>34 in</td><td>41 in</td></tr>
  </tbody></table>`;

  it("reads the column the header names, not its neighbour", () => {
    const sizes = parseSizeTables(PATAGONIA_SHAPE)!;
    expect(sizes).not.toBeNull();
    const m = sizes.find((s) => s.label === "M")!;
    expect(m.chestCm).toBe(101.6); // 40in — the Chest column
    expect(m.waistCm).toBe(81.3); //  32in — the Waist column
  });

  it("does not mistake the numeric-size column for a measurement", () => {
    // Here the numeric size and the waist happen to carry the same digits, which
    // is why the original bug was invisible in the output: every number looked
    // like a real measurement because it was one — just the wrong one.
    const sizes = parseSizeTables(PATAGONIA_SHAPE)!;
    const xs = sizes.find((s) => s.label === "XS")!;
    expect(xs.chestCm).toBe(91.4); // 36in, NOT 28
  });

  it("ignores a fully commented-out row", () => {
    const html = `<table>
      <tr><th>Size</th><th>Chest</th></tr>
      <!-- <tr><td>XXL</td><td>200</td></tr> -->
      <tr><td>S</td><td>96</td></tr>
      <tr><td>M</td><td>100</td></tr>
    </table>`;
    const sizes = parseSizeTables(html)!;
    expect(sizes.map((s) => s.label)).toEqual(["S", "M"]);
  });
});

describe("detectMeasurementKind", () => {
  it("believes a page that says its numbers describe the body", () => {
    // patagonia.com's own wording.
    expect(detectMeasurementKind("<p>Find your exact size using the body measurements below.</p>")).toBe("body");
    // nike.com's own wording.
    expect(detectMeasurementKind("<p>The measurements on the size chart are body measurements.</p>")).toBe("body");
  });

  it("believes a page that says its numbers are the garment laid flat", () => {
    expect(detectMeasurementKind("<p>All garment measurements are in cm.</p>")).toBe("garment");
    expect(detectMeasurementKind("<p>Measured flat across the chest.</p>")).toBe("garment");
    expect(detectMeasurementKind("<p>产品为平铺尺寸,误差1-2cm</p>")).toBe("garment");
  });

  it("says nothing when the page says nothing", () => {
    expect(detectMeasurementKind("<table><tr><td>M</td><td>100</td></tr></table>")).toBeNull();
  });

  it("refuses to choose when the page claims both", () => {
    // A page carrying both charts cannot be resolved by keyword, and guessing
    // would be worse than admitting it: the caller keeps the long-standing
    // garment reading and labels it unstated.
    expect(detectMeasurementKind("<p>body measurements</p><p>garment measurements</p>")).toBeNull();
  });

  it("does not treat 'how to measure yourself' as a body chart", () => {
    // It appears beside flat-measurement charts just as often — you measure
    // yourself either way.
    expect(detectMeasurementKind("<h3>How to measure yourself</h3><p>Measure your chest.</p>")).toBeNull();
  });
});

describe("a body chart read off a page", () => {
  // Reduced from patagonia.com's size-guide modal: alpha and numeric sizes in one
  // table, so each letter spans two rows, and the page states the kind.
  const PATAGONIA = `<p>Find your exact size using the body measurements below.</p>
  <table>
    <tr><th>Alpha Size</th><th>Numeric Size</th><th>Chest*</th><th>Waist</th></tr>
    <tr><td>XS</td><td>28</td><td>36 in</td><td>28 in</td></tr>
    <tr><td>XS</td><td>29</td><td>37 in</td><td>29 in</td></tr>
    <tr><td>S</td><td>30</td><td>38 in</td><td>30 in</td></tr>
    <tr><td>S</td><td>31</td><td>39 in</td><td>31 in</td></tr>
    <tr><td>M</td><td>32</td><td>40 in</td><td>32 in</td></tr>
    <tr><td>M</td><td>33</td><td>41 in</td><td>33 in</td></tr>
  </table>`;

  it("puts the numbers in the body-range fields, never in chestCm", () => {
    // THE ONE THAT MATTERS. Left in chestCm, the engine adds the wearer's ease on
    // top of a number that already IS the wearer, and every size from this page
    // comes out a step too big — measured end to end: XL for a 100cm chest.
    const sizes = parseSizeTables(PATAGONIA)!;
    for (const s of sizes) {
      expect(s.chestCm, `${s.label} must not claim a garment chest`).toBeUndefined();
      expect(s.bodyChestMinCm).toBeGreaterThan(0);
    }
  });

  it("folds the repeated letters into one size with the range the chart stated", () => {
    const sizes = parseSizeTables(PATAGONIA)!;
    expect(sizes.map((s) => s.label)).toEqual(["XS", "S", "M"]);
    const m = sizes.find((s) => s.label === "M")!;
    expect(m.bodyChestMinCm).toBe(101.6); // 40in
    expect(m.bodyChestMaxCm).toBe(104.1); // 41in
  });

  it("still reads a garment chart as garment measurements", () => {
    const flat = `<p>All measurements are garment measurements, measured flat.</p>
      <table>
        <tr><th>Size</th><th>Chest</th></tr>
        <tr><td>S</td><td>96</td></tr>
        <tr><td>M</td><td>100</td></tr>
        <tr><td>L</td><td>104</td></tr>
      </table>`;
    const sizes = parseSizeTables(flat)!;
    expect(sizes.find((s) => s.label === "M")!.chestCm).toBe(100);
    expect(sizes.find((s) => s.label === "M")!.bodyChestMinCm).toBeUndefined();
  });

  it("leaves an unstated chart on the reading it has always had", () => {
    // Changing the default would silently re-interpret every page ever parsed.
    const bare = `<table>
        <tr><th>Size</th><th>Chest</th></tr>
        <tr><td>S</td><td>96</td></tr>
        <tr><td>M</td><td>100</td></tr>
      </table>`;
    const sizes = parseSizeTables(bare)!;
    expect(sizes.find((s) => s.label === "M")!.chestCm).toBe(100);
  });

  it("keeps the page's word as the source when it agrees with the table's shape", () => {
    const html = `<p>These are body measurements.</p><table>
      <tr><th>Size</th><th>Chest</th></tr>
      <tr><td>S</td><td>96-100</td></tr><tr><td>M</td><td>100-104</td></tr><tr><td>L</td><td>104-108</td></tr>
    </table>`;
    expect(parsePage(html)).toMatchObject({ measurementKind: "body", measurementKindFrom: "page" });
  });

  it("gives a one-value-per-size body chart a band, not a zero-width range", () => {
    const points = `<p>These are body measurements.</p>
      <table>
        <tr><th>Size</th><th>Chest</th></tr>
        <tr><td>S</td><td>94</td></tr>
        <tr><td>M</td><td>100</td></tr>
        <tr><td>L</td><td>106</td></tr>
      </table>`;
    const sizes = parseSizeTables(points)!;
    const m = sizes.find((s) => s.label === "M")!;
    expect(m.bodyChestMinCm).toBe(97); // midway to S
    expect(m.bodyChestMaxCm).toBe(103); // midway to L
  });
});

// uniqlo.com's size guide, as the browser extension captured it on 2026-09-28:
// body measurements in inches, with fractions, and a line of site chrome that
// mentions "product measurements". It came back **L at 65% for a 100cm chest**;
// Uniqlo's own chart says M (100cm = 39.4in, inside M's 37 3/4–41). Two faults,
// both predating the extension, which was simply the first to deliver the page.
describe("an inch chart written with fractions (uniqlo.com, 2026-09-28)", () => {
  const UNIQLO = `<p>Compare all product measurements with previous purchases</p>
  <table>
    <tr><th>Size</th><th>Chest</th><th>Waist</th></tr>
    <tr><td>XS</td><td>31 1/2-34 3/4</td><td>26-28 1/4</td></tr>
    <tr><td>S</td><td>34 3/4-37 3/4</td><td>26 3/4-30</td></tr>
    <tr><td>M</td><td>37 3/4-41</td><td>30-33</td></tr>
    <tr><td>L</td><td>41-44</td><td>33-36 1/4</td></tr>
    <tr><td>XL</td><td>44-47 1/4</td><td>36 1/4-39 1/4</td></tr>
    <tr><td>XXL</td><td>47 1/4-50 1/2</td><td>39 1/4-42 1/2</td></tr>
    <tr><td>3XL</td><td>50 1/2-53 1/2</td><td>42 1/2-45 3/4</td></tr>
  </table>`;

  it("reads '31 1/2' as one number — so the ladder rises, and 100cm lands in M", () => {
    // Fault 1: the parser took "31" and "1" as the ends of the range, so XS was
    // (31 + 1) / 2 = 16 — and a column median that low sent the whole chart
    // through the inch conversion: XS "40.6cm", L "108", XXL "61".
    const sizes = parseSizeTables(UNIQLO)!;
    expect(sizes.map((s) => s.label)).toEqual(["XS", "S", "M", "L", "XL", "XXL", "3XL"]);
    const mins = sizes.map((s) => s.bodyChestMinCm!);
    for (let i = 1; i < mins.length; i++) expect(mins[i]).toBeGreaterThan(mins[i - 1]);
    const m = sizes.find((s) => s.label === "M")!;
    expect(m.bodyChestMinCm!).toBeLessThanOrEqual(100);
    expect(m.bodyChestMaxCm!).toBeGreaterThanOrEqual(100);
    expect(sizes.find((s) => s.label === "S")!.bodyChestMaxCm!).toBeLessThan(100);
    expect(sizes.find((s) => s.label === "L")!.bodyChestMinCm!).toBeGreaterThan(100);
    expect(sizes[0].bodyChestMinCm!).toBeCloseTo(80, 0); // 31 1/2 in
  });

  it("reads a range per size as body measurements, whatever the page's chrome says", () => {
    // Fault 2: "Compare all product measurements with previous purchases" is a
    // site feature, and it matched the garment pattern. The table's own shape —
    // a range for every size — is the stronger evidence, and it is recorded as
    // the source so the reader can see which one we relied on.
    const page = parsePage(UNIQLO);
    expect(page.measurementKind).toBe("body");
    expect(page.measurementKindFrom).toBe("table");
    for (const s of page.sizes!) expect(s.chestCm, `${s.label} is not a garment chest`).toBeUndefined();
  });

  it("reads the other ways charts write fractions", () => {
    const at = (cell: string) =>
      parseSizeTables(`<p>Garment measurements, measured flat.</p><table><tr><th>Size</th><th>Chest</th></tr>
        <tr><td>S</td><td>${cell}</td></tr><tr><td>M</td><td>40</td></tr><tr><td>L</td><td>42</td></tr></table>`)![0].chestCm;
    expect(at("38½")).toBeCloseTo(97.8, 1); // a Unicode fraction
    expect(at("38 1/2")).toBeCloseTo(97.8, 1);
    expect(at("38-1/2")).toBeCloseTo(97.8, 1); // hyphenated mixed number: one value, not a range
  });

  it("does not read a slash between two numbers as a fraction", () => {
    // "32/34" is a waist/inseam pair, or two sizes — never 0.94.
    const sizes = parseSizeTables(`<table><tr><th>Size</th><th>Chest</th><th>Waist</th></tr>
      <tr><td>S</td><td>96</td><td>30/32</td></tr><tr><td>M</td><td>100</td><td>32/34</td></tr>
      <tr><td>L</td><td>104</td><td>34/36</td></tr></table>`)!;
    expect(sizes.map((s) => s.waistCm)).toEqual([30, 32, 34]);
  });
});

describe("a ladder that shrinks as the sizes grow is not a size chart", () => {
  // Fail closed. The Uniqlo misread produced XS 40.6 · S 47 · M 50.8 · L 108 ·
  // XL 115.6 · XXL 61 · 3XL 64.8, and nothing noticed that the numbers went DOWN
  // as the sizes went up. A bigger size is never smaller (the monotonicity check
  // the size-recommendation literature uses as a sanity test); a chart that says
  // otherwise was misread, and no answer beats one built on it.
  it("rejects a chart whose measurements fall as the sizes rise", () => {
    const garbled = `<table><tr><th>Size</th><th>Chest</th></tr>
      <tr><td>S</td><td>96</td></tr><tr><td>M</td><td>100</td></tr><tr><td>L</td><td>104</td></tr>
      <tr><td>XL</td><td>90</td></tr><tr><td>XXL</td><td>112</td></tr></table>`;
    expect(parseSizeTables(garbled)).toBeNull();
  });

  it("accepts a chart printed largest-first, since the sizes still rise", () => {
    const descending = `<table><tr><th>Size</th><th>Chest</th></tr>
      <tr><td>XL</td><td>112</td></tr><tr><td>L</td><td>106</td></tr>
      <tr><td>M</td><td>100</td></tr><tr><td>S</td><td>94</td></tr></table>`;
    expect(parseSizeTables(descending)?.map((s) => s.label)).toEqual(["XL", "L", "M", "S"]);
  });
});

// A range written INSIDE a cell ("37.5–41") used to reach the fold already
// collapsed to its midpoint, so a body chart's range was rebuilt from neighbours'
// midpoints by `midpointBand` — replacing numbers the retailer had printed.
describe("a body chart keeps the ranges it printed", () => {
  // Shape of nike.com's men's tops chart: one row per size, a range per cell, and
  // the page's own statement of what the numbers are.
  const NIKE_SHAPE = `<p>The measurements on the size chart are body measurements.</p>
  <table>
    <tr><th>Size</th><th>Chest (in)</th><th>Waist (in)</th></tr>
    <tr><td>S</td><td>35 - 37.5</td><td>29 - 32</td></tr>
    <tr><td>M</td><td>37.5 - 41</td><td>32 - 35</td></tr>
    <tr><td>L</td><td>41 - 44</td><td>35 - 38</td></tr>
  </table>`;

  it("uses the stated chest range exactly, not a band rebuilt from midpoints", () => {
    const m = parseSizeTables(NIKE_SHAPE)!.find((s) => s.label === "M")!;
    expect(m.bodyChestMinCm).toBe(95.3); // 37.5 in, as printed
    expect(m.bodyChestMaxCm).toBe(104.1); // 41 in, as printed
  });

  it("puts a body chart's waist in the body-waist fields, never in the garment waistCm", () => {
    // THE ㊿ GUARD, one column over. A body waist in `waistCm` would get the
    // wearer's ease added on top of their own waist — which is why waist could not
    // reach the engine at all until it had somewhere body-shaped to go.
    const sizes = parseSizeTables(NIKE_SHAPE)!;
    for (const s of sizes) {
      expect(s.waistCm, `${s.label} must not claim a garment waist`).toBeUndefined();
      expect(s.bodyWaistMinCm).toBeGreaterThan(0);
    }
    const m = sizes.find((s) => s.label === "M")!;
    expect([m.bodyWaistMinCm, m.bodyWaistMaxCm]).toEqual([81.3, 88.9]); // 32–35 in
  });

  it("still reads a garment chart's waist as a garment waist", () => {
    const flat = `<p>Garment measurements, measured flat.</p>
      <table>
        <tr><th>Size</th><th>Chest</th><th>Waist</th></tr>
        <tr><td>S</td><td>96</td><td>84</td></tr>
        <tr><td>M</td><td>100</td><td>88</td></tr>
      </table>`;
    const m = parseSizeTables(flat)!.find((s) => s.label === "M")!;
    expect(m.waistCm).toBe(88);
    expect(m.bodyWaistMinCm).toBeUndefined();
  });
});

// A tabbed size guide keeps several charts in the DOM with all but one hidden.
// "Most rows wins" used to pick among them regardless, so a hidden chart could
// beat the one on screen. The extension marks each kept table's visibility.
describe("the chart the shopper can see beats a bigger hidden one", () => {
  const section = (visible: boolean, rows: string) =>
    `<section data-fp="chart" data-fp-visible="${visible ? "1" : "0"}"><table>
      <tr><th>Size</th><th>Chest</th></tr>${rows}</table></section>`;
  const row = (l: string, c: number) => `<tr><td>${l}</td><td>${c}</td></tr>`;

  // Hidden: a women's tab with MORE rows. Visible: the men's tab the user opened.
  const html =
    section(false, [row("XXS", 76), row("XS", 80), row("S", 84), row("M", 88), row("L", 92), row("XL", 96)].join("")) +
    section(true, [row("S", 96), row("M", 100), row("L", 104)].join(""));

  it("takes the visible chart even though the hidden one has more rows", () => {
    const sizes = parseSizeTables(html)!;
    expect(sizes.map((s) => s.label)).toEqual(["S", "M", "L"]);
    expect(sizes.find((s) => s.label === "M")!.chestCm).toBe(100);
  });

  it("still uses most-rows when nothing is marked (a server-fetched page)", () => {
    const plain = html.replace(/<section[^>]*>|<\/section>/g, "");
    expect(parseSizeTables(plain)!.length).toBe(6);
  });
});

describe("a seller's per-size height and weight (Session 100, todo 11)", () => {
  // The Tmall chart from marketplaceCapture.test.ts: garment measurements, plus the
  // height and weight the seller cuts each size for.
  const TMALL = `<table>
    <tr><th>尺码</th><th>身高</th><th>体重</th><th>肩宽</th><th>胸围</th><th>袖长</th><th>衣长</th></tr>
    <tr><td>M</td><td>160-180</td><td>50-65</td><td>46</td><td>109</td><td>19.5</td><td>69.5</td></tr>
    <tr><td>L</td><td>160-185</td><td>65-80</td><td>48</td><td>114</td><td>20</td><td>71</td></tr>
    <tr><td>XL</td><td>165-185</td><td>75-90</td><td>50</td><td>119</td><td>20.5</td><td>72.5</td></tr>
  </table>`;

  it("keeps each size's stated height and weight", () => {
    const sizes = parseSizeTables(TMALL)!;
    expect(sizes.map((s) => [s.label, s.bodyHeightMinCm, s.bodyHeightMaxCm, s.bodyWeightMinKg, s.bodyWeightMaxKg])).toEqual([
      ["M", 160, 180, 50, 65], ["L", 160, 185, 65, 80], ["XL", 165, 185, 75, 90],
    ]);
  });

  it("does not turn a garment chart into a body chart (the ranges are not measurements)", () => {
    const chart = parseSizeChart(TMALL)!;
    const m = chart.sizes.find((s) => s.label === "M")!;
    expect(m.chestCm).toBe(109);
    expect(m.bodyChestMinCm).toBeUndefined();
    expect(chart.kind).not.toBe("body");
  });

  it("reads 斤, whether stated or (for a Chinese column over 95) not", () => {
    const jin = TMALL.replace("<th>体重</th>", "<th>体重(斤)</th>").replace("50-65", "100-130").replace("65-80", "130-160").replace("75-90", "150-180");
    expect(parseSizeTables(jin)!.map((s) => [s.bodyWeightMinKg, s.bodyWeightMaxKg])).toEqual([[50, 65], [65, 80], [75, 90]]);
    const bare = jin.replace("<th>体重(斤)</th>", "<th>体重</th>");
    expect(parseSizeTables(bare)!.map((s) => [s.bodyWeightMinKg, s.bodyWeightMaxKg])).toEqual([[50, 65], [65, 80], [75, 90]]);
  });

  it("reads pounds and inches, and sizes laid out as columns", () => {
    const us = `<table>
      <tr><th>Size</th><th>S</th><th>M</th><th>L</th></tr>
      <tr><td>Chest</td><td>38</td><td>41</td><td>44</td></tr>
      <tr><td>Height (in)</td><td>64-67</td><td>67-70</td><td>70-73</td></tr>
      <tr><td>Weight (lbs)</td><td>120-150</td><td>150-180</td><td>180-210</td></tr>
    </table>`;
    const sizes = parseSizeTables(us)!;
    expect(sizes.map((s) => [s.label, s.bodyHeightMinCm, s.bodyHeightMaxCm])).toEqual([["S", 163, 170], ["M", 170, 178], ["L", 178, 185]]);
    expect(sizes.map((s) => s.bodyWeightMinKg)).toEqual([54.4, 68, 81.6]);
  });

  it("ignores a single height (often the model's), a fabric's weight and anything implausible", () => {
    const single = TMALL.replace("160-180", "175");
    expect(parseSizeTables(single)!.find((s) => s.label === "M")!.bodyHeightMinCm).toBeUndefined();
    const fabric = `<table><tr><th>Size</th><th>Chest</th><th>Weight (g)</th></tr>
      <tr><td>S</td><td>96</td><td>180-200</td></tr><tr><td>M</td><td>102</td><td>190-210</td></tr><tr><td>L</td><td>108</td><td>200-220</td></tr></table>`;
    expect(parseSizeTables(fabric)!.every((s) => s.bodyWeightMinKg == null)).toBe(true);
    const odd = TMALL.replace("160-180", "60-80");
    expect(parseSizeTables(odd)!.find((s) => s.label === "M")!.bodyHeightMinCm).toBeUndefined();
  });
});

describe("a chest given laid flat, as half the garment (Session 100)", () => {
  // The two CMU swag items. Numbers as published by resellers of the blanks:
  // Independent Trading Co. IND4000Z (hookgrip.com), Comfort Colors 1566 (merchize.com).
  const IND4000Z = `<table>
    <tr><th>Size</th><th>S</th><th>M</th><th>L</th><th>XL</th><th>2XL</th><th>3XL</th></tr>
    <tr><td>Body Length</td><td>28.5</td><td>29.5</td><td>30.5</td><td>31.5</td><td>32.5</td><td>33.5</td></tr>
    <tr><td>Chest Width (1/2)</td><td>21</td><td>23</td><td>24.5</td><td>26.5</td><td>27.5</td><td>28.5</td></tr>
  </table>`;
  const CC1566 = `<table>
    <tr><th>Size</th><th>Body Width</th><th>Body Length</th></tr>
    <tr><td>S</td><td>21</td><td>27.5</td></tr><tr><td>M</td><td>23</td><td>28.5</td></tr>
    <tr><td>L</td><td>25</td><td>29.5</td></tr><tr><td>XL</td><td>26.5</td><td>30.5</td></tr>
    <tr><td>2XL</td><td>28</td><td>31.5</td></tr><tr><td>3XL</td><td>29.5</td><td>32.5</td></tr>
  </table>`;

  it("doubles an inch half chest into the garment's circumference (IND4000Z)", () => {
    const chart = parseSizeChart(IND4000Z)!;
    expect(chart.sizes.map((s) => [s.label, s.chestCm])).toEqual([
      ["S", 106.7], ["M", 116.8], ["L", 124.5], ["XL", 134.6], ["2XL", 139.7], ["3XL", 144.8],
    ]);
    expect(chart.sizes[0].lengthCm).toBe(72.4);
    expect(chart.kind).toBe("garment");
  });

  it("reads 'Body Width' as the flat chest of the garment, not the wearer's body (CC 1566)", () => {
    const chart = parseSizeChart(CC1566)!;
    expect(chart.sizes.map((s) => s.chestCm)).toEqual([106.7, 116.8, 127, 134.6, 142.2, 149.9]);
    expect(chart.sizes.every((s) => s.bodyChestMinCm == null)).toBe(true);
    expect(chart.kind).toBe("garment");
  });

  it("doubles a centimetre half chest without taking it for inches", () => {
    const cm = `<table><tr><th>尺码</th><th>平铺胸围</th><th>衣长</th></tr>
      <tr><td>S</td><td>50</td><td>68</td></tr><tr><td>M</td><td>53</td><td>70</td></tr><tr><td>L</td><td>56</td><td>72</td></tr></table>`;
    expect(parseSizeTables(cm)!.map((s) => s.chestCm)).toEqual([100, 106, 112]);
  });

  it("leaves a whole chest, and a shoulder width, alone", () => {
    const whole = `<table><tr><th>Size</th><th>Chest</th><th>Shoulder Width</th></tr>
      <tr><td>S</td><td>96</td><td>43</td></tr><tr><td>M</td><td>102</td><td>45</td></tr><tr><td>L</td><td>108</td><td>47</td></tr></table>`;
    const sizes = parseSizeTables(whole)!;
    expect(sizes.map((s) => s.chestCm)).toEqual([96, 102, 108]);
    expect(sizes.map((s) => s.shoulderCm)).toEqual([43, 45, 47]);
  });
});

describe("the two CMU swag charts, as their pictures print them (Session 100)", () => {
  // Transcribed cell for cell from the PNGs on the iii swag form (2026-10-19).
  const COMFORT_COLORS_1566 = [
    ["Size", "Width (in)", "Length (in)", "Sleeve center back (in)", "Packaging (dz)"],
    ["S", "21", "27.5", "31.5", "2"], ["M", "23", "28.5", "33.5", "2"], ["L", "25", "29.5", "35.25", "2"],
    ["XL", "26.5", "30.5", "36.75", "2"], ["2XL", "28", "31.5", "38.25", "2"], ["3XL", "29.5", "32.5", "39.25", "2"],
  ];
  const IND4000Z = [
    ["DESCRIPTION", "XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL", "6XL"],
    ["BODY LENGTH FROM HPS", "27.5", "28.5", "29.5", "30.5", "31.5", "32.5", "33.5", "34", "34.5", "35"],
    ["CHEST WIDTH 1\" BELOW ARMHOLE", "20.5", "21", "23", "24.5", "26.5", "27.5", "28.5", "30", "31.5", "33"],
    ["SLEEVE LENGTH FROM CENTER BACK TO HEM", "34.5", "35.5", "36.5", "37.5", "38.5", "39.5", "40.5", "41", "41.5", "42"],
  ];

  it("reads a bare 'Width (in)' as the flat chest, and ignores the packaging", () => {
    const chart = parseSizeGrid(COMFORT_COLORS_1566, "")!;
    expect(chart.sizes.map((s) => [s.label, s.chestCm])).toEqual([
      ["S", 106.7], ["M", 116.8], ["L", 127], ["XL", 134.6], ["2XL", 142.2], ["3XL", 149.9],
    ]);
    expect(chart.sizes[0].lengthCm).toBe(69.9);
    expect(chart.kind).toBe("garment");
  });

  it("reads all ten sizes of the IND4000Z, XS to 6XL", () => {
    const chart = parseSizeGrid(IND4000Z, "")!;
    expect(chart.sizes.map((s) => s.label)).toEqual(["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL", "6XL"]);
    expect(chart.sizes.find((s) => s.label === "M")!.chestCm).toBe(116.8);
    expect(chart.sizes.find((s) => s.label === "6XL")!.chestCm).toBe(167.6);
    expect(chart.kind).toBe("garment");
  });

  it("still reads 'Shoulder width' as a shoulder", () => {
    const g = [["Size", "Chest", "Shoulder width"], ["S", "96", "43"], ["M", "102", "45"], ["L", "108", "47"]];
    expect(parseSizeGrid(g, "")!.sizes.map((s) => s.shoulderCm)).toEqual([43, 45, 47]);
  });
});

import { withoutCauseWording } from "./pageParse";

describe("a page's mission copy does not decide men's or women's (Session 103, Gap)", () => {
  it("drops cause wording before reading the prose", () => {
    const gap = "Classic T-Shirt. This product was made in a factory that invests in gender equality and women’s empowerment.";
    expect(inferGender(withoutCauseWording(gap))).toBeUndefined();
    expect(inferGender(withoutCauseWording("A women-owned studio. Men's crewneck tee."))).toBe("mens");
    expect(inferGender(withoutCauseWording("Women's relaxed shirt"))).toBe("womens");
  });
  it("the product's name outranks the page's prose", () => {
    const html = `<html><head><title>Men's Classic Tee | Gap</title></head><body><h1>Men's Classic Tee</h1><p>Supporting women and girls through RISE. Women's empowerment matters.</p></body></html>`;
    expect(parsePage(html).gender).toBe("mens");
  });
});

import { saysUnavailable } from "./pageParse";

describe("a page that says the product is gone (Session 103, Everlane)", () => {
  it("reads discontinued and delisted pages", () => {
    expect(saysUnavailable("Sorry, this item is no longer available. Shop similar styles.")).toBe(true);
    expect(saysUnavailable("This product has been discontinued.")).toBe(true);
    expect(saysUnavailable("很抱歉，该商品已停售")).toBe(true);
    expect(saysUnavailable("宝贝已下架")).toBe(true);
  });
  it("one size sold out is not the product gone", () => {
    expect(saysUnavailable("Size M — Sold out. Notify me when available.")).toBe(false);
    expect(saysUnavailable("Free returns on items within 30 days.")).toBe(false);
  });
  it("is carried on the parsed page", () => {
    expect(parsePage("<html><body><h1>The Organic Cotton Crew</h1><p>Sorry, this item is no longer available.</p></body></html>").unavailable).toBe(true);
    expect(parsePage("<html><body><h1>Tee</h1></body></html>").unavailable).toBeUndefined();
    const ld = `<script type="application/ld+json">{"@type":"Product","name":"Tee","offers":{"availability":"https://schema.org/Discontinued"}}</script>`;
    expect(parsePage(`<html><head>${ld}</head><body><h1>Tee</h1></body></html>`).unavailable).toBe(true);
  });
});
