// Run the extension's pipeline on real product pages and record what happened.
//
// For measurement and evaluation, not for users: a headed browser reading a
// handful of pages once, which is the curation use invariant (52) allows — the
// same arrangement as app-web/scripts/capture-chart.mjs. It never runs at check
// time and never runs on anyone's behalf.
//
// What it does, per page, in a FRESH logged-out profile:
//   1. loads the real unpacked extension (manifest pins the ID);
//   2. opens the page, waits for it to hydrate, optionally presses its
//      "Size guide" control (--click);
//   3. runs the extension's own capture.js on the live DOM;
//   4. sends the capture to /api/check FROM THE EXTENSION'S ORIGIN, with
//      credentials — the popup's exact request — so what is measured includes
//      whether Chrome sends the Fit Passport session cookie;
//   5. records the capture's numbers and the API's answer.
// The test user is given a fixed profile first (chest 100 cm, waist 86, shoulder
// 46, regular fit), so answers depend on the page and not on a regional guess.
//
// Needs playwright (not a project dependency) and its bundled Chromium — branded
// Chrome no longer accepts --load-extension.
//
//   node browser-extension/scripts/try-pages.mjs [--api http://localhost:3000]
//        [--click] [--out results.json] [--save-captures dir] <url> [<url> ...]

import { chromium } from "playwright";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const extDir = join(here, "..");
const EXT_ID = "odbdhmcfjbhikmlfmgafbkkbknkkaecp"; // derived from manifest.json "key"
const captureSrc = readFileSync(join(extDir, "capture.js"), "utf8");
const version = JSON.parse(readFileSync(join(extDir, "manifest.json"), "utf8")).version;

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const value = (name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);
const api = value("--api", "http://localhost:3000");
const outFile = value("--out", null);
const saveDir = value("--save-captures", null);
// Screenshot /check?product=<id> — the extension's "Open full explanation" — per page.
const shotsDir = value("--shots", null);
const urls = args.filter((a, i) => /^https?:\/\//.test(a) && args[i - 1] !== "--api");
if (!urls.length) {
  console.error("usage: node try-pages.mjs [--api URL] [--click] [--out file] [--save-captures dir] <url>...");
  process.exit(1);
}

const profile = mkdtempSync(join(tmpdir(), "fp-ext-"));
const context = await chromium.launchPersistentContext(profile, {
  headless: false, // extensions and the retailers' bot gates both need a real window
  viewport: { width: 1366, height: 900 },
  args: [`--disable-extensions-except=${extDir}`, `--load-extension=${extDir}`],
});

const results = [];
try {
  // A Fit Passport session for this browser, and a fixed test profile on it.
  const site = await context.newPage();
  await site.goto(api + "/", { waitUntil: "domcontentloaded" });
  const profileSet = await site.evaluate(async () => {
    const r = await fetch("/api/profile", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sex: "male", chestCm: 100, waistCm: 86, shoulderCm: 46, preferredFit: "regular", region: "US" }),
    });
    return r.status;
  });

  // The extension's own page: requests from here are the popup's requests.
  const ext = await context.newPage();
  await ext.goto(`chrome-extension://${EXT_ID}/popup.html`);

  for (const url of urls) {
    const row = { url, capturedAt: new Date().toISOString() };
    const page = await context.newPage();
    try {
      const resp = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
      row.httpStatus = resp?.status() ?? null;
      await page.waitForTimeout(7000); // PDPs hydrate well after DOMContentLoaded
      row.title = await page.title();

      const before = await page.evaluate(`${captureSrc}\n;fpCapture(document, location)`);
      row.beforeClick = before.ok ? { tables: before.found.sizeTables, rows: before.found.sizeRows } : { error: before.error };

      let cap = before;
      if (flag("--click")) {
        // Press the page's own size-guide control — a button that opens a modal,
        // never a link that leaves the product page (Nike's footer "Size Charts"
        // link navigated to a help page on the first run, and the capture then
        // read the wrong page). Buttons first; links only if they stay on this page.
        row.clicked = await page.evaluate(() => {
          const RE = /size (guide|chart)|size & fit|fit guide|size info|find your size/i;
          const here = location.pathname;
          const stays = (a) => {
            const href = a.getAttribute("href") || "";
            if (!href || href.startsWith("#") || href.startsWith("javascript:")) return true;
            try { return new URL(href, location.href).pathname === here; } catch { return false; }
          };
          const all = [...document.querySelectorAll("button,[role=button],a")].filter((e) => RE.test(e.textContent || ""));
          const el = all.find((e) => e.tagName !== "A") || all.find((e) => e.tagName === "A" && stays(e));
          if (!el) return null;
          el.click();
          return (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 40);
        });
        if (row.clicked) {
          await page.waitForTimeout(5000);
          if (new URL(page.url()).pathname !== new URL(url).pathname) {
            row.navigatedTo = page.url(); // the control left the page; keep the pre-click capture
          } else {
            cap = await page.evaluate(`${captureSrc}\n;fpCapture(document, location)`);
          }
        }
      }

      if (!cap.ok) {
        row.capture = { ok: false, error: cap.error, stats: cap.stats };
      } else {
        row.capture = { ok: true, url: cap.url, found: cap.found, stats: cap.stats };
        if (saveDir) {
          mkdirSync(saveDir, { recursive: true });
          const name = new URL(url).hostname.replace(/^www\./, "").split(".")[0] + "-" + results.length + ".capture.json";
          writeFileSync(join(saveDir, name), JSON.stringify({ url: cap.url, capturedAt: row.capturedAt, extensionVersion: version, loggedIn: false, html: cap.html, stats: cap.stats }, null, 2));
          row.savedAs = name;
        }
        const answer = await ext.evaluate(
          async ({ api, url, html, version }) => {
            const r = await fetch(api + "/api/check", {
              method: "POST",
              credentials: "include",
              headers: { "content-type": "application/json", "x-fp-client": "extension/" + version },
              body: JSON.stringify({ url, html }),
            });
            let body = null;
            try { body = await r.json(); } catch { /* not json */ }
            return { status: r.status, body };
          },
          { api, url: cap.url, html: cap.html, version },
        );
        row.api = { status: answer.status };
        const b = answer.body || {};
        if (answer.status === 200) {
          row.api.best = b.result?.best?.label ?? null;
          row.api.confidence = b.result?.best?.confidence ?? null;
          row.api.verdict = b.result?.best?.verdict ?? null;
          row.api.undetermined = !!b.result?.undetermined;
          row.api.ranked = (b.result?.ranked ?? []).map((r) => `${r.label}:${r.score.toFixed(3)}${r.verdict ? "/" + r.verdict : ""}`);
          row.api.sizes = (b.product?.sizeOptions ?? []).map((s) => ({
            label: s.label, chestCm: s.chestCm, waistCm: s.waistCm, bodyChestMinCm: s.bodyChestMinCm, bodyChestMaxCm: s.bodyChestMaxCm,
          }));
          const s = b.source || {};
          row.api.source = { sizesFrom: s.sizesFrom, fetch: s.fetch, extractedBy: s.extractedBy, measurementKind: s.measurementKind, measurementKindFrom: s.measurementKindFrom };
          row.api.product = { id: b.product?.id, brand: b.product?.brand, name: b.product?.productName, category: b.product?.category };
          if (shotsDir && b.product?.id) {
            mkdirSync(shotsDir, { recursive: true });
            await site.goto(`${api}/check?product=${encodeURIComponent(b.product.id)}`, { waitUntil: "networkidle" });
            await site.waitForTimeout(1500);
            row.resultShot = join(shotsDir, `result-${results.length}.png`);
            await site.screenshot({ path: row.resultShot, fullPage: true });
          }
        } else {
          row.api.error = b.error ?? null;
          row.api.message = b.message ?? null;
        }
      }
    } catch (e) {
      row.failure = String(e?.message || e).slice(0, 200);
    } finally {
      await page.close();
    }
    results.push(row);
    const c = row.capture?.stats;
    console.log(
      `\n${url}\n  page ${row.httpStatus ?? "-"} · "${(row.title || "").slice(0, 60)}"` +
        (row.clicked !== undefined ? ` · clicked: ${row.clicked ?? "no size-guide control"}` : "") +
        (c ? `\n  capture: ${c.tablesKept}/${c.tablesSeen} tables · ${c.payloadChars} of ${c.domChars} chars (${(100 * (1 - c.payloadChars / c.domChars)).toFixed(1)}% smaller) · ${c.ms} ms · masked ${c.masked}` : "") +
        (row.api ? `\n  api ${row.api.status}: ` + (row.api.status === 200
          ? `${row.api.undetermined ? "undetermined" : row.api.best + " @ " + Math.round(row.api.confidence * 100) + "%"} · ${JSON.stringify(row.api.source)}`
          : `${row.api.error} — ${row.api.message ?? ""}`) : "") +
        (row.failure ? `\n  failed: ${row.failure}` : ""),
    );
  }
  if (outFile) {
    writeFileSync(outFile, JSON.stringify({ api, extensionVersion: version, profileSet, runAt: new Date().toISOString(), results }, null, 2));
    console.log(`\nwrote ${outFile}`);
  }
} finally {
  await context.close();
}
