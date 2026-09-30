// Types derived from the English messages, so a missing or misspelled key in
// either language — or at a call site — is a compile error, not a blank on screen.

import type { en } from "./messages/en";

type Widen<T> = { [K in keyof T]: T[K] extends string ? string : Widen<T[K]> };

/** Every language's messages have exactly the English shape. */
export type Messages = Widen<typeof en>;
export type Namespace = keyof Messages;

/** Dotted paths to every string under T. */
export type Leaves<T, P extends string = ""> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>;
}[keyof T & string];

/** Dotted paths to every { one, other } pair under T — the counted messages. */
export type PluralBases<T, P extends string = ""> = {
  [K in keyof T & string]: T[K] extends string
    ? never
    : T[K] extends { one: string; other: string }
      ? `${P}${K}`
      : PluralBases<T[K], `${P}${K}.`>;
}[keyof T & string];

export type KeyIn<N extends Namespace> = Leaves<Messages[N]>;
export type PluralIn<N extends Namespace> = PluralBases<Messages[N]>;
