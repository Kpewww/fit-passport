// The closet's first four pieces in two columns, for the poster (Session 99).
import { seededContext } from "./capture.mjs";
const BASE = "http://localhost:3000";
const OUT = new URL("./out/shots/", import.meta.url).pathname;
const { ctx, p } = await seededContext({ width: 700, height: 1000 }, 3);
await p.goto(BASE + "/closet", { waitUntil: "networkidle" });
await p.waitForTimeout(1500);
await p.evaluate(() => { for (const el of document.querySelectorAll("body *")) { const cs = getComputedStyle(el); if (cs.position === "fixed" && !el.closest("header") && el.getBoundingClientRect().top > 100) el.style.display = "none"; } });
const box = await p.evaluate(() => {
  const names = ["Uniqlo", "Everlane", "COS"];
  const cards = [...document.querySelectorAll("main li, main [role=listitem], main a, main button")].filter((e) => e.getBoundingClientRect().height > 250 && e.getBoundingClientRect().width > 150);
  const rs = cards.slice(0, 4).map((e) => e.getBoundingClientRect());
  const x0 = Math.min(...rs.map((r) => r.left)), y0 = Math.min(...rs.map((r) => r.top)), x1 = Math.max(...rs.map((r) => r.right)), y1 = Math.max(...rs.map((r) => r.bottom));
  return { x: x0 - 8 + scrollX, y: y0 - 8 + scrollY, width: x1 - x0 + 16, height: y1 - y0 + 60 };
});
await p.screenshot({ path: OUT + "closet-2x2.png", clip: box, fullPage: true });
await ctx.close();
process.exit(0);
