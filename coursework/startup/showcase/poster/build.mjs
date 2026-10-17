// Render the poster: a vector PDF at 24 × 36 in, and PNG previews (Session 99).
//
//   node build.mjs            → ../out/Fit-Passport-Poster-24x36.pdf, .png (150 dpi), -preview.png
//
// Playwright is resolved from ../node_modules (a local symlink, not committed). The
// page loads Fraunces and Inter from Google Fonts, so it needs a network connection.

import { chromium } from "playwright";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const here = new URL(".", import.meta.url).pathname;
const out = new URL("../out/", import.meta.url).pathname;
mkdirSync(out, { recursive: true });

// The mark inline, so it takes the header's colour (its path is fill="currentColor").
const mark = readFileSync(here + "assets/fp-mark.svg", "utf8").replace(/<\?xml[^>]*>/, "").replace(/<title[^>]*>[^<]*<\/title>/, "");
const html = readFileSync(here + "poster.html", "utf8").replace("{{FP_MARK}}", mark);
const page_ = here + ".poster.built.html";
writeFileSync(page_, html);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 2304, height: 3456 } });
await page.goto("file://" + page_, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.pdf({ path: out + "Fit-Passport-Poster-24x36.pdf", width: "24in", height: "36in", printBackground: true, pageRanges: "1" });
// 150 dpi: 3600 × 5400.
const big = await browser.newPage({ viewport: { width: 2304, height: 3456 }, deviceScaleFactor: 150 / 96 });
await big.goto("file://" + page_, { waitUntil: "networkidle" });
await big.evaluate(() => document.fonts.ready);
await big.screenshot({ path: out + "Fit-Passport-Poster-24x36.png" });
// A small preview, the size someone walking past sees it from a few metres.
const small = await browser.newPage({ viewport: { width: 2304, height: 3456 }, deviceScaleFactor: 0.25 });
await small.goto("file://" + page_, { waitUntil: "networkidle" });
await small.evaluate(() => document.fonts.ready);
await small.screenshot({ path: out + "Fit-Passport-Poster-preview.png" });
await browser.close();
console.log("poster written to", out);
