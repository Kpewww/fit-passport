// One line icon per garment category — the closet's thumbnails, pickers and
// outfit slots all come through here. It replaced the emoji in `garments.ts`.
//
// Phosphor (Light) has most garments. For the six it lacks — sweater, jacket,
// shorts, skirt, shoes, scarf (checked against Phosphor 2.1) —
// these are drawn to match it: the same 256-unit grid, and a 12-unit round
// stroke, which is what Phosphor's Light weight is. Drawn in the same line, they
// sit beside the library's glyphs without looking borrowed.
//
// `garmentIcon.test.ts` fails if a category in GARMENTS has no icon.

import type { ReactNode } from "react";
import { Svg } from "@/components/icons/Svg";
import * as D from "@/components/icons/garments";

type Props = { category: string | null | undefined; size?: number; className?: string; label?: string };

/** A glyph drawn in Phosphor's Light geometry: 256 grid, 12-unit round stroke. */
function Drawn({ size, className, label, children }: Omit<Props, "category"> & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 256 256"
      fill="none"
      stroke="currentColor"
      strokeWidth={12}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? "img" : undefined}
      focusable="false"
    >
      {children}
    </svg>
  );
}

const DRAWN: Record<string, ReactNode> = {
  // Knit crewneck: long sleeves, ribbed hem and cuffs.
  sweater: (
    <>
      <path d="M100,42 Q128,66 156,42" />
      <path d="M100,42 L64,54 Q42,62 38,90 L30,196 L60,200 L72,112 L72,214 L184,214 L184,112 L196,200 L226,196 L218,90 Q214,62 192,54 L156,42" />
      <path d="M72,194 L184,194" />
      <path d="M32,176 L62,180" />
      <path d="M194,180 L224,176" />
    </>
  ),
  // Coat: lapels, a front opening, two pockets.
  jacket: (
    <>
      <path d="M98,38 L62,52 Q42,60 40,86 L34,198 L62,202 L70,114 L70,226 L186,226 L186,114 L194,202 L222,198 L216,86 Q214,60 194,52 L158,38" />
      <path d="M98,38 L128,98 L158,38" />
      <path d="M128,98 L128,226" />
      <path d="M90,172 L110,172" />
      <path d="M146,172 L166,172" />
    </>
  ),
  shorts: (
    <>
      <path d="M62,48 L194,48 L210,184 L148,192 L128,114 L108,192 L46,184 Z" />
      <path d="M60,74 L196,74" />
    </>
  ),
  // A-line skirt with a waistband and two pleats.
  skirt: (
    <>
      <path d="M84,46 L172,46 L174,72 L82,72 Z" />
      <path d="M82,72 L46,206 Q128,226 210,206 L174,72" />
      <path d="M110,72 L98,214" />
      <path d="M146,72 L158,214" />
    </>
  ),
  // Loafer, side view.
  shoes: (
    <>
      <path d="M26,194 L26,108 Q26,88 46,88 L90,88 Q112,88 128,106 L166,140 Q228,144 230,176 L230,194 Z" />
      <path d="M96,120 L134,120" />
    </>
  ),
  // Scarf: a loop at the neck, two ends falling.
  scarf: (
    <>
      <path d="M64,62 Q128,100 192,62" />
      <path d="M64,62 Q58,98 84,112 Q128,130 172,112 Q198,98 192,62" />
      <path d="M104,120 L86,222 L122,222 L130,126" />
      <path d="M142,124 L156,210 L188,198 L166,116" />
    </>
  ),
};

const LIBRARY = {
  tshirt: D.TShirt,
  polo: D.TShirt,
  shirt: D.ShirtFolded,
  hoodie: D.Hoodie,
  pants: D.Pants,
  jeans: D.Pants,
  dress: D.Dress,
  sneakers: D.Sneaker,
  boots: D.Boot,
  socks: D.Sock,
  hat: D.BaseballCap,
  belt: D.Belt,
} as const;

/** Categories with a dedicated icon; everything else falls back to a hanger. */
export const GARMENT_ICON_CATEGORIES = [...Object.keys(LIBRARY), ...Object.keys(DRAWN)];

export function GarmentIcon({ category, size = 20, className, label }: Props) {
  const key = (category ?? "").toLowerCase();
  if (key in DRAWN) {
    return <Drawn size={size} className={className} label={label}>{DRAWN[key]}</Drawn>;
  }
  const data = LIBRARY[key as keyof typeof LIBRARY] ?? D.CoatHanger;
  return <Svg data={data} size={size} className={className} label={label} />;
}
