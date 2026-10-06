// Style words — Session 88b.
//
// "Maje sweater" is not one garment: a cropped cardigan and a crew-neck jumper from
// the same brand can sit a size apart. When the product's name and a closet piece's
// name both say what style they are, a piece of the same style is the better
// reference (fitEngine.ts scoreKnownGood, KNOWN_GOOD.styleMismatch).
//
// Only words that change how a garment sits are here — the neckline, the opening,
// the knit, the cut. Colour and material are not: a navy and a grey crew-neck from
// one brand are cut the same. A name with none of these words is neutral, never
// penalised.

export const STYLE_GROUPS: ReadonlyArray<{ key: string; words: readonly string[] }> = [
  { key: "cardigan", words: ["cardigan", "cardi", "开衫", "开襟"] },
  { key: "crew", words: ["crew neck", "crewneck", "crew-neck", "round neck", "圆领"] },
  { key: "vneck", words: ["v-neck", "v neck", "vneck", "v领"] },
  { key: "turtleneck", words: ["turtleneck", "turtle neck", "roll neck", "rollneck", "mock neck", "高领", "半高领"] },
  { key: "cable", words: ["cable", "绞花", "麻花"] },
  { key: "ribbed", words: ["ribbed", "rib-knit", "rib knit", "罗纹", "坑条"] },
  { key: "cropped", words: ["cropped", "crop", "短款"] },
  { key: "longline", words: ["longline", "long-line", "长款"] },
  { key: "oversized", words: ["oversized", "oversize", "relaxed fit", "宽松", "落肩"] },
  { key: "slim", words: ["slim fit", "slim-fit", "fitted", "修身"] },
  { key: "zip", words: ["zip", "zip-up", "half-zip", "quarter-zip", "拉链"] },
  { key: "hooded", words: ["hooded", "hoodie", "连帽"] },
  { key: "polo", words: ["polo collar", "polo neck", "polo领"] },
  { key: "vest", words: ["vest", "tank", "sleeveless", "背心", "无袖"] },
];

/** The style keys a name mentions. Latin words match whole words; Chinese, as text. */
export function styleKeys(name: string | null | undefined): Set<string> {
  const out = new Set<string>();
  if (!name) return out;
  const text = name.toLowerCase();
  for (const g of STYLE_GROUPS) {
    // A Latin word must stand alone ("cable" in "cable-knit", not in "cablecar");
    // Chinese has no spaces, so it matches as text.
    if (g.words.some((w) => (/[a-z]/.test(w) ? new RegExp(`(^|[^a-z])${w}([^a-z]|$)`).test(text) : text.includes(w)))) out.add(g.key);
  }
  return out;
}

/**
 * How a closet piece's style relates to the product's: "same" when they share a
 * style word, "different" when both name styles and share none, else "unknown".
 */
export function styleRelation(product: Set<string>, piece: Set<string>): "same" | "different" | "unknown" {
  if (product.size === 0 || piece.size === 0) return "unknown";
  for (const k of product) if (piece.has(k)) return "same";
  return "different";
}
