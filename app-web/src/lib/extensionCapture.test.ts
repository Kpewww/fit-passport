// @vitest-environment jsdom
//
// The browser extension's page capture (browser-extension/capture.js), loaded
// into jsdom exactly as the popup injects it.
//
// The extension sends a REDUCED document — only the parts of a product page the
// server's parser reads — instead of the page. Two things have to be true for
// that to be safe:
//   1. Nothing the parser uses is lost. Checked as a round-trip property: for a
//      set of pages, the parser must read the capture exactly as it reads the
//      original. Plus drift tests: the constants the capture must share with
//      pageParse.ts are compared against pageParse.ts itself.
//   2. Nothing private goes with it. A logged-in page's greeting, cart, address,
//      form values, reviews, other scripts — none of it may appear in the capture.

import { beforeAll, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  CHART_IMG_TOKENS,
  KIND_PATTERNS,
  MEASURE_MAP,
  VISIBLE_CHART_ATTR,
  SIZE_SELECT_RE,
  detectMeasurementKind,
  findSizeChartImages,
  parsePage,
  parseSizeLabels,
  listingTexts,
} from "./pageParse";
import { readSeller } from "./sellerMeasurements";

type Capture = {
  ok: boolean;
  error?: string;
  url: string;
  html: string;
  stats: Record<string, number | string>;
  found: {
    title: string;
    productData: boolean;
    sizeTables: number;
    sizeRows: number;
    sizeOptions: number;
    chartImages: number;
    sizes: string[];
    selectedSize: string | null;
    specs: number;
    descFrame: string | null;
    gate: "login" | "paused" | null;
  };
};
type FpCapture = ((doc: Document, loc: { href: string }) => Capture) & {
  KIND_BODY: RegExp[];
  KIND_GARMENT: RegExp[];
  SIZE_SELECT_RE: RegExp;
  CHART_IMG_TOKENS: string[];
  MEASURE_RE: RegExp;
  VISIBLE_ATTR: string;
  measureLines: (doc: Document) => string[];
};

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
let fpCapture: FpCapture;

beforeAll(() => {
  // A classic script defining globalThis.fpCapture — the same file the popup
  // injects with chrome.scripting.executeScript.
  new Function(readFileSync(join(REPO, "browser-extension", "capture.js"), "utf8"))();
  fpCapture = (globalThis as unknown as { fpCapture: FpCapture }).fpCapture;
});

const URL_ = "https://shop.test/p/mens-oxford-shirt-a1";

function capture(html: string, href = URL_): Capture {
  return fpCapture(new DOMParser().parseFromString(html, "text/html"), { href });
}

// ---------------------------------------------------------------------------
// Pages
// ---------------------------------------------------------------------------

// A logged-in product page: body chart in a size-guide dialog, plus everything a
// real session puts around it.
const LOGGED_IN = `<!doctype html><html lang="en-US"><head>
<title>Oxford Shirt for Men | Testmark</title>
<meta property="og:title" content="Oxford Shirt for Men">
<meta property="og:description" content="A crisp cotton oxford, regular fit.">
<meta property="og:site_name" content="Testmark">
<meta name="viewport" content="width=device-width">
<script>window.__STATE__ = {"customer":{"name":"Jane Doe","email":"jane@example.com"}};</script>
<script type="application/ld+json">{"@context":"https://schema.org","@type":"Product","name":"Oxford Shirt","brand":{"@type":"Brand","name":"Testmark"},"material":"100% cotton","review":[{"@type":"Review","author":{"@type":"Person","name":"Reviewer Rachel"},"reviewBody":"Love it"}],"offers":{"@type":"Offer","price":"59.00"}}</script>
<script type="application/ld+json">{"@context":"https://schema.org","@type":"Organization","name":"Testmark Inc","telephone":"+1 212 555 0100"}</script>
<style>.x{color:red}</style>
</head><body>
<header><a href="/account">Hi, Jane Doe</a><div class="mini-cart">1 item · Deliver to 42 Wallaby Way, Sydney</div></header>
<main>
  <h1>Oxford Shirt</h1>
  <p class="price">$59</p>
  <select name="size" id="size"><option value="">Choose a size</option><option>S</option><option>M</option><option>L</option><option>XL</option></select>
  <dialog open aria-label="Size guide">
    <h2>Size guide</h2>
    <p>All measurements below are body measurements, in inches. Questions? Write to help@testmark.example or call 212-555-0100.</p>
    <table>
      <thead><tr><th>Size</th><th>Chest</th><th>Waist</th></tr></thead>
      <tbody>
        <tr><td>S</td><td>35-37</td><td>29-31</td></tr>
        <tr><td>M</td><td>38-40</td><td>32-34</td></tr>
        <tr><td>L</td><td>41-43</td><td>35-37</td></tr>
        <tr><td>XL</td><td>44-46</td><td>38-40</td></tr>
      </tbody>
    </table>
  </dialog>
  <section class="reviews"><h2>Reviews</h2><p>Reviewer Rachel: fits true to size</p></section>
  <section class="recs"><h2>You may also like</h2><a>Chino Pants</a></section>
  <form action="/checkout"><input name="email" value="jane@example.com"><input name="address" value="42 Wallaby Way">
    <select name="country"><option selected>Australia</option><option>Canada</option></select></form>
  <iframe src="https://ads.example/track"></iframe>
  <svg><text>icon</text></svg>
</main>
<footer>Contact: jane@example.com</footer>
</body></html>`;

