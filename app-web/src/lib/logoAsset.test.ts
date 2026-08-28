// The mark's geometry exists twice: once in brand/fit-passport-mark-master.svg,
// which is the canonical artwork, and once inlined in Logo.tsx, because the app
// renders the path directly rather than fetching an SVG file.
//
// That is a reasonable trade — one fewer network request on every page, and the
// mark inherits `currentColor` — but it is exactly the shape of duplication this
// project has been bitten by before (four copies of the colour palette, and a
// schema column with no migration). Nothing about editing the SVG makes the
// component follow. So this test does.
//
// It needs no browser and no build: it reads both files and compares. If it
// fails, the fix is to re-derive the component from the SVG, never the reverse —
// the SVG is the artwork of record.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const BRAND = join(REPO, "brand");
const read = (p: string) => readFileSync(p, "utf8");

const firstPathD = (svg: string): string => {
  const m = svg.match(/<path[^>]*\sd="([^"]+)"/);
  if (!m) throw new Error("no <path d=…> found — is this SVG actually a vector?");
  return m[1];
};

describe("Logo.tsx tracks the brand master", () => {
  const master = read(join(BRAND, "fit-passport-mark-master.svg"));
  const component = read(join(REPO, "app-web", "src", "components", "Logo.tsx"));

  it("inlines the master's path exactly", () => {
    const inComponent = component.match(/const MARK_PATH = "([^"]+)"/)?.[1];
    expect(inComponent, "MARK_PATH not found in Logo.tsx").toBeTruthy();
    expect(inComponent).toBe(firstPathD(master));
  });

  it("uses the master's viewBox, so the geometry is not silently rescaled", () => {
    const vb = (s: string) => s.match(/viewBox="([^"]+)"/)?.[1];
    expect(vb(component)).toBe(vb(master));
  });

  it("keeps the micro weight's stroke in step with the micro asset", () => {
    const micro = read(join(BRAND, "fit-passport-mark-micro.svg"));
    const assetStroke = micro.match(/stroke-width="([\d.]+)"/)?.[1];
    const componentStroke = component.match(/const MICRO_STROKE = ([\d.]+)/)?.[1];
    expect(assetStroke, "micro asset has no stroke-width").toBeTruthy();
    expect(componentStroke).toBe(assetStroke);
  });

  it("still has a real vector path in every shipped mark", () => {
    // Session 55's trap: a supplied "fixed" SVG was a bitmap in a <rect> wrapper.
    // A filename proves nothing; a <path> does.
    for (const f of [
      "fit-passport-mark-master.svg",
      "fit-passport-mark-micro.svg",
      "fit-passport-mark-reverse.svg",
      "fit-passport-mark-favicon.svg",
      "fit-passport-mark-favicon-reverse.svg",
    ]) {
      const svg = read(join(BRAND, f));
      expect(svg, `${f} has no <path>`).toMatch(/<path[\s>]/);
      expect(svg, `${f} embeds a bitmap`).not.toMatch(/<image[\s>]|data:image\/(png|jpe?g)/);
    }
  });
});
