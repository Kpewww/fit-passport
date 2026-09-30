import { describe, expect, it } from "vitest";
import { cookieValue, localeFromAcceptLanguage, resolveLocale } from "./config";
import { fill, placeholders, plain, pluralKey, tagsOf, tokenize } from "./format";
import { localeFromRequest } from "./request";
import { en } from "./messages/en";
import { zh } from "./messages/zh";

/** Every leaf as [dotted key, value]. */
function leaves(tree: unknown, prefix = ""): Array<[string, string]> {
  return Object.entries(tree as Record<string, unknown>).flatMap(([k, v]) =>
    typeof v === "string" ? [[`${prefix}${k}`, v] as [string, string]] : leaves(v, `${prefix}${k}.`),
  );
}

const EN = new Map(leaves(en));
const ZH = new Map(leaves(zh));

// Strings that are the same in both languages on purpose: the brand, the
// language names as their own speakers write them, and codes.
const SAME_IN_BOTH = new Set([
  "meta.title",
  "common.zhShort",
  "common.enShort",
  "common.zhLong",
  "common.enLong",
]);

describe("the Chinese messages match the English ones", () => {
  it("have exactly the same keys", () => {
    expect([...ZH.keys()].sort()).toEqual([...EN.keys()].sort());
  });

  it("use the same {placeholders} in every message", () => {
    const off = [...EN].filter(([k, v]) => placeholders(v).join() !== placeholders(ZH.get(k) ?? "").join());
    expect(off.map(([k]) => k)).toEqual([]);
  });

  it("use the same tags in every message, so the markup at the call site still fits", () => {
    const off = [...EN].filter(([k, v]) => tagsOf(v).join() !== tagsOf(ZH.get(k) ?? "").join());
    expect(off.map(([k]) => k)).toEqual([]);
  });

  it("are all written — none empty, none left as the English text", () => {
    const empty = [...ZH].filter(([, v]) => !v.trim()).map(([k]) => k);
    const copied = [...ZH].filter(([k, v]) => !SAME_IN_BOTH.has(k) && v === EN.get(k)).map(([k]) => k);
    expect({ empty, copied }).toEqual({ empty: [], copied: [] });
  });

  it("follow the copy spec's spacing rule: a space between Chinese and Latin letters or digits", () => {
    // docs/design/chinese-copy.md. Tags and placeholders are markup, not text,
    // so they are removed first; "M" in "每个牌子的 M" is the case this guards.
    const text = (v: string) => v.replace(/<\/?\w+\/?>/g, " ").replace(/\{\w+\}/g, " ");
    const tight = /[一-鿿][A-Za-z0-9]|[A-Za-z0-9][一-鿿]/;
    const off = [...ZH].filter(([, v]) => tight.test(text(v))).map(([k, v]) => `${k}: ${v}`);
    expect(off).toEqual([]);
  });
});

describe("choosing the language", () => {
  it("follows the browser's ranked preference", () => {
    expect(localeFromAcceptLanguage("zh-CN,zh;q=0.9,en;q=0.8")).toBe("zh");
    expect(localeFromAcceptLanguage("en-US,en;q=0.9,zh-CN;q=0.8")).toBe("en");
    expect(localeFromAcceptLanguage("fr-FR,zh-TW;q=0.7,en;q=0.5")).toBe("zh");
    expect(localeFromAcceptLanguage("en;q=0.2,zh;q=0.9")).toBe("zh");
    expect(localeFromAcceptLanguage("fr,de")).toBeNull();
    expect(localeFromAcceptLanguage("")).toBeNull();
  });

  it("puts an explicit choice first: the extension's header, then the site's cookie", () => {
    expect(resolveLocale({ acceptLanguage: "zh-CN" })).toBe("zh");
    expect(resolveLocale({ cookie: "en", acceptLanguage: "zh-CN" })).toBe("en");
    expect(resolveLocale({ header: "zh", cookie: "en", acceptLanguage: "en" })).toBe("zh");
    expect(resolveLocale({ header: "xx", cookie: "yy", acceptLanguage: "fr" })).toBe("en");
  });

  it("reads the same decision off a raw request", () => {
    const req = (h: Record<string, string>) => new Request("http://x/api", { headers: h });
    expect(localeFromRequest(req({ "accept-language": "zh-CN,zh;q=0.9" }))).toBe("zh");
    expect(localeFromRequest(req({ cookie: "a=1; fp-lang=en", "accept-language": "zh-CN" }))).toBe("en");
    expect(localeFromRequest(req({ "x-fp-lang": "zh", cookie: "fp-lang=en" }))).toBe("zh");
    expect(cookieValue("a=1; fp-lang=zh; b=2", "fp-lang")).toBe("zh");
  });
});

describe("formatting a message", () => {
  it("fills values and leaves a missing one visible", () => {
    expect(fill("{a} and {b}", { a: 1 })).toBe("1 and {b}");
  });

  it("splits tags and breaks, and never turns a value into markup", () => {
    expect(tokenize("Hi <b>{name}</b><br/>there", { name: "<b>x</b>" })).toEqual([
      { kind: "text", text: "Hi " },
      { kind: "tag", tag: "b", text: "<b>x</b>" },
      { kind: "br" },
      { kind: "text", text: "there" },
    ]);
  });

  it("drops tags for plain text (aria-labels, titles, metadata)", () => {
    expect(plain("Know what fits,<br/><accent>anywhere.</accent>")).toBe("Know what fits, anywhere.");
  });

  it("picks the counted form", () => {
    expect(pluralKey("badges", 1)).toBe("badges.one");
    expect(pluralKey("badges", 0)).toBe("badges.other");
  });
});
