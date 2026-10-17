// Record the live product for the demo video (Session 99): the size check with its 3D
// fit map, the closet, the 3D body. Against a local PRODUCTION build (no dev overlay):
//
//   (app-web) npx next build && npx next start -p 3100
//   node record-app.mjs
//
// The account is made up (the demo closet and an average-ish body). The size check is a
// real read: Uniqlo's product page is loaded, the extension's capture.js reads it in the
// browser, and the product is checked exactly as the extension sends it.
//
// Frames come from Chrome's screencast as high-quality JPEGs with their timestamps
// (Playwright's own video is too soft for text). The page is 1280 CSS px wide, drawn at
// 1740 × 824 device px: exactly the content area of the browser window in stage.html,
// which draws the window, the address bar and the captions around these frames. Only
// the cursor is drawn into the page. The GPU renders the 3D (ANGLE on Metal).

import { chromium } from "playwright";
import { mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";

const API = process.env.API ?? "http://localhost:3100";
const OUT = new URL("../out/video/app/", import.meta.url).pathname;
const UNIQLO = "https://www.uniqlo.com/us/en/products/E474244-000/00";
const BODY = { heightCm: 178, weightKg: 74, sex: "male", chestCm: 98, waistCm: 84, hipCm: 98, shoulderCm: 45, preferredFit: "regular", region: "US" };
const W = 1740, H = 824, CSS_W = 1280;
const captureSrc = readFileSync(new URL("../../../../browser-extension/capture.js", import.meta.url), "utf8");
const version = JSON.parse(readFileSync(new URL("../../../../browser-extension/manifest.json", import.meta.url), "utf8")).version;

// A real device scale factor (not Playwright's emulated one, which the screencast ignores):
// the page lays out at 1280 × 606 and is painted at 1740 × 824.
const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist", `--window-size=${CSS_W},${Math.round(H * CSS_W / W)}`, `--force-device-scale-factor=${W / CSS_W}`] });

// ---- 1. the account, and a real read of the product ----
const setup = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await setup.addCookies([{ name: "fp-lang", value: "en", url: API }]);
const s = await setup.newPage();
await s.goto(API + "/", { waitUntil: "domcontentloaded" });
await setup.request.post(API + "/api/demo");
const prof = (await (await setup.request.get(API + "/api/profile")).json()).profile ?? {};
await setup.request.post(API + "/api/profile", { data: { ...prof, ...BODY } });
const shop = await setup.newPage();
await shop.goto(UNIQLO, { waitUntil: "domcontentloaded", timeout: 60000 });
await shop.waitForTimeout(8000);
const cap = await shop.evaluate(`${captureSrc}\n;fpCapture(document, location)`);
if (!cap.ok) throw new Error("capture failed: " + cap.error);
const checked = await (await setup.request.post(API + "/api/check", { headers: { "x-fp-client": "extension/" + version }, data: { url: cap.url, html: cap.html } })).json();
const productId = checked.product?.id;
const best = checked.result?.best?.label ?? "M";
console.log("checked:", best, checked.result?.best?.confidence, "product", productId, "from", checked.source?.sizesFrom);
const zones = (checked.result?.ranked ?? []).find((r) => r.label === best)?.zones ?? [];
const state = await setup.storageState();
await setup.close();

// ---- 2. the recordings ----
const rec = await browser.newContext({ viewport: null, storageState: state });
await rec.addInitScript(() => {
  try {
    sessionStorage.setItem("fp-intro-seen", "1");
    sessionStorage.setItem("fp_claim_nudge_dismissed", "1");
    localStorage.setItem("fp-body3d", JSON.stringify({ kind: "real", sex: null, head: "none", tone: "form", undertone: "neutral", cup: null }));
  } catch {}
  const draw = () => {
    if (document.getElementById("__cur")) return;
    const c = document.createElement("div");
    c.id = "__cur";
    c.innerHTML = '<svg width="28" height="28" viewBox="0 0 24 24"><path d="M4 2 L4 19 L8.6 14.8 L11.6 21.4 L14.4 20.2 L11.4 13.7 L17.6 13.7 Z" fill="#17181c" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/></svg>';
    Object.assign(c.style, { position: "fixed", left: "-100px", top: "-100px", zIndex: 2147483647, pointerEvents: "none", transform: "translate(-5px,-3px)" });
    document.documentElement.appendChild(c);
    // A press: a soft cobalt ring where the cursor clicks, like the drawn scenes.
    addEventListener("mousedown", (e) => {
      const r = document.createElement("div");
      Object.assign(r.style, { position: "fixed", left: e.clientX + "px", top: e.clientY + "px", width: "14px", height: "14px", borderRadius: "50%", background: "rgba(36,56,214,0.25)", transform: "translate(-50%,-50%)", zIndex: 2147483646, pointerEvents: "none", transition: "width 420ms ease-out, height 420ms ease-out, opacity 420ms ease-out" });
      document.documentElement.appendChild(r);
      requestAnimationFrame(() => requestAnimationFrame(() => Object.assign(r.style, { width: "64px", height: "64px", opacity: "0" })));
      setTimeout(() => r.remove(), 600);
    }, true);
    addEventListener("mousemove", (e) => { c.style.left = e.clientX + "px"; c.style.top = e.clientY + "px"; }, true);
  };
  if (document.readyState === "loading") addEventListener("DOMContentLoaded", draw); else draw();
});

const timeline = {};
async function scene(name, url, fn) {
  const dir = OUT + name + "/";
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const page = await rec.newPage();
  const frames = [];
  const tl = { url, frames, captions: [] };
  const now = () => Date.now() / 1000;
  const mark = (k) => { tl[k] = now(); };
  const caption = (text) => {
    const open = tl.captions.at(-1);
    if (open && open.off == null) open.off = now();
    if (text) tl.captions.push({ text, on: now() });
  };
  await fn(page, {
    // Start the screencast once the page is ready: every frame from here on is kept.
    record: async () => {
      const cdp = await rec.newCDPSession(page);
      let n = 0;
      cdp.on("Page.screencastFrame", ({ data, metadata, sessionId }) => {
        const f = String(n++).padStart(5, "0") + ".jpg";
        writeFileSync(dir + f, Buffer.from(data, "base64"));
        frames.push({ f, t: metadata.timestamp });
        cdp.send("Page.screencastFrameAck", { sessionId }).catch(() => {});
      });
      await cdp.send("Page.startScreencast", { format: "jpeg", quality: 92, maxWidth: W, maxHeight: H, everyNthFrame: 1 });
      tl.stop = async () => { await cdp.send("Page.stopScreencast").catch(() => {}); };
    },
    mark, caption,
  });
  caption(null);
  mark("end");
  await page.waitForTimeout(300);
  await tl.stop();
  await page.close();
  delete tl.stop;
  timeline[name] = tl;
  console.log(name, frames.length, "frames,", (tl.end - tl.start).toFixed(1), "s; first frame lag", (frames[0].t - tl.start).toFixed(2));
}
const glide = async (page, x, y, ms = 700) => { await page.mouse.move(x, y, { steps: Math.max(8, Math.round(ms / 16)) }); };
const clickAt = async (page, loc, ms = 700) => {
  const b = await loc.boundingBox();
  await glide(page, b.x + b.width / 2, b.y + b.height / 2, ms);
  await page.waitForTimeout(140);
  await page.mouse.down(); await page.mouse.up();
};
const drag = async (page, x0, y, dx, ms = 1200) => {
  await glide(page, x0, y, 500);
  await page.mouse.down();
  await page.mouse.move(x0 + dx, y, { steps: Math.round(ms / 16) });
  await page.mouse.up();
};
const scrollToEl = async (page, loc, offset, smooth = true) => {
  const y = await loc.evaluate((el, o) => el.getBoundingClientRect().top + scrollY - o, offset);
  await page.evaluate(([y, smooth]) => window.scrollTo({ top: y, behavior: smooth ? "smooth" : "instant" }), [y, smooth]);
};

// The size check: the recommendation and its reasons, then the fit map across sizes.
await scene("check", "fitpassport.fit/check", async (p, { record, mark, caption }) => {
  await p.goto(`${API}/check?product=${encodeURIComponent(productId)}`, { waitUntil: "networkidle" });
  await p.waitForTimeout(1500);
  await scrollToEl(p, p.getByText("Recommended size", { exact: false }).first(), 140, false);
  await p.mouse.move(900, 470);
  await p.waitForTimeout(800);
  await record();
  await p.waitForTimeout(300);
  mark("start");
  caption("Your size, with the reasons behind it.");
  await p.waitForTimeout(2500);
  caption(null);
  await scrollToEl(p, p.getByText(/sits on you/).first(), 90);
  await p.waitForTimeout(1300);
  caption("See where each size is tight or roomy, on your own measurements.");
  for (const size of ["S", "L", best]) {
    await clickAt(p, p.getByRole("radio", { name: new RegExp(`^${size}\\b`) }).first(), 550);
    await p.waitForTimeout(1250);
  }
  const canvas = await p.locator("canvas").first().boundingBox();
  await drag(p, canvas.x + canvas.width * 0.35, canvas.y + canvas.height * 0.5, canvas.width * 0.4, 1100);
  await p.waitForTimeout(900);
});

// The closet: the pieces that already fit, and how one of them sits.
await scene("closet", "fitpassport.fit/closet", async (p, { record, mark, caption }) => {
  await p.goto(`${API}/closet`, { waitUntil: "networkidle" });
  await p.waitForTimeout(1200);
  await p.mouse.move(700, 420);
  await record();
  await p.waitForTimeout(300);
  mark("start");
  caption("It learns from the clothes that already fit you.");
  await p.waitForTimeout(700);
  const card = p.getByRole("button", { name: /^Open Uniqlo/ }).first();
  await scrollToEl(p, card, 120);
  await p.waitForTimeout(900);
  await clickAt(p, card, 500);
  await p.waitForTimeout(600);
  const edit = p.getByRole("button", { name: /^Edit$/ }).filter({ visible: true }).last();
  await edit.evaluate((el) => el.scrollIntoView({ block: "center", behavior: "smooth" }));
  await p.waitForTimeout(700);
  await clickAt(p, edit, 450);
  await p.waitForTimeout(350);
  await p.getByText("How does it sit on you?").first().evaluate((el) => el.scrollIntoView({ block: "start", behavior: "smooth" }));
  await p.waitForTimeout(800);
  await clickAt(p, p.getByRole("radio", { name: "A bit roomy" }), 550);
  await p.waitForTimeout(1300);
});

// The 3D body: that size's fit on a body fitted to the passport.
await scene("body", "fitpassport.fit/body", async (p, { record, mark, caption }) => {
  const v = { "too small": "xs", snug: "s", "true to size": "t", relaxed: "r", "too big": "xb" };
  const z = zones.map((zn) => `${zn.key}.${v[zn.verdict]}.${Math.round(zn.deltaCm * 10) / 10}`).join(",");
  await p.goto(`${API}/body?size=${best}&item=${encodeURIComponent("Uniqlo AIRism Cotton T-Shirt")}&z=${z}`, { waitUntil: "networkidle" });
  await p.waitForTimeout(5000);
  const canvas = p.locator("canvas").first();
  await scrollToEl(p, canvas, 76, false);
  await p.waitForTimeout(500);
  const b = await canvas.boundingBox();
  await p.mouse.move(b.x + b.width * 0.8, b.y + b.height * 0.3);
  await record();
  await p.waitForTimeout(300);
  mark("start");
  caption("A 3D fit view based on your measurements.");
  await drag(p, b.x + b.width * 0.3, b.y + b.height * 0.5, b.width * 0.45, 1400);
  await p.waitForTimeout(500);
  await clickAt(p, p.getByRole("radio", { name: "Skin tone 3", exact: true }), 800);
  await p.waitForTimeout(1200);
  await drag(p, b.x + b.width * 0.65, b.y + b.height * 0.5, -b.width * 0.35, 1200);
  await p.waitForTimeout(800);
});

await rec.close();
await browser.close();
writeFileSync(OUT + "timeline.json", JSON.stringify(timeline, null, 1));
console.log("timeline in", OUT);
