// Logo size test — renders the master and micro marks at real sizes, on the three
// approved grounds, and at TRUE device pixels.
//
// Why both: a mark shown at 26 CSS px on a retina screen gets 52 device pixels and
// looks fine; the same mark in a 16x16 favicon gets 16, and no display density
// rescues it. Judging small-size legibility on a 2x screenshot is how a logo ends
// up illegible in the one place it is smallest.
//
// Usage: node size-test.mjs      (needs `npx playwright install chromium`)
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const D = join(dirname(fileURLToPath(import.meta.url)), "..");
const master = readFileSync(join(D, "fit-passport-mark-master.svg"), "utf8");
const micro = readFileSync(join(D, "fit-passport-mark-micro.svg"), "utf8");
const strip = (s) => s.replace(/width="[^"]*"\s*height="[^"]*"/, "").replace('fill="none"', "");
const SIZES = [16, 20, 24, 32, 48, 128];
const GROUNDS = [
  ["White #FFFFFF", "#FFFFFF", "#171416"],
  ["Cool Porcelain #F3F3F1", "#F3F3F1", "#171416"],
  ["Ink Black #171416", "#171416", "#FFFFFF"],
];

const rows = (svg, label) =>
  `<div style="display:flex;align-items:flex-end;gap:22px;margin:10px 0">
     <div style="width:64px;font:11px monospace;opacity:.6">${label}</div>
     ${SIZES.map((px) => `<div style="text-align:center">
        <div style="width:${px}px;height:${px}px">${strip(svg)}</div>
        <div style="font:9px monospace;opacity:.5;margin-top:5px">${px}</div></div>`).join("")}
   </div>`;

const b = await chromium.launch();
for (const [name, dpr] of [["size-test-grounds.png", 3], ["size-test-device-pixels.png", 1]]) {
  const p = await (await b.newContext({ viewport: { width: 780, height: 700 }, deviceScaleFactor: dpr })).newPage();
  const body = GROUNDS.map(([g, bg, fg]) =>
    `<div style="background:${bg};color:${fg};padding:14px 18px;margin-bottom:12px;border-radius:8px">
       <div style="font:600 12px sans-serif;opacity:.75;margin-bottom:8px">${g}</div>
       ${rows(master, "MASTER")}${rows(micro, "MICRO")}
     </div>`).join("");
  await p.setContent(`<body style="margin:0;background:#e9e9e9;padding:16px;font-family:sans-serif">
    <div style="font:11px monospace;color:#555;margin-bottom:10px">deviceScaleFactor = ${dpr}${dpr === 1 ? "  (true device pixels — the favicon case)" : "  (retina)"}</div>
    ${body}</body>`);
  await p.screenshot({ path: join(D, "tests", name), fullPage: true });
  await p.close();
}
await b.close();
console.log("wrote tests/size-test-grounds.png and tests/size-test-device-pixels.png");
