// No emoji in the product. Icons come from components/Icon.tsx and
// components/GarmentIcon.tsx — one line-drawn set, one weight.
//
// The founder's call (Session 76): emoji read as cheap beside the editorial
// type, and they render differently on every platform, so the same screen looked
// different on a Mac, a PC and a phone. This guard keeps them from drifting back
// in one string at a time, which is exactly how the first ~50 arrived.
//
// Scans every .ts/.tsx under src/ except tests, and ignores comment lines (the
// codebase's own comments may quote an emoji to explain a decision). Catches
// every Unicode pictographic — 👕 ⚠ ⚡ ♥ ✨ ⬇ and friends — plus ★ and ☆, which
// are not formally pictographic but render as emoji-like stars.

import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const SRC = join(dirname(fileURLToPath(import.meta.url)), "..");
// © ® ™ are formally pictographic but are typography, not emoji — allowed.
const EMOJI = /(?![©®™])\p{Extended_Pictographic}|[★☆]/u;
const COMMENT = /^\s*(\/\/|\*|\/\*|\{\/\*)/;

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) return files(p);
    return /\.tsx?$/.test(f) && !/\.test\./.test(f) ? [p] : [];
  });
}

describe("no emoji in the product", () => {
  it("finds none in any source file outside comments", () => {
    const offenders: string[] = [];
    for (const file of files(SRC)) {
      readFileSync(file, "utf8").split("\n").forEach((line, i) => {
        if (COMMENT.test(line)) return;
        const hit = line.match(EMOJI);
        if (hit) offenders.push(`${relative(SRC, file)}:${i + 1}  ${hit[0]}  ${line.trim().slice(0, 90)}`);
      });
    }
    expect(offenders, `emoji found — use components/Icon.tsx instead:\n${offenders.join("\n")}`).toEqual([]);
  });
});
