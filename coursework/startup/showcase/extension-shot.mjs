// The extension on a real product page, for the poster and the video (Session 99).
//
// The browser loads browser-extension/ as it is. The popup is opened as a page of the
// extension, and its one lookup of "the active tab" is pointed at the product's tab;
// everything else runs as a shopper would see it: capture.js reads the page in the
// browser, the popup shows what it found, "Check" sends it, the answer is drawn.
// It talks to a local dev server with a made-up body (capture.mjs), not production.
//
//   node extension-shot.mjs [productUrl] [outDir]

import { chromium } from "playwright";
import { mkdirSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { cpSync, readFileSync, writeFileSync } from "node:fs";

// A throwaway copy of the extension that may also read the product's site. The real
// one gets that right only when a person clicks its toolbar icon ("activeTab"), which
// automation cannot do; nothing else in the copy differs (same key, so the same ID).
const SRC = new URL("../../../browser-extension", import.meta.url).pathname;
const EXT = mkdtempSync(join(tmpdir(), "fp-ext-copy-"));
cpSync(SRC, EXT, { recursive: true });
const EXT_ID = "odbdhmcfjbhikmlfmgafbkkbknkkaecp"; // from manifest.json "key"
const API = "http://localhost:3000";
const PRODUCT = process.argv[2] ?? "https://www.uniqlo.com/us/en/products/E474244-000/00";
const OUT = process.argv[3] ?? new URL("./out/shots/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
{
  const m = JSON.parse(readFileSync(join(EXT, "manifest.json"), "utf8"));
  m.host_permissions = [...(m.host_permissions ?? []), `${new URL(process.argv[2] ?? "https://www.uniqlo.com/").origin}/*`];
  writeFileSync(join(EXT, "manifest.json"), JSON.stringify(m, null, 2));
}
const BODY = { heightCm: 178, weightKg: 74, sex: "male", chestCm: 98, waistCm: 84, hipCm: 98, shoulderCm: 45, preferredFit: "regular", region: "US" };

const ctx = await chromium.launchPersistentContext(mkdtempSync(join(tmpdir(), "fp-show-")), {
  channel: "chromium",
  headless: process.env.HEADED ? false : true,
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 3,
  args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`],
});
try {
  // The account: the demo closet and a made-up body, on the local server.
  const site = await ctx.newPage();
  await site.goto(API + "/", { waitUntil: "domcontentloaded" });
  await site.evaluate(async (body) => {
    await fetch("/api/demo", { method: "POST" });
    const prof = (await (await fetch("/api/profile")).json()).profile ?? {};
    await fetch("/api/profile", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...prof, ...body }) });
  }, BODY);

  const page = await ctx.newPage();
  const resp = await page.goto(PRODUCT, { waitUntil: "domcontentloaded", timeout: 60000 });
  console.log("product page", resp?.status(), await page.title());
  await page.waitForTimeout(8000);
  await page.screenshot({ path: OUT + "product-page.png" });

  // The popup, as its own page, with "the active tab" meaning the product's tab. The
  // lookup is replaced once the page has loaded, then the language switch (which
  // re-reads the page) runs it again with the product's tab.
  const pop = await ctx.newPage();
  await pop.setViewportSize({ width: 360, height: 640 });
  await pop.goto(`chrome-extension://${EXT_ID}/popup.html`);
  await pop.waitForTimeout(1500);
  await pop.evaluate(() => localStorage.setItem("fp-origin", "http://localhost:3000"));
  // The product's tab in front: it is now the window's active tab, which is what the
  // popup asks for. The language switch re-reads it (popup.js start()).
  await page.bringToFront();
  await pop.evaluate(() => {
    const b = [...document.querySelectorAll("button")];
    b.find((x) => x.value === "zh")?.click();
    b.find((x) => x.value === "en")?.click();
  });
  await pop.waitForTimeout(6000);
  // The store build has no server picker; hide the developer one.
  await pop.addStyleTag({ content: ".foot select, .foot label:has(select){display:none!important}" }).catch(() => {});
  const content = async () => pop.evaluate(() => Math.ceil(Math.max(...[...document.body.children].map((e) => e.getBoundingClientRect().bottom))) + 8);
  await pop.screenshot({ path: OUT + "popup-found.png", clip: { x: 0, y: 0, width: 340, height: await content() } });
  await pop.evaluate(() => [...document.querySelectorAll("button")].find((x) => /check/i.test(x.textContent || ""))?.click());
  await pop.waitForTimeout(9000);
  await pop.screenshot({ path: OUT + "popup-result.png", clip: { x: 0, y: 0, width: 340, height: await content() } });
  console.log("popup:", (await pop.locator("body").innerText()).replace(/\s+/g, " ").slice(0, 300));
} finally {
  await ctx.close();
}
