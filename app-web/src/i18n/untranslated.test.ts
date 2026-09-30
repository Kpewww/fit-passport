// No English left in the interface outside the messages — Session 79.
//
// Every sentence a person reads on the site lives in messages/en.ts and
// messages/zh.ts. This scans the pages and components for text written straight
// into JSX, and for placeholder / aria-label / title / alt / label / hint values
// written as string literals, and fails on two or more Latin words in a row: the
// shape of an English phrase someone forgot to route through t(). A single word
// ("cm", "EU", a size label) passes; so do the allowlisted strings below, which
// are names or example input, the same in both languages. /admin is internal and
// stays English.

import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const SRC = join(dirname(fileURLToPath(import.meta.url)), "..");
const files = (d: string): string[] =>
  readdirSync(d).flatMap((f) => {
    const p = join(d, f);
    return statSync(p).isDirectory() ? files(p) : f.endsWith(".tsx") ? [p] : [];
  });

const ALLOWED = new Set([
  "Fit Passport",
  // The team line in the footer: names.
  "Xiangchen Kong · Alyssa Qi · Jenny Cao · Nicolas Wang · © 2026",
  // Example input: a username, an email, an account code, a product URL.
  "alex_fits  ·  you@example.com  ·  FP-XXXX-XXXX-XXXXX",
  "alex_fits · you@example.com · FP-XXXX-XXXX-XXXXX",
  "brand.com/product/…",
  "FP-XXXX-XXXX-XXXXX",
]);

const PHRASE = /[A-Za-z]{2,}[\s,.'’-]+[A-Za-z]{2,}/;
const stripComments = (s: string) =>
  s.replace(/\{\/\*[\s\S]*?\*\/\}/g, "").replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/.*$/gm, "$1");

function englishIn(source: string): string[] {
  const s = stripComments(source);
  const found: string[] = [];
  // JSX text: between a tag's ">" and the next "<" or "{". Code that happens to
  // sit between a ">" (a generic, an arrow) and a "<" or "{" has a ";", "=",
  // quote, call or type annotation in it; prose doesn't.
  for (const m of s.matchAll(/>([^<>{}]+)[<{]/g)) {
    const text = m[1].replace(/\s+/g, " ").trim();
    if (PHRASE.test(text) && !/[;="`]|\w\(|\):/.test(text)) found.push(text);
  }
  for (const m of s.matchAll(/\b(?:placeholder|aria-label|title|alt|label|hint)=(?:"([^"]*)"|'([^']*)'|\{\s*["'`]([^"'`]*)["'`]\s*\})/g)) {
    const text = (m[1] ?? m[2] ?? m[3]).trim();
    if (PHRASE.test(text) && !text.includes("${")) found.push(text);
  }
  return found.filter((t) => !ALLOWED.has(t));
}

describe("the interface has no English outside the messages", () => {
  const ui = [...files(join(SRC, "app")), ...files(join(SRC, "components"))].filter(
    (f) => !/[\\/](admin|api)[\\/]/.test(f),
  );

  it("scans the pages and components", () => {
    expect(ui.length).toBeGreaterThan(40);
  });

  it("finds no English phrase written into a page or component", () => {
    const leaks = ui.flatMap((f) => englishIn(readFileSync(f, "utf8")).map((t) => `${relative(SRC, f)}: ${t}`));
    expect(leaks).toEqual([]);
  });

  it("catches the shapes it looks for", () => {
    expect(englishIn(`<p className="x">Not listed? Just type it</p>`)).toEqual(["Not listed? Just type it"]);
    expect(englishIn(`<input placeholder="Search your closet" />`)).toEqual(["Search your closet"]);
    expect(englishIn(`<button aria-label={"Close menu"} />`)).toEqual(["Close menu"]);
    expect(englishIn(`<p>{t("x")}</p><span>cm</span>`)).toEqual([]);
    expect(englishIn(`const [a, setA] = useState<string | null>(null);\n  const [b, setB] = useState<X>(0);`)).toEqual([]);
  });
});
