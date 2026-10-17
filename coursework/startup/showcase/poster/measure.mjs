import { chromium } from "playwright";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 2304, height: 3456 } });
await p.goto("file://" + new URL(".poster.built.html", import.meta.url).pathname, { waitUntil: "networkidle" });
await p.evaluate(() => document.fonts.ready);
console.log(JSON.stringify(await p.evaluate(() => {
  const r = (q) => { const e = document.querySelector(q); const b = e.getBoundingClientRect(); return [Math.round(b.top), Math.round(b.bottom)]; };
  const secs = [...document.querySelectorAll("section")].map((s) => { const b = s.getBoundingClientRect(); return [Math.round(b.top), Math.round(b.bottom)]; });
  return { scroll: document.body.scrollHeight, header: r("header"), lede: r(".lede"), team: r(".team"), secs, sources: r(".sources"), footer: r("footer") };
})));
await b.close();
