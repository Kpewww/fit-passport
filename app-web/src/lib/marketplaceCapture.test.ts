// @vitest-environment jsdom
//
// Chinese marketplace product pages (Tmall / Taobao / JD) — Session 79a.
//
// Found on a real Tmall item (captured by the founder, kept local): the extension
// said "No product details" and the server named the brand "Detail" (from the
// host detail.tmall.com) and the product "Detail T-shirt". These pages publish no
// JSON-LD, no og:title and no <h1>. What they do have:
//   • the name in <title>, with a marketplace suffix ("…-tmall.com天猫");
//   • a 参数信息 list of label/value pairs (品牌, 适用性别, 材质成分 …) whose class
//     names are hashed, so it is found by its LABELS, never by class;
//   • size buttons under a "尺码" label, as elements with a title attribute;
//   • a picture-only description (图文详情).
// And one hazard: the size section shows the SHOPPER'S OWN profile ("我的档案：
// 177 厘米 69 公斤") beside the chart. That is the user's data, not the product's.
//
// This fixture is written by hand in that shape — no retailer content is copied.

import { beforeAll, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { cleanTitle, parsePage, SIZE_LABEL_RE, TITLE_SUFFIX_RE, ATTR_LABELS } from "./pageParse";
import { extractFromUrl } from "./extractor";

type Found = {
  title: string;
  productData: boolean;
  attrs: number;
  brand: string;
  sizeTables: number;
  sizeRows: number;
  sizeOptions: number;
  chartImages: number;
  pictureDescription: boolean;
};
type Capture = { ok: boolean; url: string; html: string; found: Found; stats: Record<string, number | string> };
type FpCapture = ((doc: Document, loc: { href: string }) => Capture) & {
  SIZE_LABEL_RE: RegExp;
  TITLE_SUFFIX_RE: RegExp;
  ATTR_LABELS: string[];
};

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
let fpCapture: FpCapture;
beforeAll(() => {
  new Function(readFileSync(join(REPO, "browser-extension", "capture.js"), "utf8"))();
  fpCapture = (globalThis as unknown as { fpCapture: FpCapture }).fpCapture;
});

const ITEM_URL = "https://detail.tmall.com/item.htm?id=1234567890&spm=a1.b2.c3&skuId=42";

const TMALL = `<!doctype html><html><head>
<title>夏季纯棉短袖T恤男宽松休闲半袖上衣-tmall.com天猫</title>
</head><body>
<div class="siteNav--a1B2c3"><span>tb_买家0001，欢迎回来</span><a>我的淘宝</a><a>购物车 3</a></div>
<div class="picGallery--Z9x8">
  <div class="tabs--W7v6"><span>视频</span><span>图集</span><span>参数</span><span>尺码</span></div>
  <div class="thumbs--U5t4"><span>1</span><span>2</span><span>4</span><span>¥</span><span>168</span><span>108</span><span>4.9</span></div>
</div>
<div class="skuItem--Q1w2E3">
  <div class="labelWrap--R4t5Y6"><span title="颜色">颜色</span></div>
  <div class="skuValueWrap--U7i8O9"><div class="valueItem--P0a1S2"><span title="深蓝色">深蓝色</span></div></div>
</div>
<div class="skuItem--Q1w2E3">
  <div class="labelWrap--R4t5Y6"><span title="尺码">尺码</span>
    <span class="sizeInfoRecommendGroup--D3f4"><span>和您身材相似的买家购买了</span><span>XL</span></span></div>
  <div class="skuValueWrap--U7i8O9">
    <div class="valueItem--P0a1S2"><span title="M">M</span></div>
    <div class="valueItem--P0a1S2"><span title="L">L</span></div>
    <div class="valueItem--P0a1S2"><span title="XL">XL</span></div>
  </div>
  <div class="skuSummary--N3m2"><span class="summaryGroup--B5v6"><span class="summaryKey--C7x8">衣长:</span><span class="summaryValue--D9z0">72.5cm</span></span></div>
</div>
<div class="skuItem--Q1w2E3"><div class="labelWrap--R4t5Y6"><span>数量</span></div><input value="1"></div>
<div data-value="item"></div>
<div class="tabDetailItem--G5h6">
  <p>参数信息</p>
  <div class="generalParamsInfoItem--J7k8"><div class="generalParamsInfoItemTitle--L9z0" title="品牌">品牌</div><div class="generalParamsInfoItemSubTitle--X1c2" title="示例牌">示例牌</div></div>
  <div class="generalParamsInfoItem--J7k8"><div class="generalParamsInfoItemTitle--L9z0" title="适用性别">适用性别</div><div class="generalParamsInfoItemSubTitle--X1c2" title="男士">男士</div></div>
  <div class="generalParamsInfoItem--J7k8"><div class="generalParamsInfoItemTitle--L9z0" title="材质成分">材质成分</div><div class="generalParamsInfoItemSubTitle--X1c2" title="棉100%">棉100%</div></div>
  <div class="generalParamsInfoItem--J7k8"><div class="generalParamsInfoItemTitle--L9z0" title="版型分类">版型分类</div><div class="generalParamsInfoItemSubTitle--X1c2" title="宽松型">宽松型</div></div>
  <div class="generalParamsInfoItem--J7k8"><div class="generalParamsInfoItemTitle--L9z0" title="货号">货号</div><div class="generalParamsInfoItemSubTitle--X1c2" title="AB-123">AB-123</div></div>
  <div class="generalParamsInfoItem--J7k8"><div class="generalParamsInfoItemTitle--L9z0" title="吊牌价">吊牌价</div><div class="generalParamsInfoItemSubTitle--X1c2" title="178元">178元</div></div>
  <div class="generalParamsInfoItem--J7k8"><div class="generalParamsInfoItemTitle--L9z0" title="尺码">尺码</div><div class="generalParamsInfoItemSubTitle--X1c2" title="M L XL">M L XL</div></div>
</div>
<div class="tabDetailItem--G5h6">
  <p>尺码信息</p>
  <div class="sizeInfo--V3b4">
    <div class="sizeInfoTopBar--A2s3"><div>和您身材相似的买家购买了 XL</div>
      <div class="sizeInfoProfile--K1j2"><span>我的档案：177 厘米 69 公斤</span><button aria-label="切换尺码档案">切换</button></div></div>
    <div class="sizeInfoBlock--F4g5"><div class="optionLineItem--H6j7"><div class="optionLineLabel--K8l9">版型</div>
      <div class="optionLineRight--M0n1"><div class="optionLineTrack--P2q3"></div><div class="optionLineOptions--R4s5">
        <span class="optionLineOption--T6u7">紧身</span><span class="optionLineOption--T6u7">修身</span><span class="optionLineOption--T6u7">常规</span>
        <span class="optionLineOption--T6u7 optionLineOptionActive--V8w9">宽松</span><span class="optionLineOption--T6u7">超宽</span>
      </div></div></div></div>
    <table><tr><td>身高/体重</td><td>50-65</td><td>66-80</td></tr><tr><td>171-175</td><td>M</td><td>L</td></tr><tr><td>176-180</td><td>L</td><td>XL</td></tr></table>
    <table>
      <tr><th>尺码</th><th>身高</th><th>体重</th><th>肩宽</th><th>胸围</th><th>袖长</th><th>衣长</th></tr>
      <tr><td>M</td><td>160-180</td><td>50-65</td><td>46</td><td>109</td><td>19.5</td><td>69.5</td></tr>
      <tr><td>L</td><td>160-185</td><td>65-80</td><td>48</td><td>114</td><td>20</td><td>71</td></tr>
      <tr><td>XL</td><td>165-185</td><td>75-90</td><td>50</td><td>119</td><td>20.5</td><td>72.5</td></tr>
    </table>
  </div>
</div>
<div class="tabDetailItem--G5h6"><p>图文详情</p>
  <img src="https://img.example.test/d1.jpg" width="790" height="1200">
  <img src="https://img.example.test/d2.jpg" width="790" height="1200">
  <img src="https://img.example.test/d3.jpg" width="790" height="1200">
  <img src="https://img.example.test/d4.jpg" width="790" height="1200">
</div>
</body></html>`;

function capture(html: string, href = ITEM_URL): Capture {
  return fpCapture(new DOMParser().parseFromString(html, "text/html"), { href });
}

describe("a Tmall item page, read by the extension", () => {
  it("finds the product details in the parameter list, by label", () => {
    const cap = capture(TMALL);
    expect(cap.found.productData).toBe(true);
    expect(cap.found.brand).toBe("示例牌");
    expect(cap.found.title).toBe("夏季纯棉短袖T恤男宽松休闲半袖上衣");
  });

  it("sends only allowlisted attributes — never an item number or a price", () => {
    const { html } = capture(TMALL);
    expect(html).toContain("示例牌");
    expect(html).toContain("男士");
    expect(html).not.toContain("AB-123");
    expect(html).not.toContain("178元");
  });

  it("reads a fit scale as its marked option, and never a measurement as an attribute", () => {
    // Both found on the real page: the 版型 scale (紧身 … 超宽, this product marked
    // 宽松) was sent as all five words, and the selected size's "衣长: 72.5cm"
    // from the size picker was sent as if it were a product fact.
    const { html } = capture(TMALL);
    expect(html).toContain("<dt>版型</dt><dd>宽松</dd>");
    expect(html).not.toMatch(/<dd>[^<]*紧身/); // the scale's words may be context; never the value
    expect(html).not.toContain("<dt>衣长</dt>");
    expect(html).toContain("<dt>版型分类</dt><dd>宽松型</dd>");
  });

  it("never sends the shopper's own size profile shown beside the chart", () => {
    const { html } = capture(TMALL);
    for (const s of ["我的档案", "177", "69 公斤", "身材相似", "tb_买家0001", "购物车"]) expect(html).not.toContain(s);
  });

  it("keeps the measurement chart and not the height/weight lookup", () => {
    const cap = capture(TMALL);
    expect(cap.found.sizeTables).toBe(1);
    expect(cap.found.sizeRows).toBe(3);
    expect(cap.html).not.toContain("身高/体重");
  });

  it("lists the size buttons under the 尺码 label, and counts only size-shaped values", () => {
    const cap = capture(TMALL);
    expect(cap.found.sizeOptions).toBe(3);
    expect(cap.html).not.toContain('data-size="item"');
  });

  it("is not fooled by a gallery tab also labelled 尺码, next to prices and a rating", () => {
    // The real page's FIRST "尺码" is the image gallery's tab; climbing from it
    // collected "4.9", "168", "108" … as sizes.
    const { html } = capture(TMALL);
    for (const v of ["4.9", "168", "108", "1", "2", "4"]) expect(html).not.toContain(`data-size="${v}"`);
  });

  it("notices a description made of pictures", () => {
    expect(capture(TMALL).found.pictureDescription).toBe(true);
  });

  it("says nothing about pictures on an ordinary shop page with a photo gallery", () => {
    // Nearly every product page has large photos; only a marketplace listing
    // (one with a parameter list) puts its whole description in pictures.
    const shop = `<html><head><title>Oxford Shirt</title></head><body><h1>Oxford Shirt</h1>
      ${'<img src="https://img.example.test/g.jpg" width="1200" height="1500">'.repeat(5)}</body></html>`;
    expect(capture(shop, "https://shop.test/p/oxford").found.pictureDescription).toBe(false);
  });
});

describe("the same page, read by the server", () => {
  it("names the product, its brand, gender and garment from the page", () => {
    const parsed = parsePage(capture(TMALL).html);
    expect(parsed.productName).toBe("夏季纯棉短袖T恤男宽松休闲半袖上衣");
    expect(parsed.brand).toBe("示例牌");
    expect(parsed.gender).toBe("mens");
    expect(parsed.material).toBe("棉100%");
    expect(parsed.sizes?.map((s) => [s.label, s.chestCm])).toEqual([["M", 109], ["L", 114], ["XL", 119]]);
  });

  it("never invents a brand from a marketplace's host name", () => {
    const e = extractFromUrl(ITEM_URL);
    expect(e.brand).toBe("");
    expect(e.retailer).toBe("Tmall");
    expect(e.productName).not.toMatch(/detail/i);
  });
});

describe("titles and genders the marketplaces write", () => {
  it("strips the marketplace from the title", () => {
    expect(cleanTitle("纯棉T恤男-tmall.com天猫")).toBe("纯棉T恤男");
    expect(cleanTitle("纯棉T恤男-淘宝网")).toBe("纯棉T恤男");
    expect(cleanTitle("纯棉T恤男【行情 报价 价格 评测】-京东")).toBe("纯棉T恤男");
    expect(cleanTitle("Oxford Shirt for Men | Testmark")).toBe("Oxford Shirt for Men | Testmark");
  });

  it("reads 男/女 written after the garment, and 男女同款 as unisex", () => {
    const g = (title: string) => parsePage(`<title>${title}</title>`).gender;
    expect(g("短袖T恤男宽松")).toBe("mens");
    expect(g("冰丝T恤女夏季")).toBe("womens");
    expect(g("情侣装T恤男女同款")).toBe("unisex");
  });

  it("prefers the parameter list's 适用性别 over the title", () => {
    const html = `<title>T恤女</title><dl data-fp="attrs"><dt>适用性别</dt><dd>男女通用</dd></dl>`;
    expect(parsePage(html).gender).toBe("unisex");
  });
});

describe("drift — the capture agrees with the server parser", () => {
  it("shares the size-label shape, the title suffixes and the attribute allowlist", () => {
    expect(String(fpCapture.SIZE_LABEL_RE)).toBe(String(SIZE_LABEL_RE));
    expect(String(fpCapture.TITLE_SUFFIX_RE)).toBe(String(TITLE_SUFFIX_RE));
    expect(fpCapture.ATTR_LABELS).toEqual(ATTR_LABELS);
  });
});
