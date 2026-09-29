// Render the extension's icons from the brand masters.
//
// Derived, never drawn: brand/README.md says everything comes from the masters,
// and the mark has measured size floors (build-state invariant ㉖) — the full
// mark stops reading below ~20 device pixels, so 16 and 32 px use the separately
// drawn favicon glyph (its 16-unit grid doubles cleanly to 32), and 48 and 128 px
// use the master. White on an ink tile, so the icon reads on light and dark
// browser toolbars alike. Rendered at deviceScaleFactor 1, because a retina
// render flatters small sizes — the trap ㉖ records.
//
// Needs playwright, which is deliberately not a project dependency (same
// arrangement as app-web/scripts/capture-chart.mjs):
//   node browser-extension/scripts/make-icons.mjs

import { chromium } from "playwright";
import { mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, "..", "..");
const out = join(here, "..", "icons");
mkdirSync(out, { recursive: true });

const INK = "#17181c"; // tailwind.config.ts ink.DEFAULT
const dataUri = (file) =>
  "data:image/svg+xml;base64," + readFileSync(join(repo, "brand", file)).toString("base64");
const glyph = dataUri("fit-passport-mark-favicon-reverse.svg");
const master = dataUri("fit-passport-mark-reverse.svg");

const icons = [
  { px: 16, src: glyph, inset: 0 }, // the glyph's own grid already carries its margin
  { px: 32, src: glyph, inset: 0 },
  { px: 48, src: master, inset: 0.17 },
  { px: 128, src: master, inset: 0.17 },
];

const browser = await chromium.launch();
try {
  for (const { px, src, inset } of icons) {
    const page = await browser.newPage({ viewport: { width: px, height: px }, deviceScaleFactor: 1 });
    const pad = Math.round(px * inset);
    await page.setContent(`<!doctype html><html><body style="margin:0;background:transparent">
      <div style="width:${px}px;height:${px}px;border-radius:${Math.round(px * 0.2)}px;background:${INK};
                  box-sizing:border-box;padding:${pad}px;display:flex;align-items:center;justify-content:center">
        <img src="${src}" style="width:100%;height:100%;object-fit:contain;display:block">
      </div></body></html>`);
    await page.waitForLoadState("load");
    await page.screenshot({ path: join(out, `icon${px}.png`), omitBackground: true, clip: { x: 0, y: 0, width: px, height: px } });
    await page.close();
    console.log(`icons/icon${px}.png`);
  }
} finally {
  await browser.close();
}
