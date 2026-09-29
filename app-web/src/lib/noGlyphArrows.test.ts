// No typographic arrows, ticks or carets standing in for icons.
//
// → ← ↻ ✓ ✕ ✦ ↓ ⌄ ▲ ▼ ✎ ＋ each render at a different weight and width in every
// font and platform, and none of them matches the icon set's stroke — so a
// button reading "Save →" next to one drawn with the Phosphor arrow looked like
// two products. Session 76 (R6) converted them all to components/Icon.tsx; this
// keeps the next one from arriving in a string.
//
// Comments are stripped before scanning, including JSX {/* */} comments: the
// codebase's own notes use → to explain a flow, and that is fine. ≈ – — × are
// not on the list: they are punctuation and mathematics, not icons.

import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const SRC = join(dirname(fileURLToPath(import.meta.url)), "..");
const GLYPH = /[→←↻✓✕✦↓⌄▲▼✎＋]/;

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) return files(p);
    // .tsx only: that is where anything is rendered. (lib/extractorLLM.ts writes
    // "inches → ×2.54" into a model prompt, which no one sees.)
    return /\.tsx$/.test(f) ? [p] : [];
  });
}

/** Blank out block comments (keeping line numbers) and line comments. */
export function stripComments(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
    .replace(/(^|[^:"'`\\])\/\/[^\n]*/g, (m, lead: string) => lead + " ".repeat(m.length - lead.length));
}

describe("no typographic arrows in the product", () => {
  it("strips comments but keeps code and URLs", () => {
    expect(stripComments("a /* → */ b // →\nc")).toBe("a         b     \nc");
    expect(stripComments('href="https://x.y"')).toBe('href="https://x.y"');
  });

  it("finds none in rendered code", () => {
    const offenders: string[] = [];
    for (const file of files(SRC)) {
      stripComments(readFileSync(file, "utf8")).split("\n").forEach((line, i) => {
        const hit = line.match(GLYPH);
        if (hit) offenders.push(`${relative(SRC, file)}:${i + 1}  ${hit[0]}  ${line.trim().slice(0, 90)}`);
      });
    }
    expect(offenders, `typographic glyphs found — use components/Icon.tsx:\n${offenders.join("\n")}`).toEqual([]);
  });
});
