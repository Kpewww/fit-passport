// Render the demo video (Session 99).
//
//   node record-app.mjs            → first: the live product's frames, ../out/video/app/
//   node render-stage.mjs stills   → a few key frames per scene, to check the layout
//   node render-stage.mjs          → ../out/Fit-Passport-Demo.mp4 and a cover picture
//
// Each frame calls window.render(scene, t) (or renderApp for the recorded product) in
// stage.html and screenshots it: no real-time capture, so nothing stutters and the text
// stays sharp. Frames go straight into ffmpeg (FFMPEG, else ffmpeg on the PATH), one
// H.264 file per scene, joined at the end.

import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const here = new URL(".", import.meta.url).pathname;
const out = new URL("../out/video/", import.meta.url).pathname;
const final = new URL("../out/", import.meta.url).pathname;
const FFMPEG = process.env.FFMPEG ?? "ffmpeg";
const FPS = 30;
const ORDER = ["title", "problem", "extension", "app", "end"];

// The recorded product: segments (check, closet, body) laid end to end.
const ease = (x) => { x = Math.max(0, Math.min(1, x)); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const timeline = JSON.parse(readFileSync(out + "app/timeline.json", "utf8"));
const segs = Object.entries(timeline).map(([name, s]) => ({ name, ...s, dur: s.end - s.start }));
const frameAt = (s, T) => {
  let lo = 0, hi = s.frames.length - 1;
  while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (s.frames[mid].t <= T) lo = mid; else hi = mid - 1; }
  return `${out}app/${s.name}/${s.frames[lo].f}`;
};
const XFADE = 0.3;
function appSpec(t) {
  let acc = 0;
  for (let k = 0; k < segs.length; k++) {
    const s = segs[k];
    if (t < acc + s.dur || k === segs.length - 1) {
      const lt = t - acc;
      const spec = { url: s.url, a: frameAt(s, s.start + lt), b: null, bo: 0 };
      if (k > 0 && lt < XFADE) { const p = segs[k - 1]; spec.b = frameAt(p, p.end); spec.bo = 1 - ease(lt / XFADE); }
      spec.caps = s.captions.map((c) => {
        const on = c.on - s.start, off = c.off - s.start;
        return { text: c.text, o: Math.min(ease((lt - on) / 0.4), 1 - ease((lt - (off - 0.35)) / 0.35)) };
      });
      return spec;
    }
    acc += s.dur;
  }
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto("file://" + here + "stage.html", { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
const durations = { ...(await page.evaluate(() => window.DURATIONS)), app: segs.reduce((a, s) => a + s.dur, 0) };
const draw = async (scene, t) => {
  if (scene === "app") await page.evaluate((spec) => window.renderApp(spec), appSpec(t));
  else await page.evaluate(([s, t]) => window.render(s, t), [scene, t]);
};

if (process.argv[2] === "stills") {
  mkdirSync(out + "stills", { recursive: true });
  const at = { title: [2], problem: [1.0, 2.2, 4.2], extension: [1.2, 3.5, 5.9, 8.5], app: [0.15, 1.5, 6, 9, 12.95, 13.05, 17, 22, 25, 28.5], end: [3] };
  for (const [scene, ts] of Object.entries(at)) {
    for (const t of ts) {
      await draw(scene, t);
      await page.screenshot({ path: `${out}stills/${scene}-${t}.png` });
    }
  }
} else {
  mkdirSync(out + "scenes", { recursive: true });
  for (const scene of ORDER) {
    const n = Math.round(durations[scene] * FPS);
    const ff = spawn(FFMPEG, ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "png", "-i", "-",
      "-c:v", "libx264", "-preset", "slow", "-crf", "14", "-pix_fmt", "yuv420p", "-r", String(FPS), `${out}scenes/${scene}.mp4`], { stdio: ["pipe", "inherit", "inherit"] });
    for (let i = 0; i < n; i++) {
      await draw(scene, i / FPS);
      const buf = await page.screenshot({ type: "png" });
      if (!ff.stdin.write(buf)) await once(ff.stdin, "drain");
    }
    ff.stdin.end();
    await once(ff, "close");
    console.log(scene, n, "frames", (n / FPS).toFixed(2), "s");
  }
  // The cover: the title card once it has settled.
  await draw("title", 2.5);
  await page.screenshot({ path: final + "Fit-Passport-Demo-cover.png" });
  writeFileSync(out + "scenes/list.txt", ORDER.map((s) => `file '${out}scenes/${s}.mp4'`).join("\n") + "\n");
  const join = spawn(FFMPEG, ["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", out + "scenes/list.txt", "-c", "copy", "-movflags", "+faststart", final + "Fit-Passport-Demo.mp4"], { stdio: "inherit" });
  await once(join, "close");
  console.log("video:", final + "Fit-Passport-Demo.mp4", Object.values(durations).reduce((a, b) => a + b, 0).toFixed(1), "s");
}
await browser.close();
