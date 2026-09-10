import { describe, expect, it } from "vitest";
import { parsePage, parseSizeTables, parseSizeLabels, parseChineseSizeCode, findSizeChartImages, looksBlocked, inferGender } from "./pageParse";

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

  it("collapses a measurement range to its midpoint", () => {
    const html = `<table>
      <tr><th>Size</th><th>Chest</th></tr>
      <tr><td>S</td><td>96-100</td></tr>
      <tr><td>M</td><td>100-104</td></tr>
    </table>`;
    const sizes = parseSizeTables(html)!;
    expect(sizes[0].chestCm).toBe(98);
    expect(sizes[1].chestCm).toBe(102);
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
