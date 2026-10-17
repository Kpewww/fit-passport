// Product screenshots for the Nov 4 showcase poster and video (Session 99).
//
// A fresh browser is a fresh account: it is seeded with the demo closet and a
// made-up body (POST /api/demo, then /api/profile), so no real person's data is
// shown. Run against a local dev server (the same code as production):
//
//   node capture.mjs [base] [outDir]
//
// Playwright is resolved from ./node_modules (a local symlink, not committed).

import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.argv[2] ?? "http://localhost:3000";
const OUT = process.argv[3] ?? new URL("./out/shots/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

// A made-up shopper: average-ish US man. Not anyone's measurements.
const BODY = { heightCm: 178, weightKg: 74, sex: "male", chestCm: 98, waistCm: 84, hipCm: 98, shoulderCm: 45, preferredFit: "regular", region: "US" };
const UNIQLO = "https://www.uniqlo.com/us/en/products/airism-cotton-t-shirt";

const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });

export async function seededContext(viewport = { width: 1440, height: 900 }, scale = Number(process.env.SCALE ?? 2)) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: scale, reducedMotion: "reduce" });
  await ctx.addCookies([{ name: "fp-lang", value: "en", url: BASE }]);
  await ctx.addInitScript(() => { try { sessionStorage.setItem("fp-intro-seen", "1"); localStorage.setItem("fp-body3d", JSON.stringify({ kind: "real", sex: null, head: "none", tone: "form", undertone: "neutral", cup: null })); } catch {} });
  const p = await ctx.newPage();
  await p.goto(BASE + "/", { waitUntil: "networkidle" });
  await ctx.request.post(BASE + "/api/demo");
  const prof = (await (await ctx.request.get(BASE + "/api/profile")).json()).profile ?? {};
  await ctx.request.post(BASE + "/api/profile", { data: { ...prof, ...BODY } });
  return { ctx, p };
}

const hideChrome = (p) => p.addStyleTag({ content: "[data-fp-toast],[role=status].fixed{display:none!important} .fp-claim-nudge{display:none!important}" }).catch(() => {});

if (import.meta.url === `file://${process.argv[1]}`) {
  const { ctx, p } = await seededContext();
  // 1. The size check on a real product (Uniqlo's chart, read through the extension).
  await p.goto(`${BASE}/check?url=${encodeURIComponent(UNIQLO)}`, { waitUntil: "networkidle" });
  await p.waitForTimeout(4000);
  await hideChrome(p);
  await p.screenshot({ path: OUT + "check-full.png", fullPage: true });
  // 2. The closet.
  await p.goto(BASE + "/closet", { waitUntil: "networkidle" });
  await p.waitForTimeout(1500);
  await hideChrome(p);
  await p.screenshot({ path: OUT + "closet-full.png", fullPage: true });
  // 3. The 3D body.
  await p.goto(BASE + "/body", { waitUntil: "networkidle" });
  await p.waitForTimeout(5000);
  await hideChrome(p);
  await p.screenshot({ path: OUT + "body-full.png", fullPage: true });
  await ctx.close();
  await browser.close();
  console.log("shots in", OUT);
}
