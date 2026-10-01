// Make the Chrome Web Store images: three 1280×800 screenshots per language and
// the 440×280 promo tile, into docs/store/.
//
// The popup in them is the real one — popup.html, popup.js, i18n.js — loaded in
// Chromium with the unpacked extension, answering from a local Fit Passport
// (`next start -p 3000`, the extension's development server). The product page is
// a real capture (Patagonia, app-web/eval/local/captures) served at its own address,
// so capture.js runs on it as it would in the shop. Only the popup's "which tab is
// active" plumbing is stubbed — a popup opened as a tab is its own active tab — and
// it is a copy of the extension with config.js as the store build has it (no
// "Save this capture"), still pointing at the local server; its server footer
// is hidden, as the store build hides it (one server).
//
// No retailer imagery: the shop page never appears, only its name as text in the
// popup (principle: brands as text).
//
//   node docs/store/make-images.mjs            (from the repo root; needs playwright)

import { createRequire } from "node:module";
import { cpSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const { chromium } = createRequire(join(ROOT, "app-web", "package.json"))("playwright");
const OUT = join(ROOT, "docs", "store");
// A copy of the extension as the store ships it, apart from the server list.
const EXT = mkdtempSync(join(tmpdir(), "fp-store-ext-"));
cpSync(join(ROOT, "browser-extension"), EXT, { recursive: true });
writeFileSync(join(EXT, "config.js"), readFileSync(join(EXT, "config.js"), "utf8").replace(/^\s*captureTool: true,\r?\n/m, ""));
const EXT_ID = "odbdhmcfjbhikmlfmgafbkkbknkkaecp";
const SITE = "http://localhost:3000";
const CAPTURE = JSON.parse(readFileSync(join(ROOT, "app-web", "eval", "local", "captures", "patagonia-better-sweater-mens.capture.json"), "utf8"));
// Fonts inline: a page made with setContent cannot load file:// fonts.
const font = (name) => "data:font/woff2;base64," + readFileSync(join(ROOT, "app-web", "src", "app", "fonts", name)).toString("base64");
const FRAUNCES = font("Fraunces.woff2");
const INTER = font("Inter.woff2");
const MARK = readFileSync(join(ROOT, "brand", "fit-passport-mark-reverse.svg"), "utf8");
const MARK_INK = readFileSync(join(ROOT, "brand", "fit-passport-mark-black-transparent.svg"), "utf8");

const CAPTIONS = {
  en: [
    ["answer", "Your size, on the page you're looking at", "One size and the reasons, weighed against the clothes that already fit you."],
    ["what-is-sent", "See what is sent — before anything is", "It reads only when you click, and only the product's title, size chart and size options."],
    ["save", "Save it for later, apart from your closet", "A to-buy list that never counts as clothes you own."],
  ],
  zh: [
    ["answer", "在正在看的商品页|直接给出尺码", "对照你已经合身的衣服，给出一个尺码和判断依据。"],
    ["what-is-sent", "发送什么|先给你看", "只在你点击时读取，只发送商品标题、尺码表和尺码选项。"],
    ["save", "先放进待购|和衣橱分开", "待购商品不会被当作你已拥有的衣服。"],
  ],
};

const ctx = await chromium.launchPersistentContext(mkdtempSync(join(tmpdir(), "fp-store-")), {
  headless: false,
  viewport: { width: 1280, height: 900 },
  args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`],
});

try {
  // A Fit Passport in this browser, with a fixed profile so the answer is stable.
  const site = await ctx.newPage();
  await site.goto(SITE + "/", { waitUntil: "networkidle" });
  await site.evaluate(() => fetch("/api/profile", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ sex: "male", chestCm: 102, waistCm: 86, shoulderCm: 46, preferredFit: "regular", region: "US" }),
  }));

  // The product page: the real capture, served at its own address.
  const shop = await ctx.newPage();
  await shop.route(CAPTURE.url + "*", (r) => r.fulfill({ contentType: "text/html; charset=utf-8", body: CAPTURE.html }));
  await shop.goto(CAPTURE.url, { waitUntil: "domcontentloaded" });
  await shop.addScriptTag({ content: readFileSync(join(EXT, "capture.js"), "utf8") });
  const cap = await shop.evaluate(() => globalThis.fpCapture(document, location));
  const shopTitle = await shop.title();

  for (const lang of ["en", "zh"]) {
    // Each language saves the product afresh, so its "Save" shot is the first save.
    await site.evaluate(async () => {
      const { items } = await (await fetch("/api/saved")).json();
      for (const it of items ?? []) await fetch(`/api/saved?id=${encodeURIComponent(it.id)}`, { method: "DELETE" });
    });
    const shots = {};
    const popup = await ctx.newPage();
    await popup.setViewportSize({ width: 340, height: 600 });
    await popup.addInitScript(({ cap, url, title, lang }) => {
      try { localStorage.setItem("fp-origin", "http://localhost:3000"); localStorage.setItem("fp-lang", lang); } catch (e) {}
      const wire = () => {
        chrome.tabs.query = async () => [{ id: 4242, url, title }];
        chrome.scripting.executeScript = async (o) => (o.files ? [] : [{ result: cap }]);
        chrome.tabs.create = async () => {};
      };
      if (globalThis.chrome && chrome.tabs) wire(); else document.addEventListener("DOMContentLoaded", wire);
    }, { cap, url: CAPTURE.url, title: shopTitle, lang });
    await popup.goto(`chrome-extension://${EXT_ID}/popup.html`);
    await popup.addStyleTag({ content: "footer.foot{display:none !important}" });
    await popup.waitForTimeout(800);
    const shoot = async () => (await popup.locator("body").screenshot({ type: "png" })).toString("base64");
    const click = async (name) => { await popup.getByRole("button", { name, exact: true }).click(); await popup.waitForTimeout(1500); };
    const L = lang === "zh"
      ? { show: "看看具体会发送什么", check: "查看推荐", save: "加入待购", confirm: "保存" }
      : { show: "Show exactly what would be sent", check: "Check my size", save: "Save to buy", confirm: "Save" };

    await popup.locator("summary", { hasText: L.show }).click();
    await popup.waitForTimeout(300);
    shots["what-is-sent"] = await shoot();
    await popup.locator("summary", { hasText: L.show }).click();
    await click(L.check);
    shots.answer = await shoot();
    await click(L.save);
    await click(L.confirm);
    shots.save = await shoot();
    await popup.close();

    // Compose each screenshot: caption on the left, the popup on the right.
    const page = await ctx.newPage();
    await page.setViewportSize({ width: 1280, height: 800 });
    for (const [key, title, line] of CAPTIONS[lang]) {
      await page.setContent(`<!doctype html><html lang="${lang === "zh" ? "zh-CN" : "en"}"><head><style>
        @font-face { font-family: Fraunces; src: url(${FRAUNCES}); }
        @font-face { font-family: Inter; src: url(${INTER}); }
        html, body { margin: 0; width: 1280px; height: 800px; }
        body { background: #F3F3F1; display: grid; grid-template-columns: 1fr 460px; align-items: center; gap: 56px; padding: 0 96px 0 104px; box-sizing: border-box; font-family: Inter, "PingFang SC", "Microsoft YaHei", sans-serif; color: #17181c; }
        .mark { width: 44px; height: 41px; } .mark svg { width: 100%; height: 100%; }
        .brand { display: flex; align-items: center; gap: 12px; font-family: Fraunces, serif; font-size: 22px; }
        h1 { font-family: Fraunces, "Songti SC", "Noto Serif SC", serif; font-weight: 600; font-size: ${lang === "zh" ? 52 : 56}px; line-height: 1.12; letter-spacing: ${lang === "zh" ? 0 : -0.02}em; margin: 36px 0 20px; text-wrap: balance; }
        .clause { display: inline-block; } .gap { word-spacing: 0.25em; }
        p { font-size: 20px; line-height: 1.55; color: #4c4e57; margin: 0; max-width: 30em; }
        .frame { justify-self: center; background: #fff; border-radius: 18px; box-shadow: 0 24px 60px rgba(23,24,28,.14), 0 2px 6px rgba(23,24,28,.06); border: 1px solid #E2E3E7; overflow: hidden; }
        .frame img { display: block; width: 400px; }
      </style></head><body>
        <div><div class="brand"><span class="mark">${MARK_INK}</span><span lang="en">Fit Passport</span></div><h1>${title.split("|").map((c) => `<span class="clause">${c}</span>`).join('<span class="gap"> </span>')}</h1><p>${line}</p></div>
        <div class="frame"><img src="data:image/png;base64,${shots[key]}"></div>
      </body></html>`);
      await page.waitForTimeout(400);
      await page.screenshot({ path: join(OUT, `screenshot-${CAPTIONS.en.findIndex((c) => c[0] === key) + 1}-${key}-${lang}.png`) });
    }
    await page.close();
  }

  // The small promo tile.
  const tile = await ctx.newPage();
  await tile.setViewportSize({ width: 440, height: 280 });
  await tile.setContent(`<!doctype html><html lang="en"><head><style>
    @font-face { font-family: Fraunces; src: url(${FRAUNCES}); }
    @font-face { font-family: Inter; src: url(${INTER}); }
    html, body { margin: 0; width: 440px; height: 280px; }
    body { background: #17181c; color: #F3F3F1; display: flex; flex-direction: column; justify-content: center; padding: 0 40px; box-sizing: border-box; font-family: Inter, sans-serif; }
    .mark { width: 54px; height: 51px; } .mark svg { width: 100%; height: 100%; }
    h1 { font-family: Fraunces, serif; font-weight: 600; font-size: 40px; letter-spacing: -0.02em; margin: 18px 0 8px; }
    p { margin: 0; font-size: 16px; color: rgba(243,243,241,.7); }
    em { font-style: italic; font-family: Fraunces, serif; color: #6f7cf0; font-size: 18px; }
  </style></head><body><span class="mark">${MARK}</span><h1>Fit Passport</h1><p>Your size at every store, <em>with the reason.</em></p></body></html>`);
  await tile.waitForTimeout(400);
  await tile.screenshot({ path: join(OUT, "promo-tile-440x280.png") });
  console.log("wrote 6 screenshots and the promo tile to docs/store/");
} finally {
  await ctx.close();
}