// Chinese garment chart, sizes as columns, stated as flat (平铺) measurements.
const CHINESE = `<html><head><title>纯棉T恤</title></head><body>
<h1>男士纯棉圆领T恤</h1>
<div class="size-guide"><p>以下为平铺尺寸，单位厘米</p>
<table><tr><th>尺码</th><th>S</th><th>M</th><th>L</th></tr>
<tr><td>胸围</td><td>96</td><td>100</td><td>104</td></tr>
<tr><td>衣长</td><td>68</td><td>70</td><td>72</td></tr>
<tr><td>肩宽</td><td>42</td><td>44</td><td>46</td></tr>
</table></div>
</body></html>`;

// patagonia.com's product-page modal shape: a commented-out header cell, and
// each letter spanning two numeric sizes — and no body/garment sentence at all.
const PATAGONIA_MODAL = `<html><body><h1>Better Sweater Jacket</h1>
<div role="dialog" aria-modal="true"><h2>Size &amp; Fit</h2><table>
<tr><th>Size</th><!-- <th width="15%"> </th>--><th>Numeric</th><th>Chest</th><th>Waist</th></tr>
<tr><td>XS</td><td>34</td><td>34</td><td>28</td></tr>
<tr><td>XS</td><td>36</td><td>35</td><td>29</td></tr>
<tr><td>S</td><td>38</td><td>36.5</td><td>30</td></tr>
<tr><td>S</td><td>40</td><td>37.5</td><td>31</td></tr>
<tr><td>M</td><td>42</td><td>39</td><td>33</td></tr>
<tr><td>M</td><td>44</td><td>40</td><td>34</td></tr>
</table></div></body></html>`;

// A cm tab and a hidden inch tab of the same chart, and an order summary that is
// a table but not a size chart.
const TABS_AND_CART = `<html><body><h1>Linen Shirt</h1>
<section><h2>Size chart</h2>
  <div id="cm"><table><tr><th>Size</th><th>Chest (cm)</th></tr><tr><td>S</td><td>96</td></tr><tr><td>M</td><td>100</td></tr><tr><td>L</td><td>104</td></tr></table></div>
  <div id="in" hidden><table><tr><th>Size</th><th>Chest (in)</th></tr><tr><td>S</td><td>37.8</td></tr><tr><td>M</td><td>39.4</td></tr><tr><td>L</td><td>40.9</td></tr></table></div>
</section>
<aside class="cart"><table><tr><th>Item</th><th>Qty</th><th>Total</th></tr><tr><td>Linen Shirt</td><td>1</td><td>$79</td></tr></table></aside>
</body></html>`;

