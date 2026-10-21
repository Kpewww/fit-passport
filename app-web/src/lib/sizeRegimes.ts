// Size regimes: what body a size label is cut for, by the country whose sizes it
// uses, and on what evidence (Session 101).
//
// A closet piece used to be placed on a product's sizes by its LETTER alone, so a
// Japanese XL bought in China stood beside an American XL. Here a label in a known
// regime becomes the BODY chest range it is cut for, and every range carries where it
// came from. A regime with no evidence yet answers null: it is never guessed.
//
// Evidence grades (docs/design/size-regimes-sources.md):
//   A  a national or international standard, by table or clause
//   B  a brand's own published size guide, by address and date read
//   C  a public dataset fact (the brand's country, by Wikidata QID)
// Third-party size-chart sites are never evidence: they disagree with each other (the
// same Gucci IT 48 is chest 101 cm on one and 120 cm on another, 2026-10-21).
//
// Sources read so far (grade A):
//   - GB/T 1335.1-2008 (men) and GB/T 1335.2-2008 (women), 服装号型. §3.2: 型 is the
//     body's chest girth (tops) or waist girth (bottoms), in cm, net body (§4.3).
//     §4.1.3: chest is graded in 4 cm steps, so a 型 covers ±2 cm.
//   - EN 13402-3:2017 (DIN EN 13402-3:2017-12, English translation), Annex A
//     (informative), Table A.24 (men) and Table A.25 (women): the chest/bust RANGE
//     each letter size covers. The annex calls them examples a country or company
//     may adopt (§5.3.1, A.1), so a reason built on them says "European standard
//     example", not "this brand's size".

export type Regime = "CN" | "JP" | "KR" | "US" | "UK" | "AU" | "IT" | "FR" | "EU";
export type Grade = "A" | "B" | "C";
/** `source` in English, `sourceZh` the same citation in Chinese, for a reason in either. */
export type Evidence = { grade: Grade; source: string; sourceZh: string };
export type BodyRange = { minCm: number; maxCm: number; evidence: Evidence };

/** Members of CEN (EN 13402-3 front matter, 2017), whose letter sizes the EN table describes. */
const CEN = new Set([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "MK", "FR", "DE", "GR", "HU", "IS", "IE",
  "IT", "LV", "LT", "LU", "MT", "NL", "NO", "PL", "PT", "RO", "RS", "SK", "SI", "ES", "SE", "CH",
  "TR", "GB",
]);

/** The regime a country's brands label by. Unknown countries have none. */
export function regimeForCountry(iso: string | null | undefined): Regime | null {
  if (!iso) return null;
  const c = iso.toUpperCase();
  if (c === "CN" || c === "HK" || c === "TW" || c === "MO") return "CN";
  if (c === "JP") return "JP";
  if (c === "KR") return "KR";
  if (c === "US" || c === "CA") return "US";
  if (c === "GB" || c === "IE") return "UK";
  if (c === "AU" || c === "NZ") return "AU";
  if (c === "IT") return "IT";
  if (c === "FR") return "FR";
  if (CEN.has(c)) return "EU";
  return null;
}

/** A closet piece's `region` field, as typed or chosen ("JP", "EU", "CN"…), as a regime. */
export function regimeFromField(v: string | null | undefined): Regime | null {
  if (!v) return null;
  const s = v.trim().toUpperCase();
  if (["CN", "JP", "KR", "US", "UK", "AU", "IT", "FR", "EU"].includes(s)) return s as Regime;
  if (s === "DE") return "EU";
  return regimeForCountry(s);
}

const EN_SOURCE = (table: "A.24" | "A.25"): Evidence => ({
  grade: "A",
  source: `EN 13402-3:2017, Annex A, Table ${table} (European standard example)`,
  sourceZh: `EN 13402-3:2017 附录 A 表 ${table}（欧洲标准示例）`,
});

// EN 13402-3:2017 Table A.24 (men) and A.25 (women): letter size → chest/bust range, cm.
// Read from the table's "Range" row, 2026-10-21; the two columns under each letter
// give its lower and upper bound.
const EN_MEN: Record<string, [number, number]> = {
  XXS: [70, 78], XS: [78, 86], S: [86, 94], M: [94, 102], L: [102, 110], XL: [110, 118], XXL: [118, 130], "3XL": [130, 142],
};
const EN_WOMEN: Record<string, [number, number]> = {
  XXS: [66, 74], XS: [74, 82], S: [82, 90], M: [90, 98], L: [98, 106], XL: [106, 118], XXL: [118, 130], "3XL": [130, 142],
};

/** Regimes whose letter sizes the EN 13402-3 tables describe. */
const EN_LETTER_REGIMES = new Set<Regime>(["EU", "IT", "FR", "UK"]);

function letterKey(label: string): string | null {
  const s = label.trim().toUpperCase().replace(/\s+/g, "");
  if (s === "XXXL") return "3XL";
  if (s === "2XL") return "XXL";
  return s in EN_MEN ? s : null;
}

/**
 * The body chest range a label is cut for, or null when there is no evidence for it.
 *   - A Chinese 号型 ("175/96A") reads by GB/T 1335 in any regime: it is a body
 *     measurement written on the label.
 *   - A letter size reads by EN 13402-3 for European regimes.
 *   - Anything else, nothing yet (JIS, KS and ASTM tables are not in hand; brand
 *     guides come in batches as grade B).
 */
export function bodyChestFor(
  label: string,
  regime: Regime | null,
  line: string | null | undefined,
  domain: "top" | "bottom" | string = "top",
): BodyRange | null {
  const code = label.trim().match(/^(\d{3})\s*\/\s*(\d{2,3})\s*([YABC])?$/i);
  if (code && domain === "top") {
    const height = Number(code[1]), girth = Number(code[2]);
    if (height < 140 || height > 210 || girth < 60 || girth > 140) return null;
    return {
      minCm: girth - 2,
      maxCm: girth + 2,
      evidence: {
        grade: "A",
        source: `GB/T 1335.${line === "womens" ? 2 : 1}-2008 §3.2, §4.1.3`,
        sourceZh: `GB/T 1335.${line === "womens" ? 2 : 1}-2008 第 3.2、4.1.3 条`,
      },
    };
  }
  if (!regime || !EN_LETTER_REGIMES.has(regime) || domain !== "top") return null;
  const k = letterKey(label);
  if (!k) return null;
  const womens = line === "womens";
  const [minCm, maxCm] = (womens ? EN_WOMEN : EN_MEN)[k];
  return { minCm, maxCm, evidence: EN_SOURCE(womens ? "A.25" : "A.24") };
}

export const REGIME_NAME: Record<Regime, { en: string; zh: string }> = {
  CN: { en: "Chinese", zh: "中国" },
  JP: { en: "Japanese", zh: "日本" },
  KR: { en: "Korean", zh: "韩国" },
  US: { en: "US", zh: "美国" },
  UK: { en: "UK", zh: "英国" },
  AU: { en: "Australian", zh: "澳洲" },
  IT: { en: "Italian", zh: "意大利" },
  FR: { en: "French", zh: "法国" },
  EU: { en: "European", zh: "欧洲" },
};
