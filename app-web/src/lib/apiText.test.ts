// The API's sentences for people (apiText.ts) — Session 79.

import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { API_ZH, say } from "./apiText";

const SRC = join(dirname(fileURLToPath(import.meta.url)), "..");
const files = (d: string): string[] =>
  readdirSync(d).flatMap((f) => {
    const p = join(d, f);
    return statSync(p).isDirectory() ? files(p) : /\.tsx?$/.test(f) ? [p] : [];
  });

describe("the API's sentences", () => {
  it("have Chinese for every sentence a route passes to say()", () => {
    const used = files(join(SRC, "app", "api")).flatMap((f) =>
      [...readFileSync(f, "utf8").matchAll(/\bsay\(\s*req\s*,\s*"((?:[^"\\]|\\.)*)"\s*\)/g)].map((m) => m[1].replace(/\\"/g, '"')),
    );
    expect(used.length).toBeGreaterThan(10); // the scan found the calls
    expect(used.filter((s) => !(s in API_ZH))).toEqual([]);
  });

  it("are Chinese in the table — no English words beyond symbols", () => {
    const leaks = Object.entries(API_ZH).filter(([, zh]) => /[A-Za-z]{2,}/.test(zh)).map(([en]) => en);
    expect(leaks).toEqual([]);
  });

  it("answer a Chinese request in Chinese and anyone else in English", () => {
    const req = (h: Record<string, string>) => new Request("http://x/api", { headers: h });
    expect(say(req({ "accept-language": "zh-CN" }), "username taken")).toBe("这个用户名已经有人用了。");
    expect(say(req({ "accept-language": "en-US" }), "username taken")).toBe("username taken");
    expect(say(req({ "x-fp-lang": "zh" }), "no such sentence")).toBe("no such sentence");
  });
});