// The chart is only an image.
const IMAGE_CHART = `<html><body><h1>Linen Tee</h1>
<img src="/img/linen-tee-front.jpg" alt="Linen tee, front">
<img class="lazy" data-src="https://cdn.shop.test/charts/size-chart-tops.png?w=800&q=80" src="data:image/gif;base64,R0lGOD" alt="Size chart">
<p>${"Soft slub linen, garment dyed. ".repeat(10)}</p>
</body></html>`;

// Sizes only as swatch buttons.
const SWATCHES = `<html><body><h1>Crew Tee</h1>
<div class="swatches"><button data-value="S">S</button><button data-value="M">M</button><button data-value="L">L</button><button data-value="Navy">Navy</button></div>
<p>${"A heavyweight cotton tee. ".repeat(10)}</p>
</body></html>`;

// ---------------------------------------------------------------------------

describe("round trip — the server reads the capture exactly as it reads the page", () => {
  const cases: Array<[string, string, ("body" | "garment")?]> = [
    ["a logged-in page with a body chart in a dialog", LOGGED_IN],
    ["a Chinese flat-measurement chart, sizes as columns", CHINESE],
    ["the Patagonia modal shape, with the brand's convention as fallback", PATAGONIA_MODAL, "body"],
    ["two tabs of one chart beside an order summary", TABS_AND_CART],
    ["a chart that is only an image", IMAGE_CHART],
    ["sizes only as swatch buttons", SWATCHES],
  ];

  for (const [name, html, fallback] of cases) {
    it(name, () => {
      const cap = capture(html);
      expect(cap.ok).toBe(true);
      expect(parsePage(cap.html, fallback)).toEqual(parsePage(html, fallback));
      expect(detectMeasurementKind(cap.html)).toBe(detectMeasurementKind(html));
      expect(parseSizeLabels(cap.html)).toEqual(parseSizeLabels(html));
      expect(findSizeChartImages(cap.html, URL_)).toEqual(findSizeChartImages(html, URL_));
    });
  }

  it("the round trip is not vacuous: those pages do yield charts, kinds and labels", () => {
    expect(parsePage(capture(LOGGED_IN).html).sizes?.length).toBe(4);
    expect(detectMeasurementKind(capture(LOGGED_IN).html)).toBe("body");
    expect(detectMeasurementKind(capture(CHINESE).html)).toBe("garment");
    expect(parsePage(capture(PATAGONIA_MODAL).html, "body").sizes?.map((s) => s.label)).toEqual(["XS", "S", "M"]);
    expect(findSizeChartImages(capture(IMAGE_CHART).html, URL_)).toEqual([
      "https://cdn.shop.test/charts/size-chart-tops.png?w=800&q=80",
    ]);
    expect(parseSizeLabels(capture(SWATCHES).html)).toEqual(["S", "M", "L"]);
  });

  it("reads a chart inside an open shadow root, which no server fetch could see", () => {
    const doc = new DOMParser().parseFromString("<html><body><h1>Tee</h1><size-guide></size-guide></body></html>", "text/html");
    const host = doc.querySelector("size-guide")!;
    host.attachShadow({ mode: "open" }).innerHTML =
      "<table><tr><th>Size</th><th>Chest</th></tr><tr><td>S</td><td>96</td></tr><tr><td>M</td><td>100</td></tr></table>";
    const cap = fpCapture(doc, { href: URL_ });
    expect(parsePage(cap.html).sizes?.map((s) => s.chestCm)).toEqual([96, 100]);
  });
});

