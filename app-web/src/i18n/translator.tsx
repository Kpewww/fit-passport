// The translator: one namespace of messages, three ways to read it.
//
//   t("hero.cta")                      plain text (tags dropped, values filled)
//   t.rich("steps.one", { b, link })   React nodes, the caller supplying the elements
//   t.n("badges", 3)                   the counted form, with {n} filled
//
// No hooks, so server components and client components share it; the client
// gets it through `useT` (client.tsx), the server through `getT` (server.ts).

import { Fragment, type ReactNode } from "react";
import { lookup, plain, pluralKey, tokenize, type Params, type RichTag } from "./format";
import type { KeyIn, Messages, Namespace, PluralIn } from "./types";

export type TagRenderers = Partial<Record<RichTag, (text: string) => ReactNode>>;

export type Translator<N extends Namespace> = {
  (key: KeyIn<N>, params?: Params): string;
  rich: (key: KeyIn<N>, tags: TagRenderers, params?: Params) => ReactNode;
  n: (base: PluralIn<N>, n: number, params?: Params) => string;
};

export function makeT<N extends Namespace>(messages: Messages, ns: N): Translator<N> {
  // The types make a missing key impossible; if one slips through at runtime (a
  // stale build), show the key rather than nothing, so it is seen and fixed.
  const get = (key: string) => lookup(messages[ns], key) ?? `${String(ns)}.${key}`;

  const t = ((key: KeyIn<N>, params?: Params) => plain(get(key), params)) as Translator<N>;

  t.rich = (key, tags, params) =>
    tokenize(get(key), params).map((tok, i) => {
      if (tok.kind === "br") return <br key={i} />;
      if (tok.kind === "text") return <Fragment key={i}>{tok.text}</Fragment>;
      const render = tags[tok.tag];
      return <Fragment key={i}>{render ? render(tok.text) : tok.text}</Fragment>;
    });

  t.n = (base, n, params) => plain(get(pluralKey(base, n)), { n, ...params });

  return t;
}
