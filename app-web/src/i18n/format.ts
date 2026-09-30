// Turning a message and its values into text — no dependency, no React.
//
// A message is a plain string, so it can travel from the server to the browser
// as data. Three things may appear in it:
//   • {name}            a value, filled in at the call site;
//   • <b>…</b> and the other tags in RICH_TAGS, which the caller maps to elements
//     (so a translation can move the bold word, and the markup stays in code);
//   • <br/>             a line break.
// Tags do not nest. That is a limit on purpose: a message that needs nesting is
// two messages.
//
// Plurals: English needs them and Chinese does not, so a counted message is two
// keys, `…one` and `…other`, and `pluralKey` picks one. Chinese simply writes the
// same text twice. Checked by i18n.test.ts, like every other key.

export type Params = Record<string, string | number>;

/** Tags a message may use. Anything else stays literal text. */
export const RICH_TAGS = ["b", "strong", "em", "i", "code", "link", "link2", "accent"] as const;
export type RichTag = (typeof RICH_TAGS)[number];

export type Token =
  | { kind: "text"; text: string }
  | { kind: "tag"; tag: RichTag; text: string }
  | { kind: "br" };

const PLACEHOLDER = /\{(\w+)\}/g;

/** Fill {name} placeholders. A missing value is left visible, so it gets noticed. */
export function fill(template: string, params?: Params): string {
  if (!params) return template;
  return template.replace(PLACEHOLDER, (m, k: string) => (k in params ? String(params[k]) : m));
}

/** The placeholder names a message uses, sorted — for the parity test. */
export function placeholders(template: string): string[] {
  return [...new Set([...template.matchAll(PLACEHOLDER)].map((m) => m[1]))].sort();
}

const TOKEN = new RegExp(`<(${RICH_TAGS.join("|")})>([\\s\\S]*?)</\\1>|<br\\s*/?>`, "g");

/**
 * Split a message into text, tagged runs and breaks. Values are filled in AFTER
 * splitting, so a value that happens to contain "<b>" (a product name, say) is
 * shown as text and never becomes markup.
 */
export function tokenize(template: string, params?: Params): Token[] {
  const out: Token[] = [];
  let last = 0;
  for (const m of template.matchAll(TOKEN)) {
    if (m.index! > last) out.push({ kind: "text", text: fill(template.slice(last, m.index), params) });
    if (m[1]) out.push({ kind: "tag", tag: m[1] as RichTag, text: fill(m[2], params) });
    else out.push({ kind: "br" });
    last = m.index! + m[0].length;
  }
  if (last < template.length) out.push({ kind: "text", text: fill(template.slice(last), params) });
  return out;
}

/** The rich tags a message uses, sorted — for the parity test. */
export function tagsOf(template: string): string[] {
  return [...template.matchAll(TOKEN)].map((m) => m[1] ?? "br").sort();
}

/** The same message with its tags dropped — for aria-labels, titles and metadata. */
export function plain(template: string, params?: Params): string {
  return tokenize(template, params)
    .map((t) => (t.kind === "br" ? " " : t.text))
    .join("");
}

/** `…one` for exactly one, `…other` otherwise. */
export function pluralKey<K extends string>(base: K, n: number): `${K}.one` | `${K}.other` {
  return n === 1 ? `${base}.one` : `${base}.other`;
}

/** Look up a dotted key in a nested message tree. */
export function lookup(tree: unknown, key: string): string | undefined {
  let node: unknown = tree;
  for (const part of key.split(".")) {
    if (node == null || typeof node !== "object") return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === "string" ? node : undefined;
}