describe("privacy — only the product leaves the browser", () => {
  const cap = () => capture(LOGGED_IN);

  it("sends none of the session around the product", () => {
    const html = cap().html;
    for (const secret of [
      "Jane Doe", "Wallaby", "jane@example.com", "Australia", // greeting, cart, form values
      "Reviewer Rachel", "Love it", // reviews, in JSON-LD and on the page
      "__STATE__", "ads.example", "Chino Pants", // other scripts, iframes, recommendations
      "Testmark Inc", "212 555 0100", // non-product JSON-LD
    ]) {
      expect(html, `leaked: ${secret}`).not.toContain(secret);
    }
    for (const tag of ["<form", "<input", "<iframe", "<svg", "<style", "<header", "<footer"]) {
      expect(html, `leaked tag: ${tag}`).not.toContain(tag);
    }
  });

  it("keeps the one script the parser reads, cut to product keys", () => {
    const html = cap().html;
    expect(html.match(/application\/ld\+json/g)?.length).toBe(1);
    expect(html).toContain('"material":"100% cotton"');
    expect(html).not.toContain('"offers"');
  });

  it("masks contact details that sit inside the size guide itself", () => {
    const c = cap();
    expect(c.html).not.toContain("help@testmark.example");
    expect(c.html).not.toContain("212-555-0100");
    expect(c.html).toContain("[email]");
    expect(c.html).toContain("[phone]");
    expect(Number(c.stats.masked)).toBeGreaterThanOrEqual(2);
  });

  it("masks card-like numbers and Chinese mobile numbers, but never a size row", () => {
    const c = capture(`<html><body><div role="dialog"><p>Card 4111 1111 1111 1111 or 13812345678</p>
      <table><tr><th>Size</th><th>Chest</th></tr><tr><td>S</td><td>81 86 91 96 101 106</td></tr><tr><td>M</td><td>100</td></tr></table>
      </div></body></html>`);
    expect(c.html).not.toContain("4111");
    expect(c.html).not.toContain("13812345678");
    expect(c.html).toContain("81 86 91 96 101 106");
  });

  it("does not send a select that is not about size — quantity, country", () => {
    const c = capture(`<html><body><h1>Tee</h1>
      <select name="qty"><option>1</option><option>2</option></select>
      <select name="size"><option>S</option><option>M</option></select></body></html>`);
    expect(c.html.match(/<select/g)?.length).toBe(1);
    expect(c.html).not.toContain("<option>1</option>");
  });

  it("drops tracking parameters and the fragment from the address", () => {
    const c = capture(LOGGED_IN, "https://shop.test/p/shirt?color=navy&utm_source=mail&email=jane%40x.com&gclid=abc#reviews");
    expect(c.url).toBe("https://shop.test/p/shirt?color=navy");
    expect(c.stats.queryParamsDropped).toBe(3);
  });

  it("takes the body/garment sentence from its own element, not the text beside it", () => {
    // The first version cut ±100 characters out of the flattened page and carried
    // a cart drawer's address along with the sentence. This drawer is not inside
    // <header>, so only the element boundary protects it.
    const c = capture(`<html><body><h1>Tee</h1>
      <div class="mini-cart">Deliver to 9 Elm Street, Springfield</div>
      <p>These are body measurements.</p>
      <table><tr><th>Size</th><th>Chest</th></tr><tr><td>S</td><td>96</td></tr><tr><td>M</td><td>100</td></tr></table>
      </body></html>`);
    expect(detectMeasurementKind(c.html)).toBe("body");
    expect(c.html).not.toContain("Elm Street");
  });

  it("gives a size table that sits straight in the page no surrounding text", () => {
    // The first stretch of a whole page can be a greeting with a name in it.
    const c = capture(`<html><body><p>Welcome back, Jane Doe</p>
      <table><tr><th>Size</th><th>Chest</th></tr><tr><td>S</td><td>96</td></tr><tr><td>M</td><td>100</td></tr></table>
      </body></html>`);
    expect(c.html).not.toContain("Jane Doe");
    expect(c.found.sizeTables).toBe(1);
  });
});

describe("size of what is sent", () => {
  it("is a small fraction of a large page, and says so", () => {
    const bloat = `<div class="recs">${"<article><h3>Recommended jacket</h3><p>Lorem ipsum dolor sit amet.</p></article>".repeat(4000)}</div>`;
    const c = capture(LOGGED_IN.replace("</main>", `${bloat}</main>`));
    expect(c.ok).toBe(true);
    expect(Number(c.stats.domChars)).toBeGreaterThan(300_000);
    expect(Number(c.stats.payloadChars)).toBeLessThan(10_000);
  });

  it("caps the text kept around a size guide however long its instructions run", () => {
    const longGuide = LOGGED_IN.replace("<h2>Size guide</h2>", `<h2>Size guide</h2><p>${"How to measure. ".repeat(20_000)}</p>`);
    const c = capture(longGuide);
    expect(Number(c.stats.payloadChars)).toBeLessThan(10_000);
    // …and still carries the sentence that says what the chart measures.
    expect(detectMeasurementKind(c.html)).toBe("body");
  });

  it("refuses to build a payload the server would reject, rather than truncating a chart", () => {
    const rows = Array.from({ length: 40_000 }, (_, i) => `<tr><td>${i}</td><td>100</td></tr>`).join("");
    const c = capture(`<html><body><table><tr><th>Size</th><th>Chest</th></tr>${rows}</table></body></html>`);
    expect(c.ok).toBe(false);
    expect(c.error).toBe("too-large");
  });
});

