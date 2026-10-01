"use client";

// Display headings in Chinese drop their pause marks (founder, 2026-09-30: the
// full-width ，and 。 of a 60–128 px headline read as holes, and pushed centred
// lines off-centre). It is typography, so it lives here and not in the copy: the
// strings keep their punctuation, as every other string does, and this drops it
// only where a headline is drawn.
//
// - ，。、；：… at the end of a line are not drawn;
// - one inside a line becomes a gap, and the clauses either side wrap as wholes;
// - ？ and ！ stay — they carry meaning (选多大 才合身？); so do 「」, the device of
//   「穿」越时空, set with the font's half-width alternates (`halt`) so they do
//   not open a hole either side. A first version drew 「穿」 as a blue 穿 without
//   brackets; the founder found it worse, and the brackets came back.
// What is dropped stays in the DOM, visually hidden, for screen readers and copy.
// English is untouched.

import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { useLocale } from "@/i18n/client";

const PUNCT_RUN = /[，。、；：…]+/g;

export function Headline({ children }: { children: ReactNode }) {
  const locale = useLocale();
  return <>{locale === "zh" ? bareHeadline(children) : children}</>;
}

/** The Chinese display form of a headline's children. Exported for the test. */
export function bareHeadline(children: ReactNode): ReactNode {
  return bareList(Children.toArray(children), true, "h");
}

function isBreak(node: ReactNode): boolean {
  return isValidElement(node) && node.type === "br";
}

function bareList(nodes: ReactNode[], endsLine: boolean, key: string): ReactNode[] {
  return nodes.flatMap((node, i) => {
    const next = nodes[i + 1];
    const atLineEnd = next === undefined ? endsLine : isBreak(next);
    if (typeof node === "string") return bareText(node, atLineEnd, `${key}.${i}`);
    if (isValidElement(node)) {
      const el = node as ReactElement<{ children?: ReactNode }>;
      if (el.props.children == null) return [node];
      return [cloneElement(el, { key: `${key}.${i}` }, ...bareList(Children.toArray(el.props.children), atLineEnd, `${key}.${i}`))];
    }
    return [node];
  });
}

function hidden(text: string, key: string): ReactNode {
  return <span key={key} className="sr-only">{text}</span>;
}

function bareText(text: string, atLineEnd: boolean, key: string): ReactNode[] {
  // Split into clauses at punctuation; remember what separated them.
  const clauses: { text: string; after: string }[] = [];
  let last = 0;
  for (const m of text.matchAll(PUNCT_RUN)) {
    clauses.push({ text: text.slice(last, m.index), after: m[0] });
    last = (m.index ?? 0) + m[0].length;
  }
  clauses.push({ text: text.slice(last), after: "" });

  const out: ReactNode[] = [];
  const several = clauses.filter((c) => c.text).length > 1;
  clauses.forEach((c, i) => {
    const k = `${key}.${i}`;
    if (c.text) {
      const body = withBrackets(c.text, k);
      if (several) out.push(<span key={k} className="inline-block">{body}</span>);
      else out.push(...body);
    }
    if (!c.after) return;
    out.push(hidden(c.after, `${k}.p`));
    const endOfText = i === clauses.length - 2 && !clauses[clauses.length - 1].text;
    // The gap is a space, widened: where the line breaks it collapses like any
    // space, so the next line never starts indented (an empty inline-block did,
    // on the store screenshots).
    if (!(endOfText && atLineEnd)) out.push(<span key={`${k}.g`} className="[word-spacing:0.25em]"> </span>);
  });
  return out;
}

function withBrackets(text: string, key: string): ReactNode[] {
  return text.split(/([「」])/).filter(Boolean).map((part, i) =>
    part === "「" || part === "」" ? <span key={`${key}.b${i}`} className="cjk-halt">{part}</span> : part,
  );
}
