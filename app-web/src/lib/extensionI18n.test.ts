// @vitest-environment jsdom
//
// The popup's two languages (browser-extension/i18n.js) — Session 79. The same
// rules as the site's messages (src/i18n/i18n.test.ts), for the one part of the
// product that has no build step to type-check it.

import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

type Dict = Record<string, string>;
type I18n = { DICTS: { en: Dict; zh: Dict }; lang: () => string; setLang: (l: string) => void; t: (k: string, p?: Record<string, unknown>) => string };

const EXT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "browser-extension");
let I18N: I18n;
beforeAll(() => {
  new Function(readFileSync(join(EXT, "i18n.js"), "utf8"))();
  I18N = (globalThis as unknown as { FP_I18N: I18n }).FP_I18N;
});
beforeEach(() => localStorage.clear());

const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join();

describe("the popup's Chinese matches its English", () => {
  it("has the same keys and the same {placeholders}", () => {
    const { en, zh } = I18N.DICTS;
    expect(Object.keys(zh).sort()).toEqual(Object.keys(en).sort());
    const off = Object.keys(en).filter((k) => placeholders(en[k]) !== placeholders(zh[k]));
    expect(off).toEqual([]);
  });

  it("is written — nothing empty, nothing left as the English", () => {
    const { en, zh } = I18N.DICTS;
    const same = Object.keys(en).filter((k) => zh[k] === en[k] && !/^\{n\} KB$/.test(en[k]));
    expect(Object.values(zh).filter((v) => !v.trim())).toEqual([]);
    expect(same).toEqual([]);
  });

  it("puts a space between Chinese and Latin letters or digits (docs/design/chinese-copy.md)", () => {
    const tight = /[一-鿿][A-Za-z0-9]|[A-Za-z0-9][一-鿿]/;
    const off = Object.entries(I18N.DICTS.zh).filter(([, v]) => tight.test(v.replace(/\{\w+\}/g, " ")));
    expect(off).toEqual([]);
  });

  it("has every key the popup asks for", () => {
    const src = readFileSync(join(EXT, "popup.js"), "utf8");
    // t("key"…), and the keys named in lookup tables that feed t().
    const used = new Set([
      ...[...src.matchAll(/\bt\(\s*"([A-Za-z]+)"/g)].map((m) => m[1]),
      ...[...src.matchAll(/:\s*"((?:refusal|reader)[A-Za-z]+)"/g)].map((m) => m[1]),
      // A ternary INSIDE a t( … ) call picks between two keys.
      ...[...src.matchAll(/\bt\([^()]*?\?\s*"([a-z][A-Za-z]+)"\s*:\s*"([a-z][A-Za-z]+)"/g)].flatMap((m) => [m[1], m[2]]),
    ]);
    const missing = [...used].filter((k) => !(k in I18N.DICTS.en));
    expect(missing).toEqual([]);
    expect(used.size).toBeGreaterThan(40); // the scan found the calls, not nothing
  });
});

describe("choosing the popup's language", () => {
  it("follows the browser until the shopper chooses, then remembers", () => {
    Object.defineProperty(navigator, "language", { value: "zh-CN", configurable: true });
    expect(I18N.lang()).toBe("zh");
    I18N.setLang("en");
    expect(I18N.lang()).toBe("en");
    Object.defineProperty(navigator, "language", { value: "en-US", configurable: true });
    localStorage.clear();
    expect(I18N.lang()).toBe("en");
  });

  it("fills values, and falls back to English for an unknown key rather than a blank", () => {
    I18N.setLang("zh");
    expect(I18N.t("confidence", { pct: 72 })).toBe("可信度 72%");
    I18N.setLang("en");
    expect(I18N.t("chart", { n: 3 })).toBe("Size chart — 3 rows");
  });
});

describe("the manifest speaks both languages", () => {
  it("names every message it uses in English and Chinese, and keeps the brand name", () => {
    const manifest = JSON.parse(readFileSync(join(EXT, "manifest.json"), "utf8"));
    const used = [...JSON.stringify(manifest).matchAll(/__MSG_(\w+)__/g)].map((m) => m[1]);
    const en = JSON.parse(readFileSync(join(EXT, "_locales", "en", "messages.json"), "utf8"));
    const zh = JSON.parse(readFileSync(join(EXT, "_locales", "zh_CN", "messages.json"), "utf8"));
    expect(manifest.default_locale).toBe("en");
    expect(manifest.name).toBe("Fit Passport");
    for (const k of used) {
      expect(en[k]?.message, k).toBeTruthy();
      expect(zh[k]?.message, k).toBeTruthy();
    }
    expect(Object.keys(zh).sort()).toEqual(Object.keys(en).sort());
  });
});
