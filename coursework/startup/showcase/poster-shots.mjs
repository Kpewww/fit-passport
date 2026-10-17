// The poster's product pictures, cut to the element (Session 99). Same made-up
// account as capture.mjs; a local dev server.
//
//   SCALE=3 node poster-shots.mjs
import { seededContext } from "./capture.mjs";

const BASE = "http://localhost:3000";
const OUT = new URL("./out/shots/", import.meta.url).pathname;
const UNIQLO = "https://www.uniqlo.com/us/en/products/airism-cotton-t-shirt";

// Floating prompts (the claim-account nudge, toasts) cover what is shot: hidden.
const hideOverlays = (p) => p.evaluate(() => {
  for (const el of document.querySelectorAll("body *")) {
    const cs = getComputedStyle(el);
    if (cs.position === "fixed" && el.tagName !== "HEADER" && !el.closest("header") && el.getBoundingClientRect().top > 100) el.style.display = "none";
  }
});
// The card around a piece of text: the nearest ancestor drawn as a card.
const cardClip = (p, text) => p.evaluate((text) => {
  const hit = [...document.querySelectorAll("main *")].find((e) => e.childElementCount === 0 && (e.textContent || "").trim() === text);
  let el = hit;
  while (el && !(getComputedStyle(el).borderRadius !== "0px" && getComputedStyle(el).backgroundColor === "rgb(255, 255, 255)" && el.getBoundingClientRect().width > 500)) el = el.parentElement;
  const r = (el ?? hit).getBoundingClientRect();
  return { x: r.x + scrollX, y: r.y + scrollY, width: r.width, height: r.height };
}, text);

const { ctx, p } = await seededContext({ width: 1440, height: 1000 }, Number(process.env.SCALE ?? 3));
// 1. The recommendation card on /check.
await p.goto(`${BASE}/check?url=${encodeURIComponent(UNIQLO)}`, { waitUntil: "networkidle" });
await p.waitForTimeout(3500);
await hideOverlays(p);
await p.screenshot({ path: OUT + "rec-card.png", clip: await cardClip(p, "Recommended size"), fullPage: true });
// 2. The realistic body wearing that size's fit: the zones /check gave for M.
await p.goto(`${BASE}/body?size=M&item=${encodeURIComponent("Uniqlo AIRism Cotton T-Shirt")}&z=chest.r.2,waist.s.-4.2`, { waitUntil: "networkidle" });
await p.waitForTimeout(6000);
const canvas = p.locator("main canvas").first();
const bb = await canvas.boundingBox();
await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2);
await p.mouse.down(); await p.mouse.move(bb.x + bb.width / 2 + 70, bb.y + bb.height / 2, { steps: 5 }); await p.mouse.up();
await p.getByRole("button", { name: "Zoom in" }).click();
await p.waitForTimeout(2500);
await hideOverlays(p);
await canvas.screenshot({ path: OUT + "body-fit.png" });
// 3. The closet's first row.
await p.goto(BASE + "/closet", { waitUntil: "networkidle" });
await p.waitForTimeout(1500);
await hideOverlays(p);
const grid = p.locator("main ul, main div.grid").filter({ hasText: "Everlane" }).first();
await grid.screenshot({ path: OUT + "closet-grid.png" });
await ctx.close();
process.exit(0);
