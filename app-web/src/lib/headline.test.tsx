// Chinese display headings carry no punctuation (founder, 2026-09-30) — drawn by
// components/Headline.tsx, not removed from the copy. Two things are checked: what
// the Chinese form draws, and that every translated serif headline goes through it.
import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { bareHeadline } from "@/components/Headline";

// What a sighted reader sees: the markup minus the visually hidden spans.
function drawn(node: React.ReactNode): string {
  return renderToStaticMarkup(<>{node}</>)
    .replace(/<span class="sr-only">[^<]*<\/span>/g, "")
    .replace(/<span class="\[word-spacing:0\.25em\]"> <\/span>/g, "␣")
    .replace(/<br\/>/g, "/")
    .replace(/<[^>]+>/g, "");
}

describe("the Chinese form of a display headline", () => {
  it("draws no punctuation at a line's end, and keeps it for screen readers", () => {
    const node = bareHeadline(["开启你的", <br key="b" />, <span key="a" className="text-brand">合身护照。</span>]);
    expect(drawn(node)).toBe("开启你的/合身护照");
    expect(renderToStaticMarkup(<>{node}</>)).toContain('<span class="sr-only">。</span>');
  });

  it("turns a pause inside a line into a gap, keeps each clause whole, and keeps the question mark", () => {
    // The founder's correction: 选多大 才合身？ — a question keeps its mark.
    const html = renderToStaticMarkup(<>{bareHeadline("选多大，才合身？")}</>);
    expect(drawn(bareHeadline("选多大，才合身？"))).toBe("选多大␣才合身？");
    expect(html).toContain('<span class="inline-block">选多大</span>');
  });

  it("keeps 「穿」 in its brackets, set half-width", () => {
    // A first version drew a blue 穿 without brackets; the founder found it worse.
    const node = bareHeadline(["「穿」越时空，", <br key="b" />, "合身随行。"]);
    expect(drawn(node)).toBe("「穿」越时空/合身随行");
    expect(renderToStaticMarkup(<>{node}</>)).toContain('<span class="cjk-halt">「</span>穿<span class="cjk-halt">」</span>');
  });

  it("puts a gap after a clause that ends just before an element on the same line", () => {
    expect(drawn(bareHeadline(["合身无界，", <span key="a">自在随行。</span>]))).toBe("合身无界␣自在随行");
  });

  it("leaves a headline without punctuation as it was", () => {
    expect(drawn(bareHeadline("风格榜"))).toBe("风格榜");
  });
});

describe("every translated serif headline is drawn by Headline", () => {
  const APP = join(__dirname, "..", "app");
  const files: string[] = [];
  (function walk(dir: string) {
    for (const f of readdirSync(dir)) {
      const p = join(dir, f);
      if (statSync(p).isDirectory()) walk(p);
      else if (f.endsWith(".tsx")) files.push(p);
    }
  })(APP);

  it("finds the headlines it guards", () => {
    expect(files.length).toBeGreaterThan(20);
  });

  it.each(files.map((f) => [f.slice(APP.length + 1)]))("%s", (rel) => {
    const src = readFileSync(join(APP, rel), "utf8");
    // A serif h1, or a display-size serif h2, whose content is a message.
    const RE = /<(h1|h2) className=(?:"([^"]*)"|\{`([^`]*)`\})[^>]*>([\s\S]*?)<\/\1>/g;
    for (const m of src.matchAll(RE)) {
      const cls = m[2] ?? m[3] ?? "";
      const body = m[4];
      const display = /font-serif/.test(cls) && (m[1] === "h1" || /text-(4xl|5xl|6xl|7xl|8xl|display)/.test(cls));
      if (!display || !/\bt(\.rich)?\(/.test(body)) continue;
      expect(body, `${rel}: ${m[0].slice(0, 90)}`).toContain("<Headline>");
    }
  });
});
