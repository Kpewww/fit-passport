// Record the mark's reveal as a video for slides — Session 89.
//
// Plays /brand/reveal frame by frame in a headless browser and encodes the frames.
// Not a screen recording: the page's clock is Playwright's fake clock, advanced
// exactly 1/fps per frame, and every layer of the reveal runs on Framer Motion's
// frame clock (see AnimatedFitPassportLogo.tsx), so each frame is the same on every
// run and no frame is dropped.
//
//   node scripts/record-logo.mjs                     both grounds, both variants
//   node scripts/record-logo.mjs --bg ink --variant hero --caption
//   node scripts/record-logo.mjs --origin https://fit-passport.vercel.app
//   node scripts/record-logo.mjs --intro                 the homepage's full-screen
//                                                        first-visit intro, landing
//                                                        on the hero (Session 90)
//   options: --size 1920x1080  --fps 60  --hold 1.2 (seconds held on the settled mark)
//
// Needs the site running (default http://localhost:3000, i.e. `npm run dev`), and
// playwright, which is NOT a project dependency:  npx playwright install chromium
//
// Encoding: with a system ffmpeg (`brew install ffmpeg`), MP4 / H.264 — what Keynote,
// PowerPoint and Google Slides play. Without one, Playwright's own bundled ffmpeg,
// which can only write WebM (VP8): fine in a browser and Google Slides, not in
// Keynote. Files go to app-web/brand-build/, which is not committed.

import { chromium } from "playwright";
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "brand-build");
const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i < 0 ? fallback : process.argv[i + 1];
};
const flag = (name) => process.argv.includes(`--${name}`);

const origin = arg("origin", "http://localhost:3000");
const [W, H] = arg("size", "1920x1080").split("x").map(Number);
const fps = Number(arg("fps", 60));
const hold = Number(arg("hold", 1.2));
const caption = flag("caption");
const grounds = arg("bg") ? [arg("bg")] : ["porcelain", "ink"];
const variants = arg("variant") ? [arg("variant")] : ["hero", "quick"];
// Must match REVEAL_TIMING in AnimatedFitPassportLogo.tsx.
const DURATION = { hero: 2.6, quick: 0.9 };
// The intro: the reveal, then the 0.55 s landing (HomeIntro.tsx).
const INTRO_DURATION = 2.6 + 0.55;
const intro = flag("intro");

function findFfmpeg() {
  if (spawnSync("ffmpeg", ["-version"]).status === 0) return { bin: "ffmpeg", mp4: true };
  const cache = process.platform === "darwin" ? join(homedir(), "Library", "Caches", "ms-playwright") : join(homedir(), ".cache", "ms-playwright");
  for (const dir of existsSync(cache) ? readdirSync(cache).filter((d) => d.startsWith("ffmpeg")) : []) {
    for (const f of readdirSync(join(cache, dir))) if (f.startsWith("ffmpeg")) return { bin: join(cache, dir, f), mp4: false };
  }
  return null;
}

const ff = findFfmpeg();
if (!ff) {
  console.error("No ffmpeg found. Install one (brew install ffmpeg), or run `npx playwright install chromium`, which brings a minimal one.");
  process.exit(1);
}
if (!ff.mp4) console.log("No system ffmpeg: writing WebM. For MP4 (Keynote / PowerPoint): brew install ffmpeg");
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const jobs = intro
  ? [{ name: `fit-passport-intro-${W}x${H}`, url: `${origin}/`, ready: ".fp-intro svg[data-fp-reveal]", seconds: INTRO_DURATION + hold }]
  : grounds.flatMap((bg) => variants.map((variant) => {
      const q = new URLSearchParams({ clean: "1", variant, bg: bg === "ink" ? "ink" : "porcelain", ...(caption ? { caption: "1" } : {}) });
      return { name: `fit-passport-reveal-${variant}-${bg}${caption ? "-caption" : ""}-${W}x${H}`, url: `${origin}/brand/reveal?${q}`, ready: "svg[data-fp-reveal]", seconds: DURATION[variant] + hold + (caption ? 0.8 : 0) };
    }));
for (const job of jobs) {
  {
    const name = `${job.name}.${ff.mp4 ? "mp4" : "webm"}`;
    const file = join(OUT, name);
    const page = await (await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 })).newPage();
    // A fake clock keeps running in real time unless paused; paused, only runFor moves it.
    await page.clock.install({ time: 0 });
    await page.clock.pauseAt(1000);
    // A fresh context is a fresh session, so the homepage plays its intro.
    await page.goto(job.url, { waitUntil: "domcontentloaded" });
    // Hydration takes real time; the fake clock stands still meanwhile, so the reveal
    // waits at its first frame.
    // Checked before each step, so the first frame recorded is the reveal's first.
    for (let i = 0; i < 200; i++) {
      if (await page.locator(job.ready).count()) break;
      await page.clock.runFor(16);
      await page.waitForTimeout(100);
    }
    if (!(await page.locator(job.ready).count())) throw new Error(`the reveal never started on ${job.url}`);

    const args = ff.mp4
      ? ["-y", "-f", "image2pipe", "-framerate", String(fps), "-c:v", "mjpeg", "-i", "pipe:0", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "14", "-preset", "slow", "-movflags", "+faststart", file]
      : ["-y", "-f", "image2pipe", "-framerate", String(fps), "-c:v", "mjpeg", "-i", "pipe:0", "-c:v", "libvpx", "-b:v", "12M", "-qmin", "0", "-qmax", "16", file];
    const enc = spawn(ff.bin, args, { stdio: ["pipe", "ignore", "pipe"] });
    let errText = "";
    enc.stderr.on("data", (d) => { errText += d; });
    const done = new Promise((res) => enc.on("close", res));

    const frames = Math.ceil(job.seconds * fps);
    for (let i = 0; i < frames; i++) {
      enc.stdin.write(await page.screenshot({ type: "jpeg", quality: 95 }));
      await page.clock.runFor(1000 / fps);
    }
    enc.stdin.end();
    const code = await done;
    await page.context().close();
    if (code !== 0) throw new Error(`ffmpeg failed for ${name}:\n${errText.slice(-800)}`);
    console.log(`wrote ${file} (${frames} frames)`);
  }
}
await browser.close();