describe("what the popup is told it found", () => {
  it("summarises the page before anything is sent", () => {
    const f = capture(LOGGED_IN).found;
    expect(f.title).toBe("Oxford Shirt");
    expect(f.productData).toBe(true);
    expect(f.sizeTables).toBe(1);
    expect(f.sizeRows).toBe(4);
    expect(f.sizeOptions).toBe(5); // "Choose a size" + S, M, L, XL — the server filters
  });

  it("offers the page's sizes for the save form, and the one the shopper chose (Session 80)", () => {
    const f = capture(LOGGED_IN).found;
    expect(f.sizes).toEqual(["S", "M", "L", "XL"]);
    const chosenSelect = capture(`<html><body><h1>Tee</h1><select name="size"><option>Choose a size</option><option>S</option><option selected>M</option></select></body></html>`).found;
    expect(chosenSelect.selectedSize).toBe("M");
    const chosenSwatch = capture(`<html><body><h1>Tee</h1>
      <div class="sizes"><button data-size="S" aria-pressed="false">S</button><button data-size="L" aria-pressed="true">L</button></div></body></html>`).found;
    expect(chosenSwatch.selectedSize).toBe("L");
  });

  it("reads an eBay listing's item specifics and notes its description frame — and nothing from other listings (Session 80)", () => {
    // The shape of a real eBay item page (2026-09-30): specifics as nested label and
    // value boxes, shipping rows among them, a related-items strip with OTHER
    // sellers' pit-to-pit widths, and the seller's description in an iframe.
    const spec = (k: string, v: string) =>
      `<div class="ux-labels-values"><div class="ux-labels-values__labels"><div class="c"><div><span>${k}</span></div></div></div>` +
      `<div class="ux-labels-values__values"><div class="c"><div><span>${v}</span></div></div></div></div>`;
    const c = capture(`<html><body><h1>Free Planet Men's Relaxed Fit Flannel Shirt Size L</h1>
      ${spec("Shipping:", "US $7.05 USPS Ground Advantage")}${spec("Chest Size", `25" Pit to Pit`)}${spec("Size", "L")}${spec("Sleeve Length", "Long Sleeve")}
      <iframe id="desc_ifr" src="https://itm.ebaydesc.com/itmdesc/236823744791?t=0"></iframe>
      <section class="related"><a>Simply Basic Womens Size Large Scrub Top Pit To Pit 26in (#117021693023)</a></section>
      </body></html>`, "https://www.ebay.com/itm/236823744791");
    expect(c.html).toContain('<dl data-fp="specs"><dt>Chest Size</dt><dd>25&quot; Pit to Pit</dd><dt>Size</dt><dd>L</dd><dt>Sleeve Length</dt><dd>Long Sleeve</dd></dl>');
    expect(c.html).not.toContain("Shipping");
    expect(c.html).not.toContain("26in");
    expect(c.found.descFrame).toBe("itm.ebaydesc.com");
    // And the server reads the seller's measurement back out of what was sent.
    expect(readSeller(listingTexts(c.html)).measurements).toEqual([expect.objectContaining({ field: "chest", value: 25, flat: true, source: "specs" })]);
  });

  it("reads only measurement lines from a seller's description, masked", () => {
    const doc = new DOMParser().parseFromString(`<html><body><p>Great flannel, barely worn!</p><p>Pit to pit: 22"<br>Length: 29"</p>
      <p>Questions? mail me at seller@example.com</p><p>Chest pocket, 2 buttons missing? No, all 8 buttons</p></body></html>`, "text/html");
    const lines = fpCapture.measureLines(doc);
    expect(lines).toEqual(['Pit to pit: 22"', 'Length: 29"', "Chest pocket, 2 buttons missing? No, all 8 buttons"]);
    expect(lines.join(" ")).not.toContain("@");
  });

  it("does not take a carousel's selected slide number for a size", () => {
    const f = capture(`<html><body><h1>Tee</h1>
      <div class="gallery"><button aria-selected="true">2</button></div>
      <select name="size"><option>Choose a size</option><option>S</option><option>M</option></select></body></html>`).found;
    expect(f.selectedSize).toBeNull();
    expect(capture(`<html><body><h1>Tee</h1><button aria-selected="true">3</button></body></html>`).found.selectedSize).toBeNull();
  });

  it("notices a sign-in page or Taobao's 访问异常提示 standing in for the product (Session 80f)", () => {
    // Both met on real Taobao items in a signed-in automated browser, 2026-09-30:
    // an item link redirected to sign-in, and an item page whose parameters and
    // 尺码信息 were replaced by the notice while its size buttons stayed.
    const login = capture(`<html lang="en"><head><title>登录</title></head><body></body></html>`, "https://login.taobao.com/havanaone/login/login.htm");
    expect(login.found.gate).toBe("login");
    const paused = capture(`<html><head><title>JOKAR&amp;JONNY美式复古水洗阔腿牛仔裤男-淘宝网</title></head><body>
      <div class="sku"><span>尺码</span><div><span title="S">S</span><span title="M">M</span></div></div>
      <div class="notice"><div>访问异常提示</div><div>系统检测到当前访问存在异常，商品详情页将在一段时间后自动恢复。</div></div></body></html>`,
      "https://item.taobao.com/item.htm?id=901079473341");
    expect(paused.found.gate).toBe("paused");
    expect(paused.found.sizes).toEqual(["S", "M"]); // still enough to save for later
    expect(paused.html).not.toContain("访问异常");
    // A hidden copy of the notice is not the page's state; a product page is not gated.
    expect(capture(`<html><body><h1>Tee</h1><div hidden><div>访问异常提示</div></div></body></html>`).found.gate).toBeNull();
    expect(capture(LOGGED_IN).found.gate).toBeNull();
  });

  it("marks a hidden tab's chart as not visible", () => {
    const html = capture(TABS_AND_CART).html;
    expect(html).toContain('data-fp-visible="1"');
    expect(html).toContain('data-fp-visible="0"');
    expect(html).not.toContain("$79"); // the order summary never goes
  });
});

// The capture carries its own copies of a few server rules (no build step, so it
// cannot import them). These fail the moment the two drift apart.
describe("pictures the shopper may pick as the chart (Session 83)", () => {
  type Pic = { url: string; thumb: string; chart: boolean };
  const pics = (html: string) => (capture(html).found as unknown as { pictures: Pic[] }).pictures;
  const PAGE = (imgs: string) => `<html><head><title>Shirt | eBay</title></head><body><h1>Shirt</h1>
    <header><img src="https://shop.test/logo-header.png" width="300" height="200"></header>
    <main>${imgs}</main>
    <form><img src="https://shop.test/in-form.png" width="300" height="200"></form></body></html>`;

  it("lists the page's sizeable pictures, full size, chart-named first — and sends none of them", () => {
    const html = PAGE(`
      <img src="https://i.ebayimg.com/images/g/AAA/s-l140.jpg" width="140" height="140">
      <img src="https://i.ebayimg.com/images/g/BBB/s-l140.jpg" alt="size chart" width="140" height="140">
      <img src="https://img.alicdn.com/imgextra/x/O1.jpg_400x400q90.jpg" width="400" height="400">
      <img src="https://shop.test/icon.png" width="24" height="24">
      <img src="https://shop.test/vector.svg" width="300" height="300">
      <img src="http://shop.test/plain-http.jpg" width="300" height="300">`);
    const list = pics(html);
    expect(list.map((p) => p.url)).toEqual([
      "https://i.ebayimg.com/images/g/BBB/s-l1600.jpg",
      "https://i.ebayimg.com/images/g/AAA/s-l1600.jpg",
      "https://img.alicdn.com/imgextra/x/O1.jpg",
    ]);
    expect(list[0].chart).toBe(true);
    expect(list[0].thumb).toBe("https://i.ebayimg.com/images/g/BBB/s-l140.jpg");
    // Not in the payload: picking is the only way an address leaves the browser.
    expect(capture(html).html).not.toContain("AAA");
  });

  it("takes the biggest srcset entry, and never a picture in the header, a form or a shopper's profile box", () => {
    const html = PAGE(`
      <section><div><div><img src="https://shop.test/p-small.jpg" srcset="https://shop.test/p-400.jpg 400w, https://shop.test/p-1200.jpg 1200w" width="400" height="400"></div></div></section>
      <div><span>我的档案</span><img src="https://shop.test/me.jpg" width="300" height="300"></div>`);
    expect(pics(html).map((p) => p.url)).toEqual(["https://shop.test/p-1200.jpg"]);
  });
});

describe("the main product picture, for adding to the closet (Session 88d)", () => {
  it("is the largest picture on screen, outside the header and a profile box, in CSS pixels", () => {
    const doc = new DOMParser().parseFromString(`<html><body><header><img id="logo" src="https://s.test/l.png"></header>
      <main><section><div><div><img id="small" src="https://s.test/a.jpg"></div></div></section>
      <section><div><div><img id="big" src="https://s.test/b.jpg"></div></div></section></main>
      <div><span>我的档案</span><img id="me" src="https://s.test/me.jpg"></div></body></html>`, "text/html");
    const rects: Record<string, [number, number, number, number]> = {
      logo: [0, 0, 1400, 900], small: [40, 120, 200, 260], big: [300, 100, 900, 1200], me: [0, 0, 1400, 900],
    };
    for (const [id, [l, t, r, b]] of Object.entries(rects)) {
      doc.getElementById(id)!.getBoundingClientRect = () => ({ left: l, top: t, right: r, bottom: b, width: r - l, height: b - t, x: l, y: t, toJSON() {} }) as DOMRect;
    }
    Object.defineProperty(doc, "defaultView", { value: { innerWidth: 1280, innerHeight: 800 } });
    const found = fpCapture(doc, { href: URL_ }).found as unknown as { mainPicture: { x: number; y: number; w: number; h: number; vw: number } | null };
    // "big" clipped to the 1280 × 800 viewport.
    expect(found.mainPicture).toEqual({ x: 300, y: 100, w: 600, h: 700, vw: 1280 });
  });
});

describe("drift — the capture agrees with the server parser", () => {
  it("looks for the same body/garment sentences", () => {
    expect(fpCapture.KIND_BODY.map(String)).toEqual(KIND_PATTERNS.body.map(String));
    expect(fpCapture.KIND_GARMENT.map(String)).toEqual(KIND_PATTERNS.garment.map(String));
  });

  it("marks visible tables with the attribute the parser reads", () => {
    // If these drift, the parser silently stops preferring the chart the shopper
    // was looking at and falls back to "most rows wins".
    expect(fpCapture.VISIBLE_ATTR).toBe(VISIBLE_CHART_ATTR);
  });

  it("recognises size selects and chart images the same way", () => {
    expect(String(fpCapture.SIZE_SELECT_RE)).toBe(String(SIZE_SELECT_RE));
    expect(fpCapture.CHART_IMG_TOKENS).toEqual(CHART_IMG_TOKENS);
  });

  it("keeps a table for every measurement header the parser can read", () => {
    // One sample per alternative in each MEASURE_MAP pattern: "arm\\s*length"
    // becomes "arm length". A new header added to the parser without the capture
    // learning it fails here instead of being silently dropped in the browser.
    const samples = MEASURE_MAP.flatMap(({ re }) =>
      re.source.split("|").map((alt) => alt.replace(/\\s[*+]/g, " ").replace(/\\/g, "")),
    );
    expect(samples.length).toBeGreaterThan(10);
    for (const sample of samples) {
      expect(fpCapture.MEASURE_RE.test(sample), `capture would drop a table headed "${sample}"`).toBe(true);
    }
  });
});
