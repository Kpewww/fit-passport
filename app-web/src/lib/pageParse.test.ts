import { describe, expect, it } from "vitest";
import { detectMeasurementKind, parsePage, parseSizeTables, parseSizeLabels, parseChineseSizeCode, findSizeChartImages, looksBlocked, inferGender } from "./pageParse";

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
