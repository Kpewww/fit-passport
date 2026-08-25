// Mobile layout audit — measures real problems at a real phone viewport instead
// of grepping for suspicious class names.
//
// WHY IT EXISTS: `body` carries `overflow-x-clip` (deliberately — the oversized
// display type on the homepage must never make the page scroll sideways). That
// means a layout bug does NOT show up as a horizontal scrollbar; the content is
// silently CLIPPED and becomes unreachable. On 2026-08-25 the community outfit
// card was 402px wide inside a 390px viewport and its Report button simply could
// not be tapped. Nothing surfaced it, because nothing scrolled.
//
// So this measures element rectangles rather than document scroll width.
//
// Usage:  node scripts/mobile-audit.mjs            (needs the app running)
//         BASE=https://fit-passport.vercel.app node scripts/mobile-audit.mjs
//         PAGES=/,/check node scripts/mobile-audit.mjs
//
// Needs playwright, which is NOT a project dependency (it would add ~100MB to
// every install for a tool used occasionally):  npx playwright install chromium
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3000";
// iPhone 13/14 logical viewport. 390 is the common narrow case; 360 (Android) is
// checked too because it is where layouts usually break first.
const VIEWPORTS = [
  { name: "iPhone 390", width: 390, height: 844 },
  { name: "Android 360", width: 360, height: 800 },
];
const PAGES = process.env.PAGES
  ? process.env.PAGES.split(",")
  : ["/", "/check", "/closet", "/passport", "/community", "/badges", "/refresh", "/outfits", "/help", "/login", "/account", "/history", "/onboarding"];

const audit = () => {
  const vw = document.documentElement.clientWidth;
  const out = { vw, scrollW: document.documentElement.scrollWidth, overflow: [], small: [], tiny: [] };

  const label = (el) => {
    const cls = (el.getAttribute("class") || "").split(/\s+/).slice(0, 6).join(" ");
    const txt = (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 40);
    return `${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""}${cls ? " ." + cls.replace(/\s+/g, ".") : ""}${txt ? ` — "${txt}"` : ""}`;
  };

  for (const el of document.querySelectorAll("body *")) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    const style = getComputedStyle(el);
    if (style.visibility === "hidden" || style.display === "none") continue;

    // Overflows the viewport horizontally. Ignore elements that are themselves
    // inside a scroll container, since that scrolling is intentional.
    if (r.right > vw + 1 || r.left < -1) {
      let p = el.parentElement, contained = false;
      while (p && p !== document.body) {
        const ps = getComputedStyle(p);
        if (ps.overflowX === "auto" || ps.overflowX === "scroll" || ps.overflowX === "hidden") { contained = true; break; }
        p = p.parentElement;
      }
      if (!contained) out.overflow.push({ el: label(el), left: Math.round(r.left), right: Math.round(r.right), w: Math.round(r.width) });
    }

    // Tap targets. WCAG 2.5.8 asks 24px minimum; Apple/Material guidance is 44/48.
    const tappable = el.matches("a,button,input,select,textarea,[role=button],[role=radio],[role=slider]");
    if (tappable && r.width > 0 && r.height > 0 && (r.height < 44 || r.width < 24)) {
      out.small.push({ el: label(el), w: Math.round(r.width), h: Math.round(r.height) });
    }

    // Text too small to read comfortably on a phone.
    if (el.children.length === 0 && (el.textContent || "").trim()) {
      const fs = parseFloat(style.fontSize);
      if (fs && fs < 12) out.tiny.push({ el: label(el), px: fs });
    }
  }
  // De-duplicate by label so one repeated component doesn't drown the report.
  const dedupe = (arr) => {
    const seen = new Map();
    for (const x of arr) { const k = x.el.split(" — ")[0]; if (!seen.has(k)) seen.set(k, { ...x, count: 1 }); else seen.get(k).count++; }
    return [...seen.values()];
  };
  out.overflow = dedupe(out.overflow);
  out.small = dedupe(out.small);
  out.tiny = dedupe(out.tiny);
  return out;
};

const browser = await chromium.launch();
for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  });
  console.log(`\n${"=".repeat(70)}\n  ${vp.name}  (${vp.width}x${vp.height})\n${"=".repeat(70)}`);
  for (const path of PAGES) {
    const page = await ctx.newPage();
    try {
      await page.goto(BASE + path, { waitUntil: "networkidle", timeout: 25000 });
      await page.waitForTimeout(400);
      const r = await page.evaluate(audit);
      const sideways = r.scrollW - r.vw;
      const flag = sideways > 1 ? `❌ 横向溢出 +${sideways}px` : "✅ 无横向滚动";
      console.log(`\n── ${path}   ${flag}`);
      if (r.overflow.length) {
        console.log(`   溢出元素 (${r.overflow.length}):`);
        for (const o of r.overflow.slice(0, 6)) console.log(`     · right=${o.right} w=${o.w}  ${o.el}${o.count > 1 ? ` [x${o.count}]` : ""}`);
      }
      if (r.small.length) {
        console.log(`   触控目标 <44px 高 (${r.small.length}):`);
        for (const s of r.small.slice(0, 5)) console.log(`     · ${s.w}x${s.h}  ${s.el}${s.count > 1 ? ` [x${s.count}]` : ""}`);
      }
      if (r.tiny.length) {
        console.log(`   字号 <12px (${r.tiny.length}): ${r.tiny.slice(0, 3).map((t) => `${t.px}px`).join(", ")}`);
      }
    } catch (e) {
      console.log(`\n── ${path}   ⚠️ ${e.message.split("\n")[0]}`);
    }
    await page.close();
  }
  await ctx.close();
}
await browser.close();
