// Capture a brand's published size chart, for review before it enters the library.
//
// WHY THIS IS A SCRIPT AND NOT PART OF THE APP. Measured 2026-09-08: retailers'
// bot protection detects headless automation, and the configuration that gets
// through — a real browser with a real window — needs a display. Serverless
// functions have no display, so the variant we could deploy is exactly the
// variant that is refused. Runtime scraping of protected retailers is therefore
// not available to the server at any price, and this tool exists to do the same
// job ONCE, offline, with a person reading the result.
//
// It also does not decide anything. It prints what the page showed and stops.
// A human still has to answer the two questions the library refuses to guess:
// are these BODY or GARMENT measurements, and which of the tables on the page is
// the one for this gender and garment type. Both are routinely ambiguous — the
// Patagonia product-page modal carries several tables at once.
//
// Needs playwright, which is deliberately NOT a project dependency:
//   npx playwright install chromium
//
// Usage:
//   node scripts/capture-chart.mjs <size-guide-url> [--click] [--json out.json]
//
//   --click   also look for a "size guide / size chart" control and press it,
//             for product pages that keep the chart behind a modal.
//
// Example:
//   node scripts/capture-chart.mjs https://www.patagonia.com/guides/size-fit/mens/

import { chromium } from "playwright";
import { writeFileSync } from "node:fs";

const args = process.argv.slice(2);
const url = args.find((a) => a.startsWith("http"));
const doClick = args.includes("--click");
const jsonAt = args.includes("--json") ? args[args.indexOf("--json") + 1] : null;

if (!url) {
  console.error("usage: node scripts/capture-chart.mjs <url> [--click] [--json out.json]");
  process.exit(1);
}

// headless:false is load-bearing, not a debugging leftover — see the header.
const browser = await chromium.launch({ headless: false });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

const readTables = () =>
  page.evaluate(() => {
    const fromDoc = (d) =>
      [...d.querySelectorAll("table")].map((t) => ({
        rows: [...t.querySelectorAll("tr")]
          .map((tr) =>
            [...tr.querySelectorAll("th,td")].map((c) =>
              c.innerText.trim().replace(/\s+/g, " "),
            ),
          )
          .filter((r) => r.some(Boolean)),
      }));
    let out = fromDoc(document);
    for (const f of document.querySelectorAll("iframe")) {
      try { out = out.concat(fromDoc(f.contentDocument)); } catch { /* cross-origin */ }
    }
    return out.filter((t) => t.rows.length > 1);
  });

try {
  console.log(`\nopening ${url}`);
  const resp = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
  console.log(`HTTP ${resp?.status()}`);
  await page.waitForTimeout(7000); // these pages hydrate well after DOMContentLoaded

  let tables = await readTables();

  if (doClick && tables.length === 0) {
    const label = await page.evaluate(() => {
      const el = [...document.querySelectorAll("a,button,[role=button]")].find((e) =>
        /size (guide|chart)|size & fit|fit guide|size info/i.test(e.textContent || ""),
      );
      if (!el) return null;
      el.click();
      return (el.textContent || "").trim().slice(0, 40);
    });
    console.log(label ? `clicked: "${label}"` : "no size-guide control found");
    if (label) {
      await page.waitForTimeout(6000);
      tables = await readTables();
    }
  }

  // Provenance the library requires, gathered while we are here.
  const context = await page.evaluate(() => {
    const txt = document.body.innerText;
    const hit = (re) => (txt.match(re) || [])[0]?.replace(/\s+/g, " ").trim() ?? null;
    return {
      title: document.title,
      // The sentence that answers "body or garment?" — the one thing a human
      // must confirm and the library will not infer.
      kindHint:
        hit(/.{0,80}body measurements.{0,80}/i) ??
        hit(/.{0,80}garment measurements.{0,80}/i) ??
        hit(/.{0,80}(measured flat|laid flat).{0,80}/i),
      unitHint: /\d\s*(in\b|")/.test(txt) ? "inches present" : /\d\s*cm\b/.test(txt) ? "cm present" : "no unit seen",
    };
  });

  console.log(`\ntitle      : ${context.title}`);
  console.log(`units      : ${context.unitHint}`);
  console.log(`body/garment hint: ${context.kindHint ?? "NOT STATED — do not guess; leave the brand out"}`);
  console.log(`tables     : ${tables.length}\n`);

  tables.forEach((t, i) => {
    console.log(`--- table ${i} (${t.rows.length} rows) ---`);
    for (const r of t.rows) console.log("  " + r.join(" | "));
    console.log("");
  });

  if (tables.length === 0) {
    console.log("Nothing to capture. Either the chart is an image, or it is behind a");
    console.log("control this script did not find. Try --click, or read it by eye.");
  } else {
    console.log("NEXT: pick the table for the gender + garment type you want, then add an");
    console.log("entry to src/lib/brandCharts.ts with the numbers EXACTLY as printed,");
    console.log(`sourceUrl "${url}", capturedAt "${new Date().toISOString().slice(0, 10)}",`);
    console.log(`and capturedBy "manual". Do not convert units by hand.`);
  }

  if (jsonAt) {
    writeFileSync(jsonAt, JSON.stringify({ url, capturedAt: new Date().toISOString().slice(0, 10), context, tables }, null, 2));
    console.log(`\nwrote ${jsonAt}`);
  }
} finally {
  await browser.close();
}
